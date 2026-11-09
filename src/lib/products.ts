import { kinds, numberFrom, uid } from "./types";
import type { Product } from "./types";
export const productColumns = [
  "name",
  "manufacturer",
  "sku",
  "category",
  "thickness",
  "width",
  "length",
  "piecesPerPack",
  "coverage",
  "price",
  "unit",
  "description",
  "source",
  "datasheet",
  "image",
  "verified",
  "active",
  "updatedAt",
  "nobb",
  "gtin",
  "manufacturerSku",
  "monterSku",
  "monterUrl",
  "coverWidth",
  "coverLength",
  "installation",
  "technical",
  "verifiedFields",
] as const;
const numeric = [
  "thickness",
  "width",
  "length",
  "piecesPerPack",
  "coverage",
  "price",
  "coverWidth",
  "coverLength",
] as const;
export function safeUrl(raw: string): string {
  if (!raw) return "";
  try {
    const url = new URL(raw);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}
export function validateProduct(raw: Record<string, unknown>): Product {
  const get = (k: string) => String(raw[k] ?? "").trim();
  if (!get("name")) throw new Error("Produktnavn mangler.");
  if (!kinds.includes(get("category") as Product["category"]))
    throw new Error(
      "Ukjent kategori. Bruk insulation, timber, deck, sheets, cladding, flooring eller fixings.",
    );
  if (!get("unit") || !["pk", "stk", "lm", "m²", "m³"].includes(get("unit")))
    throw new Error("Enhet må være pk, stk, lm, m² eller m³.");
  const product: Product = {
    id: get("id") || uid(),
    name: get("name"),
    manufacturer: get("manufacturer"),
    sku: get("sku"),
    category: get("category") as Product["category"],
    unit: get("unit"),
    description: get("description"),
    source: get("source"),
    datasheet: get("datasheet"),
    image: get("image"),
    verified: get("verified") === "true",
    active: get("active") !== "false",
    updatedAt: get("updatedAt") || new Date().toISOString(),
  };
  for (const k of numeric) {
    const s = get(k);
    if (!s) continue;
    const n = numberFrom(s);
    if (
      !Number.isFinite(n) ||
      n < 0 ||
      (n === 0 && k !== "price") ||
      n > 1e9 ||
      (k === "piecesPerPack" && !Number.isInteger(n))
    )
      throw new Error(`${k}: ugyldig tall.`);
    product[k] = n;
  }
  if (!Number.isFinite(Date.parse(product.updatedAt)))
    throw new Error("Ugyldig oppdateringsdato.");
  for (const k of [
    "nobb",
    "gtin",
    "manufacturerSku",
    "monterSku",
    "monterUrl",
    "installation",
    "technical",
  ] as const)
    product[k] = get(k);
  product.verifiedFields = get("verifiedFields")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const k of ["datasheet", "image", "monterUrl", "installation"] as const)
    if (product[k] && !safeUrl(product[k]!))
      throw new Error(`${k}: bruk en fullstendig http- eller https-lenke.`);
  if (product.verified && !product.source)
    throw new Error("Verifiserte produkter må ha en kilde.");
  if (product.verified && !product.verifiedFields?.length)
    throw new Error(
      "Oppgi hvilke felter som er kontrollert før produktet markeres som verifisert.",
    );
  if (
    product.verified &&
    product.verifiedFields?.some(
      (k) =>
        !productColumns.includes(k as (typeof productColumns)[number]) ||
        product[k as keyof Product] === undefined ||
        product[k as keyof Product] === "",
    )
  )
    throw new Error("Kontrollerte felt må finnes og ha en registrert verdi.");
  return product;
}
export function parseCsv(text: string): Record<string, string>[] {
  const source = text
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
  const firstLine = source.split("\n")[0];
  const delimiter = firstLine.includes(";") ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false;
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '"') {
      if (quoted && source[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === delimiter && !quoted) {
      row.push(field);
      field = "";
    } else if (c === "\n" && !quoted) {
      row.push(field);
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (quoted) throw new Error("CSV-filen har et uavsluttet anførselstegn.");
  row.push(field);
  if (row.some((v) => v.trim())) rows.push(row);
  if (rows.length < 2)
    throw new Error("Filen må ha en overskriftsrad og minst ett produkt.");
  const headers = rows.shift()!.map((s) => s.trim());
  if (
    new Set(headers).size !== headers.length ||
    !headers.includes("name") ||
    !headers.includes("category")
  )
    throw new Error(
      "Overskriftene må være unike og inkludere name og category.",
    );
  return rows.map((r, i) => {
    if (r.length !== headers.length)
      throw new Error(`Rad ${i + 2} har feil antall kolonner.`);
    return Object.fromEntries(headers.map((h, j) => [h, r[j]]));
  });
}
export function csvCell(value: unknown) {
  let s = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}
export function productsCsv(products: Product[]) {
  return (
    "\uFEFF" +
    [
      productColumns.join(";"),
      ...products.map((p) =>
        productColumns.map((k) => csvCell(p[k])).join(";"),
      ),
    ].join("\r\n")
  );
}
export async function importProducts(file: File): Promise<Product[]> {
  if (file.size > 10 * 1024 * 1024)
    throw new Error("Maksimal filstørrelse er 10 MB.");
  let rows: Record<string, unknown>[];
  if (file.name.toLowerCase().endsWith(".xlsx")) {
    const { Workbook } = await import("exceljs");
    const workbook = new Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());
    const sheet = workbook.worksheets[0];
    if (!sheet || sheet.rowCount < 2)
      throw new Error("Arbeidsboken har ingen produktdata.");
    const headers: string[] = [];
    sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, n) => {
      headers[n - 1] = cell.text.trim();
    });
    if (
      new Set(headers).size !== headers.length ||
      !headers.includes("name") ||
      !headers.includes("category")
    )
      throw new Error("Ugyldige kolonneoverskrifter i Excel-filen.");
    rows = [];
    sheet.eachRow((row, n) => {
      if (n === 1) return;
      rows.push(
        Object.fromEntries(
          headers.map((h, i) => {
            const cell = row.getCell(i + 1);
            if (cell.type === 6)
              throw new Error(
                `Rad ${n}: formler er ikke tillatt i produktimport.`,
              );
            return [
              h,
              cell.value instanceof Date ? cell.value.toISOString() : cell.text,
            ];
          }),
        ),
      );
    });
  } else if (file.name.toLowerCase().endsWith(".csv"))
    rows = parseCsv(await file.text());
  else throw new Error("Velg en CSV-fil eller Excel-fil (.xlsx).");
  if (rows.length > 10000)
    throw new Error("Maksimalt 10 000 produkter per import.");
  return rows.map((row, i) => {
    try {
      return validateProduct(row);
    } catch (error) {
      throw new Error(`Rad ${i + 2}: ${(error as Error).message}`);
    }
  });
}
export function mergeProducts(existing: Product[], imported: Product[]) {
  const merged = [...existing];
  for (const p of imported) {
    const index = merged.findIndex(
      (x) =>
        (p.nobb && p.nobb === x.nobb) ||
        (p.sku &&
          x.sku === p.sku &&
          x.manufacturer.toLowerCase() === p.manufacturer.toLowerCase()),
    );
    if (index >= 0) merged[index] = { ...p, id: merged[index].id };
    else merged.push(p);
  }
  return merged;
}
