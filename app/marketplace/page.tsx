"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUpDown, BadgeCheck, Gem, Handshake, MessageSquare, Shield, Zap } from "lucide-react";
import { Button, CardArt, CollectorRow, PageShell, SearchBar, SectionHeader, cx } from "@/components/ui";
import { CollectorCard } from "@/lib/data";
import { fetchMarketplaceListings } from "@/lib/binder-db";
import { sanitizeProofUrl } from "@/lib/proof-url";

type HubTab = "browse" | "build" | "requests";

const hubTabs: { id: HubTab; label: string; href: string }[] = [
  { id: "browse", label: "Browse", href: "/marketplace" },
  { id: "build", label: "Build", href: "/marketplace?tab=build" },
  { id: "requests", label: "Requests", href: "/marketplace?tab=requests" }
];

const SwapBuilder = dynamic(() => import("@/components/SwapBuilder").then((module) => module.SwapBuilder), {
  loading: () => <div className="h-72 animate-pulse rounded-[22px] bg-white/58" />
});

const verificationSource: Record<string, { label: string; icon: typeof BadgeCheck; color: string }> = {
  verified: { label: "Source verified", icon: BadgeCheck, color: "text-[var(--mint)]" },
  wallet_verified: { label: "Wallet signed", icon: Zap, color: "text-[#7c3aed]" },
  pending: { label: "Not trade eligible", icon: Shield, color: "text-[var(--sun-deep)]" },
  unverified: { label: "Not trade eligible", icon: Shield, color: "text-[var(--muted)]" }
};

const importSource: Record<string, string> = {
  MiraMint: "Collectr CSV",
  HoloHana: "PTCG Live export",
  KantoKei: "TCGdex search",
  You: "Manual import"
};

const requestRows = [
  { status: "Incoming", collector: "MiraMint", card: "Umbreon VMAX", value: "$420 - $560", tone: "text-[var(--mint)]" },
  { status: "Countered", collector: "HoloHana", card: "Blastoise", value: "$120 - $180", tone: "text-[var(--sun-deep)]" },
  { status: "Sent", collector: "KantoKei", card: "Rayquaza VMAX", value: "$180 - $240", tone: "text-[var(--sky-deep)]" }
];

export default function MarketplacePage() {
  return (
    <Suspense>
      <SwapHubPage />
    </Suspense>
  );
}

