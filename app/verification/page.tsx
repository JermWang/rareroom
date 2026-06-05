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
        <div className="grid gap-5 md:grid-cols-2">
          {proofTypes.map((proof) => {
            const Icon = proof.icon;
            return (
              <div key={proof.label} className="glass rounded-2xl p-5">
                <Icon className="text-volt" size={26} />
                <h2 className="mt-4 text-xl font-black text-white">{proof.label}</h2>
                <p className="mt-2 text-sm leading-6 text-white/56">{proof.detail}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="glass rounded-2xl p-5">
            <h2 className="text-xl font-black text-white">Trade-grade sources</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {Object.values(trustedVerificationProviders).map((provider) => {
                const Icon = provider.icon;
                return (
                  <div key={provider.name} className="rounded-lg border border-line bg-white/[0.045] p-4">
                    <div className="flex items-start gap-3">
                      <Icon className="mt-1 shrink-0 text-volt" size={18} />
                      <div>
                        <h3 className="text-sm font-black text-white">{provider.name}</h3>
                        <p className="mt-1 text-xs font-bold leading-5 text-white/48">{provider.detail}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="glass rounded-2xl p-5">
            <h2 className="text-xl font-black text-white">Blocked as proof</h2>
            <div className="mt-4 space-y-3">
              {rejectedVerificationSources.map(({ name, detail, icon: Icon }) => (
                <div key={name} className="rounded-lg border border-line bg-white/[0.045] p-3">
                  <div className="flex items-center gap-3 text-sm font-black text-white/72">
                    <Icon className="text-danger" size={18} />
                    {name}
                  </div>
                  <p className="mt-1 pl-8 text-xs font-bold leading-5 text-white/42">{detail}</p>
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
