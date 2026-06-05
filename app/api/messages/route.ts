import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

async function getUserAndAdmin() {
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) return null;
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { user, admin };
}

async function assertParticipant(admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>, tradeId: string, userId: string) {
  const { data: trade, error } = await admin
    .from("trades")
    .select("id,proposer_id,receiver_id")
    .eq("id", tradeId)
    .single();

  if (error || !trade || (trade.proposer_id !== userId && trade.receiver_id !== userId)) return null;
  return trade;
}

export async function GET(req: NextRequest) {
  const tradeId = req.nextUrl.searchParams.get("tradeId");
  if (!tradeId) {
    return NextResponse.json({ error: "Missing trade id." }, { status: 400 });
  }

  const ctx = await getUserAndAdmin();
  if (!ctx) {
    return NextResponse.json({ error: "Sign in to read messages." }, { status: 401 });
  }

  const trade = await assertParticipant(ctx.admin, tradeId, ctx.user.id);
  if (!trade) {
    return NextResponse.json({ error: "Trade not found." }, { status: 404 });
  }

  const { data, error } = await ctx.admin
    .from("messages")
    .select("id,sender_id,body,created_at")
    .eq("trade_id", tradeId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    messages: (data ?? []).map((message) => ({
      id: message.id,
      sender: message.sender_id === ctx.user.id ? "You" : "Collector",
      body: message.body,
      createdAt: message.created_at
    }))
  });
}

export async function POST(req: NextRequest) {
  let body: { tradeId?: string; body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const tradeId = body.tradeId;
  const text = typeof body.body === "string" ? body.body.trim().slice(0, 4000) : "";
  if (!tradeId || !text) {
    return NextResponse.json({ error: "Missing trade id or message body." }, { status: 400 });
  }

  const ctx = await getUserAndAdmin();
  if (!ctx) {
    return NextResponse.json({ error: "Sign in to send messages." }, { status: 401 });
  }

  if (!(await rateLimit(rateLimitKey(req, "messages", ctx.user.id), 30, 60))) {
    return NextResponse.json({ error: "You're sending messages too fast. Please slow down." }, { status: 429 });
  }

  const trade = await assertParticipant(ctx.admin, tradeId, ctx.user.id);
  if (!trade) {
    return NextResponse.json({ error: "Trade not found." }, { status: 404 });
  }

  const { data, error } = await ctx.admin
    .from("messages")
    .insert({
      trade_id: tradeId,
      sender_id: ctx.user.id,
      body: text
    })
    .select("id,sender_id,body,created_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Could not save message." }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    message: {
      id: data.id,
      sender: "You",
      body: data.body,
      createdAt: data.created_at
    }
  });
}
