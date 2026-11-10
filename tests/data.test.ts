import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { openDB } from "idb";
import {
  parseCsv,
  productsCsv,
  validateProduct,
  safeUrl,
  mergeProducts,
  importProducts,
} from "../src/lib/products";
import { emptyData, loadData, saveData } from "../src/lib/storage";
import { seedProducts, missingFields } from "../src/lib/seed";
import { validateBackup } from "../src/lib/backup";
import { createProjectPdf, projectText } from "../src/lib/export";
import { calculate, stockPlan } from "../src/lib/calculators";
import { defaultInput } from "../src/lib/types";
import type { Project } from "../src/lib/types";
import { productValues, resolveProductInput } from "../src/lib/product-input";
import { quickCalculate } from "../src/lib/quick";
describe("Produktimport, eksport og datakontroll", () => {
  it("alle medfølgende produktdata valideres uten oppdiktede priser", () => {
    for (const p of seedProducts) {
      expect(
        validateProduct(p as unknown as Record<string, unknown>).name,
      ).toBe(p.name);
      expect(p.price).toBeUndefined();
    }
  });
  it("CSV-rundtur beholder felt, komma, anførselstegn, linjeskift og norske tegn", () => {
    const p = {
      ...seedProducts[0],
      name: 'Produkt; "norsk" æøå',
      description: "Første linje\nAndre linje",
      price: 123.45,
    };
    const [row] = parseCsv(productsCsv([p]));
    const parsed = validateProduct(row);
    expect(parsed.name).toBe(p.name);
    expect(parsed.description).toBe(p.description);
    expect(parsed.price).toBe(123.45);
    expect(parsed.verifiedFields).toEqual(p.verifiedFields);
  });
  it("støtter kommaseparert CSV med desimaler i anførselstegn", () =>
    expect(
      parseCsv('name,category,coverage\nTest,insulation,"6,84"')[0].coverage,
    ).toBe("6,84"));
  it("avviser ufullstendig CSV uten delvis import", () => {
    expect(() => parseCsv('name;category\n"Test;insulation')).toThrow();
    expect(() => parseCsv("name;category\nTest;insulation;ekstra")).toThrow();
    expect(() => parseCsv("name;name\nA;B")).toThrow();
  });
  it("beskytter CSV mot regnearkformler", () => {
    expect(
      productsCsv([{ ...seedProducts[0], name: '=HYPERLINK("bad")' }]),
    ).toContain("'=HYPERLINK");
  });
  it("validerer tall, enhet, kilde og sikre lenker", () => {
    const p = seedProducts[0];
    for (const change of [
      { price: "-1" },
      { coverage: "abc" },
      { piecesPerPack: "1.5" },
      { unit: "fake" },
      { source: "", verified: true },
      { datasheet: "javascript:alert(1)" },
      { updatedAt: "invalid" },
    ])
      expect(() => validateProduct({ ...p, ...change })).toThrow();
    expect(safeUrl("javascript:alert(1)")).toBe("");
    expect(safeUrl("https://glava.no/test")).toBe("https://glava.no/test");
  });
  it("viser manglende data uten å fylle dem inn", () => {
    expect(missingFields(seedProducts[0])).toContain("Pris");
    expect(missingFields(seedProducts[0])).toContain("GTIN/EAN");
  });
  it("oppdaterer samme NOBB og beholder lokal id", () => {
    const p = seedProducts[0];
    const merged = mergeProducts([p], [{ ...p, id: "new", name: "Oppdatert" }]);
    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe(p.id);
    expect(merged[0].name).toBe("Oppdatert");
  });
  it("krever ny manuell pakningsdekning når et annet produkt mangler den", () => {
    const p = { ...seedProducts[0], coverage: undefined };
    const fields = productValues("insulation", p);
    expect(fields.coverage).toBe("");
    const i = defaultInput("insulation");
    i.values = { ...i.values, ...fields };
    expect(() => calculate("insulation", i, [p])).toThrow("Dekning");
    i.values.coverage = "3,2";
    expect(resolveProductInput("insulation", i, p).values.coverage).toBe("3,2");
  });
  it("konverterer salgspris fra stykk til lm og pakke til plate", () => {
    expect(
      productValues("deck", { ...seedProducts.find(p=>p.id==="sca-48982935")!, price: 96 }).price,
    ).toBe("20");
    expect(
      productValues("sheets", {
        ...seedProducts[8],
        price: 200,
        unit: "pk",
        piecesPerPack: 2,
      }).price,
    ).toBe("100");
  });
  it("importerer faktiske Excel-celler og avviser formler", async () => {
    const { Workbook } = await import("exceljs");
    const wb = new Workbook();
    const sheet = wb.addWorksheet("Produkter");
    sheet.addRow(["name", "category", "unit", "coverage"]);
    sheet.addRow(["Manuelt testprodukt", "insulation", "pk", 6.84]);
    const bytes = await wb.xlsx.writeBuffer();
    const products = await importProducts(
      new File([new Uint8Array(bytes)], "test.xlsx"),
    );
    expect(products[0].coverage).toBe(6.84);
    sheet.getCell("D2").value = { formula: "3*2", result: 6 };
    const invalid = await wb.xlsx.writeBuffer();
    await expect(
      importProducts(new File([new Uint8Array(invalid)], "bad.xlsx")),
    ).rejects.toThrow("formler");
  });
});
describe("Versjonert lokal lagring og sikkerhetskopi", () => {
  it("lagrer, oppdaterer og gjenåpner hele datasettet uten tap", async () => {
    const data = emptyData();
    data.drafts.insulation = defaultInput("insulation");
    data.drafts.insulation.values.length = "42";
    await saveData(data);
    expect((await loadData()).drafts.insulation?.values.length).toBe("42");
    const newer = structuredClone(data);
    newer.theme = "dark";
    await Promise.all([saveData(data), saveData(newer)]);
    const loaded = await loadData();
    expect(loaded.theme).toBe("dark");
    expect(loaded.products).toHaveLength(seedProducts.length);
    expect(loaded.drafts.insulation?.values.length).toBe("42");
  });
  it("beholder objektlageret ved samme databaseversjon", async () => {
    const database = await openDB("monter-assistent", 1);
    expect(database.objectStoreNames.contains("app")).toBe(true);
    expect((await database.get("app", "data")).theme).toBe("dark");
  });
  it("validerer sikkerhetskopi og avviser feil struktur / ugyldige tall", () => {
    const d = emptyData();
    expect(validateBackup(JSON.parse(JSON.stringify(d))).products).toHaveLength(
      seedProducts.length,
    );
    expect(() => validateBackup({ ...d, schemaVersion: 2 })).toThrow();
    expect(() => validateBackup({ ...d, projects: [{}] })).toThrow();
    expect(() => validateBackup({ ...d, favorites: ["invalid"] })).toThrow();
    expect(() =>
      validateBackup({
        ...d,
        drafts: { insulation: { values: {}, rooms: [], openings: [{}] } },
      }),
    ).toThrow();
  });
});
describe("PDF, norsk tekst og store materiallister", () => {
  const project: Project = {
    id: "p",
    name: "Isolering av garasje – ÆØÅ",
    createdAt: "2026-11-09T12:00:00Z",
    updatedAt: "2026-11-09T12:00:00Z",
    calculations: [],
    lines: Array.from({ length: 65 }, (_, i) => ({
      id: String(i),
      name: "Bygningsplate med en svært lang beskrivelse som skal brytes på flere linjer uten å gå utenfor arket",
      dimension: "12,5 × 1200 × 2400 mm",
      quantity: 10,
      unit: "stk",
      price: i % 2 ? 100 : undefined,
      priceSource: "Manuelt registrert",
      sku: "101100133",
      note: "Produktets bruksområde og monteringsanvisning må kontrolleres før bestilling.",
    })),
  };
  it("skriver tekst med mengde, enhet, prisstatus og varenummer", () => {
    const text = projectText(project);
    expect(text).toContain("ÆØÅ");
    expect(text).toContain("Varenr. 101100133");
    expect(text).toContain("Pris mangler");
    expect(text).toContain("Manuelt registrert");
  });
  it("genererer en ekte PDF over flere sider med A4-format", async () => {
    const pdf = await createProjectPdf(project);
    expect(pdf.getNumberOfPages()).toBeGreaterThan(4);
    const content = pdf.output();
    expect(content.startsWith("%PDF-")).toBe(true);
    expect(content).toContain(
      "/MediaBox [0 0 595.2799999999999727 841.8899999999999864]",
    );
    expect(content).toContain("%%EOF");
  });
});
describe("Hurtigverktøy", () => {
  it("konverterer lengde og volum med mm-grunnlag", () => {
    expect(
      quickCalculate("length", { amount: "1200", unit: "mm" })[2].value,
    ).toBe(1.2);
    const result = quickCalculate("volume", {
      thickness: "48",
      widthMm: "98",
      length: "4,8",
      count: "10",
    });
    expect(result[0].value).toBeCloseTo(0.225792);
    expect(result[1].value).toBeCloseTo(225.792);
  });
  it("regner areal, løpemeter, pakker, svinn og pris", () => {
    expect(
      quickCalculate("area", { length: "6", width: "4", coverWidth: "120" })[1]
        .value,
    ).toBe(200);
    expect(
      quickCalculate("packages", { amount: "37", coverage: "5,7" })[0].value,
    ).toBe(7);
    expect(
      quickCalculate("waste", { amount: "100", percent: "5" })[0].value,
    ).toBe(105);
    expect(
      quickCalculate("price", {
        price: "200",
        amount: "10",
        coverage: "5",
        wanted: "37",
      })[2].value,
    ).toBe(740);
  });
  it("avviser manglende, negative og endeløse inndata", () => {
    expect(() =>
      quickCalculate("packages", { amount: "", coverage: "5" }),
    ).toThrow();
    expect(() =>
      quickCalculate("waste", { amount: "1", percent: "-1" }),
    ).toThrow();
    expect(() =>
      quickCalculate("length", { amount: "Infinity", unit: "mm" }),
    ).toThrow();
  });
  it("handelslengder avrunder behov opp til mm, tilgjengelig lengde ned", () => {
    expect(stockPlan(6.0004, [6]).total).toBe(12);
    expect(stockPlan(6, [6.0004]).total).toBe(6);
  });
});
