import { useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  CheckCircle2,
  ExternalLink,
  Package,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";
import type { Product } from "../lib/types";
import { date, format, kinds, labels, money } from "../lib/types";
import {
  csvCell,
  importProducts,
  mergeProducts,
  productColumns,
  productsCsv,
  safeUrl,
  validateProduct,
} from "../lib/products";
import { missingFields, needsReview } from "../lib/seed";
import { download } from "../lib/export";
import { Empty, Field, Heading, Modal, Select } from "./ui";
interface Props {
  products: Product[];
  onChange: (products: Product[]) => void;
  notify: (s: string) => void;
  onUse: (p: Product) => void;
}
export function Products({ products, onChange, notify, onUse }: Props) {
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("all"),
    [showInactive, setShowInactive] = useState(false);
  const [editing, setEditing] = useState<Record<string, string> | null>(null),
    [selected, setSelected] = useState<Product | null>(null),
    [error, setError] = useState(""),
    [pending, setPending] = useState<Product[] | null>(null),
    [importing, setImporting] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const filtered = products.filter(
    (p) =>
      (showInactive || p.active) &&
      (category === "all" || p.category === category) &&
      `${p.name} ${p.sku} ${p.nobb} ${p.gtin} ${p.manufacturer}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const edit = (p?: Product) => {
    setError("");
    setEditing(
      p
        ? Object.fromEntries(
            Object.entries(p).map(([k, v]) => [k, String(v ?? "")]),
          )
        : {
            name: "",
            manufacturer: "",
            sku: "",
            category: "insulation",
            unit: "pk",
            active: "true",
            verified: "false",
          },
    );
  };
  const set = (key: string, val: string) =>
    setEditing((s) => ({ ...s!, [key]: val }));
  const save = () => {
    try {
      const raw = { ...editing, updatedAt: new Date().toISOString() };
      const product = validateProduct(raw);
      onChange(
        products.some((p) => p.id === product.id)
          ? products.map((p) => (p.id === product.id ? product : p))
          : [...products, product],
      );
      setEditing(null);
      setSelected(null);
      notify("Produktet er lagret lokalt.");
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const loadFile = async (f?: File) => {
    if (!f) return;
    setImporting(true);
    try {
      setPending(await importProducts(f));
    } catch (e) {
      notify(
        `Import avbrutt: ${(e as Error).message} Eksisterende produkter er beholdt.`,
      );
    } finally {
      setImporting(false);
      if (file.current) file.current.value = "";
    }
  };
  return (
    <>
      <Heading
        eyebrow="LOKALT PRODUKTREGISTER"
        title="Produkter"
        action={
          <button className="primary" onClick={() => edit()}>
            <Plus size={18} /> Nytt produkt
          </button>
        }
      >
        Kontrollerte produktdata. Sporbare kilder. Ingen antatt lagerstatus.
      </Heading>
      <div className="stats-strip">
        <div>
          <Package size={19} />
          <span>
            <strong>{products.filter((p) => p.active).length}</strong> aktive
            produkter
          </span>
        </div>
        <div>
          <ShieldCheck size={19} />
          <span>
            <strong>{products.filter((p) => p.verified).length}</strong> med
            kontrollerte felt
          </span>
        </div>
        <div>
          <AlertTriangle size={19} />
          <span>
            <strong>{products.filter(needsReview).length}</strong> trenger ny
            kontroll
          </span>
        </div>
      </div>
      <div className="toolbar">
        <div className="search-input">
          <Search size={18} />
          <input
            aria-label="Søk i produkter"
            placeholder="Søk navn, varenummer eller EAN …"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select
          label="Kategori"
          value={category}
          onChange={setCategory}
          options={[
            { value: "all", label: "Alle kategorier" },
            ...kinds.map((k) => ({ value: k, label: labels[k].short })),
          ]}
        />
        <button
          className="secondary"
          onClick={() =>
            download(
              productsCsv(products),
              "produktregister.csv",
              "text/csv;charset=utf-8",
            )
          }
        >
          <ArrowDownToLine size={17} /> Eksporter
        </button>
        <button
          className="secondary"
          onClick={() => file.current?.click()}
          disabled={importing}
        >
          <ArrowUpFromLine size={17} />
          {importing ? "Leser fil …" : "Importer CSV / Excel"}
        </button>
        <input
          ref={file}
          type="file"
          accept=".csv,.xlsx"
          hidden
          onChange={(e) => void loadFile(e.target.files?.[0])}
        />
      </div>
      <div className="list-meta">
        <span>{filtered.length} produkter</span>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />{" "}
          Vis deaktiverte
        </label>
        <button
          className="text-link"
          onClick={() =>
            download(
              "\uFEFF" +
                productColumns.join(";") +
                "\r\n" +
                productColumns
                  .map((k) =>
                    csvCell(
                      k === "category"
                        ? "insulation"
                        : k === "unit"
                          ? "pk"
                          : k === "active"
                            ? true
                            : k === "verified"
                              ? false
                              : "",
                    ),
                  )
                  .join(";"),
              "produktmal.csv",
              "text/csv;charset=utf-8",
            )
          }
        >
          Last ned importmal
        </button>
      </div>
      <div className="panel product-table">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Produkt</th>
                <th>Dimensjon / dekning</th>
                <th>Kontrollstatus</th>
                <th>Pris</th>
                <th>
                  <span className="sr-only">Handlinger</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className={!p.active ? "inactive" : ""}>
                  <td>
                    <button
                      className="table-product"
                      onClick={() => setSelected(p)}
                    >
                      <span
                        className={`mini-product ${labels[p.category].color}`}
                      >
                        <Package size={21} />
                      </span>
                      <span>
                        <strong>{p.name}</strong>
                        <small>
                          {p.manufacturer} ·{" "}
                          {p.sku
                            ? `Art. ${p.sku}`
                            : p.nobb
                              ? `NOBB ${p.nobb}`
                              : "Varenummer mangler"}
                        </small>
                      </span>
                    </button>
                  </td>
                  <td>
                    <span>
                      {[p.thickness, p.width, p.length]
                        .filter(Boolean)
                        .map((n) => format(n!))
                        .join(" × ")}
                      {p.width ? " mm" : ""}
                    </span>
                    <small>
                      {p.coverage
                        ? `${format(p.coverage)} m²/${p.unit}`
                        : p.piecesPerPack
                          ? `${p.piecesPerPack} stk/${p.unit}`
                          : "Pakningsdekning ikke oppgitt"}
                    </small>
                  </td>
                  <td>
                    <span
                      className={`badge ${!p.active || needsReview(p) || !p.verified ? "amber" : "green"}`}
                    >
                      {!p.active ? (
                        "Deaktivert"
                      ) : needsReview(p) ? (
                        "Ny kontroll"
                      ) : p.verified ? (
                        <>
                          <Check size={12} /> Kontrollerte felt
                        </>
                      ) : (
                        "Ikke verifisert"
                      )}
                    </span>
                    <small>{date(p.updatedAt)}</small>
                  </td>
                  <td>
                    {p.price === undefined ? (
                      <span className="muted">Ikke registrert</span>
                    ) : (
                      <>
                        {money(p.price)}
                        <small>Manuell / {p.unit}</small>
                      </>
                    )}
                  </td>
                  <td>
                    <button
                      className="icon-button"
                      aria-label={`Rediger ${p.name}`}
                      onClick={() => edit(p)}
                    >
                      <Pencil size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && (
          <Empty icon={<Package size={30} />} title="Ingen produkter funnet">
            Endre søket eller registrer et nytt produkt.
          </Empty>
        )}
      </div>
      <div className="notice subtle">
        <ShieldCheck size={20} />
        <p>
          <strong>Lokal administrasjon for én betrodd bruker.</strong>{" "}
          Registeret har ingen tilkobling til Montérs lager eller kasse.
          Kontrollerte felt betyr at de oppførte feltene ble kontrollert mot
          angitt kilde på datoen som vises. Deling mellom ansatte krever en
          løsning med innlogging og roller.
        </p>
      </div>
      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)} wide>
          <div className="product-detail">
            {selected.image && (
              <img
                src={safeUrl(selected.image)}
                alt={selected.name}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
            <span className="badge green">
              {labels[selected.category].short}
            </span>
            <p>{selected.description}</p>
            <dl className="detail-grid">
              {[
                ["Produsent", selected.manufacturer],
                ["Montér-artikkel", selected.monterSku || selected.sku],
                ["Produsentnummer", selected.manufacturerSku],
                ["NOBB", selected.nobb],
                ["GTIN / EAN", selected.gtin],
                [
                  "Dimensjoner",
                  [selected.thickness, selected.width, selected.length]
                    .filter(Boolean)
                    .join(" × ") + " mm",
                ],
                [
                  "Pakningsinnhold",
                  selected.piecesPerPack ? `${selected.piecesPerPack} stk` : "",
                ],
                [
                  "Dekning",
                  selected.coverage ? `${format(selected.coverage)} m²` : "",
                ],
                [
                  "Faktisk dekkbredde",
                  selected.coverWidth ? `${selected.coverWidth} mm` : "",
                ],
                ["Sist kontrollert / endret", date(selected.updatedAt)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value || "Ikke dokumentert"}</dd>
                </div>
              ))}
            </dl>
            {selected.technical && <p>{selected.technical}</p>}
            <div className="source-links">
              {[
                [selected.source, "Produktkilde"],
                [selected.monterUrl, "Oppført hos Montér"],
                [selected.datasheet, "Datablad"],
                [selected.installation, "Monteringsanvisning"],
              ].map(([url, title]) =>
                url && safeUrl(url) ? (
                  <a
                    key={title}
                    href={safeUrl(url)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {title}
                    <ExternalLink size={14} />
                  </a>
                ) : null,
              )}
            </div>
            <div className="notice">
              <CheckCircle2 size={18} />
              <div>
                <strong>
                  {selected.verified
                    ? "Felt kontrollert mot angitt kilde"
                    : "Krever produktkontroll"}
                </strong>
                <p>
                  {selected.verifiedFields?.join(", ") ||
                    "Ingen felter er spesifisert som kontrollert."}
                </p>
                <p>
                  Mangler:{" "}
                  {missingFields(selected).join(", ") ||
                    "Ingen av kontrollfeltene mangler"}
                  .
                </p>
                <p>
                  Lagerstatus og lokale priser er utilgjengelig. Nettlenker
                  krever internettilgang.
                </p>
              </div>
            </div>
            <div className="modal-actions">
              <button className="secondary" onClick={() => edit(selected)}>
                <Pencil size={16} /> Rediger
              </button>
              <button
                className="primary"
                disabled={!selected.active}
                onClick={() => {
                  onUse(selected);
                  setSelected(null);
                }}
              >
                Bruk i kalkulator
              </button>
            </div>
          </div>
        </Modal>
      )}
      {editing && (
        <Modal
          title={editing.id ? "Rediger produkt" : "Nytt produkt"}
          onClose={() => setEditing(null)}
          wide
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <div className="fields-grid">
              <div className="span-two">
                <Field
                  label="Produktnavn"
                  value={editing.name || ""}
                  onChange={(s) => set("name", s)}
                  text
                />
              </div>
              <Field
                label="Produsent"
                value={editing.manufacturer || ""}
                onChange={(s) => set("manufacturer", s)}
                text
              />
              <Select
                label="Produktkategori"
                value={editing.category}
                onChange={(s) => set("category", s)}
                options={kinds.map((k) => ({
                  value: k,
                  label: labels[k].short,
                }))}
              />
              <Select
                label="Salgsenhet"
                value={editing.unit}
                onChange={(s) => set("unit", s)}
                options={["pk", "stk", "lm", "m²", "m³"]}
              />
              {[
                ["sku", "Varenummer i materialliste"],
                ["monterSku", "Montér-artikkelnummer"],
                ["manufacturerSku", "Produsentens varenummer"],
                ["nobb", "NOBB-nummer"],
                ["gtin", "GTIN / EAN"],
                ["thickness", "Tykkelse · mm"],
                ["width", "Bredde · mm"],
                ["length", "Lengde · mm"],
                ["coverWidth", "Faktisk dekkbredde · mm"],
                ["coverLength", "Faktisk dekklengde · mm"],
                ["piecesPerPack", "Antall per salgspakke"],
                ["coverage", "Dekning per salgsenhet · m²"],
                ["price", "Pris per salgsenhet · kr"],
                ["source", "Kilde (URL eller dokumentreferanse)"],
                ["monterUrl", "Montér-produktside · URL"],
                ["datasheet", "Datablad · URL"],
                ["installation", "Monteringsanvisning · URL"],
                ["image", "Produktbilde · URL"],
                ["description", "Beskrivelse"],
                ["technical", "Tekniske merknader"],
                ["verifiedFields", "Kontrollerte felt (kommaseparert)"],
              ].map(([k, label]) => (
                <Field
                  key={k}
                  label={label}
                  value={editing[k] || ""}
                  onChange={(s) => set(k, s)}
                  text={
                    ![
                      "thickness",
                      "width",
                      "length",
                      "coverWidth",
                      "coverLength",
                      "piecesPerPack",
                      "coverage",
                      "price",
                    ].includes(k)
                  }
                />
              ))}
            </div>
            <div className="checkboxes">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={editing.active !== "false"}
                  onChange={(e) => set("active", String(e.target.checked))}
                />{" "}
                Produktet er aktivt
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={editing.verified === "true"}
                  onChange={(e) => set("verified", String(e.target.checked))}
                />{" "}
                Jeg har kontrollert de oppførte feltene mot kilden
              </label>
            </div>
            <p className="small muted">
              Oppdateringsdato settes ved lagring. La ukjente tall stå tomme.
              Produktpris er manuell; registrer bare priser du har grunnlag for.
            </p>
            {error && (
              <div role="alert" className="error">
                {error}
              </div>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setEditing(null)}
              >
                Avbryt
              </button>
              <button className="primary" type="submit">
                Lagre produkt
              </button>
            </div>
          </form>
        </Modal>
      )}
      {pending && (
        <Modal title="Kontroller importen" onClose={() => setPending(null)}>
          <p>
            {pending.length} produkter er validert. Eksisterende produkter med
            likt NOBB-nummer eller produsent + varenummer oppdateres. Øvrige
            legges til.
          </p>
          <div className="import-preview">
            {pending.slice(0, 8).map((p, i) => (
              <p key={i}>
                <Check size={15} /> {p.name}
              </p>
            ))}
            {pending.length > 8 && <p>… og {pending.length - 8} til</p>}
          </div>
          <p className="small muted">
            Filen er validert for format og tall. Du har ansvar for å
            kontrollere at kilde og verifiseringsstatus stemmer.
          </p>
          <div className="modal-actions">
            <button className="secondary" onClick={() => setPending(null)}>
              Avbryt
            </button>
            <button
              className="primary"
              onClick={() => {
                onChange(mergeProducts(products, pending));
                notify(`${pending.length} produkter importert.`);
                setPending(null);
              }}
            >
              Importer {pending.length} produkter
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
