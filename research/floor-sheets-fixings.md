# Faktiske gulv, plater og festemidler

Kontrollert 10.11.2026. Dette er et avgrenset, kildekontrollert utvalg fra Montérs nettutvalg, ikke en full sortiments- eller lagerintegrasjon. Ingen priser eller lagerbeholdninger er registrert. `floor-sheets-fixings.json` inneholder ni forslag til registerposter.

## Gulv

| Variant | NOBB / Montér-artikkel | Dokumentert salgspakke | Kilder |
|---|---|---|---|
| OPUS Eik Lyngør 3-stav | 60866742 / 101967044 | 2,84 m²; 14 × 215 × 2200 mm | [Montér](https://www.monter.no/gulv/parkett/parkett-3-stav-eik-lyngor), [variantidentifiserende FDV, 14.05.2026](https://media.bluestonepim.com/9056b428-dfaf-419e-92db-cd75e7ff9831/e0e6491f-dd39-4105-a7e8-69a97707fda2/ZFdvUgSfzeVZeLsRi7GGEFSpM/AXPVsf0GTV1buoqMskKN8eA9D.pdf) |
| Kährs Eik Mist 3-stav | 51901318 / 101202603 | 2,91 m²; 15 × 200 × 2423 mm | [Montér](https://www.monter.no/gulv/parkett/parkett-3-stav-eik-mist), [Kährs produktoversikt, Mist-raden](https://www.kahrs.com/globalassets/kahrs/brochures-and-documents/uk/kahrs-engineered-wood-guide-2025.pdf) |
| Pergo Lillehammer Select Beige Oak L0344-04750 | 56131180 / 101256441 | 2,048 m²; 7 bord; 9 × 212 × 1380 mm | [Montér](https://www.monter.no/gulv/laminat/pergo-laminatgulv-lillehammer-select-beige-oak), [Pergo sortimentsoversikt](https://pro.pergo.no/-/media/imported%20assets/flooring/2/f/6/pglmpb2b%20brochurespreadnopdf288042.ashx?filename=Brosjyre+Pergo+Laminat+B2B.pdf&rev=4ad15f65ce254cd38b49655fba29152e&type=original) |
| Pergo Trondheim Fresh Nordic Oak L0361-06399 | 60043223 / 101429877 | 2,595 m²; 6 bord; 9,5 × 211 × 2050 mm | [Montér](https://www.monter.no/gulv/laminat/laminatgulv-trondheim-fresh-nordic-oak), [Pergo sortimentsoversikt](https://pro.pergo.no/-/media/imported%20assets/flooring/2/f/6/pglmpb2b%20brochurespreadnopdf288042.ashx?filename=Brosjyre+Pergo+Laminat+B2B.pdf&rev=4ad15f65ce254cd38b49655fba29152e&type=original) |

Montér angir faktisk bestillingsenhet `pak` for disse fire, selv om listepris i kategorivisning kan være per m². Derfor er `unit=pk` riktig. De mer presise Pergo-pakningsarealene beholdes fra produsenten fremfor avrundede kjøpsfelt. Trondheim Pro har et annet variantnummer og NOBB. Ikke overfør Pro-egenskaper til registrert L0361-variant. Antall bord for OPUS/Kährs er ikke kontrollert og er utelatt. Kährs-butikkens øvrige tekniske klasser er ikke ukritisk overført.

## Plater

| Variant | NOBB / Montér-artikkel | Grunnlag |
|---|---|---|
| Arauco A/C furu 12 × 1220 × 2440 mm | 51448562 / 101116073 | [Eksakt Montér-variant](https://www.monter.no/byggevarer/bygningsplater/kryssfiner/kryssfiner-plate-furu-ac-12x2440x1220-mm), [leverandørens FDV](https://media.bluestonepim.com/9056b428-dfaf-419e-92db-cd75e7ff9831/dfd6382c-76ef-436c-bdc0-9010188a0f6d/WDgkdmZjuXksG1VsyFfJRUjlC/yGOUacs3hq1rFDvsztnz8wQDW.pdf) |
| Arauco A/C furu 15 × 1220 × 2440 mm | 51448577 / 101116074 | [Eksakt Montér-variant](https://www.monter.no/byggevarer/bygningsplater/kryssfiner/kryssfiner-plate-furu-ac-15x2440x1220-mm), samme leverandør-FDV |
| OSB 3 TG2 15 × 1198 × 2397 mm | 43116901 / 101131548 | [Eksakt Montér-variant](https://www.monter.no/byggevarer/bygningsplater/osb-plater/osb-plate-3-tg2-15x2397x1198-mm), [generell leverandør-FDV](https://media.bluestonepim.com/9056b428-dfaf-419e-92db-cd75e7ff9831/4b2f8073-c09d-486a-9176-b5fb5f3a5e13/7WVDOwtsj3PJwvWe7wa3KHEZh/GCDmOUEAlRmgyvP22AaVQM4WS.pdf) |

Montér selger én plate (`pla`) om gangen, normalisert til `stk` med `piecesPerPack=1`. Arauco-sidene oppgir skarpkant på alle fire sider; dekkmål er dermed plateformatet. Nettstedets bredde/lengde-tabell er byttet om mot formatteksten, så registeret bruker den lengste siden som lengde. Ikke bruk avrundet 2,98 m² fra kjøpsfeltet som eksakt geometrisk areal. OSB har ukontrollert not/fjær-dekkmål og får derfor ingen `coverWidth`/`coverLength`. Generell FDV nevner Kronospan, mens butikkmerket er Optimera; ukjent produsent er tomt. Mengdeberegning må kreve dokumenterte dekkmål før OSB brukes.

## Festemidler

| Variant | NOBB / Montér / produsent / GTIN | Pakning |
|---|---|---|
| fischer FSN-TP 3,5 × 32 mm | 40131120 / 101137009 / 040595 / 4006209405956 | 1000 stk |
| fischer FSN-TP 3,5 × 45 mm | 40131138 / 101137010 / 040596 / 4006209405963 | 500 stk |

[Produsentens gjeldende varianttabell](https://www.fischernorge.no/nn-no/products/skruer/gipsskruer/gipsskruer-for-reisverk-i-tre/fsn-tp), [Montér 32 mm](https://www.monter.no/festemidler/skruer/gipsskruer/gipsskrue-til-tre-ph2-elforsinket-35x32-mm-1000-stk), [Montér 45 mm](https://www.monter.no/festemidler/skruer/gipsskruer/gipsskrue-til-tre-ph2-elforsinket-35x45-mm-500-stk).

Begge er løse, elforsinkede PH2-skruer for gips mot tre; ikke båndvarianter eller gipsplugger for oppheng. Diameter lagres i `width`, som i eksisterende skrueposter. Forbruk per m² eller mønster er ikke lagt inn og må dokumenteres separat.

## Utelatelser og begrensninger

- Flere søketreff, blant annet Simpson 3,9 × 75 og Fermacell 250-pakken, viste ved åpning at varen ikke lenger inngår i sortimentet. De er ikke tatt med.
- OPUS eldre parkett «3-stav eik» og Kährs Stratus var merket utgående og er ikke valgt.
- Eksterne PDF-lenker er dokumentinnganger, ikke en garanti for offlineinnhold. To forsøkte dokumentlenker for MDF/Kährs ga cachefeil; ingen ukjent tekst fra dem er brukt. Kährs format/pakningsareal støttes i stedet av produsentens tilgjengelige oversikt.
- `verified=true` gjelder bare listen i hver posts `verifiedFields`; det er ingen konstruksjonsgodkjenning eller bekreftelse av lokal tilgjengelighet.
