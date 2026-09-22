// ============================================================================
// Données du jeu "Continents"
//
// Carte utilisée : world-atlas "countries-50m" (Natural Earth). Chaque pays y
// est identifié par son code numérique ISO 3166-1 ; les rares territoires sans
// code (Kosovo, Somaliland…) sont identifiés par leur nom anglais dans la carte.
//
// Pour chaque continent :
//  - colors  : dégradé de l'icône (globe) du continent
//  - center  : [longitude, latitude] du centre de la projection
//  - clip    : [lonMin, lonMax, latMin, latMax]. Seuls les morceaux (îles,
//              territoires) dont le centre tombe dans cette zone sont gardés :
//              c'est ce qui retire la Guyane et la Réunion de la France, les
//              Canaries de l'Espagne, Hawaï des États-Unis, etc.
//  - exclude : zones supplémentaires à retirer, même si elles sont dans "clip"
//  - partial : pays trop grands, à cheval sur deux continents (la Russie) :
//              ils ne servent pas à cadrer la carte et sont coupés au bord
//  - context : territoires du continent qui ne sont pas des pays à trouver
//              (affichés en gris pour ne pas laisser de trou dans la carte)
//  - countries : les pays à retrouver. "ids" = morceaux de carte à fusionner
//              (par défaut, juste le code numérique du pays)
// ============================================================================

