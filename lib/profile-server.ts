import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CardType, CollectorCard } from "@/lib/data";

const CARD_TYPES: CardType[] = [
  "Fire",
  "Water",
  "Grass",
  "Lightning",
  "Psychic",
  "Fighting",
  "Darkness",
  "Metal",
  "Dragon",
  "Fairy",
  "Colorless"
];

function normalizeType(type: string | null | undefined): CardType {
  return CARD_TYPES.find((t) => t.toLowerCase() === (type ?? "").toLowerCase()) ?? "Colorless";
}

export type ProfileData = {
  reputation: number;
  collectorLevel: number;
  completedTrades: number;
  verifiedCards: number;
  publicCards: CollectorCard[];
  tradeHistory: { type: string; points: string; reason: string }[];
};

type CardJoin = {
  id: string;
  status: CollectorCard["status"];
  verification_status: CollectorCard["verificationStatus"];
  estimated_value: number | null;
  cards: {
    name: string;
    set_name: string;
    card_number: string;
    rarity: string;
    type: string;
    generation: string | null;
    image_url: string | null;
  } | null;
};

// Real, RLS-scoped profile data for the signed-in collector.
export async function fetchProfileData(userId: string): Promise<ProfileData | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const [profileRes, completedRes, verifiedRes, cardsRes, repRes] = await Promise.all([
    supabase.from("users").select("reputation_score, collector_level").eq("id", userId).maybeSingle(),
    supabase
      .from("trades")
      .select("*", { count: "exact", head: true })
      .or(`proposer_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq("status", "completed"),
    supabase
      .from("user_cards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("verification_status", ["verified", "wallet_verified"]),
    supabase
      .from("user_cards")
      .select(
        "id, status, verification_status, estimated_value, cards ( name, set_name, card_number, rarity, type, generation, image_url )"
      )
      .eq("user_id", userId)
      .in("status", ["for_trade", "wishlist"])
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.from("reputation_events").select("type, points, reason").eq("user_id", userId).order("created_at", { ascending: false }).limit(4)
  ]);

  const publicCards = ((cardsRes.data ?? []) as unknown as CardJoin[]).flatMap((row) => {
    if (!row.cards) return [];
    return [
      {
        id: row.id,
        name: row.cards.name,
        setName: row.cards.set_name,
        cardNumber: row.cards.card_number,
        rarity: row.cards.rarity,
        type: normalizeType(row.cards.type),
        generation: row.cards.generation ?? "",
        condition: "Near Mint",
        language: "English",
        edition: "",
        isHolo: false,
        status: row.status,
        verificationStatus: row.verification_status,
        estimatedValue: row.estimated_value === null ? "—" : `$${row.estimated_value}`,
        owner: "You",
        imageUrl: row.cards.image_url ?? ""
      } satisfies CollectorCard
    ];
  });

  const tradeHistory = ((repRes.data ?? []) as { type: string; points: number; reason: string }[]).map((e) => ({
    type: e.type,
    points: e.points >= 0 ? `+${e.points}` : `${e.points}`,
    reason: e.reason
  }));

  return {
    reputation: profileRes.data?.reputation_score ?? 0,
    collectorLevel: profileRes.data?.collector_level ?? 1,
    completedTrades: completedRes.count ?? 0,
    verifiedCards: verifiedRes.count ?? 0,
    publicCards,
    tradeHistory
  };
}
