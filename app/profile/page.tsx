import { Award, BadgeCheck, Flame, History, Star, Trophy } from "lucide-react";
import { CardTile, PageShell, SectionHeader, Stat } from "@/components/ui";
import { WalletLink } from "@/components/WalletLink";
import { cards, collectors, reputationEvents } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchProfileData } from "@/lib/profile-server";

export default async function ProfilePage() {
  const me = collectors[0];
  const seedCards = cards.filter((card) => card.owner === "You" || card.status === "for_trade").slice(0, 6);

  let displayName = me.username;
  let avatarUrl: string | null = null;
  let initials = me.avatar;
  let signedIn = false;

  // Real signed-in collector when available; otherwise the demo profile.
  let reputation: number | string = `${me.reputation}%`;
  let completedTrades: number = me.completedTrades;
  let verifiedCards: number = me.verifiedCards;
  let collectorLevel: number | string = 24;
  let binderCards = seedCards;
  let tradeHistory = reputationEvents;

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (user) {
      signedIn = true;
      const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
      displayName =
        meta.preferred_username || meta.user_name || meta.name || meta.full_name || user.email?.split("@")[0] || me.username;
      avatarUrl = meta.avatar_url || meta.picture || null;
      initials = displayName.slice(0, 2).toUpperCase();

      const data = await fetchProfileData(user.id);
      if (data) {
        reputation = `${data.reputation}%`;
        completedTrades = data.completedTrades;
        verifiedCards = data.verifiedCards;
        collectorLevel = data.collectorLevel;
        binderCards = data.publicCards;
        tradeHistory = data.tradeHistory;
      }
    }
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="rr-panel-soft mb-6 grid gap-6 rounded-2xl p-5 md:grid-cols-[260px_1fr]">
          <div className="text-center md:text-left">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={displayName}
                className="mx-auto size-24 rounded-full border-2 border-[var(--sun)] object-cover md:mx-0"
              />
            ) : (
              <div className="mx-auto grid size-24 place-items-center rounded-full border-2 border-[var(--sun)] bg-[#fff4d6] text-3xl font-black text-[var(--sun-deep)] md:mx-0">
                {initials}
              </div>
            )}
            <h1 className="mt-4 text-3xl font-black text-[var(--navy)]">{displayName}</h1>
            <p className="mt-1 text-sm font-bold text-[var(--muted)]">Level {collectorLevel} · Favorite type: {me.favorite}</p>
          </div>
          <div>
            <div className="grid gap-3 sm:grid-cols-4">
              <Stat label="Reputation" value={reputation} tone="accent" />
              <Stat label="Completed trades" value={completedTrades} />
              <Stat label="Verified cards" value={verifiedCards} />
              <Stat label="Collector level" value={collectorLevel} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {me.badges.concat(["First Trade", "Gacha Puller", "Set Completionist"]).map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-xs font-black text-[var(--navy)]"
                >
                  <Award size={14} className="text-[var(--sun-deep)]" />
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <SectionHeader
              title="Public Binder"
              copy="For-trade cards, wishlist targets, and trusted source status are visible to other collectors."
            />
            {binderCards.length === 0 ? (
              <div className="rr-panel-soft rounded-2xl px-6 py-12 text-center">
                <p className="text-sm font-black text-[var(--navy)]">No public cards yet.</p>
                <p className="mt-1 text-xs font-bold text-[var(--muted)]">Mark cards as For Trade or add Wishlist targets in your binder.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {binderCards.map((card) => (
                  <CardTile key={card.id} card={card} />
                ))}
              </div>
            )}
          </div>
          <aside className="space-y-4">
            <WalletLink />
            <Panel title="Trade History" icon={<History className="text-[var(--mint)]" size={20} />}>
              {tradeHistory.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No trade activity yet. Completed trades and proofs will show here.</p>
              ) : (
                tradeHistory.map((event, index) => (
                  <div key={`${event.type}-${index}`} className="border-b border-[rgba(23,58,99,0.1)] py-3 first:pt-0 last:border-b-0 last:pb-0">
                    <div className="flex justify-between text-sm font-black text-[var(--navy)]">
                      <span>{event.type}</span>
                      <span className="text-[var(--mint)]">{event.points}</span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)]">{event.reason}</p>
                  </div>
                ))
              )}
            </Panel>
            <Panel title="Collector Badges" icon={<Trophy className="text-[var(--sun-deep)]" size={20} />}>
              <div className="grid grid-cols-2 gap-2">
                {[Star, BadgeCheck, Flame, Trophy].map((Icon, index) => (
                  <div
                    key={index}
                    className="grid min-h-20 place-items-center rounded-lg border border-[var(--line)] bg-white text-[var(--sun-deep)]"
                  >
                    <Icon size={24} />
                  </div>
                ))}
              </div>
            </Panel>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rr-panel-soft rounded-2xl p-5">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h2 className="font-black text-[var(--navy)]">{title}</h2>
      </div>
      {children}
    </div>
  );
}
