import {
  BadgeCheck,
  Clock,
  Flame,
  Gem,
  Heart,
  Lock,
  ShieldCheck,
  Sparkles,
  Star,
  Zap
} from "lucide-react";

export type CardStatus = "owned" | "for_trade" | "wishlist" | "locked";
export type VerificationStatus = "unverified" | "pending" | "verified" | "wallet_verified" | "disputed";

// TCG energy type — drives the glow/accent on each card frame.
export type CardType =
  | "Fire"
  | "Water"
  | "Grass"
  | "Lightning"
  | "Psychic"
  | "Fighting"
  | "Darkness"
  | "Metal"
  | "Dragon"
  | "Fairy"
  | "Colorless";

export type CollectorCard = {
  id: string;
  name: string;
  setName: string;
  cardNumber: string;
  rarity: string;
  type: CardType;
  generation: string;
  condition: string;
  language: string;
  edition: string;
  isHolo: boolean;
  status: CardStatus;
  verificationStatus: VerificationStatus;
  estimatedValue: string;
  owner: string;
  imageUrl: string;
  artist?: string;
  imported?: boolean;
};

export type Collector = {
  username: string;
  avatar: string;
  level: string;
  favorite: string;
  reputation: number;
  completedTrades: number;
  verifiedCards: number;
  badges: string[];
};

// Tailwind gradient + accent text per energy type (used for card glow rings).
export const typePalette: Record<CardType, { ring: string; glow: string }> = {
  Fire: { ring: "ring-orange-400/50", glow: "shadow-[0_10px_40px_-12px_rgba(251,146,60,0.55)]" },
  Water: { ring: "ring-sky/50", glow: "shadow-[0_10px_40px_-12px_rgba(95,184,255,0.55)]" },
  Grass: { ring: "ring-emerald-400/50", glow: "shadow-[0_10px_40px_-12px_rgba(52,211,153,0.5)]" },
  Lightning: { ring: "ring-volt/55", glow: "shadow-[0_10px_40px_-12px_rgba(255,216,77,0.55)]" },
  Psychic: { ring: "ring-fuchsia-400/50", glow: "shadow-[0_10px_40px_-12px_rgba(232,121,249,0.5)]" },
  Fighting: { ring: "ring-amber-500/50", glow: "shadow-[0_10px_40px_-12px_rgba(245,158,11,0.5)]" },
  Darkness: { ring: "ring-purple-400/50", glow: "shadow-[0_10px_40px_-12px_rgba(192,132,252,0.5)]" },
  Metal: { ring: "ring-slate-300/40", glow: "shadow-[0_10px_40px_-12px_rgba(203,213,225,0.4)]" },
  Dragon: { ring: "ring-amber-300/50", glow: "shadow-[0_10px_40px_-12px_rgba(252,211,77,0.55)]" },
  Fairy: { ring: "ring-pink-300/50", glow: "shadow-[0_10px_40px_-12px_rgba(249,168,212,0.5)]" },
  Colorless: { ring: "ring-white/25", glow: "shadow-[0_10px_40px_-12px_rgba(255,255,255,0.35)]" }
};

export const collectors: Collector[] = [
  {
    username: "MiraMint",
    avatar: "MM",
    level: "Level 24",
    favorite: "Water",
    reputation: 98,
    completedTrades: 47,
    verifiedCards: 118,
    badges: ["Verified Collector", "Rare Hunter", "Trusted Trader"]
  },
  {
    username: "KantoKei",
    avatar: "KK",
    level: "Level 19",
    favorite: "Lightning",
    reputation: 94,
    completedTrades: 31,
    verifiedCards: 74,
    badges: ["First Trade", "Set Completionist", "Gacha Puller"]
  },
  {
    username: "HoloHana",
    avatar: "HH",
    level: "Level 28",
    favorite: "Darkness",
    reputation: 99,
    completedTrades: 63,
    verifiedCards: 142,
    badges: ["Whale Binder", "Verified Collector", "Trusted Trader"]
  }
];

