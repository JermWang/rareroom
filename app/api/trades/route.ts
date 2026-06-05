import { NextRequest, NextResponse } from "next/server";
import type { CardStatus, VerificationStatus } from "@/lib/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isTradeGradeVerification } from "@/lib/trusted-verification";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

type CreateTradeBody = {
  proposerCardIds?: string[];
  receiverCardIds?: string[];
  receiverUserId?: string;
  note?: string;
};

export async function POST(req: NextRequest) {
  let body: CreateTradeBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const proposerCardIds = Array.isArray(body.proposerCardIds) ? body.proposerCardIds.slice(0, 20) : [];
  const receiverCardIds = Array.isArray(body.receiverCardIds) ? body.receiverCardIds.slice(0, 20) : [];
  if (!body.receiverUserId) {
    return NextResponse.json({ error: "Missing receiver." }, { status: 400 });
  }
  if (proposerCardIds.length === 0) {
    return NextResponse.json({ error: "Add at least one card to your offer." }, { status: 400 });
  }
  if (receiverCardIds.length === 0) {
    return NextResponse.json({ error: "Select at least one card you want in return." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to send a trade." }, { status: 401 });
  }
  if (body.receiverUserId === user.id) {
    return NextResponse.json({ error: "Choose another collector for this trade." }, { status: 400 });
  }

  if (!(await rateLimit(rateLimitKey(req, "trades", user.id), 12, 60))) {
    return NextResponse.json({ error: "Too many trade attempts. Please wait a moment." }, { status: 429 });
  }

  const allCardIds = [...proposerCardIds, ...receiverCardIds];
  if (new Set(allCardIds).size !== allCardIds.length) {
    return NextResponse.json({ error: "A card can only appear once in a trade." }, { status: 400 });
  }

  const { data: tradeCards, error: cardError } = await admin
    .from("user_cards")
    .select("id,user_id,status,verification_status,trade_eligible")
    .in("id", allCardIds);

  if (cardError || !tradeCards || tradeCards.length !== allCardIds.length) {
    return NextResponse.json({ error: "Could not validate every card in this offer." }, { status: 400 });
  }

  const rows = tradeCards as Array<{
    id: string;
    user_id: string;
    status: CardStatus;
    verification_status: VerificationStatus;
    trade_eligible: boolean;
  }>;
  const cardsById = new Map(rows.map((row) => [row.id, row]));

  const invalidProposerCard = proposerCardIds.some((id) => {
    const row = cardsById.get(id);
    return !row || row.user_id !== user.id || !row.trade_eligible || !isTradeGradeVerification(row.verification_status);
  });
  if (invalidProposerCard) {
    return NextResponse.json({ error: "Every card you offer must be trusted-source verified before a trade can be sent." }, { status: 400 });
  }

  const invalidReceiverCard = receiverCardIds.some((id) => {
    const row = cardsById.get(id);
    return (
      !row ||
      row.user_id !== body.receiverUserId ||
      row.status !== "for_trade" ||
      !row.trade_eligible ||
      !isTradeGradeVerification(row.verification_status)
    );
  });
  if (invalidReceiverCard) {
    return NextResponse.json({ error: "Requested cards must be listed for trade and backed by trusted source validation." }, { status: 400 });
  }

  // Create the trade, its items, and the optional note atomically (single
  // transaction inside the RPC), with ownership/eligibility re-checked there.
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 4000) : "";
  const { data: tradeId, error: rpcError } = await admin.rpc("create_trade_atomic", {
    p_proposer_id: user.id,
    p_receiver_id: body.receiverUserId,
    p_proposer_card_ids: proposerCardIds,
    p_receiver_card_ids: receiverCardIds,
    p_note: note || null
  });

  if (rpcError || !tradeId) {
    return NextResponse.json({ error: rpcError?.message ?? "Failed to create trade." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, tradeId });
}
