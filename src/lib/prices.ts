import type { Product } from "./types";
export interface WebPrice {
  productId: string;
  articleNumber: string;
  sourceUrl: string;
  checkedAt: string;
  amount: number;
  unit: string;
  salesAmount: number;
  salesUnit: string;
  currency: "NOK";
  status: "ok";
  vat: "unconfirmed";
}
export interface PriceFeed {
  version: 1;
  checkedAt: string;
  entries: unknown[];
}
export function validPriceFeed(raw: unknown): PriceFeed | null {
  if (!raw || typeof raw !== "object") return null;
  const f = raw as PriceFeed;
  return f.version === 1 &&
    Number.isFinite(Date.parse(f.checkedAt)) &&
    Array.isArray(f.entries) &&
    f.entries.length <= 10000
    ? f
    : null;
}
export function webPriceFor(
  product: Product,
  feed: PriceFeed | null,
  now = Date.now(),
): WebPrice | undefined {
  const q = feed?.entries.find(
    (e) =>
      e && typeof e === "object" && (e as WebPrice).productId === product.id,
  ) as WebPrice | undefined;
  if (
    !q ||
    q.status !== "ok" ||
    q.articleNumber !== product.monterSku ||
    q.sourceUrl !== product.monterUrl ||
    q.salesUnit !== product.unit ||
    q.currency !== "NOK" ||
    ![q.amount, q.salesAmount].every(
      (n) => Number.isFinite(n) && n > 0 && n <= 1e9,
    ) ||
    !["pk", "stk", "lm", "m²", "m³"].includes(q.unit)
  )
    return;
  const age = now - Date.parse(q.checkedAt);
  if (!Number.isFinite(age) || age < -300000 || age > 12 * 3600000) return;
  return q;
}
export const priceTime = (s: string) =>
  new Intl.DateTimeFormat("nb-NO", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Oslo",
  }).format(new Date(s));
