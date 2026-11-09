import type { Project } from "./types";
import { date, format, labels, money } from "./types";
import { projectTotal } from "./calculators";
export function download(content: BlobPart, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
export function projectText(project: Project) {
  return [
    `MATERIALLISTE · ${project.name}`,
    `Oppdatert: ${date(project.updatedAt)}`,
    "",
    ...project.lines.map(
      (l) =>
        `${format(l.quantity)} ${l.unit} · ${l.name}${l.dimension ? ` · ${l.dimension}` : ""}${l.sku ? ` · Varenr. ${l.sku}` : ""}${l.price === undefined ? " · Pris mangler" : ` · ${money(l.price)}/${l.unit} · ${money(l.price * l.quantity)} (${l.priceSource})`}${l.note ? `\n  ${l.note}` : ""}`,
    ),
    "",
    `Sum registrerte priser: ${money(projectTotal(project.lines))}`,
    `${project.lines.filter((l) => l.price === undefined).length} linje(r) uten pris. Mva-status må avklares.`,
    "",
    ...project.calculations.flatMap((c) => [
      `${labels[c.kind].name} · ${date(c.createdAt)}`,
      ...c.result.assumptions,
      ...c.result.warnings,
    ]),
    "",
    "Veiledende mengder. Kontroller mot produktanvisninger. Lokalt ansattverktøy, ikke offisielt godkjent av Montér.",
  ].join("\n");
}
export async function createProjectPdf(project: Project) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF();
  let y = 22;
  const pageHeight = 276;
  const addText = (s: string, size = 10, bold = false, color = "#26372f") => {
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(size);
    pdf.setTextColor(color);
    const lines = pdf.splitTextToSize(
      s
        .replace(/×/g, "x")
        .replace(/·/g, " | ")
        .replace(/−/g, "-")
        .replace(/→/g, "->"),
      170,
    ) as string[];
    for (const line of lines) {
      if (y + size * 0.43 > pageHeight) {
        pdf.addPage();
        y = 20;
      }
      pdf.text(line, 20, y);
      y += size * 0.43 + 1.5;
    }
    y += 2;
  };
  addText("MONTÉR ASSISTENT", 11, true);
  addText(project.name, 22, true);
  addText(`Materialliste | Oppdatert ${date(project.updatedAt)}`, 10);
  y += 5;
  for (const l of project.lines) {
    if (y > 245) {
      pdf.addPage();
      y = 20;
    }
    addText(`${format(l.quantity)} ${l.unit}   ${l.name}`, 11, true);
    if (l.dimension || l.sku)
      addText(
        [l.dimension, l.sku ? `Varenr. ${l.sku}` : ""]
          .filter(Boolean)
          .join(" | "),
        9,
      );
    addText(
      l.price === undefined
        ? "Pris ikke registrert"
        : `${money(l.price)} / ${l.unit} = ${money(l.price * l.quantity)} | ${l.priceSource}`,
      9,
    );
    if (l.note) addText(l.note, 9);
    y += 2;
  }
  y += 5;
  addText(
    `Sum registrerte priser: ${money(projectTotal(project.lines))}`,
    14,
    true,
  );
  addText(
    `${project.lines.filter((l) => l.price === undefined).length} linje(r) uten pris. Priser i NOK. Mva-status må avklares.`,
    9,
  );
  for (const c of project.calculations) {
    y += 7;
    addText(`${labels[c.kind].name} | ${date(c.createdAt)}`, 12, true);
    for (const a of c.result.assumptions) addText(a, 9);
    for (const w of c.result.warnings) addText(w, 9);
  }
  y += 5;
  addText(
    "Veiledende mengdeberegning. Kontroller mot produktanvisninger. Lokalt ansattverktøy, ikke offisielt godkjent av Montér.",
    9,
  );
  const pages = pdf.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor("#657369");
    pdf.text(`Montér Assistent | ${i} / ${pages}`, 20, 289);
  }
  return pdf;
}
export async function exportPdf(project: Project) {
  const pdf = await createProjectPdf(project);
  pdf.save(
    `${project.name.replace(/[^a-zA-Z0-9æøåÆØÅ -]/g, "").slice(0, 80) || "materialliste"}.pdf`,
  );
}
