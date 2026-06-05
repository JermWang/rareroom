import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sanitizeProofUrl } from "@/lib/proof-url";
import { TrustedProviderId, trustedVerificationProviders } from "@/lib/trusted-verification";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

type TrustedSourceBody = {
  userCardId?: string;
  provider?: TrustedProviderId;
  externalReference?: string;
  proofUrl?: string;
  payload?: Record<string, unknown>;
};

const providerConnectionRequired: TrustedProviderId[] = [
  "tcgplayer",
  "pricecharting",
  "collectr_partner",
  "ptcg_live_partner",
  "tcg_pocket_partner",
  "wallet_signature",
  "onchain_receipt"
];

export async function POST(req: NextRequest) {
  let body: TrustedSourceBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const provider = body.provider;
  const providerConfig = provider ? trustedVerificationProviders[provider] : null;
  const externalReference = typeof body.externalReference === "string" ? body.externalReference.trim().slice(0, 500) : "";
  const proofUrl = sanitizeProofUrl(body.proofUrl);
  if (body.proofUrl && !proofUrl) {
    return NextResponse.json({ error: "Proof URL must be an internal path or HTTPS URL." }, { status: 400 });
  }

  if (!body.userCardId || !provider || !providerConfig || !externalReference) {
    return NextResponse.json({ error: "Missing card, provider, or external reference." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) {
    return NextResponse.json({ error: "Trusted verification is not configured on this deployment." }, { status: 500 });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in before validating a card." }, { status: 401 });
  }

  if (!(await rateLimit(rateLimitKey(req, "verify-source", user.id), 30, 60))) {
    return NextResponse.json({ error: "Too many verification attempts. Please slow down." }, { status: 429 });
  }

  const { data: card, error: cardError } = await admin
    .from("user_cards")
    .select("id,user_id")
    .eq("id", body.userCardId)
    .single();

  if (cardError || !card || card.user_id !== user.id) {
    return NextResponse.json({ error: "Card does not belong to your binder." }, { status: 404 });
  }

  if (providerConnectionRequired.includes(provider)) {
    const { data: connection, error: connectionError } = await admin
      .from("provider_connections")
      .select("id,status,last_verified_at")
      .eq("user_id", user.id)
      .eq("provider", provider)
      .eq("status", "verified")
      .maybeSingle();

    if (connectionError) {
      return NextResponse.json({ error: connectionError.message }, { status: 400 });
    }
    if (!connection) {
      return NextResponse.json({ error: `Connect and verify ${providerConfig.name} before approving this card for trade.` }, { status: 409 });
    }
  }

  if (provider === "wallet_signature") {
    const { data: profile } = await admin
      .from("users")
      .select("wallet_address")
      .eq("id", user.id)
      .single();
    if (!profile?.wallet_address) {
      return NextResponse.json({ error: "Link and verify a wallet before creating wallet-backed card proof." }, { status: 409 });
    }
  }

  const status = provider === "wallet_signature" || provider === "onchain_receipt" ? "wallet_verified" : "verified";
  const { data: proof, error: proofError } = await admin
    .from("verification_proofs")
    .insert({
      user_card_id: body.userCardId,
      type: providerConfig.proofType,
      proof_url: proofUrl,
      status,
      source_provider: provider,
      external_reference: externalReference,
      verification_payload: body.payload ?? {},
      confidence_score: 100,
      is_trade_grade: true,
      verified_at: new Date().toISOString()
    })
    .select("id")
    .single();

  if (proofError || !proof) {
    return NextResponse.json({ error: proofError?.message ?? "Could not save trusted verification." }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    proofId: proof.id,
    status,
    provider: providerConfig.name
  });
}
