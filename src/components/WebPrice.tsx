import type { Product } from "../lib/types";
import { money } from "../lib/types";
import { priceTime, webPriceFor } from "../lib/prices";
import type { PriceFeed, WebPrice as Quote } from "../lib/prices";
export function WebPrice({
  product,
  feed,
  onUse,
}: {
  product: Product;
  feed: PriceFeed | null;
  onUse?: (q: Quote) => void;
}) {
  const quote = webPriceFor(product, feed);
  const attempt = feed?.entries.find(
    (e) =>
      e &&
      typeof e === "object" &&
      (e as { productId?: string }).productId === product.id,
  ) as { checkedAt?: string; message?: string } | undefined;
  if (!quote)
    return (
      <div className="web-price">
        <strong>Kontrollert nettpris utilgjengelig</strong>
        <small>
          {attempt?.message?.includes("utgått")
            ? "Nettkilden merker varianten som utgått. Avklar tilgjengelighet før bestilling."
            : "Ingen fersk pris for denne varianten. Åpne Montér-kilden eller registrer en kjent pris manuelt."}
        </small>
        {attempt?.checkedAt &&
          Number.isFinite(Date.parse(attempt.checkedAt)) && (
            <small>Siste kontrollforsøk {priceTime(attempt.checkedAt)}</small>
          )}
      </div>
    );
  return (
    <div className="web-price">
      <span className="eyebrow">PUBLISERT NETTPRIS · NOK</span>
      <strong>
        {money(quote.amount)} / {quote.unit}
      </strong>
      {quote.unit !== quote.salesUnit && (
        <span>
          {money(quote.salesAmount)} / {quote.salesUnit} etter kildens
          enhetsfaktor
        </span>
      )}
      <small>
        Kontrollert {priceTime(quote.checkedAt)} · sjekkes normalt hver 6. time
      </small>
      <small>
        Butikk-/kundepris og mva-status er ikke bekreftet. Kontroller ved salg.
      </small>
      <div className="customer-actions">
        <a
          className="text-link"
          href={quote.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          Kontroller hos Montér
        </a>
        {onUse && (
          <button className="secondary" onClick={() => onUse(quote)}>
            Bruk denne nettprisen
          </button>
        )}
      </div>
    </div>
  );
}