// Real Pokémon cards sourced from the Pokémon TCG API (pokemontcg.io).
// Images served from images.pokemontcg.io. Fan-made demo data — values are illustrative.
export const cards: CollectorCard[] = [
  {
    id: "base1-4",
    name: "Charizard",
    setName: "Base Set",
    cardNumber: "4/102",
    rarity: "Rare Holo",
    type: "Fire",
    generation: "Base",
    condition: "Near Mint",
    language: "English",
    edition: "Unlimited",
    isHolo: true,
    status: "locked",
    verificationStatus: "verified",
    estimatedValue: "$300 - $450",
    owner: "You",
    imageUrl: "https://images.pokemontcg.io/base1/4_hires.png",
    artist: "Mitsuhiro Arita"
  },
  {
    id: "swsh7-215",
    name: "Umbreon VMAX",
    setName: "Evolving Skies",
    cardNumber: "215/203",
    rarity: "Alt Art Secret",
    type: "Darkness",
    generation: "Sword & Shield",
    condition: "Mint",
    language: "English",
    edition: "Alt Art",
    isHolo: true,
    status: "for_trade",
    verificationStatus: "wallet_verified",
    estimatedValue: "$420 - $560",
    owner: "HoloHana",
    imageUrl: "https://images.pokemontcg.io/swsh7/215_hires.png",
    artist: "KEIICHIRO ITO"
  },
  {
    id: "base1-2",
    name: "Blastoise",
    setName: "Base Set",
    cardNumber: "2/102",
    rarity: "Rare Holo",
    type: "Water",
    generation: "Base",
    condition: "Near Mint",
    language: "English",
    edition: "Unlimited",
    isHolo: true,
    status: "for_trade",
    verificationStatus: "verified",
    estimatedValue: "$120 - $180",
    owner: "MiraMint",
    imageUrl: "https://images.pokemontcg.io/base1/2_hires.png",
    artist: "Ken Sugimori"
  },
  {
    id: "base1-10",
    name: "Mewtwo",
    setName: "Base Set",
    cardNumber: "10/102",
    rarity: "Rare Holo",
    type: "Psychic",
    generation: "Base",
    condition: "Mint",
    language: "English",
    edition: "Unlimited",
    isHolo: true,
    status: "owned",
    verificationStatus: "verified",
    estimatedValue: "$70 - $110",
    owner: "You",
    imageUrl: "https://images.pokemontcg.io/base1/10_hires.png",
    artist: "Ken Sugimori"
  },
  {
    id: "swsh7-218",
    name: "Rayquaza VMAX",
    setName: "Evolving Skies",
    cardNumber: "218/203",
    rarity: "Alt Art Secret",
    type: "Dragon",
    generation: "Sword & Shield",
    condition: "Mint",
    language: "English",
    edition: "Alt Art",
    isHolo: true,
    status: "owned",
    verificationStatus: "wallet_verified",
    estimatedValue: "$180 - $240",
    owner: "You",
    imageUrl: "https://images.pokemontcg.io/swsh7/218_hires.png",
    artist: "Anesaki Dynamic"
  },
  {
    id: "swsh45sv-SV107",
    name: "Charizard VMAX",
    setName: "Shining Fates",
    cardNumber: "SV107/122",
    rarity: "Shiny Vault",
    type: "Fire",
    generation: "Sword & Shield",
    condition: "Near Mint",
    language: "English",
    edition: "Shiny Vault",
    isHolo: true,
    status: "for_trade",
    verificationStatus: "verified",
    estimatedValue: "$120 - $170",
    owner: "MiraMint",
    imageUrl: "https://images.pokemontcg.io/swsh45sv/SV107_hires.png",
    artist: "aky CG Works"
  },
  {
    id: "base1-6",
    name: "Gyarados",
    setName: "Base Set",
    cardNumber: "6/102",
    rarity: "Rare Holo",
    type: "Water",
    generation: "Base",
    condition: "Light Play",
    language: "English",
    edition: "Unlimited",
    isHolo: true,
    status: "for_trade",
    verificationStatus: "pending",
    estimatedValue: "$60 - $95",
    owner: "KantoKei",
    imageUrl: "https://images.pokemontcg.io/base1/6_hires.png",
    artist: "Mitsuhiro Arita"
  },
  {
    id: "base1-58",
    name: "Pikachu",
    setName: "Base Set",
    cardNumber: "58/102",
    rarity: "Common",
    type: "Lightning",
    generation: "Base",
    condition: "Near Mint",
    language: "English",
    edition: "Unlimited",
    isHolo: false,
    status: "for_trade",
    verificationStatus: "verified",
    estimatedValue: "$25 - $40",
    owner: "You",
    imageUrl: "https://images.pokemontcg.io/base1/58_hires.png",
    artist: "Mitsuhiro Arita"
  },
  {
    id: "swsh8-271",
    name: "Gengar VMAX",
    setName: "Fusion Strike",
    cardNumber: "271/264",
    rarity: "Alt Art Secret",
    type: "Darkness",
    generation: "Sword & Shield",
    condition: "Near Mint",
    language: "English",
    edition: "Alt Art",
    isHolo: true,
    status: "wishlist",
    verificationStatus: "unverified",
    estimatedValue: "$40 - $70",
    owner: "KantoKei",
    imageUrl: "https://images.pokemontcg.io/swsh8/271_hires.png",
    artist: "sowsow"
  },
  {
    id: "base1-15",
    name: "Venusaur",
    setName: "Base Set",
    cardNumber: "15/102",
    rarity: "Rare Holo",
    type: "Grass",
    generation: "Base",
    condition: "Near Mint",
    language: "English",
    edition: "Unlimited",
    isHolo: true,
    status: "for_trade",
    verificationStatus: "verified",
    estimatedValue: "$90 - $140",
    owner: "HoloHana",
    imageUrl: "https://images.pokemontcg.io/base1/15_hires.png",
    artist: "Mitsuhiro Arita"
  },
  {
    id: "swsh12-186",
    name: "Lugia V",
    setName: "Silver Tempest",
    cardNumber: "186/195",
    rarity: "Alt Art",
    type: "Colorless",
    generation: "Sword & Shield",
    condition: "Mint",
    language: "English",
    edition: "Alt Art",
    isHolo: true,
    status: "for_trade",
    verificationStatus: "verified",
    estimatedValue: "$30 - $55",
    owner: "HoloHana",
    imageUrl: "https://images.pokemontcg.io/swsh12/186_hires.png",
    artist: "kawayoo"
  },
  {
    id: "base1-14",
    name: "Raichu",
    setName: "Base Set",
    cardNumber: "14/102",
    rarity: "Rare Holo",
    type: "Lightning",
    generation: "Base",
    condition: "Near Mint",
    language: "English",
    edition: "Unlimited",
    isHolo: true,
    status: "wishlist",
    verificationStatus: "unverified",
    estimatedValue: "$45 - $80",
    owner: "You",
    imageUrl: "https://images.pokemontcg.io/base1/14_hires.png",
    artist: "Ken Sugimori"
  }
];

