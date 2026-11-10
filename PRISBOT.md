# Automatisk kontroll av publisert nettpris

Implementert og kildekontrollert 10.11.2026. Botens mål er de 23 medfølgende variantene som har en entydig Montér-artikkel og produktside. Dette er et avgrenset utvalg, ikke hele sortimentet eller brukerens lokale importvarer.

## Kjøring og kilde

`scripts/check-prices.mjs` kjøres i GitHub Pages-workflow ved push, manuell oppstart og normalt hver sjette time (`17 */6 * * *`, UTC). Den henter offentlige produktsider sekvensielt med timeout og pause. Ingen innlogging, private API-er eller sperreomgåelse. Identifiserende User-Agent peker til repositoryet.

Botens output er `public/prices.json`, som bygges og publiseres sammen med appen. Ingen token eller betalt tjeneste trengs. Loggen ligger i GitHub Actions. Det er ingen automatisk repo-commit og ingen varsling til andre.

[GitHub dokumenterer](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule) at tidsstyrte kjøringer kan bli forsinket og at de deaktiveres etter 60 dagers repository-inaktivitet i offentlige repositoryer. Dette er regelmessig kontroll, ikke en garanti om sanntidspris. Workflow kan startes manuelt fra Actions. En godkjent prisintegrasjon vil være bedre ved krav til butikk-/kundepriser og garantert drift.

## Kontroll før en pris godtas

- Eksakt artikkelnummer, kanonisk produktadresse og oppført NOBB må stemme.
- Kilden må ha ett entydig Product/Offer for riktig artikkel, valuta NOK og positiv numerisk pris.
- Varianter merket utgått, utløpte tilbud og ukjente salgsenheter avvises.
- Pris- og salgsenhet og deres faktorer leses fra den samme varianten. En pris per m² er ikke en pakkepris; pris per lm er ikke stykkpris. `PLA` er observert salgsenhet for plater og normaliseres til `stk`.
- Trackingfelt, relaterte varer, nullverdier og fritekstpriser brukes aldri som reservekilde.
- Feil gir «Kontrollert nettpris utilgjengelig», ikke null eller ny tidsmerking av en gammel pris.

Første samlede kontroll: **22 av 23** entydige priser kunne hentes. GLAVA Proff 34 Plate 250 mm, Montér 101186761, var merket utgått på nettkilden og fikk ingen pris. De fire øvrige registervariantene mangler entydig Montér-kobling og inngår ikke i botens mål.

## Bruk i appen

Visningen heter «Publisert nettpris», med kilde, kontrolltid, rå prisenhet og omregnet salgsenhet. Lokal butikk-/kundepris og mva-status bekreftes ikke av dette datagrunnlaget. Kontroller ved faktisk salg. Botens pris erstatter aldri `Product.price`, som fortsatt er brukerens manuelle felt.

Appen henter prisfil ved åpning, hvert 15. minutt mens den er åpen, og når nettet kommer tilbake. Serviceworkeren bruker nett først for prisfilen, med siste cachede fil ved offline. Pris eldre enn 12 timer eller med ugyldig tidspunkt/variant/enhet kan ikke brukes fra nettprisknappen. Prisfilen er unntatt fra appskallets innholdshash, slik at en ren prisoppdatering ikke gir appoppdateringsbanner.

«Bruk denne nettprisen» er et eksplisitt valg. Kilde og kontrolltid følger beregning, materiallinje, tekst og PDF. Lagrede prosjekter beholder prisøyeblikksbildet og endres ikke ved neste botkjøring. Manuell prisredigering fjerner automatisk kildeetikett.

Se [detaljert kildeundersøkelse](research/price-findings.md) og parsertestene for format- og enhetskontroll.
