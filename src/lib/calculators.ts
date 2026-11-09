import type {
  Calculation,
  CalcInput,
  Kind,
  MaterialLine,
  Product,
} from "./types";
import { date, format, labels, numberFrom } from "./types";
import { resolveProductInput } from "./product-input";

export class InputError extends Error {}
export const roundUp = (n: number) =>
  Math.ceil(n - Math.max(1, Math.abs(n)) * Number.EPSILON * 8);
function value(
  input: CalcInput,
  key: string,
  name: string,
  min = 0,
  max = 1e7,
  required = true,
): number {
  const raw = input.values[key] ?? "";
  if (!raw.trim() && !required) return 0;
  const n = numberFrom(raw);
  if (!raw.trim() || !Number.isFinite(n) || n < min || n > max)
    throw new InputError(
      `${name}: oppgi et tall mellom ${format(min, 4)} og ${format(max)}.`,
    );
  return n;
}
function positive(input: CalcInput, key: string, name: string, max = 1000) {
  return value(input, key, name, 0.001, max);
}
function integer(
  input: CalcInput,
  key: string,
  name: string,
  min = 0,
  max = 100000,
) {
  const n = value(input, key, name, min, max);
  if (!Number.isInteger(n)) throw new InputError(`${name} må være et heltall.`);
  return n;
}
export function surface(input: CalcInput) {
  const direct = input.values.measureMode === "area";
  const length = direct ? 1 : positive(input, "length", "Lengde");
  const width = direct ? 1 : positive(input, "width", "Høyde / bredde");
  const count = integer(input, "count", "Antall flater", 1, 10000);
  let openings = 0;
  for (const o of input.openings) {
    const w = numberFrom(o.width),
      h = numberFrom(o.height),
      c = numberFrom(o.count),
      x = numberFrom(o.x),
      y = numberFrom(o.y);
    if (
      ![w, h, c, x, y].every(Number.isFinite) ||
      w <= 0 ||
      h <= 0 ||
      c < 1 ||
      !Number.isInteger(c) ||
      c > 10000 ||
      x < 0 ||
      y < 0 ||
      (!direct && (x + w > length + 1e-9 || y + h > width + 1e-9))
    )
      throw new InputError(
        "Åpninger må ha positive mål, helt antall og ligge innenfor én flate. Plassering måles fra venstre og fra gulvet.",
      );
    openings += w * h * c;
  }
  const gross =
    (direct
      ? positive(input, "directArea", "Areal per flate", 1e7)
      : length * width) * count;
  if (openings >= gross)
    throw new InputError(
      "Samlet åpningsareal må være mindre enn bruttoarealet. Kontroller at åpninger ikke er telt dobbelt.",
    );
  return {
    length,
    width,
    count,
    gross,
    openings,
    net: gross - openings,
    direct,
  };
}
function line(
  name: string,
  quantity: number,
  unit: string,
  price?: number,
  dimension = "",
  product?: Product,
  note = "",
): MaterialLine {
  return {
    id: `${name}-${unit}`,
    name: product?.name || name,
    sku: product?.sku || "",
    dimension,
    quantity,
    unit,
    price,
    priceSource: price === undefined ? "Ikke registrert" : "Manuelt registrert",
    note,
  };
}
function price(input: CalcInput) {
  return input.values.price?.trim()
    ? value(input, "price", "Enhetspris", 0, 1e9)
    : undefined;
}
function waste(input: CalcInput) {
  return value(input, "waste", "Svinn", 0, 100);
}
function areaMetrics(a: ReturnType<typeof surface>) {
  return [
    { label: "Bruttoareal", value: a.gross, unit: "m²" },
    { label: "Åpninger totalt", value: a.openings, unit: "m²" },
    { label: "Netto areal", value: a.net, unit: "m²" },
  ];
}
const dimensionalWarning =
  "Veiledende mengdeberegning. Bæreevne, brannkrav og konstruksjonsoppbygning må kontrolleres mot dokumentasjon og av fagperson ved behov.";

