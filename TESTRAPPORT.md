# Sluttkontroll – 10. november 2026

Produksjonsbygget er kontrollert lokalt på Windows med Node.js 24 og Microsoft Edge via Playwright.

| Kontroll | Resultat |
|---|---|
| `npm test` | 69 tester bestått, 2 testfiler |
| `npm run build` | TypeScript og Vite bestått; PWA-cache generert |
| `npm run test:e2e` | 11 nettlesertester bestått |
| `npm audit --json` | 0 rapporterte sårbarheter i den installerte avhengighetslisten |
| Visuell kontroll | Arbeidsflate i lys/mørk modus, mobil, kalkulator og materialliste |

## Dekning

Beregningsmotorene testes med alle sju kategorier, realistiske kontrollregninger, desimalkomma, enhetskonvertering, start/sluttstendere, flere flater, åpninger, svinn, pakkeavrunding, dekkmål, over-/underliggere, flere rom, skjult innfesting og manglende/ugyldige data. Små og store verdier, eksakte multipler og handelslengder kontrolleres.

Datatestene kontrollerer de medfølgende produktpostene, bindende produktdata, mangellister, prisgrunnlag, CSV-rundtur og formelbeskyttelse, faktisk Excel-import, avvisning av formler, sammenslåing av registerposter, versjonert IndexedDB, serialiserte oppdateringer og sikkerhetskopivalidering. PDF testes som ekte A4-PDF over flere sider med norsk tekst og ukjente priser.

Nettlesertestene bruker produksjonsbygget og egne, midlertidige nettleserprofiler:

1. Arbeidsflate, mørk modus og mobilnavigasjon.
2. GLAVA 42 m² med dokumentert 6,84 m²/pk, prosjektlagring og faktisk PDF-nedlasting.
3. Bevarte inndata, favoritter, åpninger og flateskisse.
4. Redigering av lagret beregning uten dupliserte materiallinjer, manuelle linjeendringer, prosjektkopi og kundevisning.
5. Gulv med flere rom, terrasse, plater, kledning og festemidler.
6. Oppretting/deaktivering av produkt, CSV-import med gjennomgang, feilimport uten tap og registereksport.
7. Fagguider, produktkilder og hurtigverktøy.
8. Mobilkalkulator og materialliste ved 390 px bredde uten horisontal overflyt.
9. Nedlasting og gjenoppretting av sikkerhetskopi med prosjekt.
10. PWA-manifest/ikoner, full offline omlasting med bevarte data, videre beregning og PDF-eksport uten nett.
11. Faktisk endret serviceworker, oppdateringsknapp, aktivering og beholdte prosjekter/produktregister.

## Funn som ble rettet

- Tydelige tilgjengelige navn og enhetsbeskrivelser på skjemafelter.
- Offlineoppslag av faste filer på servere som setter `Vary: Origin` på moduler og stilark.
- Tømming av manglende pakningsdata ved produktbytte, samt kontroll av korrekt salgsenhet.
- Konservativ millimeteravrunding for handelslengdeforslag.
- Eget valg for skjult terrasseinnfesting og eksplisitt valg av separat gulvunderlag.
- Oppdaterte PDF- og testbiblioteker, samt kompatibel UUID-overstyring for ExcelJS, slik at avhengighetskontrollen ikke har kjente funn ved kontrolltidspunktet.

## Praktiske begrensninger

Testene dokumenterer programatferd og matematiske metoder, ikke konstruksjonsteknisk godkjenning. Fysisk installasjon på en iPhone/iPad eller Android-enhet er ikke utført; mobilvisning og PWA-grunnlaget er nettlesertestet. Eksterne datablader er ikke garantert tilgjengelige offline. Ingen lokal lagerstatus eller prisintegrasjon er verifisert.

Kappforslag er mengdegrunnlag uten garanti for optimal fysisk tilpasning; sagspor, renskjæring og byggeplassens opplegg må avklares. Flerbrukertilgang, synkronisering og ekstern produksjonshosting er ikke etablert. Se [README.md](README.md), [CALCULATIONS.md](CALCULATIONS.md) og [RESEARCH.md](RESEARCH.md).
