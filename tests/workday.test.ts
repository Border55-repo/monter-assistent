import { describe, it, expect } from "vitest";
import { emptyData, upgradeCatalog } from "../src/lib/storage";
import { seedProducts, catalogAdditions } from "../src/lib/seed";
import { searchApp } from "../src/lib/search";
import { validateBackup } from "../src/lib/backup";
import { calculate, surface } from "../src/lib/calculators";
import { defaultInput } from "../src/lib/types";
import { webPriceFor, validPriceFeed } from "../src/lib/prices";
import targets from "../scripts/price-targets.json";

describe("Arbeidsflyt, søk og oppdatering", () => {
  it("finner nøyaktige artikkelnumre først og kundeord på tvers av kategorier", () => {
    const data = emptyData();
    expect(searchApp("101186758", data)[0].id).toBe("glava-50673624");
    expect(
      searchApp("isolere garasje", data).some(
        (h) => h.type === "customer" && h.id === "isolere",
      ),
    ).toBe(true);
    expect(
      searchApp("platting", data).some(
        (h) => h.type === "calculator" && h.id === "deck",
      ),
    ).toBe(true);
    expect(searchApp("", data)).toEqual([]);
  });
  it("søker i lokale plasseringer og arbeidsnotater, utelater deaktiverte produkter", () => {
    const data = emptyData(),
      p = data.products[0];
    data.locations = {
      [p.id]: {
        area: "Utehallen",
        rack: "B12",
        shelf: "3",
        checkedAt: new Date().toISOString(),
      },
    };
    data.projects = [
      {
        id: "p",
        name: "Vegg",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lines: [],
        calculations: [],
        status: "clarify",
        workNote: "kontroller spennvidde",
      },
    ];
    expect(searchApp("B12", data).find((h) => h.id === p.id)?.detail).toContain(
      "Utehallen",
    );
    expect(
      searchApp("spennvidde", data).find((h) => h.id === "p")?.detail,
    ).toBe("Må avklares");
    p.active = false;
    expect(
      searchApp(p.name, data).some(
        (h) => h.type === "product" && h.id === p.id,
      ),
    ).toBe(false);
  });
  it("legger til nye kildevarer uten å overskrive brukerens pris, deaktivering eller prosjekter", () => {
    const data = emptyData();
    delete data.catalogRevision;
    const custom = {
      ...catalogAdditions[0],
      id: "local-id",
      price: 123,
      active: false,
    };
    data.products = [
      ...seedProducts.filter(
        (p) => !catalogAdditions.some((c) => c.id === p.id),
      ),
      custom,
    ];
    data.locations = {
      "local-id": {
        area: "Hall",
        rack: "A",
        shelf: "1",
        checkedAt: new Date().toISOString(),
      },
    };
    const migrated = upgradeCatalog(data);
    expect(migrated.products).toHaveLength(seedProducts.length);
    expect(migrated.products.find((p) => p.id === "local-id")).toEqual(custom);
    expect(migrated.locations).toEqual(data.locations);
    expect(upgradeCatalog(migrated)).toBe(migrated);
  });
  it("validerer nye valgfrie backupfelter og godtar gamle sikkerhetskopier", () => {
    const data = emptyData();
    delete data.locations;
    delete data.catalogRevision;
    expect(validateBackup(data)).toBe(data);
    expect(() =>
      validateBackup({
        ...data,
        locations: { x: { area: 12, rack: "A", shelf: "2", checkedAt: "bad" } },
      }),
    ).toThrow();
    expect(() =>
      validateBackup({
        ...data,
        projects: [
          {
            id: "a",
            name: "a",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lines: [],
            calculations: [],
            status: "unknown",
          },
        ],
      }),
    ).toThrow();
  });
  it("alle botmål matcher samme registrerte variant og salgsenhet", () => {
    expect(targets.length).toBeGreaterThan(20);
    for (const t of targets) {
      const p = seedProducts.find((p) => p.id === t.id)!;
      expect(p).toBeDefined();
      expect([p.monterSku, p.monterUrl, p.nobb, p.unit]).toEqual([
        t.monterSku,
        t.monterUrl,
        t.nobb,
        t.unit,
      ]);
    }
  });
});
describe("Flere vegger", () => {
  const walls = () => [
    {
      id: "1",
      name: "Langvegg",
      length: "5",
      height: "2,4",
      openings: [
        {
          id: "door",
          name: "Dør",
          width: "1",
          height: "2",
          count: "1",
          x: "0",
          y: "0",
        },
      ],
    },
    { id: "2", name: "Kortvegg", length: "4", height: "2,4", openings: [] },
  ];
  it("summerer egne mål og åpninger, og runder isolasjonspakker én gang", () => {
    const input = defaultInput("insulation");
    input.values = { ...input.values, surfaceMode: "walls", coverage: "10" };
    input.walls = walls();
    expect(surface(input).net).toBeCloseTo(19.6);
    const r = calculate("insulation", input);
    expect(r.lines[0].quantity).toBe(2);
    expect(r.assumptions.join(" ")).toContain("Langvegg");
  });
  it("beregner stendere og handelslengder per vegg før summering", () => {
    const input = defaultInput("timber");
    input.values.surfaceMode = "walls";
    input.walls = walls();
    const combined = calculate("timber", input);
    const individual = input.walls.map((w) =>
      calculate("timber", {
        ...input,
        walls: undefined,
        values: {
          ...input.values,
          surfaceMode: "single",
          length: w.length,
          width: w.height,
          count: "1",
        },
        openings: w.openings,
      }),
    );
    expect(combined.lines[0].quantity).toBe(
      individual.reduce((n, r) => n + r.lines[0].quantity, 0),
    );
    expect(
      combined.metrics.filter((m) => m.label.startsWith("Kappmål")),
    ).toHaveLength(2);
  });
  it("validerer åpninger mot riktig vegg og beholder alle vegger i backup", () => {
    const input = defaultInput("sheets");
    input.values.surfaceMode = "walls";
    input.walls = walls();
    input.walls[0].openings[0].x = "5";
    expect(() => calculate("sheets", input)).toThrow("Langvegg");
    input.walls[0].openings[0].x = "0";
    const data = emptyData();
    data.drafts.sheets = input;
    expect(
      validateBackup(JSON.parse(JSON.stringify(data))).drafts.sheets?.walls,
    ).toEqual(input.walls);
    expect(() => calculate("sheets", { ...input, walls: [] })).toThrow();
  });
});
describe("Ferske nettoppslag", () => {
  it("nekter feil variant, salgsenhet, gammel pris, feil valuta og nullpris", () => {
    const p = seedProducts.find((p) => p.id === "glava-50673624")!;
    const now = Date.now();
    const quote = {
      productId: p.id,
      articleNumber: p.monterSku,
      sourceUrl: p.monterUrl,
      checkedAt: new Date(now).toISOString(),
      status: "ok",
      amount: 108,
      unit: "m²",
      salesAmount: 738.72,
      salesUnit: "pk",
      currency: "NOK",
      vat: "unconfirmed",
    };
    const feed = {
      version: 1 as const,
      checkedAt: quote.checkedAt,
      entries: [quote],
    };
    expect(webPriceFor(p, feed, now)?.salesAmount).toBe(738.72);
    for (const change of [
      { checkedAt: new Date(now - 13 * 3600000).toISOString() },
      { articleNumber: "wrong" },
      { salesUnit: "stk" },
      { currency: "EUR" },
      { amount: 0 },
      { status: "unavailable" },
    ])
      expect(
        webPriceFor(p, { ...feed, entries: [{ ...quote, ...change }] }, now),
      ).toBeUndefined();
    expect(validPriceFeed({})).toBeNull();
  });
});
