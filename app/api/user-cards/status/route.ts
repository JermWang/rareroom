import { NextRequest, NextResponse } from "next/server";
import type { CardStatus } from "@/lib/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const allowedStatuses = new Set<CardStatus>(["owned", "for_trade", "wishlist", "locked"]);

export async function POST(req: NextRequest) {
  let body: { userCardId?: string; status?: CardStatus };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.userCardId || !body.status || !allowedStatuses.has(body.status)) {
    return NextResponse.json({ error: "Missing or invalid card status." }, { status: 400 });
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
    return NextResponse.json({ error: "Sign in before updating your binder." }, { status: 401 });
  }

  const { data: card, error: cardError } = await admin
    .from("user_cards")
    .select("id,user_id,trade_eligible")
    .eq("id", body.userCardId)
    .single();

  if (cardError || !card || card.user_id !== user.id) {
    return NextResponse.json({ error: "Card does not belong to your binder." }, { status: 404 });
  }

  if (body.status === "for_trade" && !card.trade_eligible) {
    return NextResponse.json({ error: "Verify this card with a trusted source before listing it for trade." }, { status: 409 });
  }

  const { error } = await admin
    .from("user_cards")
    .update({ status: body.status })
    .eq("id", body.userCardId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
