import { AlertTriangle, BarChart3, Flag, ShieldCheck, UsersRound } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { PageShell, SectionHeader, Stat } from "@/components/ui";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const proofTypeLabel: Record<string, string> = {
  self_reported: "Self-reported",
  screenshot: "Screenshot proof",
  receipt_import: "Receipt / import",
  peer_confirmed_trade: "Peer-confirmed trade",
  admin_verified: "Admin verified",
  wallet_signature: "Wallet signature",
  onchain_receipt: "Onchain receipt"
};

function severityFor(type: string): { label: string; cls: string } {
  if (type === "self_reported" || type === "screenshot") return { label: "High", cls: "text-[var(--red)]" };
  if (type === "receipt_import" || type === "peer_confirmed_trade") return { label: "Medium", cls: "text-[var(--sun-deep)]" };
  return { label: "Low", cls: "text-[var(--mint)]" };
}

type QueueRow = {
  id: string;
  type: string;
  created_at: string;
  user_cards: { cards: { name: string } | null; users: { username: string } | null } | null;
};

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) redirect("/auth?next=/admin");

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/admin");

  const { data: profile } = await admin.from("users").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) notFound();

  const startOfTodayUtc = `${new Date().toISOString().slice(0, 10)}T00:00:00Z`;

  const [usersRes, disputesRes, pendingRes, tradesTodayRes, queueRes] = await Promise.all([
    admin.from("users").select("*", { count: "exact", head: true }),
    admin.from("trades").select("*", { count: "exact", head: true }).eq("status", "disputed"),
    admin.from("verification_proofs").select("*", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("trades").select("*", { count: "exact", head: true }).gte("created_at", startOfTodayUtc),
    admin
      .from("verification_proofs")
      .select("id, type, created_at, user_cards ( cards ( name ), users ( username ) )")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(12)
  ]);

  const queue = (queueRes.data ?? []) as unknown as QueueRow[];

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <SectionHeader
          title="Admin Panel"
          copy="Live platform metrics, the verification review queue, disputes, and trade activity."
        />
        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          <Stat label="Users" value={(usersRes.count ?? 0).toLocaleString()} />
          <Stat label="Open disputes" value={disputesRes.count ?? 0} />
          <Stat label="Pending proofs" value={pendingRes.count ?? 0} tone="accent" />
          <Stat label="Trades today" value={tradesTodayRes.count ?? 0} />
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="rr-panel-soft overflow-hidden rounded-2xl">
            <div className="grid grid-cols-[1fr_120px_90px] gap-2 border-b border-[rgba(23,58,99,0.12)] px-4 py-3 text-xs font-black uppercase tracking-[0.04em] text-[var(--muted)]">
              <span>Verification to review</span>
              <span>Collector</span>
              <span>Severity</span>
            </div>
            {queue.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <p className="text-sm font-black text-[var(--navy)]">Nothing in the review queue.</p>
                <p className="mt-1 text-xs font-bold text-[var(--muted)]">Pending verification proofs will appear here for review.</p>
              </div>
            ) : (
              queue.map((row) => {
                const sev = severityFor(row.type);
                return (
                  <div
                    key={row.id}
                    className="grid grid-cols-[1fr_120px_90px] items-center gap-2 border-b border-[rgba(23,58,99,0.1)] px-4 py-3.5 text-sm last:border-b-0"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-black text-[var(--navy)]">{row.user_cards?.cards?.name ?? "Unknown card"}</div>
                      <div className="truncate text-xs font-bold text-[var(--muted)]">{proofTypeLabel[row.type] ?? row.type}</div>
                    </div>
                    <div className="truncate font-bold text-[var(--muted)]">{row.user_cards?.users?.username ?? "—"}</div>
                    <div className={`font-black ${sev.cls}`}>{sev.label}</div>
                  </div>
                );
              })
            )}
          </div>
          <aside className="space-y-4">
            {[
              { label: "User management", Icon: UsersRound },
              { label: "Verification review", Icon: ShieldCheck },
              { label: "Report queue", Icon: Flag },
              { label: "Fraud flags", Icon: AlertTriangle },
              { label: "Platform metrics", Icon: BarChart3 }
            ].map(({ label, Icon }) => (
              <div key={label} className="rr-panel-soft rounded-2xl p-5">
                <Icon className="text-[var(--sun-deep)]" size={22} />
                <h2 className="mt-2.5 font-black text-[var(--navy)]">{label}</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  Connected to provider attestations, trade-grade proof records, and admin policies.
                </p>
              </div>
            ))}
          </aside>
        </div>
      </section>
    </PageShell>
  );
}
