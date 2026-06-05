"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, CheckCircle2, Loader2, ShieldCheck, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { connectEvmWallet, connectSolanaWallet, shortenAddress, WalletChain } from "@/lib/wallet";

const chainLabel: Record<WalletChain, string> = { evm: "EVM", solana: "Solana" };

export function WalletLink() {
  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [linked, setLinked] = useState<{ address: string; chain: WalletChain } | null>(null);
  const [busy, setBusy] = useState<WalletChain | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!supabase) {
        setChecking(false);
        return;
      }
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!active) return;
      if (user) {
        setUserId(user.id);
        const res = await fetch("/api/wallet/status");
        const data = await res.json();
        if (active && data?.linked && data.address) {
          setLinked({ address: data.address, chain: (data.chain as WalletChain) ?? "evm" });
        }
      }
      setChecking(false);
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  async function link(chain: WalletChain) {
    if (!userId) return;
    setError(null);
    setBusy(chain);
    try {
      const signed = chain === "solana" ? await connectSolanaWallet() : await connectEvmWallet();
      const res = await fetch("/api/wallet/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signed)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not link wallet.");
      setLinked({ address: json.address, chain: json.chain });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not link wallet.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rr-panel rounded-2xl p-5">
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck className="text-[var(--sky-deep)]" size={20} />
        <h2 className="font-black text-[var(--navy)]">Wallet connection</h2>
        <span className="ml-auto rounded-md bg-[var(--sky-soft)] px-2 py-0.5 text-[10px] font-black uppercase text-[var(--sky-deep)]">
          Optional
        </span>
      </div>

      {checking ? (
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <Loader2 size={16} className="animate-spin" /> Checking…
        </div>
      ) : !userId ? (
        <div className="text-sm leading-6 text-[var(--muted)]">
          <Link href="/auth" className="font-black text-[var(--sky-deep)] underline">
            Sign in
          </Link>{" "}
          to link a wallet. Card-level trade approval still needs a token or receipt reference.
        </div>
      ) : linked ? (
        <div>
          <div className="flex items-center gap-2 rounded-xl border-2 border-[#5fe0c2] bg-[#d7f7ee] p-3">
            <BadgeCheck className="shrink-0 text-[var(--mint)]" size={20} />
            <div className="min-w-0">
              <div className="text-sm font-black text-[var(--navy)]">Wallet verified</div>
              <div className="truncate text-xs font-bold text-[var(--muted)]">
                {chainLabel[linked.chain]} · {shortenAddress(linked.address)}
              </div>
            </div>
          </div>
          <button
            onClick={() => setLinked(null)}
            className="mt-3 text-xs font-black text-[var(--muted)] underline hover:text-[var(--navy)]"
          >
            Link a different wallet
          </button>
        </div>
      ) : (
        <div>
          <p className="mb-3 text-sm leading-6 text-[var(--muted)]">
            Connect a wallet and sign a message to prove account control. Nothing is spent; card-level proof still requires a token or receipt.
          </p>
          <div className="grid gap-2">
            <button
              onClick={() => link("solana")}
              disabled={busy !== null}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-black text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: "#ab9ff2" }}
            >
              {busy === "solana" ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
              Connect Phantom (Solana)
            </button>
            <button
              onClick={() => link("evm")}
              disabled={busy !== null}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-black text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: "#f6851b" }}
            >
              {busy === "evm" ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
              Connect MetaMask (EVM)
            </button>
          </div>
        </div>
      )}

      {error ? (
        <p className="mt-3 rounded-lg border border-[#f3b0b0] bg-[#fdecec] p-2.5 text-xs font-bold text-[var(--red)]">{error}</p>
      ) : (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] leading-5 text-[var(--muted)]">
          <CheckCircle2 size={12} /> Signature verified server-side before saving.
        </p>
      )}
    </div>
  );
}
