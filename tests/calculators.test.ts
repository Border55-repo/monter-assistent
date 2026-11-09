import { describe, expect, it } from "vitest";
import {
  calculate,
  projectTotal,
  roundUp,
  stockPlan,
  surface,
} from "../src/lib/calculators";
import { defaultInput, kinds } from "../src/lib/types";
import type { CalcInput, Kind } from "../src/lib/types";
import { seedProducts } from "../src/lib/seed";
import { productValues } from "../src/lib/product-input";
const input = (kind: Kind, values: Record<string, string> = {}): CalcInput => {
  const i = defaultInput(kind);
  i.values = { ...i.values, ...values };
  return i;
};
const metric = (kind: Kind, i: CalcInput, label: string) =>
  calculate(kind, i).metrics.find((m) => m.label === label)!.value;
describe("Areal, enheter og validering", () => {
  it("trekker samlede åpninger fra flere flater én gang", () => {
    const i = input("insulation", { count: "2" });
    i.openings.push({
      id: "o",
      name: "Vindu",
      width: "1,2",
      height: "1",
      count: "2",
      x: "1",
      y: "1",
    });
    expect(surface(i).gross).toBeCloseTo(38.4);
    expect(surface(i).net).toBeCloseTo(36);
  });
  it("støtter direkte areal", () => {
    const i = input("insulation", {
      measureMode: "area",
      directArea: "42",
      count: "2",
    });
    expect(surface(i).gross).toBe(84);
  });
  it.each(["", "0", "-1", "abc", "Infinity", "100000"])(
    "avviser ugyldig lengde %s",
    (raw) => {
      expect(() => surface(input("sheets", { length: raw }))).toThrow();
    },
  );
  it("avviser brøkvis antall flater", () =>
    expect(() => surface(input("sheets", { count: "1,5" }))).toThrow());
  it("avviser åpninger utenfor flaten og areal som blir null", () => {
    const i = input("sheets");
    i.openings = [
      {
        id: "o",
        name: "Dør",
        width: "10",
        height: "2",
        count: "1",
        x: "0",
        y: "0",
      },
    ];
    expect(() => surface(i)).toThrow();
    i.openings[0].width = "8";
    i.openings[0].height = "2,4";
    expect(() => surface(i)).toThrow();
  });
  it("avrunder eksakte multipler stabilt uten å runde ekte rest ned", () => {
    expect(roundUp(6.000000000000001)).toBe(6);
    expect(roundUp(6.0000001)).toBe(7);
    expect(roundUp(0.1)).toBe(1);
  });
});
describe("GLAVA og andre dokumenterte isolasjonsprodukter", () => {
  it("42 m² med GLAVA 100 mm: 7 pakker à 6,84, ikke generiske 5,7", () => {
    const i = input("insulation", {
      measureMode: "area",
      directArea: "42",
      productId: "glava-50673624",
      coverage: "5,7",
    });
    const r = calculate("insulation", i, seedProducts);
    expect(r.lines[0].quantity).toBe(7);
    expect(
      r.metrics.find((m) => m.label === "Pakkene dekker")!.value,
    ).toBeCloseTo(47.88);
    expect(r.lines[0].sku).toBe("101186758");
  });
  it("bruker produsentens avrundede pakningsareal", () => {
    const i = input("insulation", {
      measureMode: "area",
      directArea: "41,02",
      productId: "glava-50673632",
    });
    const r = calculate("insulation", i, seedProducts);
    expect(r.lines[0].quantity).toBe(11);
  });
  it("37 m², 5,7 m² per pakke og 5 % svinn gir 7 pakker", () => {
    const i = input("insulation", {
      measureMode: "area",
      directArea: "37",
      coverage: "5,7",
      waste: "5",
    });
    expect(calculate("insulation", i).lines[0].quantity).toBe(7);
  });
  it("rull og trefiber bruker egne pakningsdata", () => {
    for (const id of ["glava-50673613", "hunton-55406733"]) {
      const p = seedProducts.find((p) => p.id === id)!;
      const i = input("insulation", {
        measureMode: "area",
        directArea: "42",
        ...productValues("insulation", p),
      });
      expect(calculate("insulation", i, seedProducts).lines[0].quantity).toBe(
        Math.ceil(42 / p.coverage!),
      );
    }
  });
  it("krever pakningsdekning og avviser deaktivert produkt", () => {
    expect(() => calculate("insulation", input("insulation"))).toThrow(
      "Dekning",
    );
    expect(() =>
      calculate("insulation", input("insulation", { productId: "missing" })),
    ).toThrow("deaktivert");
  });
  it("utgir ikke salg per m² for å være pakker", () => {
    const p = { ...seedProducts[0], unit: "m²" };
    expect(() =>
      calculate("insulation", input("insulation", { productId: p.id }), [p]),
    ).toThrow("salgsenhet");
  });
  it("håndterer små og store mengder samt pris 0", () => {
    const tiny = input("insulation", {
      length: "0,001",
      width: "0,001",
      coverage: "100000",
      price: "0",
    });
    expect(calculate("insulation", tiny).lines[0].quantity).toBe(1);
    expect(projectTotal(calculate("insulation", tiny).lines)).toBe(0);
    expect(
      calculate(
        "insulation",
        input("insulation", {
          length: "1000",
          width: "1000",
          coverage: "2",
          count: "10000",
        }),
      ).lines[0].quantity,
    ).toBe(5e9);
  });
});
describe("Stenderverk", () => {
  it("5 m, c/c 600: ti stendere inkludert begge ender, kapp 2,304 m", () => {
    const i = input("timber");
    const r = calculate("timber", i);
    expect(r.metrics.find((m) => m.label === "Stendere før svinn")!.value).toBe(
      10,
    );
    expect(
      r.metrics.find((m) => m.label === "Kappmål stendere")!.value,
    ).toBeCloseTo(2.304);
    expect(r.metrics.find((m) => m.label === "Sviller totalt")!.value).toBe(10);
    expect(r.lines[0].quantity).toBe(9);
  });
  it("legger til hjørner og eksplisitte åpningsstendere uten å fjerne grunnstendere", () => {
    const i = input("timber", { corners: "2" });
    i.openings = [
      {
        id: "o",
        name: "Dør",
        width: "0,9",
        height: "2,1",
        count: "1",
        x: "1",
        y: "0",
      },
    ];
    expect(metric("timber", i, "Stendere før svinn")).toBe(14);
  });
  it("c/c 450 og eksakte moduler inkluderer sluttstender", () => {
    expect(
      metric(
        "timber",
        input("timber", { length: "4,5", cc: "450" }),
        "Stendere før svinn",
      ),
    ).toBe(11);
    expect(
      metric(
        "timber",
        input("timber", { length: "4,8" }),
        "Stendere før svinn",
      ),
    ).toBe(9);
  });
  it("avviser for korte handelslengder", () =>
    expect(() =>
      calculate("timber", input("timber", { stockLength: "2" })),
    ).toThrow("Handelslengde".toLowerCase()));
  it("konverterer lm-pris og volum på faktisk innkjøp", () => {
    const r = calculate("timber", input("timber", { price: "20" }));
    expect(r.lines[0].price).toBe(96);
    expect(
      r.metrics.find((m) => m.label === "Innkjøpt volum")!.value,
    ).toBeCloseTo(43.2 * 0.048 * 0.098);
  });
});
describe("Terrasse", () => {
  it("6 × 4 m, 120 mm + 5 mm: 33 rader, 198 lm, 726 skruer før svinn", () => {
    const r = calculate("deck", input("deck", { stockLengths: "6" }));
    expect(r.metrics.find((m) => m.label === "Bordrader")!.value).toBe(33);
    expect(r.metrics.find((m) => m.label === "Netto bordlengde")!.value).toBe(
      198,
    );
    expect(r.metrics.find((m) => m.label === "Anslåtte skruer")!.value).toBe(
      726,
    );
    expect(r.lines[0].quantity).toBe(33);
  });
  it("tar hensyn til at det ikke er en fuge etter siste bord", () => {
    expect(
      metric(
        "deck",
        input("deck", { width: "3,995", stockLengths: "6" }),
        "Bordrader",
      ),
    ).toBe(32);
  });
  it("bytter leggeretning og pakker skruene", () => {
    const r = calculate(
      "deck",
      input("deck", {
        direction: "width",
        stockLengths: "4,8",
        screwPack: "250",
        waste: "10",
      }),
    );
    expect(r.metrics.find((m) => m.label === "Bordrader")!.value).toBe(49);
    expect(
      r.lines.find((l) => l.name.startsWith("Terrasseskruer"))!.quantity,
    ).toBe(4);
  });
  it("finner minst kjøpt lengde og færrest stykker ved lik lengde", () => {
    expect(stockPlan(6, [3, 6]).lengths).toEqual([6]);
    expect(stockPlan(7, [3.6, 4.8]).total).toBe(7.2);
    expect(stockPlan(7, [3.6, 4.8]).lengths).toHaveLength(2);
  });
  it("avviser ugyldige handelslengder", () => {
    expect(() => stockPlan(6, [])).toThrow();
    expect(() => stockPlan(6, [0])).toThrow();
    expect(() => stockPlan(6, [NaN])).toThrow();
  });
  it("varsler om skjøter", () =>
    expect(calculate("deck", input("deck")).warnings.join()).toContain(
      "skjøter",
    ));
  it("skjult innfesting gir ingen udokumentert skruemengde", () => {
    const r = calculate("deck", input("deck", { fixingMethod: "custom" }));
    expect(r.lines.some((l) => l.name.startsWith("Terrasseskruer"))).toBe(
      false,
    );
    expect(r.metrics.some((m) => m.label === "Anslåtte skruer")).toBe(false);
    expect(r.warnings.join()).toContain("klips");
  });
  it("avviser ugyldig bordtykkelse og ubegrenset lengdeliste", () => {
    expect(() =>
      calculate("deck", input("deck", { boardThickness: "abc" })),
    ).toThrow();
    expect(() => stockPlan(6, Array(21).fill(4.8))).toThrow();
  });
});
describe("Plater", () => {
  it("28 m², 1200 × 2400: 10 plater med 28,8 m² dekning", () => {
    const i = input("sheets", { measureMode: "area", directArea: "28" });
    expect(metric("sheets", i, "Hele plater i innkjøp")).toBe(10);
    expect(metric("sheets", i, "Dekkende areal")).toBeCloseTo(28.8);
  });
  it("bruker dekkmål og pakkeavrunding separat", () => {
    const i = input("sheets", {
      measureMode: "area",
      directArea: "28",
      sheetWidth: "620",
      sheetLength: "2420",
      coverWidth: "600",
      coverLength: "2400",
      piecesPerPack: "3",
    });
    expect(metric("sheets", i, "Plater før pakkeavrunding")).toBe(20);
    expect(metric("sheets", i, "Hele plater i innkjøp")).toBe(21);
  });
  it("avviser dekkmål større enn nominelle mål", () =>
    expect(() =>
      calculate("sheets", input("sheets", { coverWidth: "1300" })),
    ).toThrow("Dekkende"));
});
describe("Kledning og gulv", () => {
  it("kledning bruker dekkbredde, ikke nominell bredde", () => {
    const i = input("cladding", {
      length: "5",
      width: "2,4",
      coverWidth: "125",
      stockLength: "4,8",
    });
    expect(metric("cladding", i, "Netto løpemeter")).toBe(96);
    expect(calculate("cladding", i).lines[0].quantity).toBe(20);
  });
  it("beregner over- og underliggere som separate sjikt", () => {
    const i = input("cladding", {
      length: "5",
      width: "2,4",
      claddingSystem: "overunder",
      boardWidth: "148",
      underWidth: "148",
      overlap: "25",
      stockLength: "4,8",
    });
    const r = calculate("cladding", i);
    expect(r.lines).toHaveLength(2);
    expect(r.lines[0].quantity).toBe(11);
    expect(r.lines[1].quantity).toBe(11);
    expect(r.metrics.find((m) => m.label === "Modulbredde")!.value).toBe(246);
  });
  it("summerer rom, trekker fra dørbredder i lister og pakker gulv", () => {
    const i = input("flooring", {
      coverage: "2,048",
      underlay: "yes",
      underlayCoverage: "15",
      barrier: "yes",
      barrierCoverage: "20",
      waste: "10",
    });
    i.rooms.push({
      id: "r2",
      name: "Rom 2",
      length: "3",
      width: "3",
      doorWidth: "0,9",
    });
    const r = calculate("flooring", i);
    expect(r.netArea).toBe(29);
    expect(r.lines[0].quantity).toBe(16);
    expect(
      r.metrics.find((m) => m.label === "Lister uten svinn")!.value,
    ).toBeCloseTo(28.2);
    expect(r.lines.find((l) => l.name === "Gulvunderlag")!.quantity).toBe(3);
    expect(r.lines.find((l) => l.name === "Fuktsperre")!.quantity).toBe(2);
  });
  it("avviser tom romliste", () => {
    const i = input("flooring", { coverage: "2" });
    i.rooms = [];
    expect(() => calculate("flooring", i)).toThrow("rom");
  });
  it("legger ikke underlag og fuktsperre automatisk til", () => {
    const r = calculate("flooring", input("flooring", { coverage: "2" }));
    expect(
      r.lines.some((l) => l.name === "Gulvunderlag" || l.name === "Fuktsperre"),
    ).toBe(false);
  });
});
describe("Festemidler", () => {
  it("krever dokumentert innfestingsgrunnlag", () =>
    expect(() => calculate("fixings", input("fixings"))).toThrow(
      "Kilde".toLowerCase(),
    ));
  it("beregner forbruk per m² og hele pakker", () => {
    const i = input("fixings", {
      area: "28",
      rate: "20",
      packSize: "250",
      waste: "5",
      patternSource: "Brukerens dokumenterte forbruk for valgt system",
      price: "100",
    });
    const r = calculate("fixings", i);
    expect(r.lines[0].quantity).toBe(3);
    expect(projectTotal(r.lines)).toBe(300);
  });
  it("støtter antall innfestingskryss", () => {
    const i = input("fixings", {
      method: "crossings",
      crossings: "150",
      perCross: "2",
      packSize: "250",
      patternSource: "Mønster fra valgt anvisning",
    });
    expect(calculate("fixings", i).lines[0].quantity).toBe(2);
  });
});
describe("Alle motorer avviser negativt svinn og ugyldig pris", () => {
  it.each(kinds)("%s", (kind) => {
    expect(() => calculate(kind, input(kind, { waste: "-1" }))).toThrow();
    expect(() => calculate(kind, input(kind, { price: "-1" }))).toThrow();
  });
});
