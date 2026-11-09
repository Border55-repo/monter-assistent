# Produktdatakilder

Kontrollert 09.11.2026. Produktene finnes i `src/lib/seed.ts`; ved første oppstart kopieres de til brukerens redigerbare IndexedDB-register. Senere appoppdateringer erstatter ikke det lokale registeret. Pris og lagerstatus mangler for alle medfølgende produkter.

## Registerets dokumenterte varianter

| Produkt                         | Tykkelse × bredde × lengde, mm | Stk/pk | m²/pk | NOBB     | Produsentnr. | Montér-artikkel  |
| ------------------------------- | -----------------------------: | -----: | ----: | -------- | ------------ | ---------------- |
| GLAVA Proff 34 Plate            |                50 × 560 × 1200 |     20 | 13,44 | 50673961 | 382050       | 101186783        |
| GLAVA Proff 34 Plate            |                70 × 570 × 1200 |     14 |  9,58 | 50673976 | 382070       | 101186784        |
| GLAVA Proff 34 Plate            |               100 × 570 × 1200 |     10 |  6,84 | 50673624 | 382100       | 101186758        |
| GLAVA Proff 34 Plate            |               150 × 570 × 1200 |      6 |  4,10 | 50673632 | 382150       | 101186759        |
| GLAVA Proff 34 Plate            |               200 × 570 × 1200 |      5 |  3,42 | 50673658 | 382200       | Ikke kontrollert |
| GLAVA Proff 34 Plate            |               250 × 570 × 1200 |      4 |  2,74 | 50673677 | 382250       | 101186761        |
| GLAVA Proff 34 Rull             |               100 × 570 × 4700 |      2 |  5,36 | 50673613 | 380100       | Ikke kontrollert |
| Hunton Nativo Plate, trestender |               100 × 565 × 1220 |      4 |  2,76 | 55406733 | 9901         | Ikke kontrollert |

Platekilde: [GLAVA varianttabell](https://www.glava.no/produkter/glava-proff-34-plate). Rullkilde: [GLAVA rulltabell](https://www.glava.no/produkter/glava-proff-34-rull). Trefiberkilde: [Hunton varianttabell](https://www.hunton.no/produkter/vegg/hunton-nativo_trefiberisolasjon-plater/).

Montér-varianter: [50 mm](https://www.monter.no/byggevarer/isolasjon/isolasjonsplater/isolasjon-proff-34-plate-50x560x1200-mm-20-stk), [70 mm](https://www.monter.no/byggevarer/isolasjon/isolasjonsplater/isolasjon-proff-34-plate-70x570x1200-mm-14-stk), [100 mm](https://www.monter.no/byggevarer/isolasjon/isolasjonsplater/isolasjon-proff-34-plate-100x570x1200-mm-10-stk), [150 mm](https://www.monter.no/byggevarer/isolasjon/isolasjonsplater/isolasjon-proff-34-plate-150x570x1200-mm-6-stk), [250 mm](https://www.monter.no/byggevarer/isolasjon/isolasjonsplater/isolasjon-proff-34-plate-250x570x1200-mm-4-stk).

| Øvrig produkt                                            | Dokumentert grunnlag                                               | Identifikatorer                                   | Kilde                                                                                                                                                                                 |
| -------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Norgips Standard 12,5 × 1200 × 2400 mm                   | Montér selger én plate, 2,88 m². Dekkende mål 1200 × 2400 mm.      | NOBB 10397701; produsent 636334; Montér 101100133 | [Norgips](https://norgips.no/produkter/gipsplater/gipsplate-standard-13), [Montér](https://www.monter.no/byggevarer/bygningsplater/gips/gipsplate-standard-125-x-1200-x-2400-mm)      |
| ESSVE Terrasseskrue Classic 4,2 × 55 A2                  | 250 stk per pakke, TX20, A2                                        | Art. 640555; NOBB 43845037; EAN 7317761124429     | [ESSVE](https://essve.com/no/produkter/bygg-og-treskrue/terrasseskrue/toppskruet-terrasseskrue/classic/terrasseskrue-classic-rustfritt-stal-a2/terrasseskrue-classic-4-2x55-a2-250-2) |
| SCA Wood impregnert furu terrassebord 28 × 120 × 4800 mm | Én variant, 4,80 lm/stk. Nettstedet oppgir minstebestilling 10 lm. | NOBB 48982935; Montér 101198715                   | [Montér](https://www.monter.no/trelast/terrassebord/impregnert-terrassebord/terrassebord-impregnert-furu-28x120x4800-mm)                                                              |

## Feltnivå og mangler

Hver post har `verifiedFields`, kilde og dato. `verified` betyr at feltene i listen er kontrollert; andre felt er ikke dermed bekreftet. Det finnes ingen garanti for at en ekstern lenke alltid virker eller at data fortsatt er uendret.

NOBB, GTIN, produsentnummer og Montér-artikkelnummer lagres separat. Ett nummer utgis ikke for å være et annet. På materiallisten brukes eksplisitt `sku`; produsentnummer/NOBB vises i produktdetaljene. GLAVA-varianter uten kontrollert Montér-nummer har tomt `sku`.

Ukjent pris, lokal lagerstatus, salgspakning eller teknisk egenskap fylles aldri automatisk. Ikke alle produkter har direkte datablad-/monteringslenke. Der en slik lenke mangler, kan produktkilden brukes til å finne dokumentasjon manuelt. Mangellisten vises i produktdetaljene.

## Oppdatering uten kildekodeendring

Rediger via Produktregister, eller importer CSV/Excel med malens kolonner. Hele importen valideres før en gjennomgang og samlet oppdatering. Samme NOBB, eller samme produsent + varenummer, oppdaterer eksisterende post med bevart lokal ID. Andre varianter legges til. Import med feil endrer ingenting.

Før ny verifisering: sammenlign variant, identifikatorer, dokumentversjon og salgsenhet. Oppdater kontrollerte felt, kilde og dato. Behold tidligere data dersom kilden er utilgjengelig, og marker behovet for ny kontroll. Appen utfører ingen skjult skraping eller automatisk produktintegrasjon.
