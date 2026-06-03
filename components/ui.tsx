"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CSSProperties, ReactNode } from "react";
import {
  BadgeCheck,
  Bell,
  CircleUserRound,
  LayoutDashboard,
  MessageSquare,
  Search,
  SlidersHorizontal,
  Sparkles,
  Store,
  UserRound,
  Wrench,
  Zap
} from "lucide-react";
import { cards, CollectorCard, collectors, isVerified, statusCopy, statusIcons, typePalette, verificationCopy } from "@/lib/data";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function PokeballIcon({ size = 28, className, style }: { size?: number; className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <circle cx="50" cy="50" r="46" fill="#fff" stroke="#173a63" strokeWidth="6" />
      <path d="M5 50a45 45 0 0 1 90 0Z" fill="#ee4d4d" stroke="#173a63" strokeWidth="6" strokeLinejoin="round" />
      <line x1="6" y1="50" x2="33" y2="50" stroke="#173a63" strokeWidth="6" strokeLinecap="round" />
      <line x1="67" y1="50" x2="94" y2="50" stroke="#173a63" strokeWidth="6" strokeLinecap="round" />
      <circle cx="50" cy="50" r="15" fill="#fff" stroke="#173a63" strokeWidth="6" />
      <circle cx="50" cy="50" r="5.5" fill="#fff" stroke="#173a63" strokeWidth="4" />
    </svg>
  );
}

