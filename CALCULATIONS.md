# Beregningsmetoder og kontrollregninger

Motorer: `src/lib/calculators.ts`. Hurtigverktøy: `src/lib/quick.ts`. Dette er mengdeberegninger, ikke konstruksjonsteknisk dimensjonering. Produkt- og fagkilder er dokumentert i [RESEARCH.md](RESEARCH.md).

## Felles regler og enheter

Geometri oppgis i meter, produktmål og c/c i millimeter. Mm til m: del på 1000. Mm² til m²: del på 1 000 000. Priser er manuelle NOK-verdier uten antatt mva-status. Tom pris er ukjent, ikke gratis. Null er en eksplisitt pris.

`ceil(x)` er avrunding opp med liten toleranse for flyttallsstøy ved eksakte multipler. Reelle restmengder rundes opp. `f = 1 + svinn/100`. Svinn er 0–100 % og starter på **0 %**. Det er ingen universell svinnanbefaling.

`A_brutto = L × H × antall`, eller direkte areal × antall.

`A_åpninger = sum(bredde × høyde × antall)`; `A_netto = A_brutto − A_åpninger`.

Åpningsantall gjelder alle flater samlet. Ved geometrimål kontrolleres at hver åpning ligger innenfor én flate. Brukeren må fordele åpningene og unngå overlapp/dobbelttelling. Skissen viser ett eksemplar per åpningstype, ikke en full tegningsmodell. Nettoareal må være positivt.

Lengdemål er positive og høyst 1000 m per dimensjon. Antall flater er heltall fra 1 til 10 000. Direkte areal er positivt og høyst 10 000 000 m² per flate. Manglende nødvendige verdier gir ikke et resultat. Forhåndsutfylt geometri er redigerbare regneeksempler.

Når produkt velges, bindes kjente produktmål og pakningsdekninger i både UI og motor. Ukjente felt må registreres manuelt. Bytte til en variant med manglende felt nuller relevante verdier slik at gamle pakningsdata ikke følger med.

Handelslengdeforslag for trelast og terrasse inkluderer ikke sagspor eller renskjæring. Dette oppgis også i beregningsgrunnlaget. Kontroller faktisk kappbehov og tilgjengelig lengde før innkjøp, og juster reserve/mengde etter arbeidsopplegget.

## 1. Isolasjon

`Behov = A_netto × f`

`Pakker = ceil(behov / dokumentert m² per pakke)`

`Dekning = pakker × m² per pakke`

`Overdekning etter svinn = dekning − behov`

`Kostnad = pakker × registrert pakkepris`

Produsentens oppgitte pakningsareal beholdes med oppgitt presisjon. Det erstattes ikke med et selvberegnet bredde × lengde × antall. Tykkelse påvirker produktvalg og pakning, ikke flatearealet.

Teoretisk fri bredde = c/c − stenderbredde. Dette er en separat kontrollstørrelse. Nominell isolasjonsbredde og fysisk tilpasning må kontrolleres i produsentens anvisning. Stenderareal trekkes ikke fra automatisk.

**Kontroll:** 42 m² med GLAVA Proff 34 Plate 100 mm, 6,84 m²/pk og 0 % svinn → 7 pakker, 47,88 m² dekning og 5,88 m² overdekning.

**Presisjonskontroll:** 41,02 m² med oppgitt 4,10 m²/pk gir 11 pakker. Et udokumentert skifte til 4,104 kan endre avrundingen feilaktig.

## 2. Trelast og stenderverk

`Grunnstendere = (ceil(L / c/c_i_meter) + 1) × antall flater`

`Stendere = grunnstendere + eksplisitt hjørnetillegg + åpningsantall × tilleggsstendere per åpning`

`Kappmål = H − (bunnsvillag + toppsvillag) × virketykkelse_i_meter`

`Svill-lm = L × svillag × antall flater`

`Tverrstykke-lm = sum(åpningsbredde × åpningsantall × oppgitte tverrstykker)`

`Netto lm = stendere × kappmål + svill-lm + tverrstykke-lm + øvrige tillegg`

Grunnstendere ved åpninger beholdes konservativt. Appen tegner ikke nøyaktig stenderplassering. Tverrstykker er mengdetillegg, ikke dimensjonert overdekning eller opplegg.

