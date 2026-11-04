import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Film, Link2, ListPlus, Plus, Save, Trash2, Tv, X } from "lucide-react";
import type { DownloadLink, Episode, Title, TitleRequest, TitleType } from "../types";
import { useAppState } from "../state/AppState";
import { isValidUrl, uid } from "./adminUtils";
import { SmartImage, normalizeImageSrc } from "../components/UI";

function UrlStatus({ url }: { url: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "fail">("idle");
  useEffect(() => {
    const value = normalizeImageSrc(url);
    if (!value) {
      setStatus("idle");
      return;
    }
    let alive = true;
    setStatus("loading");
    const attempt = (withoutReferrer: boolean) => {
      const img = new Image();
      if (withoutReferrer) img.referrerPolicy = "no-referrer";
      img.onload = () => { if (alive) setStatus("ok"); };
      img.onerror = () => {
        if (!alive) return;
        if (!withoutReferrer) attempt(true);
        else setStatus("fail");
      };
      img.src = value;
    };
    attempt(false);
    return () => { alive = false; };
  }, [url]);
  if (status === "idle") return null;
  if (status === "loading") return <p className="mt-1.5 text-[10px] text-white/30">Checking image…</p>;
  if (status === "ok") return <p className="mt-1.5 text-[10px] font-semibold text-lime">✓ Image loads — users will see it</p>;
  return <p className="mt-1.5 text-[10px] leading-4 text-red-300">Can't load this image. The URL may be broken, http-only, or the host blocks embedding — users will see a placeholder.</p>;
}

type DraftLink = { id: string; label: string; url: string; size: string };
type DraftEpisode = { id: string; number: string; title: string; videoUrl: string; links: DraftLink[] };

const ACCENTS = ["#e36b45", "#b7d63e", "#4b9bb5", "#a970d5", "#e84a75", "#c69c5c", "#71876b", "#4f9c9b", "#d76340", "#8f8578"];

function parseSize(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  const match = trimmed.match(/^([\d.]+)\s*(b|kb|mb|gb|tb)$/i);
  if (!match) return undefined;
  const multipliers: Record<string, number> = { b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3, tb: 1024 ** 4 };
  return Math.round(Number(match[1]) * multipliers[match[2].toLowerCase()]);
}

const emptyLink = (): DraftLink => ({ id: uid("lnk"), label: "", url: "", size: "" });
const emptyEpisode = (number: number): DraftEpisode => ({ id: uid("ep"), number: String(number), title: "", videoUrl: "", links: [emptyLink()] });

function LinkEditor({ link, onChange, onRemove }: { link: DraftLink; onChange: (patch: Partial<DraftLink>) => void; onRemove: () => void }) {
  const urlInvalid = link.url.trim() !== "" && !isValidUrl(link.url.trim());
  return (
    <div className="grid gap-2 rounded-lg border border-white/[.08] bg-black/20 p-3 sm:grid-cols-[150px_1fr_110px_36px]">
      <input className="text-input" placeholder="Label · e.g. 1080p WEB-DL" value={link.label} onChange={(event) => onChange({ label: event.target.value })} />
      <div>
        <input className={`text-input font-mono !text-[11px] ${urlInvalid ? "!border-red-400/60" : ""}`} placeholder="https://… direct file URL" value={link.url} onChange={(event) => onChange({ url: event.target.value })} />
        {urlInvalid && <p className="mt-1 text-[10px] text-red-300">Must be a valid http(s) URL</p>}
      </div>
      <input className="text-input" placeholder="Size · 1.4 GB" value={link.size} onChange={(event) => onChange({ size: event.target.value })} />
      <button onClick={onRemove} className="grid h-[42px] place-items-center rounded-md border border-white/10 text-white/30 transition hover:border-red-400/40 hover:text-red-300" aria-label="Remove link">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export function TitleForm({ editingId, prefill, onDone }: { editingId: string | null; prefill?: TitleRequest | null; onDone: () => void }) {
  const { titles, addTitle, updateTitle, toast, setRequestStatus } = useAppState();
  const existing = useMemo(() => titles.find((title) => title.id === editingId) ?? null, [titles, editingId]);

  const [name, setName] = useState(existing?.name ?? prefill?.name ?? "");
  const [type, setType] = useState<TitleType>(existing?.type ?? (prefill && prefill.type !== "unsure" ? prefill.type : "movie"));
  const [year, setYear] = useState(existing ? String(existing.year) : prefill?.year ?? "");
  const [language, setLanguage] = useState(existing?.language ?? "");
  const [genres, setGenres] = useState(existing?.genres.join(", ") ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [poster, setPoster] = useState(existing?.poster ?? "");
  const [backdrop, setBackdrop] = useState(existing?.backdrop ?? "");
  const [accent, setAccent] = useState(existing?.accent ?? ACCENTS[0]);
  const [featured, setFeatured] = useState(existing?.featured ?? false);
  const [videoUrl, setVideoUrl] = useState(existing?.videoUrl ?? "");
  const [links, setLinks] = useState<DraftLink[]>(existing?.links.map((link) => ({ id: link.id, label: link.label, url: link.url, size: link.size ? String(link.size) : "" })) ?? [emptyLink()]);
  const [episodes, setEpisodes] = useState<DraftEpisode[]>(
    existing?.episodes?.map((episode) => ({
      id: episode.id,
      number: String(episode.number),
      title: episode.title,
      videoUrl: episode.videoUrl ?? "",
      links: episode.links.map((link) => ({ id: link.id, label: link.label, url: link.url, size: link.size ? String(link.size) : "" })),
    })) ?? [emptyEpisode(1)],
  );
  const [errors, setErrors] = useState<string[]>([]);

  const patchLink = (id: string, patch: Partial<DraftLink>) => setLinks((current) => current.map((link) => (link.id === id ? { ...link, ...patch } : link)));
  const patchEpisode = (id: string, patch: Partial<DraftEpisode>) => setEpisodes((current) => current.map((episode) => (episode.id === id ? { ...episode, ...patch } : episode)));
  const patchEpisodeLink = (episodeId: string, linkId: string, patch: Partial<DraftLink>) =>
    setEpisodes((current) =>
      current.map((episode) =>
        episode.id === episodeId ? { ...episode, links: episode.links.map((link) => (link.id === linkId ? { ...link, ...patch } : link)) } : episode,
      ),
    );

  const buildLinks = (drafts: DraftLink[]): DownloadLink[] =>
    drafts
      .filter((link) => link.url.trim() && isValidUrl(link.url.trim()))
      .map((link) => ({ id: link.id, label: link.label.trim() || "Download", url: link.url.trim(), size: parseSize(link.size) }));

  const submit = () => {
    const problems: string[] = [];
    if (!name.trim()) problems.push("Give the title a name.");
    const yearNumber = Number(year);
    if (!year || !Number.isInteger(yearNumber) || yearNumber < 1880 || yearNumber > 2100) problems.push("Enter a valid year (1880–2100).");
    const movieLinks = type === "movie" ? buildLinks(links) : [];
    const builtEpisodes: Episode[] = episodes
      .filter((episode) => episode.title.trim() || episode.links.some((link) => link.url.trim()))
      .map((episode, index) => ({
        id: episode.id,
        number: Number(episode.number) || index + 1,
        title: episode.title.trim() || `Episode ${index + 1}`,
        videoUrl: episode.videoUrl.trim() || undefined,
        links: buildLinks(episode.links),
      }));
    if (type === "movie" && !movieLinks.length) problems.push("Add at least one valid download link for a movie.");
    if (type === "movie" && videoUrl.trim() && !isValidUrl(videoUrl.trim())) problems.push("The movie playback URL must be a valid http(s) URL.");
    if (type === "series") {
      if (!builtEpisodes.length) problems.push("Add at least one episode for a series.");
      else if (builtEpisodes.some((episode) => !episode.links.length)) problems.push("Every episode needs at least one valid download link.");
      if (builtEpisodes.some((episode) => episode.videoUrl && !isValidUrl(episode.videoUrl))) problems.push("Every episode playback URL must be a valid http(s) URL.");
    }
    if (problems.length) {
      setErrors(problems);
      toast("Check the form", problems[0], "error");
      return;
    }
    const now = Date.now();
    const posterFinal = poster.trim() || backdrop.trim();
    const entry: Title = {
      id: existing?.id ?? uid("title"),
      name: name.trim(),
      type,
      year: yearNumber,
      language: language.trim() || "Unknown",
      genres: genres.split(",").map((genre) => genre.trim()).filter(Boolean),
      description: description.trim() || "No description provided yet.",
      poster: posterFinal,
      backdrop: backdrop.trim() || posterFinal || undefined,
      accent,
      featured,
      videoUrl: type === "movie" ? videoUrl.trim() || undefined : undefined,
      links: type === "movie" ? movieLinks : [],
      episodes: type === "series" ? builtEpisodes : undefined,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    if (existing) updateTitle(existing.id, entry);
    else addTitle(entry);
    if (prefill) setRequestStatus(prefill.id, "added");
    onDone();
  };

  const totalLinks = type === "movie" ? links.filter((link) => isValidUrl(link.url.trim())).length : episodes.reduce((sum, episode) => sum + episode.links.filter((link) => isValidUrl(link.url.trim())).length, 0);

  return (
    <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
      <div>
        <p className="eyebrow">{existing ? "Editing" : "New entry"}</p>
        <h1 className="mt-2 font-display text-4xl font-black tracking-[-2px] sm:text-5xl">{existing ? existing.name : "Add a title"}</h1>
        <p className="mt-3 max-w-xl text-xs leading-6 text-white/40">Add catalog details, optional playable video URLs, and download links. Playback URLs are separate from downloads.</p>
        {prefill && !existing && (
          <div className="mt-5 rounded-lg border border-lime/25 bg-lime/[.05] p-4 text-xs leading-6 text-white/50">
            <p className="font-bold uppercase tracking-wider text-lime">Fulfilling a user request</p>
            <p className="mt-1">Requested by {prefill.requester || "a visitor"} — the name, type, and year are pre-filled. Add the download links below; publishing will mark the request as added.</p>
            {prefill.note && <p className="mt-2 rounded bg-black/25 p-2.5 italic">“{prefill.note}”</p>}
          </div>
        )}

        {errors.length > 0 && (
          <div className="mt-5 rounded-lg border border-red-400/25 bg-red-400/[.05] p-4">
            {errors.map((problem) => <p key={problem} className="flex items-center gap-2 text-xs text-red-200"><X size={12} className="shrink-0" />{problem}</p>)}
          </div>
        )}

        <div className="mt-7 space-y-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_110px]">
            <div><label className="field-label">Title name *</label><input className="text-input" placeholder="e.g. Sita Sings the Blues" value={name} onChange={(event) => setName(event.target.value)} /></div>
            <div><label className="field-label">Year *</label><input className="text-input" placeholder="2024" inputMode="numeric" value={year} onChange={(event) => setYear(event.target.value)} /></div>
          </div>

          <div>
            <label className="field-label">Type</label>
            <div className="mt-2 grid max-w-xs grid-cols-2 gap-2">
              <button type="button" onClick={() => setType("movie")} className={`seg-btn ${type === "movie" ? "seg-active" : ""}`}><Film size={14} />Movie</button>
              <button type="button" onClick={() => setType("series")} className={`seg-btn ${type === "series" ? "seg-active" : ""}`}><Tv size={14} />Series</button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="field-label">Language</label><input className="text-input" placeholder="e.g. Hindi · English" value={language} onChange={(event) => setLanguage(event.target.value)} /></div>
            <div><label className="field-label">Genres (comma separated)</label><input className="text-input" placeholder="Action, Drama" value={genres} onChange={(event) => setGenres(event.target.value)} /></div>
          </div>

          <div><label className="field-label">Description</label><textarea className="text-input min-h-[96px] resize-y" placeholder="What is it about? A couple of sentences users will read before downloading." value={description} onChange={(event) => setDescription(event.target.value)} /></div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">Poster URL</label>
              <input className="text-input font-mono !text-[11px]" placeholder="https://… poster image" value={poster} onChange={(event) => setPoster(event.target.value)} />
              <UrlStatus url={poster.trim()} />
            </div>
            <div>
              <label className="field-label">Backdrop URL (optional)</label>
              <input className="text-input font-mono !text-[11px]" placeholder="https://… wide image" value={backdrop} onChange={(event) => setBackdrop(event.target.value)} />
              <UrlStatus url={backdrop.trim()} />
            </div>
          </div>
          {poster.trim().startsWith("http://") || backdrop.trim().startsWith("http://") ? (
            <p className="rounded-md border border-lime/20 bg-lime/[.05] px-3 py-2 text-[10px] leading-4 text-white/45">http:// links are automatically upgraded to https:// so browsers don't block them on the user site.</p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <label className="field-label">Accent color</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {ACCENTS.map((color) => (
                  <button key={color} type="button" onClick={() => setAccent(color)} className={`h-8 w-8 rounded-md border-2 transition ${accent === color ? "scale-110 border-cream" : "border-transparent hover:scale-105"}`} style={{ background: color }} aria-label={`Accent ${color}`} />
                ))}
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-3 pb-1">
              <span className="text-xs font-semibold text-white/60">Feature on home</span>
              <input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} className="toggle-input" />
            </label>
          </div>

          {type === "movie" ? (
            <section className="rounded-xl border border-white/[.08] bg-white/[.015] p-5">
              <div className="mb-5">
                <label className="field-label">Movie playback URL (optional)</label>
                <input className={`text-input font-mono !text-[11px] ${videoUrl.trim() && !isValidUrl(videoUrl.trim()) ? "!border-red-400/60" : ""}`} placeholder="https://… playable MP4 or WebM URL" value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} />
                <p className="mt-1.5 text-[10px] leading-4 text-white/30">Use a video URL the browser can play and that you are authorized to distribute. Download links below are not used for playback.</p>
                {videoUrl.trim() && !isValidUrl(videoUrl.trim()) && <p className="mt-1 text-[10px] text-red-300">Must be a valid http(s) URL</p>}
              </div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-lg font-bold"><Link2 size={16} className="text-lime" />Download links *</h2>
                <button type="button" onClick={() => setLinks((current) => [...current, emptyLink()])} className="secondary-button h-9 text-[9px]"><Plus size={13} />Add link</button>
              </div>
              <div className="space-y-2.5">
                {links.map((link) => (
                  <LinkEditor key={link.id} link={link} onChange={(patch) => patchLink(link.id, patch)} onRemove={() => setLinks((current) => (current.length > 1 ? current.filter((entry) => entry.id !== link.id) : current))} />
                ))}
              </div>
            </section>
          ) : (
            <section className="rounded-xl border border-white/[.08] bg-white/[.015] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-lg font-bold"><ListPlus size={16} className="text-lime" />Episodes *</h2>
                <button type="button" onClick={() => setEpisodes((current) => [...current, emptyEpisode(current.length + 1)])} className="secondary-button h-9 text-[9px]"><Plus size={13} />Add episode</button>
              </div>
              <div className="space-y-4">
                {episodes.map((episode, index) => (
                  <motion.div key={episode.id} layout className="rounded-lg border border-white/[.08] bg-black/20 p-4">
                    <div className="mb-3 grid gap-2 sm:grid-cols-[80px_1fr_36px]">
                      <input className="text-input" placeholder="No." inputMode="numeric" value={episode.number} onChange={(event) => patchEpisode(episode.id, { number: event.target.value })} />
                      <input className="text-input" placeholder={`Episode title · e.g. Episode ${index + 1}`} value={episode.title} onChange={(event) => patchEpisode(episode.id, { title: event.target.value })} />
                      <button onClick={() => setEpisodes((current) => (current.length > 1 ? current.filter((entry) => entry.id !== episode.id) : current))} className="grid h-[42px] place-items-center rounded-md border border-white/10 text-white/30 transition hover:border-red-400/40 hover:text-red-300" aria-label="Remove episode">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="mb-3">
                      <label className="field-label">Episode playback URL (optional)</label>
                      <input className={`text-input font-mono !text-[11px] ${episode.videoUrl.trim() && !isValidUrl(episode.videoUrl.trim()) ? "!border-red-400/60" : ""}`} placeholder="https://… playable MP4 or WebM URL" value={episode.videoUrl} onChange={(event) => patchEpisode(episode.id, { videoUrl: event.target.value })} />
                      {episode.videoUrl.trim() && !isValidUrl(episode.videoUrl.trim()) && <p className="mt-1 text-[10px] text-red-300">Must be a valid http(s) URL</p>}
                    </div>
                    <div className="space-y-2.5">
                      {episode.links.map((link) => (
                        <LinkEditor key={link.id} link={link} onChange={(patch) => patchEpisodeLink(episode.id, link.id, patch)} onRemove={() => patchEpisode(episode.id, { links: episode.links.length > 1 ? episode.links.filter((entry) => entry.id !== link.id) : episode.links })} />
                      ))}
                    </div>
                    <button type="button" onClick={() => patchEpisode(episode.id, { links: [...episode.links, emptyLink()] })} className="mt-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/35 transition hover:text-lime">
                      <Plus size={12} />Another quality for this episode
                    </button>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          <div className="flex flex-wrap gap-3 border-t border-white/[.08] pt-6">
            <button onClick={submit} className="primary-button h-11 px-7"><Save size={15} />{existing ? "Save changes" : "Publish title"}</button>
            <button onClick={onDone} className="secondary-button h-11">Cancel</button>
          </div>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="eyebrow mb-3">Live preview</p>
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#171016]">
          <div className="relative h-36 overflow-hidden">
            <SmartImage src={backdrop || poster} alt="" accent={accent} className="h-full w-full object-cover opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#171016] to-transparent" />
          </div>
          <div className="-mt-12 flex gap-4 p-4">
            <div className="h-28 w-20 shrink-0 overflow-hidden rounded-md border border-white/10 shadow-xl">
              <SmartImage src={poster} alt="" accent={accent} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 pt-10">
              <p className="truncate font-display text-lg font-black uppercase leading-tight tracking-tight">{name || "Untitled"}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-white/35">{year || "Year"} · {language || "Language"}</p>
            </div>
          </div>
          <div className="space-y-1.5 border-t border-white/[.07] p-4">
            <p className="text-[10px] uppercase tracking-wider text-white/30">{type === "movie" ? "Movie" : `${episodes.length} episodes`} · {totalLinks} valid link{totalLinks === 1 ? "" : "s"}</p>
            <div className="flex flex-wrap gap-1">{(genres ? genres.split(",").map((genre) => genre.trim()).filter(Boolean) : []).slice(0, 4).map((genre) => <span key={genre} className="rounded-sm border border-lime/25 bg-lime/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-lime">{genre}</span>)}</div>
          </div>
        </div>
        <p className="mt-4 text-[10px] leading-5 text-white/25">Tip: size accepts bytes or human units like “512 MB” or “1.4 GB”. Labels like “480p · 400MB” help users choose quickly.</p>
      </aside>
    </div>
  );
}
