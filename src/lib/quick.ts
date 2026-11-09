import { numberFrom } from "./types";
import { roundUp } from "./calculators";
export const quickModes = {
  length: "Måleenheter",
  area: "Areal og løpemeter",
  volume: "Volum og liter",
  packages: "Pakkeomregning",
  waste: "Prosent og svinn",
  price: "Prisomregning",
};
export type QuickMode = keyof typeof quickModes;
export function quickCalculate(
  mode: QuickMode,
  v: Record<string, string>,
): { label: string; value: number; unit: string }[] {
  const n = (key: string, zero = false) => {
    const raw = v[key] ?? "";
    const value = numberFrom(raw);
    if (
      !raw.trim() ||
      !Number.isFinite(value) ||
      (zero ? value < 0 : value <= 0) ||
      value > 1e12
    )
      throw new Error(
        "Fyll ut gyldige, positive tall. Null er tillatt for pris og svinn.",
      );
    return value;
  };
  let result: { label: string; value: number; unit: string }[];
  switch (mode) {
    case "length": {
      const factor = ({ mm: 0.001, cm: 0.01, m: 1 } as Record<string, number>)[
        v.unit
      ];
      if (!factor) throw new Error("Velg en lengdeenhet.");
      const m = n("amount") * factor;
      result = [
        { label: "Millimeter", value: m * 1000, unit: "mm" },
        { label: "Centimeter", value: m * 100, unit: "cm" },
        { label: "Meter / løpemeter", value: m, unit: "m" },
      ];
      break;
    }
    case "area": {
      const area = n("length") * n("width");
      result = [
        { label: "Areal", value: area, unit: "m²" },
        {
          label: "Løpemeter med oppgitt dekkbredde",
          value: area / (n("coverWidth") / 1000),
          unit: "lm",
        },
      ];
      break;
    }
    case "volume": {
      const volume =
        (n("thickness") * n("widthMm") * n("length") * n("count")) / 1e6;
      result = [
        { label: "Volum", value: volume, unit: "m³" },
        { label: "Liter", value: volume * 1000, unit: "l" },
      ];
      break;
    }
    case "packages": {
      const need = n("amount"),
        coverage = n("coverage"),
        packs = roundUp(need / coverage);
      result = [
        { label: "Hele pakker / enheter", value: packs, unit: "stk" },
        {
          label: "Pakkene dekker",
          value: packs * coverage,
          unit: "behovsenheter",
        },
        {
          label: "Overskytende mengde",
          value: packs * coverage - need,
          unit: "behovsenheter",
        },
      ];
      break;
    }
    case "waste": {
      const amount = n("amount"),
        waste = n("percent", true);
      result = [
        {
          label: "Mengde med svinn",
          value: amount * (1 + waste / 100),
          unit: "enheter",
        },
        { label: "Tillegg", value: (amount * waste) / 100, unit: "enheter" },
      ];
      break;
    }
    case "price": {
      const amount = n("amount"),
        total = n("price", true);
      result = [
        {
          label: "Pris per oppgitt mengdeenhet",
          value: total / amount,
          unit: "kr",
        },
        {
          label: "Pris per pakke",
          value: (total / amount) * n("coverage"),
          unit: "kr",
        },
        {
          label: "Pris for ønsket mengde",
          value: (total / amount) * n("wanted"),
          unit: "kr",
        },
      ];
      break;
    }
  }
  if (result.some((r) => !Number.isFinite(r.value) || r.value > 1e18))
    throw new Error("Beregningen er for stor. Reduser målene.");
  return result;
}
