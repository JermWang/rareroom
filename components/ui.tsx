"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";
import { FloatingTradeChat } from "@/components/FloatingTradeChat";
import {
  BadgeCheck,
  Bell,
  CircleUserRound,
  Clock,
  LayoutDashboard,
  LogOut,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Store,
  TriangleAlert,
  UploadCloud,
  Wrench
} from "lucide-react";
import { cards, CollectorCard, collectors, isVerified, statusCopy, statusIcons, typePalette, verificationCopy } from "@/lib/data";
import { supabase } from "@/lib/supabase";

type TradeCycleStep = {
  title: string;
  copy: string;
  imageUrl: string;
};

const tradeCycleSteps: TradeCycleStep[] = [
  { title: "Import", copy: "Bring your cards into a clean binder first.", imageUrl: "/images/cards/charizard-base1-4.png" },
  { title: "Verify", copy: "Connect trusted source validation to cards that matter.", imageUrl: "/images/cards/blastoise-base1-2.png" },
  { title: "Swap", copy: "Spin through approved matches and build balanced offers.", imageUrl: "/images/cards/rayquaza-swsh7-218.png" },
  { title: "Record", copy: "Keep source status, receipts, and trade history visible.", imageUrl: "/images/cards/umbreon-swsh7-215.png" }
];

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
    { href: "/marketplace", label: "Swap Hub" },
    { href: "/binder", label: "Binder" },
    { href: "/import", label: "Import" }
  ];

  return (
    <header className="app-header sticky top-0 z-40">
      <div className="mx-auto grid h-[76px] max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 md:px-6">
        <Link href="/" className="flex items-center" aria-label="RareRoom home">
          <img src="/images/rareroom-logo-cropped.png" alt="RareRoom" className="h-12 w-auto" />
        </Link>
        <nav className="app-header-nav hidden items-center justify-self-center md:flex">
          {nav.map((item) => {
            const active = path === item.href || (item.href === "/marketplace" && path === "/swap");
            return item.href === "/marketplace" ? (
              <Link key={item.href} href={item.href} className={cx("nav-swap", active && "nav-swap-active")}>
                {item.label}
              </Link>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  "inline-flex items-center rounded-full px-3.5 py-2 text-[13px] font-black uppercase tracking-[0.08em] text-[var(--muted)] transition hover:text-[var(--navy)]",
                  active && "bg-white/70 text-[var(--navy)] shadow-sm"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <HeaderAuth />
      </div>
    </header>
  );
}

type SessionUser = { id: string; name: string; avatar?: string | null };

function HeaderAuth() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    let active = true;
    const apply = (u: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null) => {
      if (!u) {
        setUser(null);
        return;
      }
      const meta = (u.user_metadata ?? {}) as Record<string, string | undefined>;
      const name =
        meta.preferred_username || meta.user_name || meta.name || meta.full_name || (u.email ? u.email.split("@")[0] : "Collector");
      setUser({ id: u.id, name, avatar: meta.avatar_url || meta.picture || null });
    };
    supabase.auth.getUser().then(({ data }) => {
      if (active) {
        apply(data.user);
        setReady(true);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) apply(session?.user ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    setOpen(false);
    await supabase?.auth.signOut();
    setUser(null);
    window.location.href = "/";
  }

  if (ready && user) {
    return (
      <div className="relative flex items-center gap-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full border-2 border-[var(--navy)] bg-white py-1 pl-1 pr-2.5 text-[var(--navy)] shadow-card"
        >
          {user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar} alt="" className="size-8 rounded-full object-cover" />
          ) : (
            <span className="grid size-8 place-items-center rounded-full bg-[var(--sky-soft)] text-xs font-black">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="hidden max-w-[120px] truncate text-sm font-black sm:block">{user.name}</span>
        </button>
        {open ? (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-12 z-50 w-44 overflow-hidden rounded-xl border-2 border-[var(--navy)] bg-white shadow-card">
              <Link href="/profile" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm font-black text-[var(--navy)] hover:bg-[var(--sky-soft)]">
                My profile
              </Link>
              <Link href="/binder" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm font-black text-[var(--navy)] hover:bg-[var(--sky-soft)]">
                My binder
              </Link>
              <button
                onClick={signOut}
                className="flex w-full items-center gap-2 border-t-2 border-[var(--line)] px-4 py-2.5 text-left text-sm font-black text-[var(--red)] hover:bg-[#fdecec]"
              >
                <LogOut size={15} /> Sign out
              </button>
            </div>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button href="/auth" variant="primary" className="hidden min-h-9 px-3.5 text-xs sm:inline-flex">
        <PokeballIcon size={18} />
        Start Your Binder
      </Button>
      <Link
        className="grid size-11 place-items-center rounded-full border-2 border-[var(--navy)] bg-white text-[var(--navy)] shadow-card"
        href="/auth"
        aria-label="Sign in"
      >
        <CircleUserRound size={19} />
      </Link>
    </div>
  );
}

export function MobileNav() {
  const path = usePathname();
  const items = [
    { href: "/marketplace", label: "Swap Hub", icon: Store },
    { href: "/binder", label: "Binder", icon: LayoutDashboard },
    { href: "/import", label: "Import", icon: UploadCloud }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-[var(--line)] bg-[#f8fcff]/92 backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active = path === item.href || (item.href === "/marketplace" && path === "/swap");
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
    <div className="app-shell">
      <Header />
      <main className="pb-24 md:pb-10">{children}</main>
      <MobileNav />
      <FloatingTradeChat />
      <Footer />
    </div>
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
    <div className="section-header mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h2 className="text-3xl font-black tracking-normal text-[var(--navy)] md:text-5xl">{title}</h2>
        {copy ? <p className="mt-3 max-w-3xl break-words text-[15px] font-extrabold leading-7 text-[var(--muted)]">{copy}</p> : null}
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
    <div
      onMouseMove={moveHolo}
      className={cx(
        "holo relative aspect-[5/7] overflow-hidden rounded-[13px] border border-[rgba(23,58,99,0.16)] bg-white ring-1 ring-inset shadow-[0_18px_42px_-30px_rgba(15,41,73,0.62)]",
        palette.ring,
        palette.glow,
        large && "rounded-[20px]"
      )}
    >
      <img
        src={card.imageUrl}
        alt={`${card.name} — ${card.setName} ${card.cardNumber}`}
        loading="eager"
        decoding="sync"
        className="rr-card-art-img absolute inset-0 h-full w-full object-cover"
      />
      {isVerified(card.verificationStatus) ? (
        <span className="absolute right-2 top-2 z-10 grid size-7 place-items-center rounded-full border-2 border-[var(--navy)] bg-white shadow-card">
          <BadgeCheck className="text-[var(--mint)]" size={large ? 18 : 15} />
        </span>
      ) : null}
    </div>
  );
}

// Quiet inline status — muted text + a distinguishing icon (no pill chrome).
export function StatusBadge({ status }: { status: CollectorCard["status"] }) {
  const Icon = statusIcons[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[var(--muted)]">
      <Icon size={12} strokeWidth={2.4} />
      {statusCopy[status]}
    </span>
  );
}

// Quiet inline verification — color-coded trust signal (no pill chrome).
export function VerificationBadge({ status }: { status: CollectorCard["verificationStatus"] }) {
  const map = {
    unverified: { color: "text-[var(--muted)]", Icon: ShieldCheck },
    pending: { color: "text-[var(--sun-deep)]", Icon: Clock },
    verified: { color: "text-[#0f9e78]", Icon: BadgeCheck },
    wallet_verified: { color: "text-[#7c3aed]", Icon: ShieldCheck },
    disputed: { color: "text-[var(--red)]", Icon: TriangleAlert }
  }[status];
  const Icon = map.Icon;
  return (
    <span className={cx("inline-flex items-center gap-1.5 text-[11.5px] font-bold", map.color)}>
      <Icon size={13} strokeWidth={2.4} />
      {verificationCopy[status]}
    </span>
  );
}

// Tint the rarity label by collector tier for a more official, premium read.
function rarityAccentClass(rarity: string): string {
  const r = rarity.toLowerCase();
  if (/secret|rainbow|crown|alt art|special|gold|shiny/.test(r)) return "text-[#7c3aed]";
  if (/ultra|vmax|vstar|\bex\b|\bgx\b|full art|legendary/.test(r)) return "text-[var(--sun-deep)]";
  if (/holo/.test(r)) return "text-[var(--sky-deep)]";
  if (/rare/.test(r)) return "text-[var(--sky-deep)]";
  if (/uncommon/.test(r)) return "text-[#0f9e78]";
  return "text-[var(--muted)]";
}

export function CardTile({ card, compact = false, onStatusChange }: { card: CollectorCard; compact?: boolean; onStatusChange?: (status: CollectorCard["status"]) => void }) {
  const className = "rr-card-shell group";
  const inner = (
    <>
      <div className="rr-card-media">
        <CardArt card={card} />
        {card.imported ? (
          <span className="absolute left-5 top-5 rounded-full border border-[rgba(23,58,99,0.18)] bg-white/90 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-[var(--navy)] shadow-sm">
            Imported
          </span>
        ) : null}
      </div>
      <div className="rr-card-body">
        <div className="flex items-baseline justify-between gap-2.5">
          <h3 className="rr-card-title min-w-0 flex-1 truncate">{card.name}</h3>
          <span className="rr-card-value shrink-0">{card.estimatedValue}</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="rr-card-subtitle min-w-0 truncate">
            {card.setName} · {card.cardNumber}
          </p>
          {!card.imported && card.rarity ? (
            <span className={cx("shrink-0 text-[10px] font-black uppercase tracking-[0.05em]", rarityAccentClass(card.rarity))}>
              {card.rarity}
            </span>
          ) : null}
        </div>
        {!compact ? (
          <div className="mt-3 flex items-center justify-between gap-2">
            <VerificationBadge status={card.verificationStatus} />
            {onStatusChange ? (
              <select
                value={card.status}
                onChange={(e) => onStatusChange(e.target.value as CollectorCard["status"])}
                onClick={(e) => e.stopPropagation()}
                className="rr-card-status-select"
              >
                <option value="owned">Owned</option>
                <option value="for_trade">For Trade</option>
                <option value="wishlist">Wishlist</option>
                <option value="locked">Locked</option>
              </select>
            ) : (
              <StatusBadge status={card.status} />
            )}
          </div>
        ) : null}
      </div>
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
    <div className="glass rr-app-preview relative rounded-[28px] p-4 md:p-5">
      <div className="rr-app-preview-header mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5 text-sm font-black text-[var(--navy)]">
          <span className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-[var(--navy)] bg-[var(--sky-soft)] text-xs font-black shadow-card">MM</span>
          <span className="truncate">MiraMint&apos;s Binder</span>
        </div>
        <span className="rr-chip shrink-0 bg-[var(--mint)] text-white">
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
        <MiniProof tone="mint" title="Source verified" copy="Trade badge active" />
        <MiniProof tone="sun" title="Wishlist match" copy="2 cards found" />
        <MiniProof tone="sky" title="Fair swap" copy="Values balanced" />
      </div>
    </div>
  );
}

export function TradeCycle3D() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const targetRotationRef = useRef(0);
  const dragStartRef = useRef<{ x: number; rotation: number } | null>(null);
  const interactionRef = useRef(0);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let cancelled = false;
    let cleanup = () => {};

    async function initScene() {
      const THREE = await import("three");
      if (cancelled || !mount) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      camera.position.set(0, 0.38, 6.4);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      mount.appendChild(renderer.domElement);

      const group = new THREE.Group();
      group.position.y = 0;
      scene.add(group);

      const ambient = new THREE.AmbientLight(0xffffff, 1.5);
      scene.add(ambient);
      const keyLight = new THREE.DirectionalLight(0xffffff, 2.15);
      keyLight.position.set(3, 4, 6);
      scene.add(keyLight);
      const rimLight = new THREE.DirectionalLight(0x74d4f4, 1.4);
      rimLight.position.set(-4, 2, -3);
      scene.add(rimLight);

      const loader = new THREE.TextureLoader();
      loader.crossOrigin = "anonymous";
      const radius = 3.05;
      const cardWidth = 1.35;
      const cardHeight = 1.88;
      const segment = (Math.PI * 2) / tradeCycleSteps.length;

      tradeCycleSteps.forEach((step, index) => {
        const texture = loader.load(step.imageUrl);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

        const material = new THREE.MeshPhysicalMaterial({
          map: texture,
          roughness: 0.35,
          metalness: 0.02,
          clearcoat: 0.85,
          clearcoatRoughness: 0.18,
          side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(cardWidth, cardHeight, 18, 18), material);
        const angle = index * segment;
        mesh.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius);
        mesh.rotation.y = angle;
        group.add(mesh);
      });

      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      interactionRef.current = performance.now();

      function resize() {
        if (!mount) return;
        const width = mount.clientWidth;
        const height = mount.clientHeight;
        const sceneScale = width < 520 ? 0.68 : width < 900 ? 0.82 : 1;
        group.scale.setScalar(sceneScale);
        group.position.y = 0;
        camera.aspect = width / Math.max(height, 1);
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      }

      function updateActive(rotation: number) {
        const raw = Math.round(-rotation / segment);
        const next = ((raw % tradeCycleSteps.length) + tradeCycleSteps.length) % tradeCycleSteps.length;
        setActiveStep((current) => (current === next ? current : next));
      }

      let animationFrame = 0;
      const animate = () => {
        const now = performance.now();
        if (!prefersReducedMotion && now - interactionRef.current > 2600) {
          targetRotationRef.current -= 0.0035;
        }

        group.rotation.y += (targetRotationRef.current - group.rotation.y) * 0.08;
        updateActive(group.rotation.y);
        renderer.render(scene, camera);
        animationFrame = requestAnimationFrame(animate);
      };

      const onWheel = (event: WheelEvent) => {
        event.preventDefault();
        interactionRef.current = performance.now();
        targetRotationRef.current -= event.deltaY * 0.004;
      };

      const onPointerDown = (event: PointerEvent) => {
        interactionRef.current = performance.now();
        dragStartRef.current = { x: event.clientX, rotation: targetRotationRef.current };
        mount.setPointerCapture(event.pointerId);
      };

      const onPointerMove = (event: PointerEvent) => {
        const start = dragStartRef.current;
        if (!start) return;
        interactionRef.current = performance.now();
        targetRotationRef.current = start.rotation + (event.clientX - start.x) * 0.012;
      };

      const onPointerUp = (event: PointerEvent) => {
        dragStartRef.current = null;
        if (mount.hasPointerCapture(event.pointerId)) {
          mount.releasePointerCapture(event.pointerId);
        }
        const snapped = Math.round(targetRotationRef.current / segment) * segment;
        targetRotationRef.current = snapped;
      };

      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(mount);
      mount.addEventListener("wheel", onWheel, { passive: false });
      mount.addEventListener("pointerdown", onPointerDown);
      mount.addEventListener("pointermove", onPointerMove);
      mount.addEventListener("pointerup", onPointerUp);
      mount.addEventListener("pointercancel", onPointerUp);
      resize();
      animate();

      cleanup = () => {
        cancelAnimationFrame(animationFrame);
        resizeObserver.disconnect();
        mount.removeEventListener("wheel", onWheel);
        mount.removeEventListener("pointerdown", onPointerDown);
        mount.removeEventListener("pointermove", onPointerMove);
        mount.removeEventListener("pointerup", onPointerUp);
        mount.removeEventListener("pointercancel", onPointerUp);
        renderer.dispose();
        group.traverse((object) => {
          const mesh = object as import("three").Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          const material = mesh.material;
          if (Array.isArray(material)) {
            material.forEach((item) => item.dispose());
          } else if (material) {
            material.dispose();
          }
        });
        renderer.domElement.remove();
      };
    }

    initScene();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  function rotateToStep(index: number) {
    const segment = (Math.PI * 2) / tradeCycleSteps.length;
    interactionRef.current = performance.now();
    targetRotationRef.current = -index * segment;
    setActiveStep(index);
  }

  return (
    <div className="trade-cycle">
      <div className="trade-cycle-steps" aria-label="RareRoom trade workflow cycle">
        {tradeCycleSteps.map((step, index) => (
          <button
            key={step.title}
            type="button"
            className={cx("trade-cycle-step", activeStep === index && "trade-cycle-step-active")}
            onClick={() => rotateToStep(index)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{step.title}</strong>
            <em>{step.copy}</em>
          </button>
        ))}
      </div>
      <div className="trade-cycle-stage" ref={mountRef} role="img" aria-label="A rotating 3D wheel of Pokemon cards representing the trade workflow" />
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

export function CollectorRow({ name = collectors[0].username, compact = false }: { name?: string; compact?: boolean }) {
  const collector = collectors.find((item) => item.username === name) ?? collectors[0];
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 min-w-0">
        <div className="grid size-6 shrink-0 place-items-center rounded-full border border-[var(--navy)] bg-[var(--sun)] text-[9px] font-black text-[var(--navy)]">{collector.avatar}</div>
        <span className="truncate text-xs font-black text-[var(--navy)]">{collector.username}</span>
      </div>
    );
  }
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
        <h3 className="font-black text-[var(--navy)]">Trust Feed</h3>
        <Bell size={17} className="text-[var(--muted)]" />
      </div>
      <div className="space-y-3">
        {cards.slice(0, 4).map((card) => (
          <div key={card.id} className="rounded-[16px] border-2 border-[var(--line)] bg-[rgba(23,58,99,0.04)] p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-black text-[var(--navy)]">{card.name}</span>
              <VerificationBadge status={card.verificationStatus} />
            </div>
            <p className="mt-1 text-xs font-bold text-[var(--muted)]">{card.owner} updated source status.</p>
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
