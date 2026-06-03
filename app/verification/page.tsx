import { AlertTriangle, BadgeCheck, Clock, Eye, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button, PageShell, SectionHeader, Stat } from "@/components/ui";
import { proofTypes } from "@/lib/data";

export default function VerificationPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <SectionHeader title="Verification Center" copy="Trust should be visible but not annoying. Manage proof, warnings, disputes, and optional wallet receipts in one place." />
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
            <h2 className="text-xl font-black text-white">Badge levels</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <Badge tone="bg-white/10 text-white/54" label="Grey" copy="Unverified" />
              <Badge tone="bg-sky/15 text-sky" label="Blue" copy="Platform verified" />
              <Badge tone="bg-purple-300/15 text-purple-200" label="Purple" copy="Wallet verified" />
              <Badge tone="bg-volt/18 text-volt" label="Gold" copy="High-trust collector" />
            </div>
          </div>
          <div className="glass rounded-2xl p-5">
            <h2 className="text-xl font-black text-white">Fraud controls</h2>
            <div className="mt-4 space-y-3">
              {[
                { label: "Duplicate listing detection", Icon: Eye },
                { label: "Suspicious account warnings", Icon: ShieldAlert },
                { label: "Trade cooldowns for new users", Icon: Clock },
                { label: "Reputation penalties", Icon: AlertTriangle },
                { label: "Dispute button", Icon: ShieldCheck }
              ].map(({ label, Icon }) => (
                <div key={label} className="flex items-center gap-3 rounded-lg border border-line bg-white/[0.045] p-3 text-sm font-black text-white/72">
                  <Icon className="text-mint" size={18} />
                  {label}
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

function Badge({ tone, label, copy }: { tone: string; label: string; copy: string }) {
  return (
    <div className="rounded-lg border border-line bg-white/[0.045] p-4">
      <div className={`inline-flex rounded-md px-2 py-1 text-xs font-black ${tone}`}>{label}</div>
      <div className="mt-3 text-sm font-black text-white">{copy}</div>
    </div>
  );
}
