import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import type { AppData } from "../lib/types";
import { searchApp } from "../lib/search";
import type { SearchHit } from "../lib/search";
import { Modal } from "./ui";
const groups: [SearchHit["type"], string][] = [
  ["customer", "Kundehjelp"],
  ["product", "Produkter og plassering"],
  ["calculator", "Kalkulatorer"],
  ["guide", "Fagguider"],
  ["project", "Egne prosjekter"],
];
export function GlobalSearch({
  data,
  onOpen,
  onClose,
}: {
  data: AppData;
  onOpen: (hit: SearchHit) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const hits = searchApp(query, data);
  return (
    <Modal title="Søk i hele appen" onClose={onClose} wide>
      <div className="search-input global-search-input">
        <Search size={20} />
        <input
          aria-label="Søk i hele appen"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Vare, varenummer eller hva kunden skal bygge …"
        />
      </div>
      {!query.trim() && (
        <>
          <p>
            Finn produkter, plasseringer, kalkulatorer, fagguider og egne
            prosjekter.
          </p>
          <div className="chips">
            {["isolere garasje", "terrasse", "gips", "gulv"].map((q) => (
              <button key={q} onClick={() => setQuery(q)}>
                {q}
              </button>
            ))}
          </div>
        </>
      )}
      <p className="small muted" role="status" aria-live="polite">
        {query.trim() ? `${hits.length} treff` : "Søket virker også uten nett."}
      </p>
      <div className="global-results">
        {groups.map(([type, title]) => {
          const rows = hits.filter((h) => h.type === type);
          return rows.length ? (
            <section key={type}>
              <h3>
                {title} <small>({rows.length})</small>
              </h3>
              {rows.slice(0, 8).map((hit) => (
                <button
                  className="search-result"
                  key={hit.id}
                  onClick={() => onOpen(hit)}
                >
                  <span>
                    <strong>{hit.title}</strong>
                    <small>{hit.detail}</small>
                  </span>
                  <ArrowRight size={18} />
                </button>
              ))}
              {rows.length > 8 && (
                <p className="small muted">
                  Viser de 8 beste treffene. Presiser søket for å finne flere.
                </p>
              )}
            </section>
          ) : null;
        })}
      </div>
      {query.trim() && !hits.length && (
        <p className="notice">
          Ingen treff. Prøv et kortere ord eller et varenummer. Appen søker i
          det lokale registeret.
        </p>
      )}
    </Modal>
  );
}
