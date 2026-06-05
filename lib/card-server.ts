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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Server-side card lookup by user_card id. RLS scopes this to public
// (for-trade/wishlist) cards and the viewer's own cards. Returns null for
// non-UUID ids (e.g. static demo ids) so callers can fall back to seed data.
export async function fetchCardDetailById(id: string): Promise<(CollectorCard & { ownerUserId?: string }) | null> {
  if (!UUID_RE.test(id)) return null;
  const supabase = await createSupabaseServerClient();
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
      cards ( name, set_name, card_number, rarity, type, generation, image_url )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as unknown as {
    id: string;
    user_id: string;
    condition: string | null;
    language: string | null;
    edition: string | null;
    is_holo: boolean | null;
    status: CollectorCard["status"];
    verification_status: CollectorCard["verificationStatus"];
    proof_url: string | null;
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
  if (!row.cards) return null;

  return {
    id: row.id,
    ownerUserId: row.user_id,
    name: row.cards.name,
    setName: row.cards.set_name,
    cardNumber: row.cards.card_number,
    rarity: row.cards.rarity,
    type: normalizeType(row.cards.type),
    generation: row.cards.generation ?? "",
    condition: row.condition ?? "Near Mint",
    language: row.language ?? "English",
    edition: row.edition ?? "Standard",
    isHolo: Boolean(row.is_holo),
    status: row.status,
    verificationStatus: row.verification_status,
    estimatedValue: row.estimated_value === null ? "—" : `$${row.estimated_value}`,
    owner: "Collector",
    imageUrl: row.cards.image_url ?? "",
    proofUrl: row.proof_url ?? undefined
  };
}
