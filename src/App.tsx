import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AppStateProvider, useAppState } from "./state/AppState";
import type { Title } from "./types";
import { Footer, Header, MobileDock, Toasts } from "./components/UI";
import { TitleModal } from "./components/TitleModal";
import { DownloadsDrawer } from "./components/DownloadsDrawer";
import { RequestModal } from "./components/RequestModal";
import { AdminArea } from "./admin/Admin";
import { HomeView } from "./views";

type Route = "home" | "admin";

function routeFromHash(): Route {
  return window.location.hash.replace(/^#\/?/, "").startsWith("admin") ? "admin" : "home";
}

function CholeyFlix() {
  const { titles } = useAppState();
  const [route, setRoute] = useState<Route>(() => routeFromHash());
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [downloadsOpen, setDownloadsOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestSeed, setRequestSeed] = useState("");

  useEffect(() => {
    const onHash = () => setRoute(routeFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if (route === "home") window.scrollTo({ top: 0 });
  }, [route]);

  const goHome = useCallback(() => {
    setRoute("home");
    setQuery("");
    setSelectedId(null);
    window.location.hash = "#/";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const goAdmin = useCallback(() => {
    setRoute("admin");
    setSelectedId(null);
    window.location.hash = "#/admin";
  }, []);

  const focusSearch = useCallback(() => {
    setRoute("home");
    setSelectedId(null);
    window.location.hash = "#/";
    window.setTimeout(() => {
      document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => document.getElementById("catalog-search")?.focus({ preventScroll: true }), 350);
    }, 40);
  }, []);

  const openRequest = useCallback((name = "") => {
    setRequestSeed(name);
    setRequestOpen(true);
  }, []);

  const openTitle = useCallback((title: Title) => setSelectedId(title.id), []);
  const selected = selectedId ? titles.find((title) => title.id === selectedId) ?? null : null;

  return (
    <div className="app-canvas min-h-screen bg-ink text-cream selection:bg-lime selection:text-[#241203]">
      {route === "home" && <a href="#main-content" className="skip-link">Skip to the catalog</a>}
      {route === "home" ? (
        <div className="pb-20 sm:pb-0">
          <Header
            query={query}
            onQuery={(value) => {
              const revealResults = !query.trim() && Boolean(value.trim());
              setQuery(value);
              if (revealResults) window.setTimeout(() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
            }}
            onHome={goHome}
            onAdmin={goAdmin}
            onDownloads={() => setDownloadsOpen(true)}
            onRequest={() => openRequest()}
          />
          <AnimatePresence mode="wait">
            <motion.div id="main-content" tabIndex={-1} key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <HomeView query={query} onQuery={setQuery} onOpen={openTitle} onRequest={openRequest} />
              <Footer onAdmin={goAdmin} />
            </motion.div>
          </AnimatePresence>
          <MobileDock onHome={goHome} onSearch={focusSearch} onDownloads={() => setDownloadsOpen(true)} onRequest={() => openRequest()} onAdmin={goAdmin} />
        </div>
      ) : (
        <AdminArea onBackHome={goHome} />
      )}
      <TitleModal
        title={selected}
        onClose={() => setSelectedId(null)}
        onOpenTitle={(title) => setSelectedId(title.id)}
        onGoDownloads={() => setDownloadsOpen(true)}
      />
      <DownloadsDrawer open={downloadsOpen} onClose={() => setDownloadsOpen(false)} />
      <RequestModal open={requestOpen} initialName={requestSeed} onClose={() => setRequestOpen(false)} />
      <Toasts />
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <CholeyFlix />
    </AppStateProvider>
  );
}
