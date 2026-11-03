import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  AdminSettings,
  DownloadLink,
  DownloadTask,
  Title,
  TitleRequest,
  TitleRequestStatus,
  Toast,
} from "../types";
import { DEFAULT_PIN, seedTitles } from "../data/seed";
import { safeFileName, uid } from "../lib/utils";

const KEY_PREFIX = "choleyflix:v2:";

function readStored<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(KEY_PREFIX + key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function usePersistentState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readStored(key, fallback));
  useEffect(() => {
    try {
      localStorage.setItem(KEY_PREFIX + key, JSON.stringify(value));
    } catch {
      // The app keeps working when storage is blocked (private browsing).
    }
  }, [key, value]);
  return [value, setValue] as const;
}

type TaskControl = {
  abort: AbortController;
  paused: boolean;
  resume?: () => void;
};

export type AdminTab = "dashboard" | "titles" | "requests" | "add" | "settings";

type AppState = {
  titles: Title[];
  addTitle: (title: Title) => void;
  updateTitle: (id: string, patch: Partial<Title>) => void;
  deleteTitle: (id: string) => void;
  toggleFeatured: (id: string) => void;
  resetToSeed: () => void;
  importTitles: (titles: Title[]) => void;
  isAdmin: boolean;
  login: (pin: string) => boolean;
  logout: () => void;
  settings: AdminSettings;
  changePin: (pin: string) => void;
  setConcurrency: (value: 1 | 2 | 3) => void;
  tasks: DownloadTask[];
  enqueue: (title: Title, link: DownloadLink, episodeLabel?: string) => boolean;
  pauseTask: (id: string) => void;
  resumeTask: (id: string) => void;
  cancelTask: (id: string) => void;
  retryTask: (id: string) => void;
  removeTask: (id: string) => void;
  openExternal: (id: string) => void;
  clearFinished: () => void;
  requests: TitleRequest[];
  addRequest: (request: Omit<TitleRequest, "id" | "status" | "createdAt">) => void;
  setRequestStatus: (id: string, status: TitleRequestStatus) => void;
  deleteRequest: (id: string) => void;
  toasts: Toast[];
  toast: (title: string, message?: string, tone?: "default" | "error") => void;
  dismissToast: (id: number) => void;
};