Ved handelslengde S:

`Stendere per lengde = floor(S / kappmål)`

`Stenderlengder = ceil(stendere × f / stendere per lengde)`

`Svillstykker før reserve = ceil(L/S) × svillag × antall flater`

`Innkjøpte stykker = stenderlengder + ceil(svillstykker × f) + ceil((tverrstykke-lm + andre tillegg) × f / S)`

Kapp flyttes ikke mellom gruppene. Svill i døråpninger trekkes ikke fra. Stenderkapp må få plass i én handelslengde. Metoden er konservativ og gir ikke en global optimal kuttplan.

`Innkjøpt lm = stykker × S`

`Volum = innkjøpt lm × tykkelse_mm × dybde_mm / 1 000 000`

`Stykkpris = lm-pris × S`

**Kontroll:** 5 × 2,4 m, c/c 600, 48 × 98 mm, ett bunn- og ett toppsvillag → 10 stendere à 2,304 m og 10 lm sviller. Ved 4,8 m handelslengde: 5 lengder til stendere + 4 til sviller = 9 lengder, 43,2 lm, 0,2032128 m³ uten reserve.

## 3. Terrasse

La R være radlengden i valgt leggeretning, B tverrmålet, b faktisk bordbredde i m og g oppgitt fuge i m.

`Rader = ceil((B + g) / (b + g))`

Dette følger av at r rader har r bord og r−1 mellomfuger. Siste bord kan måtte kløyves.

`Netto bord-lm = rader × R`

`Bjelker = ceil(R / oppgitt bjelkeavstand_i_meter) + 1`

`Bjelkelengde = bjelker × B`

Ved oppgitt toppskruing: `Skruer = ceil(rader × bjelker × oppgitte fester per kryss × f)`. Pakker = ceil(skruer / pakningsinnhold). Ved skjult/annet system beregnes fester separat etter systemanvisning, og ingen automatisk skruelinje legges til.

Handelslengdeforslaget finner minste kjøpslengde per rad som minst dekker R; ved lik kjøpslengde velges færrest stykker. Dynamisk programmering bruker millimeterpresisjon, maksimalt 20 oppgitte lengder og høyst 30 m per lengde. Behov avrundes opp og tilgjengelig lengde ned til millimeter. Antall per lengdegruppe ganges med reserve og avrundes opp separat. Kapp gjenbrukes ikke mellom rader.

Flere stykker i én rad utløser skjøtevarsel. Forslaget er ikke en godkjent skjøteplan. Bjelkeestimatet inkluderer ikke ekstra opplegg ved skjøter, kantbjelker, dragere, fundamenter eller reserve. Bestillingsvilkår og minimumssalg må kontrolleres ved salg.

**Kontroll:** 6 × 4 m, bord 120 mm, fuge 5 mm, R=6 → 33 rader, 198 lm. Oppgitt c/c 600 → 11 bjelker. 2 fester per kryss → 726 skruer før reserve, eller 3 pakker à 250. Geometrimodellen kan avvike fra grove produsenttabeller per m² på grunn av endeeffekter.

## 4. Plater

`Plateareal = dekkende bredde_mm × dekkende lengde_mm / 1 000 000`

`Nødvendige plater = ceil(A_netto × f / plateareal)`

`Salgspakker = ceil(nødvendige plater / plater per salgspakke)`

`Innkjøpte plater = salgspakker × plater per salgspakke`

`Dekning = innkjøpte plater × plateareal`

`Areal utover netto = dekning − A_netto`

Dekkende mål kan ikke overstige nominelle mål. Overskytende areal inkluderer reserve og avrunding, men er ikke et påvist fysisk kapp. Monteringsretning lagres; skjøter og reststykker optimaliseres ikke. Flere lag registreres som flere flater eller beregninger.

**Kontroll:** 28 m² / 2,88 m² = 9,722… → 10 plater og 28,8 m² dekning uten reserve.

**Manuelt not/fjær-eksempel:** nominelt 620 × 2420 mm, dekkende 600 × 2400 mm, 28 m² → 20 plater. Med 3 plater per salgspakke → 7 pakker / 21 plater. Dette identifiserer ikke et bestemt produkt.

