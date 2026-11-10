# Datakontroll

Tillegg 10.11.2026: Lokale vareplasseringer lagres separat i `locations` med område, reol, fag/hylle og kontrolldato. De endrer ikke produktets verifiserte felt eller dato. Prosjektstatus, arbeidsnotater (maks 500 tegn) og vegglister er valgfrie og valideres ved gjenoppretting. Appens IndexedDB-versjon og gamle data beholdes. Nettpriser krever entydig variant/enhet og høyst 12 timers alder; de overskriver ikke manuelle registerpriser eller eksisterende prosjektpriser. Se [PRISBOT.md](PRISBOT.md).

## Registrering og enheter

Produktmodellen er definert i `src/lib/types.ts`. Navn, kjent kategori og salgsenhet er påkrevd. Ukjent produsent, artikkelnummer, GTIN, egenskaper og pris skal ikke fylles med gjetninger. En ufullstendig post kan registreres selv om kalkulatoren fortsatt må kreve manglende pakningsdata.

Kategorier i import: `insulation`, `timber`, `deck`, `sheets`, `cladding`, `flooring`, `fixings`. Salgsenhet: `pk`, `stk`, `lm`, `m²`, `m³`.

Tallfelter: `thickness`, `width`, `length`, `piecesPerPack`, `coverage`, `coverWidth`, `coverLength`, `price`. Tall må være endelige og positive, pris kan være null. Pakningsantall er heltall. Desimalkomma støttes. Produktmål er mm, dekning m² per registrert salgsenhet, pris NOK per salgsenhet.

Dokument-/bildelenker må bruke HTTP/HTTPS. Kilde kan også være en tydelig dokumentreferanse. Dato må være gyldig. JavaScript-, data- og lokale fillenker aksepteres ikke som dokument-/bildelenker.

## Verifiseringsstatus

`verified` og `verifiedFields` betyr kontroll av de spesifiserte feltene mot navngitt kilde på datoen som vises. Det er ingen godkjenning av programvaren. Validering av CSV/Excel bekrefter format og datatyper, ikke at påståtte produktfakta er sanne.

Verifisert status krever en kilde og en ikke-tom liste over kontrollerte felter. Feltnavnene må være kjente og feltene må ha registrerte verdier.

Kontroller:

1. Aktuell produsentdokumentasjon og riktig produktvariant.
2. Separate identifikatorer: produsentnummer, NOBB, GTIN og Montér-artikkel.
3. Salgsenhet og pakningsnivå: stykk, pakke, bunt eller pall.
4. Faktiske dekkmål og oppgitt pakningsdekning, med kildens presisjon.
5. Kilde, dokumentversjon, kontrollerte felter og dato.

Uklarheter skal gi tomme felt eller merknad, ikke oppdiktede verdier. Produsentens gjeldende tekniske data prioriteres for tekniske egenskaper; variant-/leverandørdata brukes for salgspakning.

Produktdetaljene viser manglende pris, Montér-artikkel, GTIN, dokumentlenker og relevante dekk-/pakningsfelt. Etter 90 dager vises intern påminnelse om ny kontroll. Dette er en valgt arbeidsrutine, ikke en produsentbestemt utløpsdato.

## Beregninger

Kjente produktmål og dekninger bindes i både grensesnitt og motor. Velg manuelle data for en annen variant. Relevante manglende felter nulles ved nytt produktvalg slik at tidligere produktverdier ikke brukes ved en feil. Ansatt må registrere nødvendige mangler før beregning.

Resultatet viser kilde, dato, kontrollerte registerfelt og brukerens forutsetninger. Ikke-verifisert produkt gir melding. Priskonvertering utføres bare ved kjent enhetsgrunnlag, for eksempel stykkpris / kjent lengde til lm-pris, eller pakkepris / kjent antall til platepris.

## Import og eksport

- CSV og `.xlsx`, første ark. Ingen `.xls` eller makrokjøring.
- Hele importen valideres før endring og vises til gjennomgang. Feil oppgir radnummer og avbryter samlet.
- Excel-formler avvises; bruk statiske verdier. Filer skal komme fra betrodde leverandører/administratorer.
- Maksimalt 10 MB og 10 000 produkter. Dette er lokal administrasjon, ikke offentlig opplasting.
- CSV-eksport beskytter mulige regnearkformler med apostrof.
- Lik NOBB eller produsent + varenummer oppdaterer post med bevart intern ID. Andre varianter legges til.
- Importert `verified=true` må kontrolleres av administrator; appen utfører ingen ekstern verifiseringsforespørsel.

## Lagring, feil og oppdatering

IndexedDB: `monter-assistent`, versjon 1, objektlager `app`, nøkkel `data`. Hele appens tilstand skrives i en transaksjon. Skrivninger serialiseres slik at eldre tilstand ikke overskriver nyere ved raske endringer.

Produktregisteret fylles bare ved første oppstart. Appoppdateringer sletter ikke databasen. Lesefeil gir melding uten automatisk nullstilling. Skrivefeil gir varig feilmelding og mulighet for sikkerhetskopi.

Sikkerhetskopi har `schemaVersion: 1`. Struktur, kategorier, produktdata, ID-er, inndata, datoer, materiallinjer og resultater valideres før gjenoppretting. Gjenoppretting erstatter lokal tilstand etter gjennomgang; dagens data kan lastes ned først.

Hvis en kildeoppdatering feiler, beholdes eksisterende data. Det finnes ingen automatisk kildeintegrasjon; data oppdateres manuelt eller via import. Kontrolldato og behov for ny kontroll må holdes ajour.

## Personvern og tilgang

Prosjekter skal ikke inneholde kundenavn, kontaktinformasjon eller andre personopplysninger. Data lagres bare i nettleserprofilen, uten applikasjonskryptering. Ingen prosjekter synkroniseres til server. Lokal tilgang til nettleserprofilen gir tilgang til data.

Denne utgaven er for én betrodd bruker per profil og har ingen simulert administratorinnlogging. Flerbrukerdrift krever autentisering, autorisasjon på server, egnet kryptering/lagring og avklart personvern før registeradministrasjon deles. Ingen Montér-integrasjon er tilgjengelig eller påstått.
