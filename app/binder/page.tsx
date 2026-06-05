"use client";

import { useEffect, useMemo, useState } from "react";
import { Link2, Plus } from "lucide-react";
import { ActivityRail, Button, CardTile, PageShell, SearchBar, SectionHeader, Stat, cx } from "@/components/ui";
import { CardStatus, CollectorCard, cards, filters, isVerified } from "@/lib/data";
import { loadImportedAsCards } from "@/lib/import";
import { fetchUserBinderCards, updateUserCardStatus } from "@/lib/binder-db";

export default function BinderPage() {
  const [active, setActive] = useState("All Cards");
  const [usingSupabase, setUsingSupabase] = useState(false);
  // Cards imported on this device (localStorage) appear first as "recently added".
  const [imported, setImported] = useState<CollectorCard[]>([]);
  useEffect(() => {
    let cancelled = false;

    async function loadBinder() {
      const remoteCards = await fetchUserBinderCards();
      if (cancelled) return;
      if (remoteCards) {
        setImported(remoteCards);
        setUsingSupabase(true);
      } else {
        setImported(loadImportedAsCards());
        setUsingSupabase(false);
      }
    }

    loadBinder();
    return () => {
      cancelled = true;
    };
  }, []);

  const allCards = useMemo(() => (usingSupabase ? imported : [...imported, ...cards]), [imported, usingSupabase]);

  async function handleStatusChange(cardId: string, status: CardStatus) {
    const previous = imported;
    setImported((prev) => prev.map((c) => (c.id === cardId ? { ...c, status } : c)));
    if (usingSupabase) {
      const ok = await updateUserCardStatus(cardId, status);
      if (!ok) setImported(previous);
    }
  }

  const visibleCards = useMemo(() => {
    if (active === "For Trade") return allCards.filter((card) => card.status === "for_trade");
    if (active === "Wishlist") return allCards.filter((card) => card.status === "wishlist");
    if (active === "Rare") return allCards.filter((card) => card.rarity.includes("Rare") || card.rarity === "Legendary");
    if (active === "Verified") return allCards.filter((card) => isVerified(card.verificationStatus));
    // "All Cards" and "Recently Added" both show everything (imported first).
    return allCards;
  }, [active, allCards]);

  return (
    <PageShell>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:grid-cols-[1fr_320px] md:px-6">
        <div className="min-w-0">
          <SectionHeader
            title="My Binder"
            copy="Mark cards as owned, for trade, wishlist, or locked. Trade status requires trusted source validation."
            action={
              <div className="flex gap-2">
                <Button href="/verification" variant="secondary">
                  <Link2 size={16} />
                  Connect source
                </Button>
                <Button href="/import">
                  <Plus size={16} />
                  Import cards
                </Button>
              </div>
            }
          />
          <div className="mb-4 grid gap-3 sm:grid-cols-4">
            <Stat label="Total cards" value={allCards.length} />
            <Stat label="For trade" value={allCards.filter((card) => card.status === "for_trade").length} tone="accent" />
            <Stat label="Verified" value={allCards.filter((card) => isVerified(card.verificationStatus)).length} />
            <Stat label="Wishlist" value={allCards.filter((card) => card.status === "wishlist").length} />
          </div>
          <div className="rr-panel-soft mb-5 rounded-2xl p-3">
            <SearchBar placeholder="Search your binder" />
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActive(filter)}
                  className={cx(
                    "shrink-0 rounded-lg px-3 py-2 text-xs font-black transition",
                    active === filter
                      ? "bg-[var(--sun)] text-[var(--navy)] shadow-sm"
                      : "border border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--sky)] hover:text-[var(--navy)]"
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {["Generation", "Set", "Type", "Rarity", "Condition", "Language", "Holo / Reverse / Promo", "Verified only"].map((filter) => (
                <select key={filter} className="min-h-10 rounded-lg border-2 border-[var(--line)] bg-white px-3 text-xs font-bold text-[var(--muted)] outline-none focus:border-[var(--sky)]">
                  <option>{filter}</option>
                </select>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {visibleCards.map((card) => (
              <CardTile
                key={card.id}
                card={card}
                onStatusChange={card.imported ? (status) => handleStatusChange(card.id, status) : undefined}
              />
            ))}
          </div>
        </div>
        <ActivityRail />
      </section>
    </PageShell>
  );
}
