"use client";

import { useMemo, useRef, useState } from "react";
import { Archive, Flame, Gift, Repeat2, Sparkles, Star, Coins, History, Info } from "lucide-react";
import { Button, CardArt, PageShell, SectionHeader, Stat, cx } from "@/components/ui";
import {
  CollectorCard,
  PackRarity,
  PackTier,
  cards,
  gachaPool,
  packTiers,
  rarityRank,
  rarityStyle
} from "@/lib/data";

type Disposition = "keep" | "trade" | "burn" | "points";

type PulledCard = CollectorCard & {
  packRarity: PackRarity;
  isDuplicate: boolean;
  disposition: Disposition;
};

// Points awarded when a duplicate (or any card) is converted into platform points.
const pointsByRarity: Record<PackRarity, number> = {
  Common: 5,
  Uncommon: 12,
  Rare: 30,
  "Ultra Rare": 80,
  "Crown Rare": 200
};

function weightedPick(tier: PackTier): PackRarity {
  const total = Object.values(tier.weights).reduce((sum, w) => sum + w, 0);
  let roll = Math.random() * total;
  for (const [rarity, weight] of Object.entries(tier.weights) as [PackRarity, number][]) {
    roll -= weight;
    if (roll <= 0) return rarity;
  }
  return "Common";
}

function pullCard(tier: PackTier, id: string, ownedNames: Set<string>): PulledCard {
  const rarity = weightedPick(tier);
  const candidates = gachaPool.filter((entry) => entry.rarity === rarity);
  const entry = candidates[Math.floor(Math.random() * candidates.length)] ?? gachaPool[0];
  const isDuplicate = ownedNames.has(entry.name);
  return {
    id,
    name: entry.name,
    setName: entry.setName,
    cardNumber: entry.cardNumber,
    rarity: entry.rarity,
    type: entry.type,
    generation: entry.generation,
    condition: "Mint",
    language: "English",
    edition: "Pack Pull",
    isHolo: rarityRank[rarity] >= 2,
    status: "owned",
    verificationStatus: "unverified",
    estimatedValue: "—",
    owner: "You",
    imageUrl: entry.imageUrl,
    packRarity: rarity,
    isDuplicate,
    disposition: isDuplicate ? "points" : "keep"
  };
}

