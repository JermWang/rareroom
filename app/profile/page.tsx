import { Award, BadgeCheck, Flame, Heart, History, Star, Trophy } from "lucide-react";
import { CardTile, PageShell, SectionHeader, Stat } from "@/components/ui";
import { WalletLink } from "@/components/WalletLink";
import { cards, collectors, reputationEvents } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const me = collectors[0];
  const publicCards = cards.filter((card) => card.owner === "You" || card.status === "for_trade").slice(0, 6);

  // Show the real signed-in collector's identity when available.
  let displayName = me.username;
  let avatarUrl: string | null = null;
  let initials = me.avatar;
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (user) {
      const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
      displayName =
        meta.preferred_username || meta.user_name || meta.name || meta.full_name || user.email?.split("@")[0] || me.username;
      avatarUrl = meta.avatar_url || meta.picture || null;
      initials = displayName.slice(0, 2).toUpperCase();
    }
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="glass mb-6 grid gap-6 rounded-2xl p-5 md:grid-cols-[260px_1fr]">
          <div className="text-center md:text-left">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={displayName} className="mx-auto size-24 rounded-full border border-volt/35 object-cover md:mx-0" />
            ) : (
              <div className="mx-auto grid size-24 place-items-center rounded-full border border-volt/35 bg-volt/12 text-3xl font-black text-volt md:mx-0">{initials}</div>
            )}
            <h1 className="mt-4 text-3xl font-black text-white">{displayName}</h1>
            <p className="mt-1 text-sm font-bold text-white/54">{me.level} · Favorite type: {me.favorite}</p>
          </div>
          <div>
            <div className="grid gap-3 sm:grid-cols-4">
              <Stat label="Reputation" value={`${me.reputation}%`} tone="accent" />
              <Stat label="Completed trades" value={me.completedTrades} />
              <Stat label="Verified cards" value={me.verifiedCards} />
              <Stat label="Collector level" value="24" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {me.badges.concat(["First Trade", "Gacha Puller", "Set Completionist"]).map((badge) => (
                <span key={badge} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white/[0.055] px-3 py-2 text-xs font-black text-white/70">
                  <Award size={14} className="text-volt" />
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <SectionHeader title="Public Binder" copy="For-trade cards, wishlist targets, locked favorites, and verified ownership proof are visible to other collectors." />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {publicCards.map((card) => (
                <CardTile key={card.id} card={card} />
              ))}
            </div>
          </div>
          <aside className="space-y-4">
            <WalletLink />
            <Panel title="Wishlist" icon={<Heart className="text-danger" size={20} />}>
              <p className="text-sm leading-6 text-white/58">Gengar VMAX alt art, Base Set holos, and clean alt-art chase cards.</p>
            </Panel>
            <Panel title="Trade History" icon={<History className="text-mint" size={20} />}>
              {reputationEvents.map((event) => (
                <div key={event.type} className="border-b border-line py-3 last:border-b-0">
                  <div className="flex justify-between text-sm font-black text-white">
                    <span>{event.type}</span>
                    <span className="text-mint">{event.points}</span>
                  </div>
                  <p className="mt-1 text-xs text-white/48">{event.reason}</p>
                </div>
              ))}
            </Panel>
            <Panel title="Collector Badges" icon={<Trophy className="text-volt" size={20} />}>
              <div className="grid grid-cols-2 gap-2">
                {[Star, BadgeCheck, Flame, Trophy].map((Icon, index) => (
                  <div key={index} className="grid min-h-20 place-items-center rounded-lg border border-line bg-white/[0.045] text-volt">
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
    <div className="glass rounded-2xl p-5">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h2 className="font-black text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}
