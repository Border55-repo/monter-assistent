# Montér: automatisert kontroll av publiserte nettpriser

Undersøkt 10. november 2026. Dette gjelder offentlig, anonym tilgang til monter.no. Ingen innlogging, kundekonto, sesjonsdata eller interne prisendepunkter er brukt.

## Faktisk hentekontroll

Node 24 `fetch()` fikk HTTP 200 og produkt-HTML fra tre reelle sider. Lokal sandbox blokkerte DNS; samme offentlige hentekall med tillatt nettverk fungerte. Parseren ble kjørt mot den faktiske nedlastede siden for terrassebordet, og direkte mot faktisk hentet HTML for GLAVA og Norgips. Dette er ikke en parser som bare er prøvd mot konstruert tekst.

| Artikkel | NOBB | Publisert strukturert pris ved kontroll | Eksplisitt prisenhet | Salgsenhet | Omregnet til salgsenhet |
|---|---|---:|---|---|---:|
| 101198715, SCA terrassebord 28×120×4800 mm | 48982935 | 19,50 NOK | LM | STK | 93,60 NOK/stk |
| 101186758, GLAVA Proff 34 Plate 100 mm | 50673624 | 108,00 NOK | M2 | PAK | 738,72 NOK/pk |
| 101100133, Norgips Standard 12,5×1200×2400 mm | 10397701 | 61,90 NOK | M2 | STK | 178,27 NOK/stk |

Kilder:

