import { BadgeCheck, DatabaseZap, KeyRound, Link2, ShieldCheck, WalletCards, XCircle } from "lucide-react";
import type { VerificationStatus } from "@/lib/data";

export type TrustedProviderId =
  | "tcgplayer"
  | "pricecharting"
  | "collectr_partner"
  | "ptcg_live_partner"
  | "tcg_pocket_partner"
  | "wallet_signature"
  | "onchain_receipt";

export type ProofType =
  | "self_reported"
  | "screenshot"
  | "official_metadata_match"
  | "receipt_import"
  | "platform_connection"
  | "marketplace_inventory"
  | "partner_api_attestation"
  | "wallet_signature"
  | "onchain_receipt"
  | "admin_review";

export const TRADE_GRADE_PROOF_TYPES: ProofType[] = [
  "platform_connection",
  "marketplace_inventory",
  "partner_api_attestation",
  "wallet_signature",
  "onchain_receipt"
];

export const NON_TRADE_GRADE_PROOF_TYPES: ProofType[] = [
  "self_reported",
  "screenshot",
  "official_metadata_match",
  "receipt_import",
  "admin_review"
];

export const trustedVerificationProviders: Record<
  TrustedProviderId,
  {
    name: string;
    proofType: ProofType;
    icon: typeof ShieldCheck;
    tradeGrade: boolean;
    detail: string;
  }
> = {
  tcgplayer: {
    name: "TCGplayer seller inventory",
    proofType: "marketplace_inventory",
    icon: DatabaseZap,
    tradeGrade: true,
    detail: "Requires an authorized TCGplayer seller/store inventory connection. Catalog or price lookups alone do not qualify."
  },
  pricecharting: {
    name: "PriceCharting collection",
    proofType: "marketplace_inventory",
    icon: DatabaseZap,
    tradeGrade: true,
    detail: "Requires a signed-in PriceCharting collection or offer record pulled through an authorized account token."
  },
  collectr_partner: {
    name: "Collectr partner attestation",
    proofType: "partner_api_attestation",
    icon: Link2,
    tradeGrade: true,
    detail: "Requires partner/API access that confirms the card exists in the collector account, not a pasted CSV."
  },
  ptcg_live_partner: {
    name: "PTCG Live account attestation",
    proofType: "partner_api_attestation",
    icon: KeyRound,
    tradeGrade: true,
    detail: "Requires an account-backed export or partner attestation. A screenshot or copied list is import-only."
  },
  tcg_pocket_partner: {
    name: "TCG Pocket account attestation",
    proofType: "partner_api_attestation",
    icon: KeyRound,
    tradeGrade: true,
    detail: "Requires an account-backed export or partner attestation. Screenshots can help identify cards, not approve trades."
  },
  wallet_signature: {
    name: "Wallet signature",
    proofType: "wallet_signature",
    icon: WalletCards,
    tradeGrade: true,
    detail: "A server-verified signature binds the collector account to a wallet before a wallet-backed validation badge is issued."
  },
  onchain_receipt: {
    name: "Onchain receipt",
    proofType: "onchain_receipt",
    icon: BadgeCheck,
    tradeGrade: true,
    detail: "A verifiable onchain receipt can approve digital cards represented by a token or collectible record."
  }
};

export const rejectedVerificationSources = [
  {
    name: "Screenshots",
    icon: XCircle,
    detail: "Allowed only as context for condition or import matching. Never trade-grade ownership validation."
  },
  {
    name: "Manual card entry",
    icon: XCircle,
    detail: "Useful for search corrections, but not enough to list a card for trade."
  },
  {
    name: "Metadata-only APIs",
    icon: XCircle,
    detail: "Pokémon TCG API and TCGdex identify card data; they do not prove a user owns the card."
  }
];

export function isTradeGradeVerification(status: VerificationStatus) {
  return status === "verified" || status === "wallet_verified";
}

export function getTradeEligibilityMessage(status: VerificationStatus) {
  if (isTradeGradeVerification(status)) return "Trade eligible";
  if (status === "pending") return "Waiting for trusted source validation";
  if (status === "disputed") return "Blocked by dispute";
  return "Connect a trusted source before trading";
}
