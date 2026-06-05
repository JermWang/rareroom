import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { WalletChain, buildWalletChallengeMessage, normalizeWalletAddress } from "@/lib/wallet-challenge";

type ChallengeBody = {
  address?: string;
  chain?: WalletChain;
};

export async function POST(req: NextRequest) {
  let body: ChallengeBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.address || (body.chain !== "evm" && body.chain !== "solana")) {
    return NextResponse.json({ error: "Missing or invalid wallet fields." }, { status: 400 });
  }

  const normalizedAddress = normalizeWalletAddress(body.address, body.chain);
  if (!normalizedAddress) {
    return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) {
    return NextResponse.json({ error: "Wallet linking is not configured." }, { status: 500 });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in before linking a wallet." }, { status: 401 });
  }

  const challengeId = randomUUID();
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + 5 * 60 * 1000);
  const message = buildWalletChallengeMessage({
    userId: user.id,
    address: normalizedAddress,
    chain: body.chain,
    challengeId,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString()
  });

  const { error } = await admin.from("wallet_link_challenges").insert({
    id: challengeId,
    user_id: user.id,
    wallet_address: normalizedAddress,
    wallet_chain: body.chain,
    message,
    expires_at: expiresAt.toISOString()
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    challengeId,
    address: normalizedAddress,
    chain: body.chain,
    message,
    expiresAt: expiresAt.toISOString()
  });
}
