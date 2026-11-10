# Montér Assistent

Lokalt ansattverktøy for materialberegning i utebutikk. Ingen offisiell Montér-godkjenning, priser, lagerintegrasjon eller produktdata er implisert.

## Arkitektur og stack

React 19, TypeScript, Vite, Tailwind 4 og CSS. `src/lib/calculators.ts` har rene beregningsfunksjoner. `src/lib/storage.ts` bruker versjonert IndexedDB. `src/lib/products.ts` håndterer validert CSV/Excel. `src/lib/export.ts` lager PDF og tekst. UI i `src/components`. PWA-skall genereres i `dist/sw.js` med innholdshash via `scripts/build-sw.mjs` etter Vite.

## Kommandoer

`npm install`, `npm run dev`, `npm run build`, `npm run preview`, `npm test`, `npm run test:e2e`. Playwright bruker installert Microsoft Edge (`channel: msedge`) og produksjonsbygg på port 4173. Endre channel/installér Chromium på andre systemer. `npm run build` genererer precache-manifest før offlinekontroll. Ikke publiser uten brukerens uttrykkelige godkjenning.

Brukeren har 10.11.2026 uttrykkelig godkjent offentlig publisering via GitHub og GitHub Pages. Repository: `Border55-repo/monter-assistent`, offentlig adresse `https://border55-repo.github.io/monter-assistent/`. Workflow tester og publiserer `main`. `VITE_BASE_PATH` styrer både Vite og generert serviceworker. Ikke hardkod rotstier til appfiler; manifest og ikoner skal være relative til appens undermappe. Nye brukerendringer i dette prosjektet kan publiseres gjennom eksisterende workflow innenfor oppdragets omfang.

## Beregningsregler

Enheter: konstruksjonsmål i m; produktmål og c/c i mm; priser i NOK, manuelt registrert uten antakelser om mva. Mengder rundes opp; flyttallsavrunding har liten toleranse ved eksakte multipler. Areal er L×B×antall minus eksplisitte åpninger, som kontrolleres. Svinn er multiplikativt. Isolasjon og gulv bruker dokumentert/innlagt pakningsdekning; plater bruker faktisk dekkmål. Arealbasert beregning lover ikke optimal kapp eller fysisk tilpasning. Stendere inkluderer start/slutt og eksplisitte tillegg; grunntallet beholdes konservativt rundt åpninger. Ingen styrkedimensjonering. Terrasse bruker diskrete rader og handelslengder med eksplisitte skjøter; bjelker og skruer er mengdeestimat fra oppgitte avstander og innfestinger. Festemidler krever brukerens forbruk/mønster og kilde. Se `CALCULATIONS.md` for detaljer.

## Data

Produkt: id, name, manufacturer, sku, category, thickness, width, length, coverage, piecesPerPack, price, unit, description, source, datasheet, image, verified, active, updatedAt. Separate felt for nobb, gtin, manufacturerSku, monterSku, monterUrl, coverWidth, coverLength, installation, technical og verifiedFields. Tall må være endelige og positive (pris kan være null). 27 medfølgende reelle varianter har kontrollerte felt; nettprisobservasjoner ligger separat. Ingen oppdiktede produktdata. Prosjekter lagrer beregningsinndata, resultatøyeblikksbilde, materiallinjer og dato. Kundeidentitet skal ikke registreres. Lokal utgave er for én betrodd bruker per nettleserprofil; ingen flerbrukerautentisering.

## Kvalitet og videre arbeid

Enhetstester for alle motorer, grenseverdier, import, lagring og eksport; E2E for navigasjon, mobil, produkter, prosjekter, PDF, offline omlasting og faktisk serviceworkeroppdatering med bevart data. Ikke slett eller erstatt eksisterende IndexedDB ved oppdatering. Cache for faste appfiler ignorerer Vary for å støtte statiske servere med Vary: Origin. PDF bruker innebygd Helvetica med norske tegn. Eksterne bilder/datablader er ikke offlinegarantert. Produksjon krever HTTPS. Ved flerbrukerdrift: backend, autentisering, roller, kryptering/personvern og godkjente produktintegrasjoner før deling. Valgfrie senere funksjoner: kamera/strekkoder, QR-deling og kryptert synkronisering.

## Research ved videreutvikling

PWA-oppdatering: forhåndslagring må hente filer med `Request(..., {cache: "reload"})`, ellers kan gammel HTML fra HTTP-cache bli lagret i en ny offlinecache. Registrering bruker `updateViaCache: "none"`. Nettlesertesten endrer faktisk HTML og kontrollerer nytt appskall med ti minutters HTTP-cache i preview. Ikke fjern denne kontrollen eller nullstill brukerens IndexedDB for å løse cachefeil.

Utvidelse 10.11.2026: 27 medfølgende produktvarianter, 16 nye dokumentert i `research/`. Katalogrevisjon 2 legger kun til manglende varianter, og bevarer brukerens poster. Vareplasseringer ligger separat i `AppData.locations`, ikke i verifiserte produktdata. Prosjektstatus og interne arbeidsnotater må ikke fremstilles som delt mellom ansatte. Kundehjelpens seks oppgaver har kilder og legger aldri til varer automatisk. Samlet søk inkluderer kundeord og lokalt innhold.

Flere vegger: se tillegget i `CALCULATIONS.md`. Arealbaserte motorer summerer nettoareal før avrunding; trelast beregnes og avrundes separat per vegg. Samme produkt og konstruksjonsvalg gjelder alle veggene. Behold veggene i backup, prosjekt og eksport.

Prisbot: se `PRISBOT.md`. Hver sjette time i eksisterende GitHub Pages-workflow, pluss push/manuell kjøring. Bare offentlig publisert nettpris for fast liste av eksakte varianter. Kontroller artikkel, NOBB, URL, enhet og faktorer; avvis utgått/manglende pris. Aldri bruk trackingpris eller gjett pakkepris fra m²/lm. Vis kilde/tid, avvis pris eldre enn 12 timer, og bevar manuelle priser og prosjektøyeblikksbilder. Prisfilen er nett-først med offlinecache, unntatt fra skallhash. Butikk-/kundepris og mva-status er ikke bekreftet.

Brukervennlighet: behold enkel visning som standard med produktvalg først. Ekstra forutsetninger/priser skal være tilgjengelige uten tap av inndata. Se `BRUKERVENNLIGHET.md`. Dialogfokus må bare settes ved åpning, ikke ved hvert tastetrykk; siste lukkekall holdes i ref. Mengde/pris i materialdialogen lagres som tekst under skriving og konverteres ved lagring, slik at desimalkomma kan tastes normalt. Nettlesertestene dekker faktiske tastetrykk og mobilens snarvei til resultatet.

Les `RESEARCH.md`, `PRODUCT_SOURCES.md`, `CALCULATIONS.md` og `DATA_VALIDATION.md` før endringer i produktdata eller formler. Bruk gjeldende produsentdokumentasjon. Dokumenter kildebegrensninger. Kontroller nye varianter før verifisering; oppdater lokalt register via UI/import uten å overskrive brukerens data. Researchdato: 09.11.2026. Enkeltprofil og over-/underliggere har ulike metoder. Separat gulvunderlag/fuktsperre krever brukerens valg. Skjult terrasseinnfesting beregnes separat fra toppskruing.
