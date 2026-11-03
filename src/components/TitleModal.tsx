import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, Copy, Download, ExternalLink, Film, Tv, X } from "lucide-react";
import type { DownloadLink, Episode, Title } from "../types";
import { useAppState } from "../state/AppState";
import { formatBytes, timeAgo } from "../lib/utils";
import { SmartImage, TitleCard } from "./UI";

function LinkRow({
  link,
  onQueue,
  queued,
}: {
  link: DownloadLink;
  onQueue: () => void;
  queued: boolean;
}) {
  const { toast } = useAppState();
  const [copied, setCopied] = useState(false);
  const host = useMemo(() => {
    try { return new URL(link.url).hostname.replace(/^www\./, ""); }
    catch { return "Direct source"; }
  }, [link.url]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast("Could not copy", "Select and copy the link manually.", "error");
    }
  };
  return (
    <div className="group flex flex-col gap-3 rounded-lg border border-white/[.08] bg-white/[.02] p-3.5 transition hover:border-lime/30 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-cream">{link.label}</p>
        <p className="mt-1 flex items-center gap-1.5 truncate text-[10px] font-semibold uppercase tracking-wider text-white/30" title={link.url}><span className="h-1 w-1 rounded-full bg-lime/60" />{host}<span className="normal-case tracking-normal text-white/20">· direct source</span></p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {link.size ? <span className="text-[10px] font-bold uppercase tracking-wider text-white/35">{formatBytes(link.size)}</span> : null}
        <button onClick={copy} className="secondary-button h-9 px-3 text-[9px]" aria-label={`Copy link for ${link.label}`}>
          {copied ? <Check size={13} className="text-lime" /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
        <a href={link.url} target="_blank" rel="noreferrer" className="secondary-button h-9 px-3 text-[9px]" aria-label={`Open ${link.label} in new tab`}>
          <ExternalLink size={13} />Open
        </a>
        <button onClick={onQueue} disabled={queued} className="primary-button h-9 px-3.5 text-[9px] disabled:cursor-default disabled:opacity-45">
          {queued ? <Check size={13} /> : <Download size={13} />}
          {queued ? "Queued" : "Download"}
        </button>
      </div>
    </div>
  );
}

