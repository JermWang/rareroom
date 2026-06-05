import { NextRequest, NextResponse } from "next/server";
import { verifyMessage } from "ethers";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeWalletAddress } from "@/lib/wallet-challenge";

type LinkBody = {
  address?: string;
  chain?: "evm" | "solana";
  signature?: string;
  message?: string;
  challengeId?: string;
};

export async function POST(req: NextRequest) {
  let body: LinkBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { address, chain, signature, message, challengeId } = body;
  if (!address || !chain || !signature || !message || !challengeId || (chain !== "evm" && chain !== "solana")) {
    return NextResponse.json({ error: "Missing or invalid fields." }, { status: 400 });
  }

  const normalizedAddress = normalizeWalletAddress(address, chain);
  if (!normalizedAddress) {
    return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) {
    return NextResponse.json({ error: "Auth is not configured." }, { status: 500 });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in before linking a wallet." }, { status: 401 });
  }

  const { data: challenge, error: challengeError } = await admin
    .from("wallet_link_challenges")
    .select("id,user_id,wallet_address,wallet_chain,message,expires_at,used_at")
    .eq("id", challengeId)
    .single();

  if (
    challengeError ||
    !challenge ||
    challenge.user_id !== user.id ||
    challenge.wallet_address !== normalizedAddress ||
    challenge.wallet_chain !== chain ||
    challenge.message !== message
  ) {
    return NextResponse.json({ error: "Challenge does not match your session." }, { status: 400 });
  }

  if (challenge.used_at || Date.parse(challenge.expires_at) <= Date.now()) {
    return NextResponse.json({ error: "Signature challenge expired. Please try again." }, { status: 400 });
  }

  let verified = false;
  try {
    if (chain === "evm") {
      const recovered = verifyMessage(message, signature);
      verified = recovered.toLowerCase() === normalizedAddress.toLowerCase();
    } else {
      verified = nacl.sign.detached.verify(
        new TextEncoder().encode(message),
        Buffer.from(signature, "base64"),
        bs58.decode(normalizedAddress)
      );
    }
  } catch {
    verified = false;
  }

  if (!verified) {
    return NextResponse.json({ error: "Signature could not be verified." }, { status: 400 });
  }

  const { data: consumed, error: consumeError } = await admin
    .from("wallet_link_challenges")
    .update({ used_at: new Date().toISOString() })
    .eq("id", challengeId)
    .is("used_at", null)
    .select("id")
    .single();

  if (consumeError || !consumed) {
    return NextResponse.json({ error: "Signature challenge was already used." }, { status: 400 });
  }

  const { error } = await admin
    .from("users")
    .update({ wallet_address: normalizedAddress, wallet_chain: chain })
    .eq("id", user.id);

  if (error) {
    const message = error.code === "23505" ? "That wallet is already linked to another account." : error.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, address: normalizedAddress, chain });
}
