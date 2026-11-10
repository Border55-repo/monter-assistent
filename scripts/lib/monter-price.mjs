/** Strict reader for publicly published product-page data. No browser code is executed. */
const units = {
  PAK: "pk",
  PK: "pk",
  ESKE: "pk",
  ESK: "pk",
  BOX: "pk",
  BOKS: "pk",
  STK: "stk",
  PLA: "stk",
  LM: "lm",
  M2: "m²",
  "M²": "m²",
  M3: "m³",
  "M³": "m³",
};

function fail(message) {
  throw new Error(message);
}
function productUrl(raw) {
  const url = new URL(raw);
  if (
    url.protocol !== "https:" ||
    !["www.monter.no", "monter.no"].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.port
  )
    fail(
      "Uventet kilde. Bare offentlige HTTPS-produktsider på monter.no støttes.",
    );
  return `https://www.monter.no${url.pathname.replace(/\/$/, "")}`;
}
export function readCurrentPage(html) {
  if (typeof html !== "string" || html.length > 8_000_000)
    fail("Ugyldig eller for stor produktside.");
  const matches = [...html.matchAll(/window\.CURRENT_PAGE\s*=\s*/g)];
  if (matches.length !== 1) fail("Entydige produktdata mangler på siden.");
  const start = matches[0].index + matches[0][0].length;
  if (html[start] !== "{") fail("Produktdata er ikke et JSON-objekt.");
  let depth = 0,
    quoted = false,
    escaped = false;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') quoted = false;
    } else if (c === '"') quoted = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) {
      try {
        return JSON.parse(html.slice(start, i + 1));
      } catch {
        fail("Produktdata kunne ikke leses som JSON.");
      }
    }
  }
  fail("Ufullstendige produktdata.");
}
function nodes(value) {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object") return [];
  return [value, ...nodes(value["@graph"])];
}
export function extractMonterPrice(
  html,
  expected,
  checkedAt = new Date().toISOString(),
) {
  const articleNumber = String(expected.monterSku || "");
  if (!/^\d{5,15}$/.test(articleNumber))
    fail("Kontrollert Montér-artikkelnummer mangler.");
  const sourceUrl = productUrl(expected.monterUrl);
  if (!Number.isFinite(Date.parse(checkedAt)))
    fail("Ugyldig kontrolltidspunkt.");
  const page = readCurrentPage(html);
  if (
    String(page.itemNumber) !== articleNumber ||
    productUrl(page.canonicalUrl) !== sourceUrl
  )
    fail("Produktsiden gjelder en annen artikkel eller variant.");
  if (expected.nobb && String(page.nobbNumber) !== String(expected.nobb))
    fail("NOBB-nummeret stemmer ikke med registeret.");
  if (page.discontinued === true || page.isDiscontinuedByBusiness === true)
    fail("Produktet er merket utgått.");
  const sourceUnit = String(page.units?.price?.name || "").toUpperCase();
  const unit = units[sourceUnit];
  const priceFactor = Number(page.units?.price?.multiplicationFactor);
  const salesSourceUnit = String(page.units?.sales?.name || "").toUpperCase();
  const salesUnit = units[salesSourceUnit];
  const salesFactor = Number(page.units?.sales?.multiplicationFactor);
  if (
    !unit ||
    !salesUnit ||
    !Number.isFinite(priceFactor) ||
    priceFactor <= 0 ||
    !Number.isFinite(salesFactor) ||
    salesFactor <= 0
  )
    fail("Pris- eller salgsenhet mangler eller støttes ikke.");
  const products = nodes(page.jsonLd).filter(
    (p) =>
      (Array.isArray(p["@type"])
        ? p["@type"].includes("Product")
        : p["@type"] === "Product") &&
      p.url &&
      productUrl(p.url) === sourceUrl,
  );
  if (products.length !== 1) fail("Entydig strukturert produktpris mangler.");
  const offers = nodes(products[0].offers).filter(
    (o) =>
      o["@type"] === "Offer" && String(o.itemOffered?.sku) === articleNumber,
  );
  if (offers.length !== 1) fail("Entydig tilbud for riktig artikkel mangler.");
  const offer = offers[0];
  if (offer.priceCurrency !== "NOK") fail("Prisen er ikke oppgitt i NOK.");
  if (!/^(?:\d+)(?:\.\d+)?$/.test(String(offer.price)))
    fail("Ugyldig prisformat.");
  const amount = Number(offer.price);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1e9)
    fail("Ugyldig eller ukjent pris.");
  if (
    offer.priceValidUntil &&
    (!Number.isFinite(Date.parse(offer.priceValidUntil)) ||
      Date.parse(offer.priceValidUntil) < Date.parse(checkedAt))
  )
    fail("Den publiserte prisen har passert gyldighetsdatoen.");
  return {
    amount,
    unit,
    currency: "NOK",
    sourceUnit,
    sourceUrl,
    articleNumber,
    checkedAt,
    salesUnit,
    salesSourceUnit,
    priceFactor,
    salesFactor,
    kind: "published-web-price",
    vat: "unconfirmed",
  };
}

/** Explicit unit conversion using factors for this exact variant; never infers package size. */
export function convertPublishedPrice(observation, unit) {
  if (unit === observation.unit) return observation.amount;
  if (unit !== observation.salesUnit) return undefined;
  const amount =
    (observation.amount * observation.salesFactor) / observation.priceFactor;
  return Number.isFinite(amount) && amount > 0
    ? Math.round((amount + Number.EPSILON) * 100) / 100
    : undefined;
}
