import { NextRequest, NextResponse } from "next/server";
import type { CardStatus, VerificationStatus } from "@/lib/data";
import { StoredCard } from "@/lib/import";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

const allowedStatuses = new Set<CardStatus>(["owned", "for_trade", "wishlist", "locked"]);

type ImportBody = {
  cards?: StoredCard[];
};

function cleanText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 500) : fallback;
}

export async function POST(req: NextRequest) {
  let body: ImportBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const cards = Array.isArray(body.cards) ? body.cards.slice(0, 250) : [];
  if (cards.length === 0) {
    return NextResponse.json({ error: "No cards were provided." }, { status: 400 });
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
    return NextResponse.json({ error: "Sign in to save cards to your online binder." }, { status: 401 });
  }

  if (!(await rateLimit(rateLimitKey(req, "binder-import", user.id), 10, 60))) {
    return NextResponse.json({ error: "Too many imports in a short time. Please wait a minute." }, { status: 429 });
  }

  let count = 0;

  for (const card of cards) {
    const name = cleanText(card.name);
    const setName = cleanText(card.setName, "Imported");
    const cardNumber = cleanText(card.number || card.id, "Imported");
    const imageUrl = cleanText(card.imageUrl);
    const status = allowedStatuses.has(card.status as CardStatus) ? (card.status as CardStatus) : "owned";
    if (!name || !imageUrl) continue;

    const { data: existingCard, error: selectError } = await admin
      .from("cards")
      .select("id")
      .eq("name", name)
      .eq("set_name", setName)
      .eq("card_number", cardNumber)
      .maybeSingle();

    if (selectError) continue;

    const { data: insertedCard, error: insertCardError } = existingCard
      ? { data: null, error: null }
      : await admin
          .from("cards")
          .insert({
            name,
            set_name: setName,
            card_number: cardNumber,
            rarity: cleanText(card.rarity, "Imported"),
            type: cleanText(card.type, "Colorless"),
            generation: cleanText(card.generation),
            image_url: imageUrl,
            official_metadata_source: card.id.startsWith("search-") ? "tcgdex" : "import"
          })
          .select("id")
          .single();

    const catalogCardId = existingCard?.id ?? insertedCard?.id;
    if (insertCardError || !catalogCardId) continue;

    const qty = Math.min(Math.max(Number(card.qty) || 1, 1), 99);
    const rows = Array.from({ length: qty }, () => ({
      user_id: user.id,
      card_id: catalogCardId,
      status,
      verification_status: "unverified" as VerificationStatus,
      trade_eligible: false,
      condition: "Near Mint",
      language: "English",
      edition: "Imported",
      is_holo: false
    }));

    const { error: insertError } = await admin.from("user_cards").insert(rows);
    if (!insertError) count += rows.length;
  }

  if (count === 0) {
    return NextResponse.json({ error: "No cards could be saved." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, count });
}
