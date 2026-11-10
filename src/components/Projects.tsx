import { useEffect, useState } from "react";
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
import {
  date,
  format,
  money,
  numberFrom,
  uid,
  projectStatuses,
} from "../lib/types";
import type { ProjectStatus } from "../lib/types";
import { calculationTitle, projectTotal } from "../lib/calculators";
import { exportPdf, projectText } from "../lib/export";
import { CalcIcon, Empty, Field, Heading, Modal, Select } from "./ui";
interface Props {
  projects: Project[];
  onChange: (p: Project[]) => void;
  selectedId: string;
  setSelectedId: (s: string) => void;
  onCalculate: (kind?: Kind) => void;
  onEditCalculation: (project: Project, c: SavedCalculation) => void;
  notify: (s: string) => void;
  onSaveWorkNote: (id: string, note: string) => Promise<void>;
}
export function Projects({
  projects,
  onChange,
  selectedId,
  setSelectedId,
  onCalculate,
  onEditCalculation,
  notify,
  onSaveWorkNote,
}: Props) {
  const [newName, setNewName] = useState(""),
    [newModal, setNewModal] = useState(false),
    [rename, setRename] = useState<string | null>(null),
    [customer, setCustomer] = useState(false),
    [share, setShare] = useState(false),
    [deleteId, setDeleteId] = useState(""),
    [manual, setManual] = useState<MaterialLine | null>(null),
    [lineError, setLineError] = useState(""),
    [lineQuantity, setLineQuantity] = useState("1"),
    [linePrice, setLinePrice] = useState(""),
    [pdfBusy, setPdfBusy] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [workNote, setWorkNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const selected = projects.find((p) => p.id === selectedId);
  useEffect(() => {
    setWorkNote(selected?.workNote || "");
  }, [selected?.id]);
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
      status: "calculating",
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
    clone.status = "calculating";
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
    setLineQuantity(String(line?.quantity ?? 1).replace(".", ","));
    setLinePrice(
      line?.price === undefined ? "" : String(line.price).replace(".", ","),
    );
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
    const quantity = lineQuantity.trim() ? numberFrom(lineQuantity) : NaN;
    const price = linePrice.trim() ? numberFrom(linePrice) : undefined;
    if (
      !manual.name.trim() ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      quantity > 1e9 ||
      (price !== undefined &&
        (!Number.isFinite(price) || price < 0 || price > 1e9))
    ) {
      setLineError(
        "Oppgi navn, positiv mengde og en gyldig pris eller la prisfeltet stå tomt.",
      );
      return;
    }
    const line = {
      ...manual,
      quantity,
      price,
      note: `${manual.note.replace(/\s*Manuelt justert\.$/, "")} Manuelt justert.`,
      priceSource:
        price === undefined ? "Ikke registrert" : "Manuelt registrert",
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
                  onClick={() => setRename(selected.name)}
                >
                  <Pencil size={16} /> Endre navn
                </button>
              </>
            )}
          </div>
          {!customer && (
            <section className="panel project-workflow no-print">
              <Select
                label="Arbeidsstatus"
                value={selected.status || "calculating"}
                onChange={(status) =>
                  update({ ...selected, status: status as ProjectStatus })
                }
                options={Object.entries(projectStatuses).map(
                  ([value, label]) => ({ value, label }),
                )}
              />
              <div>
                <label className="field">
                  <span>Neste steg / arbeidsnotat</span>
                  <textarea
                    aria-label="Neste steg / arbeidsnotat"
                    maxLength={500}
                    rows={2}
                    placeholder="F.eks. kontroller handelslengder før plukk"
                    value={workNote}
                    onChange={(e) => setWorkNote(e.target.value)}
                  />
                  <small>
                    Korte fagnotater uten personopplysninger. Lagres på denne
                    enheten.
                  </small>
                </label>
                <button
                  className="secondary"
                  disabled={
                    savingNote || workNote === (selected.workNote || "")
                  }
                  onClick={() => {
                    setSavingNote(true);
                    void onSaveWorkNote(selected.id, workNote)
                      .then(() => notify("Arbeidsnotatet er lagret."))
                      .catch(() =>
                        notify(
                          "Notatet kunne ikke lagres. Behold fanen åpen og prøv igjen.",
                        ),
                      )
                      .finally(() => setSavingNote(false));
                  }}
                >
                  {savingNote ? "Lagrer …" : "Lagre arbeidsnotat"}
                </button>
              </div>
            </section>
          )}
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
                              {money(l.price)} / {l.unit} ·{" "}
                              {l.priceSource.startsWith("Publisert nettpris")
                                ? "Publisert nettpris"
                                : "manuell"}
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
                {!customer && (
                  <button
                    className="primary full no-print"
                    onClick={() => onCalculate()}
                  >
                    <Plus size={17} /> Legg til flere materialer
                  </button>
                )}
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
                  Priser er valgte øyeblikksbilder i NOK. Nettpriser oppdaterer
                  ikke denne listen automatisk. Mva-status og gyldighet må
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
          {projects.length > 0 && (
            <div className="toolbar">
              <Select
                label="Vis prosjektstatus"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: "all", label: "Alle statuser" },
                  ...Object.entries(projectStatuses).map(([value, label]) => ({
                    value,
                    label,
                  })),
                ]}
              />
              <span className="small muted">
                {
                  projects.filter(
                    (p) =>
                      statusFilter === "all" ||
                      (p.status || "calculating") === statusFilter,
                  ).length
                }{" "}
                prosjekter
              </span>
            </div>
          )}
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
              {projects
                .filter(
                  (p) =>
                    statusFilter === "all" ||
                    (p.status || "calculating") === statusFilter,
                )
                .map((p) => (
                  <div className="panel project-card" key={p.id}>
                    <div className="project-card-top">
                      <span className="folder-icon">
                        <FolderOpen size={24} />
                      </span>
                      <span
                        className={`badge ${p.status === "done" ? "green" : p.status === "clarify" ? "amber" : ""}`}
                      >
                        {projectStatuses[p.status || "calculating"]}
                      </span>
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
                    {p.workNote && (
                      <p className="work-note">Neste steg: {p.workNote}</p>
                    )}
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
      {rename !== null && selected && (
        <Modal title="Endre prosjektnavn" onClose={() => setRename(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (rename.trim()) {
                update({ ...selected, name: rename.trim() });
                setRename(null);
                notify("Prosjektnavnet er oppdatert.");
              }
            }}
          >
            <Field
              label="Nytt prosjektnavn"
              value={rename}
              onChange={setRename}
              text
              hint="Bruk et beskrivende navn uten personopplysninger."
            />
            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setRename(null)}
              >
                Avbryt
              </button>
              <button
                type="submit"
                className="primary"
                disabled={!rename.trim()}
              >
                Lagre navn
              </button>
            </div>
          </form>
        </Modal>
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
                value={lineQuantity}
                onChange={setLineQuantity}
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
                value={linePrice}
                onChange={setLinePrice}
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
