import { NextRequest, NextResponse } from "next/server";
import { verifyMessage } from "ethers";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Links a wallet to the signed-in user after verifying a signed challenge.
// The message binds the wallet to the user's id + a timestamp, so a signature
// can't be replayed against a different account or reused after it expires.
export async function POST(req: NextRequest) {
  let body: { address?: string; chain?: string; signature?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { address, chain, signature, message } = body;
  if (!address || !chain || !signature || !message || (chain !== "evm" && chain !== "solana")) {
    return NextResponse.json({ error: "Missing or invalid fields." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Auth is not configured." }, { status: 500 });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in before linking a wallet." }, { status: 401 });
  }

  // The signed message must bind to this exact user and address.
  if (!message.includes(`Account: ${user.id}`) || !message.includes(`Address: ${address}`)) {
    return NextResponse.json({ error: "Message does not match your session." }, { status: 400 });
  }

  // And must be recent (5 minute window).
  const issuedMatch = message.match(/Issued: (.+)$/m);
  const issuedAt = issuedMatch ? Date.parse(issuedMatch[1]) : NaN;
  if (Number.isNaN(issuedAt) || Date.now() - issuedAt > 5 * 60 * 1000) {
    return NextResponse.json({ error: "Signature expired — please try again." }, { status: 400 });
  }

  let verified = false;
  let normalizedAddress = address;
  try {
    if (chain === "evm") {
      const recovered = verifyMessage(message, signature);
      verified = recovered.toLowerCase() === address.toLowerCase();
      normalizedAddress = recovered;
    } else {
      verified = nacl.sign.detached.verify(
        new TextEncoder().encode(message),
        Buffer.from(signature, "base64"),
        bs58.decode(address)
      );
    }
  } catch {
    verified = false;
  }

  if (!verified) {
    return NextResponse.json({ error: "Signature could not be verified." }, { status: 400 });
  }

  // RLS allows a user to update only their own row (auth.uid() = id).
  const { error } = await supabase
    .from("users")
    .update({ wallet_address: normalizedAddress, wallet_chain: chain })
    .eq("id", user.id);

  if (error) {
    const message = error.code === "23505" ? "That wallet is already linked to another account." : error.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, address: normalizedAddress, chain });
}