export const tradeStatuses = ["Draft", "Sent", "Countered", "Accepted", "Verification pending", "Completed", "Cancelled", "Disputed"];

export const filters = ["All Cards", "For Trade", "Wishlist", "Rare", "Recently Added", "Verified"];

export const proofTypes = [
  { label: "Screenshot verified", detail: "Timestamped collection proof checked against duplicate listings.", icon: BadgeCheck },
  { label: "Receipt/import verified", detail: "Platform import, receipt, or source account history confirms ownership.", icon: ShieldCheck },
  { label: "Wallet signature proof", detail: "Optional proof receipt created with a wallet signature.", icon: Zap },
  { label: "Manual review queue", detail: "Admin review for suspicious cards, disputes, and high-value trades.", icon: Clock }
];

export const featureCards = [
  { title: "Verified Binders", copy: "Every collector gets a public binder with ownership status, trade availability, and proof badges.", icon: ShieldCheck },
  { title: "Smart Swap Builder", copy: "Build clean card-for-card or bundle trades with fairness indicators and wishlist matching.", icon: Sparkles },
  { title: "Reputation That Matters", copy: "Completed trades, verified cards, and dispute history help collectors know who to trust.", icon: Star },
  { title: "Optional Web3 Proof", copy: "Connect a wallet to sign ownership or create transparent trade receipts. Totally optional.", icon: Gem }
];

export const adminQueue = [
  { id: "q1", title: "Duplicate listing match", user: "MiraMint", severity: "Medium", status: "Needs review" },
  { id: "q2", title: "High-value proof upload", user: "HoloHana", severity: "High", status: "Pending admin" },
  { id: "q3", title: "Off-platform chat warning", user: "KantoKei", severity: "Low", status: "Logged" }
];

export const reputationEvents = [
  { type: "Trade completed", points: "+8", reason: "Balanced swap approved by both users" },
  { type: "Verified card", points: "+3", reason: "Screenshot proof accepted" },
  { type: "Dispute resolved", points: "+2", reason: "Proof supplied within cooldown" }
];

export const statusCopy: Record<CardStatus, string> = {
  owned: "Owned",
  for_trade: "For Trade",
  wishlist: "Wishlist",
  locked: "Locked"
};

// NOTE: do not use `status.includes("verified")` — "unverified" contains it.
export function isVerified(status: VerificationStatus): boolean {
  return status === "verified" || status === "wallet_verified";
}

