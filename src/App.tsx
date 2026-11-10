import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  BookOpen,
  Calculator as CalculatorIcon,
  Check,
  ChevronRight,
  CircleHelp,
  CloudOff,
  Download,
  FolderOpen,
  Home,
  Menu,
  Moon,
  Package,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Wifi,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import type {
  AppData,
  Calculation,
  CalcInput,
  Kind,
  Product,
  Project,
  SavedCalculation,
} from "./lib/types";
import { date, defaultInput, kinds, labels, uid } from "./lib/types";
import { emptyData, loadData, saveData, upgradeCatalog } from "./lib/storage";
import { productValues } from "./lib/product-input";
import { download } from "./lib/export";
import { validateBackup } from "./lib/backup";
import { Calculator } from "./components/Calculator";
import { Products } from "./components/Products";
import { Projects } from "./components/Projects";
import { Assistant } from "./components/Assistant";
import { QuickTools } from "./components/QuickTools";
import { CalcIcon, Heading, Modal, TextLink } from "./components/ui";
import { HouseIllustration } from "./components/Diagram";
import { GlobalSearch } from "./components/GlobalSearch";
import { CustomerHelp } from "./components/CustomerHelp";
import type { SearchHit } from "./lib/search";
import { validPriceFeed } from "./lib/prices";
import type { PriceFeed } from "./lib/prices";
type Page =
  | "home"
  | "calculators"
  | "calc"
  | "projects"
  | "assistant"
  | "customer"
  | "products"
  | "quick"
  | "settings";
