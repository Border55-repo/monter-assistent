import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { seedProducts } from "../../src/lib/seed";
import { readFile, writeFile } from "node:fs/promises";
const basePath = process.env.VITE_BASE_PATH || "/";
const go = async (page: Page, hash = "/") => {
  await page.goto(basePath + "#" + hash);
  await expect(
    page.getByRole("heading", { name: "Montér Assistent", exact: true }),
  ).toHaveCount(0);
};
const calc = async (page: Page, kind: string) => {
  await go(page, "/calc/" + kind);
  await expect(
    page.getByText("MATERIALBEREGNING", { exact: true }),
  ).toBeVisible();
};
const selectGlava = async (page: Page) => {
  await page
    .getByLabel("Velg produkt", { exact: true })
    .selectOption("glava-50673624");
};

test("trelastvarene er synlige på mobil også etter oppgradering av eldre register", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await go(page);
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("monter-assistent", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const transaction = database.transaction("app", "readwrite");
    const store = transaction.objectStore("app");
    const request = store.get("data");
    request.onsuccess = () => {
      const data = request.result;
      data.products = data.products.filter((p: { category: string }) => p.category !== "timber");
      data.catalogRevision = 1;
      store.put(data, "data");
    };
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  });
  await calc(page, "timber");
  const choices = page.getByRole("group", { name: "Trelastvarer", exact: true });
  await expect(choices.getByRole("button")).toHaveCount(4);
  await expect(page.getByLabel("Velg produkt", { exact: true }).locator("option")).toHaveCount(5);
  const first = choices.getByRole("button", { name: "Velg Lida Timber konstruksjonsvirke C24 gran 48 × 98 × 4800 mm", exact: true });
  await expect(first).toBeVisible();
  await first.click();
  await expect(first).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Tykkelse virke", { exact: true })).toHaveValue("48");
  await expect(page.getByLabel("Dybde virke", { exact: true })).toHaveValue("98");
  await expect(page.getByLabel("Handelslengde", { exact: true })).toHaveValue("4.8");
  await expect(page.getByLabel("Handelslengde", { exact: true })).toBeDisabled();
  await choices.getByRole("button", { name: "Velg Lida Timber konstruksjonsvirke C24 gran 48 × 98 × 4200 mm", exact: true }).click();
  await expect(page.getByLabel("Handelslengde", { exact: true })).toHaveValue("4.2");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator(".product-choice").screenshot({ path: "test-results/timber-products.png", animations: "disabled" });
  await page.reload();
  await expect(page.getByLabel("Velg produkt", { exact: true })).toHaveValue("monter-101131438");
});