const AppStateContext = createContext<AppState | null>(null);
const ACTIVE_STATES = ["queued", "downloading", "paused"];

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [titles, setTitles] = usePersistentState<Title[]>("titles", seedTitles);
  const [settings, setSettings] = usePersistentState<AdminSettings>("settings", {
    pin: DEFAULT_PIN,
    concurrency: 2,
  });
  const [tasks, setTasks] = usePersistentState<DownloadTask[]>("downloads", []);
  const [requests, setRequests] = usePersistentState<TitleRequest[]>("requests", []);
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem(KEY_PREFIX + "session") === "1");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const controls = useRef(new Map<string, TaskControl>());
  const toastId = useRef(0);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  // Transfers cannot survive a page reload — mark leftovers honestly.
  useEffect(() => {
    const stale = tasks.filter((task) => ACTIVE_STATES.includes(task.status));
    if (stale.length) {
      const ids = new Set(stale.map((task) => task.id));
      setTasks((current) =>
        current.map((task) =>
          ids.has(task.id)
            ? { ...task, status: "cancelled", error: "Interrupted when the browser session ended. Retry to restart." }
            : task,
        ),
      );
    }
    // Recovery pass runs once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (title: string, message?: string, tone: "default" | "error" = "default") => {
      const id = ++toastId.current;
      setToasts((current) => [...current.slice(-2), { id, title, message, tone }]);
      window.setTimeout(() => dismissToast(id), 5000);
    },
    [dismissToast],
  );

  // ----- Admin -----
  const login = useCallback(
    (pin: string) => {
      if (pin === settings.pin) {
        setIsAdmin(true);
        sessionStorage.setItem(KEY_PREFIX + "session", "1");
        return true;
      }
      return false;
    },
    [settings.pin],
  );

  const logout = useCallback(() => {
    setIsAdmin(false);
    sessionStorage.removeItem(KEY_PREFIX + "session");
  }, []);

  const changePin = useCallback(
    (pin: string) => {
      setSettings((current) => ({ ...current, pin }));
      toast("PIN updated", "Use the new PIN the next time you sign in.");
    },
    [setSettings, toast],
  );

  const setConcurrency = useCallback(
    (value: 1 | 2 | 3) => setSettings((current) => ({ ...current, concurrency: value })),
    [setSettings],
  );

  // ----- Catalog CRUD -----
  const addTitle = useCallback(
    (entry: Title) => {
      setTitles((current) => [entry, ...current]);
      toast("Title published", `“${entry.name}” is now visible to users.`);
    },
    [setTitles, toast],
  );

  const updateTitle = useCallback(
    (id: string, patch: Partial<Title>) => {
      setTitles((current) =>
        current.map((entry) => (entry.id === id ? { ...entry, ...patch, updatedAt: Date.now() } : entry)),
      );
      toast("Changes saved");
    },
    [setTitles, toast],
  );

  const deleteTitle = useCallback(
    (id: string) => {
      const target = titles.find((entry) => entry.id === id);
      setTitles((current) => current.filter((entry) => entry.id !== id));
      toast("Title removed", target ? `“${target.name}” and its links were deleted.` : undefined);
    },
    [titles, setTitles, toast],
  );

  const toggleFeatured = useCallback(
    (id: string) => {
      setTitles((current) => {
        const target = current.find((entry) => entry.id === id);
        if (!target) return current;
        return target.featured
          ? current.map((entry) => (entry.id === id ? { ...entry, featured: false } : entry))
          : current.map((entry) => ({ ...entry, featured: entry.id === id }));
      });
    },
    [setTitles],
  );

  const resetToSeed = useCallback(() => {
    setTitles(seedTitles);
    toast("Catalog reset", "The demo catalog was restored. Custom titles were removed.");
  }, [setTitles, toast]);

  const importTitles = useCallback(
    (imported: Title[]) => {
      setTitles(imported);
      toast("Import complete", `${imported.length} titles replaced the current catalog.`);
    },
    [setTitles, toast],
  );

  // ----- Download engine -----
  const patchTask = useCallback(
    (id: string, patch: Partial<DownloadTask>) => {
      setTasks((current) => current.map((task) => (task.id === id ? { ...task, ...patch } : task)));
    },
    [setTasks],
  );

  const runDownload = useCallback(
    async (task: DownloadTask) => {
      if (controls.current.has(task.id)) return;
      const control: TaskControl = { abort: new AbortController(), paused: false };
      controls.current.set(task.id, control);
      patchTask(task.id, { status: "downloading", received: 0, error: undefined });

      try {
        const response = await fetch(task.url, { signal: control.abort.signal });
        if (!response.ok) throw new Error(`The link returned HTTP ${response.status}`);
        const total = Number(response.headers.get("content-length")) || task.total || 0;
        const chunks: Uint8Array[] = [];
        let received = 0;
        let lastPaint = 0;

        const saveBlob = (blob: Blob) => {
          const objectUrl = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = objectUrl;
          anchor.download = safeFileName(`${task.titleName} ${task.label}`, task.url);
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
        };

        if (!response.body) {
          const blob = await response.blob();
          if (control.abort.signal.aborted) throw new DOMException("Cancelled", "AbortError");
          saveBlob(blob);
          received = blob.size;
        } else {
          const reader = response.body.getReader();
          patchTask(task.id, { total });
          while (true) {
            if (control.paused) {
              await new Promise<void>((resolve) => {
                control.resume = resolve;
              });
              control.resume = undefined;
            }
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              chunks.push(value);
              received += value.byteLength;
              const now = performance.now();
              if (now - lastPaint > 130) {
                patchTask(task.id, { received, total });
                lastPaint = now;
              }
            }
          }
          saveBlob(new Blob(chunks as BlobPart[], { type: response.headers.get("content-type") ?? "application/octet-stream" }));
        }

        patchTask(task.id, { status: "complete", received, total: total || received, completedAt: Date.now() });
        toast("Download complete", `${task.titleName} · ${task.label} was saved by your browser.`);
      } catch (error) {
        const cancelled = error instanceof DOMException && error.name === "AbortError";
        const latest = tasksRef.current.find((entry) => entry.id === task.id);
        if (cancelled || latest?.status === "cancelled") {
          patchTask(task.id, { status: "cancelled", error: "Transfer cancelled. No completed file was created." });
        } else {
          const message = error instanceof Error ? error.message : "The transfer could not be completed";
          patchTask(task.id, {
            status: "error",
            error: `${message}. The link may block direct transfers — open it in a new tab instead.`,
          });
          toast("Download interrupted", "Use “Open link” on the failed transfer.", "error");
        }
      } finally {
        controls.current.delete(task.id);
      }
    },
    [patchTask, toast],
  );

  useEffect(() => {
    const active = tasks.filter((task) => ["downloading", "paused"].includes(task.status)).length;
    const slots = Math.max(0, settings.concurrency - active);
    if (!slots) return;
    tasks
      .filter((task) => task.status === "queued")
      .slice(0, slots)
      .forEach((task) => void runDownload(task));
  }, [tasks, settings.concurrency, runDownload]);

  const enqueue = useCallback(
    (title: Title, link: DownloadLink, episodeLabel?: string): boolean => {
      const duplicate = tasksRef.current.find(
        (task) => task.url === link.url && ACTIVE_STATES.includes(task.status),
      );
      if (duplicate) {
        toast("Already in the queue", "Open Downloads to manage this transfer.");
        return false;
      }
      const label = episodeLabel ? `${episodeLabel} · ${link.label}` : link.label;
      const task: DownloadTask = {
        id: uid("dl"),
        titleId: title.id,
        titleName: title.name,
        label,
        url: link.url,
        poster: title.poster,
        status: "queued",
        received: 0,
        total: link.size ?? 0,
        createdAt: Date.now(),
      };
      setTasks((current) => [task, ...current]);
      toast("Added to Downloads", `${title.name} · ${label}`);
      return true;
    },
    [setTasks, toast],
  );

  const pauseTask = useCallback(
    (id: string) => {
      const control = controls.current.get(id);
      if (!control) return;
      control.paused = true;
      patchTask(id, { status: "paused" });
    },
    [patchTask],
  );

  const resumeTask = useCallback(
    (id: string) => {
      const control = controls.current.get(id);
      if (!control) return;
      control.paused = false;
      patchTask(id, { status: "downloading" });
      control.resume?.();
    },
    [patchTask],
  );

  const cancelTask = useCallback(
    (id: string) => {
      const control = controls.current.get(id);
      if (control) {
        control.paused = false;
        control.resume?.();
        control.abort.abort();
      }
      patchTask(id, { status: "cancelled", error: "Transfer cancelled. No completed file was created." });
    },
    [patchTask],
  );

  const retryTask = useCallback(
    (id: string) => {
      controls.current.get(id)?.abort.abort();
      controls.current.delete(id);
      patchTask(id, { status: "queued", received: 0, error: undefined, completedAt: undefined });
    },
    [patchTask],
  );

  const removeTask = useCallback(
    (id: string) => {
      if (controls.current.has(id)) return;
      setTasks((current) => current.filter((task) => task.id !== id));
    },
    [setTasks],
  );

  const openExternal = useCallback(
    (id: string) => {
      const task = tasksRef.current.find((entry) => entry.id === id);
      if (!task) return;
      const opened = window.open(task.url, "_blank", "noopener,noreferrer");
      patchTask(id, {
        status: "external",
        error: opened
          ? "Opened in a new tab — the external page handles the download."
          : "Your browser blocked the new tab. Allow pop-ups and try again.",
      });
    },
    [patchTask],
  );

  const clearFinished = useCallback(() => {
    setTasks((current) => current.filter((task) => ACTIVE_STATES.includes(task.status)));
  }, [setTasks]);

  const addRequest = useCallback(
    (input: Omit<TitleRequest, "id" | "status" | "createdAt">) => {
      const request: TitleRequest = { ...input, id: uid("req"), status: "pending", createdAt: Date.now() };
      setRequests((current) => [request, ...current]);
      toast("Request sent", `“${input.name}” is on the admin's list. Track it under Requests.`);
    },
    [setRequests, toast],
  );

  const setRequestStatus = useCallback(
    (id: string, status: TitleRequestStatus) => {
      setRequests((current) =>
        current.map((request) =>
          request.id === id ? { ...request, status, resolvedAt: status === "pending" ? undefined : Date.now() } : request,
        ),
      );
    },
    [setRequests],
  );

  const deleteRequest = useCallback(
    (id: string) => {
      setRequests((current) => current.filter((request) => request.id !== id));
    },
    [setRequests],
  );

  const value = useMemo<AppState>(
    () => ({
      titles, addTitle, updateTitle, deleteTitle, toggleFeatured, resetToSeed, importTitles,
      isAdmin, login, logout, settings, changePin, setConcurrency,
      tasks, enqueue, pauseTask, resumeTask, cancelTask, retryTask, removeTask, openExternal, clearFinished,
      requests, addRequest, setRequestStatus, deleteRequest,
      toasts, toast, dismissToast,
    }),
    [
      titles, addTitle, updateTitle, deleteTitle, toggleFeatured, resetToSeed, importTitles,
      isAdmin, login, logout, settings, changePin, setConcurrency,
      tasks, enqueue, pauseTask, resumeTask, cancelTask, retryTask, removeTask, openExternal, clearFinished,
      requests, addRequest, setRequestStatus, deleteRequest,
      toasts, toast, dismissToast,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error("useAppState must be used inside AppStateProvider");
  return context;
}