const titles: Record<Page, string> = {
  home: "Arbeidsflate",
  calculators: "Kalkulatorer",
  calc: "Materialberegning",
  projects: "Prosjekter",
  assistant: "Produktassistent",
  customer: "Kundehjelp",
  products: "Produktregister",
  quick: "Hurtigverktøy",
  settings: "Innstillinger",
};
function readRoute(): { page: Page; kind: Kind } {
  const parts = location.hash.replace(/^#\/?/, "").split("/");
  return {
    page: Object.hasOwn(titles, parts[0]) ? (parts[0] as Page) : "home",
    kind: kinds.includes(parts[1] as Kind) ? (parts[1] as Kind) : "insulation",
  };
}
const defaults = Object.fromEntries(
  kinds.map((k) => [k, defaultInput(k)]),
) as Record<Kind, CalcInput>;
interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}
export default function App() {
  const [data, setData] = useState<AppData>(emptyData),
    [loaded, setLoaded] = useState(false),
    [storageError, setStorageError] = useState(""),
    [loadError, setLoadError] = useState("");
  const [route, setRoute] = useState(readRoute),
    [mobileMenu, setMobileMenu] = useState(false),
    [toast, setToast] = useState(""),
    [query, setQuery] = useState(""),
    [favoritesOnly, setFavoritesOnly] = useState(false);
  const [online, setOnline] = useState(navigator.onLine),
    [offlineReady, setOfflineReady] = useState(false),
    [install, setInstall] = useState<InstallEvent | null>(null),
    [help, setHelp] = useState(false),
    [installHelp, setInstallHelp] = useState(false),
    [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState(""),
    [editing, setEditing] = useState<{
      projectId: string;
      calculationId: string;
    } | null>(null),
    [restore, setRestore] = useState<AppData | null>(null);
  const backupInput = useRef<HTMLInputElement>(null),
    toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [globalSearch, setGlobalSearch] = useState(false);
  const [productRequest, setProductRequest] = useState<{
    id: string;
    nonce: number;
  }>();
  const [guideRequest, setGuideRequest] = useState<{
    id: string;
    nonce: number;
  }>();
  const [customerTopic, setCustomerTopic] = useState("");
  const [customerChecks, setCustomerChecks] = useState<Record<string, boolean>>(
    {},
  );
  const [priceFeed, setPriceFeed] = useState<PriceFeed | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const refresh = () => {
      void fetch(`${import.meta.env.BASE_URL}prices.json`, {
        cache: "no-store",
        signal: controller.signal,
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((raw) => {
          if (!controller.signal.aborted) setPriceFeed(validPriceFeed(raw));
        })
        .catch(() => {
          if (!controller.signal.aborted) setPriceFeed(null);
        });
    };
    refresh();
    const timer = setInterval(refresh, 15 * 60000);
    window.addEventListener("online", refresh);
    return () => {
      controller.abort();
      clearInterval(timer);
      window.removeEventListener("online", refresh);
    };
  }, []);
  const notify = useCallback((s: string) => {
    setToast(s);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 6500);
  }, []);
  useEffect(() => {
    void loadData()
      .then((d) => {
        setData(d);
        setLoaded(true);
      })
      .catch(() =>
        setLoadError(
          "Kunne ikke åpne lokal lagring. Kontroller at nettleseren tillater IndexedDB, og last siden på nytt. Eksisterende data er ikke endret.",
        ),
      );
  }, []);
  useEffect(() => {
    if (loaded)
      void saveData(data)
        .then(() => setStorageError(""))
        .catch(() =>
          setStorageError(
            "Lagring feilet. Dataene finnes foreløpig i denne fanen. Last ned en sikkerhetskopi før du lukker.",
          ),
        );
  }, [data, loaded]);
  useEffect(() => {
    document.documentElement.dataset.theme = data.theme;
  }, [data.theme]);
  useEffect(() => {
    const changed = () => {
      setRoute(readRoute());
      setMobileMenu(false);
      window.scrollTo({ top: 0 });
    };
    const connected = () => setOnline(navigator.onLine);
    const prompt = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallEvent);
    };
    window.addEventListener("hashchange", changed);
    window.addEventListener("online", connected);
    window.addEventListener("offline", connected);
    window.addEventListener("beforeinstallprompt", prompt);
    return () => {
      window.removeEventListener("hashchange", changed);
      window.removeEventListener("online", connected);
      window.removeEventListener("offline", connected);
      window.removeEventListener("beforeinstallprompt", prompt);
    };
  }, []);
  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, {
        scope: import.meta.env.BASE_URL,
      })
      .then((reg) => {
        if (reg.waiting) setWaitingWorker(reg.waiting);
        reg.addEventListener("updatefound", () => {
          const worker = reg.installing;
          worker?.addEventListener("statechange", () => {
            if (
              worker.state === "installed" &&
              navigator.serviceWorker.controller
            )
              setWaitingWorker(worker);
          });
        });
        return navigator.serviceWorker.ready;
      })
      .then(() => setOfflineReady(true))
      .catch(() => setOfflineReady(false));
  }, []);
  const navigate = (page: Page, kind?: Kind) => {
    location.hash = `/${page}${kind ? `/${kind}` : ""}`;
    setMobileMenu(false);
  };
  const startCalculation = (kind?: Kind) => {
    setEditing(null);
    if (kind) {
      setData((d) => ({
        ...d,
        recent: [
          { kind, date: new Date().toISOString() },
          ...d.recent.filter((r) => r.kind !== kind),
        ].slice(0, 7),
      }));
      navigate("calc", kind);
    } else navigate("calculators");
  };
  const updateDraft = (kind: Kind, input: CalcInput) =>
    setData((d) => ({ ...d, drafts: { ...d.drafts, [kind]: input } }));
  const useProduct = (p: Product) => {
    const base = data.drafts[p.category] || defaults[p.category];
    updateDraft(p.category, {
      ...base,
      values: { ...base.values, ...productValues(p.category, p), priceSource: "" },
    });
    startCalculation(p.category);
  };
  const openProject = (id: string) => {
    setSelectedProjectId(id);
    setData((d) => ({ ...d, activeProjectId: id }));
    navigate("projects");
  };
  const openGuide = (id: string) => {
    setGuideRequest({ id, nonce: Date.now() });
    navigate("assistant");
  };
  const openSearchHit = (hit: SearchHit) => {
    setGlobalSearch(false);
    if (hit.type === "product") {
      setProductRequest({ id: hit.id, nonce: Date.now() });
      navigate("products");
    } else if (hit.type === "calculator") startCalculation(hit.id as Kind);
    else if (hit.type === "guide") openGuide(hit.id);
    else if (hit.type === "project") openProject(hit.id);
    else {
      setCustomerTopic(hit.id);
      navigate("customer");
    }
  };
  const saveCalculation = (result: Calculation, input: CalcInput) => {
    const now = new Date().toISOString(),
      kind = route.kind;
    const project = editing
      ? data.projects.find((p) => p.id === editing.projectId)
      : data.projects.find((p) => p.id === data.activeProjectId);
    const target: Project = project || {
      id: uid(),
      name: `Materialprosjekt ${date(now)}`,
      createdAt: now,
      updatedAt: now,
      calculations: [],
      lines: [],
    };
    const id = editing?.calculationId || uid();
    const calculation: SavedCalculation = {
      id,
      kind,
      input: structuredClone(input),
      result: structuredClone(result),
      createdAt: now,
    };
    const updated: Project = {
      ...target,
      updatedAt: now,
      calculations: [
        ...target.calculations.filter((c) => c.id !== id),
        calculation,
      ],
      lines: [
        ...target.lines.filter((l) => !l.id.startsWith(id + ":")),
        ...result.lines.map((l, i) => ({ ...l, id: `${id}:${i}` })),
      ],
    };
    setData((d) => ({
      ...d,
      projects: project
        ? d.projects.map((p) => (p.id === updated.id ? updated : p))
        : [updated, ...d.projects],
      activeProjectId: updated.id,
    }));
    setEditing(null);
    setSelectedProjectId(updated.id);
    notify(
      editing
        ? "Beregningen og materiallisten er oppdatert."
        : "Beregningen er lagt til i materiallisten.",
    );
    navigate("projects");
  };
  const editCalculation = (project: Project, c: SavedCalculation) => {
    updateDraft(c.kind, structuredClone(c.input));
    setEditing({ projectId: project.id, calculationId: c.id });
    setData((d) => ({ ...d, activeProjectId: project.id }));
    navigate("calc", c.kind);
  };
  const toggleFavorite = (kind: Kind) =>
    setData((d) => ({
      ...d,
      favorites: d.favorites.includes(kind)
        ? d.favorites.filter((k) => k !== kind)
        : [...d.favorites, kind],
    }));
  const exportBackup = () => {
    download(
      JSON.stringify(data, null, 2),
      `monter-assistent-sikkerhetskopi-${new Date().toISOString().slice(0, 10)}.json`,
      "application/json",
    );
    notify("Sikkerhetskopien er lastet ned.");
  };
  const readBackup = async (f?: File) => {
    if (!f) return;
    try {
      if (f.size > 20 * 1024 * 1024)
        throw new Error("Filen er større enn 20 MB.");
      setRestore(validateBackup(JSON.parse(await f.text())));
    } catch (e) {
      notify((e as Error).message);
    } finally {
      if (backupInput.current) backupInput.current.value = "";
    }
  };
  const updateApp = async () => {
    try {
      await saveData(data);
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        () => location.reload(),
        { once: true },
      );
      waitingWorker?.postMessage("ACTIVATE_UPDATE");
    } catch {
      notify(
        "Oppdateringen er utsatt fordi lokal lagring feilet. Ta en sikkerhetskopi først.",
      );
    }
  };
  if (!loaded)
    return (
      <div className="loading-screen">
        <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" width="64" />
        <h1>Montér Assistent</h1>
        <p>{loadError || "Klargjør arbeidsflaten …"}</p>
        {loadError && (
          <button className="primary" onClick={() => location.reload()}>
            Prøv på nytt
          </button>
        )}
      </div>
    );
  const { page, kind } = route;
  const nav = [
    { id: "home" as const, icon: Home, label: "Arbeidsflate" },
    { id: "calculators" as const, icon: CalculatorIcon, label: "Kalkulatorer" },
    { id: "projects" as const, icon: FolderOpen, label: "Prosjekter" },
    { id: "assistant" as const, icon: BookOpen, label: "Produktassistent" },
    { id: "customer" as const, icon: CircleHelp, label: "Kundehjelp" },
    { id: "quick" as const, icon: Zap, label: "Hurtigverktøy" },
  ];
  const calcCards = (list: readonly Kind[]) =>
    list.map((k) => (
      <button className="calc-card" key={k} onClick={() => startCalculation(k)}>
        <div className="calc-card-top">
          <span className={`calc-icon ${labels[k].color}`}>
            <CalcIcon kind={k} />
          </span>
          <ArrowRight size={18} />
        </div>
        <h3>{labels[k].name}</h3>
        <p>{labels[k].description}</p>
        <span className="calc-card-tag">{labels[k].tag}</span>
      </button>
    ));
  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Gå til innhold
      </a>
      {mobileMenu && (
        <button
          className="sidebar-overlay"
          aria-label="Lukk navigasjon"
          onClick={() => setMobileMenu(false)}
        />
      )}
      <aside className={`sidebar ${mobileMenu ? "open" : ""}`}>
        <button
          className="brand"
          onClick={() => navigate("home")}
          aria-label="Montér Assistent hjem"
        >
          <span className="brand-word">
            montér
            <span className="brand-square" />
          </span>
          <span className="brand-sub">ASSISTENT</span>
        </button>
        <div className="store-label">
          <span className="store-dot" /> Lillestrøm <span>UTEBUTIKK</span>
        </div>
        <div className="nav-label">ARBEIDSVERKTØY</div>
        <nav aria-label="Hovedmeny">
          {nav.map((n) => (
            <button
              key={n.id}
              className={
                page === n.id || (page === "calc" && n.id === "calculators")
                  ? "active"
                  : ""
              }
              onClick={() => navigate(n.id)}
            >
              <n.icon size={20} strokeWidth={1.7} />
              <span>{n.label}</span>
              {n.id === "projects" && data.projects.length > 0 && (
                <span className="nav-count">{data.projects.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-admin">
          <div className="nav-label">ADMINISTRASJON</div>
          <nav>
            <button
              className={page === "products" ? "active" : ""}
              onClick={() => navigate("products")}
            >
              <Package size={20} strokeWidth={1.7} /> Produktregister
            </button>
            <button
              className={page === "settings" ? "active" : ""}
              onClick={() => navigate("settings")}
            >
              <Settings size={20} strokeWidth={1.7} /> Innstillinger
            </button>
          </nav>
        </div>
        <div className="sidebar-bottom">
          <div className="offline-card">
            <span className="offline-status-icon">
              {offlineReady ? <Check size={17} /> : <CloudOff size={17} />}
            </span>
            <div>
              <strong>
                {offlineReady ? "Klar uten nett" : "Lokal lagring"}
              </strong>
              <p>
                {offlineReady
                  ? "Verktøyene er med deg."
                  : "Prosjektene lagres her."}
              </p>
            </div>
          </div>
          <button className="sidebar-help" onClick={() => setHelp(true)}>
            <CircleHelp size={18} /> Hjelp og hurtigstart{" "}
            <ChevronRight size={15} />
          </button>
          <div className="independent">
            Uavhengig arbeidsverktøy
            <br />
            Ikke offisielt godkjent av Montér
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-location">
            <button
              className="icon-button menu-toggle"
              aria-label="Åpne navigasjon"
              aria-expanded={mobileMenu}
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              <Menu size={23} />
            </button>
            <span>Ansattverktøy</span>
            <ChevronRight size={14} />
            <strong>{titles[page]}</strong>
          </div>
          <div className="topbar-actions">
            <button
              className="icon-button"
              aria-label="Åpne samlet søk"
              onClick={() => setGlobalSearch(true)}
            >
              <Search size={21} />
            </button>
            <div className={`connection ${online ? "" : "offline"}`}>
              {online ? <Wifi size={15} /> : <WifiOff size={15} />}
              <span>{online ? "På nett" : "Uten nett"}</span>
            </div>
            <button
              className="icon-button theme-toggle"
              aria-label={
                data.theme === "light"
                  ? "Bytt til mørk modus"
                  : "Bytt til lys modus"
              }
              onClick={() =>
                setData((d) => ({
                  ...d,
                  theme: d.theme === "light" ? "dark" : "light",
                }))
              }
            >
              {data.theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
            </button>
            <button
              className="install-button"
              onClick={() => {
                if (install) void install.prompt().then(() => setInstall(null));
                else setInstallHelp(true);
              }}
            >
              <Download size={16} />
              <span>Installer app</span>
            </button>
            <div className="avatar" aria-label="Lokal bruker">
              L
            </div>
          </div>
        </header>
        {storageError && (
          <div className="storage-error" role="alert">
            {storageError}
            <button className="small-button" onClick={exportBackup}>
              Last ned sikkerhetskopi
            </button>
          </div>
        )}
        {waitingWorker && (
          <div className="update-banner">
            En ny versjon er klar. Dataene dine beholdes.
            <button className="small-button" onClick={() => void updateApp()}>
              Oppdater app
            </button>
          </div>
        )}
        <main
          id="main-content"
          tabIndex={-1}
          className={page === "projects" ? "project-page" : ""}
        >
          {page === "home" && (
            <>
              <div className="home-welcome">
                <div>
                  <div className="eyebrow">DIN DIGITALE VERKTØYKASSE</div>
                  <h1>Klar for neste kunde.</h1>
                  <p>Riktige mengder. Gode råd. En enklere arbeidsdag.</p>
                </div>
                <span className="today-label">
                  {new Intl.DateTimeFormat("nb-NO", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    timeZone: "Europe/Oslo",
                  }).format(new Date())}
                </span>
              </div>
              <div className="home-task-bar">
                <button
                  className="home-search"
                  onClick={() => setGlobalSearch(true)}
                >
                  <Search size={21} />
                  <span>Søk vare, varenummer eller kundeoppgave</span>
                  <ArrowRight size={18} />
                </button>
                <button
                  className="secondary"
                  onClick={() => navigate("customer")}
                >
                  <CircleHelp size={19} /> Hjelp en kunde
                </button>
              </div>
              <section className="hero">
                <div className="hero-copy">
                  <span className="hero-badge">
                    <span /> BYGGET FOR UTEBUTIKKEN
                  </span>
                  <h2>
                    Fra kundens idé
                    <br />
                    til riktig materialliste.
                  </h2>
                  <p>
                    Ta målene, beregn behovet og samle alt i ett prosjekt. Rett
                    fra mobilen, også uten nett.
                  </p>
                  <div className="hero-actions">
                    <button
                      className="primary orange-button"
                      onClick={() => startCalculation()}
                    >
                      <Plus size={18} /> Start en beregning
                      <ArrowRight size={18} />
                    </button>
                    <button
                      className="hero-link"
                      onClick={() => navigate("projects")}
                    >
                      Åpne prosjekter
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
                <HouseIllustration />
              </section>
              <div className="home-trust">
                <span>
                  <CalculatorIcon size={17} /> 7 materialkalkulatorer
                </span>
                <span>
                  <ShieldCheck size={17} /> Sporbare produktdata
                </span>
                <span>
                  <CloudOff size={17} />{" "}
                  {offlineReady
                    ? "Klar uten internett"
                    : "Offline etter første produksjonsåpning"}
                </span>
              </div>
              <div className="section-title">
                <div>
                  <h2>Hva skal kunden bygge?</h2>
                  <p>Velg en kalkulator og kom i gang.</p>
                </div>
                <TextLink onClick={() => navigate("calculators")}>
                  Alle kalkulatorer
                </TextLink>
              </div>
              <div className="calculator-grid home-calcs">
                {calcCards(kinds)}
                <button
                  className="calc-card quick-card"
                  onClick={() => navigate("quick")}
                >
                  <div className="calc-card-top">
                    <span className="calc-icon green">
                      <Zap size={24} strokeWidth={1.6} />
                    </span>
                    <ArrowRight size={18} />
                  </div>
                  <h3>De små regnestykkene</h3>
                  <p>Enheter, pakker, volum og pris.</p>
                  <span className="calc-card-tag">HURTIGVERKTØY</span>
                </button>
              </div>
              <div className="home-bottom">
                <section className="panel">
                  <div className="section-heading">
                    <h2>
                      <FolderOpen size={19} /> Dine prosjekter
                    </h2>
                    <TextLink onClick={() => navigate("projects")}>
                      Se alle
                    </TextLink>
                  </div>
                  {data.projects.length ? (
                    data.projects.slice(0, 3).map((p) => (
                      <button
                        className="recent-project"
                        key={p.id}
                        onClick={() => openProject(p.id)}
                      >
                        <span className="folder-icon">
                          <FolderOpen size={20} />
                        </span>
                        <span>
                          <strong>{p.name}</strong>
                          <small>
                            {p.lines.length} materiallinjer ·{" "}
                            {date(p.updatedAt)}
                          </small>
                        </span>
                        <ChevronRight size={17} />
                      </button>
                    ))
                  ) : (
                    <div className="home-project-empty">
                      <div className="dashed-folder">
                        <FolderOpen size={23} />
                      </div>
                      <div>
                        <h3>Samle hele kundens prosjekt</h3>
                        <p>
                          Beregn isolasjon, trelast og plater.
                          <br />
                          Få alt på én materialliste.
                        </p>
                        <button
                          className="text-link"
                          onClick={() => navigate("projects")}
                        >
                          Opprett ditt første prosjekt
                          <ArrowRight size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                </section>
                <button
                  className="knowledge-teaser"
                  onClick={() => navigate("assistant")}
                >
                  <span>
                    <BookOpen size={22} /> LITT TRYGGERE PÅ FAGET
                  </span>
                  <h2>
                    OSB eller MDF?
                    <br />
                    Finn forskjellen.
                  </h2>
                  <p>
                    Praktiske produktguider med lenker til produsentens
                    dokumentasjon.
                  </p>
                  <span className="text-link">
                    Åpne produktassistenten <ArrowRight size={17} />
                  </span>
                </button>
              </div>
            </>
          )}
          {page === "calculators" && (
            <>
              <Heading eyebrow="MATERIALBEREGNING" title="Alle kalkulatorer">
                Fra noen få mål til en materialliste du kan kontrollere.
              </Heading>
              <div className="toolbar">
                <div className="search-input">
                  <Search size={19} />
                  <input
                    aria-label="Søk kalkulator"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Søk etter materiale eller kalkulator …"
                  />
                </div>
                <div className="segmented">
                  <button
                    className={!favoritesOnly ? "active" : ""}
                    onClick={() => setFavoritesOnly(false)}
                  >
                    Alle
                  </button>
                  <button
                    className={favoritesOnly ? "active" : ""}
                    onClick={() => setFavoritesOnly(true)}
                  >
                    Favoritter
                  </button>
                </div>
              </div>
              <div className="calculator-grid">
                {calcCards(
                  kinds.filter(
                    (k) =>
                      (!favoritesOnly || data.favorites.includes(k)) &&
                      `${labels[k].name} ${labels[k].tag}`
                        .toLowerCase()
                        .includes(query.toLowerCase()),
                  ),
                )}
              </div>
              {data.recent.length > 0 && (
                <section className="panel recent-tools">
                  <h2>Nylig brukt</h2>
                  <div className="chips">
                    {data.recent.map((r) => (
                      <button
                        key={r.kind}
                        onClick={() => startCalculation(r.kind)}
                      >
                        <CalcIcon kind={r.kind} size={17} />
                        {labels[r.kind].short}
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
          {page === "calc" && (
            <Calculator
              priceFeed={priceFeed}
              key={kind}
              kind={kind}
              input={data.drafts[kind] || defaults[kind]}
              onChange={(input) => updateDraft(kind, input)}
              products={data.products}
              projects={data.projects}
              activeProjectId={data.activeProjectId}
              setActiveProject={(id) =>
                setData((d) => ({ ...d, activeProjectId: id }))
              }
              onSave={saveCalculation}
              favorite={data.favorites.includes(kind)}
              onFavorite={() => toggleFavorite(kind)}
              onBack={() => navigate("calculators")}
              editing={!!editing}
              onReset={() => {
                updateDraft(kind, defaultInput(kind));
                notify(
                  "Inndata i denne kalkulatoren er nullstilt. Lagrede prosjekter er beholdt.",
                );
              }}
            />
          )}
          {page === "projects" && (
            <Projects
              onSaveWorkNote={async (id, note) => {
                const next = {
                  ...data,
                  projects: data.projects.map((p) =>
                    p.id === id
                      ? {
                          ...p,
                          workNote: note,
                          updatedAt: new Date().toISOString(),
                        }
                      : p,
                  ),
                };
                await saveData(next);
                setData((d) => ({
                  ...d,
                  projects: d.projects.map((p) => p.id === id
                    ? { ...p, workNote: note, updatedAt: next.projects.find((x) => x.id === id)!.updatedAt }
                    : p),
                }));
              }}
              projects={data.projects}
              onChange={(projects) =>
                setData((d) => ({
                  ...d,
                  projects,
                  activeProjectId: projects.some(
                    (p) => p.id === d.activeProjectId,
                  )
                    ? d.activeProjectId
                    : "",
                }))
              }
              selectedId={selectedProjectId}
              setSelectedId={(id) => {
                setSelectedProjectId(id);
                if (id) setData((d) => ({ ...d, activeProjectId: id }));
              }}
              onCalculate={startCalculation}
              onEditCalculation={editCalculation}
              notify={notify}
            />
          )}
          {page === "products" && (
            <Products
              priceFeed={priceFeed}
              request={productRequest}
              products={data.products}
              locations={data.locations || {}}
              onLocation={(id, location) =>
                setData((d) => ({
                  ...d,
                  locations: { ...d.locations, [id]: location },
                }))
              }
              onChange={(products) => setData((d) => ({ ...d, products }))}
              notify={notify}
              onUse={useProduct}
            />
          )}
          {page === "assistant" && <Assistant request={guideRequest} />}
          {page === "customer" && (
            <>
              <Heading eyebrow="UTE I BUTIKKEN" title="Kundehjelp">
                Gode spørsmål, relevante sjekkpunkter og en kort vei til
                materiallisten.
              </Heading>
              <CustomerHelp
                topicId={customerTopic}
                onSelect={setCustomerTopic}
                checked={customerChecks}
                onCheck={(key, value) =>
                  setCustomerChecks((c) => ({ ...c, [key]: value }))
                }
                onCalculate={startCalculation}
                onGuide={openGuide}
              />
            </>
          )}
          {page === "quick" && <QuickTools />}
          {page === "settings" && (
            <>
              <Heading eyebrow="TILPASS ARBEIDSVERKTØYET" title="Innstillinger">
                Lokal lagring, sikkerhetskopi og installasjon.
              </Heading>
              <div className="settings-grid">
                <section className="panel">
                  <h2>Utseende</h2>
                  <p>Velg det som er lettest å lese der du jobber.</p>
                  <div className="theme-options">
                    <button
                      className={data.theme === "light" ? "active" : ""}
                      onClick={() => setData((d) => ({ ...d, theme: "light" }))}
                    >
                      <Sun /> Lys modus
                    </button>
                    <button
                      className={data.theme === "dark" ? "active" : ""}
                      onClick={() => setData((d) => ({ ...d, theme: "dark" }))}
                    >
                      <Moon /> Mørk modus
                    </button>
                  </div>
                </section>
                <section className="panel">
                  <h2>Installer på enheten</h2>
                  <p>
                    {offlineReady
                      ? "Appskallet og kalkulatorene er lagret for bruk uten nett."
                      : "Offline-skallet aktiveres i produksjonsbygget, etter at appen er åpnet på nett."}
                  </p>
                  <button
                    className="secondary"
                    onClick={() => {
                      if (install) void install.prompt();
                      else setInstallHelp(true);
                    }}
                  >
                    <Download size={16} /> Installer appen
                  </button>
                </section>
                <section className="panel">
                  <h2>Sikkerhetskopi</h2>
                  <p>
                    Last ned prosjekter, produkter og inndata som JSON. Filen
                    kan gjenopprettes på en annen enhet.
                  </p>
                  <div className="button-row">
                    <button className="primary" onClick={exportBackup}>
                      <ArrowDownToLine size={17} /> Last ned sikkerhetskopi
                    </button>
                    <button
                      className="secondary"
                      onClick={() => backupInput.current?.click()}
                    >
                      Gjenopprett fra fil
                    </button>
                  </div>
                  <input
                    type="file"
                    accept=".json"
                    hidden
                    ref={backupInput}
                    onChange={(e) => void readBackup(e.target.files?.[0])}
                  />
                </section>
                <section className="panel">
                  <h2>Lagring og personvern</h2>
                  <p>
                    Data lagres i IndexedDB i denne nettleserprofilen. Ingen
                    data synkroniseres til en server. Sletting av nettleserdata
                    fjerner lokal lagring.
                  </p>
                  <p>
                    Bruk prosjekttitler uten personopplysninger. Denne utgaven
                    har én betrodd lokal bruker og ingen flerbrukerinnlogging.
                  </p>
                  <p className="small muted">
                    Versjon 1.0 · Produktkilder kontrollert 09.11.2026 ·
                    Eksterne dokumenter og bilder krever nett.
                  </p>
                </section>
              </div>
            </>
          )}
        </main>
        <footer className="app-footer">
          <span>
            Montér Assistent <span>·</span> Lillestrøm
          </span>
          <span>Veiledende mengder. Kontroller produkt og anvisning.</span>
        </footer>
        <nav className="mobile-bottom-nav" aria-label="Mobilmeny">
          {nav
            .filter((n) =>
              ["home", "calculators", "projects", "quick"].includes(n.id),
            )
            .map((n) => (
              <button
                key={n.id}
                className={
                  page === n.id || (page === "calc" && n.id === "calculators")
                    ? "active"
                    : ""
                }
                onClick={() => navigate(n.id)}
              >
                <n.icon size={21} />
                <span>
                  {n.label === "Arbeidsflate"
                    ? "Hjem"
                    : n.label === "Hurtigverktøy"
                      ? "Hurtig"
                      : n.label}
                </span>
              </button>
            ))}
        </nav>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={19} />
          <span>{toast}</span>
          <button
            className="icon-button"
            onClick={() => setToast("")}
            aria-label="Lukk melding"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {globalSearch && (
        <GlobalSearch
          data={data}
          onOpen={openSearchHit}
          onClose={() => setGlobalSearch(false)}
        />
      )}
      {help && (
        <Modal title="Fra mål til materialliste" onClose={() => setHelp(false)}>
          <ol className="help-steps">
            <li>
              <strong>Velg en kalkulator.</strong>
              <p>Legg inn kundens mål og eventuelle åpninger.</p>
            </li>
            <li>
              <strong>Kontroller produktgrunnlaget.</strong>
              <p>
                Velg et dokumentert produkt fra registeret eller oppgi data fra
                pakningen. Geometrimål som er utfylt på forhånd er eksempler.
              </p>
            </li>
            <li>
              <strong>Avklar svinn og konstruksjon.</strong>
              <p>
                Svinn starter på 0 %. Avstander og materialvalg må kontrolleres
                mot den aktuelle anvisningen.
              </p>
            </li>
            <li>
              <strong>Samle og del.</strong>
              <p>
                Legg beregningen i et prosjekt. Rediger mengder, oppgi priser og
                eksporter materiallisten som PDF.
              </p>
            </li>
          </ol>
          <div className="notice subtle">
            Mengdeverktøyet utfører ingen dimensjonering av bærende
            konstruksjoner. Register og prosjekter lagres på denne enheten.
          </div>
        </Modal>
      )}
      {installHelp && (
        <Modal
          title="Ha verktøyet på hjemskjermen"
          onClose={() => setInstallHelp(false)}
        >
          <p>
            <strong>Android / Chrome / Edge:</strong> Åpne nettlesermenyen og
            velg «Installer app» eller «Legg til på startskjermen».
          </p>
          <p>
            <strong>iPhone / iPad:</strong> Åpne i Safari, trykk Del og velg
            «Legg til på Hjem-skjerm».
          </p>
          <p>
            <strong>PC:</strong> Bruk installeringsikonet i adressefeltet når
            nettleseren tilbyr det.
          </p>
          <p className="small muted">
            Installering krever HTTPS eller localhost og et produksjonsbygg.
            Åpne appen på nett første gang og vent på «Klar uten nett». Eksterne
            datablader lagres ikke automatisk offline.
          </p>
        </Modal>
      )}
      {restore && (
        <Modal
          title="Gjenopprett sikkerhetskopi?"
          onClose={() => setRestore(null)}
        >
          <p>
            Filen inneholder {restore.projects.length} prosjekter og{" "}
            {restore.products.length} produkter. Gjenoppretting erstatter
            dataene på denne enheten.
          </p>
          <p>Ta en sikkerhetskopi av dagens data før du fortsetter.</p>
          <div className="modal-actions">
            <button className="secondary" onClick={exportBackup}>
              Kopier dagens data
            </button>
            <button
              className="primary"
              onClick={() => {
                setData(upgradeCatalog(restore));
                setSelectedProjectId("");
                setEditing(null);
                setRestore(null);
                notify("Sikkerhetskopien er gjenopprettet.");
              }}
            >
              Erstatt med sikkerhetskopien
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
