import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle,
  Check,
  Download,
  ExternalLink,
  Pause,
  Play,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { formatBytes } from "../lib/utils";
import { useAppState } from "../state/AppState";
import type { DownloadTask } from "../types";
import { SmartImage } from "./UI";

type Tab = "queue" | "history";
const ACTIVE = ["queued", "downloading", "paused"];

function statusLabel(task: DownloadTask) {
  switch (task.status) {
    case "queued": return "Waiting for a transfer slot…";
    case "downloading": return task.total ? `${formatBytes(task.received)} of ${formatBytes(task.total)}` : `${formatBytes(task.received)} received`;
    case "paused": return `Paused at ${formatBytes(task.received)}`;
    case "complete": return `Saved · ${formatBytes(task.total || task.received)}`;
    case "cancelled": return "Cancelled · no completed file";
    case "external": return "Opened at the source";
    case "error": return "Transfer interrupted";
  }
}

export function DownloadsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    tasks, settings, setConcurrency, pauseTask, resumeTask, cancelTask,
    retryTask, removeTask, openExternal, clearFinished,
  } = useAppState();
  const [tab, setTab] = useState<Tab>("queue");

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

  const visible = useMemo(
    () => tasks.filter((task) => (tab === "queue" ? ACTIVE.includes(task.status) : !ACTIVE.includes(task.status))),
    [tasks, tab],
  );
  const activeCount = tasks.filter((task) => ACTIVE.includes(task.status)).length;
  const finishedCount = tasks.length - activeCount;
  const activeTasks = tasks.filter((task) => ACTIVE.includes(task.status));
  const measurableTasks = activeTasks.filter((task) => task.total > 0);
  const queueTotal = measurableTasks.reduce((sum, task) => sum + task.total, 0);
  const queueReceived = measurableTasks.reduce((sum, task) => sum + task.received, 0);
  const queueProgress = queueTotal ? Math.min(100, (queueReceived / queueTotal) * 100) : 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] bg-black/65 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
        >
          <motion.aside
            role="dialog" aria-modal="true" aria-label="Download manager"
            className="absolute inset-y-0 right-0 flex w-full max-w-[520px] flex-col border-l border-white/10 bg-[#181016] shadow-[-30px_0_100px_rgba(0,0,0,.5)]"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between border-b border-white/[.08] p-5 sm:p-6">
              <div>
                <p className="eyebrow">Transfer desk</p>
                <h2 className="mt-1 font-display text-3xl font-bold tracking-tight">
                  Downloads {activeCount > 0 && <span className="text-crimson">{activeCount}</span>}
                </h2>
              </div>
              <button onClick={onClose} className="icon-button" aria-label="Close downloads"><X size={19} /></button>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-white/[.08] px-6">
              <div className="flex gap-6">
                {(["queue", "history"] as Tab[]).map((value) => (
                  <button
                    key={value}
                    onClick={() => setTab(value)}
                    className={`relative py-3.5 text-[10px] font-bold uppercase tracking-[.15em] ${tab === value ? "text-cream" : "text-white/35"}`}
                  >
                    {value}
                    {value === "queue" && activeCount > 0 && <span className="ml-1.5 text-lime">{activeCount}</span>}
                    {value === "history" && finishedCount > 0 && <span className="ml-1.5 text-white/25">{finishedCount}</span>}
                    {tab === value && <motion.span layoutId="download-tab" className="absolute inset-x-0 bottom-0 h-0.5 bg-lime" />}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-white/30">
                Parallel
                <select
                  value={settings.concurrency}
                  onChange={(event) => setConcurrency(Number(event.target.value) as 1 | 2 | 3)}
                  className="rounded-md border border-white/10 bg-[#1c1319] px-2 py-1.5 text-[10px] text-lime outline-none"
                >
                  <option value={1}>1</option><option value={2}>2</option><option value={3}>3</option>
                </select>
              </label>
            </div>

            <div className="hide-scrollbar flex-1 overflow-y-auto p-5 sm:p-6">
              {tab === "queue" && activeCount > 0 && (
                <div className="mb-5 rounded-xl border border-lime/15 bg-lime/[.045] p-4">
                  <div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-wider"><span className="flex items-center gap-2 text-white/55"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime" />{activeCount} active transfer{activeCount > 1 ? "s" : ""}</span><span className="font-mono text-lime">{queueTotal ? `${Math.round(queueProgress)}%` : "Live"}</span></div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">{queueTotal ? <motion.div className="h-full rounded-full bg-gradient-to-r from-crimson to-lime" animate={{ width: `${queueProgress}%` }} /> : <motion.div className="h-full w-1/4 rounded-full bg-gradient-to-r from-crimson to-lime" animate={{ x: ["-100%", "400%"] }} transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }} />}</div>
                  <p className="mt-2.5 text-[10px] leading-4 text-white/35">{queueTotal ? `${formatBytes(queueReceived)} of ${formatBytes(queueTotal)} across the queue. ` : ""}Keep this tab open while files stream in.</p>
                </div>
              )}
              {tab === "history" && finishedCount > 0 && (
                <div className="mb-4 flex justify-end">
                  <button onClick={clearFinished} className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/35 hover:text-white">
                    <Trash2 size={12} />Clear history
                  </button>
                </div>
              )}
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {visible.map((task) => {
                    const progress = task.total ? Math.min(100, (task.received / task.total) * 100) : 0;
                    return (
                      <motion.article
                        layout key={task.id}
                        initial={{ opacity: 0, x: 25 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30, height: 0 }}
                        className="overflow-hidden rounded-xl border border-white/[.08] bg-white/[.025]"
                      >
                        <div className="flex gap-3.5 p-3.5">
                          <SmartImage src={task.poster} alt="" className="h-[72px] w-[54px] shrink-0 rounded-md object-cover" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="truncate text-sm font-semibold text-cream">{task.titleName}</h3>
                                <p className="mt-1 truncate text-[10px] uppercase tracking-wider text-white/30">{task.label}</p>
                              </div>
                              {task.status === "complete" ? <Check className="shrink-0 text-lime" size={18} /> : task.status === "error" ? <AlertCircle className="shrink-0 text-red-300" size={17} /> : null}
                            </div>
                            <p className={`mt-2.5 text-[11px] ${task.status === "error" ? "text-red-200/70" : "text-white/40"}`}>{statusLabel(task)}</p>
                            {["downloading", "paused"].includes(task.status) && (
                              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                                <motion.div
                                  className={`h-full ${task.status === "paused" ? "bg-orange" : "bg-lime"}`}
                                  animate={{ width: `${progress}%` }}
                                  transition={{ ease: "linear" }}
                                />
                              </div>
                            )}
                            {task.status === "queued" && (
                              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                                <motion.div className="h-full w-1/4 bg-white/20" animate={{ x: ["-100%", "400%"] }} transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut" }} />
                              </div>
                            )}
                          </div>
                        </div>
                        {task.error && <p className="mx-3.5 mb-3 rounded-md bg-black/25 p-2.5 text-[10px] leading-4 text-white/35">{task.error}</p>}
                        <div className="flex flex-wrap items-center gap-1 border-t border-white/[.06] px-2.5 py-2">
                          {task.status === "downloading" && <button onClick={() => pauseTask(task.id)} className="task-button"><Pause size={13} />Pause</button>}
                          {task.status === "paused" && <button onClick={() => resumeTask(task.id)} className="task-button text-lime"><Play size={13} />Resume</button>}
                          {["error", "cancelled", "external"].includes(task.status) && <button onClick={() => retryTask(task.id)} className="task-button text-lime"><RotateCcw size={13} />Retry</button>}
                          {ACTIVE.includes(task.status) && <button onClick={() => cancelTask(task.id)} className="task-button"><X size={13} />Cancel</button>}
                          {["error", "cancelled", "external"].includes(task.status) && <button onClick={() => openExternal(task.id)} className="task-button"><ExternalLink size={13} />Open link</button>}
                          {!ACTIVE.includes(task.status) && <button onClick={() => removeTask(task.id)} className="task-button ml-auto" aria-label="Remove from history"><Trash2 size={13} /></button>}
                        </div>
                      </motion.article>
                    );
                  })}
                </AnimatePresence>
              </div>
              {!visible.length && (
                <div className="grid place-items-center px-6 py-24 text-center">
                  <span className="grid h-16 w-16 place-items-center rounded-full border border-white/10 bg-white/[.025] text-white/25">
                    {tab === "queue" ? <Download size={25} /> : <Check size={25} />}
                  </span>
                  <h3 className="mt-5 font-display text-xl font-bold">{tab === "queue" ? "Your queue is clear" : "No history yet"}</h3>
                  <p className="mt-2 max-w-xs text-xs leading-5 text-white/35">
                    {tab === "queue"
                      ? "Pick a download link on any title and the transfer will land here with live progress."
                      : "Completed, cancelled, and interrupted transfers are recorded on this device."}
                  </p>
                </div>
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
