export const kinds = [
  "insulation",
  "timber",
  "deck",
  "sheets",
  "cladding",
  "flooring",
  "fixings",
] as const;
export type Kind = (typeof kinds)[number];
export type Values = Record<string, string>;
export interface Opening {
  id: string;
  name: string;
  width: string;
  height: string;
  count: string;
  x: string;
  y: string;
}
export interface Room {
  id: string;
  name: string;
  length: string;
  width: string;
  doorWidth: string;
}
export interface CalcInput {
  values: Values;
  openings: Opening[];
  rooms: Room[];
  walls?: {
    id: string;
    name: string;
    length: string;
    height: string;
    openings: Opening[];
  }[];
}
export interface Product {
  id: string;
  name: string;
  manufacturer: string;
  sku: string;
  category: Kind;
  thickness?: number;
  width?: number;
  length?: number;
  piecesPerPack?: number;
  coverage?: number;
  price?: number;
  unit: string;
  description: string;
  source: string;
  datasheet: string;
  image: string;
  verified: boolean;
  active: boolean;
  updatedAt: string;
  nobb?: string;
  gtin?: string;
  manufacturerSku?: string;
  monterSku?: string;
  monterUrl?: string;
  coverWidth?: number;
  coverLength?: number;
  installation?: string;
  technical?: string;
  verifiedFields?: string[];
}
export interface MaterialLine {
  id: string;
  name: string;
  sku: string;
  dimension: string;
  quantity: number;
  unit: string;
  price?: number;
  priceSource: string;
  note: string;
}
export interface Metric {
  label: string;
  value: number;
  unit: string;
  primary?: boolean;
}
export interface Calculation {
  metrics: Metric[];
  lines: MaterialLine[];
  assumptions: string[];
  warnings: string[];
  related: string[];
  netArea?: number;
}
export interface SavedCalculation {
  id: string;
  kind: Kind;
  input: CalcInput;
  result: Calculation;
  createdAt: string;
}
export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  calculations: SavedCalculation[];
  lines: MaterialLine[];
  status?: ProjectStatus;
  workNote?: string;
}
export const projectStatuses = {
  calculating: "Under beregning",
  clarify: "Må avklares",
  picking: "Klar til plukk",
  done: "Ferdig",
} as const;
export type ProjectStatus = keyof typeof projectStatuses;
export interface ProductLocation {
  area: string;
  rack: string;
  shelf: string;
  checkedAt: string;
}
export interface AppData {
  schemaVersion: 1;
  products: Product[];
  projects: Project[];
  drafts: Partial<Record<Kind, CalcInput>>;
  favorites: Kind[];
  recent: { kind: Kind; date: string }[];
  theme: string;
  activeProjectId: string;
  locations?: Record<string, ProductLocation>;
  catalogRevision?: number;
}
export const uid = () => crypto.randomUUID();
export const format = (n: number, digits = 2) =>
  new Intl.NumberFormat("nb-NO", { maximumFractionDigits: digits }).format(n);
export const money = (n: number) =>
  new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    maximumFractionDigits: 2,
  }).format(n);
export const date = (s: string) =>
  new Intl.DateTimeFormat("nb-NO", {
    dateStyle: "medium",
    timeZone: "Europe/Oslo",
  }).format(new Date(s));
export const numberFrom = (s: string) => Number(s.replace(",", ".").trim());
export const labels: Record<
  Kind,
  {
    name: string;
    short: string;
    description: string;
    tag: string;
    color: string;
  }
> = {
  insulation: {
    name: "GLAVA & isolasjon",
    short: "Isolasjon",
    description: "Fra veggmål til riktig antall pakker.",
    tag: "Vegg · tak · gulv",
    color: "yellow",
  },
  timber: {
    name: "Trelast & stenderverk",
    short: "Trelast",
    description: "Stendere, sviller og handelslengder.",
    tag: "Konstruksjonsvirke",
    color: "orange",
  },
  deck: {
    name: "Terrasse",
    short: "Terrasse",
    description: "Bord, bjelker og skruer til uteplassen.",
    tag: "Bord · bjelker · skruer",
    color: "green",
  },
  sheets: {
    name: "Bygningsplater",
    short: "Plater",
    description: "Hele plater med faktisk dekkende mål.",
    tag: "OSB · gips · MDF",
    color: "blue",
  },
  cladding: {
    name: "Kledning",
    short: "Kledning",
    description: "Dekkbredde, bord og festemidler.",
    tag: "Utvendig · innvendig",
    color: "pink",
  },
  flooring: {
    name: "Gulv",
    short: "Gulv",
    description: "Flere rom, gulvpakker og tilbehør.",
    tag: "Parkett · laminat",
    color: "purple",
  },
  fixings: {
    name: "Festemidler",
    short: "Festemidler",
    description: "Beregn forbruk og hele pakninger.",
    tag: "Skruer · spiker",
    color: "gray",
  },
};
export function defaultInput(kind: Kind): CalcInput {
  const common = {
    length: "8",
    width: "2,4",
    count: "1",
    waste: "0",
    price: "",
    productId: "",
    construction: "Vegg",
    direction: "length",
    measureMode: "dimensions",
    directArea: "",
  };
  const extra: Record<Kind, Values> = {
    insulation: {
      coverage: "",
      thickness: "100",
      cc: "600",
      insulationType: "Glassull",
      studWidth: "48",
    },
    timber: {
      length: "5",
      cc: "600",
      dimension: "48 × 98",
      studThickness: "48",
      studDepth: "98",
      stockLength: "4,8",
      bottom: "1",
      top: "1",
      corners: "0",
      openingExtras: "2",
      lintel: "0",
      extraLm: "0",
    },
    deck: {
      length: "6",
      width: "4",
      boardWidth: "120",
      boardThickness: "28",
      gap: "5",
      stockLengths: "4,8",
      joistSpacing: "600",
      fixingsPerCross: "2",
      screwPack: "",
      screwPrice: "",
      material: "Impregnert treverk",
      fixingMethod: "top",
    },
    sheets: {
      sheetLength: "2400",
      sheetWidth: "1200",
      coverLength: "2400",
      coverWidth: "1200",
      piecesPerPack: "1",
      sheetType: "OSB",
      direction: "standing",
    },
    cladding: {
      boardWidth: "148",
      coverWidth: "",
      stockLength: "4,8",
      direction: "standing",
      fixingSpacing: "600",
      fixingsPerCross: "2",
      profile: "",
      claddingSystem: "single",
      underWidth: "148",
      overlap: "25",
    },
    flooring: {
      coverage: "",
      pattern: "Rett legging",
      underlay: "no",
      underlayCoverage: "",
      barrierCoverage: "",
      barrier: "no",
      trimLength: "2,4",
      floorType: "Parkett",
    },
    fixings: {
      area: "",
      rate: "",
      packSize: "",
      patternSource: "",
      substrate: "Tre",
      fastenerType: "Skruer",
      method: "area",
      crossings: "",
      perCross: "2",
    },
  };
  return {
    values: { ...common, ...extra[kind] },
    openings: [],
    rooms: [
      { id: uid(), name: "Rom 1", length: "5", width: "4", doorWidth: "0,9" },
    ],
  };
}
