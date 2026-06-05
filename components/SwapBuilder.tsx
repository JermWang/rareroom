"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowRightLeft, CheckCircle2, Maximize2, MessageSquare, Plus, RefreshCw, ShieldCheck, X } from "lucide-react";
import { Button, CardArt, SectionHeader, cx } from "@/components/ui";
import { CollectorCard, tradeStatuses } from "@/lib/data";
import { createTrade, fetchSingleUserCard, fetchUserBinderCards } from "@/lib/binder-db";
import { sanitizeProofUrl } from "@/lib/proof-url";

export function SwapBuilder({ requestedCardId }: { requestedCardId?: string | null }) {
  const [status, setStatus] = useState("Draft");
  const [note, setNote] = useState("Looking for this card. Happy to counter if the value feels off.");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [requestedCard, setRequestedCard] = useState<(CollectorCard & { ownerUserId?: string }) | null>(null);
  const [loadingRequested, setLoadingRequested] = useState(Boolean(requestedCardId));

  const [myCards, setMyCards] = useState<CollectorCard[]>([]);
  const [selectedMyCardIds, setSelectedMyCardIds] = useState<Set<string>>(new Set());
  const [usingSupabase, setUsingSupabase] = useState(false);
  const [previewCard, setPreviewCard] = useState<CollectorCard | null>(null);

  useEffect(() => {
    fetchUserBinderCards().then((remote) => {
      if (remote) {
        const forTrade = remote.filter((c) => c.status === "for_trade");
        setMyCards(forTrade);
        setSelectedMyCardIds(new Set(forTrade.map((c) => c.id)));
        setUsingSupabase(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!requestedCardId) {
      setRequestedCard(null);
      setLoadingRequested(false);
      return;
    }
    setLoadingRequested(true);
    fetchSingleUserCard(requestedCardId).then((card) => {
      if (card) setRequestedCard(card);
      setLoadingRequested(false);
    });
  }, [requestedCardId]);

  const theirCards: CollectorCard[] = useMemo(() => {
    if (requestedCard) return [requestedCard];
    return [];
  }, [requestedCard]);

  function toggleMyCard(id: string) {
    setSelectedMyCardIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function openTradeChat() {
    window.dispatchEvent(new Event("rareroom:open-trade-chat"));
  }

  async function sendTrade() {
    if (!usingSupabase || !requestedCard?.ownerUserId) {
      setResult({ ok: false, message: "Sign in and open a source-verified card from Swap Hub to send a real offer." });
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
      window.dispatchEvent(new CustomEvent("rareroom:open-trade-chat", { detail: { tradeId: res.tradeId } }));
    } else {
      setResult({ ok: false, message: res.reason });
    }
  }

  return (
    <div>
      <SectionHeader
        title="Build a Swap"
        copy="Pick only source-verified or wallet-verified cards, compare value, and keep chat close while the offer comes together."
        action={
          <Button onClick={openTradeChat} variant="secondary" className="min-h-11 px-5 text-sm">
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
              <TradeCardRow
                key={card.id}
                card={card}
                selected={selectedMyCardIds.has(card.id)}
                onSelect={() => toggleMyCard(card.id)}
                onPreview={() => setPreviewCard(card)}
              />
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
            <Button onClick={openTradeChat} variant="secondary">
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
              theirCards.map((card) => <TradeCardRow key={card.id} card={card} onPreview={() => setPreviewCard(card)} />)
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 border-t border-[rgba(23,58,99,0.14)] pt-6 md:grid-cols-3">
        {[
          { label: "Both sides confirm", copy: "Collector confirmations lock the proposal after source validation passes.", accent: "var(--sun-deep)" },
          { label: "Trusted source required", copy: "Screenshots and manual entries cannot approve a trade.", accent: "var(--sky)" },
          { label: "Completed and logged", copy: "A public trade history entry is added to both profiles.", accent: "var(--mint)" }
        ].map(({ label, copy, accent }) => (
          <div key={label} className="flex gap-3 border-b border-[rgba(23,58,99,0.12)] pb-4 md:border-b-0 md:pb-0">
            <ShieldCheck className="mt-1 shrink-0" style={{ color: accent }} size={22} />
            <div>
              <h3 className="font-black text-[var(--navy)]">{label}</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{copy}</p>
            </div>
          </div>
        ))}
      </div>
      {previewCard ? <CardPreviewModal card={previewCard} onClose={() => setPreviewCard(null)} /> : null}
    </div>
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

function TradeCardRow({
  card,
  selected = true,
  onSelect,
  onPreview
}: {
  card: CollectorCard;
  selected?: boolean;
  onSelect?: () => void;
  onPreview?: () => void;
}) {
  const proofLabel = getProofLabel(card);

  return (
    <div
      className={cx(
        "rr-trade-card-row group",
        selected ? "rr-trade-card-row-selected" : "rr-trade-card-row-muted"
      )}
    >
      <button
        type="button"
        onClick={onPreview}
        className="relative w-[62px] rounded-[14px] text-left outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--sky)]"
        aria-label={`Enlarge ${card.name}`}
      >
        <CardArt card={card} />
        <span className="absolute inset-x-1 bottom-1 grid h-6 place-items-center rounded-full border border-[rgba(23,58,99,0.16)] bg-white/88 text-[var(--navy)] opacity-0 shadow-sm transition group-hover:opacity-100 group-focus-visible:opacity-100">
          <Maximize2 size={12} />
        </span>
      </button>
      <div className="min-w-0">
        <div className="rr-card-kicker truncate">{card.rarity}</div>
        <h3 className="rr-card-title mt-1 truncate">{card.name}</h3>
        <p className="rr-card-subtitle mt-0.5 truncate">{card.setName}</p>
        <p className="mt-2 truncate text-[10px] font-black uppercase tracking-[0.06em] text-[var(--sky-deep)]">
          <ProofLink card={card}>{proofLabel}</ProofLink> <span className="text-[rgba(23,58,99,0.28)]">/</span> {card.condition}
        </p>
      </div>
      <div className="grid justify-items-end gap-2">
        <span className="rr-card-value text-right">{card.estimatedValue}</span>
        {onSelect ? (
          <button
            type="button"
            onClick={onSelect}
            className={cx(
              "rr-card-action-pill",
              selected && "rr-card-action-pill-active"
            )}
          >
            {selected ? "Selected" : "Add"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onPreview}
            className="rr-card-action-pill"
          >
            View
          </button>
        )}
      </div>
    </div>
  );
}

function CardPreviewModal({ card, onClose }: { card: CollectorCard; onClose: () => void }) {
  const proofLabel = getProofLabel(card);

  return (
    <div className="fixed inset-0 z-[80] grid place-items-start overflow-y-auto bg-[rgba(10,31,55,0.48)] p-4 backdrop-blur-sm md:place-items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${card.name} card preview`}
        className="grid w-full max-w-4xl gap-5 rounded-[30px] border-2 border-[var(--navy)] bg-[#edf9ff] p-4 shadow-[0_34px_90px_-34px_rgba(10,31,55,0.82)] md:grid-cols-[minmax(260px,360px)_1fr] md:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto w-full max-w-[340px]">
          <CardArt card={card} large />
        </div>
        <div className="flex min-w-0 flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--sky-deep)]">Card preview</p>
              <h2 className="mt-2 font-display text-4xl font-black leading-none text-[var(--navy)]">{card.name}</h2>
              <p className="mt-2 text-sm font-black text-[var(--muted)]">
                {card.setName} - {card.cardNumber}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid size-10 shrink-0 place-items-center rounded-full border border-[rgba(23,58,99,0.18)] bg-white text-[var(--navy)]"
              aria-label="Close card preview"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-[rgba(23,58,99,0.14)] py-3 text-sm font-black">
            <ProofLink card={card} className="text-[var(--mint)]">
              {proofLabel}
            </ProofLink>
            <span className="text-[var(--sun-deep)]">{card.estimatedValue}</span>
            <span className="text-[var(--muted)]">{card.condition}</span>
          </div>

          <dl className="mt-5 divide-y divide-[rgba(23,58,99,0.12)] text-sm font-bold text-[var(--muted)]">
            {[
              ["Rarity", card.rarity],
              ["Type", card.type],
              ["Generation", card.generation],
              ["Language", card.language],
              ["Edition", card.edition || "Standard"],
              ["Owner", card.owner]
            ].map(([label, value]) => (
              <div key={label} className="grid grid-cols-[120px_1fr] gap-3 py-3">
                <dt className="text-[11px] font-black uppercase tracking-[0.08em] text-[var(--sky-deep)]">{label}</dt>
                <dd className="font-black text-[var(--navy)]">{value}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-5 text-sm font-bold leading-6 text-[var(--muted)]">
            Use this enlarged view to check artwork, set details, condition, proof status, and estimated value before sending or accepting a trade.
          </p>
        </div>
      </div>
    </div>
  );
}

function getProofLabel(card: CollectorCard) {
  return {
    unverified: "Unverified",
    pending: "Source pending",
    verified: "Source verified",
    wallet_verified: "Wallet verified",
    disputed: "Disputed"
  }[card.verificationStatus];
}

function getProofHref(card: CollectorCard) {
  return sanitizeProofUrl(card.proofUrl) || `/verification?card=${encodeURIComponent(card.id)}`;
}

function isExternalProof(card: CollectorCard) {
  const proofUrl = sanitizeProofUrl(card.proofUrl);
  return Boolean(proofUrl && /^https:\/\//i.test(proofUrl));
}

function ProofLink({ card, children, className }: { card: CollectorCard; children: ReactNode; className?: string }) {
  const external = isExternalProof(card);
  return (
    <a
      href={getProofHref(card)}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      onClick={(event) => event.stopPropagation()}
      className={cx("underline decoration-[rgba(23,58,99,0.28)] underline-offset-2 transition hover:text-[var(--navy)]", className)}
      title="Open proof of authenticity"
    >
      {children}
    </a>
  );
}
