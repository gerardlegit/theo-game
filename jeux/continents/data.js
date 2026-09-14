// ============================================================================
// Données du jeu "Continents"
// Chaque pays est identifié par son code ISO 3166-1 alpha-2 (pour le drapeau)
// et son code numérique ISO 3166-1 (pour le retrouver dans la carte topoJSON).
// "bbox" = zone [lonMin, lonMax, latMin, latMax] utilisée pour cadrer la carte
// et sélectionner les pays "de contexte" (en gris, non-interactifs) autour des
// pays à retrouver.
// ============================================================================

const CONTINENTS = {
  europe: {
    label: "Europe",
    emoji: "🇪🇺",
    bbox: [-25, 40, 35, 71],
    extraExclude: "afrique",
    countries: [
      { code: "FR", numeric: 250, name: "France" },
      { code: "DE", numeric: 276, name: "Allemagne" },
      { code: "ES", numeric: 724, name: "Espagne" },
      { code: "IT", numeric: 380, name: "Italie" },
      { code: "GB", numeric: 826, name: "Royaume-Uni" },
      { code: "PL", numeric: 616, name: "Pologne" },
      { code: "SE", numeric: 752, name: "Suède" },
      { code: "GR", numeric: 300, name: "Grèce" },
    ],
  },
  afrique: {
    label: "Afrique",
    emoji: "🌍",
    bbox: [-20, 52, -35, 38],
    countries: [
      { code: "EG", numeric: 818, name: "Égypte" },
      { code: "NG", numeric: 566, name: "Nigeria" },
      { code: "ZA", numeric: 710, name: "Afrique du Sud" },
      { code: "KE", numeric: 404, name: "Kenya" },
      { code: "MA", numeric: 504, name: "Maroc" },
      { code: "DZ", numeric: 12, name: "Algérie" },
      { code: "ET", numeric: 231, name: "Éthiopie" },
      { code: "MG", numeric: 450, name: "Madagascar" },
    ],
  },
  asie: {
    label: "Asie",
    emoji: "🌏",
    bbox: [33, 145, 0, 55],
    extraExclude: "afrique",
    countries: [
      { code: "CN", numeric: 156, name: "Chine" },
      { code: "IN", numeric: 356, name: "Inde" },
      { code: "JP", numeric: 392, name: "Japon" },
      { code: "TH", numeric: 764, name: "Thaïlande" },
      { code: "SA", numeric: 682, name: "Arabie saoudite" },
      { code: "ID", numeric: 360, name: "Indonésie" },
      { code: "KR", numeric: 410, name: "Corée du Sud" },
      { code: "TR", numeric: 792, name: "Turquie" },
    ],
  },
  amerique_nord: {
    label: "Amérique du Nord",
    emoji: "🗽",
    bbox: [-170, -50, 14, 72],
    countries: [
      { code: "US", numeric: 840, name: "États-Unis" },
      { code: "CA", numeric: 124, name: "Canada" },
      { code: "MX", numeric: 484, name: "Mexique" },
    ],
  },
  amerique_sud: {
    label: "Amérique du Sud",
    emoji: "🦙",
    bbox: [-82, -34, -56, 13],
    countries: [
      { code: "BR", numeric: 76, name: "Brésil" },
      { code: "AR", numeric: 32, name: "Argentine" },
      { code: "PE", numeric: 604, name: "Pérou" },
      { code: "CO", numeric: 170, name: "Colombie" },
      { code: "CL", numeric: 152, name: "Chili" },
    ],
  },
};

// Tous les pays d'Afrique (les 54 États membres de l'ONU), utilisés pour
// exclure le continent africain du "contexte" gris affiché sur les cartes
// d'autres continents (Europe, Asie) qui n'ont rien à y faire.
const AFRICA_CODES = new Set([
  12, 24, 204, 72, 854, 108, 132, 120, 140, 148, 174, 178, 180, 262, 818, 226,
  232, 748, 231, 266, 270, 288, 324, 624, 384, 404, 426, 430, 434, 450, 454,
  466, 478, 480, 504, 508, 516, 562, 566, 646, 678, 686, 690, 694, 706, 710,
  728, 729, 834, 768, 788, 800, 894, 716,
]);

const EXTRA_EXCLUDE_SETS = {
  afrique: AFRICA_CODES,
};

// Pays volontairement jamais affichés en "contexte" gris : soit trop grands et
// déformants à l'échelle d'un continent (Russie, Groenland, Antarctique), soit
// à cheval sur deux continents et donc ambigus pour de jeunes joueurs
// (Caucase, Asie centrale, péninsule arabique en dehors du Moyen-Orient ciblé).
const CONTEXT_EXCLUDE = new Set([
  643, // Russie
  10,  // Antarctique
  304, // Groenland
  804, // Ukraine
  268, // Géorgie
  51,  // Arménie
  31,  // Azerbaïdjan
  398, // Kazakhstan
  417, // Kirghizistan
  795, // Turkménistan
  860, // Ouzbékistan
  762, // Tadjikistan
  196, // Chypre
  887, // Yémen
  512, // Oman
  784, // Émirats arabes unis
  634, // Qatar
  414, // Koweït
  48,  // Bahreïn
]);
