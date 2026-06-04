"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, MessageSquare, Plus, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { Button, CardTile, PageShell, SectionHeader, cx } from "@/components/ui";
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

  // "Their offer" — card requested from marketplace (or mock fallback)
  const [requestedCard, setRequestedCard] = useState<(CollectorCard & { ownerUserId?: string }) | null>(null);
  const [loadingRequested, setLoadingRequested] = useState(Boolean(requestedCardId));

  // "My offer" — current user's for_trade cards from Supabase (or mock fallback)
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
      note,
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
        <SectionHeader title="Swap Builder" copy="Build a visual trade, compare value balance, match wishlists, and require both collectors to confirm before verification." />
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {tradeStatuses.map((item) => (
            <button
              key={item}
              onClick={() => setStatus(item)}
              className={cx(
                "shrink-0 rounded-lg px-3 py-2 text-xs font-black transition",
                status === item
                  ? "bg-[var(--sun)] text-[var(--navy)] shadow-sm"
                  : "border border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--sky)] hover:text-[var(--navy)]"
              )}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_280px_1fr]">
          {/* My offer */}
          <div className="rr-panel p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-[var(--navy)]">My Offer</h2>
              <span className="rounded-lg border border-[var(--line)] bg-[var(--sky-soft)] px-2 py-1 text-xs font-black text-[var(--sky-deep)]">{selectedMyCardIds.size} cards</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {myCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => toggleMyCard(card.id)}
                  className={cx(
                    "text-left rounded-2xl border-2 transition",
                    selectedMyCardIds.has(card.id)
                      ? "border-[var(--sun)] shadow-sm"
                      : "border-[var(--line)] opacity-50"
                  )}
                >
                  <CardTile card={card} compact />
                </button>
              ))}
              {myCards.length === 0 && (
                <p className="text-sm text-[var(--muted)] py-4 text-center">No cards marked for trade in your binder.</p>
              )}
            </div>
            <button className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--line)] text-sm font-black text-[var(--muted)] transition hover:border-[var(--sun-deep)] hover:text-[var(--sun-deep)]">
              <Plus size={16} />
              Add my card
            </button>
          </div>

          {/* Center panel */}
          <div className="rr-panel p-5">
            <div className="grid place-items-center rounded-xl border-2 border-[var(--sun)] bg-[#fff8e0] p-5 text-center">
              <Sparkles className="text-[var(--sun-deep)]" size={28} />
              <div className="mt-3 text-2xl font-black text-[var(--navy)]">Balanced</div>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Estimated fairness is close. Their side is within 8% of your offer.</p>
            </div>
            <div className="mt-5 space-y-3">
              <Meter label="Value match" value="92%" />
              <Meter label="Wishlist match" value="2 found" />
              <Meter label="Trust level" value="Verified" />
            </div>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-5 min-h-28 w-full rounded-lg border-2 border-[var(--line)] bg-[var(--sky-soft)] p-3 text-sm font-semibold text-[var(--navy)] outline-none focus:border-[var(--sky)]"
            />
            {result && (
              <div className={cx(
                "mt-3 rounded-lg border p-3 text-sm font-bold",
                result.ok
                  ? "border-[var(--mint)] bg-[#d7f7ee] text-[var(--mint)]"
                  : "border-[var(--red)] bg-[#ffe2e2] text-[var(--red)]"
              )}>
                {result.message}
              </div>
            )}
            <div className="mt-4 grid gap-2">
              <button
                onClick={sendTrade}
                disabled={sending}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--navy)] px-4 text-sm font-black text-white transition hover:bg-[var(--sky-deep)] disabled:opacity-60"
              >
                <CheckCircle2 size={16} />
                {sending ? "Sending…" : "Send trade"}
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

          {/* Their offer */}
          <div className="rr-panel p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-[var(--navy)]">Their Offer</h2>
              <span className="rounded-lg border border-[var(--line)] bg-[var(--sky-soft)] px-2 py-1 text-xs font-black text-[var(--sky-deep)]">{theirCards.length} cards</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {loadingRequested ? (
                <div className="h-48 animate-pulse rounded-2xl bg-[var(--sky-soft)]" />
              ) : (
                theirCards.map((card) => (
                  <CardTile key={card.id} card={card} compact />
                ))
              )}
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            { label: "Both sides confirm", copy: "Collector confirmations lock the proposal before proof review.", accent: "var(--sun-deep)" },
            { label: "Verification pending", copy: "Ownership and trade intent are checked before transfer completion.", accent: "var(--sky)" },
            { label: "Completed and logged", copy: "A public trade history entry is added to both profiles.", accent: "var(--mint)" }
          ].map(({ label, copy, accent }) => (
            <div key={label} className="rr-panel-soft p-5">
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
    <div className="rounded-lg border border-[var(--line)] bg-[var(--sky-soft)] p-3">
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
