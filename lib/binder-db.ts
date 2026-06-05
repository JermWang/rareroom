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
  proof_url: string | null;
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
      proof_url,
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
      proofUrl: row.proof_url ?? undefined,
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

  const res = await fetch("/api/binder/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cards })
  });
  const json = await res.json();
  if (!res.ok) {
    return { saved: false, count: 0, reason: json.error ?? "Could not save cards to your online binder." };
  }
  return { saved: true, count: json.count ?? 0 };
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
      proof_url,
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
    .eq("trade_eligible", true)
    .in("verification_status", ["verified", "wallet_verified"])
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
      proofUrl: row.proof_url ?? undefined,
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
      proof_url,
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
    proofUrl: row.proof_url ?? undefined,
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

  const res = await fetch("/api/trades", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts)
  });
  const json = await res.json();
  if (!res.ok) return { ok: false, reason: json.error ?? "Failed to create trade." };
  return { ok: true, tradeId: json.tradeId };
}

export async function updateUserCardStatus(userCardId: string, status: CardStatus): Promise<boolean> {
  const res = await fetch("/api/user-cards/status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userCardId, status })
  });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    console.warn("Failed to update card status", userCardId, json?.error ?? res.statusText);
    return false;
  }
  return true;
}

export type TradeRequest = {
  id: string;
  direction: "incoming" | "outgoing";
  status: string;
  collector: string;
  cardName: string;
  value: string;
};

// The signed-in collector's incoming + outgoing trades (RLS-scoped to participants).
export async function fetchUserTrades(): Promise<TradeRequest[] | null> {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return null;
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("trades")
    .select(
      `
      id, status, proposer_id, receiver_id, created_at,
      proposer:users!trades_proposer_id_fkey ( username ),
      receiver:users!trades_receiver_id_fkey ( username ),
      trade_items ( side, user_cards ( estimated_value, cards ( name ) ) )
    `
    )
    .or(`proposer_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) return null;

  type Row = {
    id: string;
    status: string;
    proposer_id: string;
    receiver_id: string;
    proposer: { username: string } | null;
    receiver: { username: string } | null;
    trade_items: { side: "proposer" | "receiver"; user_cards: { estimated_value: number | null; cards: { name: string } | null } | null }[] | null;
  };

  return (data as unknown as Row[]).map((t) => {
    const incoming = t.receiver_id === user.id;
    // The card the viewer would receive comes from the other party's side.
    const wantSide = incoming ? "proposer" : "receiver";
    const item = (t.trade_items ?? []).find((i) => i.side === wantSide) ?? (t.trade_items ?? [])[0];
    const value = item?.user_cards?.estimated_value;
    return {
      id: t.id,
      direction: incoming ? "incoming" : "outgoing",
      status: incoming && t.status === "sent" ? "Incoming" : t.status.charAt(0).toUpperCase() + t.status.slice(1),
      collector: (incoming ? t.proposer?.username : t.receiver?.username) ?? "Collector",
      cardName: item?.user_cards?.cards?.name ?? "Trade",
      value: value == null ? "—" : `$${value}`
    };
  });
}

function normalizeCardType(type: string): CardType {
  const allowed = new Set(["Fire", "Water", "Grass", "Lightning", "Psychic", "Fighting", "Darkness", "Metal", "Dragon", "Fairy", "Colorless"]);
  return allowed.has(type) ? (type as CardType) : "Colorless";
}