/** Discrete purchasing plan, not a structural or splice-position design. */
export function stockPlan(
  run: number,
  lengths: number[],
): { lengths: number[]; total: number } {
  if (
    !Number.isFinite(run) ||
    run <= 0 ||
    run > 1000 ||
    !lengths.length ||
    lengths.length > 20 ||
    lengths.some((n) => !Number.isFinite(n) || n <= 0 || n > 30)
  )
    throw new InputError(
      "Oppgi 1–20 handelslengder større enn 0 og høyst 30 m, skilt med semikolon.",
    );
  const sorted = [...new Set(lengths)].sort((a, b) => a - b);
  // Millimetre precision; up to 1,030,000 cells. Minimise purchased length, then piece count.
  const target = roundUp(run * 1000);
  const stocks = sorted.map((n) => Math.floor(n * 1000 + 1e-8));
  if (stocks.some((n) => n < 1))
    throw new InputError("Handelslengde må være minst 1 mm.");
  const limit = target + stocks[stocks.length - 1];
  const dp = new Int32Array(limit + 1).fill(0x3fffffff),
    prev = new Int32Array(limit + 1).fill(-1);
  dp[0] = 0;
  for (let n = 0; n <= limit; n++)
    if (dp[n] < 0x3fffffff)
      for (let j = 0; j < stocks.length; j++) {
        const next = n + stocks[j];
        if (next <= limit && dp[n] + 1 < dp[next]) {
          dp[next] = dp[n] + 1;
          prev[next] = j;
        }
      }
  let best = target;
  while (best <= limit && prev[best] < 0) best++;
  if (best > limit) throw new InputError("Kunne ikke finne handelslengder.");
  const result: number[] = [];
  for (let n = best; n > 0; ) {
    const j = prev[n];
    result.push(stocks[j] / 1000);
    n -= stocks[j];
  }
  return { lengths: result, total: best / 1000 };
}