export const verificationCopy: Record<VerificationStatus, string> = {
  unverified: "Unverified",
  pending: "Pending",
  verified: "Verified owner",
  wallet_verified: "Wallet verified",
  disputed: "Disputed"
};

export const statusIcons = {
  owned: BadgeCheck,
  for_trade: Flame,
  wishlist: Heart,
  locked: Lock
};

// ---------------------------------------------------------------------------
// Gacha / pack-opening simulation
// Framed as a "collector pack simulation" — NOT an official Pokémon product.
// ---------------------------------------------------------------------------

export type PackRarity = "Common" | "Uncommon" | "Rare" | "Ultra Rare" | "Crown Rare";

export const rarityRank: Record<PackRarity, number> = {
  Common: 0,
  Uncommon: 1,
  Rare: 2,
  "Ultra Rare": 3,
  "Crown Rare": 4
};

// Tailwind classes used for rarity glow + accent so reveal effects scale with pull value.
export const rarityStyle: Record<PackRarity, { glow: string; text: string; ring: string }> = {
  Common: { glow: "shadow-[0_0_0_rgba(0,0,0,0)]", text: "text-white/70", ring: "ring-white/15" },
  Uncommon: { glow: "shadow-[0_0_30px_rgba(95,184,255,0.35)]", text: "text-sky", ring: "ring-sky/40" },
  Rare: { glow: "shadow-[0_0_40px_rgba(70,244,199,0.4)]", text: "text-mint", ring: "ring-mint/45" },
  "Ultra Rare": { glow: "shadow-[0_0_55px_rgba(255,216,77,0.5)]", text: "text-volt", ring: "ring-volt/55" },
  "Crown Rare": { glow: "shadow-[0_0_70px_rgba(213,128,255,0.6)]", text: "text-purple-300", ring: "ring-purple-300/60" }
};

export type PackTier = {
  id: string;
  name: string;
  subtitle: string;
  cardCount: number;
  accent: string; // tailwind gradient for the closed-pack visual
  // Relative pull weights per rarity (higher = more likely).
  weights: Record<PackRarity, number>;
};

export const packTiers: PackTier[] = [
  {
    id: "binder-draft",
    name: "Binder Draft Pack",
    subtitle: "5 cards · friendly odds for new binders",
    cardCount: 5,
    accent: "from-emerald-300 via-green-600 to-slate-900",
    weights: { Common: 60, Uncommon: 26, Rare: 11, "Ultra Rare": 2.5, "Crown Rare": 0.5 }
  },
  {
    id: "holo-relay",
    name: "Holo Relay Pack",
    subtitle: "5 cards · boosted holo and rare pulls",
    cardCount: 5,
    accent: "from-cyan-300 via-blue-600 to-indigo-800",
    weights: { Common: 40, Uncommon: 30, Rare: 22, "Ultra Rare": 6.5, "Crown Rare": 1.5 }
  },
  {
    id: "crown-vault",
    name: "Crown Vault Pack",
    subtitle: "6 cards · best shot at Crown Rare chase cards",
    cardCount: 6,
    accent: "from-fuchsia-400 via-purple-700 to-slate-950",
    weights: { Common: 24, Uncommon: 28, Rare: 30, "Ultra Rare": 13, "Crown Rare": 5 }
  }
];

export type PoolEntry = {
  name: string;
  setName: string;
  cardNumber: string;
  type: CardType;
  generation: string;
  rarity: PackRarity;
  imageUrl: string;
};