export default function GachaPage() {
  const [tier, setTier] = useState<PackTier>(packTiers[0]);
  const [opening, setOpening] = useState(false);
  const [pulls, setPulls] = useState<PulledCard[]>([]);
  const [revealed, setRevealed] = useState(0);
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState<{ rarity: PackRarity; name: string }[]>([]);
  const revealTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const bestPull = useMemo(
    () => pulls.reduce<PackRarity | null>((best, p) => (best === null || rarityRank[p.packRarity] > rarityRank[best] ? p.packRarity : best), null),
    [pulls]
  );

  function openPack() {
    if (opening) return;
    if (revealTimer.current) clearInterval(revealTimer.current);

    const seedNames = new Set(cards.filter((c) => c.owner === "You").map((c) => c.name));
    const next: PulledCard[] = [];
    for (let i = 0; i < tier.cardCount; i += 1) {
      const card = pullCard(tier, `pull-${Date.now()}-${i}`, seedNames);
      if (card.disposition === "keep") seedNames.add(card.name);
      next.push(card);
    }

    setPulls(next);
    setRevealed(0);
    setOpening(true);
    setHistory((h) => [...next.map((p) => ({ rarity: p.packRarity, name: p.name })), ...h].slice(0, 24));

    // Reveal cards one by one.
    revealTimer.current = setInterval(() => {
      setRevealed((count) => {
        const nextCount = count + 1;
        if (nextCount >= next.length) {
          if (revealTimer.current) clearInterval(revealTimer.current);
          setOpening(false);
        }
        return nextCount;
      });
    }, 420);
  }

  function setDisposition(id: string, disposition: Disposition) {
    setPulls((current) => current.map((p) => (p.id === id ? { ...p, disposition } : p)));
  }

  function confirmPulls() {
    const earned = pulls.filter((p) => p.disposition === "points").reduce((sum, p) => sum + pointsByRarity[p.packRarity], 0);
    setPoints((value) => value + earned);
    setPulls([]);
    setRevealed(0);
  }

  const allRevealed = pulls.length > 0 && revealed >= pulls.length;
  const keepCount = pulls.filter((p) => p.disposition === "keep").length;
  const tradeCount = pulls.filter((p) => p.disposition === "trade").length;
  const pointsPreview = pulls.filter((p) => p.disposition === "points").reduce((sum, p) => sum + pointsByRarity[p.packRarity], 0);

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <SectionHeader
          title="Pack Opening"
          copy="Open binder draft packs, reveal cards one by one, and decide what to keep, trade, archive, or convert to points."
          action={
            <div className="flex items-center gap-2 rounded-lg border border-[var(--sun)] bg-[#fff2cf] px-3 py-2 text-sm font-black text-[var(--sun-deep)]">
              <Coins size={16} />
              {points.toLocaleString()} points
            </div>
          }
        />

        <div className="mb-5 flex items-start gap-3 rounded-xl border border-[var(--line)] bg-[rgba(23,58,99,0.04)] p-4 text-sm leading-6 text-[var(--muted)]">
          <Info size={18} className="mt-0.5 shrink-0 text-[var(--sky-deep)]" />
          <p>
            <span className="font-black text-[var(--navy)]">Collector pack simulation.</span> These are simulated binder draft packs, not official Pokémon
            products. Pulls add fan-made collector cards to your binder for trading practice.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Pack picker */}
          <div className="space-y-4">
            <div className="glass rounded-2xl p-4">
              <h2 className="mb-3 font-black text-[var(--navy)]">Choose a pack</h2>
              <div className="space-y-3">
                {packTiers.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => !opening && setTier(option)}
                    className={cx(
                      "w-full rounded-xl border p-3 text-left transition",
                      tier.id === option.id ? "border-[var(--sun)] bg-[#fff2cf]" : "border-[var(--line)] bg-[rgba(23,58,99,0.04)] hover:border-[var(--line)]"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-[var(--navy)]">{option.name}</span>
                      <Gift size={18} className={tier.id === option.id ? "text-[var(--sun-deep)]" : "text-[var(--muted)]"} />
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)]">{option.subtitle}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(Object.entries(option.weights) as [PackRarity, number][])
                        .filter(([, w]) => w > 0)
                        .map(([rarity, w]) => {
                          const total = Object.values(option.weights).reduce((s, v) => s + v, 0);
                          return (
                            <span key={rarity} className={cx("rounded-md bg-[rgba(23,58,99,0.05)] px-1.5 py-0.5 text-[10px] font-black", rarityStyle[rarity].text)}>
                              {rarity} {((w / total) * 100).toFixed(rarity === "Crown Rare" || rarity === "Ultra Rare" ? 1 : 0)}%
                            </span>
                          );
                        })}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-4">
              <div className="mb-3 flex items-center gap-2">
                <History size={18} className="text-[var(--mint)]" />
                <h2 className="font-black text-[var(--navy)]">Pull history</h2>
              </div>
              {history.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No pulls yet. Open your first pack to start a history.</p>
              ) : (
                <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                  {history.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-[rgba(23,58,99,0.04)] px-3 py-2 text-xs">
                      <span className="truncate font-bold text-[var(--navy)]">{entry.name}</span>
                      <span className={cx("ml-2 shrink-0 font-black", rarityStyle[entry.rarity].text)}>{entry.rarity}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Opening stage */}
          <div className="glass min-h-[460px] rounded-2xl p-5">
            {pulls.length === 0 ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                <div className="pack-float relative grid place-items-center">
                  <div className={cx("grid aspect-[5/7] w-44 place-items-center rounded-2xl border border-[rgba(255,255,255,0.28)] bg-gradient-to-br p-4 shadow-card holo", tier.accent)}>
                    <Sparkles size={56} className="text-[#ffffff] drop-shadow" />
                  </div>
                </div>
                <h2 className="mt-6 text-2xl font-black text-[var(--navy)]">{tier.name}</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">{tier.subtitle}</p>
                <Button className="mt-6" onClick={openPack}>
                  <Sparkles size={17} />
                  Open pack
                </Button>
              </div>
            ) : (
              <div>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-[var(--navy)]">{opening ? "Revealing…" : "Your pulls"}</h2>
                    {allRevealed && bestPull ? (
                      <span className={cx("inline-flex items-center gap-1 rounded-md bg-[rgba(23,58,99,0.05)] px-2 py-1 text-xs font-black", rarityStyle[bestPull].text)}>
                        <Star size={12} />
                        Best: {bestPull}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-xs font-bold text-[var(--muted)]">
                    {Math.min(revealed, pulls.length)} / {pulls.length} revealed
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {pulls.map((card, index) => {
                    const isShown = index < revealed;
                    const style = rarityStyle[card.packRarity];
                    return (
                      <div key={card.id} className="space-y-2">
                        {isShown ? (
                          <div className={cx("reveal rounded-lg", style.glow)} style={{ animationDelay: "0ms" }}>
                            <div className={cx("rounded-lg ring-2", style.ring)}>
                              <CardArt card={card} />
                            </div>
                            <div className="mt-1.5 flex items-center justify-between gap-1">
                              <span className={cx("truncate text-[11px] font-black", style.text)}>{card.packRarity}</span>
                              {card.isDuplicate ? <span className="shrink-0 rounded bg-[rgba(23,58,99,0.06)] px-1 text-[9px] font-black text-[var(--muted)]">DUPE</span> : null}
                            </div>
                          </div>
                        ) : (
                          <div className="grid aspect-[5/7] place-items-center rounded-lg border border-[var(--line)] bg-[rgba(23,58,99,0.04)]">
                            <Sparkles size={22} className="animate-pulse text-[var(--muted)]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {allRevealed ? (
                  <div className="mt-6">
                    <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-[var(--muted)]">Handle duplicates & pulls</h3>
                    <div className="space-y-2">
                      {pulls.map((card) => (
                        <div key={card.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--line)] bg-[rgba(23,58,99,0.04)] px-3 py-2">
                          <div className="min-w-0">
                            <span className="truncate text-sm font-black text-[var(--navy)]">{card.name}</span>
                            <span className={cx("ml-2 text-xs font-bold", rarityStyle[card.packRarity].text)}>{card.packRarity}</span>
                            {card.isDuplicate ? <span className="ml-2 text-[10px] font-black text-[var(--muted)]">duplicate</span> : null}
                          </div>
                          <div className="flex gap-1">
                            {([
                              ["keep", "Keep", Archive],
                              ["trade", "Trade", Repeat2],
                              ["points", "Points", Coins],
                              ["burn", "Burn", Flame]
                            ] as [Disposition, string, typeof Archive][]).map(([value, label, Icon]) => (
                              <button
                                key={value}
                                onClick={() => setDisposition(card.id, value)}
                                className={cx(
                                  "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-black transition",
                                  card.disposition === value ? "bg-[var(--sun)] text-[var(--navy)]" : "bg-[rgba(23,58,99,0.05)] text-[var(--muted)] hover:text-[var(--navy)]"
                                )}
                              >
                                <Icon size={12} />
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[rgba(23,58,99,0.04)] p-3 text-sm">
                      <div className="flex flex-wrap gap-4 font-bold text-[var(--muted)]">
                        <span>{keepCount} kept</span>
                        <span>{tradeCount} for trade</span>
                        <span className="text-[var(--sun-deep)]">+{pointsPreview} points</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={openPack}>
                          <Sparkles size={15} />
                          Open another
                        </Button>
                        <Button onClick={confirmPulls}>Add to binder</Button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <Stat label="Best rarity" value={bestPull ?? "—"} tone="accent" />
          <Stat label="Cards this pack" value={pulls.length || tier.cardCount} />
          <Stat label="Session points" value={points} />
          <Stat label="History entries" value={history.length} />
        </div>
      </section>
    </PageShell>
  );
}
