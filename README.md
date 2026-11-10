# Montér Assistent

Fungerende, lokal webapp for materialberegning i utebutikken. Norsk grensesnitt, sju kalkulatorer, dokumenterte produktdata, prosjekter, PDF, CSV/Excel og offline-PWA. Utviklet som et uavhengig arbeidsverktøy; ingen offisiell Montér-godkjenning eller integrasjon er forutsatt.

## Offentlig PWA på GitHub Pages

Appadresse: [border55-repo.github.io/monter-assistent](https://border55-repo.github.io/monter-assistent/). Kildekode: [Border55-repo/monter-assistent](https://github.com/Border55-repo/monter-assistent).

Endringer på `main` testes og bygges med `.github/workflows/pages.yml` før GitHub Pages publiseres. `VITE_BASE_PATH` settes fra Pages-oppsettet, slik at app, ikoner, manifest og serviceworker fungerer i repositoryets undermappe. Serviceworkeren rydder bare sin egen appcache.

Offentlig tilgang gjelder selve appen og medfølgende produktkilder. Egne prosjekter og produktendringer lagres fortsatt bare i den enkelte nettleseren. De deles ikke med andre besøkende. Lokaladressen og GitHub Pages er forskjellige lagringsområder: bruk sikkerhetskopi/gjenoppretting for å flytte eksisterende prosjekter til den offentlige adressen.

For å kontrollere Pages-bygget lokalt i PowerShell:

```powershell
$env:VITE_BASE_PATH='/monter-assistent/'
npm run build
npm run test:e2e
```

## Start

Krever Node.js 22.12+ eller nyere støttet LTS og npm.

```powershell
npm install
npm run dev
```

Utviklingsadresse vises i terminalen, normalt `http://127.0.0.1:5173`. Offline og installasjon testes i produksjonsbygget:

```powershell
npm run build
npm run preview -- --port 4174
```

Åpne `http://127.0.0.1:4174`. Vent på «Klar uten nett» før du kobler fra nettet. Serveren må være startet for å åpne lokaladressen første gang. `dist/` er ferdig bygget og kan serveres som statiske filer. `index.html` skal ikke åpnes direkte som en fil.

Det følger også med `Start-Assistent.ps1` for å bygge ved behov og starte lokal forhåndsvisning. Ingen betalte API-er eller nøkler trengs.

## Bruk i kundemøtet

Kalkulatorene starter i enkel visning med produktvalg først. For GLAVA Proff 34 Plate finnes hurtigvalg for dokumenterte tykkelser. Bruk «Vis flere valg og priser» for ekstra forutsetninger og prisfelt. Alle inndata beholdes når visningen endres. På mobil viser snarveien mengden og tar deg rett til resultatet med «Vis resultat».

1. Velg kalkulator og legg inn mål eller kjent areal. Forhåndsutfylte geometrimål er redigerbare regneeksempler.
2. Velg et dokumentert produkt, eller oppgi produktdata fra pakningen. Ukjent pakningsdekning må fylles ut før pakkeantall vises.
3. Avklar svinn, avstander og øvrige forutsetninger. Svinn starter på 0 % for å unngå en udokumentert standardanbefaling.
4. Legg resultatet i et prosjekt. Flere kalkulatorer kan samles i samme materialliste.
5. Juster materiallinjer eller legg til ekstra produkter manuelt. Registrer priser hvis de er kjent. Eksporter PDF, skriv ut, eller del som tekst.

Ved redigering av en lagret beregning erstattes dens materiallinjer. Manuelle endringer på disse linjene erstattes også; dette vises i prosjektet. Andre beregninger og frittstående materiallinjer beholdes. Prosjektkopiering lager en egen prosjektkopi.

## Funksjoner

- **Isolasjon:** lengde × høyde eller kjent areal, flere flater, åpninger, svinn, hele pakker, overdekning og produktbreddekontroll.
- **Trelast:** stendere, start/slutt, hjørnetillegg, åpningstillegg, svillag, kappmål, handelslengder, lm, m³ og pris.
- **Terrasse:** bordretning, faktiske bredder og fuger, rader, diskrete handelslengder, skruer og avgrenset bjelkeestimat. Skjøter varsles.
- **Plater:** OSB, gips, MDF, kryssfiner, spon, trefiber og andre plater med nominelle og dekkende mål, svinn og salgspakker.
- **Kledning:** enkeltprofil med dokumentert dekkbredde og separat metode for over-/underliggere.
- **Gulv:** flere rom, gulvpakker, brukerens svinn, underlag, valgfri fuktsperre og listelengder.
- **Festemidler:** dokumentert forbruk per m² eller antall kryss × fester, samt pakkeavrunding. Kilde/mønster er påkrevd.
- **Produktassistent:** søkbare, lokalt tilgjengelige fagguider med produsentlenker.
- **Register:** 27 reelle produktvarianter med kilde, identifikatorer og kontrollstatus for spesifiserte felt. Et avgrenset utvalg i alle sju kategorier, ingen lagerintegrasjon.
- **Kundehjelp:** seks kundeoppgaver med avklaringsspørsmål, huskelister, kilder og snarveier til kalkulatorer/fagguider.
- **Samlet søk:** produkter, varenummer, lokale vareplasseringer, kundeord, kalkulatorer, fagguider og prosjekter.
- **Vareplassering:** område, reol og fag/hylle registreres separat lokalt, med kontrolldato. Tomme til butikken fyller dem ut.
- **Prosjektstatus:** under beregning, må avklares, klar til plukk og ferdig, med korte arbeidsnotater og filtrering.
- **Flere vegger:** egne lengder, høyder og åpninger for isolasjon, stenderverk, plater og kledning. Felles produktvalg.
- **Prisbot:** publisert nettpris for 23 koblede varianter kontrolleres normalt hver sjette time. Kilde, enhet og tidspunkt vises. Se [PRISBOT.md](PRISBOT.md).
- **Hurtigverktøy:** mm/cm/m, areal/lm, m³/liter, materialantall, pakker, svinn og prisomregning.
- **Lagring:** IndexedDB, sikkerhetskopi/gjenoppretting, favoritter og bevarte kalkulatorinndata.
- **PWA:** manifest, 192/512-ikoner, offlinecache av alle byggfiler, synlig tilkoblingsstatus og oppdatering uten sletting av brukerdata.

## Produktdata

Medfølgende produktopplysninger er kontrollert mot oppgitte kilder 9.–10. november 2026. Status gjelder bare de spesifiserte feltene; ukjente verdier er tomme. 90 dager er en intern påminnelsesgrense for ny kontroll, ikke produsentens gyldighetsfrist. Prisboten kontrollerer publisert nettpris, men utfører ikke automatisk ny kontroll av tekniske produktdata.

CSV- og Excel-import bruker samme engelske kolonneoverskrifter. Last ned importmal eller eksporter registeret for å få alle kolonnene. Desimalkomma støttes. CSV bruker semikolon ved eksport; kommaformat aksepteres også. Excel-formatet er `.xlsx`, første ark, statiske celleverdier. Gammelt `.xls` og regnearkformler støttes ikke. Maksimal import er 10 MB og 10 000 produkter. En import valideres i sin helhet og må gjennomgås før den brukes. Feil påvirker ikke eksisterende register.

Les [produktkildene](PRODUCT_SOURCES.md), [researchen](RESEARCH.md), [beregningsreglene](CALCULATIONS.md) og [datakontrollen](DATA_VALIDATION.md).

Den etterfølgende gjennomgangen og forenklingene er dokumentert i [BRUKERVENNLIGHET.md](BRUKERVENNLIGHET.md).

## Tester

```powershell
npm test
npm run build
npm run test:e2e
```

Enhetstestene dekker alle beregningsmotorer, grenseverdier, kildebundne pakningsdata, import/eksport, lokal lagring, sikkerhetskopi, PDF og hurtigverktøy. Playwright tester det faktiske produksjonsbygget, inkludert mobil, PDF-nedlasting, offline omlasting og en virkelig serviceworkeroppdatering med beholdte data.

Nettlesertestene bruker installert Microsoft Edge. På andre systemer: sett `channel` til tilgjengelig Chrome/Edge eller fjern `channel` fra `playwright.config.ts` og installer Playwright Chromium (`npx playwright install chromium`). Skjermbilder og HTML-rapport skrives i ignorerte testmapper. Testene bruker egne, midlertidige nettleserprofiler.

## Drift, oppdatering og begrensninger

GitHub Pages brukes til offentlig hosting over HTTPS. Appen er en statisk SPA. Hashruting gjør at det ikke trengs spesielle SPA-omskrivingsregler. En nettverksadresse på en annen enhet er ikke det samme som `localhost` på utviklermaskinen.

Bygg på nytt med `npm run build`. Byggsteget genererer serviceworker og innholdshashet cacheliste. Besøkende får en oppdateringsknapp når ny versjon er installert. Oppdateringen lagrer data før aktivering. Ingen IndexedDB-lagre slettes ved appoppdatering. Cacheoppslag for de faste appfilene ignorerer `Vary` fordi enkelte statiske servere setter `Vary: Origin` på moduler; dette gjelder ikke en backend eller brukerdata.

Data finnes bare i den aktuelle nettleserprofilen. Bruk sikkerhetskopi for overføring og gjenoppretting. Ikke registrer kundenavn, telefon, adresse eller andre personopplysninger. Denne utgaven har ikke flerbrukerroller; en delt bedriftsutgave må få autentisering, autorisasjon og personvernoppsett før administrasjonen deles.

Mengdeberegningene dokumenterer ikke styrke, brann, lyd, U-verdi eller fuktsikkerhet. Kappforslag er ikke konstruksjonsplaner. Eksterne dokumenter/bilder er ikke offlinegarantert. PDF bruker et innebygd tegnsett som støtter norsk, men ikke alle verdens skriftspråk. Gjeldende priser, mva-status og lager i Montér Lillestrøm må kontrolleres separat.

Kamera/strekkoder, QR-deling, automatisk kontroll av tekniske produktdata, backend og synkronisering er ikke inkludert. Prisboten kontrollerer bare publisert nettpris for de oppførte målene.