## 5. Kledning

Enkeltprofil:

`Netto lm = A_netto / faktisk dekkbredde_i_meter`

`Bord = ceil(netto lm × f / handelslengde)`

`Festemidler = innkjøpte bord × (ceil(handelslengde / festeradavstand) + 1) × fester per kryss`

Festemiddelestimatet inkluderer begge ender på alle kjøpte bord. Faktisk produktmønster og lekting må kontrolleres. Retningen gir ingen fysisk kappplan.

Over-/underliggere:

`Modulbredde = (overliggerbredde + underliggerbredde − 2 × overlapp) / 1000`

`Netto lm per sjikt = A_netto / modulbredde`

Hvert sjikt avrundes separat til handelslengder. Kalkulatorens prisfelt gjelder overliggeren; underliggerpris må registreres på sin egen materiallinje. Festemidler beregnes ikke automatisk for dette systemet. Overlapp er brukerens dokumenterte forutsetning.

**Kontroll:** 12 m² og 125 mm dekkbredde → 96 lm, 20 bord à 4,8 m uten reserve.

**To sjikt, regneeksempel:** 148+148−2×25 = 246 mm modul; 12/0,246 = 48,78049 lm per sjikt → 11 bord à 4,8 m per sjikt.

## 6. Gulv

`Areal = sum(romlengde × rombredde)`

`Gulvpakker = ceil(areal × f / dokumentert pakningsdekning)`

`List-lm = sum(2 × (L+B) − oppgitt listfradrag)`

`Hele listelengder = ceil(list-lm × f / listelengde)`

Separat underlag og fuktsperre tas bare med når brukeren velger det. Behov er areal × f; hvis netto pakningsdekning oppgis, avrundes det til hele pakker. Dekningen må være netto etter nødvendig overlapp. Mønsteret lagres; brukeren velger reserve etter produkt og opplegg. Ingen automatisk fuktsperre-/underlagsanbefaling gis.

**Kontroll:** rom 5×4 og 3×3 m gir 29 m². 10 % svinn og 2,048 m²/pk → 16 pakker. Med 0,9 m listfradrag i hvert rom → 28,2 lm før reserve, eller 13 listelengder à 2,4 m med 10 % reserve.

## 7. Festemidler

`Grunnbehov = areal × dokumentert forbruk per m²`, eller `antall kryss × fester per kryss`.

`Behov = ceil(grunnbehov × f)`; `Pakker = ceil(behov / stk per pakke)`.

Kilde eller beskrevet innfestingsmønster er påkrevd. Ingen kapasitet, festelengde eller korrosjonsklasse dimensjoneres.

**Regneeksempel, ikke monteringsråd:** 28 m², oppgitt 20 stk/m² og 5 % reserve gir 588 stk. Ved 250/pk → 3 pakker, 750 stk levert.

## Hurtigverktøy og totalsummer

- 1 m = 100 cm = 1000 mm. Løpemeter er en lengde.
- Areal = L×B. Løpemeter = areal / dekkbredde_i_meter.
- Volum = tykkelse_mm × bredde_mm × lengde_m × antall / 1 000 000. Liter = m³×1000.
- Pakker/materialantall = ceil(behov / innhold per enhet).
- Mengde med prosenttillegg = mengde × (1 + prosent/100).
- Enhetspris = pris for kjent mengde / kjent mengde. Pakkepris = enhetspris × pakkeinnhold. Total = enhetspris × ønsket mengde. Mengdefeltene må bruke samme enhet.
- Prosjektsum = sum(mengde × registrert enhetspris). Linjer uten pris telles og merkes; summen er da delvis.

## Etterprøvbarhet

Lagrede beregninger inneholder inndata, resultatøyeblikksbilde, forutsetninger og dato. Redigering bruker gjeldende lokale produktdata. Ny lagring erstatter den beregningens materiallinjer. Manuell linjejustering merkes, men endrer ikke det historiske beregningsøyeblikksbildet.

Kontrollregningene testes i `tests/calculators.test.ts` og `tests/data.test.ts`. `tests/e2e/app.spec.ts` tester faktiske skjemaer, materiallister, import, lagring, PDF, mobil, offline og appoppdatering.
