"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  ClipboardList,
  FileSpreadsheet,
  Gamepad2,
  Info,
  Loader2,
  PlugZap,
  Search,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Trash2,
  Upload,
  X
} from "lucide-react";
import { Button, PageShell, SectionHeader, Stat, cx } from "@/components/ui";
import { typePalette } from "@/lib/data";
import { saveStoredCardsToSupabase } from "@/lib/binder-db";
import { supabase } from "@/lib/supabase";
import {
  IMPORT_STORAGE_KEY,
  ImportStatus,
  MatchedRow,
  StoredCard,
  loadImported,
  matchRows,
  parseCsv,
  parsePaste,
  saveImported
} from "@/lib/import";
import { searchCards, TcgdexBrief } from "@/lib/tcgdex";

type Tab = "connect" | "csv" | "paste" | "scan" | "search";

const SAMPLE = `3 Charizard - Base Set - 4/102
1 Umbreon VMAX 215/203
2 Pikachu
1 Blastoise
1 Snorlax V
4 Magikarp`;

const statusOptions: { value: ImportStatus; label: string }[] = [
  { value: "owned", label: "Owned" },
  { value: "for_trade", label: "For Trade" },
  { value: "wishlist", label: "Wishlist" }
];

function Thumb({ src, alt, type }: { src?: string; alt: string; type?: MatchedRow["type"] }) {
  const palette = type ? typePalette[type] : null;
  if (!src) {
    return (
      <div className="grid aspect-[5/7] w-12 place-items-center rounded-md border border-white/12 bg-white/[0.04] text-white/30">
        <X size={16} />
      </div>
    );
  }
  return (
    <div className={cx("aspect-[5/7] w-12 overflow-hidden rounded-md ring-1 ring-inset", palette?.ring ?? "ring-white/15")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
    </div>
  );
}

export default function ImportPage() {
  const [tab, setTab] = useState<Tab>("connect");
  const [pocket, setPocket] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [rows, setRows] = useState<MatchedRow[]>([]);
  const [enriching, setEnriching] = useState(false);

  const [searchQ, setSearchQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<TcgdexBrief[]>([]);

  const [imported, setImported] = useState<StoredCard[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [saveMessage, setSaveMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImported(loadImported());
  }, []);

  const matchedCount = rows.filter((r) => r.imageUrl).length;
  const unmatchedCount = rows.filter((r) => !r.imageUrl).length;
  const totalCards = rows.filter((r) => r.imageUrl).reduce((sum, r) => sum + r.qty, 0);

  function ingest(parsed: ReturnType<typeof parsePaste>) {
    setSavedCount(0);
    setRows(matchRows(parsed));
  }

  function handleCsvFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => ingest(parseCsv(String(reader.result || "")));
    reader.readAsText(file);
  }

  async function autoMatchOnline() {
    setEnriching(true);
    const next = [...rows];
    for (let i = 0; i < next.length; i += 1) {
      if (next[i].imageUrl) continue;
      const hits = await searchCards(next[i].name, { pocket, limit: 1 });
      if (hits[0]) {
        next[i] = {
          ...next[i],
          matched: true,
          matchId: hits[0].id,
          matchName: hits[0].name,
          imageUrl: hits[0].image,
          source: "tcgdex"
        };
        setRows([...next]);
      }
    }
    setEnriching(false);
  }

  async function runSearch() {
    if (!searchQ.trim()) return;
    setSearching(true);
    setResults(await searchCards(searchQ, { pocket }));
    setSearching(false);
  }

  function addSearchResult(brief: TcgdexBrief) {
    setSavedCount(0);
    setRows((current) => [
      {
        raw: brief.name,
        qty: 1,
        name: brief.name,
        key: `search-${brief.id}-${Date.now()}`,
        matched: true,
        matchId: brief.id,
        matchName: brief.name,
        imageUrl: brief.image,
        status: "owned",
        source: "tcgdex"
      },
      ...current
    ]);
  }

  function updateRow(key: string, patch: Partial<MatchedRow>) {
    setRows((current) => current.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function removeRow(key: string) {
    setRows((current) => current.filter((r) => r.key !== key));
  }

  async function addToBinder() {
    const additions: StoredCard[] = rows
      .filter((r) => r.imageUrl)
      .map((r) => ({
        id: r.matchId ?? `import-${r.key}`,
        name: r.matchName ?? r.name,
        setName: r.setName ?? r.set ?? "",
        number: r.number,
        rarity: r.rarity,
        type: r.type,
        generation: "",
        imageUrl: r.imageUrl as string,
        status: r.status,
        qty: r.qty
      }));

    setSaving(true);
    const remote = await saveStoredCardsToSupabase(additions);
    setSaving(false);

    if (remote.saved) {
      setSavedCount(remote.count);
      setSaveMessage(`Added ${remote.count} cards to your online binder.`);
      setRows([]);
      setPasteText("");
      return;
    }

    const merged = new Map(imported.map((c) => [`${c.id}-${c.status}`, { ...c }]));
    for (const add of additions) {
      const k = `${add.id}-${add.status}`;
      const existing = merged.get(k);
      if (existing) existing.qty += add.qty;
      else merged.set(k, add);
    }
    const next = [...merged.values()];
    saveImported(next);
    setImported(next);
    setSavedCount(additions.reduce((sum, a) => sum + a.qty, 0));
    setSaveMessage(remote.reason ?? "Saved locally on this device.");
    setRows([]);
    setPasteText("");
  }

  function clearImported() {
    saveImported([]);
    setImported([]);
    setSavedCount(0);
  }

  const importedTotal = useMemo(() => imported.reduce((sum, c) => sum + c.qty, 0), [imported]);

  const tabs: { id: Tab; label: string; icon: typeof Upload }[] = [
    { id: "connect", label: "Connect source", icon: PlugZap },
    { id: "csv", label: "Upload export", icon: FileSpreadsheet },
    { id: "paste", label: "Paste export", icon: ClipboardList },
    { id: "scan", label: "Scan screenshot", icon: Camera },
    { id: "search", label: "Manual fallback", icon: Search }
  ];

  const connectedSources = [
    {
      name: "PTCG Live / pkmn.gg",
      detail: "Export or copy your online collection list, then RareRoom matches the cards in bulk.",
      icon: Gamepad2,
      action: "Paste export",
      tab: "paste" as Tab
    },
    {
      name: "TCG Pocket",
      detail: "Use Pocket mode for card matching, then paste or scan a collection screenshot.",
      icon: Smartphone,
      action: "Use Pocket mode",
      tab: "scan" as Tab,
      pocket: true
    },
    {
      name: "Collectr / Pokellector",
      detail: "Upload a CSV export from your collection tracker instead of entering cards one by one.",
      icon: FileSpreadsheet,
      action: "Upload CSV",
      tab: "csv" as Tab
    },
    {
      name: "Proof-backed imports",
      detail: "Attach receipts, screenshots, platform exports, or wallet signatures for authenticity after import.",
      icon: ShieldCheck,
      action: "Review proof flow",
      tab: "connect" as Tab
    }
  ];

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <SectionHeader
          title="Connect your collection"
          copy="Start from the places you already hold cards: PTCG Live, TCG Pocket, Collectr, Pokellector, CSV exports, or screenshots. RareRoom bulk-matches your collection first; manual card entry is only the fallback."
          action={
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white/[0.05] px-3 py-2 text-xs font-black text-white/72">
              <input type="checkbox" checked={pocket} onChange={(e) => setPocket(e.target.checked)} className="accent-volt" />
              TCG Pocket mode
            </label>
          }
        />

        <div className="mb-5 flex items-start gap-3 rounded-xl border border-line bg-white/[0.045] p-4 text-sm leading-6 text-[var(--muted)]">
          <Info size={18} className="mt-0.5 shrink-0 text-sky" />
          <p>
            Best path: connect a collection source by export, screenshot, or bulk list, then let RareRoom match everything automatically. Manual
            search is reserved for one-off corrections. Card data from{" "}
            <a href="https://tcgdex.dev" target="_blank" rel="noreferrer" className="font-black text-volt underline">
              TCGdex
            </a>{" "}
            includes TCG Pocket.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            {/* Source tabs */}
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
              {tabs.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={cx(
                      "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-black transition",
                      tab === t.id ? "bg-volt text-ink" : "bg-white/8 text-white/58 hover:text-white"
                    )}
                  >
                    <Icon size={15} />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Source panel */}
            <div className="glass rounded-2xl p-5">
              {tab === "connect" && (
                <div>
                  <div className="mb-5 max-w-2xl">
                    <h2 className="font-black text-white">Choose where your cards already live</h2>
                    <p className="mt-2 text-sm font-bold leading-6 text-white/52">
                      Prioritize source-backed imports so collectors can move an existing digital collection into RareRoom in minutes.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {connectedSources.map((source) => {
                      const Icon = source.icon;
                      return (
                        <button
                          key={source.name}
                          onClick={() => {
                            if (source.pocket) setPocket(true);
                            setTab(source.tab);
                          }}
                          className="group rounded-2xl border border-white/12 bg-white/[0.045] p-4 text-left transition hover:border-volt/55 hover:bg-white/[0.07]"
                        >
                          <div className="flex items-start gap-3">
                            <span className="grid size-10 shrink-0 place-items-center rounded-full border border-white/14 bg-white/[0.06] text-volt">
                              <Icon size={19} />
                            </span>
                            <div>
                              <h3 className="font-black text-white">{source.name}</h3>
                              <p className="mt-1 text-sm font-bold leading-5 text-white/52">{source.detail}</p>
                              <span className="mt-4 inline-flex rounded-full bg-volt px-3 py-1 text-xs font-black text-ink transition group-hover:-translate-y-0.5">
                                {source.action}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {tab === "paste" && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="font-black text-white">Paste an exported collection list</h2>
                    <button onClick={() => setPasteText(SAMPLE)} className="text-xs font-black text-volt hover:underline">
                      Use sample
                    </button>
                  </div>
                  <p className="mb-3 text-xs leading-5 text-white/48">
                    Paste from PTCG Live, pkmn.gg, TCG Pocket notes, or another tracker. One card per line; quantities and set/number are optional.
                  </p>
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder={SAMPLE}
                    className="min-h-44 w-full rounded-lg border border-line bg-white/[0.05] p-3 font-mono text-sm text-white outline-none placeholder:text-white/30"
                  />
                  <Button className="mt-3" onClick={() => ingest(parsePaste(pasteText))}>
                    <Sparkles size={16} />
                    Match cards
                  </Button>
                </div>
              )}

              {tab === "csv" && (
                <div>
                  <h2 className="mb-2 font-black text-white">Upload a collection export</h2>
                  <p className="mb-3 text-xs leading-5 text-white/48">
                    Works with Collectr, Pokellector, TCGplayer-style exports, and any tracker with Name, Set, Number, and Quantity columns.
                  </p>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex min-h-36 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/[0.03] text-sm font-black text-white/56 transition hover:border-volt/45 hover:text-volt"
                  >
                    <Upload size={22} />
                    Choose CSV file
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,text/csv,text/plain"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCsvFile(file);
                    }}
                  />
                </div>
              )}

              {tab === "search" && (
                <div>
                  <h2 className="mb-2 font-black text-white">Manual fallback search</h2>
                  <p className="mb-3 text-xs leading-5 text-white/48">
                    Use this only to fix a missing match or add a single card. Bulk source imports should be the default.
                  </p>
                  <div className="flex min-h-12 items-center gap-3 rounded-lg border border-line bg-white/[0.055] px-3">
                    <Search size={18} className="text-white/44" />
                    <input
                      value={searchQ}
                      onChange={(e) => setSearchQ(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && runSearch()}
                      placeholder={pocket ? "Search TCG Pocket cards…" : "Search any Pokémon card…"}
                      className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/36"
                    />
                    <button onClick={runSearch} className="text-xs font-black text-volt">
                      {searching ? <Loader2 size={16} className="animate-spin" /> : "Search"}
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {results.map((r) => (
                      <button key={r.id} onClick={() => addSearchResult(r)} className="group text-left">
                        <div className="aspect-[5/7] overflow-hidden rounded-md ring-1 ring-inset ring-white/15 transition group-hover:ring-volt/60">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={r.image} alt={r.name} loading="lazy" className="h-full w-full object-cover" />
                        </div>
                        <div className="mt-1 truncate text-[11px] font-bold text-white/70">{r.name}</div>
                      </button>
                    ))}
                    {!searching && results.length === 0 ? (
                      <p className="col-span-full text-sm text-white/40">Search only when a source import misses something.</p>
                    ) : null}
                  </div>
                </div>
              )}

              {tab === "scan" && (
                <div className="grid place-items-center py-10 text-center">
                  <Camera size={40} className="text-white/35" />
                  <h2 className="mt-4 text-lg font-black text-white">Scan to import</h2>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-white/52">
                    Point your camera at a card or a TCG Pocket collection screenshot and we&apos;ll recognize and match it. Coming next — the
                    pipeline reuses the same catalog matcher.
                  </p>
                  <span className="mt-4 rounded-lg bg-white/8 px-3 py-1.5 text-xs font-black text-white/55">Coming soon</span>
                </div>
              )}
            </div>

            {/* Matched rows */}
            {rows.length > 0 && (
              <div className="glass mt-5 rounded-2xl p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-black text-white">Review {rows.length} cards</h2>
                  <div className="flex items-center gap-2">
                    {unmatchedCount > 0 && (
                      <Button variant="secondary" onClick={autoMatchOnline} disabled={enriching}>
                        {enriching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                        Auto-match {unmatchedCount} online
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {rows.map((r) => (
                    <div key={r.key} className="flex items-center gap-3 rounded-lg border border-line bg-white/[0.035] p-2.5">
                      <Thumb src={r.imageUrl} alt={r.name} type={r.type} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-black text-white">{r.matchName ?? r.name}</span>
                          {r.imageUrl ? (
                            <BadgeCheck size={14} className="shrink-0 text-mint" />
                          ) : (
                            <span className="shrink-0 rounded bg-danger/15 px-1.5 py-0.5 text-[9px] font-black text-danger">No match</span>
                          )}
                        </div>
                        <div className="truncate text-xs text-white/45">
                          {[r.setName ?? r.set, r.number].filter(Boolean).join(" · ") || (r.imageUrl ? "Matched" : "Try auto-match or search")}
                        </div>
                      </div>
                      <input
                        type="number"
                        min={1}
                        value={r.qty}
                        onChange={(e) => updateRow(r.key, { qty: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                        className="w-14 rounded-md border border-line bg-white/[0.05] px-2 py-1 text-center text-sm font-bold text-white outline-none"
                      />
                      <select
                        value={r.status}
                        onChange={(e) => updateRow(r.key, { status: e.target.value as ImportStatus })}
                        className="rounded-md border border-line bg-ink px-2 py-1.5 text-xs font-bold text-white/72 outline-none"
                      >
                        {statusOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <button onClick={() => removeRow(r.key)} className="grid size-8 place-items-center rounded-md text-white/40 hover:bg-white/8 hover:text-danger">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white/[0.04] p-3 text-sm">
                  <div className="flex flex-wrap gap-4 font-bold text-white/60">
                    <span className="text-mint">{matchedCount} matched</span>
                    {unmatchedCount > 0 && <span className="text-danger">{unmatchedCount} unmatched</span>}
                    <span>{totalCards} cards total</span>
                  </div>
                <Button onClick={addToBinder} disabled={matchedCount === 0 || saving}>
                  <CheckCircle2 size={16} />
                    {saving ? "Saving..." : `Add ${totalCards} to binder`}
                </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right rail */}
          <aside className="space-y-4">
            {savedCount > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-mint/30 bg-mint/10 p-3 text-sm font-black text-mint">
                <CheckCircle2 size={18} />
                {saveMessage || `Added ${savedCount} cards to your binder.`}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Stat label="In your binder" value={importedTotal} tone="accent" />
              <Stat label="Staged" value={totalCards} />
            </div>

            <div className="glass rounded-2xl p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-black text-white">Imported collection</h3>
                {imported.length > 0 && (
                  <button onClick={clearImported} className="text-xs font-black text-white/45 hover:text-danger">
                    Clear
                  </button>
                )}
              </div>
              {imported.length === 0 ? (
                <p className="text-sm text-white/45">Nothing imported yet. Matched cards you add will be saved here (and to your binder).</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {imported.slice(0, 16).map((c) => (
                    <div key={`${c.id}-${c.status}`} className="relative aspect-[5/7] overflow-hidden rounded-md ring-1 ring-inset ring-white/12">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.imageUrl} alt={c.name} loading="lazy" className="h-full w-full object-cover" />
                      {c.qty > 1 && (
                        <span className="absolute bottom-0.5 right-0.5 rounded bg-ink/85 px-1 text-[9px] font-black text-volt">×{c.qty}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-3 text-[11px] leading-5 text-white/35">
                {supabase
                  ? "Signed-in imports save to your online binder. Guests keep a local copy on this device."
                  : `Saved to this device (${IMPORT_STORAGE_KEY}). Add Supabase env vars to enable online binders.`}
              </p>
            </div>

            <div className="glass rounded-2xl p-4">
              <h3 className="mb-2 font-black text-white">Supported sources</h3>
              <ul className="space-y-1.5 text-sm text-white/58">
                <li>Primary: PTCG Live / pkmn.gg collection export</li>
                <li>Primary: TCG Pocket screenshot or pasted list</li>
                <li>Primary: Collectr / Pokellector CSV export</li>
                <li>Primary: TCGplayer-style CSV export</li>
                <li>Fallback: manual TCGdex search for corrections</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}
