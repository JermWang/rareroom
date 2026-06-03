import { ArrowUpDown, Gem, Handshake, HeartHandshake } from "lucide-react";
import { Button, CardTile, CollectorRow, PageShell, SearchBar, SectionHeader } from "@/components/ui";
import { cards } from "@/lib/data";

export default function MarketplacePage() {
  const tradeCards = cards.filter((card) => card.status === "for_trade");

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <SectionHeader title="Trade Marketplace" copy="Browse verified for-trade cards, reputation signals, wants lists, and trade openness before sending an offer." />
        <div className="glass mb-5 rounded-2xl p-4">
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
              <span key={item} className="rounded-lg bg-white/8 px-3 py-2 text-xs font-black text-white/58">{item}</span>
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {tradeCards.map((card) => (
            <div key={card.id} className="glass rounded-2xl p-4">
              <CollectorRow name={card.owner} />
              <div className="mt-4">
                <CardTile card={card} />
              </div>
              <div className="mt-4 grid gap-2 rounded-lg border border-line bg-white/[0.045] p-3 text-sm">
                <div className="flex items-center gap-2 text-white/72">
                  <HeartHandshake size={16} className="text-danger" />
                  Wants: wishlist matches, electric rares
                </div>
                <div className="flex items-center gap-2 text-white/72">
                  <Handshake size={16} className="text-volt" />
                  Open to offers · Bundle trade
                </div>
              </div>
              <Button href="/swap" className="mt-4 w-full">
                Propose swap
              </Button>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