export function calculate(
  kind: Kind,
  input: CalcInput,
  products: Product[] = [],
): Calculation {
  const p = products.find(
    (p) => p.id === input.values.productId && p.active && p.category === kind,
  );
  if (input.values.productId && !p)
    throw new InputError(
      "Valgt produkt finnes ikke eller er deaktivert. Velg et aktivt produkt eller manuelle data.",
    );
  if (p) {
    const validUnits = ["insulation", "flooring", "fixings"].includes(kind)
      ? ["pk"]
      : kind === "sheets"
        ? ["stk", "pk"]
        : ["lm", "stk"];
    if (!validUnits.includes(p.unit))
      throw new InputError(
        `Produktets salgsenhet (${p.unit}) kan ikke brukes i denne kalkulatoren. Registrer riktig pakning / stykk / handelslengde, eller velg manuelle data.`,
      );
  }
  input = resolveProductInput(kind, input, p);
  const s = waste(input),
    factor = 1 + s / 100,
    unitPrice = price(input);
  const assumptions = [
    `Svinn: ${format(s)} %.`,
    "Priser er manuelt registrert i NOK; mva-status må avklares.",
  ];
  assumptions.push(
    "Geometri, konstruksjonsavstander og svinn er brukerens forutsetninger. Forhåndsutfylte mål er redigerbare regneeksempler, ikke produktanbefalinger.",
  );
  if (kind === "timber" || kind === "deck") {
    assumptions.push(
      "Sagspor og renskjæring er ikke lagt til i handelslengdeforslaget. Kontroller faktisk kappbehov og tilgjengelig lengde, og juster innkjøp/reserve før bestilling.",
    );
  }
  const warnings: string[] = [],
    related: string[] = [];
  if (p) {
    assumptions.push(
      `Produkt: ${p.name}. Data sist oppdatert ${date(p.updatedAt)}. Kilde: ${p.source || "ikke oppgitt"}.`,
      `Kontrollerte registerfelt: ${p.verifiedFields?.join(", ") || "ingen spesifisert"}. Andre inndata er manuelle forutsetninger.`,
      ...(p.description ? [p.description] : []),
    );
    if (!p.verified)
      warnings.push(
        "Produktdata er ikke markert som verifisert. Kontroller datablad og pakningsdekning.",
      );
  }
  const result: Calculation = {
    metrics: [],
    lines: [],
    assumptions,
    warnings,
    related,
  };
  switch (kind) {
    case "insulation": {
      const a = surface(input),
        coverage = positive(input, "coverage", "Dekning per pakke", 1e5),
        thickness = positive(input, "thickness", "Isolasjonstykkelse", 1000);
      const cc = positive(input, "cc", "Stenderavstand", 3000),
        stud = positive(input, "studWidth", "Stenderbredde", 1000);
      if (stud >= cc)
        throw new InputError("Stenderbredde må være mindre enn c/c-avstanden.");
      const need = a.net * factor,
        packs = roundUp(need / coverage),
        covered = packs * coverage;
      result.metrics = [
        { label: "Hele pakker", value: packs, unit: "pk", primary: true },
        ...areaMetrics(a),
        { label: "Med svinn", value: need, unit: "m²" },
        { label: "Pakkene dekker", value: covered, unit: "m²" },
        { label: "Overdekning etter svinn", value: covered - need, unit: "m²" },
      ];
      result.lines = [
        line(
          input.values.insulationType || "Isolasjon",
          packs,
          "pk",
          unitPrice,
          `${thickness} mm`,
          p,
          `${format(coverage)} m²/pk; behov inkl. svinn ${format(need)} m².`,
        ),
      ];
      assumptions.push(
        a.direct
          ? `Bruttoareal ${format(a.gross)} m² fra direkte arealinntasting × ${a.count} flater. Åpninger trekkes fra samlet.`
          : `${format(a.length)} × ${format(a.width)} m × ${a.count} flater. Åpninger trekkes fra én gang med oppgitt antall.`,
        `Arealbasert behov: netto × ${format(factor)}. Pakker = avrund opp(behov / ${format(coverage)} m²).`,
        `C/c ${cc} mm, teoretisk fri bredde ${cc - stud} mm. Stenderareal trekkes ikke fra.`,
      );
      warnings.push(
        "Antall pakker beregnes fra areal. Produktbredde, lengde, kompresjon og fysisk tilpasning må kontrolleres separat.",
      );
      if (p?.width && Math.abs(p.width - (cc - stud)) > 20)
        warnings.push(
          `Produktbredden er ${p.width} mm. Kontroller tilpasning til teoretisk fri bredde ${cc - stud} mm.`,
        );
      related.push(
        "Vurder bygningsplater og festemidler til valgt konstruksjon.",
        ...(input.values.construction === "Yttervegg"
          ? [
              "Undersøk behov for vindsperre, dampsperre og tilpasset tape ut fra hele veggoppbygningen.",
            ]
          : [
              "Dampsperre er ikke et standardtillegg til alle konstruksjoner. Avklar temperatur- og fuktforhold.",
            ]),
      );
      result.netArea = a.net;
      break;
    }
    case "timber": {
      const a = surface(input),
        cc = positive(input, "cc", "Stenderavstand", 3000) / 1000;
      const t = positive(input, "studThickness", "Tykkelse", 1000),
        d = positive(input, "studDepth", "Dybde", 1000),
        stock = positive(input, "stockLength", "Handelslengde", 30);
      const bottom = integer(input, "bottom", "Bunnsviller", 0, 5),
        top = integer(input, "top", "Toppsviller", 0, 5),
        corners = integer(input, "corners", "Ekstra hjørnestendere", 0, 10000),
        extras = integer(
          input,
          "openingExtras",
          "Tilleggsstendere per åpning",
          0,
          20,
        );
      const openingCount = input.openings.reduce(
        (n, o) => n + numberFrom(o.count),
        0,
      );
      const studs =
        (roundUp(a.length / cc) + 1) * a.count +
        corners +
        openingCount * extras;
      const studLength = a.width - ((bottom + top) * t) / 1000;
      if (studLength <= 0 || studLength > stock)
        throw new InputError(
          "Stendernes kappmål må være positivt og ikke lengre enn handelslengden. Velg en lengre handelslengde.",
        );
      const sillLm = a.length * (bottom + top) * a.count,
        extraLm = value(input, "extraLm", "Ekstra løpemeter", 0, 1e6),
        lintel = value(input, "lintel", "Losholter per åpning", 0, 10);
      const lintelLm = input.openings.reduce(
        (n, o) => n + numberFrom(o.width) * numberFrom(o.count) * lintel,
        0,
      );
      const netLm = studs * studLength + sillLm + lintelLm + extraLm;
      const piecesPerStock = Math.floor((stock + 1e-10) / studLength);
      const studStocks = roundUp((studs * factor) / piecesPerStock),
        sillStocks = roundUp(a.length / stock) * (bottom + top) * a.count;
      const additionalStocks = roundUp(((lintelLm + extraLm) * factor) / stock),
        ordered = studStocks + roundUp(sillStocks * factor) + additionalStocks;
      const orderLm = ordered * stock;
      result.metrics = [
        {
          label: "Stendere før svinn",
          value: studs,
          unit: "stk",
          primary: true,
        },
        { label: "Kappmål stendere", value: studLength, unit: "m" },
        { label: "Sviller totalt", value: sillLm, unit: "lm" },
        { label: "Netto trelast", value: netLm, unit: "lm" },
        { label: "Handelslengder med svinn", value: ordered, unit: "stk" },
        { label: "Innkjøpt løpemeter", value: orderLm, unit: "lm" },
        { label: "Innkjøpt volum", value: (orderLm * t * d) / 1e6, unit: "m³" },
      ];
      result.lines = [
        line(
          "Konstruksjonsvirke",
          ordered,
          "stk",
          unitPrice === undefined ? undefined : unitPrice * stock,
          `${t} × ${d} mm · ${format(stock)} m`,
          p,
          `Prisgrunnlag: løpemeterpris × ${format(stock)} m. ${studs} stendere à ${format(studLength, 3)} m, ${format(sillLm)} lm svill.`,
        ),
      ];
      assumptions.push(
        `Stendere = (avrund opp(L / c/c) + 1) × flater + ${corners} hjørnetillegg + ${extras} per åpning.`,
        "Grunnstendere ved åpninger beholdes som et konservativt estimat; eksakt plassering tegnes ikke.",
        `Stenderlengde = vegghøyde − ${bottom + top} svillag × ${t} mm. ${piecesPerStock} stender(e) per handelslengde.`,
        "Sviller beregnes per hel vegglengde; svill i døråpninger trekkes ikke fra. Svinn legges på hver innkjøpsgruppe. Kapp gjenbrukes ikke mellom gruppene.",
        "Losholter er oppgitte tverrstykker med åpningsbredde; opplegg og ekstra konstruktive forsterkninger inngår ikke.",
      );
      warnings.push(dimensionalWarning);
      related.push("Vurder isolasjon, plater og dokumenterte festemidler.");
      result.netArea = a.net;
      break;
    }
    case "deck": {
      const l = positive(input, "length", "Lengde"),
        w = positive(input, "width", "Bredde");
      const thickness = positive(input, "boardThickness", "Bordtykkelse", 1000);
      const b =
          positive(input, "boardWidth", "Faktisk bordbredde", 1000) / 1000,
        gap = value(input, "gap", "Fuge", 0, 100) / 1000;
      const along = input.values.direction === "width" ? w : l,
        across = input.values.direction === "width" ? l : w;
      const rows = roundUp((across + gap) / (b + gap));
      const rawStocks = input.values.stockLengths
        .split(";")
        .map((n) => numberFrom(n));
      const plan = stockPlan(along, rawStocks),
        byLength = new Map<number, number>();
      for (const len of plan.lengths)
        byLength.set(len, (byLength.get(len) || 0) + rows);
      const spacing =
          positive(input, "joistSpacing", "Bjelkeavstand", 3000) / 1000,
        joists = roundUp(along / spacing) + 1;
      const perCross = integer(
          input,
          "fixingsPerCross",
          "Festemidler per kryss",
          1,
          10,
        ),
        screws = roundUp(rows * joists * perCross * factor);
      const orderedLm = [...byLength].reduce(
        (n, [len, qty]) => n + len * roundUp(qty * factor),
        0,
      );
      result.metrics = [
        { label: "Terrasseareal", value: l * w, unit: "m²", primary: true },
        { label: "Bordrader", value: rows, unit: "rader" },
        { label: "Netto bordlengde", value: rows * along, unit: "lm" },
        { label: "Innkjøpt med svinn", value: orderedLm, unit: "lm" },
        { label: "Anslåtte skruer", value: screws, unit: "stk" },
        { label: "Bjelker uten skjøtetillegg", value: joists, unit: "stk" },
        { label: "Bjelkelengde totalt", value: joists * across, unit: "lm" },
      ];
      result.lines = [...byLength]
        .sort((a, b) => a[0] - b[0])
        .map(([len, qty]) =>
          line(
            "Terrassebord",
            roundUp(qty * factor),
            "stk",
            unitPrice === undefined ? undefined : unitPrice * len,
            `${thickness} × ${input.values.boardWidth} mm · ${format(len)} m`,
            p,
            `${rows} rader, ${format(along)} m per rad. Pris: lm-pris × lengde.`,
          ),
        );
      const pack = input.values.screwPack.trim()
        ? integer(input, "screwPack", "Skruer per pakke", 1, 1000000)
        : 0;
      const screwPrice = input.values.screwPrice.trim()
        ? value(input, "screwPrice", "Skruepris per pakke", 0, 1e9)
        : undefined;
      result.lines.push(
        line(
          "Terrasseskruer – kvalitet må avklares",
          pack ? roundUp(screws / pack) : screws,
          pack ? "pk" : "stk",
          pack ? screwPrice : undefined,
          "",
          undefined,
          `${perCross} per kryss; ${screws} stk inkl. svinn. Korrosjonsklasse og lengde må kontrolleres.`,
        ),
      );
      if (input.values.fixingMethod === "custom") {
        result.lines = result.lines.filter(
          (l) => !l.name.startsWith("Terrasseskruer"),
        );
        result.metrics = result.metrics.filter(
          (m) => m.label !== "Anslåtte skruer",
        );
        warnings.push(
          "Skjult eller annen innfesting: fester, klips og start-/sluttbeslag må beregnes etter valgt systems anvisning. De er ikke inkludert.",
        );
      }
      result.lines.push(
        line(
          "Bjelker – dimensjon må avklares",
          joists,
          "stk",
          undefined,
          `${format(across)} m`,
          undefined,
          "Mengde uten skjøteforsterkning, kantbjelker, fundamenter eller svinn.",
        ),
      );
      assumptions.push(
        `Rader = avrund opp((tverrmål + fuge) / (bordbredde + fuge)); ${rows} × ${format(along)} m.`,
        `Handelslengder per rad: ${plan.lengths.map((n) => format(n)).join(" + ")} m; kapp ${format(plan.total - along)} m/rad før svinn.`,
        "Lengdeforslaget minimerer innkjøpt lengde per rad; svinn rundes opp per lengdegruppe. Kapp gjenbrukes ikke mellom rader.",
        `Bjelker = avrund opp(lengderetning / ${format(spacing)} m) + 1. ${input.values.fixingMethod === "custom" ? "Systeminnfesting er ikke beregnet." : `Skruer = rader × bjelker × ${perCross}, med svinn.`}`,
      );
      if (plan.lengths.length > 1)
        warnings.push(
          "Forslaget krever skjøter. Skjøtene må ha egnet opplegg; ekstra bjelker og festemidler for skjøter er ikke inkludert.",
        );
      warnings.push(
        "Bjelkeavstand og fuge er brukerens forutsetninger, ikke en produktanbefaling.",
        dimensionalWarning,
      );
      related.push(
        "Undersøk bjelkesko, beslag, endevedbehandling og fundamentering mot valgt løsning.",
      );
      result.netArea = l * w;
      break;
    }
    case "sheets": {
      const a = surface(input),
        nominalL = positive(input, "sheetLength", "Platelengde", 20000),
        nominalW = positive(input, "sheetWidth", "Platebredde", 10000);
      const coverL = positive(input, "coverLength", "Dekkende lengde", 20000),
        coverW = positive(input, "coverWidth", "Dekkende bredde", 10000);
      if (coverL > nominalL || coverW > nominalW)
        throw new InputError(
          "Dekkende mål kan ikke være større enn nominelle platemål.",
        );
      const perSheet = (coverL * coverW) / 1e6,
        needed = roundUp((a.net * factor) / perSheet),
        packSize = integer(
          input,
          "piecesPerPack",
          "Plater per pakke",
          1,
          10000,
        ),
        packs = roundUp(needed / packSize),
        purchased = packs * packSize;
      result.metrics = [
        {
          label: "Hele plater i innkjøp",
          value: purchased,
          unit: "stk",
          primary: true,
        },
        ...areaMetrics(a),
        { label: "Plater før pakkeavrunding", value: needed, unit: "stk" },
        { label: "Pakker", value: packs, unit: "pk" },
        { label: "Dekkende areal", value: purchased * perSheet, unit: "m²" },
        {
          label: "Areal utover netto",
          value: purchased * perSheet - a.net,
          unit: "m²",
        },
      ];
      result.lines = [
        line(
          input.values.sheetType || "Bygningsplater",
          purchased,
          "stk",
          unitPrice,
          `${nominalW} × ${nominalL} mm`,
          p,
          `Dekkende ${coverW} × ${coverL} mm. ${packSize} plater/pk.`,
        ),
      ];
      assumptions.push(
        `Dekkareal per plate = ${coverW} × ${coverL} / 1 000 000 = ${format(perSheet, 4)} m².`,
        `Retning: ${input.values.direction === "standing" ? "stående" : "liggende"}. Antall er arealbasert og inkluderer ikke en kapp-/skjøteplan.`,
        "Areal utover netto inkluderer valgt svinn, avrunding og eventuell pakkeavrunding; faktisk kapp kan avvike.",
      );
      warnings.push(
        "Kontroller skjøteplassering, understøttelse, bevegelsesfuger og produktets bruksområde.",
      );
      related.push(
        "Vurder riktig skrue, skjøteprodukter og eventuell overflatebehandling.",
      );
      result.netArea = a.net;
      break;
    }
    case "cladding": {
      if (input.values.claddingSystem === "overunder") {
        const a = surface(input),
          over = positive(input, "boardWidth", "Bredde overligger", 1000),
          under = positive(input, "underWidth", "Bredde underligger", 1000),
          overlap = positive(input, "overlap", "Overlapp per side", 500),
          stock = positive(input, "stockLength", "Handelslengde", 30);
        if (2 * overlap >= Math.min(over, under))
          throw new InputError(
            "Overlapp må gi positiv fri bredde på begge bord.",
          );
        const module = (over + under - 2 * overlap) / 1000,
          lmEach = a.net / module,
          qty = roundUp((lmEach * factor) / stock);
        result.metrics = [
          { label: "Bord per sjikt", value: qty, unit: "stk", primary: true },
          ...areaMetrics(a),
          { label: "Modulbredde", value: module * 1000, unit: "mm" },
          { label: "Netto per sjikt", value: lmEach, unit: "lm" },
          { label: "Innkjøpt begge sjikt", value: 2 * qty * stock, unit: "lm" },
        ];
        result.lines = [
          line(
            "Overliggere",
            qty,
            "stk",
            unitPrice === undefined ? undefined : unitPrice * stock,
            `${over} mm · ${format(stock)} m`,
            p,
            "Overliggere.",
          ),
          line(
            "Underliggere",
            qty,
            "stk",
            undefined,
            `${under} mm · ${format(stock)} m`,
            undefined,
            "Pris registreres separat i materiallisten.",
          ),
        ];
        assumptions.push(
          `Modulbredde = (${over} + ${under} − 2 × ${overlap}) mm. Netto lm per sjikt = areal / modulbredde.`,
          "To forskjellige sjikt, separat pakking og pris. Avslutninger og skjøter kan øke behovet.",
        );
        warnings.push(
          "Over-/underliggere skal beregnes som to sjikt. Innfesting og lufting krever profilspesifikk anvisning; festemiddelantall beregnes ikke automatisk.",
          dimensionalWarning,
        );
        result.netArea = a.net;
        related.push("Undersøk utlekting, lufting og tilpasset innfesting.");
        break;
      }
      const a = surface(input),
        nominal = positive(input, "boardWidth", "Nominell bordbredde", 1000),
        cover = positive(input, "coverWidth", "Faktisk dekkbredde", 1000),
        stock = positive(input, "stockLength", "Handelslengde", 30);
      if (cover > nominal)
        throw new InputError(
          "Dekkbredde kan ikke overstige nominell bordbredde.",
        );
      const netLm = a.net / (cover / 1000),
        need = netLm * factor,
        boards = roundUp(need / stock),
        spacing =
          positive(input, "fixingSpacing", "Avstand mellom festerader", 3000) /
          1000,
        per = integer(input, "fixingsPerCross", "Festemidler per kryss", 1, 10);
      // Conservative: both end crossings on every purchased board, including extra/waste boards.
      const fixings = boards * (roundUp(stock / spacing) + 1) * per;
      result.metrics = [
        {
          label: "Hele handelslengder",
          value: boards,
          unit: "stk",
          primary: true,
        },
        ...areaMetrics(a),
        { label: "Netto løpemeter", value: netLm, unit: "lm" },
        { label: "Løpemeter med svinn", value: need, unit: "lm" },
        { label: "Innkjøpt løpemeter", value: boards * stock, unit: "lm" },
        { label: "Anslåtte festemidler", value: fixings, unit: "stk" },
      ];
      result.lines = [
        line(
          "Kledningsbord",
          boards,
          "stk",
          unitPrice === undefined ? undefined : unitPrice * stock,
          `${nominal} mm · dekk ${cover} mm · ${format(stock)} m`,
          p,
          `Profil: ${input.values.profile}. Retning: ${input.values.direction === "standing" ? "stående" : "liggende"}.`,
        ),
        line(
          "Kledningsfestemidler – type må avklares",
          fixings,
          "stk",
          undefined,
          "",
          undefined,
          `Generelt estimat, ${per} per kryss og ${format(spacing)} m mellom festerader.`,
        ),
      ];
      assumptions.push(
        `Netto lm = netto m² / ${cover / 1000} m dekkbredde. Bord = avrund opp(lm med svinn / ${format(stock)} m).`,
        "Dekkbredde er innlagt av brukeren eller hentet fra valgt lokalt produkt. Nominell bredde brukes ikke som dekkbredde automatisk.",
        "Festemidler inkluderer endefester på alle innkjøpte bord. Faktisk lekting, kapping og åpninger kan endre antallet.",
      );
      warnings.push(
        "Arealbasert mengde; leggeretningen gir ikke en fysisk kappplan. Kontroller overlapp, lufting og innfesting mot produktanvisningen.",
      );
      related.push(
        "Undersøk lekter, musebånd, hjørnebord og overflatebehandling for valgt konstruksjon.",
      );
      result.netArea = a.net;
      break;
    }
    case "flooring": {
      if (!input.rooms.length) throw new InputError("Legg til minst ett rom.");
      let area = 0,
        perimeter = 0;
      for (const r of input.rooms) {
        const l = numberFrom(r.length),
          w = numberFrom(r.width),
          door = numberFrom(r.doorWidth);
        if (
          ![l, w, door].every(Number.isFinite) ||
          l <= 0 ||
          w <= 0 ||
          l > 1000 ||
          w > 1000 ||
          door < 0 ||
          door >= 2 * (l + w)
        )
          throw new InputError(
            `Kontroller mål og listfradrag for ${r.name || "rommet"}.`,
          );
        area += l * w;
        perimeter += 2 * (l + w) - door;
      }
      const coverage = positive(
          input,
          "coverage",
          "Gulvdekning per pakke",
          1e5,
        ),
        need = area * factor,
        packs = roundUp(need / coverage),
        trim = positive(input, "trimLength", "Listelengde", 30),
        trims = roundUp((perimeter * factor) / trim);
      result.metrics = [
        { label: "Hele gulvpakker", value: packs, unit: "pk", primary: true },
        { label: "Samlet romareal", value: area, unit: "m²" },
        { label: "Gulv med svinn", value: need, unit: "m²" },
        { label: "Pakkene dekker", value: packs * coverage, unit: "m²" },
        { label: "Underlag med svinn", value: need, unit: "m²" },
        { label: "Lister uten svinn", value: perimeter, unit: "lm" },
        { label: "Hele listelengder", value: trims, unit: "stk" },
      ];
      result.lines = [
        line(
          input.values.floorType || "Gulv",
          packs,
          "pk",
          unitPrice,
          "",
          p,
          `${format(coverage)} m²/pk. ${input.rooms.length} rom.`,
        ),
        line("Gulvlister", trims, "stk", undefined, `${format(trim)} m`),
      ];
      for (const [key, name] of [
        ["underlayCoverage", "Gulvunderlag"],
        ["barrierCoverage", "Fuktsperre"],
      ] as const) {
        if (key === "underlayCoverage" && input.values.underlay !== "yes")
          continue;
        if (key === "barrierCoverage" && input.values.barrier !== "yes")
          continue;
        const c = input.values[key].trim()
          ? positive(input, key, `Dekning for ${name}`, 1e6)
          : 0;
        result.lines.push(
          line(
            name,
            c ? roundUp(need / c) : need,
            c ? "pk" : "m²",
            undefined,
            "",
            undefined,
            "Netto rulledekning må ta hensyn til produsentens overlapp.",
          ),
        );
      }
      result.metrics = result.metrics.filter(
        (m) =>
          m.label !== "Underlag med svinn" || input.values.underlay === "yes",
      );
      assumptions.push(
        `Romareal summeres. Pakker = avrund opp(${format(area)} × ${format(factor)} / ${format(coverage)}).`,
        `Leggemønster: ${input.values.pattern}; svinn ${format(s)} % er et redigerbart estimat.`,
        "Lister = samlet romomkrets minus oppgitte dørfradrag, med valgt svinn og avrunding til handelslengder.",
      );
      warnings.push(
        "Kontroller gulvets krav til underlag, fukt, ekspansjonsfuger og maksimal sammenhengende flate. Fuktsperre velges etter underlag og produsentkrav.",
      );
      result.netArea = area;
      related.push(
        "Vurder overganger, avslutninger og produkter for vedlikehold.",
      );
      break;
    }
    case "fixings": {
      if (!input.values.patternSource.trim())
        throw new InputError(
          "Oppgi kilde eller beskrivelse av forbruk / innfestingsmønster før beregning.",
        );
      const pack = integer(input, "packSize", "Antall per pakke", 1, 1e7);
      const raw =
        input.values.method === "crossings"
          ? integer(input, "crossings", "Antall kryss", 1, 1e7) *
            integer(input, "perCross", "Fester per kryss", 1, 100)
          : positive(input, "area", "Areal", 1e7) *
            positive(input, "rate", "Forbruk per m²", 10000);
      const need = roundUp(raw * factor),
        packs = roundUp(need / pack);
      result.metrics = [
        { label: "Hele pakker", value: packs, unit: "pk", primary: true },
        { label: "Forbruk før svinn", value: raw, unit: "stk" },
        { label: "Behov med svinn", value: need, unit: "stk" },
        { label: "Innkjøpt antall", value: packs * pack, unit: "stk" },
      ];
      result.lines = [
        line(
          input.values.fastenerType || "Festemidler",
          packs,
          "pk",
          unitPrice,
          `${pack} stk/pk`,
          p,
          input.values.patternSource,
        ),
      ];
      assumptions.push(
        `Underlag: ${input.values.substrate}. Grunnlag: ${input.values.patternSource}.`,
        "Beregningen bruker oppgitt forbruk eller antall kryss × fester per kryss, deretter svinn og pakkeavrunding.",
      );
      warnings.push(
        "Festemidlets lengde, materiale, korrosjonsklasse og kapasitet må verifiseres. Ingen dimensjonering av bærende innfestinger.",
      );
      break;
    }
  }
  if (
    result.metrics.some((m) => !Number.isFinite(m.value)) ||
    result.lines.some(
      (l) =>
        !Number.isFinite(l.quantity) ||
        l.quantity < 0 ||
        (l.price !== undefined && !Number.isFinite(l.price * l.quantity)),
    )
  )
    throw new InputError("Beregningen er for stor. Reduser mengden.");
  return result;
}
export function projectTotal(lines: MaterialLine[]) {
  return lines.reduce((n, l) => n + l.quantity * (l.price ?? 0), 0);
}
export function calculationTitle(kind: Kind, input: CalcInput) {
  return `${labels[kind].short}${kind === "flooring" ? ` · ${input.rooms.length} rom` : kind === "fixings" ? "" : input.values.measureMode === "area" ? ` · ${input.values.directArea} m² × ${input.values.count}` : ` · ${input.values.length} × ${input.values.width} m`}`;
}
