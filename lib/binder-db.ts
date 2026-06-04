import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { CardStatus, CardType, CollectorCard, VerificationStatus } from "@/lib/data";
import { StoredCard } from "@/lib/import";

type UserCardRow = {
  id: string;
  condition: string | null;
  language: string | null;
  edition: string | null;
  is_holo: boolean | null;
  status: CardStatus;
  verification_status: VerificationStatus;
  estimated_value: number | null;
  cards: {
    id: string;
    name: string;
    set_name: string;
    card_number: string;
    rarity: string;
    type: string;
    generation: string | null;
    image_url: string | null;
  } | null;
};

export async function fetchUserBinderCards(): Promise<CollectorCard[] | null> {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return null;

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_cards")
    .select(
      `
      id,
      condition,
      language,
      edition,
      is_holo,
      status,
      verification_status,
      estimated_value,
      cards (
        id,
        name,
        set_name,
        card_number,
        rarity,
        type,
        generation,
        image_url
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Failed to fetch Supabase binder", error.message);
    return null;
  }

  return ((data ?? []) as unknown as UserCardRow[]).flatMap((row) => {
    if (!row.cards) return [];
    return {
      id: row.id,
      name: row.cards.name,
      setName: row.cards.set_name,
      cardNumber: row.cards.card_number,
      rarity: row.cards.rarity,
      type: normalizeCardType(row.cards.type),
      generation: row.cards.generation ?? "",
      condition: row.condition ?? "Near Mint",
      language: row.language ?? "English",
      edition: row.edition ?? "",
      isHolo: Boolean(row.is_holo),
      status: row.status,
      verificationStatus: row.verification_status,
      estimatedValue: row.estimated_value === null ? "—" : `$${row.estimated_value}`,
      owner: "You",
      imageUrl: row.cards.image_url ?? "",
      imported: true
    } satisfies CollectorCard;
  });
}

export async function saveStoredCardsToSupabase(cards: StoredCard[]) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) {
    return { saved: false, count: 0, reason: "Supabase is not configured." };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) {
    return { saved: false, count: 0, reason: "Sign in to save cards to your online binder." };
  }

  let count = 0;

  for (const card of cards) {
    const setName = card.setName || "Imported";
    const cardNumber = card.number || card.id;

    const { data: existingCard, error: selectError } = await supabase
      .from("cards")
      .select("id")
      .eq("name", card.name)
      .eq("set_name", setName)
      .eq("card_number", cardNumber)
      .maybeSingle();

    if (selectError) {
      console.warn("Failed to look up card", card.name, selectError.message);
      continue;
    }

    const { data: insertedCard, error: insertCardError } = existingCard
      ? { data: null, error: null }
      : await supabase
      .from("cards")
      .insert(
        {
          name: card.name,
          set_name: setName,
          card_number: cardNumber,
          rarity: card.rarity || "Imported",
          type: card.type || "Colorless",
          generation: card.generation || "",
          image_url: card.imageUrl,
          official_metadata_source: card.id.startsWith("search-") ? "tcgdex" : "import"
        }
      )
      .select("id")
      .single();

    const catalogCardId = existingCard?.id ?? insertedCard?.id;
    if (insertCardError || !catalogCardId) {
      console.warn("Failed to insert card", card.name, insertCardError?.message);
      continue;
    }

    const rows = Array.from({ length: Math.max(1, card.qty) }, () => ({
      user_id: user.id,
      card_id: catalogCardId,
      status: card.status,
      verification_status: "unverified" as VerificationStatus,
      condition: "Near Mint",
      language: "English",
      edition: "Imported",
      is_holo: false
    }));

    const { error: insertError } = await supabase.from("user_cards").insert(rows);
    if (insertError) {
      console.warn("Failed to insert user cards", card.name, insertError.message);
      continue;
    }

    count += rows.length;
  }

  return { saved: count > 0, count };
}

export type MarketplaceListing = CollectorCard & { ownerUserId: string };

export async function fetchMarketplaceListings(): Promise<MarketplaceListing[] | null> {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("user_cards")
    .select(
      `
      id,
      user_id,
      condition,
      language,
      edition,
      is_holo,
      status,
      verification_status,
      estimated_value,
      cards (
        id,
        name,
        set_name,
        card_number,
        rarity,
        type,
        generation,
        image_url
      )
    `
    )
    .eq("status", "for_trade")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.warn("Failed to fetch marketplace listings", error.message);
    return null;
  }

  return ((data ?? []) as unknown as (UserCardRow & { user_id: string })[]).flatMap((row) => {
    if (!row.cards) return [];
    return {
      id: row.id,
      ownerUserId: row.user_id,
      name: row.cards.name,
      setName: row.cards.set_name,
      cardNumber: row.cards.card_number,
      rarity: row.cards.rarity,
      type: normalizeCardType(row.cards.type),
      generation: row.cards.generation ?? "",
      condition: row.condition ?? "Near Mint",
      language: row.language ?? "English",
      edition: row.edition ?? "",
      isHolo: Boolean(row.is_holo),
      status: "for_trade" as CardStatus,
      verificationStatus: row.verification_status,
      estimatedValue: row.estimated_value === null ? "—" : `$${row.estimated_value}`,
      owner: "Collector",
      imageUrl: row.cards.image_url ?? "",
      imported: true
    } satisfies MarketplaceListing;
  });
}

export async function fetchSingleUserCard(userCardId: string): Promise<(CollectorCard & { ownerUserId: string }) | null> {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("user_cards")
    .select(
      `
      id,
      user_id,
      condition,
      language,
      edition,
      is_holo,
      status,
      verification_status,
      estimated_value,
      cards (
        id,
        name,
        set_name,
        card_number,
        rarity,
        type,
        generation,
        image_url
      )
    `
    )
    .eq("id", userCardId)
    .single();

  if (error || !data || !data.cards) return null;
  const row = data as unknown as UserCardRow & { user_id: string };
  if (!row.cards) return null;
  return {
    id: row.id,
    ownerUserId: row.user_id,
    name: row.cards.name,
    setName: row.cards.set_name,
    cardNumber: row.cards.card_number,
    rarity: row.cards.rarity,
    type: normalizeCardType(row.cards.type),
    generation: row.cards.generation ?? "",
    condition: row.condition ?? "Near Mint",
    language: row.language ?? "English",
    edition: row.edition ?? "",
    isHolo: Boolean(row.is_holo),
    status: row.status,
    verificationStatus: row.verification_status,
    estimatedValue: row.estimated_value === null ? "—" : `$${row.estimated_value}`,
    owner: "Collector",
    imageUrl: row.cards.image_url ?? "",
    imported: true
  };
}

export type CreateTradeResult =
  | { ok: true; tradeId: string }
  | { ok: false; reason: string };

export async function createTrade(opts: {
  proposerCardIds: string[];
  receiverCardIds: string[];
  receiverUserId: string;
  note?: string;
}): Promise<CreateTradeResult> {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return { ok: false, reason: "Supabase is not configured." };

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return { ok: false, reason: "Sign in to send a trade." };

  if (opts.proposerCardIds.length === 0) return { ok: false, reason: "Add at least one card to your offer." };
  if (opts.receiverCardIds.length === 0) return { ok: false, reason: "Select at least one card you want in return." };

  const { data: trade, error: tradeError } = await supabase
    .from("trades")
    .insert({
      proposer_id: user.id,
      receiver_id: opts.receiverUserId,
      status: "sent",
    })
    .select("id")
    .single();

  if (tradeError || !trade) {
    return { ok: false, reason: tradeError?.message ?? "Failed to create trade." };
  }

  const items = [
    ...opts.proposerCardIds.map((id) => ({ trade_id: trade.id, user_card_id: id, side: "proposer" })),
    ...opts.receiverCardIds.map((id) => ({ trade_id: trade.id, user_card_id: id, side: "receiver" })),
  ];

  const { error: itemsError } = await supabase.from("trade_items").insert(items);
  if (itemsError) {
    return { ok: false, reason: itemsError.message };
  }

  return { ok: true, tradeId: trade.id };
}

export async function updateUserCardStatus(userCardId: string, status: CardStatus): Promise<boolean> {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("user_cards")
    .update({ status })
    .eq("id", userCardId);

  if (error) {
    console.warn("Failed to update card status", userCardId, error.message);
    return false;
  }
  return true;
}

function normalizeCardType(type: string): CardType {
  const allowed = new Set(["Fire", "Water", "Grass", "Lightning", "Psychic", "Fighting", "Darkness", "Metal", "Dragon", "Fairy", "Colorless"]);
  return allowed.has(type) ? (type as CardType) : "Colorless";
}
