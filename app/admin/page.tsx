import { AlertTriangle, BarChart3, Flag, ShieldCheck, UsersRound } from "lucide-react";
import { Button, PageShell, SectionHeader, Stat } from "@/components/ui";
import { adminQueue } from "@/lib/data";

export default function AdminPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <SectionHeader title="Admin Panel" copy="Shell for user management, card verification review, disputes, reports, trade logs, fraud flags, featured collectors, and metrics." />
        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          <Stat label="Users" value="2,481" />
          <Stat label="Open disputes" value="12" />
          <Stat label="Proof reviews" value="37" tone="accent" />
          <Stat label="Trades today" value="84" />
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="glass overflow-hidden rounded-2xl">
            <div className="grid grid-cols-[1fr_110px_130px_110px] border-b border-line px-4 py-3 text-xs font-black uppercase text-white/44">
              <span>Queue item</span>
              <span>User</span>
              <span>Severity</span>
              <span>Status</span>
            </div>
            {adminQueue.map((item) => (
              <div key={item.id} className="grid grid-cols-[1fr_110px_130px_110px] items-center border-b border-line px-4 py-4 text-sm last:border-b-0">
                <div className="font-black text-white">{item.title}</div>
                <div className="text-white/58">{item.user}</div>
                <div className={item.severity === "High" ? "font-black text-danger" : item.severity === "Medium" ? "font-black text-volt" : "font-black text-mint"}>{item.severity}</div>
                <div className="text-white/58">{item.status}</div>
              </div>
            ))}
          </div>
          <aside className="space-y-4">
            {[
              { label: "User management", Icon: UsersRound },
              { label: "Verification review", Icon: ShieldCheck },
              { label: "Report queue", Icon: Flag },
              { label: "Fraud flags", Icon: AlertTriangle },
              { label: "Platform metrics", Icon: BarChart3 }
            ].map(({ label, Icon }) => (
              <div key={label} className="glass rounded-2xl p-5">
                <Icon className="text-volt" size={24} />
                <h2 className="mt-3 font-black text-white">{label}</h2>
                <p className="mt-1 text-sm leading-6 text-white/50">Operational shell ready to connect to Supabase tables, storage proof files, and admin policies.</p>
                <Button variant="secondary" className="mt-4 w-full">
                  Open
                </Button>
              </div>
            ))}
          </aside>
        </div>
      </section>
    </PageShell>
  );
}
