"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, MessageSquare, Minus, Plus, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { Button, CardTile, PageShell, SectionHeader, cx } from "@/components/ui";
import { cards, tradeStatuses } from "@/lib/data";

export default function SwapPage() {
  const [status, setStatus] = useState("Draft");
  const [note, setNote] = useState("Looking for this card. Happy to counter if the value feels off.");
  const myOffer = useMemo(() => cards.filter((card) => card.owner === "You" && card.status === "for_trade"), []);
  const theirOffer = useMemo(() => cards.filter((card) => card.owner !== "You" && card.status === "for_trade").slice(0, 2), []);

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <SectionHeader title="Swap Builder" copy="Build a visual trade, compare value balance, match wishlists, and require both collectors to confirm before verification." />
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {tradeStatuses.map((item) => (
            <button key={item} onClick={() => setStatus(item)} className={cx("shrink-0 rounded-lg px-3 py-2 text-xs font-black", status === item ? "bg-volt text-ink" : "bg-white/8 text-white/58")}>
              {item}
            </button>
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_280px_1fr]">
          <OfferColumn title="My Offer" count={myOffer.length}>
            {myOffer.map((card) => (
              <CardTile key={card.id} card={card} compact />
            ))}
          </OfferColumn>
          <div className="glass rounded-2xl p-5">
            <div className="grid place-items-center rounded-xl border border-volt/25 bg-volt/12 p-5 text-center">
              <Sparkles className="text-volt" size={28} />
              <div className="mt-3 text-2xl font-black text-volt">Balanced</div>
              <p className="mt-2 text-sm leading-6 text-white/56">Estimated fairness is close. Their side is within 8% of your offer.</p>
            </div>
            <div className="mt-5 space-y-3">
              <Meter label="Value match" value="92%" />
              <Meter label="Wishlist match" value="2 found" />
              <Meter label="Trust level" value="Verified" />
            </div>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-5 min-h-28 w-full rounded-lg border border-line bg-white/[0.055] p-3 text-sm font-semibold text-white outline-none"
            />
            <div className="mt-4 grid gap-2">
              <Button>
                <CheckCircle2 size={16} />
                Send trade
              </Button>
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
          <OfferColumn title="Their Offer" count={theirOffer.length}>
            {theirOffer.map((card) => (
              <CardTile key={card.id} card={card} compact />
            ))}
          </OfferColumn>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {["Both sides confirm", "Verification pending", "Completed and logged"].map((item, index) => (
            <div key={item} className="rounded-xl border border-line bg-white/[0.045] p-4">
              <ShieldCheck className={index === 0 ? "text-volt" : "text-mint"} size={22} />
              <h3 className="mt-3 font-black text-white">{item}</h3>
              <p className="mt-1 text-sm leading-6 text-white/50">
                {index === 0 && "Collector confirmations lock the proposal before proof review."}
                {index === 1 && "Ownership and trade intent are checked before transfer completion."}
                {index === 2 && "A public trade history entry is added to both profiles."}
              </p>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function OfferColumn({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-black text-white">{title}</h2>
        <span className="rounded-lg bg-white/8 px-2 py-1 text-xs font-black text-white/58">{count} cards</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">{children}</div>
      <button className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/18 text-sm font-black text-white/56 hover:border-volt/40 hover:text-volt">
        {title === "My Offer" ? <Plus size={16} /> : <Minus size={16} />}
        {title === "My Offer" ? "Add my card" : "Request card"}
      </button>
    </div>
  );
}

function Meter({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-white/[0.045] p-3">
      <div className="flex justify-between text-xs font-black">
        <span className="text-white/50">{label}</span>
        <span className="text-white">{value}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-white/10">
        <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-mint to-volt" />
      </div>
    </div>
  );
}