function EpisodeBlock({ title, episode }: { title: Title; episode: Episode }) {
  const [open, setOpen] = useState(episode.number === 1);
  const { tasks, enqueue } = useAppState();
  const queuedUrls = new Set(tasks.filter((task) => ["queued", "downloading", "paused"].includes(task.status)).map((task) => task.url));
  return (
    <div className="overflow-hidden rounded-xl border border-white/[.08] bg-white/[.015]">
      <button onClick={() => setOpen((value) => !value)} className="flex w-full items-center gap-4 p-3.5 text-left transition hover:bg-white/[.03]" aria-expanded={open} aria-label={`${open ? "Collapse" : "Expand"} episode ${episode.number}: ${episode.title}`}>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-lime/10 font-display text-lg font-black text-lime">
          {String(episode.number).padStart(2, "0")}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-cream">{episode.title}</span>
          <span className="mt-0.5 block text-[10px] uppercase tracking-wider text-white/30">{episode.links.length} link{episode.links.length === 1 ? "" : "s"}</span>
        </span>
        <ChevronDown size={17} className={`shrink-0 text-white/35 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
            <div className="space-y-2 border-t border-white/[.06] p-3.5">
              {episode.links.map((link) => (
                <LinkRow
                  key={link.id}
                  link={link}
                  queued={queuedUrls.has(link.url)}
                  onQueue={() => enqueue(title, link, `E${episode.number} ${episode.title}`)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TitleModal({
  title,
  onClose,
  onOpenTitle,
  onGoDownloads,
}: {
  title: Title | null;
  onClose: () => void;
  onOpenTitle: (title: Title) => void;
  onGoDownloads: () => void;
}) {
  const { titles, tasks, enqueue, enqueueAll } = useAppStateEnriched();
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (title) scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [title?.id]);
  useEffect(() => {
    if (!title) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", key);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", key); };
  }, [title, onClose]);

  const related = useMemo(() => {
    if (!title) return [];
    return titles
      .filter((candidate) => candidate.id !== title.id)
      .map((candidate) => ({ candidate, score: candidate.genres.filter((genre) => title.genres.includes(genre)).length }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ candidate }) => candidate);
  }, [title, titles]);

  if (!title) return null;
  const queuedUrls = new Set(tasks.filter((task) => ["queued", "downloading", "paused"].includes(task.status)).map((task) => task.url));
  const allLinks = title.type === "series" ? title.episodes?.flatMap((ep) => ep.links) ?? [] : title.links;

  return (
    <AnimatePresence>
      <motion.div
        ref={scrollRef}
        className="fixed inset-0 z-[75] overflow-y-auto bg-black/80 backdrop-blur-md"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
      >
        <motion.article
          role="dialog" aria-modal="true" aria-label={`${title.name} details`}
          className="relative mx-auto my-0 min-h-full w-full max-w-5xl overflow-hidden bg-[#171016] shadow-2xl sm:my-6 sm:min-h-0 sm:rounded-2xl"
          initial={{ opacity: 0, y: 60, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.985 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        >
          <button onClick={onClose} className="absolute right-4 top-4 z-30 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/55 text-white backdrop-blur-lg transition hover:rotate-90 hover:bg-black" aria-label="Close details">
            <X size={19} />
          </button>
          <div className="relative h-[38vh] min-h-[280px] overflow-hidden">
            <SmartImage src={title.backdrop ?? title.poster} alt="" accent={title.accent} eager className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#171016] via-[#171016]/25 to-black/30" />
          </div>
          <div className="-mt-24 grid gap-8 p-6 sm:p-9 md:grid-cols-[200px_1fr]">
            <div className="relative z-10 hidden md:block">
              <div className="overflow-hidden rounded-lg border border-white/10 shadow-2xl">
                <SmartImage src={title.poster} alt={`${title.name} poster`} accent={title.accent} eager className="aspect-[2/3] w-full object-cover" />
              </div>
            </div>
            <div className="min-w-0">
              <p className="eyebrow mb-2 flex items-center gap-2">
                {title.type === "series" ? <Tv size={11} /> : <Film size={11} />}
                {title.type === "series" ? `Series · ${title.episodes?.length} episodes` : "Movie"} · added {timeAgo(title.createdAt)}
              </p>
              <h2 className="font-display text-4xl font-black uppercase leading-[.9] tracking-[-2.5px] text-cream sm:text-5xl">{title.name}</h2>
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-semibold uppercase tracking-wider text-white/55">
                <span>{title.year}</span><span className="h-1 w-1 rounded-full bg-white/25" /><span>{title.language}</span>
                <span className="h-1 w-1 rounded-full bg-white/25" /><span>{title.genres.join(" / ")}</span>
              </div>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/55">{title.description}</p>

              <div className="mt-8">
                <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3">
                  <h3 className="font-display text-xl font-bold tracking-tight">Download links <span className="text-white/30">({allLinks.length})</span></h3>
                  {title.type === "movie" && title.links.length > 1 && (
                    <button
                      onClick={() => { enqueueAll(title, title.links); }}
                      className="secondary-button h-9 text-[9px]"
                    >
                      <Download size={13} />Queue all qualities
                    </button>
                  )}
                </div>
                {title.type === "movie" ? (
                  <div className="space-y-2">
                    {title.links.map((link) => (
                      <LinkRow key={link.id} link={link} queued={queuedUrls.has(link.url)} onQueue={() => enqueue(title, link)} />
                    ))}
                    {!title.links.length && <p className="rounded-lg border border-dashed border-white/10 p-5 text-xs text-white/30">No links published for this title yet.</p>}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {title.episodes?.map((episode) => <EpisodeBlock key={episode.id} title={title} episode={episode} />)}
                    {title.episodes?.length && title.episodes.length > 1 && (
                      <button onClick={() => { enqueueAll(title); onGoDownloads(); }} className="secondary-button mt-1 text-[9px]">
                        <Download size={13} />Queue every episode
                      </button>
                    )}
                  </div>
                )}
                <p className="mt-4 text-[10px] leading-4 text-white/25">Transfers run in this tab and show live byte progress. If a host blocks direct transfers, use Open to download from the source page.</p>
              </div>

              {related.length > 0 && (
                <div className="mt-12">
                  <h3 className="mb-4 font-display text-xl font-bold tracking-tight">More like this</h3>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                    {related.map((candidate) => <TitleCard key={candidate.id} title={candidate} onOpen={onOpenTitle} />)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.article>
      </motion.div>
    </AnimatePresence>
  );
}

// Local hook wrapper so the modal can queue a whole title in one action.
function useAppStateEnriched() {
  const state = useAppState();
  const enqueueAll = (title: Title, links?: DownloadLink[]) => {
    let added = 0;
    if (links) {
      for (const link of links) if (state.enqueue(title, link)) added += 1;
    } else {
      for (const entry of title.episodes ?? []) {
        for (const link of entry.links) if (state.enqueue(title, link, `E${entry.number} ${entry.title}`)) added += 1;
      }
    }
    return added;
  };
  return { ...state, enqueueAll };
}
