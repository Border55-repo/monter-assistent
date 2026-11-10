import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, ExternalLink, Search } from "lucide-react";
import { guides } from "../lib/guides";
import type { Guide } from "../lib/guides";
import { Heading, Modal } from "./ui";
export function Assistant({
  request,
}: {
  request?: { id: string; nonce: number };
}) {
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("Alle"),
    [selected, setSelected] = useState<Guide | null>(null);
  useEffect(() => {
    if (request) setSelected(guides.find((g) => g.id === request.id) || null);
  }, [request]);
  const filtered = guides.filter(
    (g) =>
      (category === "Alle" || g.category === category) &&
      `${g.title} ${g.summary} ${g.category} ${g.use} ${g.mounting}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <Heading eyebrow="TRYGGERE I KUNDEMØTET" title="Produktassistent">
        Finn forskjellene, avklar bruken og åpne produsentens dokumentasjon.
      </Heading>
      <div className="assistant-search">
        <Search size={22} />
        <input
          aria-label="Søk i produktassistent"
          placeholder="Hva lurer kunden på? Prøv «OSB» eller «dampsperre»"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <kbd>Fagguide</kbd>
      </div>
      <div className="chips category-chips">
        {["Alle", ...new Set(guides.map((g) => g.category))].map((c) => (
          <button
            key={c}
            className={c === category ? "active" : ""}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="guide-grid">
        {filtered.map((g) => (
          <button
            key={g.id}
            className="panel guide-card"
            onClick={() => setSelected(g)}
          >
            <div>
              <span className="guide-category">
                <BookOpen size={15} /> {g.category}
              </span>
              <h2>{g.title}</h2>
              <p>{g.summary}</p>
            </div>
            <span className="text-link">
              Åpne fagguide <ArrowRight size={17} />
            </span>
          </button>
        ))}
      </div>
      {!filtered.length && (
        <p className="panel">
          Ingen treff. Prøv et produktnavn eller en kategori.
        </p>
      )}
      <div className="notice subtle">
        <BookOpen size={20} />
        <p>
          Fagguidene er redaksjonelle sammendrag med kildehenvisninger,
          kontrollert 9. november 2026. De er tilgjengelige offline; eksterne
          dokumenter krever nett. Kontroller gjeldende anvisning for den
          konkrete produktvarianten.
        </p>
      </div>
      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)} wide>
          <div className="guide-detail">
            <span className="badge green">{selected.category}</span>
            <p className="guide-lead">{selected.summary}</p>
            {[
              ["Bruksområder", selected.use],
              ["Fordeler", selected.benefit],
              ["Begrensninger", selected.limitation],
              ["Monteringshensyn", selected.mounting],
              ["Undersøk også", selected.extras],
            ].map(([label, text]) => (
              <section key={label}>
                <h3>{label}</h3>
                <p>{text}</p>
              </section>
            ))}
            <section>
              <h3>Kilder og videre lesning</h3>
              <div className="source-links">
                {selected.sources.map((s) => (
                  <a href={s.url} key={s.url} target="_blank" rel="noreferrer">
                    {s.title}
                    <ExternalLink size={15} />
                  </a>
                ))}
              </div>
              <p className="small muted">
                Innholdet er en faglig veiviser, ingen dokumentasjon av en
                bestemt konstruksjons ytelse.
              </p>
            </section>
          </div>
        </Modal>
      )}
    </>
  );
}
