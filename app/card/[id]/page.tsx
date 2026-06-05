import { notFound } from "next/navigation";
import { Flag, Heart, MessageSquare, Repeat2 } from "lucide-react";
import { Button, CardArt, PageShell, SectionHeader, StatusBadge, VerificationBadge } from "@/components/ui";
import { cards } from "@/lib/data";
import { fetchCardDetailById } from "@/lib/card-server";

export default async function CardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Real card (RLS-scoped) first; fall back to seed data for demo ids.
  const card = (await fetchCardDetailById(id)) ?? cards.find((item) => item.id === id);
  if (!card) notFound();

  const meta: [string, string][] = [
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

  const validation: [string, boolean][] = [
    ["Provider inventory connection", true],
    ["Partner API attestation", true],
    ["Wallet or onchain receipt", true],
    ["Metadata match (identification only)", false]
  ];

  return (
    <PageShell>
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-[340px_1fr] md:px-6">
        <div className="rr-panel-soft h-fit rounded-2xl p-4">
          <CardArt card={card} large />
        </div>
        <div>
          <SectionHeader title={card.name} copy={`${card.setName} · ${card.rarity} · Estimated ${card.estimatedValue}`} />
          <div className="mb-5 flex flex-wrap items-center gap-4">
            <VerificationBadge status={card.verificationStatus} />
            <StatusBadge status={card.status} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rr-panel-soft rounded-2xl p-5">
              <h2 className="font-black text-[var(--navy)]">Metadata</h2>
              <dl className="mt-3 divide-y divide-[rgba(23,58,99,0.1)] text-sm">
                {meta.map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 py-2.5">
                    <dt className="text-[var(--muted)]">{label}</dt>
                    <dd className="text-right font-black capitalize text-[var(--navy)]">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="rr-panel-soft rounded-2xl p-5">
              <h2 className="font-black text-[var(--navy)]">Trade validation</h2>
              <div className="mt-3 divide-y divide-[rgba(23,58,99,0.1)]">
                {validation.map(([item, approves]) => (
                  <div key={item} className="py-3 first:pt-1 last:pb-0">
                    <div className="text-sm font-black text-[var(--navy)]">{item}</div>
                    <p className="mt-0.5 text-xs font-bold leading-5 text-[var(--muted)]">
                      {approves ? "Can approve trading when verified by a trusted source." : "Cannot approve a trade by itself."}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="rr-panel-soft mt-4 rounded-2xl p-5">
            <h2 className="font-black text-[var(--navy)]">Trade status</h2>
            <p className="mt-1.5 text-sm leading-6 text-[var(--muted)]">
              Available, in negotiation, locked, or not-for-trade statuses are shown before offers can be sent.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button href={`/marketplace?tab=build&card=${card.id}`}>
                <Repeat2 size={16} />
                Make offer
              </Button>
              <Button variant="secondary">
                <Heart size={16} />
                Add to wishlist
              </Button>
              <Button href="/marketplace?tab=build&chat=open" variant="secondary">
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