function SwapHubPage() {
  const params = useSearchParams();
  const activeTab = getHubTab(params.get("tab"));
  const requestedCardId = params.get("card");
  const [listings, setListings] = useState<CollectorCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingLive, setUsingLive] = useState(false);

  useEffect(() => {
    fetchMarketplaceListings().then((live) => {
      if (live && live.length > 0) {
        setListings(live);
        setUsingLive(true);
      } else {
        setListings([]);
        setUsingLive(false);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (params.get("chat") === "open") {
      window.dispatchEvent(new Event("rareroom:open-trade-chat"));
    }
  }, [params]);

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <SectionHeader
          title="Swap Hub"
          copy="Browse live trade listings, build an offer, and track requests from one clean workspace."
          action={
            <Button href="/marketplace?tab=build" className="min-h-10 px-4 text-xs">
              <Handshake size={16} />
              Build swap
            </Button>
          }
        />

        <HubTabs activeTab={activeTab} requestedCardId={requestedCardId} />

        {activeTab === "browse" ? <BrowseTab listings={listings} loading={loading} usingLive={usingLive} /> : null}
        {activeTab === "build" ? <SwapBuilder requestedCardId={requestedCardId} /> : null}
        {activeTab === "requests" ? <RequestsTab /> : null}
      </section>
    </PageShell>
  );
}

function getHubTab(tab: string | null): HubTab {
  if (tab === "build" || tab === "requests") return tab;
  return "browse";
}

function HubTabs({ activeTab, requestedCardId }: { activeTab: HubTab; requestedCardId: string | null }) {
  return (
    <nav className="mb-7 flex gap-2 overflow-x-auto border-y border-[rgba(23,58,99,0.14)] py-3" aria-label="Swap Hub sections">
      {hubTabs.map((item) => {
        const href = item.id === "build" && requestedCardId ? `${item.href}&card=${encodeURIComponent(requestedCardId)}` : item.href;
        return (
          <Link
            key={item.id}
            href={href}
            className={cx(
              "shrink-0 rounded-full px-4 py-2 text-sm font-black transition",
              activeTab === item.id
                ? "bg-[var(--navy)] text-white shadow-sm"
                : "border border-[rgba(23,58,99,0.18)] bg-white/58 text-[var(--muted)] hover:border-[var(--sky)] hover:text-[var(--navy)]"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function BrowseTab({ listings, loading, usingLive }: { listings: CollectorCard[]; loading: boolean; usingLive: boolean }) {
  return (
    <>
      <div className="mb-5 border-b border-[rgba(23,58,99,0.14)] pb-4">
        <p className="mb-3 text-sm font-extrabold text-[var(--muted)]">
          {usingLive
            ? `${listings.length} live listing${listings.length !== 1 ? "s" : ""} from verified collectors.`
            : "No live listings are available from the database right now."}
        </p>
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <SearchBar placeholder="Search available trades" />
          <Button variant="secondary">
            <ArrowUpDown size={16} />
            Recent
          </Button>
          <Button variant="secondary">
            <Gem size={16} />
            Verified
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Wanted", "Rarest", "Closest value", "1-for-1", "Bundle", "Wishlist"].map((item) => (
            <span
              key={item}
              className="cursor-pointer rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-black text-[var(--muted)] transition hover:border-[var(--sky)] hover:text-[var(--navy)]"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        {Object.entries(verificationSource).map(([status, { label, icon: Icon, color }]) => (
          <span key={status} className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--muted)]">
            <Icon size={13} className={color} />
            {label}
          </span>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rr-panel h-72 animate-pulse rounded-2xl bg-[var(--sky-soft)]" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="border-y border-[rgba(23,58,99,0.14)] py-12 text-center">
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
    </>
  );
}

function RequestsTab() {
  function openTradeChat() {
    window.dispatchEvent(new Event("rareroom:open-trade-chat"));
  }

  return (
    <div>
      <SectionHeader
        title="Trade Requests"
        copy="Incoming offers, counters, and sent proposals stay in a short action list instead of another inbox."
        action={
          <Button onClick={openTradeChat} variant="secondary" className="min-h-10 px-4 text-xs">
            <MessageSquare size={16} />
            Trade chat
          </Button>
        }
      />
      <div className="divide-y divide-[rgba(23,58,99,0.12)] border-y border-[rgba(23,58,99,0.14)]">
        {requestRows.map((row) => (
          <div key={`${row.status}-${row.card}`} className="grid gap-3 py-4 md:grid-cols-[130px_1fr_auto_auto] md:items-center">
            <span className={cx("text-xs font-black uppercase tracking-[0.1em]", row.tone)}>{row.status}</span>
            <div className="min-w-0">
              <h3 className="truncate text-base font-black text-[var(--navy)]">{row.card}</h3>
              <p className="text-sm font-bold text-[var(--muted)]">With {row.collector}</p>
            </div>
            <span className="text-sm font-black text-[var(--sun-deep)]">{row.value}</span>
            <Button href="/marketplace?tab=build" variant="secondary" className="min-h-9 px-3 text-xs">
              Review
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ListingCard({ card }: { card: CollectorCard }) {
  const src = verificationSource[card.verificationStatus] ?? verificationSource.unverified;
  const SrcIcon = src.icon;
  const platform = importSource[card.owner] ?? "Imported";
  const proofHref = sanitizeProofUrl(card.proofUrl) || `/verification?card=${encodeURIComponent(card.id)}`;
  const externalProof = /^https?:\/\//i.test(proofHref);

  return (
    <div className="rr-listing-card">
      <div className="relative">
        <CardArt card={card} />
        <a
          href={proofHref}
          target={externalProof ? "_blank" : undefined}
          rel={externalProof ? "noreferrer" : undefined}
          className={cx("rr-proof-chip absolute bottom-2 left-2 transition hover:bg-[var(--sky-soft)]", src.color)}
          title="Open proof of authenticity"
        >
          <SrcIcon size={11} />
          {src.label}
        </a>
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="rr-card-kicker truncate">{card.rarity}</div>
          <h3 className="rr-card-title mt-1 truncate">{card.name}</h3>
          <p className="rr-card-subtitle mt-1 truncate">
            {card.setName} / {card.cardNumber}
          </p>
        </div>
        <span className="rr-card-value shrink-0">{card.estimatedValue}</span>
      </div>

      <div className="rr-listing-facts">
        <div className="rr-listing-fact">
          <span>Collector</span>
          <div className="min-w-0">
            <CollectorRow name={card.owner} compact />
          </div>
        </div>
        <div className="rr-listing-fact">
          <span>Source</span>
          <strong className="truncate">{platform}</strong>
        </div>
        <div className="rr-listing-fact">
          <span>Condition</span>
          <strong className="truncate">{card.condition}</strong>
        </div>
      </div>

      <Button href={`/marketplace?tab=build&card=${card.id}`} className="mt-3 h-9 w-full text-xs">
        Build offer
      </Button>
    </div>
  );
}
