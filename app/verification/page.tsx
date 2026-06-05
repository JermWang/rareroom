import { BadgeCheck } from "lucide-react";
import { Button, PageShell, SectionHeader, Stat } from "@/components/ui";
import { proofTypes } from "@/lib/data";
import { rejectedVerificationSources, trustedVerificationProviders } from "@/lib/trusted-verification";

export default function VerificationPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <SectionHeader
          title="Verification Center"
          copy="Trade approval requires trusted source validation. Screenshots, manual entry, and metadata-only matches can help import cards, but they cannot approve a trade."
        />
        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          <Stat label="Verified cards" value="118" tone="accent" />
          <Stat label="Pending review" value="7" />
          <Stat label="Duplicate flags" value="2" />
          <Stat label="Cooldowns active" value="4" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {proofTypes.map((proof) => {
            const Icon = proof.icon;
            return (
              <div key={proof.label} className="rr-panel-soft rounded-2xl p-5">
                <Icon className="text-[var(--sun-deep)]" size={24} />
                <h2 className="mt-3 text-lg font-black text-[var(--navy)]">{proof.label}</h2>
                <p className="mt-1.5 text-sm leading-6 text-[var(--muted)]">{proof.detail}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="rr-panel-soft rounded-2xl p-5">
            <h2 className="text-lg font-black text-[var(--navy)]">Trade-grade sources</h2>
            <div className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {Object.values(trustedVerificationProviders).map((provider) => {
                const Icon = provider.icon;
                return (
                  <div key={provider.name} className="flex items-start gap-3">
                    <Icon className="mt-0.5 shrink-0 text-[var(--sun-deep)]" size={18} />
                    <div>
                      <h3 className="text-sm font-black text-[var(--navy)]">{provider.name}</h3>
                      <p className="mt-1 text-xs font-bold leading-5 text-[var(--muted)]">{provider.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rr-panel-soft rounded-2xl p-5">
            <h2 className="text-lg font-black text-[var(--navy)]">Blocked as proof</h2>
            <div className="mt-3 divide-y divide-[rgba(23,58,99,0.1)]">
              {rejectedVerificationSources.map(({ name, detail, icon: Icon }) => (
                <div key={name} className="py-3 first:pt-1 last:pb-0">
                  <div className="flex items-center gap-2.5 text-sm font-black text-[var(--navy)]">
                    <Icon className="text-[var(--red)]" size={18} />
                    {name}
                  </div>
                  <p className="mt-1 pl-7 text-xs font-bold leading-5 text-[var(--muted)]">{detail}</p>
                </div>
              ))}
            </div>
            <Button href="/admin" className="mt-4 w-full">
              <BadgeCheck size={16} />
              Open manual review queue
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
