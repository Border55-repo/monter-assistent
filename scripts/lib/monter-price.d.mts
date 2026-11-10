export type MonterPriceUnit = "pk" | "stk" | "lm" | "m²" | "m³";
export type MonterSourceUnit =
  | "PAK"
  | "PK"
  | "ESKE"
  | "ESK"
  | "BOX"
  | "BOKS"
  | "STK"
  | "PLA"
  | "LM"
  | "M2"
  | "M²"
  | "M3"
  | "M³";
export interface PublishedMonterPrice {
  amount: number;
  unit: MonterPriceUnit;
  currency: "NOK";
  sourceUnit: MonterSourceUnit;
  sourceUrl: string;
  articleNumber: string;
  checkedAt: string;
  salesUnit: MonterPriceUnit;
  salesSourceUnit: MonterSourceUnit;
  priceFactor: number;
  salesFactor: number;
  kind: "published-web-price";
  vat: "unconfirmed";
}
export function readCurrentPage(html: string): Record<string, unknown>;
export function extractMonterPrice(
  html: string,
  expected: { monterSku?: string; monterUrl?: string; nobb?: string },
  checkedAt?: string,
): PublishedMonterPrice;
export function convertPublishedPrice(
  observation: PublishedMonterPrice,
  unit: string,
): number | undefined;
