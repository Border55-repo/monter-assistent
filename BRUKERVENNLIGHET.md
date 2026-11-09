# Brukervennlighetsgjennomgang – 10. november 2026

Gjennomført etter første vellykkede GitHub Pages-publisering. Den offentlige appen ble åpnet og isolasjonsflyten gjennomgått ved 390 × 844 px. Målgruppen er ansatte som skal regne sammen med en kunde, ofte med én hånd.

## Funn og endringer

| Funn | Endring |
|---|---|
| Produktvalget kom etter alle geometrifeltene og lå under første mobilskjerm. | Produktvalg er nå første steg, før kundens mål. |
| Vanlig GLAVA-variant krevde åpning av lang produktliste. | Tydelig merkede hurtigvalg for dokumenterte GLAVA Proff 34 Plate-varianter. Hele registerlisten er fortsatt tilgjengelig. |
| Flere sjeldnere innstillinger gjorde vanlige beregninger lange. | Enkel visning som standard. «Vis flere valg og priser» åpner tillegg, antall flater, stenderdetaljer og pris. Verdier bevares når visningen endres. |
| Viktige standardforutsetninger måtte fortsatt være synlige. | Antall flater, c/c og relevante svill-/innfestingsforutsetninger vises i en kort oppsummering. Fullt beregningsgrunnlag følger resultat, prosjekt og PDF. |
| Resultatet krevde mye rulling på mobil. | En snarvei følger skjermen og viser mengden. «Vis resultat» går direkte til resultat og lagringsknapp. |
| Det var mindre tydelig hvordan man fortsatte med flere materialtyper. | «Legg til flere materialer» er en tydelig knapp i prosjektoversikten. |
| «Start en beregning» åpnet alltid isolasjon. | Knappen åpner nå kalkulatorvalget, slik at brukeren velger materialtypen. |
| Dialoger kunne flytte fokus tilbake til lukkeknappen ved hvert tastetrykk. | Fokus settes bare ved åpning. Skriving, markør og tabulatorrekkefølge bevares; Escape lukker. Første tekstfelt får fokus. |
| Manuelle linjer omgjorde tall før desimalkomma var ferdig skrevet. | Mengde og pris beholdes som tekst under skriving og valideres ved lagring. Norsk desimalkomma kan tastes naturlig. |
| Endring av prosjektnavn brukte en nettleserprompt. | Egen mobiltilpasset dialog med navnefelt, avbryt og lagre. |
| Enkelte handlingsikoner var små for bruk utendørs. | Større berøringsområder på vanlige ikon- og tilleggsknapper. |

## Kontroll

- Hele den eksisterende testpakken kjøres mot GitHub Pages-undermappen.
- Egen mobiltest kontrollerer at produkt kommer før mål, at hurtigvalg fyller korrekt produkt, og at 42 m² gir 7 pakker med snarvei til lagringsknappen.
- Egen test skriver bokstav for bokstav i prosjekt- og materialdialoger og kontrollerer bevart fokus.
- Mengden `2,5` og prisen `100,50` tastes med faktiske tastetrykk og lagres til korrekt linjesum `251,25`.
- Lagring, PDF, register, sikkerhetskopi, offline omlasting og oppdatering testes fortsatt.

Det er ikke gjennomført en observert test med butikkansatte eller dokumentert en bestemt tidsbesparelse. Forenklingene bygger på gjennomgang av den fungerende appen og automatiserte oppgavetester. Ingen produktdata eller beregningsformler er endret som del av denne forenklingen.
