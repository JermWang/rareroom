import { notFound } from "next/navigation";
import { Flag, Heart, MessageSquare, Repeat2 } from "lucide-react";
import { Button, CardArt, PageShell, SectionHeader, StatusBadge, VerificationBadge } from "@/components/ui";
import { cards } from "@/lib/data";

export default async function CardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const card = cards.find((item) => item.id === id);
  if (!card) notFound();

  const meta = [
    ["Name", card.name],
    ["Set", card.setName],
    ["Card number", card.cardNumber],
    ["Rarity", card.rarity],
    ["Edition", card.edition],
    ["Condition", card.condition],
    ["Language", card.language],
    ["Ownership status", card.status],
    ["Verification status", card.verificationStatus]
  ];

  return (
    <PageShell>
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-[360px_1fr] md:px-6">
        <div className="glass rounded-2xl p-5">
          <CardArt card={card} large />
        </div>
        <div>
          <SectionHeader title={card.name} copy={`${card.setName} · ${card.rarity} · Estimated ${card.estimatedValue}`} />
          <div className="mb-5 flex flex-wrap gap-2">
            <StatusBadge status={card.status} />
            <VerificationBadge status={card.verificationStatus} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="glass rounded-2xl p-5">
              <h2 className="font-black text-white">Metadata</h2>
              <div className="mt-4 space-y-3">
                {meta.map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 border-b border-line pb-2 text-sm">
                    <span className="text-white/44">{label}</span>
                    <span className="text-right font-bold text-white/78">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass rounded-2xl p-5">
              <h2 className="font-black text-white">Ownership proof</h2>
              <div className="mt-4 space-y-3">
                {["Screenshot proof", "Import proof", "Manual verified badge", "Wallet signature proof optional"].map((item, index) => (
                  <div key={item} className="rounded-lg border border-line bg-white/[0.045] p-3">
                    <div className="font-black text-white">{item}</div>
                    <p className="mt-1 text-xs text-white/50">{index < 2 ? "Proof attached and ready for review." : "Available when higher trust is needed."}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="glass mt-5 rounded-2xl p-5">
            <h2 className="font-black text-white">Trade status</h2>
            <p className="mt-2 text-sm text-white/55">Available, in negotiation, locked, or not for trade statuses are shown before offers can be sent.</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button href="/swap">
                <Repeat2 size={16} />
                Make offer
              </Button>
              <Button variant="secondary">
                <Heart size={16} />
                Add to wishlist
              </Button>
              <Button href="/messages" variant="secondary">
                <MessageSquare size={16} />
                Message owner
              </Button>
              <Button variant="ghost">
                <Flag size={16} />
                Report issue
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
