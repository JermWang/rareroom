// Client-side wallet connect + sign helpers. No heavy wallet libraries — we use
// the injected providers directly (MetaMask for EVM, Phantom for Solana). The
// signature is verified server-side in /api/wallet/link before anything is saved.

export type WalletChain = "evm" | "solana";

export type SignedLink = {
  address: string;
  chain: WalletChain;
  signature: string; // EVM: 0x-hex (personal_sign). Solana: base64 of the raw signature bytes.
  message: string;
  challengeId: string;
};

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

type PhantomProvider = {
  isPhantom?: boolean;
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
  signMessage: (message: Uint8Array, display?: string) => Promise<{ signature: Uint8Array }>;
};

type WalletWindow = Window & {
  ethereum?: Eip1193Provider;
  solana?: PhantomProvider;
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function createChallenge(address: string, chain: WalletChain): Promise<{ challengeId: string; address: string; message: string }> {
  const res = await fetch("/api/wallet/challenge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, chain })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Could not create wallet challenge.");
  return json;
}

export async function connectEvmWallet(): Promise<SignedLink> {
  const provider = (window as WalletWindow).ethereum;
  if (!provider) {
    throw new Error("No EVM wallet detected. Install MetaMask or a compatible wallet.");
  }
  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  const address = accounts?.[0];
  if (!address) throw new Error("No account was returned by the wallet.");
  const challenge = await createChallenge(address, "evm");
  const signature = (await provider.request({
    method: "personal_sign",
    params: [challenge.message, challenge.address]
  })) as string;
  return { address: challenge.address, chain: "evm", signature, message: challenge.message, challengeId: challenge.challengeId };
}

export async function connectSolanaWallet(): Promise<SignedLink> {
  const provider = (window as WalletWindow).solana;
  if (!provider || !provider.isPhantom) {
    throw new Error("Phantom wallet not detected. Install the Phantom extension.");
  }
  const { publicKey } = await provider.connect();
  const address = publicKey.toString();
  const challenge = await createChallenge(address, "solana");
  const encoded = new TextEncoder().encode(challenge.message);
  const { signature } = await provider.signMessage(encoded, "utf8");
  return { address: challenge.address, chain: "solana", signature: bytesToBase64(signature), message: challenge.message, challengeId: challenge.challengeId };
}

export function shortenAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
