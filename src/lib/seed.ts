import type { Product } from "./types";
const checked = "2026-11-09T22:00:00.000Z";
const plateSource = "https://www.glava.no/produkter/glava-proff-34-plate";
const rollSource = "https://www.glava.no/produkter/glava-proff-34-rull";
const base = {
  unit: "pk",
  description: "",
  source: "",
  datasheet: "",
  image: "",
  verified: true,
  active: true,
  updatedAt: checked,
  sku: "",
};
const plateVariants = [
  [50, 560, 20, 13.44, "50673961", "382050", "101186783"],
  [70, 570, 14, 9.58, "50673976", "382070", "101186784"],
  [100, 570, 10, 6.84, "50673624", "382100", "101186758"],
  [150, 570, 6, 4.1, "50673632", "382150", "101186759"],
  [200, 570, 5, 3.42, "50673658", "382200", ""],
  [250, 570, 4, 2.74, "50673677", "382250", "101186761"],
] as const;
export const seedProducts: Product[] = [
  ...plateVariants.map(
    ([
      thickness,
      width,
      piecesPerPack,
      coverage,
      nobb,
      manufacturerSku,
      monterSku,
    ]): Product => ({
      ...base,
      id: `glava-${nobb}`,
      name: `GLAVA Proff 34 Plate ${thickness} mm`,
      manufacturer: "GLAVA",
      category: "insulation",
      thickness,
      width,
      length: 1200,
      piecesPerPack,
      coverage,
      nobb,
      manufacturerSku,
      monterSku,
      sku: monterSku,
      source: plateSource,
      datasheet: `${plateSource}/fdv-glava-proff-34-plate.pdf`,
      installation: `${plateSource}/isolering-med-glava-glassull.pdf`,
      monterUrl: monterSku
        ? `https://www.monter.no/byggevarer/isolasjon/isolasjonsplater/isolasjon-proff-34-plate-${thickness}x${width}x1200-mm-${piecesPerPack}-stk`
        : "",
      technical:
        "Nominell produktbredde. Kontroller tilpasning og aktuell konstruksjon i produsentens anvisning.",
      description:
        "Glassullplate. Produktmål og pakningsdekning kontrollert i produsentens varianttabell. Pris og lokal lagerstatus er ikke tilgjengelig.",
      verifiedFields: [
        "name",
        "manufacturer",
        "thickness",
        "width",
        "length",
        "piecesPerPack",
        "coverage",
        "nobb",
        "manufacturerSku",
        ...(monterSku ? ["monterSku", "monterUrl"] : []),
      ],
    }),
  ),
  {
    ...base,
    id: "glava-50673613",
    name: "GLAVA Proff 34 Rull 100 mm",
    manufacturer: "GLAVA",
    category: "insulation",
    thickness: 100,
    width: 570,
    length: 4700,
    piecesPerPack: 2,
    coverage: 5.36,
    nobb: "50673613",
    manufacturerSku: "380100",
    source: rollSource,
    datasheet: `${rollSource}/fdv-glava-proff-34-rull.pdf`,
    description:
      "Glassull på rull. Pakningsdekning fra produsentens tabell. Montér-artikkelnummer og lokal tilgjengelighet er ikke kontrollert.",
    verifiedFields: [
      "name",
      "manufacturer",
      "thickness",
      "width",
      "length",
      "piecesPerPack",
      "coverage",
      "nobb",
      "manufacturerSku",
    ],
  },
  {
    ...base,
    id: "hunton-55406733",
    name: "Hunton Nativo Trefiberisolasjon Plate 100 mm",
    manufacturer: "Hunton",
    category: "insulation",
    thickness: 100,
    width: 565,
    length: 1220,
    piecesPerPack: 4,
    coverage: 2.76,
    nobb: "55406733",
    manufacturerSku: "9901",
    source:
      "https://www.hunton.no/produkter/vegg/hunton-nativo_trefiberisolasjon-plater/",
    description:
      "Platevarianten for trestendere. Ikke stålstendervarianten. Pakningsdata er kontrollert hos produsenten.",
    verifiedFields: [
      "name",
      "manufacturer",
      "thickness",
      "width",
      "length",
      "piecesPerPack",
      "coverage",
      "nobb",
      "manufacturerSku",
    ],
  },
  {
    ...base,
    id: "norgips-10397701",
    name: "Norgips Standard 12,5 × 1200 × 2400 mm",
    manufacturer: "Norgips",
    category: "sheets",
    thickness: 12.5,
    width: 1200,
    length: 2400,
    coverWidth: 1200,
    coverLength: 2400,
    coverage: 2.88,
    piecesPerPack: 1,
    unit: "stk",
    sku: "101100133",
    monterSku: "101100133",
    manufacturerSku: "636334",
    nobb: "10397701",
    source: "https://norgips.no/produkter/gipsplater/gipsplate-standard-13",
    monterUrl:
      "https://www.monter.no/byggevarer/bygningsplater/gips/gipsplate-standard-125-x-1200-x-2400-mm",
    installation:
      "https://media.norgips.no/assets/planningpdfs/NORGIPS-Montasjeh%C3%A5ndbok_NO_H241125.pdf",
    description:
      "Kartongkledd standardgips. Montér oppgir salg per stykk med 2,88 m² per plate. Én salgsenhet er én plate, ikke en produsentpall.",
    verifiedFields: [
      "name",
      "manufacturer",
      "thickness",
      "width",
      "length",
      "coverWidth",
      "coverLength",
      "coverage",
      "piecesPerPack",
      "nobb",
      "manufacturerSku",
      "monterSku",
    ],
  },
  {
    ...base,
    id: "essve-43845037",
    name: "ESSVE Terrasseskrue Classic 4,2 × 55 A2",
    manufacturer: "ESSVE",
    category: "fixings",
    width: 4.2,
    length: 55,
    piecesPerPack: 250,
    nobb: "43845037",
    gtin: "7317761124429",
    manufacturerSku: "640555",
    source:
      "https://essve.com/no/produkter/bygg-og-treskrue/terrasseskrue/toppskruet-terrasseskrue/classic/terrasseskrue-classic-rustfritt-stal-a2/terrasseskrue-classic-4-2x55-a2-250-2",
    technical:
      "Rustfritt stål A2, TX20. Skruekvalitet må velges etter miljø og produktanvisning; A2 er ikke et universelt valg.",
    description:
      "Pakningsinnhold kontrollert hos ESSVE. Forbruk og egnethet til den aktuelle terrassen må dokumenteres separat.",
    verifiedFields: [
      "name",
      "manufacturer",
      "width",
      "length",
      "piecesPerPack",
      "nobb",
      "gtin",
      "manufacturerSku",
    ],
  },
  {
    ...base,
    id: "sca-48982935",
    name: "SCA Wood terrassebord impregnert furu 28 × 120 × 4800 mm",
    manufacturer: "SCA Wood",
    category: "deck",
    width: 120,
    thickness: 28,
    length: 4800,
    unit: "stk",
    nobb: "48982935",
    monterSku: "101198715",
    sku: "101198715",
    source:
      "https://www.monter.no/trelast/terrassebord/impregnert-terrassebord/terrassebord-impregnert-furu-28x120x4800-mm",
    monterUrl:
      "https://www.monter.no/trelast/terrassebord/impregnert-terrassebord/terrassebord-impregnert-furu-28x120x4800-mm",
    description:
      "Oppført på monter.no med 4,80 lm per stykk og minste bestillingsvolum 10 lm. Kun denne lengdevarianten er koblet til artikkelnummeret. Ingen lokal lagerstatus eller pris er hentet inn.",
    verifiedFields: [
      "name",
      "manufacturer",
      "width",
      "thickness",
      "length",
      "nobb",
      "monterSku",
    ],
  },
];
export function missingFields(p: Product): string[] {
  const fields: [unknown, string][] = [
    [p.price, "Pris"],
    [p.monterSku, "Montér-artikkelnummer"],
    [p.gtin, "GTIN/EAN"],
    [p.datasheet, "Direkte datablad"],
    [p.installation, "Monteringslenke"],
  ];
  if (p.category === "insulation" || p.category === "flooring")
    fields.push(
      [p.coverage, "Pakningsdekning"],
      [p.piecesPerPack, "Pakningsinnhold"],
    );
  if (p.category === "cladding") fields.push([p.coverWidth, "Dekkbredde"]);
  return fields
    .filter(([v]) => v === undefined || v === "")
    .map(([, label]) => label);
}
export function needsReview(p: Product, now = Date.now()) {
  return now - new Date(p.updatedAt).getTime() > 90 * 86400000;
}
