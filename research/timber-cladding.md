# Reelle Montér-varianter: trelast og kledning

Kontrollert 10. november 2026. Avgrenset utvalg til ansattverktøyets beregningskategorier, ikke hele Montér-sortimentet. Pris, lagerstatus og Lillestrøm-tilgjengelighet er ikke registrert. JSON-filen er et kildekontrollert forslag; eksisterende brukerdata må ikke overskrives ved innføring.

| Vare | NOBB / Montér-artikkel | Dokumenterte data | Kilde |
| --- | --- | --- | --- |
| Lida Timber C24 gran ubehandlet 48 × 98 × 4800 | 42862445 / 101131440 | 48 mm tykk, 98 mm bred, 4800 mm lang, salg per stk. | [Montér](https://www.monter.no/trelast/konstruksjonsvirke/ubehandlet-konstruksjonsvirke/konstruksjonsvirke-c24-gran-ubehandlet-48x98x4800-mm) |
| Lida Timber C24 gran ubehandlet 48 × 98 × 4200 | 42862426 / 101131438 | 48 mm tykk, 98 mm bred, 4200 mm lang, salg per stk. | [Montér](https://www.monter.no/trelast/konstruksjonsvirke/ubehandlet-konstruksjonsvirke/konstruksjonsvirke-c24-gran-ubehandlet-48x98x4200-mm) |
| C24 gran ubehandlet 48 × 148 × 4800 | 42806733 / 101131398 | 48 mm tykk, 148 mm bred, 4800 mm lang, salg per stk. Merket Standard hos Montér; produsent er ikke fastslått. | [Montér](https://www.monter.no/trelast/konstruksjonsvirke/ubehandlet-konstruksjonsvirke/konstruksjonsvirke-c24-ubehandlet-gran-48x148x4800-mm) |
| C24 furu impregnert 48 × 98 × 4800 | 45092952 / 101177362 | 48 mm tykk, 98 mm bred, 4800 mm lang, salg per stk. Merket Standard; produsent er ikke fastslått. | [Montér](https://www.monter.no/trelast/konstruksjonsvirke/impregnert-konstruksjonsvirke/konstruksjonsvirke-c24-impregnert-furu-48x98x4800-mm) |
| Moelven Heftig BAS dobbelfals staff 28° 19 × 148 | 43236162 / 101131940 | 19 mm tykk, 148 mm bred, salg lm, fallende lengder. GTIN 7040431882243. Dekkbredde 130 mm fra eksplisitt produsentregel. | [Montér](https://www.monter.no/trelast/kledning/liggende-kledning/kledning-dobbelfals-med-staff-28-grader-19x148-mm-grunnet-gran), [Moelven variant](https://www.moelven.com/no/no/fasade-og-utemiljo/kledning/heftig-bas-dobbelfals-mstaff/), [produktdatablad fra Montérs dokumentlenke](https://media.bluestonepim.com/9056b428-dfaf-419e-92db-cd75e7ff9831/a293502f-a879-496b-945e-3c9fb7165b37/7d4AfWZaeBS9dP2rCqREWPX61/BCJlsSSdh78wC7cBOWZ1oMbpW.pdf) |
| Bergene Holm NORD dobbelfals tett 19 × 148 | 53710277 / 101222180 | 19 mm tykk, 148 mm bred, salg lm. Produsenten oppgir 7,7 lm/m². Ingen eksakt dekkbredde er utledet fra det avrundede tallet. | [Montér](https://www.monter.no/trelast/kledning/liggende-kledning/kledning-nord-dobbelfals-tett-behandlet-gran-19x148-mm), [Bergene Holm variant med samme NOBB](https://www.bergeneholm.no/produkter/nord-kledning-dobbelfals-tett-53710277) |
| Talgø MøreRoyal dobbelfals 60° svart 19 × 148 | 60082407 / 101430043 | 19 mm tykk, 148 mm bred, salg lm. Eksakt dekkbredde og fast lengde er ukjent. | [Montér](https://www.monter.no/trelast/kledning/liggende-kledning/dobbelfals-kledning-60-svart-19x148-mm) |

Alle Montér-sidene oppgir minstebestilling 10 løpemeter. Dette er et nettordrevilkår, ikke et hardkodet krav til fysiske butikksalg. Faste lengder og fallende lengder har separate artikkelnumre. Ingen lengder fra en annen variant skal knyttes til de registrerte numrene.

## Dekkbredde og kildetilgang

Moelvens produktdatablad (1 side, datert 3.7.2025 i kildematerialet) beskriver falset grankledning med 18 mm fals, og eksplisitt dekkbredde lik dimensjonsbredde minus 18 mm. For 19 × 148 gir dette 130 mm. Dokumentet lenkes fra akkurat Montér-artikkel 101131940; produsentens variantoversikt matcher NOBB og GTIN. Enkelte andre profiler har avvikende falsbredde, og regelen må ikke overføres til alle kledninger. Direkte åpning av Moelvens variantnettside ga HTTP 403; nettindeksert varianttekst og det tilgjengelige produsent-PDF-dokumentet ble brukt. Ingen sperre ble omgått.

Bergene Holms variantnettside med samme NOBB kunne åpnes. Den oppgir 7,7 lm/m², men dette er avrundet og gir ikke grunnlag for en eksakt dekkbredde. Den er derfor utelatt. Montér lenker til en profiltegning for Talgø-varianten; tegningen ga bare tittel i lesbar tekst, og dimensjonene kunne ikke tolkes pålitelig i verktøyet. Nominell bredde 148 er derfor ikke brukt som dekkbredde.

## Bruk i appen

- `unit: stk` gjelder de fire faste konstruksjonsvirkevariantene; hver enhet har dokumentert lengde.
- `unit: lm` gjelder alle tre kledninger. `length` skal være tom; en lengde til kapp-/bordberegning må angis og kontrolleres av brukeren.
- `manufacturer` er bevisst tom for de to varene merket Standard. Standard er en merkelapp hos Montér, ikke dokumentasjon av fysisk produsent.
- `verifiedFields` omfatter bare registrerte felt med støtte i kildene. Ingen konstruksjonssikkerhet, universell innfesting eller standard svinnprosent godkjennes.
- Produktnavn og beskrivelser er korte, egne sammendrag. Ingen produktfoto er lastet ned eller kopiert.
