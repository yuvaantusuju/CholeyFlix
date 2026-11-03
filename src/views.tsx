import { useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import {
  ArrowDown,
  ArrowRight,
  Download,
  Film,
  LayoutGrid,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tv,
  X,
} from "lucide-react";
import type { Title } from "./types";
import { useAppState } from "./state/AppState";
import { Rail, Reveal, SmartImage, TitleCard, linkCount } from "./components/UI";

export function HomeView({
  query,
  onQuery,
  onOpen,
  onRequest,
}: {
  query: string;
  onQuery: (value: string) => void;
  onOpen: (title: Title) => void;
  onRequest: (name?: string) => void;
}) {
  const { titles } = useAppState();
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const [kind, setKind] = useState<"all" | "movie" | "series">("all");
  const [genre, setGenre] = useState("All genres");
  const [sort, setSort] = useState<"latest" | "az" | "oldest">("latest");
  const [showAll, setShowAll] = useState(false);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const backdropY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const backdropScale = useTransform(scrollYProgress, [0, 1], [1.06, 1.22]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.82], [1, 0]);
  const posterY = useTransform(scrollYProgress, [0, 1], [0, 110]);
  const posterRotate = useTransform(scrollYProgress, [0, 1], [2.5, -4]);

  const featured = useMemo(() => titles.find((title) => title.featured) ?? titles[0], [titles]);
  const genres = useMemo(() => Array.from(new Set(titles.flatMap((title) => title.genres))).sort(), [titles]);
  const recent = useMemo(() => [...titles].sort((a, b) => b.createdAt - a.createdAt).slice(0, 12), [titles]);
  const movies = useMemo(() => titles.filter((title) => title.type === "movie"), [titles]);
  const series = useMemo(() => titles.filter((title) => title.type === "series"), [titles]);
  const searching = query.trim().length > 0;
  const browsing = searching || showAll || kind !== "all" || genre !== "All genres";

  const results = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const filtered = titles.filter((title) => {
      if (kind !== "all" && title.type !== kind) return false;
      if (genre !== "All genres" && !title.genres.includes(genre)) return false;
      if (!words.length) return true;
      const haystack = [
        title.name, title.description, title.language, String(title.year), title.genres.join(" "),
        ...(title.episodes?.map((episode) => `${episode.title} ${episode.links.map((link) => link.label).join(" ")}`) ?? []),
        ...title.links.map((link) => link.label),
      ].join(" ").toLowerCase();
      return words.every((word) => haystack.includes(word));
    });
    return filtered.sort((a, b) =>
      sort === "az" ? a.name.localeCompare(b.name) : sort === "oldest" ? a.year - b.year || a.name.localeCompare(b.name) : b.createdAt - a.createdAt,
    );
  }, [titles, query, kind, genre, sort]);

  const totalLinks = titles.reduce((sum, title) => sum + linkCount(title), 0);
  const tickerItems = useMemo(() => {
    const names = [...titles].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8).map((title) => title.name.toUpperCase());
    return [...names, ...names];
  }, [titles]);
  const resetBrowse = () => {
    onQuery("");
    setKind("all");
    setGenre("All genres");
    setShowAll(false);
  };

  return (
    <>
      {featured && (
        <section ref={heroRef} className="relative flex min-h-[94svh] flex-col overflow-hidden pt-24 sm:pt-28">
          <motion.div className="pointer-events-none absolute inset-0" style={reduce ? undefined : { y: backdropY, scale: backdropScale }}>
            <SmartImage src={featured.backdrop ?? featured.poster} alt="" accent={featured.accent} eager className="h-full w-full object-cover opacity-50" />
          </motion.div>
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(100deg,#150e14_8%,rgba(21,14,20,.84)_44%,rgba(21,14,20,.24)_100%)]" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-transparent to-black/45" />
          <div className="hero-aurora pointer-events-none absolute -right-32 top-16 h-[520px] w-[520px] rounded-full opacity-30 blur-3xl" style={{ background: featured.accent }} />
          <div className="film-grain pointer-events-none absolute inset-0 opacity-[.14]" />

          <motion.div style={reduce ? undefined : { y: contentY, opacity: contentOpacity }} className="page-shell relative grid flex-1 gap-10 pb-16 pt-8 lg:grid-cols-[1.5fr_1fr] lg:items-center lg:pb-20">
            <div className="max-w-4xl">
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6 flex items-center gap-3">
                <span className="h-px w-9 bg-crimson" />
                <p className="text-[9px] font-bold uppercase tracking-[.24em] text-lime sm:text-[10px]">Now featuring · admin's pick</p>
              </motion.div>
              <div className="overflow-hidden pb-3">
                <motion.h1
                  initial={reduce ? { opacity: 0 } : { y: "108%", rotate: 1.5 }}
                  animate={reduce ? { opacity: 1 } : { y: 0, rotate: 0 }}
                  transition={{ delay: 0.22, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  className="text-balance break-words font-display text-[clamp(3.1rem,8.5vw,7.8rem)] font-black uppercase leading-[.82] tracking-[-.055em] text-cream"
                >
                  {featured.name}
                </motion.h1>
              </div>
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }} className="mt-4 flex flex-wrap items-center gap-2.5 text-[9px] font-semibold uppercase tracking-[.14em] text-white/55 sm:text-[10px]">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-crimson px-2.5 py-1.5 text-cream shadow-lg shadow-crimson/20">{featured.type === "series" ? <Tv size={10} /> : <Film size={10} />}{featured.type}</span>
                <span className="meta-chip">{featured.year}</span><span className="meta-chip">{featured.language}</span>
                <span className="meta-chip hidden sm:inline-flex">{featured.genres.slice(0, 3).join(" / ")}</span>
                <span className="meta-chip !border-lime/25 !bg-lime/[.07] !text-lime">{linkCount(featured)} download links</span>
              </motion.div>
              <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-6 line-clamp-4 max-w-xl text-sm leading-7 text-white/65 sm:text-base">{featured.description}</motion.p>
              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mt-8 flex flex-wrap gap-3">
                <button onClick={() => onOpen(featured)} className="primary-button h-12 px-6"><Download size={16} />Get the links</button>
                <a href="#catalog" className="secondary-button h-12 px-6">Browse the wall<ArrowRight size={15} /></a>
              </motion.div>
            </div>
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, rotate: 7, y: 45 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, rotate: 2.5, y: 0 }}
              style={reduce ? undefined : { y: posterY, rotate: posterRotate }}
              transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto hidden w-[260px] lg:block xl:w-[290px]"
            >
              <div className="marquee-frame rounded-xl p-3">
                <button onClick={() => onOpen(featured)} className="group block overflow-hidden rounded-lg shadow-[0_35px_90px_rgba(0,0,0,.55)]" aria-label={`Open ${featured.name}`}>
                  <SmartImage src={featured.poster} alt={`${featured.name} poster`} accent={featured.accent} eager className="aspect-[2/3] w-full object-cover transition duration-700 group-hover:scale-105" />
                </button>
              </div>
              <div className="mt-5 flex items-center justify-center gap-3 text-[8px] font-bold uppercase tracking-[.28em] text-white/35"><span className="h-px w-7 bg-white/20" />Tonight's billboard<span className="h-px w-7 bg-white/20" /></div>
            </motion.div>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="pointer-events-none absolute bottom-16 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-[8px] font-bold uppercase tracking-[.2em] text-white/30 md:flex"><ArrowDown size={12} />Scroll the collection</motion.div>
          <div className="relative border-y border-white/[.08] bg-black/35 py-3 backdrop-blur-sm">
            <div className="ticker-track flex w-max items-center gap-8 whitespace-nowrap">
              {tickerItems.map((name, index) => (
                <span key={index} className="flex items-center gap-8 text-[9px] font-bold uppercase tracking-[.22em] text-white/35"><span className={index % 3 === 0 ? "text-lime/80" : ""}>{name}</span><Sparkles size={10} className="text-crimson/70" /></span>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="page-shell relative z-10 scroll-mt-24 pt-12 sm:pt-16" id="catalog">
        <Reveal>
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div><p className="eyebrow mb-2">The whole wall, one keystroke away</p><h2 className="text-balance font-display text-4xl font-black leading-[.98] tracking-[-2px] sm:text-5xl">What are we downloading tonight?</h2></div>
            <p className="max-w-xs text-xs leading-6 text-white/45 lg:pb-1"><strong className="font-mono text-lime">{titles.length}</strong> titles · <strong className="font-mono text-lime">{totalLinks}</strong> links · <strong className="font-mono text-lime">{series.length}</strong> series. Search names, genres, qualities, and episodes.</p>
          </div>
          <div className="discovery-panel mt-7 rounded-2xl border border-white/10 bg-[#181016]/90 p-3 shadow-[0_30px_80px_rgba(0,0,0,.35)] backdrop-blur-xl sm:p-4">
            <label className="group flex items-center gap-3 rounded-xl border border-white/[.08] bg-black/20 px-4 transition focus-within:border-lime/45 focus-within:bg-black/35 sm:gap-4 sm:px-5">
              <Search size={21} className="shrink-0 text-lime" />
              <input id="catalog-search" value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search movies, series, genres, qualities…" className="h-14 min-w-0 flex-1 bg-transparent text-base text-cream outline-none placeholder:text-white/25 sm:h-16 sm:text-xl" aria-label="Search the catalog" />
              {query && <button onClick={() => onQuery("")} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/5 text-white/50 transition hover:bg-white/10 hover:text-white" aria-label="Clear search"><X size={16} /></button>}
            </label>
            <div className="mt-3 flex flex-wrap items-center gap-2 px-1 pb-1">
              {(["all", "movie", "series"] as const).map((value) => (
                <button key={value} onClick={() => { setKind(value); if (value === "all") setShowAll(true); }} className={`filter-chip ${kind === value ? "filter-chip-active" : ""}`}>{value === "all" ? <LayoutGrid size={12} /> : value === "movie" ? <Film size={12} /> : <Tv size={12} />}{value === "all" ? "Everything" : value === "movie" ? "Movies" : "Series"}</button>
              ))}
              <span className="mx-1 hidden h-5 w-px bg-white/10 sm:block" />
              <label className="filter-chip !cursor-pointer gap-2"><SlidersHorizontal size={12} /><select value={genre} onChange={(event) => setGenre(event.target.value)} className="bg-transparent uppercase outline-none" aria-label="Filter by genre"><option>All genres</option>{genres.map((value) => <option key={value}>{value}</option>)}</select></label>
              <button onClick={() => setShowAll(true)} className="ml-auto flex items-center gap-2 rounded-full px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-lime transition hover:bg-lime/10">Browse all titles<ArrowRight size={12} /></button>
            </div>
          </div>
          {!browsing && genres.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[9px] uppercase tracking-wider text-white/25"><span className="mr-1">Quick lanes</span>{genres.slice(0, 5).map((value) => <button key={value} onClick={() => { setGenre(value); setShowAll(true); }} className="rounded-full border border-white/[.07] px-3 py-1.5 transition hover:border-lime/30 hover:text-lime">{value}</button>)}</div>
          )}
        </Reveal>
      </section>

      {browsing ? (
        <section className="page-shell pb-10 pt-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-white/[.07] pb-5">
            <div><p className="eyebrow">{searching ? "Search results" : "Complete catalog"}</p><h3 className="mt-1.5 font-display text-2xl font-bold tracking-tight">{searching ? `“${query.trim()}”` : kind === "all" ? "All titles" : kind === "movie" ? "All movies" : "All series"}<span className="ml-3 font-mono text-sm font-normal text-lime">{results.length}</span></h3></div>
            <div className="flex items-center gap-2"><select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="rounded-lg border border-white/10 bg-[#1c1319] px-3 py-2.5 text-[9px] font-bold uppercase tracking-wider text-white/50 outline-none" aria-label="Sort results"><option value="latest">Latest added</option><option value="az">A – Z</option><option value="oldest">Oldest year</option></select><button onClick={resetBrowse} className="secondary-button h-[38px] min-h-[38px] px-3 text-[9px]"><X size={12} />Reset</button></div>
          </div>
          {results.length ? (
            <motion.div layout className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {results.map((title, index) => <motion.div layout key={title.id} initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: Math.min(index * 0.035, 0.35) }}><TitleCard title={title} onOpen={onOpen} /></motion.div>)}
            </motion.div>
          ) : (
            <div className="empty-state rounded-2xl border border-dashed border-white/10 bg-white/[.015] px-6 py-20 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white/[.03]"><Search className="text-white/25" size={25} /></span>
              <h3 className="mt-5 font-display text-2xl font-bold">Nothing on the wall</h3>
              <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-white/40">No title matches “{query.trim()}”. Try fewer words or clear a filter — or send it straight to the admin.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2.5"><button onClick={() => onRequest(query.trim())} className="primary-button"><Sparkles size={14} />Request this title</button><button onClick={resetBrowse} className="secondary-button">Clear the search</button></div>
            </div>
          )}
        </section>
      ) : (
        <main className="relative z-10">
          <Reveal><Rail title="Fresh on the wall" eyebrow="Latest additions by the admin" items={recent} onOpen={onOpen} /></Reveal>
          <Reveal><Rail title="Movies" eyebrow="One file away" items={movies} onOpen={onOpen} /></Reveal>
          <Reveal><Rail title="Series" eyebrow="Episode by episode" items={series} onOpen={onOpen} /></Reveal>
          <Reveal className="page-shell py-16 sm:py-24">
            <div className="grid gap-10 border-y border-white/[.08] py-12 lg:grid-cols-[1fr_1.4fr]">
              <div><p className="eyebrow">How CholeyFlix runs</p><h2 className="mt-4 text-balance font-display text-4xl font-black leading-[1] tracking-[-2px] sm:text-5xl">A hand-built catalog. On purpose.</h2><p className="mt-6 max-w-md text-sm leading-7 text-white/45">No scrapers, no mystery backends. An admin opens the control room, types a movie name, pastes its download links, and the wall updates instantly for every visitor of this browser.</p></div>
              <ol className="space-y-0">
                {[
                  { step: "01", title: "Admin adds the title", text: "Name, year, genres, poster — plus one download link per quality, or per episode for series. Sizes and labels exactly as provided." },
                  { step: "02", title: "You find it in a keystroke", text: "Search reads titles, genres, languages, qualities, even episode names. Filters narrow the wall to exactly what you want." },
                  { step: "03", title: "Download with real progress", text: "Files stream straight from the admin's link with live byte counts, pause and resume, and a full history on this device." },
                ].map((entry, index) => (
                  <motion.li key={entry.step} initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.12 }} className={`grid gap-4 border-b border-white/[.07] py-7 last:border-0 sm:grid-cols-[80px_1fr] ${index === 1 ? "sm:pl-10" : ""}`}><span className="font-display text-5xl font-black text-crimson/80">{entry.step}</span><div><h3 className="font-display text-xl font-bold">{entry.title}</h3><p className="mt-2 max-w-lg text-sm leading-7 text-white/45">{entry.text}</p></div></motion.li>
                ))}
              </ol>
            </div>
          </Reveal>
        </main>
      )}
    </>
  );
}
