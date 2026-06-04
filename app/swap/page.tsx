"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRightLeft, CheckCircle2, MessageSquare, Plus, RefreshCw, ShieldCheck } from "lucide-react";
import { Button, CardArt, PageShell, SectionHeader, VerificationBadge, cx } from "@/components/ui";
import { CollectorCard, cards, tradeStatuses } from "@/lib/data";
import { createTrade, fetchSingleUserCard, fetchUserBinderCards } from "@/lib/binder-db";

export default function SwapPage() {
  return (
    <Suspense>
      <SwapPageInner />
    </Suspense>
  );
}

function SwapPageInner() {
  const params = useSearchParams();
  const requestedCardId = params.get("card");

  const [status, setStatus] = useState("Draft");
  const [note, setNote] = useState("Looking for this card. Happy to counter if the value feels off.");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [requestedCard, setRequestedCard] = useState<(CollectorCard & { ownerUserId?: string }) | null>(null);
  const [loadingRequested, setLoadingRequested] = useState(Boolean(requestedCardId));

  const [myCards, setMyCards] = useState<CollectorCard[]>([]);
  const [selectedMyCardIds, setSelectedMyCardIds] = useState<Set<string>>(new Set());
  const [usingSupabase, setUsingSupabase] = useState(false);

  useEffect(() => {
    fetchUserBinderCards().then((remote) => {
      if (remote) {
        const forTrade = remote.filter((c) => c.status === "for_trade");
        setMyCards(forTrade);
        setSelectedMyCardIds(new Set(forTrade.map((c) => c.id)));
        setUsingSupabase(true);
      } else {
        const mock = cards.filter((c) => c.owner === "You" && c.status === "for_trade");
        setMyCards(mock);
        setSelectedMyCardIds(new Set(mock.map((c) => c.id)));
      }
    });
  }, []);

  useEffect(() => {
    if (!requestedCardId) return;
    fetchSingleUserCard(requestedCardId).then((card) => {
      if (card) setRequestedCard(card);
      setLoadingRequested(false);
    });
  }, [requestedCardId]);

  const theirCards: CollectorCard[] = useMemo(() => {
    if (requestedCard) return [requestedCard];
    return cards.filter((c) => c.owner !== "You" && c.status === "for_trade").slice(0, 2);
  }, [requestedCard]);

  function toggleMyCard(id: string) {
    setSelectedMyCardIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function sendTrade() {
    if (!usingSupabase || !requestedCard?.ownerUserId) {
      setResult({ ok: false, message: "Sign in and open a trade from the Marketplace to send a real offer." });
      return;
    }
    setSending(true);
    setResult(null);
    const res = await createTrade({
      proposerCardIds: Array.from(selectedMyCardIds),
      receiverCardIds: [requestedCard.id],
      receiverUserId: requestedCard.ownerUserId,
      note
    });
    setSending(false);
    if (res.ok) {
      setResult({ ok: true, message: "Trade sent! The other collector will be notified." });
      setStatus("Sent");
    } else {
      setResult({ ok: false, message: res.reason });
    }
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <SectionHeader
          title="Swap Builder"
          copy="Build a visual trade, compare value balance, match wishlists, and require both collectors to confirm before verification."
          action={
            <Button href="/messages" variant="secondary" className="min-h-11 px-5 text-sm">
              <MessageSquare size={16} />
              Trade chat
            </Button>
          }
        />

        <div className="mb-6 flex gap-2 overflow-x-auto border-y border-[rgba(23,58,99,0.14)] py-3">
          {tradeStatuses.map((item) => (
            <button
              key={item}
              onClick={() => setStatus(item)}
              className={cx(
                "shrink-0 rounded-full px-3.5 py-2 text-xs font-black transition",
                status === item
                  ? "bg-[var(--sun)] text-[var(--navy)] shadow-sm"
                  : "border border-[rgba(23,58,99,0.18)] bg-white/60 text-[var(--muted)] hover:border-[var(--sky)] hover:text-[var(--navy)]"
              )}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px_minmax(0,1fr)]">
          <div className="swap-column">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--sky-deep)]">You send</p>
                <h2 className="font-display text-2xl font-black text-[var(--navy)]">My Offer</h2>
              </div>
              <span className="rounded-full border border-[rgba(23,58,99,0.18)] bg-white/72 px-3 py-1 text-xs font-black text-[var(--sky-deep)]">
                {selectedMyCardIds.size} selected
              </span>
            </div>
            <div className="space-y-3">
              {myCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => toggleMyCard(card.id)}
                  className={cx("w-full text-left transition", selectedMyCardIds.has(card.id) ? "opacity-100" : "opacity-45")}
                >
                  <TradeCardRow card={card} selected={selectedMyCardIds.has(card.id)} />
                </button>
              ))}
              {myCards.length === 0 && <p className="py-4 text-center text-sm text-[var(--muted)]">No cards marked for trade in your binder.</p>}
            </div>
            <button className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-dashed border-[rgba(23,58,99,0.28)] bg-white/48 text-sm font-black text-[var(--muted)] transition hover:border-[var(--sun-deep)] hover:text-[var(--sun-deep)]">
              <Plus size={16} />
              Add my card
            </button>
          </div>

          <div className="swap-command">
            <div className="grid place-items-center rounded-[22px] border border-[rgba(23,58,99,0.16)] bg-white/72 p-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.74)]">
              <span className="grid size-12 place-items-center rounded-full border-2 border-[var(--navy)] bg-[var(--sun)] text-[var(--navy)]">
                <ArrowRightLeft size={22} />
              </span>
              <div className="mt-4 font-display text-3xl font-black text-[var(--navy)]">Balanced</div>
              <p className="mt-2 text-sm font-bold leading-6 text-[var(--muted)]">Estimated fairness is close. Their side is within 8% of your offer.</p>
            </div>
            <div className="mt-4 space-y-3">
              <Meter label="Value match" value="92%" />
              <Meter label="Wishlist match" value="2 found" />
              <Meter label="Trust level" value="Verified" />
            </div>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              aria-label="Trade note"
              className="mt-4 min-h-28 w-full resize-none rounded-[18px] border border-[rgba(23,58,99,0.18)] bg-white/72 p-3.5 text-sm font-bold leading-6 text-[var(--navy)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--sky)] focus:bg-white"
            />
            {result && (
              <div
                className={cx(
                  "mt-3 rounded-[16px] border p-3 text-sm font-bold",
                  result.ok ? "border-[var(--mint)] bg-[#d7f7ee] text-[var(--mint)]" : "border-[var(--red)] bg-[#ffe2e2] text-[var(--red)]"
                )}
              >
                {result.message}
              </div>
            )}
            <div className="mt-4 grid gap-2">
              <button onClick={sendTrade} disabled={sending} className="rr-btn rr-btn-primary min-h-12 w-full px-4 text-sm disabled:opacity-60">
                <CheckCircle2 size={16} />
                {sending ? "Sending..." : "Send trade"}
              </button>
              <Button variant="secondary">
                <RefreshCw size={16} />
                Suggest alternatives
              </Button>
              <Button href="/messages" variant="secondary">
                <MessageSquare size={16} />
                Open trade chat
              </Button>
            </div>
          </div>

          <div className="swap-column">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--sky-deep)]">You receive</p>
                <h2 className="font-display text-2xl font-black text-[var(--navy)]">Their Offer</h2>
              </div>
              <span className="rounded-full border border-[rgba(23,58,99,0.18)] bg-white/72 px-3 py-1 text-xs font-black text-[var(--sky-deep)]">
                {theirCards.length} cards
              </span>
            </div>
            <div className="space-y-3">
              {loadingRequested ? (
                <div className="h-24 animate-pulse rounded-[20px] bg-white/72" />
              ) : (
                theirCards.map((card) => <TradeCardRow key={card.id} card={card} />)
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 border-t border-[rgba(23,58,99,0.14)] pt-6 md:grid-cols-3">
          {[
            { label: "Both sides confirm", copy: "Collector confirmations lock the proposal before proof review.", accent: "var(--sun-deep)" },
            { label: "Verification pending", copy: "Ownership and trade intent are checked before transfer completion.", accent: "var(--sky)" },
            { label: "Completed and logged", copy: "A public trade history entry is added to both profiles.", accent: "var(--mint)" }
          ].map(({ label, copy, accent }) => (
            <div key={label} className="rounded-[20px] border border-[rgba(23,58,99,0.14)] bg-white/52 p-5">
              <ShieldCheck style={{ color: accent }} size={22} />
              <h3 className="mt-3 font-black text-[var(--navy)]">{label}</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{copy}</p>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function Meter({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-[rgba(23,58,99,0.14)] bg-white/64 p-3">
      <div className="flex justify-between text-xs font-black">
        <span className="text-[var(--muted)]">{label}</span>
        <span className="text-[var(--navy)]">{value}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-[rgba(23,58,99,0.1)]">
        <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-[var(--mint)] to-[var(--sun)]" />
      </div>
    </div>
  );
}

function TradeCardRow({ card, selected = true }: { card: CollectorCard; selected?: boolean }) {
  return (
    <div
      className={cx(
        "group grid grid-cols-[58px_1fr_auto] items-center gap-3 rounded-[20px] border bg-white/72 p-2.5 shadow-[0_16px_34px_-28px_rgba(23,58,99,0.6)] transition hover:-translate-y-0.5 hover:bg-white",
        selected ? "border-[rgba(23,58,99,0.2)] ring-2 ring-[rgba(255,201,60,0.45)]" : "border-[rgba(23,58,99,0.12)]"
      )}
    >
      <div className="w-[58px]">
        <CardArt card={card} />
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-sm font-black text-[var(--navy)]">{card.name}</h3>
        <p className="mt-0.5 truncate text-xs font-bold text-[var(--muted)]">{card.setName}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <VerificationBadge status={card.verificationStatus} />
          <span className="rounded-full border border-[rgba(23,58,99,0.16)] bg-[var(--sky-soft)] px-2 py-1 text-[11px] font-black text-[var(--sky-deep)]">
            {card.condition}
          </span>
        </div>
      </div>
      <span className="shrink-0 rounded-full bg-[var(--sun)] px-2.5 py-1 text-xs font-black text-[var(--navy)]">{card.estimatedValue}</span>
    </div>
  );
}
