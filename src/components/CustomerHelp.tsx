import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardList,
  ExternalLink,
} from "lucide-react";
import { customerTopics } from "../lib/customer-help";
import { labels } from "../lib/types";
import type { Kind } from "../lib/types";
export function CustomerHelp({
  topicId,
  onSelect,
  checked,
  onCheck,
  onCalculate,
  onGuide,
}: {
  topicId: string;
  onSelect: (id: string) => void;
  checked: Record<string, boolean>;
  onCheck: (key: string, value: boolean) => void;
  onCalculate: (kind: Kind) => void;
  onGuide: (id: string) => void;
}) {
  const topic = customerTopics.find((t) => t.id === topicId);
  if (!topic)
    return (
      <>
        <div className="customer-intro">
          <ClipboardList size={24} />
          <div>
            <h2>Hva skal kunden gjøre?</h2>
            <p>
              Velg en oppgave. Få spørsmålene, sjekkpunktene og riktig
              kalkulator samlet.
            </p>
          </div>
        </div>
        <div className="customer-topic-grid">
          {customerTopics.map((t) => (
            <button
              className="panel customer-topic"
              key={t.id}
              onClick={() => onSelect(t.id)}
            >
              <h3>{t.title}</h3>
              <p>{t.summary}</p>
              <span className="text-link">
                Start kundesamtalen <ArrowRight size={16} />
              </span>
            </button>
          ))}
        </div>
      </>
    );
  const count = topic.checks.filter(
    (_, i) => checked[`${topic.id}:${i}`],
  ).length;
  return (
    <section className="customer-conversation">
      <button className="back-link" onClick={() => onSelect("")}>
        <ArrowLeft size={16} /> Alle kundeoppgaver
      </button>
      <div className="section-heading">
        <h2>{topic.title}</h2>
        <span className="badge green">Samtalestøtte</span>
      </div>
      <p>{topic.summary}</p>
      <div className="customer-columns">
        <section className="panel">
          <div className="eyebrow">1 · SPØR KUNDEN</div>
          <h3>Avklar før beregning</h3>
          <ol className="customer-questions">
            {topic.questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ol>
        </section>
        <section className="panel">
          <div className="eyebrow">2 · KONTROLLER SAMMEN</div>
          <h3>Husk før kunden går</h3>
          <p className="small muted">
            {count} av {topic.checks.length} avklart · huskelisten beholdes mens
            appen er åpen
          </p>
          <div className="customer-checks">
            {topic.checks.map((c, i) => (
              <label className="checkbox" key={c}>
                <input
                  type="checkbox"
                  checked={!!checked[`${topic.id}:${i}`]}
                  onChange={(e) =>
                    onCheck(`${topic.id}:${i}`, e.target.checked)
                  }
                />
                <span>{c}</span>
              </label>
            ))}
          </div>
          <button
            className="text-link"
            onClick={() =>
              topic.checks.forEach((_, i) => onCheck(`${topic.id}:${i}`, false))
            }
          >
            Nullstill for neste kunde
          </button>
        </section>
      </div>
      <div className="notice">
        <Check size={20} />
        <p>{topic.advice}</p>
      </div>
      <section className="panel">
        <div className="eyebrow">3 · REGN OG SAMLE MATERIALENE</div>
        <h3>Velg det kunden trenger</h3>
        <div className="customer-actions">
          {topic.kinds.map((k) => (
            <button
              className="secondary"
              key={k}
              onClick={() => onCalculate(k)}
            >
              {labels[k].short}
              <ArrowRight size={16} />
            </button>
          ))}
          <button className="text-link" onClick={() => onGuide(topic.guideId)}>
            Åpne fagguide <ArrowRight size={16} />
          </button>
        </div>
        <p className="small muted">
          Legg hver beregning i samme prosjekt. Tilbehør vurderes før det legges
          til.
        </p>
      </section>
      <details className="panel customer-sources">
        <summary>Kilder og kontroll · 10. november 2026</summary>
        <div className="source-links">
          {topic.sources.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
              {s.title}
              <ExternalLink size={14} />
            </a>
          ))}
        </div>
        <p className="small muted">
          Redaksjonell samtalestøtte. Åpne gjeldende dokumentasjon for valgt
          produkt. Kildelenker krever nett.
        </p>
      </details>
    </section>
  );
}
