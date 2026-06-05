import bs58 from "bs58";
import { getAddress, isAddress } from "ethers";

export type WalletChain = "evm" | "solana";

export function normalizeWalletAddress(address: string, chain: WalletChain): string | null {
  try {
    if (chain === "evm") return isAddress(address) ? getAddress(address) : null;
    const decoded = bs58.decode(address);
    return decoded.length === 32 ? address : null;
  } catch {
    return null;
  }
}

export function buildWalletChallengeMessage(opts: {
  userId: string;
  address: string;
  chain: WalletChain;
  challengeId: string;
  issuedAt: string;
  expiresAt: string;
}) {
  return [
    "RareRoom wallet verification",
    `Account: ${opts.userId}`,
    `Chain: ${opts.chain}`,
    `Address: ${opts.address}`,
    `Challenge: ${opts.challengeId}`,
    `Issued: ${opts.issuedAt}`,
    `Expires: ${opts.expiresAt}`
  ].join("\n");
}
