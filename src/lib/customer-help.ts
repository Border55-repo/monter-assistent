import type { Kind } from "./types";

export interface CustomerTopic {
  id: string;
  title: string;
  summary: string;
  words: string;
  questions: string[];
  checks: string[];
  advice: string;
  kinds: Kind[];
  guideId: string;
  sources: { title: string; url: string }[];
}
export const customerTopics: CustomerTopic[] = [
  {
    id: "terrasse",
    title: "Kunden skal bygge terrasse",
    summary:
      "Avklar bord, underkonstruksjon og innfesting før du teller pakker.",
    words: "platting utegulv veranda uteplass terrassebord",
    questions: [
      "Hva er lengde, bredde og ønsket bordretning?",
      "Hvilket bord og hvilke handelslengder skal brukes?",
      "Er bæresystem og opplegg avklart?",
      "Er terrassen utsatt for salt, bassengvann eller andre krevende forhold?",
      "Ønsker kunden toppskruing eller et bestemt skjult system?",
    ],
    checks: [
      "Kontroller fuge, skjøter og opplegg i bordets anvisning.",
      "Avklar riktig festemiddel til valgt bord og miljø.",
      "Vurder beslag, endevedbehandling og nødvendig verktøy.",
      "Kontroller mengder og tilgjengelige handelslengder før plukk.",
    ],
    advice:
      "Bordtype og monteringssystem styrer løsningen. Mengdeestimatet godkjenner ikke bæresystem eller skjøteplan.",
    kinds: ["deck", "fixings"],
    guideId: "deck",
    sources: [
      {
        title: "Bergene Holm: montering av terrassebord",
        url: "https://www.bergeneholm.no/inspirasjon/byggeguider/montering-utegulv-av-terrassebord",
      },
    ],
  },
  {
    id: "isolere",
    title: "Kunden skal isolere",
    summary: "Begynn med konstruksjonen og riktig produktvariant.",
    words: "glava mineralull garasje bod etterisolere lyd varme vegg tak",
    questions: [
      "Er det innervegg, yttervegg, tak eller gulv?",
      "Er rommet oppvarmet, og er det fukt eller kjellerforhold å ta hensyn til?",
      "Hva er flatenes mål, åpninger og tilgjengelig isolasjonstykkelse?",
      "Hvilken produktvariant og bredde passer den planlagte konstruksjonen?",
    ],
    checks: [
      "Kontroller variantens dekning per pakke.",
      "Avklar plater, tetting og verktøy som hører til konstruksjonen.",
      "Avklar krav til lyd, brann og fukt med riktig fagperson ved behov.",
    ],
    advice:
      "Dampsperre er ikke et automatisk tillegg til all isolasjon. Avklar hele oppbygningen og følg dokumentasjonen for den aktuelle konstruksjonen.",
    kinds: ["insulation", "timber", "sheets"],
    guideId: "insulation",
    sources: [
      {
        title: "GLAVA: isolering og tetting av innervegger",
        url: "https://www.glava.no/tema/isolering-og-tetting-av-innervegger",
      },
      {
        title: "GLAVA: generelt om yttervegger",
        url: "https://www.glava.no/tema/generelt-om-yttervegger",
      },
    ],
  },
  {
    id: "lettvegg",
    title: "Kunden skal sette opp lettvegg",
    summary: "Få med stendere, plater og tilpasset innfesting.",
    words: "gips skillevegg innervegg stenderverk rom osb mdf",
    questions: [
      "Hva er lengde, høyde, dører og andre åpninger?",
      "Hvilken veggoppbygning er valgt, og er veggen bærende?",
      "Skal noe tungt festes på veggen?",
      "Hvilke krav gjelder til lyd, brann og overflate?",
    ],
    checks: [
      "Avklar stendere, sviller, ekstra spikerslag og platevalg.",
      "Velg skruer etter platetype og underlag av tre eller stål.",
      "Vurder isolasjon, fuging og skjøteprodukter etter valgt system.",
    ],
    advice:
      "Et plateantall dokumenterer ikke veggens ytelse. Bruk en dokumentert oppbygning når det stilles brann-, lyd- eller lastkrav.",
    kinds: ["timber", "sheets", "insulation", "fixings"],
    guideId: "gips",
    sources: [
      {
        title: "Gyproc: skrueguide for plater og underlag",
        url: "https://www.gyproc.no/losninger/gyproc-skrueguide",
      },
      {
        title: "GLAVA: innervegger",
        url: "https://www.glava.no/tema/isolering-og-tetting-av-innervegger",
      },
    ],
  },
  {
    id: "kledning",
    title: "Kunden skal skifte kledning",
    summary: "Finn riktig profil, dekkbredde og monteringsretning.",
    words: "panel utvendig vegg fasade tømmermann dobbelfals",
    questions: [
      "Skal kledningen være stående eller liggende?",
      "Hvilken profil og behandling ønsker kunden?",
      "Hva er veggmål og åpninger?",
      "Er underlaget, luftingen og detaljene rundt åpninger avklart?",
    ],
    checks: [
      "Bruk dokumentert dekkbredde for den valgte profilen.",
      "Avklar lekter, innfesting, hjørner og avslutninger.",
      "Kontroller behov for behandling av kapp og overflate i produktanvisningen.",
    ],
    advice:
      "Enkeltprofil og over-/underliggere beregnes forskjellig. Nominell bordbredde er ikke automatisk dekkbredden.",
    kinds: ["cladding", "fixings"],
    guideId: "cladding",
    sources: [
      {
        title: "Moelven: montering av utvendig kledning",
        url: "https://www.moelven.com/no/bygge-og-bo/kledning/montering/",
      },
    ],
  },
  {
    id: "gulv",
    title: "Kunden skal legge gulv",
    summary: "Avklar undergulv og tilbehør før pakkeantallet beregnes.",
    words: "parkett laminat rom gulvvarme underlag list fuktsperre",
    questions: [
      "Hva er målene i hvert rom og ønsket leggemønster?",
      "Er undergulvet tre, betong eller et annet materiale?",
      "Er gulvvarme, fuktforhold og monteringsmetode avklart?",
      "Har gulvet integrert underlag, og hva krever akkurat dette produktet?",
    ],
    checks: [
      "Kontroller gulvvariantens pakningsdekning.",
      "Avklar underlag og eventuell fuktsikring i produktets anvisning.",
      "Vurder lister, overganger, avslutninger og monteringsverktøy.",
    ],
    advice:
      "Krav til underlag og fuktsikring varierer med gulv, undergulv og monteringsmetode. Tilbehør legges til etter avklaring.",
    kinds: ["flooring"],
    guideId: "flooring",
    sources: [
      {
        title: "Pergo: underlag til parkett",
        url: "https://www.pergo.no/nb-no/sporsmal-og-svar/parkett/blandet/hvilket-underlag-trenger-jeg-nar-jeg-skal-legge-et-pergo-parkettgulv",
      },
    ],
  },
  {
    id: "skruer",
    title: "Kunden trenger riktig skrue",
    summary: "Spør hva som skal festes, i hvilket underlag og hvilket miljø.",
    words: "festemiddel spiker gipsskrue terrasseskrue innfesting rustfri",
    questions: [
      "Hva skal festes, og hvor tykt er materialet?",
      "Hva er underlaget: tre, stål, mur eller plate?",
      "Skal festet brukes inne, ute eller i et korrosivt miljø?",
      "Er det et bestemt monteringssystem eller krav til dokumentert kapasitet?",
    ],
    checks: [
      "Kontroller festemiddeltype, lengde og egnethet i produsentens anvisning.",
      "Finn forbruk eller festemønster for akkurat den valgte løsningen.",
      "Kontroller antall per salgspakke og riktig bits eller verktøy.",
    ],
    advice:
      "Skrueantall og pakkeavrunding velger ikke riktig skrue. Bærende innfesting må ha dokumentert kapasitet.",
    kinds: ["fixings"],
    guideId: "fixings",
    sources: [
      {
        title: "Gyproc: riktig skrue til plate og underlag",
        url: "https://www.gyproc.no/losninger/gyproc-skrueguide",
      },
      {
        title: "ESSVE: velg riktig skruekvalitet til terrasse",
        url: "https://essve.com/no/byggeguider/terrassetips/slik-bygger-du-terrasse/velg-riktig-skruekvalitet",
      },
    ],
  },
];
