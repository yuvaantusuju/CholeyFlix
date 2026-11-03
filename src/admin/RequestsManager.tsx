import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, CheckCheck, Film, HelpCircle, Inbox, Plus, RotateCcw, Trash2, Tv, X } from "lucide-react";
import type { TitleRequest } from "../types";
import { useAppState } from "../state/AppState";
import { timeAgo } from "../lib/utils";

type Filter = "pending" | "added" | "rejected" | "all";

export function RequestsManager({ onPrefill }: { onPrefill: (request: TitleRequest) => void }) {
  const { requests, setRequestStatus, deleteRequest } = useAppState();
  const [filter, setFilter] = useState<Filter>("pending");
  const pending = requests.filter((request) => request.status === "pending").length;
  const visible = requests.filter((request) => filter === "all" || request.status === filter);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">User requests</p>
          <h1 className="mt-2 font-display text-4xl font-black tracking-[-2px] sm:text-5xl">The request tray</h1>
          <p className="mt-3 max-w-lg text-xs leading-6 text-white/40">{pending ? `${pending} title${pending === 1 ? "" : "s"} waiting for you. Publish one directly from the request, or mark it once it's on the wall.` : "The tray is empty. New user requests land here automatically."}</p>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap gap-2">
        {(["pending", "added", "rejected", "all"] as Filter[]).map((value) => (
          <button key={value} onClick={() => setFilter(value)} className={`rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition ${filter === value ? "bg-lime text-[#241203]" : "border border-white/10 text-white/40 hover:text-white"}`}>
            {value === "pending" ? `Waiting (${pending})` : value === "added" ? "Added" : value === "rejected" ? "Declined" : `All (${requests.length})`}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        <AnimatePresence mode="popLayout">
          {visible.map((request) => (
            <motion.article
              layout key={request.id}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30, height: 0 }}
              className="overflow-hidden rounded-xl border border-white/[.08] bg-white/[.02]"
            >
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${request.type === "series" ? "bg-lime/10 text-lime" : "bg-crimson/10 text-crimson"}`}>
                  {request.type === "series" ? <Tv size={18} /> : request.type === "movie" ? <Film size={18} /> : <HelpCircle size={18} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <h3 className="font-display text-lg font-bold leading-tight">{request.name}</h3>
                    {request.year && <span className="font-mono text-xs text-white/40">({request.year})</span>}
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${request.status === "pending" ? "bg-lime/10 text-lime" : request.status === "added" ? "bg-emerald-400/10 text-emerald-300" : "bg-red-400/10 text-red-300"}`}>
                      {request.status === "pending" ? "Waiting" : request.status === "added" ? "Added" : "Declined"}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[10px] uppercase tracking-wider text-white/30">
                    {request.type === "unsure" ? "Type unknown" : request.type} · requested {timeAgo(request.createdAt)}
                    {request.requester && ` · by ${request.requester}`}
                  </p>
                  {request.note && <p className="mt-2.5 rounded-md bg-black/25 p-3 text-xs leading-6 text-white/50">“{request.note}”</p>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-white/[.06] px-4 py-3 sm:px-5">
                {request.status === "pending" && (
                  <>
                    <button onClick={() => onPrefill(request)} className="primary-button h-9 px-4 text-[9px]"><Plus size={13} />Add this title</button>
                    <button onClick={() => setRequestStatus(request.id, "added")} className="secondary-button h-9 px-4 text-[9px]"><CheckCheck size={13} />Mark added</button>
                    <button onClick={() => setRequestStatus(request.id, "rejected")} className="secondary-button h-9 px-4 text-[9px]"><X size={13} />Decline</button>
                  </>
                )}
                {request.status !== "pending" && (
                  <button onClick={() => setRequestStatus(request.id, "pending")} className="secondary-button h-9 px-4 text-[9px]"><RotateCcw size={13} />Move back to waiting</button>
                )}
                <button onClick={() => deleteRequest(request.id)} className="task-button ml-auto text-white/30 hover:text-red-300"><Trash2 size={13} />Delete</button>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>

      {!visible.length && (
        <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[.015] px-6 py-16 text-center">
          <Inbox className="mx-auto text-white/20" size={30} />
          <h3 className="mt-4 font-display text-xl font-bold">{filter === "pending" ? "No waiting requests" : `No ${filter} requests`}</h3>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-white/35">{filter === "pending" ? "Users can request movies and series from the Request button on the site — their names, years, and notes will appear here." : "Switch the filter above to see the rest of the tray."}</p>
          {filter !== "pending" && <button onClick={() => setFilter("pending")} className="secondary-button mx-auto mt-4"><Check size={13} />Show waiting</button>}
        </div>
      )}
    </div>
  );
}
