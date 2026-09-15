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
    extraExclude: ["afrique", "asie","others"],
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
    extraExclude: ["asie", "europe", "others"],
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
    extraExclude: ["afrique", "europe", "others"],
    countries: [
      { code: "CN", numeric: 156, name: "Chine" },
      { code: "IN", numeric: 356, name: "Inde" },
      { code: "JP", numeric: 392, name: "Japon" },
      { code: "TH", numeric: 764, name: "Thaïlande" },
      { code: "SA", numeric: 682, name: "Arabie saoudite" },
      { code: "ID", numeric: 360, name: "Indonésie" },
      { code: "KR", numeric: 410, name: "Corée du Sud" },
      { code: "MN", numeric: 496, name: "Mongolie" },
    ],
  },
  amerique_nord: {
    label: "Amérique du Nord",
    emoji: "🗽",
    bbox: [-170, -50, 14, 72],
    extraExclude: ["afrique", "europe", "asie", "amerique_sud"],
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
    extraExclude: ["amerique_nord"],
    countries: [
      { code: "BR", numeric: 76, name: "Brésil" },
      { code: "AR", numeric: 32, name: "Argentine" },
      { code: "PE", numeric: 604, name: "Pérou" },
      { code: "CO", numeric: 170, name: "Colombie" },
      { code: "CL", numeric: 152, name: "Chili" },
      { code: "UY", numeric: 858 , name: "Uruguay" },
      { code: "EC", numeric: 218, name: "Équateur" },
      { code: "BO", numeric: 68, name: "Bolivie" },

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

// Tous les pays d'Europe, utilisés pour exclure le continent européen du
// "contexte" gris affiché sur la carte d'Asie (la Turquie sert de frontière :
// elle reste visible côté Asie en tant que pays à retrouver, mais tout ce qui
// est plus à l'ouest qu'elle n'a rien à faire sur cette carte).
const EUROPE_CODES = new Set([
  8, 20, 40, 112, 56, 70, 100, 191, 203, 208, 233, 246, 250, 276, 300, 348,
  352, 372, 380, 428, 438, 440, 442, 470, 498, 492, 499, 528, 744, 807, 578,
  616, 620, 642, 674, 688, 703, 705, 724, 752, 756, 804, 826,
]);

// Tous les pays d'Asie, utilisés pour exclure le continent asiatique du
// "contexte" gris affiché sur les cartes d'Europe et d'Afrique.
const ASIE_CODES = new Set([
  4, 31, 48, 50, 51, 64, 96, 104, 116, 144, 156, 196, 268, 275, 356, 360,
  364, 368, 376, 392, 398, 400, 408, 410, 414, 417, 418, 422, 458, 462, 496,
  512, 524, 586, 608, 626, 634, 643, 682, 702, 704, 760, 762, 764, 784, 792,
  795, 860, 887,
]);

// Tous les pays d'Amérique du Nord et d'Amérique centrale,
// utilisés pour exclure ce contexte gris lors de la carte d'Amérique du Sud.
const AM_NORD = new Set([
  28, 44, 52, 84, 124, 188, 192, 212, 214, 222, 308, 320, 332, 340, 388,
  484, 558, 591, 659, 662, 670, 780, 840,
]);


// Pays volontairement jamais affichés en "contexte" gris : soit trop grands et
// déformants à l'échelle d'un continent (Russie, Groenland, Antarctique), soit
// à cheval sur deux continents et donc ambigus pour de jeunes joueurs
// (Caucase, Asie centrale, péninsule arabique en dehors du Moyen-Orient ciblé).
const CONTEXT_EXCLUDE = new Set([
  643, // Russie
  10,  // Antarctique
  16,  // Îles subantarctiques françaises
  174, // Îles subantarctiques néo-zélandaises
  212, // Îles subantarctiques britanniques
  239, // Îles subantarctiques chiliennes
  334, // Îles subantarctiques australiennes
  535, // Îles subantarctiques sud-africaines
  540, // Îles subantarctiques norvégiennes
  562, // Îles subantarctiques néerlandaises
  574, // Îles subantarctiques américaines
  580, // Îles subantarctiques norvégiennes (Bouvet)
  598, // Îles subantarctiques françaises (Kerguelen)
  616, // Îles subantarctiques britanniques (Géorgie du Sud)
  626, // Îles subantarctiques britanniques (Sandwich du Sud)
  630, // Îles subantarctiques britanniques (Shetland du Sud)
  638, // Îles subantarctiques britanniques (Île de la Déception)
  642, // Îles subantarctiques britanniques (Île de l'Éléphant)
  643, // Russie
  744, // Antarctique
  304, // Groenland
  268, // Géorgie
  51,  // Arménie
  31,  // Azerbaïdjan
  196, // Chypre
  887, // Yémen
  512, // Oman
  784, // Émirats arabes unis
  634, // Qatar
  414, // Koweït
  48,  // Bahreïn
  792, // Turquie (n'apparaît qu'en Asie, jamais en contexte sur la carte d'Europe)
  744, // Antarctique
  578, // Norvège
]);


const EXTRA_EXCLUDE_SETS = {
  afrique: AFRICA_CODES,
  europe: EUROPE_CODES,
  asie: ASIE_CODES,
  amerique_nord: AM_NORD,
  others: CONTEXT_EXCLUDE,
};