const CONTINENTS = {
  europe: {
    label: "Europe",
    colors: ["#8B7BFF", "#3A8DFF"],
    iconExclude: ["RU"], // l'icône montre l'Europe sans toute la Sibérie
    center: [15, 52],
    clip: [-25, 50, 34, 72],
    partial: ["RU"],
    context: [
      // Seule la petite partie européenne de la Turquie (autour d'Istanbul)
      { ids: [792], clip: [25, 30, 40.5, 42.5] },
    ],
    countries: [
      { code: "AL", numeric: 8, name: "Albanie" },
      { code: "DE", numeric: 276, name: "Allemagne" },
      { code: "AD", numeric: 20, name: "Andorre" },
      { code: "AT", numeric: 40, name: "Autriche" },
      { code: "BE", numeric: 56, name: "Belgique" },
      { code: "BY", numeric: 112, name: "Biélorussie" },
      { code: "BA", numeric: 70, name: "Bosnie-Herzégovine" },
      { code: "BG", numeric: 100, name: "Bulgarie" },
      { code: "CY", numeric: 196, name: "Chypre", ids: [196, "N. Cyprus"] },
      { code: "HR", numeric: 191, name: "Croatie" },
      { code: "DK", numeric: 208, name: "Danemark" },
      { code: "ES", numeric: 724, name: "Espagne" },
      { code: "EE", numeric: 233, name: "Estonie" },
      { code: "FI", numeric: 246, name: "Finlande", ids: [246, 248] },
      { code: "FR", numeric: 250, name: "France" },
      { code: "GR", numeric: 300, name: "Grèce" },
      { code: "HU", numeric: 348, name: "Hongrie" },
      { code: "IE", numeric: 372, name: "Irlande" },
      { code: "IS", numeric: 352, name: "Islande" },
      { code: "IT", numeric: 380, name: "Italie" },
      { code: "XK", numeric: null, name: "Kosovo", ids: ["Kosovo"] },
      { code: "LV", numeric: 428, name: "Lettonie" },
      { code: "LI", numeric: 438, name: "Liechtenstein" },
      { code: "LT", numeric: 440, name: "Lituanie" },
      { code: "LU", numeric: 442, name: "Luxembourg" },
      { code: "MK", numeric: 807, name: "Macédoine du Nord" },
      { code: "MT", numeric: 470, name: "Malte" },
      { code: "MD", numeric: 498, name: "Moldavie" },
      { code: "MC", numeric: 492, name: "Monaco" },
      { code: "ME", numeric: 499, name: "Monténégro" },
      { code: "NO", numeric: 578, name: "Norvège" },
      { code: "NL", numeric: 528, name: "Pays-Bas" },
      { code: "PL", numeric: 616, name: "Pologne" },
      { code: "PT", numeric: 620, name: "Portugal" },
      { code: "CZ", numeric: 203, name: "Tchéquie" },
      { code: "RO", numeric: 642, name: "Roumanie" },
      // Îles anglo-normandes et île de Man rattachées au Royaume-Uni
      { code: "GB", numeric: 826, name: "Royaume-Uni", ids: [826, 831, 832, 833] },
      { code: "RU", numeric: 643, name: "Russie" },
      { code: "SM", numeric: 674, name: "Saint-Marin" },
      { code: "RS", numeric: 688, name: "Serbie" },
      { code: "SK", numeric: 703, name: "Slovaquie" },
      { code: "SI", numeric: 705, name: "Slovénie" },
      { code: "SE", numeric: 752, name: "Suède" },
      { code: "CH", numeric: 756, name: "Suisse" },
      { code: "UA", numeric: 804, name: "Ukraine" },
      { code: "VA", numeric: 336, name: "Vatican" },
    ],
  },

  afrique: {
    label: "Afrique",
    colors: ["#FFC04D", "#FF5E62"],
    center: [18, 2],
    clip: [-26, 60, -36, 38],
    context: [
      { ids: [732] }, // Sahara occidental (territoire au statut non défini)
    ],
    countries: [
      { code: "ZA", numeric: 710, name: "Afrique du Sud" },
      { code: "DZ", numeric: 12, name: "Algérie" },
      { code: "AO", numeric: 24, name: "Angola" },
      { code: "BJ", numeric: 204, name: "Bénin" },
      { code: "BW", numeric: 72, name: "Botswana" },
      { code: "BF", numeric: 854, name: "Burkina Faso" },
      { code: "BI", numeric: 108, name: "Burundi" },
      { code: "CM", numeric: 120, name: "Cameroun" },
      { code: "CV", numeric: 132, name: "Cap-Vert" },
      { code: "CF", numeric: 140, name: "Centrafrique" },
      { code: "KM", numeric: 174, name: "Comores" },
      { code: "CG", numeric: 178, name: "Congo" },
      { code: "CD", numeric: 180, name: "RD Congo" },
      { code: "CI", numeric: 384, name: "Côte d'Ivoire" },
      { code: "DJ", numeric: 262, name: "Djibouti" },
      { code: "EG", numeric: 818, name: "Égypte" },
      { code: "ER", numeric: 232, name: "Érythrée" },
      { code: "SZ", numeric: 748, name: "Eswatini" },
      { code: "ET", numeric: 231, name: "Éthiopie" },
      { code: "GA", numeric: 266, name: "Gabon" },
      { code: "GM", numeric: 270, name: "Gambie" },
      { code: "GH", numeric: 288, name: "Ghana" },
      { code: "GN", numeric: 324, name: "Guinée" },
      { code: "GW", numeric: 624, name: "Guinée-Bissau" },
      { code: "GQ", numeric: 226, name: "Guinée équatoriale" },
      { code: "KE", numeric: 404, name: "Kenya" },
      { code: "LS", numeric: 426, name: "Lesotho" },
      { code: "LR", numeric: 430, name: "Liberia" },
      { code: "LY", numeric: 434, name: "Libye" },
      { code: "MG", numeric: 450, name: "Madagascar" },
      { code: "MW", numeric: 454, name: "Malawi" },
      { code: "ML", numeric: 466, name: "Mali" },
      { code: "MA", numeric: 504, name: "Maroc" },
      { code: "MU", numeric: 480, name: "Maurice" },
      { code: "MR", numeric: 478, name: "Mauritanie" },
      { code: "MZ", numeric: 508, name: "Mozambique" },
      { code: "NA", numeric: 516, name: "Namibie" },
      { code: "NE", numeric: 562, name: "Niger" },
      { code: "NG", numeric: 566, name: "Nigeria" },
      { code: "UG", numeric: 800, name: "Ouganda" },
      { code: "RW", numeric: 646, name: "Rwanda" },
      { code: "ST", numeric: 678, name: "Sao Tomé-et-Principe" },
      { code: "SN", numeric: 686, name: "Sénégal" },
      { code: "SC", numeric: 690, name: "Seychelles" },
      { code: "SL", numeric: 694, name: "Sierra Leone" },
      { code: "SO", numeric: 706, name: "Somalie", ids: [706, "Somaliland"] },
      { code: "SD", numeric: 729, name: "Soudan" },
      { code: "SS", numeric: 728, name: "Soudan du Sud" },
      { code: "TZ", numeric: 834, name: "Tanzanie" },
      { code: "TD", numeric: 148, name: "Tchad" },
      { code: "TG", numeric: 768, name: "Togo" },
      { code: "TN", numeric: 788, name: "Tunisie" },
      { code: "ZM", numeric: 894, name: "Zambie" },
      { code: "ZW", numeric: 716, name: "Zimbabwe" },
    ],
  },

  asie: {
    label: "Asie",
    colors: ["#FF7EB3", "#A445E6"],
    center: [90, 30],
    clip: [25, 150, -12, 56],
    partial: ["RU"],
    countries: [
      { code: "AF", numeric: 4, name: "Afghanistan" },
      { code: "SA", numeric: 682, name: "Arabie saoudite" },
      { code: "AM", numeric: 51, name: "Arménie" },
      { code: "AZ", numeric: 31, name: "Azerbaïdjan" },
      { code: "BH", numeric: 48, name: "Bahreïn" },
      { code: "BD", numeric: 50, name: "Bangladesh" },
      { code: "BT", numeric: 64, name: "Bhoutan" },
      { code: "MM", numeric: 104, name: "Birmanie" },
      { code: "BN", numeric: 96, name: "Brunei" },
      { code: "KH", numeric: 116, name: "Cambodge" },
      // Hong Kong et Macao rattachés à la Chine
      { code: "CN", numeric: 156, name: "Chine", ids: [156, 344, 446] },
      { code: "KP", numeric: 408, name: "Corée du Nord" },
      { code: "KR", numeric: 410, name: "Corée du Sud" },
      { code: "AE", numeric: 784, name: "Émirats arabes unis" },
      { code: "GE", numeric: 268, name: "Géorgie" },
      { code: "IN", numeric: 356, name: "Inde", ids: [356, "Siachen Glacier"] },
      { code: "ID", numeric: 360, name: "Indonésie" },
      { code: "IQ", numeric: 368, name: "Irak" },
      { code: "IR", numeric: 364, name: "Iran" },
      { code: "IL", numeric: 376, name: "Israël" },
      { code: "JP", numeric: 392, name: "Japon" },
      { code: "JO", numeric: 400, name: "Jordanie" },
      { code: "KZ", numeric: 398, name: "Kazakhstan" },
      { code: "KG", numeric: 417, name: "Kirghizistan" },
      { code: "KW", numeric: 414, name: "Koweït" },
      { code: "LA", numeric: 418, name: "Laos" },
      { code: "LB", numeric: 422, name: "Liban" },
      { code: "MY", numeric: 458, name: "Malaisie" },
      { code: "MV", numeric: 462, name: "Maldives" },
      { code: "MN", numeric: 496, name: "Mongolie" },
      { code: "NP", numeric: 524, name: "Népal" },
      { code: "OM", numeric: 512, name: "Oman" },
      { code: "UZ", numeric: 860, name: "Ouzbékistan" },
      { code: "PK", numeric: 586, name: "Pakistan" },
      { code: "PS", numeric: 275, name: "Palestine" },
      { code: "PH", numeric: 608, name: "Philippines" },
      { code: "QA", numeric: 634, name: "Qatar" },
      { code: "RU", numeric: 643, name: "Russie" },
      { code: "SG", numeric: 702, name: "Singapour" },
      { code: "LK", numeric: 144, name: "Sri Lanka" },
      { code: "SY", numeric: 760, name: "Syrie" },
      { code: "TJ", numeric: 762, name: "Tadjikistan" },
      { code: "TH", numeric: 764, name: "Thaïlande" },
      { code: "TL", numeric: 626, name: "Timor oriental" },
      { code: "TM", numeric: 795, name: "Turkménistan" },
      { code: "TR", numeric: 792, name: "Turquie" },
      { code: "VN", numeric: 704, name: "Viêt Nam" },
      { code: "YE", numeric: 887, name: "Yémen" },
    ],
  },

  amerique_nord: {
    label: "Amérique du Nord",
    colors: ["#3FE0D0", "#2F7BE8"],
    center: [-95, 40],
    clip: [-170, -50, 5, 84],
    exclude: [
      [-162, -154, 18, 23], // Hawaï (en plein océan Pacifique)
    ],
    context: [
      { ids: [304], clip: [-75, -10, 59, 84] }, // Groenland (territoire danois)
      { ids: [630] },                           // Porto Rico (territoire américain)
    ],
    countries: [
      { code: "AG", numeric: 28, name: "Antigua-et-Barbuda" },
      { code: "BS", numeric: 44, name: "Bahamas" },
      { code: "BB", numeric: 52, name: "Barbade" },
      { code: "BZ", numeric: 84, name: "Belize" },
      { code: "CA", numeric: 124, name: "Canada" },
      { code: "CR", numeric: 188, name: "Costa Rica" },
      { code: "CU", numeric: 192, name: "Cuba" },
      { code: "DM", numeric: 212, name: "Dominique" },
      { code: "US", numeric: 840, name: "États-Unis" },
      { code: "GD", numeric: 308, name: "Grenade" },
      { code: "GT", numeric: 320, name: "Guatemala" },
      { code: "HT", numeric: 332, name: "Haïti" },
      { code: "HN", numeric: 340, name: "Honduras" },
      { code: "JM", numeric: 388, name: "Jamaïque" },
      { code: "MX", numeric: 484, name: "Mexique" },
      { code: "NI", numeric: 558, name: "Nicaragua" },
      { code: "PA", numeric: 591, name: "Panama" },
      { code: "DO", numeric: 214, name: "République dominicaine" },
      { code: "KN", numeric: 659, name: "Saint-Christophe-et-Niévès" },
      { code: "LC", numeric: 662, name: "Sainte-Lucie" },
      { code: "VC", numeric: 670, name: "Saint-Vincent-et-les-Grenadines" },
      { code: "SV", numeric: 222, name: "Salvador" },
      { code: "TT", numeric: 780, name: "Trinité-et-Tobago" },
    ],
  },

  amerique_sud: {
    label: "Amérique du Sud",
    colors: ["#9BE15D", "#10A37F"],
    center: [-60, -20],
    clip: [-82, -34, -56, 13],
    exclude: [
      [-82, -78, 11, 14], // îles colombiennes de San Andrés, dans la mer des Caraïbes
    ],
    context: [
      { ids: [250], clip: [-55, -51, 2, 6] }, // Guyane (française)
      { ids: [238] },                         // Îles Malouines
    ],
    countries: [
      { code: "AR", numeric: 32, name: "Argentine" },
      { code: "BO", numeric: 68, name: "Bolivie" },
      { code: "BR", numeric: 76, name: "Brésil" },
      { code: "CL", numeric: 152, name: "Chili" },
      { code: "CO", numeric: 170, name: "Colombie" },
      { code: "EC", numeric: 218, name: "Équateur" },
      { code: "GY", numeric: 328, name: "Guyana" },
      { code: "PY", numeric: 600, name: "Paraguay" },
      { code: "PE", numeric: 604, name: "Pérou" },
      { code: "SR", numeric: 740, name: "Suriname" },
      { code: "UY", numeric: 858, name: "Uruguay" },
      { code: "VE", numeric: 862, name: "Venezuela" },
    ],
  },
};