- [SCA, nøyaktig 4800 mm-variant](https://www.monter.no/trelast/terrassebord/impregnert-terrassebord/terrassebord-impregnert-furu-28x120x4800-mm)
- [GLAVA, nøyaktig 100 mm-variant](https://www.monter.no/byggevarer/isolasjon/isolasjonsplater/isolasjon-proff-34-plate-100x570x1200-mm-10-stk)
- [Norgips, nøyaktig 2400 mm-variant](https://www.monter.no/byggevarer/bygningsplater/gips/gipsplate-standard-125-x-1200-x-2400-mm)

Prisene over dokumenterer et hentetidspunkt, ikke et løfte om fremtidig pris eller et tilbud. De skal ikke legges inn som tidløse seed-priser.

## Maskinlesbar struktur og parser

`scripts/lib/monter-price.mjs` leser det offentlige `window.CURRENT_PAGE`-objektet som ren JSON. Den utfører aldri JavaScript fra siden. Objektet inneholder `itemNumber`, `nobbNumber`, `canonicalUrl`, `units`, og `jsonLd`.

Krav før en observasjon returneres:

1. Nøyaktig Montér-artikkel, kanonisk produktadresse og eventuelt kjent NOBB må stemme.
2. Produktet må ikke være merket utgått.
3. Én entydig JSON-LD Product på denne adressen og ett Offer med riktig `itemOffered.sku` må foreligge.
4. Positiv, endelig NOK-pris og eksplisitte pris- og salgsenheter med positive omregningsfaktorer må foreligge. Nullpriser forkastes.
5. Eventuell `priceValidUntil` må ikke ha passert.

Prisen gjelder `units.price.name`. Den er **ikke** nødvendigvis per salgspakke eller stykk. `convertPublishedPrice` kan regne til den eksplisitte salgsenheten slik: `beløp × sales.multiplicationFactor / price.multiplicationFactor`. Den gjetter ikke faktorer for andre enheter.

Viktig funn: `trackingProduct.price` var `0.00`, mens det offentlige JSON-LD-tilbudet hadde positiv pris. `page.price`, `realTimePrice.preloaded` og `packagePriceViewModel` var null ved anonym serverhenting. Disse skal ikke brukes som tilfeldige reservekilder. Parseren leter heller ikke etter priser i relaterte varer eller søkeresultater.

Vitest dekker variantkontroll, kildeadresse, NOBB, ukjent enhet, null/negative/ugyldige priser, feil valuta, utløpt pris, tvetydige tilbud, manglende data, m²→pk/stk, lm→stk og sikker JSON-lesing. Nettverkskall holdes utenfor enhetstestene.

## Betydning og begrensninger

Bruk betegnelsen **«Publisert nettpris»**, med kildeadresse, enhet og siste vellykkede kontroll. Det er ikke dokumentert at anonym JSON-LD til enhver tid er identisk med en valgt butikks eller en innlogget kundes pris. Montér har eksplisitt eget varehusvalg for varehuspris og lagerstatus. Ingen slik valgt-butikktilgang er implementert her.

[Montérs kjøpsbetingelser](https://www.monter.no/kundeservice/kjopsbetingelser), lest samme dato, beskriver forbrukernettpriser som inklusive merverdiavgift og tar prisforbehold. Selve JSON-LD-tilbudet angir ikke MVA. Parserens observasjon har derfor `vat: "unconfirmed"`; grensesnittet må ikke tilskrive en lokal/manuell pris MVA-status basert på denne nettsiden.

[robots.txt](https://www.monter.no/robots.txt) var tilgjengelig med produktkart og én spesifikk sperre for `/kampanje?p_category_references`. Produktsidene var ikke sperret der ved kontrollen. Dette er en teknisk observasjon, ingen avtale om integrasjon eller juridisk vurdering. Robotregler kan endres.

## Drift som anbefales ved integrering

- Gjør en første reell kontroll før publisering, og deretter et nøkternt intervall, eksempelvis hver sjette time i GitHub Actions. Ingen løkke mot hele sortimentet.
- Hent bare de eksplisitte, kildekontrollerte produktadressene i registeret. Bruk kort timeout, liten samtidighet/sekvens og pause mellom kall. Ikke omgå avvisning, captcha eller krav om innlogging.
- Hver observasjon skal lagre rå prisenhet, omregningsfaktorer, artikkelnummer, URL og tidspunkt. Et mislykket kall skal ikke gi en ny kontrolltid på en gammel pris.
- Vis siste forsøk separat fra siste vellykkede observasjon. Gammel/mislykket pris skal merkes og ikke fremstå som nykontrollert. Ikke erstatt ukjent pris med null.
- En materialliste bør beholde prisøyeblikksbildet den ansatte valgte. Nye nettpriser må ikke stille endre allerede lagrede prosjekter.
- Tidsplaner i GitHub Actions kan bli forsinket og pause ved inaktivitet. «Kontrolleres jevnlig» er dekkende; «stemmer hele tiden» kan ikke garanteres.
- Nettverkskontrollene må kjøres fra den faktisk planlagte driften og logges. Gjentatt strukturendring eller avvisning skal stoppe automatisk prisbruk og gi tydelig status.

Ingen fullstendig HTML eller eksternt JavaScript er nødvendig i repositoryet. Parsertester bruker små representative skjemaobjekter og inneholder ingen nettverkshemmeligheter.

## Tilleggskontroll: platesalg

Faktisk HTTP-henting samme dato av Montér-artiklene 101116073 (Arauco 12 mm), 101116074 (Arauco 15 mm) og 101131548 (OSB TG2 15 mm) viste `units.sales.name: "PLA"`, faktor 1. `PLA` er derfor støttet som én plate (`stk`) samtidig som rå enhet beholdes som `salesSourceUnit: "PLA"`. Prisenheten på disse sidene var uttrykkelig `M2`, ikke `PLA`; omregningen må fortsatt bruke faktorene. Uobserverte forkortelser som `PL` støttes ikke. Kilder er de eksakte Montér-lenkene i [produktundersøkelsen](floor-sheets-fixings.md).

GLAVA 250 mm, artikkel 101186761, ble ved eierens samlede kontroll merket utgått. Parseren skal fortsatt avvise pris for den varen; en siste kjent pris skal ikke overstyre utgått-status.
