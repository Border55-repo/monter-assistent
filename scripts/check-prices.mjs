import { readFile, writeFile } from "node:fs/promises";
import {
  extractMonterPrice,
  convertPublishedPrice,
} from "./lib/monter-price.mjs";
const targets = JSON.parse(
  await readFile(new URL("./price-targets.json", import.meta.url), "utf8"),
);
const entries = [];
for (const target of targets) {
  const checkedAt = new Date().toISOString();
  try {
    const response = await fetch(target.monterUrl, {
      signal: AbortSignal.timeout(20000),
      redirect: "error",
      headers: {
        "User-Agent":
          "MonterAssistentPriceCheck/1.0 (+https://github.com/Border55-repo/monter-assistent)",
      },
    });
    if (!response.ok)
      throw new Error(`Kildesiden svarte HTTP ${response.status}.`);
    const observation = extractMonterPrice(
      await response.text(),
      target,
      checkedAt,
    );
    const salesAmount = convertPublishedPrice(observation, target.unit);
    if (salesAmount === undefined || observation.salesUnit !== target.unit)
      throw new Error("Salgsenheten stemmer ikke med registeret.");
    entries.push({
      ...observation,
      productId: target.id,
      salesAmount,
      status: "ok",
    });
    console.log(
      `${target.monterSku}: kontrollert (${observation.unit} -> ${target.unit})`,
    );
  } catch (error) {
    entries.push({
      productId: target.id,
      articleNumber: target.monterSku,
      sourceUrl: target.monterUrl,
      checkedAt,
      status: "unavailable",
      message: error.message,
    });
    console.log(`${target.monterSku}: pris utilgjengelig (${error.message})`);
  }
  await new Promise((resolve) => setTimeout(resolve, 300));
}
const feed = {
  version: 1,
  checkedAt: new Date().toISOString(),
  intervalHours: 6,
  entries,
};
await writeFile(
  new URL("../public/prices.json", import.meta.url),
  JSON.stringify(feed, null, 2) + "\n",
);
console.log(
  `${entries.filter((e) => e.status === "ok").length}/${targets.length} priser kontrollert. Feil vises som ukjent pris, aldri som null.`,
);
