// Collection import adapters: parse pasted lists or CSV exports (Collectr,
// Pokellector, pkmn.gg / PTCG Live), then match each line to our card catalog.
// No platform offers a free OAuth "read my cards" API, so import + scan is the
// realistic path — see /import for the UI.

import { CardType, CollectorCard, cards, gachaPool } from "./data";

export type ImportStatus = "owned" | "for_trade" | "wishlist";

export type ParsedRow = {
  raw: string;
  qty: number;
  name: string;
  set?: string;
  number?: string;
};

export type MatchedRow = ParsedRow & {
  key: string;
  matched: boolean;
  matchId?: string;
  matchName?: string;
  setName?: string;
  number?: string;
  rarity?: string;
  type?: CardType;
  imageUrl?: string;
  status: ImportStatus;
  source: "catalog" | "tcgdex" | "unmatched";
};

export function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type CatalogEntry = {
  id: string;
  name: string;
  setName: string;
  number: string;
  rarity: string;
  type: CardType;
  imageUrl: string;
};

// Build a de-duplicated catalog from our real local cards + gacha pool.
export const catalog: CatalogEntry[] = (() => {
  const map = new Map<string, CatalogEntry>();
  for (const c of cards) {
    const key = norm(c.name);
    if (!map.has(key)) {
      map.set(key, { id: c.id, name: c.name, setName: c.setName, number: c.cardNumber, rarity: c.rarity, type: c.type, imageUrl: c.imageUrl });
    }
  }
  for (const p of gachaPool) {
    const key = norm(p.name);
    if (!map.has(key)) {
      map.set(key, { id: `pool-${key.replace(/ /g, "-")}`, name: p.name, setName: p.setName, number: p.cardNumber, rarity: p.rarity, type: p.type, imageUrl: p.imageUrl });
    }
  }
  return [...map.values()];
})();

const catalogByNorm = new Map(catalog.map((c) => [norm(c.name), c]));

// ---- Parsing -------------------------------------------------------------

// Strip a trailing set code + number like "OBF 125", "4/102", "SV107/122".
function stripTrailingCode(name: string): { name: string; number?: string } {
  const numberMatch = name.match(/\b([A-Z]{0,3}\d+\/\d+|\d+\/\d+)\b\s*$/);
  let working = name;
  let number: string | undefined;
  if (numberMatch) {
    number = numberMatch[1];
    working = working.slice(0, numberMatch.index).trim();
  }
  // Strip a trailing set abbreviation + collector number (e.g. "OBF 125").
  working = working.replace(/\s+[A-Z]{2,4}\s+\d+$/, "").trim();
  return { name: working, number };
}

export function parsePaste(text: string): ParsedRow[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !/^#/.test(line))
    .map((raw) => {
      // Leading quantity: "3 Charizard", "3x Charizard", "x3 Charizard".
      let rest = raw;
      let qty = 1;
      const qtyMatch = rest.match(/^(?:x\s*)?(\d{1,3})\s*x?\s+(.+)$/i);
      if (qtyMatch) {
        qty = Math.min(parseInt(qtyMatch[1], 10) || 1, 99);
        rest = qtyMatch[2].trim();
      }
      // "Name - Set - Number" style.
      let set: string | undefined;
      let number: string | undefined;
      if (rest.includes(" - ")) {
        const parts = rest.split(" - ").map((p) => p.trim());
        rest = parts[0];
        set = parts[1];
        number = parts[2];
      }
      const stripped = stripTrailingCode(rest);
      return { raw, qty, name: stripped.name || rest, set, number: number ?? stripped.number };
    });
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

const NAME_KEYS = ["name", "product name", "product", "card", "card name"];
const SET_KEYS = ["set", "set name", "edition", "expansion"];
const NUMBER_KEYS = ["number", "card number", "collector number", "no", "#"];
const QTY_KEYS = ["quantity", "qty", "count", "owned", "amount"];

function findIndex(headers: string[], keys: string[]): number {
  return headers.findIndex((h) => keys.includes(h));
}

export function parseCsv(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const nameIdx = findIndex(headers, NAME_KEYS);
  // No recognizable header → treat every line as a plain pasted name.
  if (nameIdx === -1) return parsePaste(text);
  const setIdx = findIndex(headers, SET_KEYS);
  const numIdx = findIndex(headers, NUMBER_KEYS);
  const qtyIdx = findIndex(headers, QTY_KEYS);

  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    const name = (cols[nameIdx] ?? "").trim();
    const qty = qtyIdx >= 0 ? Math.min(parseInt(cols[qtyIdx], 10) || 1, 99) : 1;
    return {
      raw: line,
      qty,
      name,
      set: setIdx >= 0 ? cols[setIdx] : undefined,
      number: numIdx >= 0 ? cols[numIdx] : undefined
    };
  }).filter((r) => r.name.length > 0);
}

// ---- Matching ------------------------------------------------------------

let keySeq = 0;

export function matchLocal(row: ParsedRow): MatchedRow {
  const key = `row-${keySeq++}`;
  const n = norm(row.name);
  let hit = catalogByNorm.get(n);
  if (!hit) {
    // Loose contains match (e.g. "Charizard ex" → "Charizard").
    hit = catalog.find((c) => {
      const cn = norm(c.name);
      return cn === n || cn.startsWith(n) || n.startsWith(cn) || cn.includes(n) || n.includes(cn);
    });
  }
  if (hit) {
    return {
      ...row,
      key,
      matched: true,
      matchId: hit.id,
      matchName: hit.name,
      setName: hit.setName,
      number: row.number ?? hit.number,
      rarity: hit.rarity,
      type: hit.type,
      imageUrl: hit.imageUrl,
      status: "owned",
      source: "catalog"
    };
  }
  return { ...row, key, matched: false, status: "owned", source: "unmatched" };
}

export function matchRows(rows: ParsedRow[]): MatchedRow[] {
  return rows.map(matchLocal);
}

export type StoredCard = {
  id: string;
  name: string;
  setName: string;
  number?: string;
  imageUrl: string;
  status: ImportStatus;
  qty: number;
};

export const IMPORT_STORAGE_KEY = "rareroom.imported";
const LEGACY_STORAGE_KEYS = ["binderswap.imported"];

export function loadImported(): StoredCard[] {
  if (typeof window === "undefined") return [];
  try {
    let raw = window.localStorage.getItem(IMPORT_STORAGE_KEY);
    // Migrate from a previous app name so existing imports aren't lost.
    if (!raw) {
      for (const key of LEGACY_STORAGE_KEYS) {
        const legacy = window.localStorage.getItem(key);
        if (legacy) {
          window.localStorage.setItem(IMPORT_STORAGE_KEY, legacy);
          window.localStorage.removeItem(key);
          raw = legacy;
          break;
        }
      }
    }
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

export function saveImported(cards: StoredCard[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(IMPORT_STORAGE_KEY, JSON.stringify(cards));
}

// Adapt a saved import row into a full CollectorCard so it renders in the binder.
export function storedToCollectorCard(c: StoredCard): CollectorCard {
  return {
    id: c.id,
    name: c.name,
    setName: c.setName || "Imported",
    cardNumber: c.number || "",
    rarity: "Imported",
    type: "Colorless",
    generation: "",
    condition: "—",
    language: "English",
    edition: "Imported",
    isHolo: false,
    status: c.status,
    verificationStatus: "unverified",
    estimatedValue: "—",
    owner: "You",
    imageUrl: c.imageUrl,
    imported: true
  };
}

export function loadImportedAsCards(): CollectorCard[] {
  return loadImported().map(storedToCollectorCard);
}
