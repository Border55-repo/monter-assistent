import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ClipboardList,
  Info,
  Link2,
  Plus,
  RotateCcw,
  Star,
  Trash2,
} from "lucide-react";
import type {
  Calculation,
  CalcInput,
  Kind,
  Product,
  Project,
} from "../lib/types";
import { date, format, labels, money, uid } from "../lib/types";
import { calculate, projectTotal } from "../lib/calculators";
import { productValues, resolveProductInput } from "../lib/product-input";
import { needsReview } from "../lib/seed";
import { safeUrl } from "../lib/products";
import { CalcIcon, Field, Select } from "./ui";
import { Diagram } from "./Diagram";
interface Props {
  kind: Kind;
  input: CalcInput;
  onChange: (v: CalcInput) => void;
  products: Product[];
  projects: Project[];
  activeProjectId: string;
  setActiveProject: (id: string) => void;
  onSave: (result: Calculation, input: CalcInput) => void;
  favorite: boolean;
  onFavorite: () => void;
  onBack: () => void;
  editing: boolean;
  onReset: () => void;
}
export function Calculator(props: Props) {
  const { kind, input, onChange, products, projects, activeProjectId } = props;
  const [advanced, setAdvanced] = useState(false);
  const [moreOptions, setMoreOptions] = useState(false);
  const resultPanel = useRef<HTMLElement>(null);
  const p = products.find((p) => p.id === input.values.productId && p.active);
  const effective = resolveProductInput(kind, input, p),
    v = effective.values;
  const locked = p ? productValues(kind, p) : {};
  const set = (key: string, val: string) =>
    onChange({ ...input, values: { ...input.values, [key]: val } });
  const field = (
    key: string,
    label: string,
    unit = "",
    hint = "",
    text = false,
  ) => {
    const element = (
      <Field
        key={key}
        label={label}
        value={v[key] ?? ""}
        onChange={(s) => set(key, s)}
        unit={unit}
        hint={hint}
        text={text}
        disabled={key !== "price" && key !== "productId" && !!locked[key]}
      />
    );
    const optional = [
      "count",
      "cc",
      "studWidth",
      "bottom",
      "top",
      "corners",
      "openingExtras",
      "lintel",
      "extraLm",
      "fixingsPerCross",
      "screwPack",
      "screwPrice",
      "piecesPerPack",
      "trimLength",
      "profile",
      "price",
    ].includes(key);
    return optional ? (
      <div key={key} className="advanced-field">
        {element}
      </div>
    ) : (
      element
    );
  };
  const select = (
    key: string,
    label: string,
    options: (string | { value: string; label: string })[],
  ) => (
    <Select
      key={key}
      label={label}
      value={v[key]}
      onChange={(s) => set(key, s)}
      options={options}
    />
  );
  const computed = useMemo(() => {
    try {
      return { result: calculate(kind, input, products), error: "" };
    } catch (e) {
      return { result: undefined, error: (e as Error).message };
    }
  }, [kind, input, products]);
  const result = computed.result;
  const primaryMetric = result?.metrics.find((m) => m.primary);
  const quickProducts =
    kind === "insulation"
      ? products
          .filter(
            (product) =>
              product.active &&
              product.manufacturer === "GLAVA" &&
              product.name.startsWith("GLAVA Proff 34 Plate") &&
              product.thickness,
          )
          .sort((a, b) => a.thickness! - b.thickness!)
      : [];
  const chooseProduct = (id: string) => {
    const chosen = products.find((p) => p.id === id);
    onChange({
      ...input,
      values: {
        ...effective.values,
        ...(chosen
          ? productValues(kind, chosen)
          : { productId: "", price: "" }),
      },
    });
  };
  return (
    <div
      className={`calculator-page ${moreOptions ? "all-options" : "simple-options"}`}
    >
      <button className="back-link" onClick={props.onBack}>
        <ArrowLeft size={16} /> Alle kalkulatorer
      </button>
      <div className="calc-page-title">
        <div className={`calc-icon ${labels[kind].color}`}>
          <CalcIcon kind={kind} size={28} />
        </div>
        <div>
          <div className="eyebrow">MATERIALBEREGNING</div>
          <h1>{labels[kind].name}</h1>
        </div>
        <button
          className={`icon-button favorite ${props.favorite ? "selected" : ""}`}
          aria-label={props.favorite ? "Fjern favoritt" : "Legg til favoritt"}
          onClick={props.onFavorite}
        >
          <Star size={22} fill={props.favorite ? "currentColor" : "none"} />
        </button>
      </div>
      <p className="page-intro">
        Velg produkt, oppgi kundens mål og legg resultatet rett i en
        materialliste.
      </p>
      <div className="calculator-mode-bar">
        <span>Begynn med produkt og mål. Resultatet oppdateres direkte.</span>
        <button
          className="secondary"
          aria-expanded={moreOptions}
          onClick={() => setMoreOptions(!moreOptions)}
        >
          {moreOptions ? "Vis færre valg" : "Vis flere valg og priser"}
          <ChevronDown className={moreOptions ? "rotate" : ""} size={16} />
        </button>
      </div>
      <div className="mobile-result-shortcut">
        <div>
          <small>{primaryMetric?.label || "Neste steg"}</small>
          <strong>
            {primaryMetric
              ? `${format(primaryMetric.value)} ${primaryMetric.unit}`
              : "Velg produkt og fyll inn mål"}
          </strong>
        </div>
        <button
          onClick={() =>
            resultPanel.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }
        >
          {result ? "Vis resultat" : "Se hva som mangler"}
          <ArrowRight size={16} />
        </button>
      </div>
      {props.editing && (
        <div className="notice">
          <Info size={18} /> Du redigerer en lagret beregning. Lagre for å
          oppdatere materiallisten.
        </div>
      )}
      <div className="calculator-layout">
        <div className="calculator-inputs">
          <section className="panel product-choice">
            <div className="section-heading">
              <h2>
                <span className="step">1</span> Velg produkt
              </h2>
            </div>
            <Select
              label="Velg produkt"
              value={v.productId}
              onChange={chooseProduct}
              options={[
                { value: "", label: "Manuelle produktdata (uten produktvalg)" },
                ...products
                  .filter(
                    (product) => product.category === kind && product.active,
                  )
                  .map((product) => ({
                    value: product.id,
                    label: product.name,
                  })),
              ]}
            />
            {quickProducts.length > 0 && (
              <div className="quick-product-choice">
                <span>Hurtigvalg · GLAVA Proff 34 Plate</span>
                <div>
                  {quickProducts.map((product) => (
                    <button
                      key={product.id}
                      className={p?.id === product.id ? "selected" : ""}
                      aria-label={`Velg GLAVA Proff 34 Plate ${product.thickness} mm`}
                      aria-pressed={p?.id === product.id}
                      onClick={() => chooseProduct(product.id)}
                    >
                      {product.thickness} mm
                    </button>
                  ))}
                </div>
              </div>
            )}
            {p && (
              <p className="chosen-product-info">
                <Check size={15} />
                {p.coverage
                  ? `${format(p.coverage)} m² per ${p.unit}`
                  : [p.thickness, p.width, p.length]
                      .filter(Boolean)
                      .join(" × ") + " mm"}
                <span>
                  ·{" "}
                  {p.verified
                    ? "Kildekontrollerte felt"
                    : "Kontroller produktdata"}
                </span>
              </p>
            )}
          </section>
          <section className="panel">
            <div className="section-heading">
              <h2>
                <span className="step">2</span>{" "}
                {kind === "flooring"
                  ? "Rom og mål"
                  : kind === "fixings"
                    ? "Forbruk og underlag"
                    : "Mål og konstruksjon"}
              </h2>
              <button
                className="icon-button"
                aria-label="Nullstill beregning"
                onClick={props.onReset}
              >
                <RotateCcw size={17} />
              </button>
            </div>
            {kind !== "flooring" && kind !== "fixings" && (
              <>
                <div className="fields-grid">
                  {kind === "insulation" &&
                    select("construction", "Konstruksjon", [
                      "Vegg",
                      "Yttervegg",
                      "Tak",
                      "Gulv",
                      "Annen konstruksjon",
                    ])}
                  {["insulation", "sheets", "cladding"].includes(kind) &&
                    select("measureMode", "Registrer mål som", [
                      {
                        value: "dimensions",
                        label: "Lengde og høyde / bredde",
                      },
                      { value: "area", label: "Kjent areal i m²" },
                    ])}
                  {v.measureMode === "area" &&
                  ["insulation", "sheets", "cladding"].includes(kind) ? (
                    field("directArea", "Areal per flate", "m²")
                  ) : (
                    <>
                      {field("length", "Lengde", "m")}
                      {field(
                        "width",
                        ["insulation", "timber", "sheets", "cladding"].includes(
                          kind,
                        )
                          ? "Høyde / bredde"
                          : "Bredde",
                        "m",
                      )}
                    </>
                  )}
                  {kind !== "deck" &&
                    field("count", "Antall like flater", "stk")}
                  {kind === "timber" && field("cc", "Stenderavstand c/c", "mm")}
                  {kind === "deck" &&
                    select("direction", "Leggeretning", [
                      { value: "length", label: "Langs lengden" },
                      { value: "width", label: "Langs bredden" },
                    ])}
                </div>
                <p className="simple-assumptions">
                  {v.count || "1"} flate(r)
                  {kind === "timber" || kind === "insulation"
                    ? ` · c/c ${v.cc} mm`
                    : ""}
                  {kind === "timber"
                    ? ` · sviller ${v.bottom} bunn + ${v.top} topp · ${v.corners} hjørnetillegg`
                    : ""}
                  {kind === "deck"
                    ? ` · bjelker c/c ${v.joistSpacing} mm · ${v.fixingsPerCross} fester/kryss`
                    : ""}
                  . Flere valg kan endres med knappen over.
                </p>
                {kind !== "deck" && (
                  <div className="openings">
                    <div className="section-heading minor">
                      <h3>Dører og vinduer</h3>
                      <button
                        className="small-button"
                        onClick={() =>
                          onChange({
                            ...input,
                            openings: [
                              ...input.openings,
                              {
                                id: uid(),
                                name: `Åpning ${input.openings.length + 1}`,
                                width: "0,9",
                                height: "2,1",
                                count: "1",
                                x: "0",
                                y: "0",
                              },
                            ],
                          })
                        }
                      >
                        <Plus size={15} /> Legg til
                      </button>
                    </div>
                    {!input.openings.length && (
                      <p className="muted small">
                        Ingen fradrag. Legg til åpninger ved behov.
                      </p>
                    )}
                    {input.openings.map((o) => (
                      <div className="opening-card" key={o.id}>
                        <div className="opening-title">
                          <input
                            aria-label="Navn på åpning"
                            value={o.name}
                            onChange={(e) =>
                              onChange({
                                ...input,
                                openings: input.openings.map((x) =>
                                  x.id === o.id
                                    ? { ...o, name: e.target.value }
                                    : x,
                                ),
                              })
                            }
                          />
                          <button
                            className="icon-button danger"
                            aria-label={`Fjern ${o.name}`}
                            onClick={() =>
                              onChange({
                                ...input,
                                openings: input.openings.filter(
                                  (x) => x.id !== o.id,
                                ),
                              })
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="fields-grid three">
                          {(
                            ["width", "height", "count", "x", "y"] as const
                          ).map((k) => (
                            <Field
                              key={k}
                              label={
                                {
                                  width: "Bredde",
                                  height: "Høyde",
                                  count: "Antall totalt",
                                  x: "Fra venstre",
                                  y: "Fra gulvet",
                                }[k]
                              }
                              unit={k === "count" ? "stk" : "m"}
                              value={o[k]}
                              onChange={(s) =>
                                onChange({
                                  ...input,
                                  openings: input.openings.map((x) =>
                                    x.id === o.id ? { ...o, [k]: s } : x,
                                  ),
                                })
                              }
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                    {input.openings.length > 0 && (
                      <p className="small muted">
                        Antall gjelder alle flater samlet. Unngå overlapp og
                        dobbelttelling; plassering brukes kun i skissen.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
            {kind === "flooring" && (
              <>
                <div className="room-list">
                  {input.rooms.map((r, i) => (
                    <div className="opening-card" key={r.id}>
                      <div className="opening-title">
                        <input
                          aria-label={`Navn på rom ${i + 1}`}
                          value={r.name}
                          onChange={(e) =>
                            onChange({
                              ...input,
                              rooms: input.rooms.map((x) =>
                                x.id === r.id
                                  ? { ...r, name: e.target.value }
                                  : x,
                              ),
                            })
                          }
                        />
                        <button
                          className="icon-button danger"
                          aria-label={`Fjern ${r.name}`}
                          onClick={() =>
                            onChange({
                              ...input,
                              rooms: input.rooms.filter((x) => x.id !== r.id),
                            })
                          }
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="fields-grid three">
                        {(["length", "width", "doorWidth"] as const).map(
                          (k) => (
                            <Field
                              key={k}
                              label={
                                {
                                  length: "Romlengde",
                                  width: "Rombredde",
                                  doorWidth: "Listfradrag, dører",
                                }[k]
                              }
                              unit="m"
                              value={r[k]}
                              onChange={(s) =>
                                onChange({
                                  ...input,
                                  rooms: input.rooms.map((x) =>
                                    x.id === r.id ? { ...r, [k]: s } : x,
                                  ),
                                })
                              }
                            />
                          ),
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="secondary full"
                  onClick={() =>
                    onChange({
                      ...input,
                      rooms: [
                        ...input.rooms,
                        {
                          id: uid(),
                          name: `Rom ${input.rooms.length + 1}`,
                          length: "",
                          width: "",
                          doorWidth: "0",
                        },
                      ],
                    })
                  }
                >
                  <Plus size={17} /> Legg til rom
                </button>
              </>
            )}
            {kind === "fixings" && (
              <div className="fields-grid">
                {select("method", "Beregningsmetode", [
                  { value: "area", label: "Dokumentert forbruk per m²" },
                  { value: "crossings", label: "Antall innfestingskryss" },
                ])}
                {select("substrate", "Underlag", [
                  "Tre",
                  "Stål",
                  "Annet – se anvisning",
                ])}
                {v.method === "area" ? (
                  <>
                    {field("area", "Areal", "m²")}
                    {field("rate", "Forbruk per m²", "stk/m²")}
                  </>
                ) : (
                  <>
                    {field("crossings", "Antall kryss", "stk")}
                    {field("perCross", "Fester per kryss", "stk")}
                  </>
                )}
                <div className="span-two">
                  {field(
                    "patternSource",
                    "Kilde / innfestingsmønster",
                    "",
                    "Oppgi produktanvisning og relevant mønster.",
                    true,
                  )}
                </div>
              </div>
            )}
          </section>
          <section className="panel">
            <div className="section-heading">
              <h2>
                <span className="step">3</span> Produktdata og reserve
              </h2>
            </div>
            {p ? (
              <div className="product-source">
                <div>
                  <Check size={15} />
                  <strong>
                    {p.verified
                      ? "Kontrollerte felt i registeret"
                      : "Ikke verifisert"}
                  </strong>
                </div>
                <p>
                  Sist kontrollert / endret {date(p.updatedAt)}.{" "}
                  {needsReview(p) && <b>Trenger ny kontroll.</b>}
                </p>
                <a href={safeUrl(p.source)} target="_blank" rel="noreferrer">
                  <Link2 size={13} /> Åpne produktkilden
                </a>
                {p.monterSku && <span>Montér-artikkel {p.monterSku}</span>}
                <small>Lokal pris og lagerstatus er utilgjengelig.</small>
              </div>
            ) : (
              <p className="small muted product-hint">
                Oppgi data fra pakningen eller databladet. Inndata er ikke
                produsentverifisert.
              </p>
            )}
            <div className="fields-grid">
              {kind === "insulation" && (
                <>
                  {field("thickness", "Isolasjonstykkelse", "mm")}
                  {field(
                    "coverage",
                    "Dekning per pakke",
                    "m²/pk",
                    !p ? "Påkrevd for å beregne hele pakker." : "",
                  )}
                  {!p &&
                    select("insulationType", "Materialtype", [
                      "Glassull",
                      "Steinull",
                      "Trefiberisolasjon",
                      "Annen isolasjon",
                    ])}
                  {field("cc", "Stenderavstand c/c", "mm")}
                  {field("studWidth", "Stenderbredde", "mm")}
                </>
              )}
              {kind === "timber" && (
                <>
                  <div className="span-two">
                    <div className="field">
                      <span>Hurtigvalg dimensjon · mm</span>
                      <div className="chips">
                        {[
                          "36 × 48",
                          "48 × 48",
                          "48 × 98",
                          "48 × 148",
                          "48 × 198",
                          "48 × 223",
                        ].map((d) => (
                          <button
                            key={d}
                            className={
                              d === `${v.studThickness} × ${v.studDepth}`
                                ? "active"
                                : ""
                            }
                            onClick={() => {
                              const [t, depth] = d.split(" × ");
                              onChange({
                                ...input,
                                values: {
                                  ...input.values,
                                  productId: "",
                                  studThickness: t,
                                  studDepth: depth,
                                },
                              });
                            }}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {field("studThickness", "Tykkelse virke", "mm")}
                  {field("studDepth", "Dybde virke", "mm")}
                  {field("stockLength", "Handelslengde", "m")}
                  {field("bottom", "Antall bunnsvillag", "lag")}
                  {field("top", "Antall toppsvillag", "lag")}
                  {field("corners", "Ekstra hjørnestendere", "stk")}
                  {field("openingExtras", "Ekstra stendere per åpning", "stk")}
                  {field("lintel", "Tverrstykker per åpning", "stk")}
                  {field("extraLm", "Andre tillegg", "lm")}
                </>
              )}
              {kind === "deck" && (
                <>
                  {field("boardThickness", "Bordtykkelse", "mm")}
                  {field("boardWidth", "Faktisk bordbredde", "mm")}
                  {field(
                    "gap",
                    "Planlagt fuge",
                    "mm",
                    "Avklar mot tresort og fuktinnhold.",
                  )}
                  <div className="span-two">
                    {field(
                      "stockLengths",
                      "Tilgjengelige handelslengder",
                      "m",
                      "Skill lengder med semikolon, f.eks. 3,6; 4,8.",
                      true,
                    )}
                  </div>
                  {field("joistSpacing", "Planlagt bjelkeavstand", "mm")}
                  {select("fixingMethod", "Innfestingssystem", [
                    {
                      value: "top",
                      label: "Toppskruing – oppgitt antall per kryss",
                    },
                    {
                      value: "custom",
                      label: "Skjult / annet system – beregnes separat",
                    },
                  ])}
                  {field("fixingsPerCross", "Skruer per kryss", "stk")}
                  {field("screwPack", "Skruer per pakke (valgfritt)", "stk")}
                  {field("screwPrice", "Skruepris per pakke", "kr")}
                </>
              )}
              {kind === "sheets" && (
                <>
                  {!p &&
                    select("sheetType", "Platetype", [
                      "OSB",
                      "Kryssfiner",
                      "MDF",
                      "Sponplater",
                      "Trefiberplater",
                      "Gips",
                      "Andre plater",
                    ])}
                  {field("sheetLength", "Nominell platelengde", "mm")}
                  {field("sheetWidth", "Nominell platebredde", "mm")}
                  {field("coverLength", "Faktisk dekkende lengde", "mm")}
                  {field("coverWidth", "Faktisk dekkende bredde", "mm")}
                  {field("piecesPerPack", "Plater per salgspakke", "stk")}
                  {select("direction", "Monteringsretning", [
                    { value: "standing", label: "Stående" },
                    { value: "horizontal", label: "Liggende" },
                  ])}
                </>
              )}
              {kind === "cladding" && (
                <>
                  {select("claddingSystem", "Kledningssystem", [
                    {
                      value: "single",
                      label: "Enkeltprofil – oppgitt dekkbredde",
                    },
                    { value: "overunder", label: "Over- og underliggere" },
                  ])}
                  {field(
                    "profile",
                    "Profil / produktbeskrivelse",
                    "",
                    "",
                    true,
                  )}
                  {field(
                    "boardWidth",
                    v.claddingSystem === "overunder"
                      ? "Bredde overligger"
                      : "Nominell bordbredde",
                    "mm",
                  )}
                  {v.claddingSystem === "overunder" ? (
                    <>
                      {field("underWidth", "Bredde underligger", "mm")}
                      {field("overlap", "Overlapp på hver side", "mm")}
                    </>
                  ) : (
                    field("coverWidth", "Faktisk dekkbredde", "mm")
                  )}
                  {field("stockLength", "Handelslengde", "m")}
                  {select("direction", "Leggeretning", [
                    { value: "standing", label: "Stående" },
                    { value: "horizontal", label: "Liggende" },
                  ])}
                  {v.claddingSystem !== "overunder" && (
                    <>
                      {field(
                        "fixingSpacing",
                        "Avstand mellom festerader",
                        "mm",
                      )}
                      {field("fixingsPerCross", "Festemidler per kryss", "stk")}
                    </>
                  )}
                </>
              )}
              {kind === "flooring" && (
                <>
                  {!p &&
                    select("floorType", "Gulvtype", [
                      "Parkett",
                      "Laminat",
                      "Vinyl",
                      "Heltre",
                      "Annet gulv",
                    ])}
                  {field("coverage", "Dekning per gulvpakke", "m²/pk")}
                  {select("pattern", "Leggemønster", [
                    "Rett legging",
                    "Diagonal legging",
                    "Fiskebein / mønster",
                  ])}
                  {select("underlay", "Ta med separat gulvunderlag?", [
                    {
                      value: "no",
                      label: "Nei / ikke avklart / integrert i gulvet",
                    },
                    {
                      value: "yes",
                      label: "Ja, avklart mot gulvets anvisning",
                    },
                  ])}
                  {v.underlay === "yes" &&
                    field(
                      "underlayCoverage",
                      "Netto dekning per underlagspakke",
                      "m²/pk",
                      "La stå tomt for behov oppgitt i m².",
                    )}
                  {select("barrier", "Ta med fuktsperre?", [
                    { value: "no", label: "Nei / behov ikke avklart" },
                    { value: "yes", label: "Ja, avklart mot produktkrav" },
                  ])}
                  {v.barrier === "yes" &&
                    field(
                      "barrierCoverage",
                      "Netto dekning per sperrepakke",
                      "m²/pk",
                    )}
                  {field("trimLength", "Handelslengde gulvlist", "m")}
                </>
              )}
              {kind === "fixings" && (
                <>
                  {!p &&
                    select("fastenerType", "Festemiddel", [
                      "Terrasseskruer",
                      "Kledningsspiker",
                      "Gipsskruer",
                      "Plateskruer",
                      "Konstruksjonsskruer",
                      "Andre festemidler",
                    ])}
                  {field("packSize", "Antall per pakke", "stk")}
                </>
              )}
            </div>
            <div className="field-divider" />
            <div className="fields-grid">
              {field(
                "waste",
                "Valgt svinn / reserve",
                "%",
                "0 % er uten reserve. Tilpass til prosjekt og leggemønster.",
              )}
              {field(
                "price",
                ["timber", "deck", "cladding"].includes(kind)
                  ? "Pris per løpemeter"
                  : kind === "sheets"
                    ? "Pris per plate"
                    : "Pris per pakke",
                "kr",
                "Valgfri, manuelt registrert. Mva-status må avklares.",
              )}
            </div>
          </section>
        </div>
        <aside className="calculation-results">
          <section
            ref={resultPanel}
            className="result-panel"
            aria-live="polite"
          >
            <div className="result-eyebrow">
              <span className="live-dot" /> DIN BEREGNING
              <span>Oppdateres direkte</span>
            </div>
            {result ? (
              <>
                <div className="primary-result">
                  <span>{result.metrics.find((m) => m.primary)?.label}</span>
                  <div>
                    {format(result.metrics.find((m) => m.primary)!.value)}
                    <small>{result.metrics.find((m) => m.primary)?.unit}</small>
                  </div>
                </div>
                <div className="result-metrics">
                  {result.metrics
                    .filter((m) => !m.primary)
                    .map((m) => (
                      <div key={m.label}>
                        <span>{m.label}</span>
                        <strong>
                          {format(m.value, m.unit === "m³" ? 4 : 2)}{" "}
                          <small>{m.unit}</small>
                        </strong>
                      </div>
                    ))}
                </div>
                {result.lines.some((l) => l.price !== undefined) && (
                  <div className="result-cost">
                    <span>Sum registrerte priser</span>
                    <strong>{money(projectTotal(result.lines))}</strong>
                  </div>
                )}
                <div className="result-save">
                  <Select
                    label="Legg i prosjekt"
                    value={activeProjectId}
                    onChange={props.setActiveProject}
                    options={[
                      { value: "", label: "Opprett nytt materialprosjekt" },
                      ...projects.map((p) => ({ value: p.id, label: p.name })),
                    ]}
                  />
                  <button
                    className="primary full"
                    onClick={() => props.onSave(result, effective)}
                  >
                    <Plus size={18} />
                    {props.editing
                      ? "Oppdater beregning"
                      : "Legg til i materialliste"}
                    <ArrowRight size={17} />
                  </button>
                  <p>
                    <Check size={13} /> Lagres lokalt på denne enheten
                  </p>
                </div>
              </>
            ) : (
              <div className="result-incomplete">
                <ClipboardList size={36} strokeWidth={1.3} />
                <h3>Klar når du er</h3>
                <p role="status">{computed.error}</p>
                <span>
                  Fyll ut de manglende opplysningene for å se materialbehovet.
                </span>
              </div>
            )}
          </section>
          {kind !== "flooring" &&
            kind !== "fixings" &&
            v.measureMode !== "area" && (
              <Diagram input={effective} kind={kind} />
            )}
          {result && (
            <>
              <div className="calculation-notice">
                <AlertTriangle size={18} />
                <div>
                  <strong>Kontroller før bestilling</strong>
                  {result.warnings.map((w) => (
                    <p key={w}>{w}</p>
                  ))}
                </div>
              </div>
              <button
                className="disclosure"
                aria-expanded={advanced}
                onClick={() => setAdvanced(!advanced)}
              >
                <Info size={16} /> Beregningsgrunnlag og formler{" "}
                <ChevronDown className={advanced ? "rotate" : ""} size={16} />
              </button>
              {advanced && (
                <div className="assumptions">
                  {result.assumptions.map((a) => (
                    <p key={a}>{a}</p>
                  ))}
                </div>
              )}
              {result.related.length > 0 && (
                <div className="related panel">
                  <h3>Husk også å avklare</h3>
                  {result.related.map((s) => (
                    <p key={s}>
                      <Check size={14} />
                      {s}
                    </p>
                  ))}
                  <span className="small muted">
                    Forslag til vurdering. Legges ikke til automatisk.
                  </span>
                </div>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
