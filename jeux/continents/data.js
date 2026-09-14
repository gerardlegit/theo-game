// ============================================================================
// Données du jeu "Continents"
// Chaque pays est identifié par son code ISO 3166-1 alpha-2 (pour le drapeau)
// et son code numérique ISO 3166-1 (pour le retrouver dans la carte topoJSON).
// "bbox" = zone [lonMin, lonMax, latMin, latMax] utilisée pour dessiner les
// pays "de contexte" (en gris, non-interactifs) autour des pays à retrouver.
// ============================================================================

const CONTINENTS = {
  europe: {
    label: "Europe",
    emoji: "🇪🇺",
    bbox: [-25, 45, 34, 72],
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
    bbox: [26, 150, -12, 78],
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
  amerique: {
    label: "Amérique",
    emoji: "🌎",
    bbox: [-170, -30, -58, 75],
    countries: [
      { code: "US", numeric: 840, name: "États-Unis" },
      { code: "CA", numeric: 124, name: "Canada" },
      { code: "MX", numeric: 484, name: "Mexique" },
      { code: "BR", numeric: 76, name: "Brésil" },
      { code: "AR", numeric: 32, name: "Argentine" },
      { code: "PE", numeric: 604, name: "Pérou" },
      { code: "CO", numeric: 170, name: "Colombie" },
      { code: "CL", numeric: 152, name: "Chili" },
    ],
  },
  oceanie: {
    label: "Océanie",
    emoji: "🏝️",
    bbox: [110, 180, -50, 0],
    countries: [
      { code: "AU", numeric: 36, name: "Australie" },
      { code: "NZ", numeric: 554, name: "Nouvelle-Zélande" },
      { code: "PG", numeric: 598, name: "Papouasie-Nouvelle-Guinée" },
      { code: "VU", numeric: 548, name: "Vanuatu" },
      { code: "SB", numeric: 90, name: "Îles Salomon" },
    ],
  },
};