test("samlet søk finner varenummer og lagret vareplassering på mobil", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await go(page);
  await page
    .getByRole("button", { name: "Åpne samlet søk", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Søk i hele appen", exact: true })
    .pressSequentially("101186758");
  await page
    .getByRole("button", { name: /GLAVA Proff 34 Plate 100 mm/ })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Plassering ikke registrert",
  );
  await page.getByRole("button", { name: "Endre vareplassering" }).click();
  await page.getByLabel("Område", { exact: true }).pressSequentially("Utehall");
  await page.getByLabel("Reol", { exact: true }).fill("B12");
  await page.getByLabel("Fag / hylle", { exact: true }).fill("3");
  await page
    .getByRole("button", { name: "Lagre plassering", exact: true })
    .click();
  await page.reload();
  await page
    .getByRole("button", { name: "Åpne samlet søk", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Søk i hele appen", exact: true })
    .fill("B12");
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: /GLAVA Proff 34 Plate 100 mm/ }),
  ).toContainText("Utehall");
  await page.screenshot({
    path: "test-results/mobile-search.png",
    animations: "disabled",
  });
});
test("prosjektstatus og neste steg bevares og kan filtreres", async ({
  page,
}) => {
  await go(page, "/projects");
  await page
    .getByRole("button", { name: "Nytt prosjekt", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Prosjektnavn", { exact: true }).fill("Bod vegger");
  await dialog
    .getByRole("button", { name: "Opprett prosjekt", exact: true })
    .click();
  await page
    .getByLabel("Arbeidsstatus", { exact: true })
    .selectOption("clarify");
  await page
    .getByLabel("Neste steg / arbeidsnotat", { exact: true })
    .pressSequentially("Kontroller handelslengder");
  await expect(
    page.getByLabel("Neste steg / arbeidsnotat", { exact: true }),
  ).toHaveValue("Kontroller handelslengder");
  await page
    .getByRole("button", { name: "Lagre arbeidsnotat", exact: true })
    .click();
  await expect(
    page.getByText("Arbeidsnotatet er lagret.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByLabel("Vis prosjektstatus", { exact: true })
    .selectOption("clarify");
  await expect(page.locator(".project-card")).toContainText(
    "Kontroller handelslengder",
  );
  await page
    .getByLabel("Vis prosjektstatus", { exact: true })
    .selectOption("done");
  await expect(page.locator(".project-card")).toHaveCount(0);
});
test("kundehjelp knytter avklaringer til fagguide og kalkulator", async ({
  page,
}) => {
  await go(page, "/customer");
  await page
    .getByRole("button", { name: /Kunden skal bygge terrasse/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Avklar før beregning" }),
  ).toBeVisible();
  await page.getByRole("checkbox").first().check();
  await expect(page.getByText(/1 av 4 avklart/)).toBeVisible();
  await page
    .getByRole("button", { name: "Åpne fagguide", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Fuge, bjelker og innfesting",
  );
  await page.getByRole("button", { name: "Lukk dialog" }).click();
  await page.getByRole("button", { name: "Kundehjelp", exact: true }).click();
  await expect(page.getByRole("checkbox").first()).toBeChecked();
  await page
    .getByRole("button", { name: "Nullstill for neste kunde", exact: true })
    .click();
  await expect(page.getByRole("checkbox").first()).not.toBeChecked();
  await page.screenshot({
    path: "test-results/customer-help.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Terrasse", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Terrasse", exact: true }),
  ).toBeVisible();
});
test("flere ulike vegger får egne åpninger og bevares ved redigering", async ({
  page,
}) => {
  await calc(page, "insulation");
  await selectGlava(page);
  await page
    .getByRole("button", { name: "Flere ulike vegger", exact: true })
    .click();
  await page.getByLabel("Lengde vegg 1", { exact: true }).fill("5");
  await page.getByLabel("Høyde vegg 1", { exact: true }).fill("2,4");
  await page
    .getByRole("button", { name: "Legg til vegg", exact: true })
    .click();
  await page.getByLabel("Lengde vegg 2", { exact: true }).fill("4");
  await page
    .getByRole("region", { name: "Vegg 1", exact: true })
    .getByRole("button", { name: "Legg til åpning", exact: true })
    .click();
  await page.getByLabel("Bredde åpning 1 vegg 1", { exact: true }).fill("1");
  await page.getByLabel("Høyde åpning 1 vegg 1", { exact: true }).fill("2");
  await expect(page.locator(".primary-result")).toContainText("3");
  await page.screenshot({
    path: "test-results/multiple-walls.png",
    fullPage: true,
    animations: "disabled",
  });
  await page
    .getByRole("button", { name: "Legg til i materialliste", exact: true })
    .click();
  await page
    .getByRole("button", { name: /Rediger beregning Isolasjon · 2 vegger/ })
    .click();
  await expect(page.getByLabel("Lengde vegg 2", { exact: true })).toHaveValue(
    "4",
  );
  await expect(
    page.getByLabel("Høyde åpning 1 vegg 1", { exact: true }),
  ).toHaveValue("2");
});
test("kontrollert nettpris kan brukes eksplisitt uten å erstatte manuell registerpris", async ({
  page,
}) => {
  const p = seedProducts.find((p) => p.id === "glava-50673624")!;
  const now = new Date().toISOString();
  await page.route("**/prices.json", (route) =>
    route.fulfill({
      json: {
        version: 1,
        checkedAt: now,
        entries: [
          {
            productId: p.id,
            articleNumber: p.monterSku,
            sourceUrl: p.monterUrl,
            checkedAt: now,
            status: "ok",
            amount: 108,
            unit: "m²",
            salesAmount: 738.72,
            salesUnit: "pk",
            currency: "NOK",
            vat: "unconfirmed",
          },
        ],
      },
    }),
  );
  await calc(page, "insulation");
  await selectGlava(page);
  await expect(
    page.getByText("PUBLISERT NETTPRIS · NOK", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Bruk denne nettprisen", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Vis flere valg og priser", exact: true })
    .click();
  await expect(page.getByLabel("Pris per pakke", { exact: true })).toHaveValue(
    "738.72",
  );
  await page
    .getByRole("button", { name: "Legg til i materialliste", exact: true })
    .click();
  await expect(page.locator(".material-line")).toContainText(
    "Publisert nettpris",
  );
});
test("arbeidsflate, responsiv mobilvisning og mørk modus", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await go(page);
  await expect(
    page.getByRole("heading", { name: "Klar for neste kunde." }),
  ).toBeVisible();
  await expect(page.locator(".home-calcs .calc-card")).toHaveCount(8);
  await expect(page.getByText("Klar uten nett", { exact: true })).toBeVisible();
  await page.screenshot({
    path: "test-results/desktop-home.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Bytt til mørk modus" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({
    path: "test-results/desktop-dark.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Bytt til lys modus" }).click();
  await page.screenshot({
    path: "test-results/mobile-home.png",
    fullPage: true,
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("navigation", { name: "Mobilmeny" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Åpne navigasjon" }).click();
  await expect(
    page.getByRole("navigation", { name: "Hovedmeny" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("GLAVA 42 m² bruker dokumentert pakningsdekning, lagrer og eksporterer PDF", async ({
  page,
}) => {
  await calc(page, "insulation");
  await selectGlava(page);
  await page.getByLabel("Registrer mål som").selectOption("area");
  await page.getByLabel("Areal per flate", { exact: true }).fill("42");
  await expect(
    page.getByLabel("Dekning per pakke", { exact: true }),
  ).toHaveValue("6.84");
  await expect(
    page.getByLabel("Dekning per pakke", { exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".primary-result")).toContainText("7");
  await page
    .getByRole("button", { name: "Vis flere valg og priser", exact: true })
    .click();
  await page.getByLabel("Pris per pakke", { exact: true }).fill("100");
  await expect(page.locator(".result-cost")).toContainText("700");
  await page.getByRole("button", { name: "Legg til i materialliste" }).click();
  await expect(
    page.getByRole("heading", { name: "Materialliste", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".material-line")).toHaveCount(1);
  await expect(page.locator(".material-line")).toContainText(
    "GLAVA Proff 34 Plate 100 mm",
  );
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Eksporter PDF" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/\.pdf$/);
  const content = await readFile((await file.path())!);
  expect(content.subarray(0, 5).toString()).toBe("%PDF-");
  expect(content.length).toBeGreaterThan(3000);
  await page.screenshot({
    path: "test-results/project-materials.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.reload();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Prosjekter", exact: false })
    .click();
  await page.getByRole("button", { name: "Åpne materialliste" }).click();
  await expect(page.locator(".material-line")).toContainText("7");
});

test("enkel mobilflyt har produkt først, hurtigvalg og snarvei til materialliste", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await calc(page, "insulation");
  const productTop = await page
    .getByLabel("Velg produkt", { exact: true })
    .evaluate((el) => el.getBoundingClientRect().top);
  const measureTop = await page
    .getByLabel("Lengde", { exact: true })
    .evaluate((el) => el.getBoundingClientRect().top);
  expect(productTop).toBeLessThan(measureTop);
  await expect(
    page.getByLabel("Stenderavstand c/c", { exact: true }),
  ).toBeHidden();
  await page
    .getByRole("button", {
      name: "Velg GLAVA Proff 34 Plate 100 mm",
      exact: true,
    })
    .click();
  await page.getByLabel("Registrer mål som").selectOption("area");
  await page.getByLabel("Areal per flate", { exact: true }).fill("42");
  await expect(page.locator(".mobile-result-shortcut")).toContainText("7 pk");
  await page.getByRole("button", { name: "Vis resultat", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Legg til i materialliste" }),
  ).toBeInViewport();
  await page.screenshot({
    path: "test-results/mobile-simple-result.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Legg til i materialliste" }).click();
  await expect(
    page.getByRole("button", {
      name: "Legg til flere materialer",
      exact: true,
    }),
  ).toBeVisible();
});

test("dialoger beholder skrivefokus og godtar desimalkomma ved tastetrykk", async ({
  page,
}) => {
  await go(page, "/projects");
  await page
    .getByRole("button", { name: "Nytt prosjekt", exact: true })
    .click();
  const title = page.getByLabel("Prosjektnavn", { exact: true });
  await title.pressSequentially("Enkel garasje", { delay: 15 });
  await expect(title).toHaveValue("Enkel garasje");
  await expect(title).toBeFocused();
  await page
    .getByRole("dialog", { name: "Opprett prosjekt", exact: true })
    .getByRole("button", { name: "Opprett prosjekt", exact: true })
    .click();
  await page.getByRole("button", { name: "Endre navn", exact: true }).click();
  const rename = page.getByLabel("Nytt prosjektnavn", { exact: true });
  await rename.fill("");
  await rename.pressSequentially("Garasje med isolasjon", { delay: 15 });
  await expect(rename).toBeFocused();
  await page.getByRole("button", { name: "Lagre navn", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Garasje med isolasjon", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Legg til linje", exact: true })
    .click();
  await page
    .getByLabel("Produktnavn på linje", { exact: true })
    .pressSequentially("Tilleggsmateriale", { delay: 10 });
  const quantity = page.getByLabel("Mengde", { exact: true });
  await quantity.fill("");
  await quantity.pressSequentially("2,5", { delay: 20 });
  await expect(quantity).toHaveValue("2,5");
  await expect(quantity).toBeFocused();
  const price = page.getByLabel("Manuell enhetspris", { exact: true });
  await price.pressSequentially("100,50", { delay: 20 });
  await expect(price).toHaveValue("100,50");
  await page
    .getByRole("button", { name: "Lagre materiallinje", exact: true })
    .click();
  await expect(page.locator(".line-qty")).toContainText("2,5");
  await expect(page.locator(".line-price")).toContainText("251,25");
});
test("inndata, favoritter, åpninger og skisse bevares ved navigasjon", async ({
  page,
}) => {
  await calc(page, "insulation");
  await selectGlava(page);
  await page.getByLabel("Lengde", { exact: true }).fill("10");
  await page.getByRole("button", { name: "Legg til", exact: true }).click();
  await page.getByLabel("Fra venstre", { exact: true }).fill("1");
  await expect(page.getByRole("img", { name: /Flateskisse/ })).toBeVisible();
  await page.getByRole("button", { name: "Fjern favoritt" }).click();
  await page
    .getByRole("button", { name: "Alle kalkulatorer", exact: true })
    .click();
  await page
    .locator(".calculator-grid")
    .getByRole("button", { name: /GLAVA & isolasjon/ })
    .click();
  await expect(page.getByLabel("Lengde", { exact: true })).toHaveValue("10");
  await expect(page.getByLabel("Fra venstre", { exact: true })).toHaveValue(
    "1",
  );
  await expect(
    page.getByRole("button", { name: "Legg til favoritt" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Lengde", { exact: true })).toHaveValue("10");
  await page.getByLabel("Bredde", { exact: true }).fill("100");
  await expect(page.locator(".result-incomplete")).toContainText("Åpninger");
  await expect(
    page.getByRole("button", { name: "Legg til i materialliste" }),
  ).toHaveCount(0);
});
test("redigering erstatter eksisterende beregning uten doble materiallinjer", async ({
  page,
}) => {
  await calc(page, "timber");
  await page.getByRole("button", { name: "Legg til i materialliste" }).click();
  await page.getByRole("button", { name: /Rediger beregning Trelast/ }).click();
  await page.getByLabel("Lengde", { exact: true }).fill("10");
  await page.getByRole("button", { name: "Oppdater beregning" }).click();
  await expect(page.locator(".saved-calculation")).toHaveCount(1);
  await expect(page.locator(".material-line")).toHaveCount(1);
  await expect(page.locator(".saved-calculation")).toContainText("10 × 2,4");
  await page.getByRole("button", { name: /Rediger materiallinje/ }).click();
  await page.getByLabel("Mengde", { exact: true }).fill("25");
  await page.getByLabel("Manuell enhetspris").fill("100");
  await page.getByRole("button", { name: "Lagre materiallinje" }).click();
  await expect(page.locator(".line-qty")).toContainText("25");
  await expect(page.locator(".line-price")).toContainText(
    "2 500".replace(" ", "\u00a0"),
  );
  await page.getByRole("button", { name: "Kopier prosjekt" }).click();
  await expect(page.getByRole("heading", { name: /– kopi/ })).toBeVisible();
  await expect(page.locator(".material-line")).toHaveCount(1);
  await page.getByRole("button", { name: "Kundevisning", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Rediger materiallinje/ }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Eksporter PDF" }),
  ).toBeVisible();
});
test("flere rom, terrasse og øvrige kalkulatorer gir resultater", async ({
  page,
}) => {
  await calc(page, "flooring");
  await page.getByLabel("Dekning per gulvpakke").fill("2,048");
  await page.getByRole("button", { name: "Legg til rom" }).click();
  await page.getByLabel("Romlengde", { exact: true }).nth(1).fill("3");
  await page.getByLabel("Rombredde", { exact: true }).nth(1).fill("3");
  await expect(page.locator(".result-metrics")).toContainText("29");
  await calc(page, "deck");
  await expect(page.locator(".primary-result")).toContainText("24");
  await expect(page.locator(".result-metrics")).toContainText("726");
  await page.getByLabel("Leggeretning").selectOption("width");
  await expect(page.locator(".result-metrics")).toContainText("49");
  await calc(page, "sheets");
  await page
    .getByLabel("Velg produkt", { exact: true })
    .selectOption("norgips-10397701");
  await expect(page.getByLabel("Nominell platelengde")).toBeDisabled();
  await expect(page.locator(".primary-result")).toContainText("7");
  await calc(page, "cladding");
  await page.getByLabel("Faktisk dekkbredde", { exact: true }).fill("125");
  await expect(page.locator(".primary-result")).toContainText("32");
  await page.getByLabel("Kledningssystem").selectOption("overunder");
  await expect(page.locator(".primary-result")).toContainText("17");
  await calc(page, "fixings");
  await page
    .getByLabel("Velg produkt", { exact: true })
    .selectOption("essve-43845037");
  await page.getByLabel("Areal", { exact: true }).fill("28");
  await page.getByLabel("Forbruk per m²").fill("20");
  await page
    .getByLabel("Kilde / innfestingsmønster")
    .fill("Oppgitt prosjektforbruk fra kontrollert system");
  await expect(page.locator(".primary-result")).toContainText("3");
});
test("produktregister oppretter, oppdaterer, importerer og eksporterer", async ({
  page,
}) => {
  await go(page, "/products");
  await expect(page.locator("tbody tr")).toHaveCount(seedProducts.length);
  await page.getByRole("button", { name: "Nytt produkt" }).click();
  await page
    .getByLabel("Produktnavn", { exact: true })
    .fill("Lokalt testprodukt");
  await page.getByLabel("Produsent", { exact: true }).fill("Testprodusent");
  await page.getByLabel("Dekning per salgsenhet").fill("3,5");
  await page
    .getByRole("button", { name: "Lagre produkt", exact: true })
    .click();
  await expect(page.locator("tbody tr")).toHaveCount(seedProducts.length + 1);
  await page.getByLabel("Søk i produkter").fill("Lokalt testprodukt");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Rediger Lokalt testprodukt", exact: true })
    .click();
  await page.getByLabel("Produktet er aktivt").uncheck();
  await page
    .getByRole("button", { name: "Lagre produkt", exact: true })
    .click();
  await expect(page.locator("tbody tr")).toHaveCount(0);
  await page.getByLabel("Vis deaktiverte").check();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByLabel("Søk i produkter").fill("");
  await page.locator("input[type=file]").setInputFiles({
    name: "produkter.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "name;category;unit;coverage;manufacturer\nImportert isolasjon;insulation;pk;6,84;Testprodusent",
    ),
  });
  await expect(
    page.getByRole("dialog", { name: "Kontroller importen" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Importer 1 produkter", exact: true })
    .click();
  await expect(page.locator("tbody tr")).toHaveCount(seedProducts.length + 2);
  await page.locator("input[type=file]").setInputFiles({
    name: "feil.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("name;category;unit;coverage\nFeil;insulation;pk;-5"),
  });
  await expect(page.getByRole("status")).toContainText(
    "Eksisterende produkter er beholdt",
  );
  await expect(page.locator("tbody tr")).toHaveCount(seedProducts.length + 2);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Eksporter", exact: true }).click();
  const f = await download;
  const text = await readFile((await f.path())!, "utf8");
  expect(text).toContain("Importert isolasjon");
  expect(text).toContain("50673624");
});
test("fagguide, produktkilder og hurtigverktøy er tilgjengelige", async ({
  page,
}) => {
  await go(page, "/assistant");
  await page.getByLabel("Søk i produktassistent").fill("OSB");
  await page.getByRole("button", { name: /OSB eller MDF/ }).click();
  await expect(page.getByRole("dialog")).toContainText("Begrensninger");
  await expect(page.getByRole("link", { name: /EGGER/ })).toHaveAttribute(
    "href",
    /egger\.com/,
  );
  await page.getByRole("button", { name: "Lukk dialog" }).click();
  await go(page, "/products");
  await page.getByLabel("Søk i produkter").fill("50673624");
  await page
    .locator(".table-product")
    .filter({ hasText: "GLAVA Proff 34 Plate 100 mm" })
    .click();
  await expect(page.getByRole("dialog")).toContainText("101186758");
  await expect(page.getByRole("dialog")).toContainText("Mangler:");
  await expect(
    page.getByRole("link", { name: "Produktkilde" }),
  ).toHaveAttribute(
    "href",
    "https://www.glava.no/produkter/glava-proff-34-plate",
  );
  await go(page, "/quick");
  await expect(page.locator(".primary-result")).toContainText("7");
  await page
    .getByRole("button", { name: "Volum og liter", exact: true })
    .click();
  await expect(page.locator(".quick-result")).toContainText("0,02258");
});
test("mobilkalkulator har lesbare felter og ingen horisontal overflyt", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await calc(page, "insulation");
  await selectGlava(page);
  await page.getByRole("button", { name: "Legg til", exact: true }).click();
  await page.getByLabel("Fra venstre").fill("1");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/mobile-calculator.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Legg til i materialliste" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/mobile-project.png",
    fullPage: true,
    animations: "disabled",
  });
});
test("sikkerhetskopi kan lastes ned og gjenopprettes med prosjekter", async ({
  page,
}) => {
  await calc(page, "timber");
  await page.getByRole("button", { name: "Legg til i materialliste" }).click();
  await go(page, "/settings");
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Last ned sikkerhetskopi", exact: true })
    .click();
  const f = await download;
  const file = (await f.path())!;
  const data = JSON.parse(await readFile(file, "utf8"));
  expect(data.schemaVersion).toBe(1);
  expect(data.projects).toHaveLength(1);
  await page.locator("input[type=file]").setInputFiles(file);
  await expect(
    page.getByRole("dialog", { name: "Gjenopprett sikkerhetskopi?" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Erstatt med sikkerhetskopien" })
    .click();
  await go(page, "/projects");
  await expect(
    page.getByRole("button", { name: "Åpne materialliste" }),
  ).toHaveCount(1);
});
test("PWA har gyldig manifest, ikoner og fungerer etter offline omlasting", async ({
  page,
  context,
  request,
}) => {
  const manifest = await (
    await request.get(basePath + "manifest.webmanifest")
  ).json();
  expect(manifest.display).toBe("standalone");
  for (const icon of manifest.icons)
    expect((await request.get(icon.src)).status()).toBe(200);
  await calc(page, "insulation");
  await selectGlava(page);
  await page.getByLabel("Lengde", { exact: true }).fill("12");
  await expect(page.getByText("Klar uten nett", { exact: true })).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener("controllerchange", resolve, {
          once: true,
        }),
      );
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByLabel("Lengde", { exact: true })).toHaveValue("12");
  await expect(page.getByLabel("Velg produkt", { exact: true })).toHaveValue(
    "glava-50673624",
  );
  await page.getByLabel("Lengde", { exact: true }).fill("10");
  await expect(page.locator(".primary-result")).toContainText("4");
  await page.getByRole("button", { name: "Legg til i materialliste" }).click();
  await expect(page.locator(".material-line")).toHaveCount(1);
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Eksporter PDF" }).click();
  expect((await dl).suggestedFilename()).toMatch(/pdf$/);
  await context.setOffline(false);
});
test("en faktisk serviceworkeroppdatering bevarer prosjekter og produktdata", async ({
  page,
}) => {
  await calc(page, "timber");
  await page.getByRole("button", { name: "Legg til i materialliste" }).click();
  await expect(page.getByText("Klar uten nett", { exact: true })).toBeVisible();
  const path = "dist/sw.js",
    original = await readFile(path, "utf8"),
    htmlPath = "dist/index.html",
    originalHtml = await readFile(htmlPath, "utf8");
  try {
    await writeFile(htmlPath, originalHtml.replace(/<title>.*?<\/title>/, "<title>Oppdatert appskall</title>"));
    await writeFile(path, original + "\n// E2E version " + Date.now());
    await page.evaluate(async () => {
      const r = await navigator.serviceWorker.getRegistration();
      await r!.update();
    });
    await expect(
      page.getByRole("button", { name: "Oppdater app", exact: true }),
    ).toBeVisible();
    await Promise.all([
      page.waitForEvent("load"),
      page.getByRole("button", { name: "Oppdater app", exact: true }).click(),
    ]);
    await expect(page).toHaveTitle("Oppdatert appskall");
    await go(page, "/projects");
    await expect(
      page.getByRole("button", { name: "Åpne materialliste" }),
    ).toHaveCount(1);
    await go(page, "/products");
    await expect(page.locator("tbody tr")).toHaveCount(seedProducts.length);
  } finally {
    await writeFile(path, original);
    await writeFile(htmlPath, originalHtml);
  }
});
