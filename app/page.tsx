import { ArrowRight, BookOpen, CheckCircle2, Gem, Search, ShieldCheck } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { AppPreview, Button, CardTile, PageShell, PokeballIcon, SparkleIcon } from "@/components/ui";
import { cards, featureCards } from "@/lib/data";

const steps = [
  { title: "Add your cards", copy: "Upload, import, or hand-add the cards already in your collection." },
  { title: "Verify ownership", copy: "Attach screenshots, imports, receipts, or an optional signature." },
  { title: "Propose swaps", copy: "Use wishlist matches and fair-value hints to build a clean trade." },
  { title: "Trade with proof", copy: "Both collectors approve, verification clears, the trade logs publicly." }
];

const featureTones = ["sky", "sun", "mint", "red"] as const;
const toneStyles = {
  sky: "border-[#7fd2f2] bg-[#e2f3fd] text-[var(--sky-deep)]",
  sun: "border-[#ffce56] bg-[#fff2cf] text-[var(--sun-deep)]",
  mint: "border-[#5fe0c2] bg-[#d7f7ee] text-[var(--mint)]",
  red: "border-[#ff9a9a] bg-[#ffe2e2] text-[var(--red)]"
};

export default function LandingPage() {
  const featured = cards.filter((card) => card.status === "for_trade").slice(0, 3);

  return (
    <PageShell>
      <section className="relative overflow-hidden">
        <div className="rr-dotfield" />
        <PokeballIcon size={64} className="rr-float absolute right-[6%] top-8 z-[1] hidden opacity-90 md:block" style={{ "--rot": "8deg" } as CSSProperties} />
        <SparkleIcon size={30} className="rr-twinkle absolute left-[44%] top-16 z-[1] hidden md:block" color="#ffc93c" />
        <SparkleIcon size={28} className="rr-twinkle absolute right-[30%] top-36 z-[1] hidden md:block" color="#74d4f4" />

        <div className="rr-wrap py-14 md:py-16">
          <div className="grid items-center gap-11 lg:grid-cols-[1.02fr_1fr]">
            <div>
              <span className="rr-chip">
                <PokeballIcon size={15} />
                Fan-made · collector-first
              </span>
              <h1 className="mt-5 max-w-3xl text-[clamp(38px,5.6vw,62px)] font-black leading-[1.04] text-[var(--navy)]">
                Trade verified cards,
                <br /> not <span className="text-[var(--sky)]">sketchy DMs.</span>
              </h1>
              <p className="mt-5 max-w-xl text-[18.5px] font-bold leading-[1.55] text-[var(--muted)]">
                Build your online binder, prove what you own, and swap with collectors who actually have what they say they have. Welcome to the room.
              </p>
              <div className="mt-7 flex flex-wrap gap-3.5">
                <Button href="/auth">
                  <PokeballIcon size={20} />
                  Start Your Binder
                  <ArrowRight size={19} />
                </Button>
                <Button href="/marketplace" variant="secondary">
                  <Search size={19} />
                  Browse Trades
                </Button>
              </div>
              <div className="mt-8 grid max-w-[460px] grid-cols-3 gap-3">
                <HeroStat value="118" label="Verified cards" color="text-[var(--sky)]" />
                <HeroStat value="47" label="Trusted trades" color="text-[var(--mint)]" />
                <HeroStat value="2" label="Wishlist matches" color="text-[var(--red)]" />
              </div>
            </div>
            <AppPreview />
          </div>
        </div>
      </section>

      <section className="relative py-16">
        <div className="rr-wrap">
          <SectionHead kicker="How it works" title="Build the binder, then swap with proof" copy="A simple collector flow: set up your shelf first, verify when it counts, then trade with zero guesswork." />
          <div className="grid gap-4 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.title} className="rr-panel-soft p-5">
                <div className="relative grid size-14 place-items-center">
                  <PokeballIcon size={54} />
                  <span className="absolute inset-0 grid place-items-center pt-5 font-display text-base font-black text-[var(--navy)]">{index + 1}</span>
                </div>
                <h3 className="mt-4 text-xl font-black text-[var(--navy)]">{step.title}</h3>
                <p className="mt-2 text-sm font-bold leading-6 text-[var(--muted)]">{step.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative pb-16">
        <div className="rr-wrap">
          <SectionHead kicker="Why collectors stay" title="The fun of trading, minus the risk" copy="RareRoom keeps the social buzz of the trade floor and adds proof, history, and safety rails that make swaps actually safe." />
          <div className="grid gap-4 md:grid-cols-4">
            {featureCards.map((feature, index) => {
              const Icon = feature.icon;
              const tone = featureTones[index % featureTones.length];
              return (
                <div key={feature.title} className="rr-panel p-5">
                  <span className={`grid size-14 place-items-center rounded-2xl border-2 ${toneStyles[tone]}`}>
                    <Icon size={26} />
                  </span>
                  <h3 className="mt-4 text-xl font-black text-[var(--navy)]">{feature.title}</h3>
                  <p className="mt-2 text-sm font-bold leading-6 text-[var(--muted)]">{feature.copy}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative pb-16">
        <div className="rr-wrap">
          <div className="grid items-start gap-7 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="rr-panel bg-gradient-to-br from-white to-[#f1f9ff] p-6">
              <span className="grid size-14 place-items-center rounded-2xl border-2 border-[var(--navy)] bg-[var(--sky-soft)] text-[var(--sky)]">
                <ShieldCheck size={28} />
              </span>
              <h2 className="mt-4 text-3xl font-black text-[var(--navy)]">Web3 proof, only if you want it</h2>
              <p className="mt-3 text-[15.5px] font-bold leading-6 text-[var(--muted)]">
                Most collectors just use email login, uploaded proof, and reputation. Wallet signatures and onchain receipts sit quietly in the background, there when a big trade needs extra trust.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <ProofMini icon={<CheckCircle2 size={20} />} title="Email-first" copy="No wallet to build, browse, chat, or trade." tone="mint" />
                <ProofMini icon={<Gem size={20} />} title="Proof receipts" copy="Optional signing for ownership or trades." tone="sun" />
              </div>
            </div>
            <div>
              <SectionHead title="Fresh on the trade floor" copy="Real cards, real proof, visible before anyone commits." />
              <div className="grid gap-4 sm:grid-cols-3">
                {featured.map((card) => (
                  <CardTile key={card.id} card={card} compact />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative pb-20">
        <div className="rr-wrap">
          <div className="rr-panel relative overflow-hidden rounded-[32px] border-[var(--navy)] bg-gradient-to-br from-[var(--sky)] to-[#1f8fd4] p-8 md:p-10">
            <PokeballIcon size={150} className="absolute -bottom-12 -right-8 opacity-30" />
            <SparkleIcon size={34} className="rr-twinkle absolute left-[42%] top-6" color="#fff" />
            <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div className="max-w-xl">
                <h2 className="text-[clamp(30px,4vw,44px)] font-black text-white">Open your binder.</h2>
                <p className="mt-3 text-[17px] font-bold leading-7 text-white/90">
                  Start collecting today. Add optional proof the moment a trade needs a little extra trust.
                </p>
              </div>
              <Button href="/auth">
                <BookOpen size={19} />
                Start Your Binder
                <ArrowRight size={19} />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function HeroStat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="rr-panel-soft rounded-2xl p-3.5">
      <div className={`font-display text-3xl font-black leading-none ${color}`}>{value}</div>
      <div className="mt-1.5 text-xs font-black text-[var(--muted)]">{label}</div>
    </div>
  );
}

function SectionHead({ kicker, title, copy }: { kicker?: string; title: string; copy?: string }) {
  return (
    <div className="mb-8 max-w-2xl">
      {kicker ? (
        <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[var(--sky)]">
          <SparkleIcon size={15} color="var(--sun)" />
          {kicker}
        </span>
      ) : null}
      <h2 className="mt-2 text-[clamp(28px,3.4vw,40px)] font-black leading-tight text-[var(--navy)]">{title}</h2>
      {copy ? <p className="mt-3 text-base font-bold leading-7 text-[var(--muted)]">{copy}</p> : null}
    </div>
  );
}

function ProofMini({ icon, title, copy, tone }: { icon: ReactNode; title: string; copy: string; tone: keyof typeof toneStyles }) {
  return (
    <div className={`rounded-2xl border-2 p-4 ${toneStyles[tone]}`}>
      {icon}
      <div className="mt-2 font-display text-base font-black text-[var(--navy)]">{title}</div>
      <p className="mt-1 text-xs font-bold leading-5 text-[var(--muted)]">{copy}</p>
    </div>
  );
}
