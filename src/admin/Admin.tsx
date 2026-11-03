import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  Clapperboard,
  Database,
  Download,
  FileJson,
  Film,
  Inbox,
  KeyRound,
  Link2,
  ListPlus,
  LogOut,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  Tv,
  Upload,
} from "lucide-react";
import type { Title, TitleRequest } from "../types";
import { useAppState, type AdminTab } from "../state/AppState";
import { DEFAULT_PIN, seedTitles } from "../data/seed";
import { formatBytes, linkCount, timeAgo } from "./adminUtils";
import { TitleForm } from "./TitleForm";
import { RequestsManager } from "./RequestsManager";
import { SmartImage } from "../components/UI";

export function AdminArea({ onBackHome }: { onBackHome: () => void }) {
  const { isAdmin, requests } = useAppState();
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<TitleRequest | null>(null);
  const pendingRequests = requests.filter((request) => request.status === "pending").length;

  if (!isAdmin) return <PinGate onBackHome={onBackHome} />;

  return (
    <main className="app-canvas min-h-screen bg-[#100a0f] pb-24">
      <div className="sticky top-0 z-30 border-b border-white/[.08] bg-[#150e14]/90 shadow-[0_15px_45px_rgba(0,0,0,.18)] backdrop-blur-2xl">
        <div className="page-shell flex flex-wrap items-center gap-x-6 gap-y-3 py-4">
          <button onClick={onBackHome} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.15em] text-white/40 transition hover:text-lime">
            <ArrowLeft size={14} />User site
          </button>
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-crimson text-cream"><KeyRound size={15} /></span>
            <div><p className="font-display text-lg font-black leading-none tracking-tight">Control Room</p><p className="mt-1 text-[9px] uppercase tracking-[.18em] text-white/30">Admin signed in</p></div>
          </div>
          <nav className="hide-scrollbar order-3 flex w-full gap-1 overflow-x-auto rounded-xl border border-white/[.06] bg-black/15 p-1 lg:order-none lg:ml-2 lg:w-auto" aria-label="Admin sections">
            {([
              { id: "dashboard", label: "Dashboard" },
              { id: "titles", label: "Titles" },
              { id: "requests", label: `Requests${pendingRequests ? ` (${pendingRequests})` : ""}` },
              { id: "add", label: editingId ? "Edit title" : "Add title" },
              { id: "settings", label: "Settings" },
            ] as { id: AdminTab; label: string }[]).map((entry) => (
              <button
                key={entry.id}
                onClick={() => { setTab(entry.id); if (entry.id !== "add") { setEditingId(null); setPrefill(null); } }}
                className={`relative shrink-0 whitespace-nowrap rounded-lg px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-wider transition ${
                  tab === entry.id ? "bg-lime text-[#241203]" : entry.id === "requests" && pendingRequests ? "bg-crimson/15 text-crimson hover:bg-crimson/25" : "text-white/40 hover:bg-white/5 hover:text-white"
                }`}
              >
                {entry.label}
              </button>
            ))}
          </nav>
          <SignOut />
        </div>
      </div>
      <div className="page-shell pt-8">
        <AnimatePresence mode="wait">
          <motion.div key={tab + (editingId ?? "") + (prefill?.id ?? "")} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
            {tab === "dashboard" && <Dashboard onManage={() => setTab("titles")} onAdd={() => { setEditingId(null); setPrefill(null); setTab("add"); }} onRequests={() => setTab("requests")} />}
            {tab === "titles" && <TitlesManager onEdit={(id) => { setEditingId(id); setPrefill(null); setTab("add"); }} onAdd={() => { setEditingId(null); setPrefill(null); setTab("add"); }} />}
            {tab === "requests" && <RequestsManager onPrefill={(request) => { setPrefill(request); setEditingId(null); setTab("add"); }} />}
            {tab === "add" && <TitleForm editingId={editingId} prefill={prefill} onDone={() => { setEditingId(null); setPrefill(null); setTab("titles"); }} />}
            {tab === "settings" && <SettingsPanel />}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

function SignOut() {
  const { logout } = useAppState();
  return (
    <button onClick={logout} className="ml-auto flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white/40 transition hover:border-red-400/40 hover:text-red-300">
      <LogOut size={13} />Sign out
    </button>
  );
}

function PinGate({ onBackHome }: { onBackHome: () => void }) {
  const { login } = useAppState();
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [error, setError] = useState("");
  const submit = () => {
    if (login(pin.trim())) return;
    setError("That PIN doesn't match. Try again.");
    setShake(true);
    window.setTimeout(() => setShake(false), 450);
  };
  return (
    <main className="grid min-h-screen place-items-center bg-[#100a0f] p-6">
      <motion.div
        animate={shake ? { x: [0, -12, 12, -8, 8, -4, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#171016] p-8 shadow-2xl"
      >
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-crimson/15 text-crimson"><KeyRound size={22} /></span>
        <h1 className="mt-5 font-display text-3xl font-black tracking-tight">Control Room</h1>
        <p className="mt-2 text-xs leading-6 text-white/40">Enter the admin PIN to manage titles and download links.</p>
        <input
          type="password"
          value={pin}
          onChange={(event) => { setPin(event.target.value); setError(""); }}
          onKeyDown={(event) => { if (event.key === "Enter") submit(); }}
          placeholder="Admin PIN"
          autoFocus
          className="mt-6 w-full rounded-lg border border-white/10 bg-white/[.04] px-4 py-3.5 text-center font-mono text-lg tracking-[.4em] text-cream outline-none transition placeholder:text-sm placeholder:tracking-normal placeholder:text-white/25 focus:border-lime/50"
        />
        {error && <p className="mt-3 text-center text-xs text-red-300">{error}</p>}
        <button onClick={submit} className="primary-button mt-4 w-full">Unlock admin</button>
        <p className="mt-4 text-center text-[10px] leading-5 text-white/25">Demo PIN: <span className="font-mono text-lime/70">{DEFAULT_PIN}</span> — change it in Settings after signing in.</p>
        <button onClick={onBackHome} className="mx-auto mt-5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/35 hover:text-white">
          <ArrowLeft size={12} />Back to the site
        </button>
      </motion.div>
    </main>
  );
}

function Dashboard({ onManage, onAdd, onRequests }: { onManage: () => void; onAdd: () => void; onRequests: () => void }) {
  const { titles, tasks, requests } = useAppState();
  const pendingRequests = requests.filter((request) => request.status === "pending").length;
  const movies = titles.filter((title) => title.type === "movie").length;
  const series = titles.length - movies;
  const episodes = titles.reduce((sum, title) => sum + (title.episodes?.length ?? 0), 0);
  const links = titles.reduce((sum, title) => sum + linkCount(title), 0);
  const active = tasks.filter((task) => ["queued", "downloading", "paused"].includes(task.status)).length;
  const completed = tasks.filter((task) => task.status === "complete").length;
  const bytes = tasks.filter((task) => task.status === "complete").reduce((sum, task) => sum + (task.total || task.received), 0);
  const stats = [
    { label: "Titles live", value: titles.length, icon: Clapperboard },
    { label: "Movies", value: movies, icon: Film },
    { label: "Series", value: series, icon: Tv },
    { label: "Episodes", value: episodes, icon: ListPlus },
    { label: "Download links", value: links, icon: Link2 },
    { label: "Active transfers", value: active, icon: Download },
    { label: "Files completed", value: completed, icon: Database },
  ];
  const recent = [...titles].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6);
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">Overview</p><h1 className="mt-2 font-display text-4xl font-black tracking-[-2px] sm:text-5xl">The booth</h1></div>
        <button onClick={onAdd} className="primary-button"><Plus size={16} />Add a title</button>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {stats.map((stat, index) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="rounded-xl border border-white/[.08] bg-white/[.02] p-4">
            <stat.icon size={16} className="text-lime" />
            <p className="mt-3 font-display text-3xl font-black text-cream">{stat.value}</p>
            <p className="mt-1 text-[9px] uppercase tracking-wider text-white/30">{stat.label}</p>
          </motion.div>
        ))}
        <motion.button onClick={onRequests} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={`rounded-xl border p-4 text-left transition hover:scale-[1.03] ${pendingRequests ? "border-crimson/50 bg-crimson/10" : "border-white/[.08] bg-white/[.02]"}`}>
          <Inbox size={16} className={pendingRequests ? "text-crimson" : "text-lime"} />
          <p className="mt-3 font-display text-3xl font-black text-cream">{pendingRequests}</p>
          <p className="mt-1 text-[9px] uppercase tracking-wider text-white/30">Requests waiting</p>
        </motion.button>
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <section>
          <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl font-bold">Recently updated</h2><button onClick={onManage} className="text-[10px] font-bold uppercase tracking-wider text-lime hover:underline">Manage all</button></div>
          <div className="divide-y divide-white/[.07] rounded-xl border border-white/[.08] bg-white/[.015] px-4">
            {recent.map((title) => (
              <div key={title.id} className="flex items-center gap-4 py-3.5">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${title.type === "series" ? "bg-lime/10 text-lime" : "bg-crimson/10 text-crimson"}`}>
                  {title.type === "series" ? <Tv size={14} /> : <Film size={14} />}
                </span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{title.name}</p><p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/30">{linkCount(title)} links · updated {timeAgo(title.updatedAt)}</p></div>
                {title.featured && <Star size={14} className="shrink-0 text-lime" fill="currentColor" />}
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-xl border border-lime/15 bg-lime/[.03] p-5">
          <h2 className="font-display text-xl font-bold">Housekeeping</h2>
          <ul className="mt-4 space-y-3 text-xs leading-6 text-white/45">
            <li><span className="font-bold text-lime">{formatBytes(bytes)}</span> of files completed through user downloads on this device.</li>
            <li>Links are served exactly as you paste them — nothing is rewritten or proxied.</li>
            <li>Only publish links you are authorized to distribute. The catalog lives in this browser and can be exported from Settings.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function TitlesManager({ onEdit, onAdd }: { onEdit: (id: string) => void; onAdd: () => void }) {
  const { titles, deleteTitle, toggleFeatured } = useAppState();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "movie" | "series">("all");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const results = useMemo(
    () =>
      titles
        .filter((title) => typeFilter === "all" || title.type === typeFilter)
        .filter((title) => !query || `${title.name} ${title.genres.join(" ")} ${title.language}`.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [titles, query, typeFilter],
  );
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">Catalog</p><h1 className="mt-2 font-display text-4xl font-black tracking-[-2px] sm:text-5xl">All titles</h1></div>
        <button onClick={onAdd} className="primary-button"><Plus size={16} />Add a title</button>
      </div>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <label className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-white/10 bg-white/[.03] px-4 py-3 focus-within:border-lime/50">
          <Search size={15} className="shrink-0 text-white/30" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter by name, genre, language…" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/25" />
        </label>
        <div className="flex gap-2">
          {(["all", "movie", "series"] as const).map((value) => (
            <button key={value} onClick={() => setTypeFilter(value)} className={`rounded-lg px-4 py-3 text-[10px] font-bold uppercase tracking-wider transition ${typeFilter === value ? "bg-lime text-[#241203]" : "border border-white/10 text-white/40 hover:text-white"}`}>
              {value === "all" ? "All" : value === "movie" ? "Movies" : "Series"}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-white/[.08]">
        <div className="hidden grid-cols-[1fr_90px_70px_90px_130px] gap-3 border-b border-white/[.08] bg-white/[.02] px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-white/30 md:grid">
          <span>Title</span><span>Type</span><span>Year</span><span>Links</span><span className="text-right">Actions</span>
        </div>
        <div className="divide-y divide-white/[.06] bg-white/[.01]">
          {results.map((title) => (
            <div key={title.id} className="grid grid-cols-1 items-center gap-3 px-4 py-3.5 transition hover:bg-white/[.03] md:grid-cols-[1fr_90px_70px_90px_130px]">
              <div className="flex min-w-0 items-center gap-3">
                <SmartImage src={title.poster} alt="" accent={title.accent} className="h-11 w-8 shrink-0 rounded object-cover" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{title.name}</p>
                  <p className="mt-0.5 truncate text-[10px] uppercase tracking-wider text-white/30">{title.genres.slice(0, 3).join(" · ")}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${title.type === "series" ? "text-lime" : "text-white/45"}`}>{title.type}</span>
              <span className="font-mono text-xs text-white/45">{title.year}</span>
              <span className="font-mono text-xs text-white/45">{linkCount(title)}</span>
              <div className="flex items-center gap-1.5 md:justify-end">
                <button onClick={() => toggleFeatured(title.id)} className={`grid h-8 w-8 place-items-center rounded-md border transition ${title.featured ? "border-lime/40 bg-lime/10 text-lime" : "border-white/10 text-white/30 hover:text-lime"}`} aria-label={title.featured ? "Unfeature" : "Feature on home"}>
                  <Star size={13} fill={title.featured ? "currentColor" : "none"} />
                </button>
                <button onClick={() => onEdit(title.id)} className="grid h-8 w-8 place-items-center rounded-md border border-white/10 text-white/40 transition hover:border-lime/40 hover:text-lime" aria-label={`Edit ${title.name}`}>
                  <Pencil size={13} />
                </button>
                {confirmId === title.id ? (
                  <button onClick={() => { deleteTitle(title.id); setConfirmId(null); }} onBlur={() => setConfirmId(null)} className="h-8 rounded-md bg-crimson px-2.5 text-[9px] font-bold uppercase tracking-wider text-cream">
                    Confirm
                  </button>
                ) : (
                  <button onClick={() => setConfirmId(title.id)} className="grid h-8 w-8 place-items-center rounded-md border border-white/10 text-white/40 transition hover:border-red-400/40 hover:text-red-300" aria-label={`Delete ${title.name}`}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {!results.length && <p className="px-4 py-14 text-center text-sm text-white/30">No titles match. Add one or loosen the filter.</p>}
        </div>
      </div>
    </div>
  );
}

function SettingsPanel() {
  const { settings, changePin, titles, importTitles, resetToSeed, tasks, toast } = useAppState();
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmImport, setConfirmImport] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingImport = useRef<Title[] | null>(null);

  const savePin = () => {
    const value = pin.trim();
    if (value.length < 4) { setPinError("Use at least 4 characters."); return; }
    changePin(value);
    setPin("");
    setPinError("");
  };

  const exportJson = () => {
    const payload = { product: "CholeyFlix", version: 2, exportedAt: new Date().toISOString(), titles, downloadHistory: tasks };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `choleyflix-catalog-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Catalog exported", "Titles and download history saved as JSON.");
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as { titles?: Title[] } | Title[];
      const list = Array.isArray(parsed) ? parsed : parsed.titles;
      if (!Array.isArray(list) || !list.every((entry) => entry && typeof entry.name === "string" && Array.isArray(entry.links || entry.episodes))) {
        throw new Error("shape");
      }
      pendingImport.current = list as Title[];
      setConfirmImport(true);
    } catch {
      toast("Import failed", "That file isn't a CholeyFlix catalog export.", "error");
    }
  };

  return (
    <div className="max-w-2xl">
      <p className="eyebrow">Control room</p>
      <h1 className="mt-2 font-display text-4xl font-black tracking-[-2px] sm:text-5xl">Settings</h1>

      <section className="mt-8 rounded-xl border border-white/[.08] bg-white/[.015] p-6">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold"><KeyRound size={17} className="text-lime" />Admin PIN</h2>
        <p className="mt-2 text-xs leading-6 text-white/40">Current PIN: <span className="font-mono text-lime/70">{settings.pin}</span>. Anyone with the PIN can edit the catalog on this browser.</p>
        <div className="mt-4 flex gap-2">
          <input type="text" value={pin} onChange={(event) => { setPin(event.target.value); setPinError(""); }} placeholder="New PIN (min 4 characters)" className="text-input flex-1" />
          <button onClick={savePin} className="primary-button">Update</button>
        </div>
        {pinError && <p className="mt-2 text-xs text-red-300">{pinError}</p>}
      </section>

      <section className="mt-5 rounded-xl border border-white/[.08] bg-white/[.015] p-6">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold"><FileJson size={17} className="text-lime" />Backup & move</h2>
        <p className="mt-2 text-xs leading-6 text-white/40">Export the whole catalog as JSON, or import an export on another device. Importing replaces the current catalog.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={exportJson} className="secondary-button"><Download size={14} />Export catalog</button>
          <button onClick={() => fileRef.current?.click()} className="secondary-button"><Upload size={14} />Import catalog</button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(event) => { void onFile(event.target.files?.[0]); event.target.value = ""; }} />
        </div>
        {confirmImport && pendingImport.current && (
          <div className="mt-4 rounded-lg border border-lime/25 bg-lime/[.05] p-4">
            <p className="text-sm font-semibold">Replace the catalog with {pendingImport.current.length} imported titles?</p>
            <div className="mt-3 flex gap-2">
              <button onClick={() => { if (pendingImport.current) importTitles(pendingImport.current); pendingImport.current = null; setConfirmImport(false); }} className="primary-button h-9 text-[9px]">Yes, replace</button>
              <button onClick={() => { pendingImport.current = null; setConfirmImport(false); }} className="secondary-button h-9 text-[9px]">Cancel</button>
            </div>
          </div>
        )}
      </section>

      <section className="mt-5 rounded-xl border border-red-400/20 bg-red-400/[.03] p-6">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold text-red-200"><Trash2 size={17} />Danger zone</h2>
        <p className="mt-2 text-xs leading-6 text-white/40">Restore the {seedTitles.length}-title demo catalog. This removes every custom title you've added.</p>
        {confirmReset ? (
          <div className="mt-4 flex gap-2">
            <button onClick={() => { resetToSeed(); setConfirmReset(false); }} className="primary-button h-9 text-[9px]">Yes, wipe and reset</button>
            <button onClick={() => setConfirmReset(false)} className="secondary-button h-9 text-[9px]">Keep my catalog</button>
          </div>
        ) : (
          <button onClick={() => setConfirmReset(true)} className="mt-4 rounded-md border border-red-400/30 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-red-300 transition hover:bg-red-400/10">Reset to demo catalog</button>
        )}
      </section>
    </div>
  );
}