export function SparkleIcon({ size = 22, className, style, color = "#74d4f4" }: { size?: number; className?: string; style?: CSSProperties; color?: string }) {
  return (
    <svg className={className} style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 1.5c.6 4.9 2.6 6.9 7.5 7.5-4.9.6-6.9 2.6-7.5 7.5-.6-4.9-2.6-6.9-7.5-7.5 4.9-.6 6.9-2.6 7.5-7.5Z"
        fill={color}
        stroke="#173a63"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Button({
  children,
  href,
  variant = "primary",
  className,
  onClick,
  type = "button",
  disabled
}: {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const styles = cx(
    "rr-btn",
    variant === "primary" && "rr-btn-primary",
    variant === "secondary" && "rr-btn-secondary",
    variant === "ghost" && "rr-btn-ghost",
    disabled && "cursor-not-allowed opacity-50",
    className
  );

  if (href) {
    return (
      <Link className={styles} href={href}>
        {children}
      </Link>
    );
  }

  return (
    <button className={styles} onClick={onClick} type={type} disabled={disabled}>
      {children}
    </button>
  );
}

export function Header() {
  const path = usePathname();
  const nav = [
    { href: "/binder", label: "Binder" },
    { href: "/import", label: "Import" },
    { href: "/marketplace", label: "Marketplace" },
    { href: "/swap", label: "Swap" },
    { href: "/gacha", label: "Packs" },
    { href: "/verification", label: "Verify" }
  ];

  return (
    <header className="sticky top-0 z-40 border-b-2 border-[var(--line)] bg-[#f8fcff]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center">
          <img src="/images/rareroom-logo-cropped.png" alt="RareRoom" className="h-12 w-auto" />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "rounded-full px-3.5 py-2 text-[14.5px] font-black text-[var(--muted)] transition hover:bg-[rgba(23,58,99,0.06)] hover:text-[var(--navy)]",
                path === item.href && "bg-[var(--sky-soft)] text-[var(--navy)]"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button href="/auth" variant="primary" className="hidden min-h-10 px-4 text-sm sm:inline-flex">
            <PokeballIcon size={18} />
            Start Your Binder
          </Button>
          <Link className="grid size-11 place-items-center rounded-full border-2 border-[var(--navy)] bg-white text-[var(--navy)] shadow-card" href="/profile">
            <CircleUserRound size={19} />
          </Link>
        </div>
      </div>
    </header>
  );
}

export function MobileNav() {
  const path = usePathname();
  const items = [
    { href: "/binder", label: "Binder", icon: LayoutDashboard },
    { href: "/marketplace", label: "Trades", icon: Store },
    { href: "/swap", label: "Swap", icon: Zap },
    { href: "/messages", label: "Chat", icon: MessageSquare },
    { href: "/profile", label: "Me", icon: UserRound }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-[var(--line)] bg-[#f8fcff]/92 backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = path === item.href;
          return (
            <Link key={item.href} href={item.href} className={cx("flex flex-col items-center gap-1 px-2 py-2 text-[11px] font-black", active ? "text-[var(--red)]" : "text-[var(--muted)]")}>
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="pb-24 md:pb-10">{children}</main>
      <MobileNav />
      <Footer />
    </>
  );
}

export function Footer() {
  return (
    <footer className="border-t-2 border-[var(--line)] px-4 py-8 text-center text-xs font-bold leading-6 text-[var(--muted)] md:px-6">
      Unofficial fan-made collector platform. Not affiliated with Nintendo, Game Freak, Creatures Inc., or The Pokémon Company.
    </footer>
  );
}

export function SectionHeader({ title, copy, action }: { title: string; copy?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <h2 className="text-2xl font-black tracking-normal text-[var(--navy)] md:text-3xl">{title}</h2>
        {copy ? <p className="mt-2 max-w-2xl break-words text-sm font-bold leading-6 text-[var(--muted)]">{copy}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Stat({ label, value, tone = "normal" }: { label: string; value: string | number; tone?: "normal" | "accent" }) {
  return (
    <div className="rr-panel-soft p-4">
      <div className={cx("font-display text-3xl font-black", tone === "accent" ? "text-[var(--accent-deep)]" : "text-[var(--navy)]")}>{value}</div>
      <div className="mt-1 text-xs font-black uppercase text-[var(--muted)]">{label}</div>
    </div>
  );
}

export function CardArt({ card, large = false }: { card: CollectorCard; large?: boolean }) {
  const palette = typePalette[card.type] ?? typePalette.Colorless;
  function moveHolo(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--hx", `${((event.clientX - rect.left) / rect.width) * 100}%`);
    event.currentTarget.style.setProperty("--hy", `${((event.clientY - rect.top) / rect.height) * 100}%`);
  }

  return (
    <div onMouseMove={moveHolo} className={cx("holo relative aspect-[5/7] overflow-hidden rounded-[14px] border-2 border-[var(--navy)] bg-[var(--sky-soft)] ring-1 ring-inset", palette.ring, palette.glow, large && "rounded-[22px]")}>
      <img
        src={card.imageUrl}
        alt={`${card.name} — ${card.setName} ${card.cardNumber}`}
        loading="eager"
        decoding="sync"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {isVerified(card.verificationStatus) ? (
        <span className="absolute right-2 top-2 z-10 grid size-7 place-items-center rounded-full border-2 border-[var(--navy)] bg-white shadow-card">
          <BadgeCheck className="text-[var(--mint)]" size={large ? 18 : 15} />
        </span>
      ) : null}
    </div>
  );
}

export function StatusBadge({ status }: { status: CollectorCard["status"] }) {
  const Icon = statusIcons[status];
  const tone = {
    owned: "border-[var(--navy)] bg-[var(--sky-soft)] text-[var(--sky-deep)]",
    for_trade: "border-[var(--navy)] bg-[var(--sun)] text-[var(--navy)]",
    wishlist: "border-[var(--navy)] bg-[#ffe2e2] text-[var(--red)]",
    locked: "border-[var(--navy)] bg-white text-[var(--muted)]"
  }[status];

  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full border-2 px-2 py-1 text-[11px] font-black", tone)}>
      <Icon size={12} />
      {statusCopy[status]}
    </span>
  );
}

export function VerificationBadge({ status }: { status: CollectorCard["verificationStatus"] }) {
  const tone = {
    unverified: "border-[var(--navy)] bg-white text-[var(--muted)]",
    pending: "border-[var(--navy)] bg-[#fff2cf] text-[var(--sun-deep)]",
    verified: "border-[var(--navy)] bg-[#d7f7ee] text-[var(--mint)]",
    wallet_verified: "border-[var(--navy)] bg-[#ece3ff] text-[#7c3aed]",
    disputed: "border-[var(--navy)] bg-[#ffe2e2] text-[var(--red)]"
  }[status];
  return <span className={cx("rounded-full border-2 px-2 py-1 text-[11px] font-black", tone)}>{verificationCopy[status]}</span>;
}

export function CardTile({ card, compact = false }: { card: CollectorCard; compact?: boolean }) {
  const className = "group block rounded-[22px] border-2 border-[var(--navy)] bg-white p-3 shadow-card transition hover:-translate-y-1 hover:shadow-pop";
  const inner = (
    <>
      <div className="relative">
        <CardArt card={card} />
        {card.imported ? (
          <span className="absolute left-2 top-2 rounded-full border-2 border-[var(--navy)] bg-[var(--sun)] px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-[var(--navy)]">
            Imported
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-black text-[var(--navy)]">{card.name}</h3>
          <p className="mt-1 truncate text-xs font-bold text-[var(--muted)]">{card.setName}</p>
        </div>
        <span className="shrink-0 text-xs font-black text-[var(--sun-deep)]">{card.estimatedValue}</span>
      </div>
      {!compact ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge status={card.status} />
          <VerificationBadge status={card.verificationStatus} />
        </div>
      ) : null}
    </>
  );

  if (card.imported) {
    return <div className={className}>{inner}</div>;
  }
  return (
    <Link href={`/card/${card.id}`} className={className}>
      {inner}
    </Link>
  );
}

export function SearchBar({ placeholder = "Search cards, sets, collectors" }: { placeholder?: string }) {
  return (
    <div className="flex min-h-12 items-center gap-3 rounded-full border-2 border-[var(--navy)] bg-white px-4 shadow-card">
      <Search size={18} className="text-[var(--muted)]" />
      <input className="w-full bg-transparent text-sm font-extrabold text-[var(--navy)] outline-none placeholder:text-[var(--muted)]" placeholder={placeholder} />
      <SlidersHorizontal size={18} className="text-[var(--muted)]" />
    </div>
  );
}

export function AppPreview() {
  const preview = cards.slice(0, 6);
  return (
    <div className="rr-panel relative rotate-[-1.2deg] overflow-hidden rounded-[34px] p-4">
      <SparkleIcon size={26} className="rr-twinkle absolute -left-3 bottom-16 z-10" color="#ffc93c" />
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-black text-[var(--navy)]">
          <span className="grid size-8 place-items-center rounded-full border-2 border-[var(--navy)] bg-[var(--sky-soft)] text-xs font-black">MM</span>
          MiraMint&apos;s Binder
        </div>
        <span className="rr-chip bg-[var(--mint)] text-white">
          <BadgeCheck size={13} />
          12 verified
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {preview.map((card) => (
          <CardArt key={card.id} card={card} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <MiniProof tone="mint" title="Verified owner" copy="Proof badge active" />
        <MiniProof tone="sun" title="Wishlist match" copy="2 cards found" />
        <MiniProof tone="sky" title="Fair swap" copy="Values balanced" />
      </div>
    </div>
  );
}

function MiniProof({ tone, title, copy }: { tone: "mint" | "sun" | "sky"; title: string; copy: string }) {
  const styles = {
    mint: "border-[#5fe0c2] bg-[#d7f7ee] text-[var(--mint)]",
    sun: "border-[#ffce56] bg-[#fff2cf] text-[var(--sun-deep)]",
    sky: "border-[#7fd2f2] bg-[#e2f3fd] text-[var(--sky-deep)]"
  }[tone];
  return (
    <div className={cx("rounded-[13px] border-2 p-2.5", styles)}>
      <div className="text-[11px] font-black">{title}</div>
      <div className="mt-0.5 text-[10px] font-bold text-[var(--muted)]">{copy}</div>
    </div>
  );
}

export function CollectorRow({ name = collectors[0].username }: { name?: string }) {
  const collector = collectors.find((item) => item.username === name) ?? collectors[0];
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-11 place-items-center rounded-full border-2 border-[var(--navy)] bg-[var(--sun)] text-sm font-black text-[var(--navy)]">{collector.avatar}</div>
      <div>
        <div className="font-black text-[var(--navy)]">{collector.username}</div>
        <div className="text-xs font-bold text-[var(--muted)]">
          {collector.reputation}% rep · {collector.completedTrades} trades
        </div>
      </div>
    </div>
  );
}

export function ActivityRail() {
  return (
    <aside className="glass rounded-[26px] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-black text-[var(--navy)]">Live Trust Feed</h3>
        <Bell size={17} className="text-[var(--muted)]" />
      </div>
      <div className="space-y-3">
        {cards.slice(0, 4).map((card) => (
          <div key={card.id} className="rounded-[16px] border-2 border-[var(--line)] bg-[rgba(23,58,99,0.04)] p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-black text-[var(--navy)]">{card.name}</span>
              <VerificationBadge status={card.verificationStatus} />
            </div>
            <p className="mt-1 text-xs font-bold text-[var(--muted)]">{card.owner} updated proof status.</p>
          </div>
        ))}
      </div>
      <Button href="/admin" variant="secondary" className="mt-4 w-full">
        <Wrench size={16} />
        Review queue
      </Button>
    </aside>
  );
}
