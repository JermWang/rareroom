// Lightweight TCGdex client (https://tcgdex.dev) — free, no key, covers the
// main TCG plus Pokémon TCG Pocket (the `tcgp` series). Used for live card
// search + autocomplete in the importer. Falls back gracefully on failure.

const API = "https://api.tcgdex.net/v2/en";

export type TcgdexBrief = {
  id: string;
  name: string;
  localId: string;
  image: string;
};

// TCGdex serves images as `{base}/{quality}.{ext}` (the API returns only the base).
export function tcgdexImage(base: string, quality: "low" | "high" = "high", ext: "png" | "webp" = "png") {
  return `${base}/${quality}.${ext}`;
}

let pocketSetIds: Set<string> | null = null;

async function getPocketSetIds(): Promise<Set<string>> {
  if (pocketSetIds) return pocketSetIds;
  try {
    const res = await fetch(`${API}/series/tcgp`);
    const data = await res.json();
    pocketSetIds = new Set<string>((data.sets ?? []).map((s: { id: string }) => s.id));
  } catch {
    pocketSetIds = new Set<string>();
  }
  return pocketSetIds;
}

// Card ids look like "A1-001", "swsh3-136", "P-A-1" → set id is everything before the last dash.
function setIdFromCardId(cardId: string): string {
  const idx = cardId.lastIndexOf("-");
  return idx === -1 ? cardId : cardId.slice(0, idx);
}

export async function searchCards(name: string, opts: { pocket?: boolean; limit?: number } = {}): Promise<TcgdexBrief[]> {
  const q = name.trim();
  if (!q) return [];
  try {
    const res = await fetch(`${API}/cards?name=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    let list: { id: string; name: string; localId: string; image?: string }[] = await res.json();
    list = list.filter((c) => Boolean(c.image));
    if (opts.pocket) {
      const pocket = await getPocketSetIds();
      list = list.filter((c) => pocket.has(setIdFromCardId(c.id)));
    }
    return list.slice(0, opts.limit ?? 24).map((c) => ({
      id: c.id,
      name: c.name,
      localId: c.localId,
      image: tcgdexImage(c.image as string)
    }));
  } catch {
    return [];
  }
}

export type TcgdexCard = {
  id: string;
  name: string;
  localId: string;
  image?: string;
  rarity?: string;
  set?: { id: string; name: string; cardCount?: { official?: number; total?: number } };
};

export async function getCard(id: string): Promise<TcgdexCard | null> {
  try {
    const res = await fetch(`${API}/cards/${id}`);
    if (!res.ok) return null;
    return (await res.json()) as TcgdexCard;
  } catch {
    return null;
  }
}
