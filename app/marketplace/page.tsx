"use client";

import { useEffect, useState } from "react";
import { ArrowUpDown, BadgeCheck, Gem, Handshake, HeartHandshake, Shield, Zap } from "lucide-react";
import { Button, CardArt, CollectorRow, PageShell, SearchBar, SectionHeader, VerificationBadge, cx } from "@/components/ui";
import { cards, CollectorCard } from "@/lib/data";
import { fetchMarketplaceListings } from "@/lib/binder-db";

const verificationSource: Record<string, { label: string; icon: typeof BadgeCheck; color: string }> = {
  verified:        { label: "Screenshot verified",   icon: BadgeCheck, color: "text-[var(--mint)]" },
  wallet_verified: { label: "Wallet signed",         icon: Zap,        color: "text-[#7c3aed]" },
  pending:         { label: "Pending review",        icon: Shield,     color: "text-[var(--sun-deep)]" },
  unverified:      { label: "Self-reported",         icon: Shield,     color: "text-[var(--muted)]" },
};

const importSource: Record<string, string> = {
  MiraMint:  "Collectr CSV",
  HoloHana:  "PTCG Live export",
  KantoKei:  "TCGdex search",
  You:       "Manual import",
};

export default function MarketplacePage() {
  const [listings, setListings] = useState<CollectorCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingLive, setUsingLive] = useState(false);

  useEffect(() => {
    fetchMarketplaceListings().then((live) => {
      if (live && live.length > 0) {
        setListings(live);
        setUsingLive(true);
      } else {
        setListings(cards.filter((c) => c.status === "for_trade"));
        setUsingLive(false);
      }
      setLoading(false);
    });
  }, []);

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <SectionHeader
          title="Trade Marketplace"
          copy={usingLive
            ? `${listings.length} live listing${listings.length !== 1 ? "s" : ""} from verified collectors.`
            : "Browse verified for-trade cards. Every listing shows how ownership was confirmed."}
        />

        {/* Filter bar */}
        <div className="rr-panel-soft mb-5 rounded-2xl p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <SearchBar placeholder="Search available trades" />
            <Button variant="secondary">
              <ArrowUpDown size={16} />
              Recently listed
            </Button>
            <Button variant="secondary">
              <Gem size={16} />
              Verified only
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Most wanted", "Rarest", "Closest value match", "1-for-1", "Bundle trade", "Wishlist only"].map((item) => (
              <span
                key={item}
                className="rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-black text-[var(--muted)] cursor-pointer hover:border-[var(--sky)] hover:text-[var(--navy)] transition"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Verification legend */}
        <div className="mb-4 flex flex-wrap gap-3">
          {Object.entries(verificationSource).map(([, { label, icon: Icon, color }]) => (
            <span key={label} className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--muted)]">
              <Icon size={13} className={color} />
              {label}
            </span>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rr-panel h-72 animate-pulse rounded-2xl bg-[var(--sky-soft)]" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="rr-panel-soft rounded-2xl p-12 text-center">
            <p className="text-sm font-bold text-[var(--muted)]">No cards listed for trade yet.</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Import your collection and mark cards as &quot;For Trade&quot; in your binder.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {listings.map((card) => (
              <ListingCard key={card.id} card={card} />
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}

function ListingCard({ card }: { card: CollectorCard }) {
  const src = verificationSource[card.verificationStatus] ?? verificationSource.unverified;
  const SrcIcon = src.icon;
  const platform = importSource[card.owner] ?? "Imported";

  return (
    <div className="rr-panel flex flex-col p-3 transition hover:-translate-y-0.5 hover:shadow-[0_26px_60px_-26px_rgba(23,58,99,0.45)]">
      {/* Card art */}
      <div className="relative">
        <CardArt card={card} />
        <span className={cx("absolute left-2 bottom-2 inline-flex items-center gap-1 rounded-full border border-[var(--navy)] bg-white px-2 py-0.5 text-[9px] font-black shadow-sm", src.color)}>
          <SrcIcon size={9} />
          {src.label}
        </span>
      </div>

      {/* Card info */}
      <div className="mt-2.5 flex items-start justify-between gap-1">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-black text-[var(--navy)]">{card.name}</h3>
          <p className="truncate text-xs font-bold text-[var(--muted)]">{card.setName}</p>
        </div>
        <span className="shrink-0 text-xs font-black text-[var(--sun-deep)]">{card.estimatedValue}</span>
      </div>

      {/* Collector + import platform */}
      <div className="mt-2.5 flex items-center justify-between gap-2 rounded-lg border border-[var(--line)] bg-[var(--sky-soft)] px-2.5 py-2">
        <CollectorRow name={card.owner} compact />
        <span className="shrink-0 rounded border border-[var(--line)] bg-white px-1.5 py-0.5 text-[9px] font-black text-[var(--muted)]">
          {platform}
        </span>
      </div>

      {/* Wants */}
      <div className="mt-2 flex items-start gap-1.5 text-xs text-[var(--muted)]">
        <HeartHandshake size={13} className="mt-0.5 shrink-0 text-[var(--red)]" />
        <span className="line-clamp-1">Wants: wishlist matches, electric rares</span>
      </div>
      <div className="mt-1 flex items-start gap-1.5 text-xs text-[var(--muted)]">
        <Handshake size={13} className="mt-0.5 shrink-0 text-[var(--sun-deep)]" />
        <span className="line-clamp-1">Open to offers · Bundle trade</span>
      </div>

      {/* CTA */}
      <Button href={`/swap?card=${card.id}`} className="mt-3 h-9 w-full text-xs">
        Propose swap
      </Button>
    </div>
  );
}
