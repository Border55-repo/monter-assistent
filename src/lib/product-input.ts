import type { CalcInput, Kind, Product, Values } from "./types";
export function productValues(kind: Kind, p: Product): Values {
  const v: Values = { productId: p.id, price: "" };
  const reset: Partial<Record<Kind, string[]>> = {
    insulation: ["coverage", "thickness"],
    flooring: ["coverage"],
    sheets: [
      "sheetWidth",
      "sheetLength",
      "coverWidth",
      "coverLength",
      "piecesPerPack",
    ],
    fixings: ["packSize"],
    deck: ["boardWidth", "boardThickness", "stockLengths"],
    timber: ["studThickness", "studDepth", "stockLength"],
    cladding: ["boardWidth", "coverWidth", "stockLength"],
  };
  for (const key of reset[kind] || []) v[key] = "";
  if (p.coverage) v.coverage = String(p.coverage);
  if (kind === "insulation") {
    if (p.thickness) v.thickness = String(p.thickness);
    v.insulationType =
      p.manufacturer === "Hunton" ? "Trefiberisolasjon" : "Mineralull";
  }
  if (kind === "sheets") {
    for (const [key, val] of Object.entries({
      sheetWidth: p.width,
      sheetLength: p.length,
      coverWidth: p.coverWidth,
      coverLength: p.coverLength,
      piecesPerPack: p.piecesPerPack,
    }))
      if (val) v[key] = String(val);
    v.sheetType = p.name;
  }
  if (kind === "timber") {
    if (p.width) v.studDepth = String(p.width);
    if (p.thickness) v.studThickness = String(p.thickness);
    if (p.length) v.stockLength = String(p.length / 1000);
  }
  if (kind === "deck") {
    if (p.width) v.boardWidth = String(p.width);
    if (p.thickness) v.boardThickness = String(p.thickness);
    if (p.length) v.stockLengths = String(p.length / 1000);
  }
  if (kind === "cladding") {
    if (p.width) v.boardWidth = String(p.width);
    if (p.coverWidth) v.coverWidth = String(p.coverWidth);
    if (p.length) v.stockLength = String(p.length / 1000);
  }
  if (kind === "fixings") {
    if (p.piecesPerPack) v.packSize = String(p.piecesPerPack);
    v.fastenerType = p.name;
  }
  if (p.price !== undefined) {
    let converted: number | undefined;
    if (["insulation", "flooring", "fixings"].includes(kind)) {
      if (p.unit === "pk") converted = p.price;
    } else if (kind === "sheets") {
      if (p.unit === "stk") converted = p.price;
      else if (p.unit === "pk" && p.piecesPerPack)
        converted = p.price / p.piecesPerPack;
    } else {
      if (p.unit === "lm") converted = p.price;
      else if (p.unit === "stk" && p.length)
        converted = p.price / (p.length / 1000);
    }
    if (converted !== undefined) v.price = String(converted);
  }
  return v;
}
export function resolveProductInput(
  kind: Kind,
  input: CalcInput,
  p?: Product,
): CalcInput {
  if (!p) return input;
  const fixed = productValues(kind, p);
  delete fixed.price;
  for (const key of Object.keys(fixed))
    if (fixed[key] === "") delete fixed[key];
  return { ...input, values: { ...input.values, ...fixed } };
}
