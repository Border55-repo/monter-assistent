export interface Guide {
  id: string;
  category: string;
  title: string;
  summary: string;
  use: string;
  benefit: string;
  limitation: string;
  mounting: string;
  extras: string;
  sources: { title: string; url: string }[];
}
export const guides: Guide[] = [
  {
    id: "osb-mdf",
    category: "Bygningsplater",
    title: "OSB eller MDF?",
    summary: "Velg etter bruksområde, fuktforhold og dokumenterte egenskaper.",
    use: "OSB brukes blant annet i dokumenterte gulv-, vegg- og takkonstruksjoner. MDF velges ofte til innredning og bearbeidede overflater.",
    benefit:
      "OSB-varianter finnes med dokumenterte konstruktive egenskaper. MDF har en jevn overflate som egner seg for bearbeiding.",
    limitation:
      "OSB-kvalitet, tykkelse og last må stemme med konstruksjonen. Standard MDF skal ikke antas egnet for fukt eller bærende bruk.",
    mounting:
      "Kontroller produktklasse, skjøter, dekkmål og bevegelsesfuger. Not og fjær kan gi andre dekkmål enn yttermål.",
    extras: "Riktig festemiddel, egnet lim og overflatebehandling.",
    sources: [
      {
        title: "EGGER: OSB – bruksområder og tykkelser",
        url: "https://www.egger.com/get_download/71eed3e9-3d71-42a1-ac70-00c20055e38f/Thickness_Application_Guideline_for_EGGER_OSB_EGGER_DHF_TLBP102.pdf?country=PL",
      },
      {
        title: "Kronospan: produktinformasjon",
        url: "https://kronospan.com/en_MC/faq/",
      },
    ],
  },
  {
    id: "insulation",
    category: "Isolasjon",
    title: "Riktig isolasjon til riktig konstruksjon",
    summary: "Glassull, steinull og trefiber krever variantkontroll.",
    use: "GLAVA Proff 34 leveres som plate og rull. Hunton Nativo har egne varianter for tre- og stålstendere. ROCKWOOL Flexi A-plate 34 er en separat produktserie.",
    benefit: "Dokumenterte pakningsdata gir etterprøvbart mengdegrunnlag.",
    limitation:
      "Samme tykkelse betyr ikke lik pakningsdekning. Arealberegning dokumenterer ikke brannmotstand, U-verdi eller lydklasse for en konstruksjon.",
    mounting:
      "Kontroller bredde og tilpasning i produsentens anvisning. Ikke velg produkt kun etter c/c-mål.",
    extras: "Undersøk plater og tettesystem ut fra hele konstruksjonen.",
    sources: [
      {
        title: "GLAVA: Proff 34 Plate",
        url: "https://www.glava.no/produkter/glava-proff-34-plate",
      },
      {
        title: "ROCKWOOL: Flexi A-plate 34",
        url: "https://www.rockwool.com/no/radgivning-og-inspirasjon/kampagne/nyhet-flexi-a-plate-34/",
      },
      {
        title: "Hunton: Nativo Plate",
        url: "https://www.hunton.no/produkter/vegg/hunton-nativo_trefiberisolasjon-plater/",
      },
    ],
  },
  {
    id: "timber",
    category: "Trelast",
    title: "Mengde er ikke dimensjonering",
    summary: "Et riktig antall stendere sier ikke hva veggen kan bære.",
    use: "Stendere og sviller inngår i bindingsverk. Åpninger, hjørner og lastpunkter kan kreve ekstra virke.",
    benefit: "Regn inn start- og sluttstender og eksplisitte tillegg.",
    limitation:
      "Styrkeklasse, tverrsnitt og avstand må prosjekteres for den aktuelle belastningen.",
    mounting:
      "Kontroller kappmål mot vegghøyde og antall svillag. Faglig kontroll kreves for bærende konstruksjoner.",
    extras: "Beslag og festemidler må ha dokumentert kapasitet.",
    sources: [
      {
        title: "GLAVA: generelt om yttervegger",
        url: "https://www.glava.no/tema/generelt-om-yttervegger",
      },
      {
        title: "DiBK: konstruksjonssikkerhet",
        url: "https://www.dibk.no/regelverk/byggteknisk-forskrift-tek17/10/10-2",
      },
    ],
  },
  {
    id: "deck",
    category: "Terrasse",
    title: "Fuge, bjelker og innfesting",
    summary: "Tresort og fuktinnhold påvirker monteringen.",
    use: "Terrassebord legges med tilpasset fuge på et dokumentert bæresystem.",
    benefit:
      "Beregning i bordrader synliggjør endebord og faktiske innkjøpslengder.",
    limitation:
      "Et lengdeforslag er ikke en godkjent skjøteplan. Kompositt og skjulte systemer kan kreve andre fester og avstander.",
    mounting:
      "Bergene Holm beskriver at fuge må tilpasses fuktinnhold. Skjøter må ha opplegg og følge anvisningen.",
    extras:
      "Kontroller korrosjonsklasse for skruer og behov for beslag og endevedbehandling.",
    sources: [
      {
        title: "Bergene Holm: montering av terrassebord",
        url: "https://www.bergeneholm.no/inspirasjon/byggeguider/montering-utegulv-av-terrassebord",
      },
      {
        title: "ESSVE: velg riktig skruekvalitet",
        url: "https://essve.com/no/byggeguider/terrassetips/slik-bygger-du-terrasse/velg-riktig-skruekvalitet",
      },
    ],
  },
  {
    id: "gips",
    category: "Bygningsplater",
    title: "Gips, skjøter og skruer",
    summary: "Antall lag og underlaget bestemmer innfestingen.",
    use: "Standardgips brukes til innvendig kledning i dokumenterte systemer.",
    benefit: "Egnet for skjøtesparkling og plane overflater.",
    limitation:
      "Brann- og lydegenskaper gjelder den dokumenterte oppbygningen. Standardplate er ikke automatisk en våtromsløsning.",
    mounting:
      "Gyproc skiller mellom kant, felt, første og ytterste lag. Bruk riktig anvisning for valgt plate og underlag.",
    extras: "Tilpassede gipsskruer, skjøteremse, sparkel og hjørneprofiler.",
    sources: [
      {
        title: "Norgips: Standard",
        url: "https://norgips.no/produkter/gipsplater/gipsplate-standard-13",
      },
      {
        title: "Gyproc: skrueguide",
        url: "https://www.gyproc.no/losninger/gyproc-skrueguide",
      },
    ],
  },
  {
    id: "plywood",
    category: "Bygningsplater",
    title: "Kryssfiner",
    summary: "Plateoppbygning og produktklasse bestemmer bruken.",
    use: "Produsenter leverer egne produkter til vegg, tak, gulv, forskaling og innredning.",
    benefit:
      "Kryssfiner finnes i flere tresorter og utførelser for ulike bruksområder.",
    limitation:
      "Tykkelse alene dokumenterer ikke bæreevne eller fuktbestandighet.",
    mounting:
      "Kontroller overflate, kantbeskyttelse, skjøter og innfesting i valgt datablad.",
    extras: "Festemidler og eventuell kant- og overflatebehandling.",
    sources: [
      {
        title: "Metsä Wood: bruksområder",
        url: "https://www.metsagroup.com/metsawood/explore-wood/plywood-applications/",
      },
    ],
  },
  {
    id: "chipboard",
    category: "Bygningsplater",
    title: "Spon og trefiber",
    summary: "Bruk faktisk dekkmål ved not og fjær.",
    use: "Forestia har egne gulv- og veggprodukter; Huntonit har egne vegg-, tak- og tekniske plater.",
    benefit: "Profilerte skjøter kan gi effektiv montering i tiltenkt system.",
    limitation:
      "Produktene har forskjellige krav til fukt, underlag og innfesting. Monteringsregler kan ikke overføres mellom alle platetyper.",
    mounting:
      "Bruk produktets netto dekkmål og aktuell monteringsanvisning. Velg riktig variant for underlag og fuktklasse.",
    extras: "Anvist lim, festemidler og avslutninger.",
    sources: [
      {
        title: "Forestia: monteringsanvisninger",
        url: "https://www.forestia.no/produkter/produkt-2/",
      },
      {
        title: "Huntonit: monteringsanvisninger",
        url: "https://www.huntonit.no/montering-og-tilbehoer/monteringsanvisninger/",
      },
    ],
  },
  {
    id: "cladding",
    category: "Kledning",
    title: "Dekkbredde og overlapp",
    summary: "Enkeltbord og tømmermannskledning beregnes ulikt.",
    use: "Profilert kledning bruker dokumentert dekkbredde. Over-/underliggere danner en modul med to bord og to overlapp.",
    benefit: "Riktig modulbredde gir et kontrollerbart løpemeterbehov.",
    limitation:
      "Én universell dekkbredde kan ikke brukes for forskjellige profiler og bordkombinasjoner.",
    mounting:
      "Kontroller lufting, innfesting, endeved og produsentens profiltegning.",
    extras:
      "Lekter, musebånd, hjørnebord og egnet behandling etter valgt løsning.",
    sources: [
      {
        title: "Bergene Holm: beregning av kledningsdimensjoner",
        url: "https://www.bergeneholm.no/dokumentasjon/beregning-kledningsdimensjoner/",
      },
      {
        title: "Moelven: kledningsprodukter",
        url: "https://www.moelven.com/no/no/fasade-og-utemiljo/kledning/",
      },
    ],
  },
  {
    id: "flooring",
    category: "Gulv",
    title: "Gulvpakker og underlag",
    summary: "Ta rom for rom og kontroller pakningsdekningen.",
    use: "Parkett, laminat og andre gulv leveres med ulike pakningsmål og monteringssystemer.",
    benefit: "Samlet areal og separat listomkrets gir et oversiktlig behov.",
    limitation:
      "Mønster, kapp, uregelmessige rom og sortering påvirker svinn. Velg svinn eksplisitt; appen gir ingen universell prosent.",
    mounting:
      "Kontroller underlagsfukt, fuktsperre, ekspansjonsfuger og om underlag er integrert i produktet.",
    extras: "Aktuelt underlag, overganger og gulvlister.",
    sources: [
      {
        title: "Pergo: teknisk datablad Lillehammer, 01.2026",
        url: "https://www.pergo.no/-/media/imported%20assets/flooring/a/0/0/pgtdslmpnorlillehammernopdf223587.ashx?filename=Teknisk+Datablad.pdf&rev=bb4df16d3e48438b987e3156a7aa6e86&type=original",
      },
    ],
  },
  {
    id: "fixings",
    category: "Festemidler",
    title: "Dokumenter innfestingsmønsteret",
    summary: "Forbruk og egnethet er to forskjellige kontroller.",
    use: "Skruer og spiker velges etter underlag, produkt, miljø og krav.",
    benefit:
      "Pakkeavrunding blir riktig når forbruk og pakningsinnhold er kjent.",
    limitation:
      "Et antall skruer dokumenterer ikke kapasiteten til en bærende forbindelse.",
    mounting:
      "Bruk produsentens mønster for den konkrete løsningen. Skjulte terrassefester beregnes etter systemets anvisning.",
    extras: "Riktig bits, bor og eventuell kantbeskyttelse.",
    sources: [
      {
        title: "ESSVE: terrasseskrue",
        url: "https://essve.com/no/produkter/bygg-og-treskrue/terrasseskrue",
      },
      {
        title: "Gyproc: skrueguide",
        url: "https://www.gyproc.no/losninger/gyproc-skrueguide",
      },
    ],
  },
  {
    id: "membranes",
    category: "Tetting & undertak",
    title: "Dampsperre, vindsperre og undertak",
    summary: "Velg sjikt etter hele konstruksjonen.",
    use: "Sjikt på varm og kald side har forskjellige oppgaver. Undertak er et eget produktvalg.",
    benefit:
      "Et kompatibelt tettesystem kan dokumentere skjøter og gjennomføringer.",
    limitation:
      "Dampsperre skal ikke legges til automatisk ved all isolering. Eksisterende konstruksjon og fuktforhold må avklares.",
    mounting:
      "Kontroller plassering, overlapp, tape og tilslutninger i valgt system. Kompliserte fuktforhold krever faglig vurdering.",
    extras: "Kompatibel tape, mansjetter og klemløsninger.",
    sources: [
      {
        title: "GLAVA: yttervegger",
        url: "https://www.glava.no/tema/generelt-om-yttervegger",
      },
      {
        title: "Hunton: monteringsanvisning Vindtett",
        url: "https://www.hunton.no/wp-content/uploads/2018/04/hunton-vindtett_monteringsanvisning_web-1.pdf",
      },
      {
        title: "Huntonit: tekniske produkter og dokumentasjon",
        url: "https://www.huntonit.no/",
      },
    ],
  },
];
