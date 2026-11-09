import { useState } from "react";
import {
  ArrowDownUp,
  Box,
  Calculator,
  Info,
  Package,
  Percent,
  Ruler,
} from "lucide-react";
import { quickCalculate, quickModes } from "../lib/quick";
import type { QuickMode } from "../lib/quick";
import { format } from "../lib/types";
import { Field, Heading, Select } from "./ui";
const icons = {
  length: Ruler,
  area: Calculator,
  volume: Box,
  packages: Package,
  waste: Percent,
  price: ArrowDownUp,
};
export function QuickTools() {
  const [mode, setMode] = useState<QuickMode>("packages"),
    [values, setValues] = useState<Record<string, string>>(() => {
      try {
        return JSON.parse(
          sessionStorage.getItem("monter-quick") || "",
        ) as Record<string, string>;
      } catch {
        return {
          amount: "37",
          coverage: "5,7",
          length: "4,8",
          width: "4",
          coverWidth: "120",
          widthMm: "98",
          thickness: "48",
          count: "1",
          percent: "5",
          price: "",
          wanted: "10",
          unit: "m",
        };
      }
    });
  const set = (k: string, s: string) => {
    const next = { ...values, [k]: s };
    setValues(next);
    try {
      sessionStorage.setItem("monter-quick", JSON.stringify(next));
    } catch {
      /* The tool remains usable in a restricted browser. */
    }
  };
  const field = (key: string, label: string, unit = "", hint = "") => (
    <Field
      label={label}
      value={values[key] || ""}
      onChange={(s) => set(key, s)}
      unit={unit}
      hint={hint}
    />
  );
  let error = "",
    results: ReturnType<typeof quickCalculate> = [];
  try {
    results = quickCalculate(mode, values);
  } catch (e) {
    error = (e as Error).message;
  }
  return (
    <>
      <Heading eyebrow="UTEBUTIKKENS LOMMEVERKTØY" title="Hurtigverktøy">
        Små beregninger. Raske svar. Alltid med tydelige enheter.
      </Heading>
      <div className="quick-tabs">
        {(Object.keys(quickModes) as QuickMode[]).map((k) => {
          const Icon = icons[k];
          return (
            <button
              key={k}
              className={mode === k ? "active" : ""}
              onClick={() => setMode(k)}
            >
              <Icon size={20} />
              {quickModes[k]}
            </button>
          );
        })}
      </div>
      <div className="quick-layout">
        <section className="panel">
          <h2>{quickModes[mode]}</h2>
          <div className="fields-grid">
            {mode === "length" && (
              <>
                {field("amount", "Verdi")}
                <Select
                  label="Fra enhet"
                  value={values.unit}
                  onChange={(s) => set("unit", s)}
                  options={["mm", "cm", "m"]}
                />
              </>
            )}
            {mode === "area" && (
              <>
                {field("length", "Lengde", "m")}
                {field("width", "Bredde", "m")}
                {field("coverWidth", "Faktisk dekkbredde", "mm")}
              </>
            )}
            {mode === "volume" && (
              <>
                {field("thickness", "Tykkelse", "mm")}
                {field("widthMm", "Bredde virke", "mm")}
                {field("length", "Lengde per stykke", "m")}
                {field("count", "Antall stykker", "stk")}
              </>
            )}
            {mode === "packages" && (
              <>
                {field(
                  "amount",
                  "Samlet behov",
                  "",
                  "For eksempel m², løpemeter eller stykk.",
                )}
                {field(
                  "coverage",
                  "Mengde per pakke / enhet",
                  "",
                  "Bruk samme enhet som samlet behov.",
                )}
              </>
            )}
            {mode === "waste" && (
              <>
                {field("amount", "Grunnmengde")}
                {field("percent", "Valgt svinn / tillegg", "%")}
              </>
            )}
            {mode === "price" && (
              <>
                {field("price", "Pris for kjent mengde", "kr")}
                {field(
                  "amount",
                  "Kjent mengde",
                  "",
                  "Velg samme mengdeenhet i alle feltene.",
                )}
                {field("coverage", "Mengde per pakke")}
                {field("wanted", "Ønsket mengde")}
              </>
            )}
          </div>
          <p className="small muted quick-formula">
            {mode === "length"
              ? "1 m = 100 cm = 1000 mm. Løpemeter er en lengde."
              : mode === "area"
                ? "Areal = lengde × bredde. Løpemeter = areal / dekkbredde i meter."
                : mode === "volume"
                  ? "Volum = tykkelse × bredde / 1 000 000 × lengde × antall. 1 m³ = 1000 liter."
                  : mode === "packages"
                    ? "Hele pakker = avrund opp(samlet behov / innhold per pakke)."
                    : mode === "waste"
                      ? "Mengde med svinn = grunnmengde × (1 + svinn / 100)."
                      : "Enhetspris = kjent pris / kjent mengde. Samme grunnlag brukes for pakke og ønsket mengde."}
          </p>
        </section>
        <section className="result-panel quick-result" aria-live="polite">
          <div className="result-eyebrow">
            <span className="live-dot" /> RESULTAT
          </div>
          {error ? (
            <p className="result-incomplete">{error}</p>
          ) : (
            results.map((r, i) =>
              i === 0 ? (
                <div className="primary-result" key={r.label}>
                  <span>{r.label}</span>
                  <div>
                    {format(r.value, 5)}
                    <small>{r.unit}</small>
                  </div>
                </div>
              ) : (
                <div className="quick-result-row" key={r.label}>
                  <span>{r.label}</span>
                  <strong>
                    {format(r.value, 5)} {r.unit}
                  </strong>
                </div>
              ),
            )
          )}
        </section>
      </div>
      <div className="notice subtle">
        <Info size={19} />
        <p>
          Dette er ren mengde- og prisomregning. Pakningsdata og priser må komme
          fra produktet du faktisk skal levere.
        </p>
      </div>
    </>
  );
}
