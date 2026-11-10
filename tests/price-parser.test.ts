import { describe, expect, it } from "vitest";
import {
  extractMonterPrice,
  convertPublishedPrice,
  readCurrentPage,
} from "../scripts/lib/monter-price.mjs";
const url = "https://www.monter.no/trelast/terrassebord/test-variant";
const expected = { monterSku: "101198715", monterUrl: url, nobb: "48982935" };
const now = "2026-11-10T09:00:00.000Z";
// Minimal representative schema from the public 10.11.2026 page, without page content.
function page(change = {}) {
  const product = {
    "@type": "Product",
    url,
    offers: [
      {
        "@type": "Offer",
        price: "19.50",
        priceCurrency: "NOK",
        itemOffered: { sku: expected.monterSku },
      },
    ],
  };
  return {
    itemNumber: expected.monterSku,
    nobbNumber: expected.nobb,
    canonicalUrl: url,
    units: {
      price: { name: "LM", multiplicationFactor: 1 / 4.8 },
      sales: { name: "STK", multiplicationFactor: 1 },
    },
    jsonLd: [product],
    trackingProduct: { price: "0.00" },
    ...change,
  };
}
const html = (p = page()) =>
  `<script>window.CURRENT_PAGE = ${JSON.stringify(p)};</script>`;
describe("Montér public price parser", () => {
  it("reads exact article and preserves price unit instead of confusing lm and stk", () => {
    const p = extractMonterPrice(html(), expected, now);
    expect(p.amount).toBe(19.5);
    expect(p.unit).toBe("lm");
    expect(p.vat).toBe("unconfirmed");
    expect(convertPublishedPrice(p, "stk")).toBe(93.6);
    expect(convertPublishedPrice(p, "pk")).toBeUndefined();
  });
  it("converts m² price to a package or plate only through this variant's explicit factors", () => {
    const packagePage = page({
      units: {
        price: { name: "M2", multiplicationFactor: 1 / 6.84 },
        sales: { name: "PAK", multiplicationFactor: 1 },
      },
    });
    packagePage.jsonLd[0].offers[0].price = "108";
    const pack = extractMonterPrice(html(packagePage), expected, now);
    expect(pack.unit).toBe("m²");
    expect(convertPublishedPrice(pack, "pk")).toBe(738.72);
    const platePage = page({
      units: {
        price: { name: "M2", multiplicationFactor: 1 / 2.88 },
        sales: { name: "STK", multiplicationFactor: 1 },
      },
    });
    platePage.jsonLd[0].offers[0].price = "61.90";
    expect(
      convertPublishedPrice(
        extractMonterPrice(html(platePage), expected, now),
        "stk",
      ),
    ).toBe(178.27);
  });
  it("recognizes Montér PLA as one plate and keeps its raw source unit", () => {
    const platePage = page({
      units: {
        price: { name: "M2", multiplicationFactor: 0.335931201 },
        sales: { name: "PLA", multiplicationFactor: 1 },
      },
    });
    platePage.jsonLd[0].offers[0].price = "375.00";
    const p = extractMonterPrice(html(platePage), expected, now);
    expect(p.unit).toBe("m²");
    expect(p.salesUnit).toBe("stk");
    expect(p.salesSourceUnit).toBe("PLA");
    expect(convertPublishedPrice(p, "stk")).toBe(1116.3);
    expect(() =>
      extractMonterPrice(
        html(
          page({
            units: {
              price: { name: "M2", multiplicationFactor: 1 },
              sales: { name: "PL", multiplicationFactor: 1 },
            },
          }),
        ),
        expected,
        now,
      ),
    ).toThrow();
  });
  it("rejects page redirects, another article, NOBB mismatch and discontinued products", () => {
    for (const change of [
      { itemNumber: "123456789" },
      { canonicalUrl: "https://www.monter.no/" },
      { nobbNumber: "12345678" },
      { discontinued: true },
    ])
      expect(() =>
        extractMonterPrice(html(page(change)), expected, now),
      ).toThrow();
  });
  it("rejects missing, ambiguous, zero or non-NOK offers and wrong variants", () => {
    for (const change of [
      { price: "0" },
      { price: "NaN" },
      { price: "-1" },
      { price: "19,50" },
      { priceCurrency: "EUR" },
      { itemOffered: { sku: "123456789" } },
      { priceValidUntil: "2026-01-01" },
    ]) {
      const p = page();
      Object.assign(p.jsonLd[0].offers[0], change);
      expect(() => extractMonterPrice(html(p), expected, now)).toThrow();
    }
    const p = page();
    p.jsonLd[0].offers.push({ ...p.jsonLd[0].offers[0], price: "20" });
    expect(() => extractMonterPrice(html(p), expected, now)).toThrow();
    expect(() =>
      extractMonterPrice(html(page({ jsonLd: [] })), expected, now),
    ).toThrow();
  });
  it("does not search related products or tracking placeholders for a fallback price", () => {
    const p = page({
      jsonLd: [],
      recommendations: { price: 50, sku: expected.monterSku },
    });
    expect(() => extractMonterPrice(html(p), expected, now)).toThrow();
    expect(() =>
      extractMonterPrice(
        html(page({ units: { price: { name: "UNKNOWN" } } })),
        expected,
        now,
      ),
    ).toThrow();
  });
  it("parses strings containing braces safely without evaluating page scripts", () => {
    expect(
      readCurrentPage(html(page({ description: 'a } \\" { b' }))).description,
    ).toBe('a } \\" { b');
    expect(() => readCurrentPage("window.CURRENT_PAGE = alert(1)")).toThrow();
    expect(() => readCurrentPage(html() + html())).toThrow();
    expect(() => readCurrentPage("window.CURRENT_PAGE = {broken}")).toThrow();
  });
});