// Real cards mapped onto simulated pack-rarity tiers.
export const gachaPool: PoolEntry[] = [
  // Common
  { name: "Pikachu", setName: "Base Set", cardNumber: "58/102", type: "Lightning", generation: "Base", rarity: "Common", imageUrl: "https://images.pokemontcg.io/base1/58_hires.png" },
  { name: "Charmander", setName: "Base Set", cardNumber: "46/102", type: "Fire", generation: "Base", rarity: "Common", imageUrl: "https://images.pokemontcg.io/base1/46_hires.png" },
  { name: "Squirtle", setName: "Base Set", cardNumber: "63/102", type: "Water", generation: "Base", rarity: "Common", imageUrl: "https://images.pokemontcg.io/base1/63_hires.png" },
  { name: "Bulbasaur", setName: "Base Set", cardNumber: "44/102", type: "Grass", generation: "Base", rarity: "Common", imageUrl: "https://images.pokemontcg.io/base1/44_hires.png" },
  { name: "Machop", setName: "Base Set", cardNumber: "52/102", type: "Fighting", generation: "Base", rarity: "Common", imageUrl: "https://images.pokemontcg.io/base1/52_hires.png" },
  { name: "Abra", setName: "Base Set", cardNumber: "43/102", type: "Psychic", generation: "Base", rarity: "Common", imageUrl: "https://images.pokemontcg.io/base1/43_hires.png" },
  { name: "Eevee", setName: "Jungle", cardNumber: "51/64", type: "Colorless", generation: "Base", rarity: "Common", imageUrl: "https://images.pokemontcg.io/base2/51_hires.png" },
  // Uncommon
  { name: "Charmeleon", setName: "Base Set", cardNumber: "24/102", type: "Fire", generation: "Base", rarity: "Uncommon", imageUrl: "https://images.pokemontcg.io/base1/24_hires.png" },
  { name: "Wartortle", setName: "Base Set", cardNumber: "42/102", type: "Water", generation: "Base", rarity: "Uncommon", imageUrl: "https://images.pokemontcg.io/base1/42_hires.png" },
  { name: "Ivysaur", setName: "Base Set", cardNumber: "30/102", type: "Grass", generation: "Base", rarity: "Uncommon", imageUrl: "https://images.pokemontcg.io/base1/30_hires.png" },
  { name: "Kadabra", setName: "Base Set", cardNumber: "32/102", type: "Psychic", generation: "Base", rarity: "Uncommon", imageUrl: "https://images.pokemontcg.io/base1/32_hires.png" },
  { name: "Magikarp", setName: "Base Set", cardNumber: "35/102", type: "Water", generation: "Base", rarity: "Uncommon", imageUrl: "https://images.pokemontcg.io/base1/35_hires.png" },
  // Rare
  { name: "Raichu", setName: "Base Set", cardNumber: "14/102", type: "Lightning", generation: "Base", rarity: "Rare", imageUrl: "https://images.pokemontcg.io/base1/14_hires.png" },
  { name: "Gyarados", setName: "Base Set", cardNumber: "6/102", type: "Water", generation: "Base", rarity: "Rare", imageUrl: "https://images.pokemontcg.io/base1/6_hires.png" },
  { name: "Venusaur", setName: "Base Set", cardNumber: "15/102", type: "Grass", generation: "Base", rarity: "Rare", imageUrl: "https://images.pokemontcg.io/base1/15_hires.png" },
  { name: "Blastoise", setName: "Base Set", cardNumber: "2/102", type: "Water", generation: "Base", rarity: "Rare", imageUrl: "https://images.pokemontcg.io/base1/2_hires.png" },
  // Ultra Rare
  { name: "Charizard", setName: "Base Set", cardNumber: "4/102", type: "Fire", generation: "Base", rarity: "Ultra Rare", imageUrl: "https://images.pokemontcg.io/base1/4_hires.png" },
  { name: "Mewtwo", setName: "Base Set", cardNumber: "10/102", type: "Psychic", generation: "Base", rarity: "Ultra Rare", imageUrl: "https://images.pokemontcg.io/base1/10_hires.png" },
  { name: "Lugia V", setName: "Silver Tempest", cardNumber: "186/195", type: "Colorless", generation: "Sword & Shield", rarity: "Ultra Rare", imageUrl: "https://images.pokemontcg.io/swsh12/186_hires.png" },
  { name: "Snorlax V", setName: "Sword & Shield", cardNumber: "141/202", type: "Colorless", generation: "Sword & Shield", rarity: "Ultra Rare", imageUrl: "https://images.pokemontcg.io/swsh1/141_hires.png" },
  // Crown Rare (alt-art chase cards)
  { name: "Umbreon VMAX", setName: "Evolving Skies", cardNumber: "215/203", type: "Darkness", generation: "Sword & Shield", rarity: "Crown Rare", imageUrl: "https://images.pokemontcg.io/swsh7/215_hires.png" },
  { name: "Rayquaza VMAX", setName: "Evolving Skies", cardNumber: "218/203", type: "Dragon", generation: "Sword & Shield", rarity: "Crown Rare", imageUrl: "https://images.pokemontcg.io/swsh7/218_hires.png" },
  { name: "Charizard VMAX", setName: "Shining Fates", cardNumber: "SV107/122", type: "Fire", generation: "Sword & Shield", rarity: "Crown Rare", imageUrl: "https://images.pokemontcg.io/swsh45sv/SV107_hires.png" },
  { name: "Gengar VMAX", setName: "Fusion Strike", cardNumber: "271/264", type: "Darkness", generation: "Sword & Shield", rarity: "Crown Rare", imageUrl: "https://images.pokemontcg.io/swsh8/271_hires.png" }
];
