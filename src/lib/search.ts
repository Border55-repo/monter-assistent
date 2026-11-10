import type { AppData, Kind, ProductLocation } from "./types";
import { kinds, labels, projectStatuses } from "./types";
import { guides } from "./guides";
import { customerTopics } from "./customer-help";

export const locationText = (l?: ProductLocation) =>
  l
    ? [l.area, l.rack && `Reol ${l.rack}`, l.shelf && `Fag / hylle ${l.shelf}`]
        .filter(Boolean)
        .join(" · ")
    : "Plassering ikke registrert";
export const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
const synonyms: Record<Kind, string> = {
  insulation:
    "isolere isolering glava mineralull etterisolere varme lyd garasje",
  timber: "stender stendere stenderverk reisverk svill lekt lekter trevirke",
  deck: "platting veranda uteplass terrassebord utegulv",
  sheets: "plate gips osb mdf kryssfiner spon lettvegg",
  cladding: "panel fasade dobbelfals utvendig",
  flooring: "parkett laminat gulvpakker underlag gulvvarme",
  fixings: "skrue skruer spiker innfesting bits",
};
export interface SearchHit {
  type: "product" | "calculator" | "guide" | "project" | "customer";
  id: string;
  title: string;
  detail: string;
  score: number;
}
export function searchApp(query: string, data: AppData): SearchHit[] {
  const words = normalize(query)
    .split(/[^a-z0-9]+/)
    .filter(
      (w) =>
        w &&
        ![
          "jeg",
          "skal",
          "en",
          "et",
          "til",
          "og",
          "med",
          "kunden",
          "trenger",
        ].includes(w),
    );
  if (!words.length) return [];
  const hits: SearchHit[] = [];
  const add = (
    type: SearchHit["type"],
    id: string,
    title: string,
    detail: string,
    body: string,
  ) => {
    const text = normalize(`${title} ${body}`),
      heading = normalize(title);
    const matched = words.filter((w) => text.includes(w));
    if (!matched.length) return;
    const exact = heading === normalize(query.trim());
    hits.push({
      type,
      id,
      title,
      detail,
      score:
        (matched.length / words.length) * 100 +
        (exact ? 30 : 0) +
        matched.filter((w) => heading.includes(w)).length * 5,
    });
  };
  for (const p of data.products.filter((p) => p.active)) {
    const identifiers = [p.sku, p.monterSku, p.manufacturerSku, p.nobb, p.gtin]
      .filter(Boolean)
      .join(" ");
    add(
      "product",
      p.id,
      p.name,
      `${p.manufacturer} · ${p.monterSku || p.sku || p.nobb || "Varenummer mangler"} · ${locationText(data.locations?.[p.id])}`,
      `${identifiers} ${p.description} ${p.thickness || ""} ${labels[p.category].short} ${synonyms[p.category]} ${locationText(data.locations?.[p.id])}`,
    );
    if (words.some((w) => w.length >= 4 && identifiers.split(" ").includes(w)))
      hits[hits.length - 1].score += 100;
  }
  for (const k of kinds)
    add(
      "calculator",
      k,
      labels[k].name,
      labels[k].description,
      `${labels[k].tag} ${synonyms[k]}`,
    );
  for (const g of guides)
    add(
      "guide",
      g.id,
      g.title,
      g.summary,
      `${g.category} ${g.use} ${g.mounting}`,
    );
  for (const p of data.projects)
    add(
      "project",
      p.id,
      p.name,
      projectStatuses[p.status || "calculating"],
      `${p.workNote || ""} ${p.lines.map((l) => `${l.name} ${l.sku}`).join(" ")}`,
    );
  for (const t of customerTopics)
    add(
      "customer",
      t.id,
      t.title,
      t.summary,
      `${t.words} ${t.questions.join(" ")}`,
    );
  return hits.sort(
    (a, b) => b.score - a.score || a.title.localeCompare(b.title, "nb"),
  );
}
