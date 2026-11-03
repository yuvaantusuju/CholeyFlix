import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, CheckCheck, Clock3, Film, HelpCircle, Send, Trash2, Tv, X, XCircle } from "lucide-react";
import type { TitleRequest } from "../types";
import { useAppState } from "../state/AppState";
import { timeAgo } from "../lib/utils";

function StatusBadge({ status }: { status: TitleRequest["status"] }) {
  if (status === "pending")
    return <span className="inline-flex items-center gap-1 rounded-full bg-lime/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-lime"><Clock3 size={10} />Waiting</span>;
  if (status === "added")
    return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-300"><CheckCheck size={10} />Added</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-red-400/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-red-300"><XCircle size={10} />Declined</span>;
}

export function RequestModal({ open, initialName = "", onClose }: { open: boolean; initialName?: string; onClose: () => void }) {
  const { requests, addRequest, deleteRequest } = useAppState();
  const [name, setName] = useState("");
  const [type, setType] = useState<TitleRequest["type"]>("movie");
  const [year, setYear] = useState("");
  const [note, setNote] = useState("");
  const [requester, setRequester] = useState(() => localStorage.getItem("choleyflix:v2:requester") ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", key);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setError("");
      if (initialName.trim()) setName(initialName.trim());
    }
  }, [open, initialName]);

  const submit = () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Enter the movie or series name (at least 2 characters).");
      return;
    }
    if (year && !/^\d{4}$/.test(year.trim())) {
      setError("Year should be four digits, or leave it blank.");
      return;
    }
    const duplicate = requests.find((request) => request.status === "pending" && request.name.toLowerCase() === trimmed.toLowerCase());
    if (duplicate) {
      setError("This title is already waiting in your requests below.");
      return;
    }
    const displayName = requester.trim();
    if (displayName) localStorage.setItem("choleyflix:v2:requester", displayName);
    addRequest({ name: trimmed, type, year: year.trim(), note: note.trim(), requester: displayName });
    setName("");
    setYear("");
    setNote("");
    setType("movie");
    setError("");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[85] overflow-y-auto bg-black/80 p-3 backdrop-blur-md sm:p-8"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
        >
          <motion.div
            role="dialog" aria-modal="true" aria-label="Request a title"
            className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#171016] shadow-2xl"
            initial={{ opacity: 0, y: 40, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-start justify-between border-b border-white/[.08] p-6 sm:p-7">
              <div>
                <p className="eyebrow">Ask the projectionist</p>
                <h2 className="mt-2 font-display text-3xl font-black tracking-tight">Request a title</h2>
                <p className="mt-2 max-w-md text-xs leading-6 text-white/40">Can't find it on the wall? Name it below — the admin sees your request in the control room and can publish it in one click.</p>
              </div>
              <button onClick={onClose} className="icon-button h-9 w-9 shrink-0" aria-label="Close request panel"><X size={17} /></button>
            </div>

            <div className="p-6 sm:p-7">
              <div className="grid gap-4 sm:grid-cols-[1fr_110px]">
                <div>
                  <label className="field-label">Movie or series name *</label>
                  <input className="text-input" placeholder="e.g. Sita Sings the Blues" value={name} onChange={(event) => { setName(event.target.value); setError(""); }} onKeyDown={(event) => { if (event.key === "Enter") submit(); }} autoFocus />
                </div>
                <div>
                  <label className="field-label">Year (optional)</label>
                  <input className="text-input" placeholder="2008" inputMode="numeric" maxLength={4} value={year} onChange={(event) => { setYear(event.target.value); setError(""); }} />
                </div>
              </div>

              <div className="mt-4">
                <label className="field-label">It's a…</label>
                <div className="mt-2 grid max-w-sm grid-cols-3 gap-2">
                  {([
                    { value: "movie", label: "Movie", icon: Film },
                    { value: "series", label: "Series", icon: Tv },
                    { value: "unsure", label: "Not sure", icon: HelpCircle },
                  ] as const).map((entry) => (
                    <button key={entry.value} type="button" onClick={() => setType(entry.value)} className={`seg-btn ${type === entry.value ? "seg-active" : ""}`}>
                      <entry.icon size={13} />{entry.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label className="field-label">Anything that helps (optional)</label>
                <textarea className="text-input min-h-[76px] resize-y" placeholder="Language, quality you'd like, season, or a link to where you saw it…" value={note} onChange={(event) => setNote(event.target.value)} />
              </div>

              <div className="mt-4">
                <label className="field-label">Your name (optional)</label>
                <input className="text-input" placeholder="So the admin knows who to thank" value={requester} onChange={(event) => setRequester(event.target.value)} />
              </div>

              {error && <p className="mt-4 rounded-md border border-red-400/25 bg-red-400/[.05] px-3 py-2.5 text-xs text-red-200">{error}</p>}

              <button onClick={submit} className="primary-button mt-5 w-full sm:w-auto"><Send size={15} />Send request</button>

              <div className="mt-8 border-t border-white/[.08] pt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold">Your requests</h3>
                  <span className="text-[10px] uppercase tracking-wider text-white/30">{requests.length} on this device</span>
                </div>
                {requests.length ? (
                  <div className="space-y-2">
                    {requests.map((request) => (
                      <motion.div layout key={request.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3 rounded-lg border border-white/[.07] bg-white/[.02] p-3.5">
                        <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md ${request.type === "series" ? "bg-lime/10 text-lime" : "bg-crimson/10 text-crimson"}`}>
                          {request.type === "series" ? <Tv size={13} /> : request.type === "movie" ? <Film size={13} /> : <HelpCircle size={13} />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <p className="truncate text-sm font-semibold text-cream">{request.name}{request.year && <span className="ml-1.5 font-mono text-xs text-white/35">({request.year})</span>}</p>
                            <StatusBadge status={request.status} />
                          </div>
                          <p className="mt-1 text-[10px] uppercase tracking-wider text-white/25">Requested {timeAgo(request.createdAt)}{request.status === "added" && request.resolvedAt ? ` · added ${timeAgo(request.resolvedAt)}` : ""}</p>
                          {request.note && <p className="mt-1.5 text-xs leading-5 text-white/40">{request.note}</p>}
                        </div>
                        <button onClick={() => deleteRequest(request.id)} className="mt-0.5 shrink-0 text-white/25 transition hover:text-red-300" aria-label={`Delete request ${request.name}`}><Trash2 size={14} /></button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-white/10 px-4 py-8 text-center">
                    <Check size={20} className="mx-auto text-white/20" />
                    <p className="mt-2 text-xs text-white/35">Nothing requested yet. Your sent requests and their status will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
