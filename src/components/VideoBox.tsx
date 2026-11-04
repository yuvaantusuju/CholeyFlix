import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Film, Play, Tv, X } from "lucide-react";
import type { Episode, Title } from "../types";
import { isValidUrl } from "../lib/utils";
import { SmartImage } from "./UI";

type CatalogLink = { id: string; label?: string; url: string };

// Use the catalog link exactly as saved. Also accepts pasted <iframe src="..."> code.
function toEmbedUrl(raw?: string): string | undefined {
  if (!raw) return undefined;
  let value = raw.trim();
  const iframeSrc = value.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i)?.[1];
  if (iframeSrc) value = iframeSrc;
  if (value.startsWith("//")) value = `https:${value}`;
  return isValidUrl(value) ? value : undefined;
}

export function VideoBox({ title, onClose }: { title: Title; onClose: () => void }) {
  const episodes = title.episodes ?? [];
  const hasVideo = (item: any) => Boolean(item?.videoUrl || item?.links?.length);
  const [episodeId, setEpisodeId] = useState(
    () => episodes.find(hasVideo)?.id ?? episodes[0]?.id ?? "",
  );
  const [linkId, setLinkId] = useState("");
  const episode = episodes.find((item) => item.id === episodeId);

  // Links come from the catalog: movie -> title, series -> selected episode
  const owner: any = title.type === "movie" ? title : episode;
  const catalogLinks: CatalogLink[] = ((owner?.links as CatalogLink[] | undefined) ?? []).filter(
    (link) => toEmbedUrl(link?.url),
  );
  const activeLink = catalogLinks.find((link) => link.id === linkId) ?? catalogLinks[0];

  // Prefer the catalog's videoUrl; otherwise use the catalog link
  const embedUrl = toEmbedUrl(owner?.videoUrl) ?? toEmbedUrl(activeLink?.url);

  useEffect(() => {
    setEpisodeId(episodes.find(hasVideo)?.id ?? episodes[0]?.id ?? "");
    setLinkId("");
  }, [title.id]);

  const selectEpisode = (item: Episode) => {
    setEpisodeId(item.id);
    setLinkId("");
  };

  const label = `${title.name}${episode ? ` episode ${episode.number}` : ""}`;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-black/90 p-3 backdrop-blur-md sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <motion.section
          role="dialog"
          aria-modal="true"
          aria-label={`Play ${title.name}`}
          className="relative my-auto w-full max-w-5xl overflow-hidden rounded-xl border border-white/10 bg-[#171016] shadow-2xl"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.985 }}
          transition={{ duration: 0.25 }}
        >
          <div className="flex items-start justify-between gap-4 border-b border-white/[.08] p-4 sm:p-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-14 w-10 shrink-0 overflow-hidden rounded border border-white/10">
                <SmartImage src={title.poster} alt="" accent={title.accent} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="eyebrow flex items-center gap-1.5">
                  {title.type === "series" ? <Tv size={11} /> : <Film size={11} />}
                  {title.type === "series" ? "Series" : "Movie"} · {title.year} · {title.language}
                </p>
                <h2 className="mt-1 truncate font-display text-xl font-bold text-cream sm:text-2xl">{title.name}</h2>
                {episode && <p className="mt-0.5 truncate text-xs text-white/40">Episode {episode.number}: {episode.title}</p>}
              </div>
            </div>
            <button onClick={onClose} className="icon-button h-10 min-w-10" aria-label="Close video player"><X size={18} /></button>
          </div>

          <div className="bg-black">
            {embedUrl ? (
              <iframe
                key={embedUrl}
                className="aspect-video max-h-[70vh] w-full border-0 bg-black"
                src={embedUrl}
                title={label}
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                allowFullScreen
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="relative grid aspect-video place-items-center overflow-hidden bg-[#0c090c] p-6 text-center">
                <SmartImage
                  src={title.backdrop ?? title.poster}
                  alt=""
                  accent={title.accent}
                  className="absolute inset-0 h-full w-full object-cover opacity-15"
                />
                <div className="relative max-w-md">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-lime/25 bg-lime/10 text-lime">
                    <Play size={22} fill="currentColor" />
                  </span>
                  <h3 className="mt-4 font-display text-xl font-bold text-cream">No playback link added yet</h3>
                  <p className="mt-2 text-xs leading-5 text-white/45">
                    This title has no <code>videoUrl</code> or link in the catalog.
                  </p>
                </div>
              </div>
            )}
          </div>

          {catalogLinks.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 border-t border-white/[.08] p-4 sm:px-5">
              <p className="eyebrow mr-1">Quality</p>
              {catalogLinks.map((link, index) => (
                <button
                  key={link.id}
                  onClick={() => setLinkId(link.id)}
                  aria-pressed={link.id === activeLink?.id}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                    link.id === activeLink?.id
                      ? "border-lime/50 bg-lime/10 text-cream"
                      : "border-white/10 bg-white/[.02] text-white/55 hover:border-white/25"
                  }`}
                >
                  {link.label || `Link ${index + 1}`}
                </button>
              ))}
            </div>
          )}

          {title.type === "series" && episodes.length > 0 && (
            <div className="border-t border-white/[.08] p-4 sm:p-5">
              <p className="eyebrow mb-3">Episodes</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {episodes.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => selectEpisode(item)}
                    aria-pressed={item.id === episodeId}
                    className={`shrink-0 rounded-lg border px-3 py-2 text-left transition ${
                      item.id === episodeId
                        ? "border-lime/50 bg-lime/10 text-cream"
                        : "border-white/10 bg-white/[.02] text-white/55 hover:border-white/25"
                    }`}
                  >
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-lime/80">Episode {item.number}</span>
                    <span className="mt-1 block max-w-40 truncate text-xs">{item.title}</span>
                    <span className="mt-1 block text-[9px] text-white/30">{hasVideo(item) ? "Video ready" : "No video link"}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}
