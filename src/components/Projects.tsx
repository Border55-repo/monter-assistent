import { useState } from "react";
import {
  ArrowLeft,
  Check,
  ClipboardList,
  Copy,
  Download,
  Eye,
  FileText,
  FolderOpen,
  Pencil,
  Plus,
  Printer,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import type {
  Kind,
  MaterialLine,
  Project,
  SavedCalculation,
} from "../lib/types";
import { date, format, money, numberFrom, uid } from "../lib/types";
import { calculationTitle, projectTotal } from "../lib/calculators";
import { exportPdf, projectText } from "../lib/export";
import { CalcIcon, Empty, Field, Heading, Modal } from "./ui";
interface Props {
  projects: Project[];
  onChange: (p: Project[]) => void;
  selectedId: string;
  setSelectedId: (s: string) => void;
  onCalculate: (kind?: Kind) => void;
  onEditCalculation: (project: Project, c: SavedCalculation) => void;
  notify: (s: string) => void;
}
export function Projects({
  projects,
  onChange,
  selectedId,
  setSelectedId,
  onCalculate,
  onEditCalculation,
  notify,
}: Props) {
  const [newName, setNewName] = useState(""),
    [newModal, setNewModal] = useState(false),
    [customer, setCustomer] = useState(false),
    [share, setShare] = useState(false),
    [deleteId, setDeleteId] = useState(""),
    [manual, setManual] = useState<MaterialLine | null>(null),
    [lineError, setLineError] = useState(""),
    [pdfBusy, setPdfBusy] = useState(false);
  const selected = projects.find((p) => p.id === selectedId);
  const update = (p: Project) =>
    onChange(
      projects.map((x) =>
        x.id === p.id ? { ...p, updatedAt: new Date().toISOString() } : x,
      ),
    );
  const create = () => {
    if (!newName.trim()) return;
    const now = new Date().toISOString();
    const p: Project = {
      id: uid(),
      name: newName.trim(),
      createdAt: now,
      updatedAt: now,
      calculations: [],
      lines: [],
    };
    onChange([p, ...projects]);
    setSelectedId(p.id);
    setNewModal(false);
    setNewName("");
    notify("Prosjektet er opprettet og lagret lokalt.");
  };
  const duplicate = (p: Project) => {
    const clone = structuredClone(p);
    clone.id = uid();
    clone.name += " – kopi";
    clone.createdAt = clone.updatedAt = new Date().toISOString();
    onChange([clone, ...projects]);
    setSelectedId(clone.id);
    notify("Prosjektet er kopiert.");
  };
  const pdf = async () => {
    if (!selected) return;
    setPdfBusy(true);
    try {
      await exportPdf(selected);
      notify("PDF-materiallisten er lastet ned.");
    } catch (e) {
      notify(`PDF kunne ikke opprettes: ${(e as Error).message}`);
    } finally {
      setPdfBusy(false);
    }
  };
  const shareProject = async () => {
    if (!selected) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: selected.name,
          text: projectText(selected),
        });
        return;
      } catch {
        /* Show a local copy fallback, including when native sharing is unavailable. */
      }
    }
    setShare(true);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(projectText(selected!));
      notify("Materiallisten er kopiert.");
    } catch {
      notify(
        "Kopiering er ikke tilgjengelig. Marker teksten og kopier manuelt.",
      );
    }
  };
  const editLine = (line?: MaterialLine) => {
    setLineError("");
    setManual(
      line
        ? { ...line }
        : {
            id: uid(),
            name: "",
            sku: "",
            dimension: "",
            quantity: 1,
            unit: "stk",
            priceSource: "Manuelt registrert",
            note: "",
          },
    );
  };
  const saveLine = () => {
    if (!manual || !selected) return;
    if (
      !manual.name.trim() ||
      !Number.isFinite(manual.quantity) ||
      manual.quantity <= 0 ||
      manual.quantity > 1e9 ||
      (manual.price !== undefined &&
        (!Number.isFinite(manual.price) ||
          manual.price < 0 ||
          manual.price > 1e9))
    ) {
      setLineError(
        "Oppgi navn, positiv mengde og en gyldig pris eller la prisfeltet stå tomt.",
      );
      return;
    }
    const line = {
      ...manual,
      note: `${manual.note.replace(/\s*Manuelt justert\.$/, "")} Manuelt justert.`,
      priceSource:
        manual.price === undefined ? "Ikke registrert" : "Manuelt registrert",
    };
    update({
      ...selected,
      lines: selected.lines.some((l) => l.id === manual.id)
        ? selected.lines.map((l) => (l.id === manual.id ? line : l))
        : [...selected.lines, line],
    });
    setManual(null);
    notify("Materiallinjen er oppdatert.");
  };
  return (
    <div className={customer ? "customer-mode" : ""}>
      {selected ? (
        <>
          <div className="no-print">
            <button
              className="back-link"
              onClick={() => {
                setSelectedId("");
                setCustomer(false);
              }}
            >
              <ArrowLeft size={16} /> Alle prosjekter
            </button>
          </div>
          <Heading
            eyebrow={
              customer ? "MATERIALLISTE · KUNDEVISNING" : "LAGRET LOKALT"
            }
            title={selected.name}
            action={
              <div className="heading-actions no-print">
                <button
                  className="secondary"
                  onClick={() => setCustomer(!customer)}
                >
                  {customer ? <X size={17} /> : <Eye size={17} />}{" "}
                  {customer ? "Lukk kundevisning" : "Kundevisning"}
                </button>
                <button
                  className="primary"
                  onClick={() => void pdf()}
                  disabled={pdfBusy || !selected.lines.length}
                >
                  <Download size={17} />{" "}
                  {pdfBusy ? "Lager PDF …" : "Eksporter PDF"}
                </button>
              </div>
            }
          >
            Oppdatert {date(selected.updatedAt)} ·{" "}
            {selected.calculations.length} beregninger · {selected.lines.length}{" "}
            materiallinjer
          </Heading>
          <div className="project-tools no-print">
            <button className="secondary" onClick={() => window.print()}>
              <Printer size={17} /> Skriv ut
            </button>
            <button className="secondary" onClick={() => void shareProject()}>
              <Share2 size={17} /> Del som tekst
            </button>
            {!customer && (
              <>
                <button
                  className="secondary"
                  onClick={() => duplicate(selected)}
                >
                  <Copy size={17} /> Kopier prosjekt
                </button>
                <button
                  className="secondary"
                  onClick={() => {
                    const name = window.prompt(
                      "Prosjektnavn – uten personopplysninger",
                      selected.name,
                    );
                    if (name?.trim())
                      update({ ...selected, name: name.trim() });
                  }}
                >
                  <Pencil size={16} /> Endre navn
                </button>
              </>
            )}
          </div>
          <div className="project-layout">
            <div>
              <section className="panel material-panel">
                <div className="section-heading">
                  <h2>Materialliste</h2>
                  {!customer && (
                    <button
                      className="small-button no-print"
                      onClick={() => editLine()}
                    >
                      <Plus size={15} /> Legg til linje
                    </button>
                  )}
                </div>
                {selected.lines.length ? (
                  <div className="material-lines">
                    {selected.lines.map((l) => (
                      <div className="material-line" key={l.id}>
                        <div className="line-product">
                          <span className="line-qty">
                            {format(l.quantity)}
                            <small>{l.unit}</small>
                          </span>
                          <div>
                            <strong>{l.name}</strong>
                            {l.dimension && <span>{l.dimension}</span>}
                            {l.sku && <small>Varenummer {l.sku}</small>}
                            {l.note && <p>{l.note}</p>}
                          </div>
                        </div>
                        <div className="line-price">
                          <strong>
                            {l.price === undefined
                              ? "Pris mangler"
                              : money(l.price * l.quantity)}
                          </strong>
                          {l.price !== undefined && (
                            <small>
                              {money(l.price)} / {l.unit} · manuell
                            </small>
                          )}
                          {!customer && (
                            <div className="line-actions no-print">
                              <button
                                className="icon-button"
                                aria-label={`Rediger materiallinje ${l.name}`}
                                onClick={() => editLine(l)}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                className="icon-button danger"
                                aria-label={`Fjern materiallinje ${l.name}`}
                                onClick={() =>
                                  update({
                                    ...selected,
                                    lines: selected.lines.filter(
                                      (x) => x.id !== l.id,
                                    ),
                                  })
                                }
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty
                    icon={<ClipboardList size={32} />}
                    title="En god start på prosjektet"
                    action={
                      <button className="primary" onClick={() => onCalculate()}>
                        Velg kalkulator
                      </button>
                    }
                  >
                    Beregn materialer og legg resultatet til her, eller legg til
                    en materiallinje manuelt.
                  </Empty>
                )}
              </section>
              {!customer && (
                <section className="panel no-print">
                  <div className="section-heading">
                    <h2>Beregninger i prosjektet</h2>
                    <button
                      className="small-button"
                      onClick={() => onCalculate()}
                    >
                      <Plus size={15} /> Ny beregning
                    </button>
                  </div>
                  {selected.calculations.map((c) => (
                    <div className="saved-calculation" key={c.id}>
                      <CalcIcon kind={c.kind} />
                      <div>
                        <strong>{calculationTitle(c.kind, c.input)}</strong>
                        <small>{date(c.createdAt)}</small>
                      </div>
                      <button
                        className="icon-button"
                        aria-label={`Rediger beregning ${calculationTitle(c.kind, c.input)}`}
                        onClick={() => onEditCalculation(selected, c)}
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        className="icon-button danger"
                        aria-label={`Fjern beregning ${calculationTitle(c.kind, c.input)}`}
                        onClick={() =>
                          update({
                            ...selected,
                            calculations: selected.calculations.filter(
                              (x) => x.id !== c.id,
                            ),
                            lines: selected.lines.filter(
                              (l) => !l.id.startsWith(c.id + ":"),
                            ),
                          })
                        }
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  ))}
                  {!selected.calculations.length && (
                    <p className="muted small">
                      Ingen kalkulatorberegninger er lagt til ennå.
                    </p>
                  )}
                  <p className="small muted">
                    Ved ny lagring av en beregning erstattes dens
                    materiallinjer, også manuelle justeringer på disse linjene.
                  </p>
                </section>
              )}
              <details className="panel assumptions-details">
                <summary>Beregningsforutsetninger og begrensninger</summary>
                {selected.calculations.map((c) => (
                  <div key={c.id}>
                    <h3>{calculationTitle(c.kind, c.input)}</h3>
                    {[...c.result.assumptions, ...c.result.warnings].map(
                      (s, i) => (
                        <p key={i}>{s}</p>
                      ),
                    )}
                  </div>
                ))}
              </details>
            </div>
            <aside>
              <section className="panel project-summary">
                <div className="eyebrow">PROSJEKTOVERSIKT</div>
                <h2>{selected.lines.length} materiallinjer</h2>
                <div className="summary-total">
                  <span>Sum registrerte priser</span>
                  <strong>{money(projectTotal(selected.lines))}</strong>
                </div>
                <p>
                  {selected.lines.filter((l) => l.price === undefined).length}{" "}
                  linje(r) mangler pris. Totalen er et delvis overslag hvis
                  priser mangler.
                </p>
                <p className="small muted">
                  Priser er manuelt registrert i NOK. Mva-status og gyldighet må
                  avklares før tilbud.
                </p>
                <div className="saved-indicator">
                  <Check size={15} /> Lokal lagring på denne enheten
                </div>
              </section>
              <div className="notice subtle">
                <FileText size={19} />
                <p>
                  Materiallisten er en mengdeoversikt. Kontroller produktvalg,
                  mål og konstruksjon før bestilling.
                </p>
              </div>
            </aside>
          </div>
        </>
      ) : (
        <>
          <Heading
            eyebrow="FRA BEREGNING TIL OVERSIKT"
            title="Prosjekter"
            action={
              <button className="primary" onClick={() => setNewModal(true)}>
                <Plus size={18} /> Nytt prosjekt
              </button>
            }
          >
            Samle beregninger og produkter i én materialliste.
          </Heading>
          {!projects.length ? (
            <section className="panel">
              <Empty
                icon={<FolderOpen size={36} />}
                title="Plass til neste byggeprosjekt"
                action={
                  <button className="primary" onClick={() => setNewModal(true)}>
                    <Plus size={17} /> Opprett prosjekt
                  </button>
                }
              >
                Isolering av garasje eller en ny terrasse? Gi prosjektet et
                navn, så samler du materialene her.
              </Empty>
            </section>
          ) : (
            <div className="project-grid">
              {projects.map((p) => (
                <div className="panel project-card" key={p.id}>
                  <div className="project-card-top">
                    <span className="folder-icon">
                      <FolderOpen size={24} />
                    </span>
                    <span className="badge">Lokalt lagret</span>
                  </div>
                  <button
                    className="project-title"
                    onClick={() => setSelectedId(p.id)}
                  >
                    {p.name}
                  </button>
                  <p>
                    {p.calculations.length} beregninger · {p.lines.length}{" "}
                    materiallinjer
                  </p>
                  <div className="project-card-bottom">
                    <span>{date(p.updatedAt)}</span>
                    <button
                      className="icon-button"
                      aria-label={`Kopier ${p.name}`}
                      onClick={() => duplicate(p)}
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      className="icon-button danger"
                      aria-label={`Slett ${p.name}`}
                      onClick={() => setDeleteId(p.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <button
                    className="secondary full"
                    onClick={() => setSelectedId(p.id)}
                  >
                    Åpne materialliste
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="notice subtle">
            <ShieldNote />
            <p>
              Bruk beskrivende prosjekttitler uten kundenavn, telefonnummer
              eller andre personopplysninger. Ta en sikkerhetskopi i
              innstillinger ved behov.
            </p>
          </div>
        </>
      )}
      {newModal && (
        <Modal title="Opprett prosjekt" onClose={() => setNewModal(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create();
            }}
          >
            <Field
              label="Prosjektnavn"
              value={newName}
              onChange={setNewName}
              text
              placeholder="For eksempel: Isolering av garasje"
              hint="Ikke registrer personopplysninger."
            />
            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setNewModal(false)}
              >
                Avbryt
              </button>
              <button
                type="submit"
                className="primary"
                disabled={!newName.trim()}
              >
                Opprett prosjekt
              </button>
            </div>
          </form>
        </Modal>
      )}
      {deleteId && (
        <Modal title="Slett prosjekt?" onClose={() => setDeleteId("")}>
          <p>
            Prosjektet og materiallisten fjernes fra denne enheten. Du kan ta en
            sikkerhetskopi fra innstillinger først.
          </p>
          <div className="modal-actions">
            <button className="secondary" onClick={() => setDeleteId("")}>
              Behold prosjekt
            </button>
            <button
              className="primary danger-bg"
              onClick={() => {
                onChange(projects.filter((p) => p.id !== deleteId));
                setDeleteId("");
                notify("Prosjektet er slettet.");
              }}
            >
              Slett prosjekt
            </button>
          </div>
        </Modal>
      )}
      {manual && (
        <Modal title="Rediger materiallinje" onClose={() => setManual(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveLine();
            }}
          >
            <div className="fields-grid">
              <div className="span-two">
                <Field
                  label="Produktnavn på linje"
                  value={manual.name}
                  onChange={(s) => setManual({ ...manual, name: s })}
                  text
                />
              </div>
              <Field
                label="Varenummer"
                value={manual.sku}
                onChange={(s) => setManual({ ...manual, sku: s })}
                text
              />
              <Field
                label="Dimensjoner"
                value={manual.dimension}
                onChange={(s) => setManual({ ...manual, dimension: s })}
                text
              />
              <Field
                label="Mengde"
                value={
                  Number.isNaN(manual.quantity) ? "" : String(manual.quantity)
                }
                onChange={(s) =>
                  setManual({
                    ...manual,
                    quantity: s.trim() ? numberFrom(s) : NaN,
                  })
                }
              />
              <Field
                label="Enhet"
                value={manual.unit}
                onChange={(s) => setManual({ ...manual, unit: s })}
                text
              />
              <Field
                label="Manuell enhetspris"
                unit="kr"
                value={manual.price === undefined ? "" : String(manual.price)}
                onChange={(s) =>
                  setManual({
                    ...manual,
                    price: s.trim() ? numberFrom(s) : undefined,
                  })
                }
              />
            </div>
            {lineError && (
              <div className="error" role="alert">
                {lineError}
              </div>
            )}
            <div className="modal-actions">
              <button
                className="secondary"
                type="button"
                onClick={() => setManual(null)}
              >
                Avbryt
              </button>
              <button className="primary" type="submit">
                Lagre materiallinje
              </button>
            </div>
          </form>
        </Modal>
      )}
      {share && selected && (
        <Modal
          title="Del materialliste som tekst"
          onClose={() => setShare(false)}
          wide
        >
          <p>
            Inneholder prosjektets materialer og beregningsforutsetninger.
            Kontroller innholdet før du deler.
          </p>
          <textarea
            className="share-text"
            aria-label="Materialliste som tekst"
            readOnly
            value={projectText(selected)}
          />
          <div className="modal-actions">
            <button className="secondary" onClick={() => setShare(false)}>
              Lukk
            </button>
            <button className="primary" onClick={() => void copy()}>
              <Copy size={16} /> Kopier tekst
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function ShieldNote() {
  return <Check size={19} />;
}
