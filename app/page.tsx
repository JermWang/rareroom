import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { AppPreview, Footer, TradeCycle3D } from "@/components/ui";

// Live market ticker — strictly high-value card price movement (up/down only).
const tickerItems: { name: string; value: string; delta: string; dir: "up" | "down" }[] = [
  { name: "Umbreon VMAX (Moonbreon)", value: "$560", delta: "8.4%", dir: "up" },
  { name: "Charizard · Base Set", value: "$420", delta: "3.1%", dir: "down" },
  { name: "Rayquaza VMAX Alt", value: "$215", delta: "5.7%", dir: "up" },
  { name: "Blastoise · Base Set", value: "$165", delta: "2.2%", dir: "down" },
  { name: "Charizard VMAX · Shining Fates", value: "$150", delta: "6.0%", dir: "up" },
  { name: "Venusaur · Base Set", value: "$128", delta: "1.4%", dir: "up" },
  { name: "Mewtwo · Base Set", value: "$98", delta: "2.6%", dir: "down" },
  { name: "Gengar VMAX Alt", value: "$64", delta: "4.8%", dir: "up" }
];

// Only collector-relevant integrations: card data sources + optional wallet proof.
const partnerBrands = [
  { name: "Pokémon TCG API", logo: "/images/brands/pokemon-tcg-api.png" },
  { name: "TCGdex", logo: "/images/brands/tcgdex.svg" },
  { name: "Phantom", logo: "/images/brands/phantom.svg" },
  { name: "Solana", logo: "/images/brands/solana.svg" },
  { name: "WalletConnect", logo: "/images/brands/walletconnect.svg" }
];

const trustLines = [
  { title: "Email-first accounts", copy: "Collectors can browse, import, and build a binder without a wallet." },
  { title: "Optional Web3 validation", copy: "Wallet signatures and onchain receipts stay available for higher-value swaps." },
  { title: "Public trade context", copy: "For-trade cards, wishlists, source status, and reputation sit in one profile." }
];

export default function LandingPage() {
  return (
    <div className="landing-page">
      <LandingNav />
      <main>
        <section className="strategy-hero">
          <LiveTicker />
          <div className="strategy-hero-inner">
            <div className="strategy-art" aria-hidden="true">
              <img src="/images/trainers-trading.png" alt="" />
            </div>

            <div className="strategy-copy">
              <h1>
                RARE
                <span>ROOM</span>
              </h1>
              <h2>Verified binders. Cleaner trades.</h2>
              <p className="strategy-lede">
                Import your collection, validate cards through trusted sources, and trade with collectors who show real ownership before anyone commits.
              </p>
              <div className="strategy-actions">
                <Link href="/auth" className="landing-btn landing-btn-primary">
                  Start your binder
                  <ArrowRight size={19} />
                </Link>
                <Link href="/marketplace" className="landing-btn landing-btn-secondary">
                  <Search size={18} />
                  Browse trades
                </Link>
              </div>
              <div className="strategy-flow" aria-label="RareRoom trade flow">
                <span>Cards imported</span>
                <ArrowRight size={16} />
                <span>Source validated</span>
                <ArrowRight size={16} />
                <span>Collectors matched</span>
              </div>
            </div>
          </div>
          <PartnerMarquee />
        </section>

        <section className="legacy-splash">
          <div className="landing-wrap legacy-splash-grid">
            <div>
              <h2>
                Trade verified cards,
                <br /> not sketchy DMs.
              </h2>
              <p>
                This is the original RareRoom promise, now placed beneath a cleaner front door: build the binder first, then verify and swap when it counts.
              </p>
              <div className="legacy-stats">
                <span>
                  <strong>118</strong>
                  Verified cards
                </span>
                <span>
                  <strong>47</strong>
                  Trusted trades
                </span>
                <span>
                  <strong>2</strong>
                  Wishlist matches
                </span>
              </div>
            </div>
            <div className="legacy-preview-frame">
              <AppPreview />
            </div>
          </div>
        </section>

        <section className="open-section">
          <div className="landing-wrap">
            <SectionIntro title="A calmer trade workflow" copy="RareRoom keeps the fun of a trade floor, but trims the uncertainty before cards change hands." />
            <TradeCycle3D />
          </div>
        </section>

        <section className="trust-section">
          <div className="landing-wrap trust-grid">
            <SectionIntro title="Trust signals without the clutter" copy="Profiles stay readable. Source status, availability, and history are visible where collectors actually make decisions." />
            <div className="trust-lines">
              {trustLines.map((line, index) => (
                <div key={line.title} className="trust-line">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{line.title}</h3>
                    <p>{line.copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-final">
          <div className="landing-wrap landing-final-inner">
            <h2>Open your binder.</h2>
            <p>Add cards today. Connect trusted validation when a trade needs it.</p>
            <Link href="/auth" className="landing-btn landing-btn-primary">
              Start your binder
              <ArrowRight size={19} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function LandingNav() {
  const nav = [
    { href: "/marketplace", label: "Swap Hub" },
    { href: "/binder", label: "Binder" },
    { href: "/import", label: "Import" }
  ];


  return (
    <header className="landing-nav">
      <Link href="/" className="landing-brand" aria-label="RareRoom home">
        <img src="/images/rareroom-logo-cropped.png" alt="RareRoom" />
      </Link>
      <nav aria-label="Primary navigation">
        {nav.map((item) => (
          <Link key={item.href} href={item.href} className={item.href === "/marketplace" ? "nav-swap" : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>
      <Link href="/auth" className="landing-nav-cta">
        Start
      </Link>
    </header>
  );
}

function LiveTicker() {
  const row = [...tickerItems, ...tickerItems, ...tickerItems];
  return (
    <div className="strategy-ticker" aria-label="RareRoom high-value card price ticker">
      <div className="strategy-ticker-track">
        {row.map((item, index) => (
          <span key={`${item.name}-${index}`}>
            <b>{item.name}</b>
            <strong>{item.value}</strong>
            <em style={{ color: item.dir === "up" ? "var(--mint)" : "var(--red)" }}>
              {item.dir === "up" ? "▲" : "▼"} {item.delta}
            </em>
          </span>
        ))}
      </div>
    </div>
  );
}

function PartnerMarquee() {
  // Triple so the seam never appears on wide screens; padding on each span (not gap)
  // ensures translateX(-33.333%) lands exactly at the loop point with no jump.
  const row = [...partnerBrands, ...partnerBrands, ...partnerBrands];
  return (
    <div className="partner-marquee" aria-hidden="true">
      <div className="partner-track">
        {row.map((brand, index) => (
          <span key={`${brand.name}-${index}`}>
            <img src={brand.logo} alt="" />
            {brand.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function SectionIntro({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="section-intro">
      <h2>{title}</h2>
      <p>{copy}</p>
    </div>
  );
}
