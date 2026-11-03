import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Download,
  Film,
  House,
  Inbox,
  Lock,
  Search,
  Shield,
  Tv,
  X,
} from "lucide-react";
import type { Title } from "../types";
import { useAppState } from "../state/AppState";

export function Logo({ onClick }: { onClick?: () => void }) {
  const content = (
    <>
      <span className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-[10px] bg-lime text-[#241203] shadow-[0_0_28px_rgba(240,177,63,.22)]"><Clapperboard size={18} strokeWidth={2.5} /></span>
      <span className="font-display text-[20px] font-black tracking-[-1.2px] text-cream sm:text-[22px]">CHOLEY<span className="text-lime">FLIX</span></span>
    </>
  );
  if (!onClick) return <div className="flex shrink-0 items-center gap-2.5">{content}</div>;
  return <button onClick={onClick} className="flex shrink-0 items-center gap-2.5 rounded-lg" aria-label="CholeyFlix home">{content}</button>;
}

// Pasted URLs often arrive as http:// (blocked as mixed content on https
// pages) — upgrade them before rendering.
export function normalizeImageSrc(src: string) {
  const trimmed = src.trim();
  if (
    trimmed.startsWith("http://") &&
    typeof window !== "undefined" &&
    window.location.protocol === "https:"
  ) {
    return `https://${trimmed.slice("http://".length)}`;
  }
  return trimmed;
}

export function SmartImage({
  src,
  alt,
  className = "",
  accent = "#333",
  eager = false,
}: {
  src: string;
  alt: string;
  className?: string;
  accent?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [noReferrer, setNoReferrer] = useState(false);
  const resolved = normalizeImageSrc(src);
  useEffect(() => {
    setFailed(false);
    setNoReferrer(false);
  }, [resolved]);
  if (!resolved || failed) {
    return (
      <div
        className={`grid place-items-center bg-[radial-gradient(circle_at_30%_20%,var(--accent),#111_72%)] ${className}`}
        style={{ "--accent": accent } as React.CSSProperties}
        role="img"
        aria-label={`${alt || "Artwork"} unavailable`}
      >
        <Film className="h-10 w-10 text-white/35" />
      </div>
    );
  }
  return (
    <img
      src={resolved}
      alt={alt}
      className={className}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      referrerPolicy={noReferrer ? "no-referrer" : "strict-origin-when-cross-origin"}
      onError={() => {
        // Many image hosts reject cross-site referrers (hotlink protection).
        // Retry once without a referrer before giving up.
        if (!noReferrer) setNoReferrer(true);
        else setFailed(true);
      }}
      draggable={false}
    />
  );
}

export function linkCount(title: Title) {
  if (title.type === "series") return title.episodes?.reduce((sum, ep) => sum + ep.links.length, 0) ?? 0;
  return title.links.length;
}

export function Header({
  query,
  onQuery,
  onHome,
  onAdmin,
  onDownloads,
  onRequest,
}: {
  query: string;
  onQuery: (value: string) => void;
  onHome: () => void;
  onAdmin: () => void;
  onDownloads: () => void;
  onRequest: () => void;
}) {
  const { tasks } = useAppState();
  const [scrolled, setScrolled] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const desktopSearch = useRef<HTMLInputElement>(null);
  const mobileSearchInput = useRef<HTMLInputElement>(null);
  const active = tasks.filter((task) => ["queued", "downloading", "paused"].includes(task.status)).length;
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 180, damping: 30, mass: 0.25 });

  useEffect(() => {
    const listener = () => setScrolled(window.scrollY > 28);
    listener();
    window.addEventListener("scroll", listener, { passive: true });
    return () => window.removeEventListener("scroll", listener);
  }, []);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable;
      if (event.key === "/" && !typing) {
        event.preventDefault();
        if (window.innerWidth < 768) {
          setMobileSearch(true);
          window.setTimeout(() => mobileSearchInput.current?.focus(), 120);
        } else desktopSearch.current?.focus();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${scrolled ? "bg-ink/80 shadow-[0_12px_50px_rgba(0,0,0,.22)] backdrop-blur-2xl" : "bg-gradient-to-b from-black/90 via-black/35 to-transparent"}`}>
      <div className={`page-shell flex items-center gap-3 transition-all duration-500 sm:gap-6 ${scrolled ? "py-2.5" : "py-4"}`}>
        <Logo onClick={onHome} />
        <label className="group relative mx-auto hidden min-w-0 flex-1 items-center md:flex">
          <Search size={16} className="pointer-events-none absolute left-4 text-white/30 transition group-focus-within:text-lime" />
          <input
            ref={desktopSearch}
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Search the catalog…"
            className="h-11 w-full max-w-xl rounded-full border border-white/10 bg-white/[.045] pl-11 pr-20 text-sm text-cream shadow-inner outline-none backdrop-blur-md transition placeholder:text-white/25 hover:border-white/20 focus:border-lime/50 focus:bg-white/[.075] focus:shadow-[0_0_0_4px_rgba(240,177,63,.06)]"
            aria-label="Search movies and series"
          />
          {query ? (
            <button onClick={() => onQuery("")} className="absolute right-3 grid h-7 w-7 place-items-center rounded-full text-white/35 transition hover:bg-white/10 hover:text-white" aria-label="Clear search"><X size={14} /></button>
          ) : (
            <kbd className="pointer-events-none absolute right-3 rounded-md border border-white/10 bg-black/20 px-2 py-1 font-mono text-[10px] text-white/25">/</kbd>
          )}
        </label>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <button onClick={() => { setMobileSearch((value) => !value); window.setTimeout(() => mobileSearchInput.current?.focus(), 100); }} className="icon-button md:hidden" aria-label="Toggle search" aria-expanded={mobileSearch}><Search size={18} /></button>
          <button onClick={onRequest} className="icon-button hidden sm:inline-flex" aria-label="Request a movie or series"><Inbox size={18} /><span className="ml-2 hidden text-[10px] font-bold uppercase tracking-wider text-white/40 lg:inline">Request</span></button>
          <button onClick={onDownloads} className="icon-button relative" aria-label={`Downloads, ${active} active`}>
            <Download size={18} />
            {active > 0 && <motion.span key={active} initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-crimson px-1 text-[9px] font-bold text-cream shadow-lg">{active}</motion.span>}
          </button>
          <button onClick={onAdmin} className="icon-button hidden sm:inline-flex" aria-label="Admin panel"><Lock size={17} /><span className="ml-2 hidden text-[10px] font-bold uppercase tracking-wider text-white/40 lg:inline">Admin</span></button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {mobileSearch && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/[.06] bg-ink/95 px-5 backdrop-blur-2xl md:hidden">
            <label className="my-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.05] px-4 focus-within:border-lime/50">
              <Search size={17} className="shrink-0 text-lime" />
              <input ref={mobileSearchInput} value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Movies, series, genres…" className="h-12 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-white/25" aria-label="Search movies and series" />
              {query && <button onClick={() => onQuery("")} className="text-white/40" aria-label="Clear search"><X size={16} /></button>}
            </label>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-gradient-to-r from-crimson via-lime to-lime" style={{ scaleX: progress }} />
    </header>
  );
}

export function MobileDock({
  onHome,
  onSearch,
  onDownloads,
  onRequest,
  onAdmin,
}: {
  onHome: () => void;
  onSearch: () => void;
  onDownloads: () => void;
  onRequest: () => void;
  onAdmin: () => void;
}) {
  const { tasks } = useAppState();
  const active = tasks.filter((task) => ["queued", "downloading", "paused"].includes(task.status)).length;
  const actions = [
    { label: "Home", icon: House, action: onHome },
    { label: "Search", icon: Search, action: onSearch },
    { label: "Requests", icon: Inbox, action: onRequest },
    { label: "Downloads", icon: Download, action: onDownloads, badge: active },
    { label: "Admin", icon: Shield, action: onAdmin },
  ];
  return (
    <nav className="mobile-dock fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-2xl border border-white/10 bg-[#171016]/90 p-1.5 shadow-[0_20px_60px_rgba(0,0,0,.55)] backdrop-blur-2xl sm:hidden" aria-label="Mobile navigation">
      {actions.map((item) => (
        <button key={item.label} onClick={item.action} className="relative flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-xl text-[8px] font-bold uppercase tracking-wider text-white/45 transition active:scale-95 active:bg-white/5" aria-label={item.label}>
          <item.icon size={18} />
          <span>{item.label}</span>
          {Boolean(item.badge) && <span className="absolute right-2 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-crimson px-1 text-[8px] text-cream">{item.badge}</span>}
        </button>
      ))}
    </nav>
  );
}

export function TitleCard({ title, onOpen }: { title: Title; onOpen: (title: Title) => void }) {
  const counts = linkCount(title);
  const chips =
    title.type === "series"
      ? [`${title.episodes?.length ?? 0} EP`]
      : title.links.slice(0, 2).map((link) => link.label.split("·")[0].trim());
  return (
    <motion.article layout className="group relative" style={{ "--card-accent": title.accent } as React.CSSProperties} whileHover={{ y: -7 }} transition={{ type: "spring", stiffness: 320, damping: 24 }}>
      <button
        onClick={() => onOpen(title)}
        className="title-card relative block w-full overflow-hidden rounded-xl border border-white/[.09] bg-white/5 text-left shadow-[0_18px_45px_rgba(0,0,0,.3)] outline-offset-4 transition duration-500 focus-visible:outline-lime group-hover:border-white/25 group-hover:shadow-[0_26px_70px_rgba(0,0,0,.5)]"
        aria-label={`View ${title.name} and its ${counts} download link${counts === 1 ? "" : "s"}`}
      >
        <div className="aspect-[2/3] w-full overflow-hidden">
          <SmartImage src={title.poster} alt={`${title.name} poster`} accent={title.accent} className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.065] group-hover:brightness-[.58]" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-black/15 opacity-90 transition group-hover:opacity-100" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
          <span className={`inline-flex items-center gap-1 rounded-md border border-white/10 bg-black/55 px-2 py-1 text-[8px] font-bold uppercase tracking-wider backdrop-blur-md ${title.type === "series" ? "text-lime" : "text-white/75"}`}>
            {title.type === "series" ? <Tv size={9} /> : <Film size={9} />}{title.type === "series" ? "Series" : "Movie"}
          </span>
          {title.featured && <span className="rounded-md bg-crimson px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-cream shadow-lg">Featured</span>}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-3.5">
          <div className="mb-2 flex flex-wrap gap-1">
            {chips.map((chip) => <span key={chip} className="rounded-md border border-lime/25 bg-lime/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-lime backdrop-blur-sm">{chip}</span>)}
          </div>
          <p className="line-clamp-2 text-[13px] font-bold leading-[1.25] text-cream sm:text-sm">{title.name}</p>
          <p className="mt-1.5 truncate text-[9px] font-semibold uppercase tracking-wider text-white/45">{title.year} · {counts} link{counts === 1 ? "" : "s"}</p>
          <div className="mt-3 flex max-h-0 translate-y-2 items-center justify-between overflow-hidden text-[9px] font-bold uppercase tracking-[.12em] text-lime opacity-0 transition-all duration-300 group-hover:max-h-8 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:max-h-8 group-focus-within:translate-y-0 group-focus-within:opacity-100">
            <span>Choose a quality</span><ArrowUpRight size={14} />
          </div>
        </div>
      </button>
    </motion.article>
  );
}

export function Rail({
  title,
  eyebrow,
  items,
  onOpen,
}: {
  title: string;
  eyebrow?: string;
  items: Title[];
  onOpen: (title: Title) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const scroll = (direction: number) =>
    scroller.current?.scrollBy({ left: direction * scroller.current.clientWidth * 0.78, behavior: "smooth" });
  if (!items.length) return null;
  return (
    <section className="relative py-6 sm:py-9">
      <div className="page-shell mb-4 flex items-end justify-between gap-4">
        <div>
          {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
          <h2 className="font-display text-2xl font-bold tracking-[-1px] text-cream sm:text-3xl">{title}</h2>
        </div>
        <div className="hidden gap-2 sm:flex">
          <button onClick={() => scroll(-1)} className="icon-button h-9 w-9" aria-label={`Scroll ${title} left`}>
            <ChevronLeft size={17} />
          </button>
          <button onClick={() => scroll(1)} className="icon-button h-9 w-9" aria-label={`Scroll ${title} right`}>
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
      <div
        ref={scroller}
        className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-[max(1.25rem,calc((100vw-1440px)/2+2rem))] pb-4 pt-1 sm:gap-5"
      >
        {items.map((item) => (
          <div key={item.id} className="w-[42vw] min-w-[145px] max-w-[210px] shrink-0 snap-start">
            <TitleCard title={item} onOpen={onOpen} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 52, clipPath: "inset(0 0 16% 0)" }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Toasts() {
  const { toasts, dismissToast } = useAppState();
  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-[120] flex w-[min(92vw,430px)] -translate-x-1/2 flex-col gap-2 sm:bottom-5" role="status" aria-live="polite">
      <AnimatePresence>
        {toasts.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-2xl backdrop-blur-xl ${
              item.tone === "error" ? "border-red-400/25 bg-red-950/90" : "border-white/10 bg-[#241a22]/95"
            }`}
          >
            <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${item.tone === "error" ? "bg-red-400" : "bg-lime"}`} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{item.title}</p>
              {item.message && <p className="mt-1 text-xs leading-5 text-white/50">{item.message}</p>}
            </div>
            <button onClick={() => dismissToast(item.id)} className="text-white/35 hover:text-white" aria-label="Dismiss notification">
              <X size={15} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function Footer({ onAdmin }: { onAdmin: () => void }) {
  const { titles, tasks } = useAppState();
  const links = titles.reduce((sum, t) => sum + linkCount(t), 0);
  const completed = tasks.filter((task) => task.status === "complete").length;
  return (
    <footer className="mt-24 border-t border-white/[.08] bg-[#0d080c]">
      <div className="page-shell grid gap-10 py-12 md:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-md text-sm leading-7 text-white/40">
            A search-and-download cinema. Every title, quality, and link in the catalog is entered by hand in the admin room — no scrapers, no hidden backends.
          </p>
          <p className="mt-4 max-w-md text-[11px] leading-5 text-white/25">
            Admins should only publish links to content they are authorized to distribute. Catalog data lives in this browser.
          </p>
        </div>
        <div>
          <p className="eyebrow mb-4">Catalog pulse</p>
          <dl className="space-y-2.5 text-sm text-white/50">
            <div className="flex justify-between gap-6"><dt>Titles published</dt><dd className="font-mono text-lime">{titles.length}</dd></div>
            <div className="flex justify-between gap-6"><dt>Download links</dt><dd className="font-mono text-lime">{links}</dd></div>
            <div className="flex justify-between gap-6"><dt>Files saved here</dt><dd className="font-mono text-lime">{completed}</dd></div>
          </dl>
        </div>
        <div>
          <p className="eyebrow mb-4">Control room</p>
          <button onClick={onAdmin} className="secondary-button"><Lock size={14} />Open admin panel</button>
          <p className="mt-4 text-[11px] leading-5 text-white/25">Add titles, paste download links, manage the queue.</p>
        </div>
      </div>
      <div className="page-shell flex flex-col gap-2 border-t border-white/[.06] py-5 text-[10px] uppercase tracking-[.16em] text-white/25 sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} CholeyFlix · Hand-curated downloads</span>
        <span>Admin-managed catalog · stored locally</span>
      </div>
    </footer>
  );
}
