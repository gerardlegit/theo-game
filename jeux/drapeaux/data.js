// Convertit un code pays ISO (ex: "FR") en emoji drapeau 🇫🇷
function flagEmoji(code) {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

// 64 pays répartis sur tous les continents
const COUNTRIES = [
  // ---------- EUROPE (20) ----------
  { code: "FR", name: "France", continent: "Europe", population: "68 millions", fact: "Célèbre pour la tour Eiffel et sa gastronomie, c'est le pays le plus visité au monde." },
  { code: "DE", name: "Allemagne", continent: "Europe", population: "84 millions", fact: "Pays le plus peuplé d'Europe de l'Ouest, connu pour ses voitures et ses châteaux de contes de fées." },
  { code: "ES", name: "Espagne", continent: "Europe", population: "47 millions", fact: "Célèbre pour le flamenco, la paella et ses longues plages ensoleillées." },
  { code: "IT", name: "Italie", continent: "Europe", population: "59 millions", fact: "Berceau de la pizza et des pâtes, avec des trésors comme Rome et Venise." },
  { code: "GB", name: "Royaume-Uni", continent: "Europe", population: "67 millions", fact: "Pays de Big Ben, des cabines téléphoniques rouges et des châteaux royaux." },
  { code: "PT", name: "Portugal", continent: "Europe", population: "10 millions", fact: "Connu pour ses carreaux d'azulejos colorés et ses grands navigateurs d'autrefois." },
  { code: "NL", name: "Pays-Bas", continent: "Europe", population: "18 millions", fact: "Pays plat célèbre pour ses champs de tulipes, ses moulins et son amour du vélo." },
  { code: "BE", name: "Belgique", continent: "Europe", population: "12 millions", fact: "Réputée pour son chocolat, ses gaufres et ses bandes dessinées." },
  { code: "CH", name: "Suisse", continent: "Europe", population: "9 millions", fact: "Pays des Alpes, du chocolat et des montres de précision." },
  { code: "SE", name: "Suède", continent: "Europe", population: "10 millions", fact: "Pays scandinave couvert de forêts et de lacs, patrie d'IKEA." },
  { code: "NO", name: "Norvège", continent: "Europe", population: "5 millions", fact: "Célèbre pour ses fjords spectaculaires et ses aurores boréales." },
  { code: "FI", name: "Finlande", continent: "Europe", population: "5,5 millions", fact: "Le pays aux mille lacs, considéré comme la patrie officielle du Père Noël." },
  { code: "DK", name: "Danemark", continent: "Europe", population: "6 millions", fact: "Petit royaume connu pour le vélo, le design et les contes d'Andersen." },
  { code: "PL", name: "Pologne", continent: "Europe", population: "38 millions", fact: "Pays d'Europe centrale avec de superbes villes historiques comme Cracovie." },
  { code: "GR", name: "Grèce", continent: "Europe", population: "10 millions", fact: "Berceau des Jeux Olympiques et de nombreux mythes de l'Antiquité." },
  { code: "IE", name: "Irlande", continent: "Europe", population: "5 millions", fact: "Île verte connue pour ses trèfles à quatre feuilles et ses légendes de lutins." },
  { code: "AT", name: "Autriche", continent: "Europe", population: "9 millions", fact: "Pays des Alpes, célèbre pour la musique classique de Mozart." },
  { code: "CZ", name: "République tchèque", continent: "Europe", population: "10,5 millions", fact: "Connue pour la ville de Prague, ses châteaux et ses ruelles pavées." },
  { code: "HU", name: "Hongrie", continent: "Europe", population: "10 millions", fact: "Pays d'Europe centrale traversé par le grand fleuve Danube." },
  { code: "IS", name: "Islande", continent: "Europe", population: "0,4 million", fact: "Île de feu et de glace, avec des volcans, des geysers et des glaciers." },

  // ---------- AFRIQUE (14) ----------
  { code: "EG", name: "Égypte", continent: "Afrique", population: "110 millions", fact: "Pays des pyramides, du Sphinx et du grand fleuve Nil." },
  { code: "MA", name: "Maroc", continent: "Afrique", population: "37 millions", fact: "Connu pour ses souks colorés et les dunes du désert du Sahara." },
  { code: "DZ", name: "Algérie", continent: "Afrique", population: "45 millions", fact: "Plus grand pays d'Afrique, en grande partie recouvert par le Sahara." },
  { code: "NG", name: "Nigeria", continent: "Afrique", population: "220 millions", fact: "Pays le plus peuplé d'Afrique, avec une immense industrie du cinéma." },
  { code: "ZA", name: "Afrique du Sud", continent: "Afrique", population: "60 millions", fact: "Pays aux trois capitales, célèbre pour ses safaris et sa faune sauvage." },
  { code: "KE", name: "Kenya", continent: "Afrique", population: "55 millions", fact: "Connu pour ses grandes savanes et la migration spectaculaire des gnous." },
  { code: "ET", name: "Éthiopie", continent: "Afrique", population: "120 millions", fact: "Un des berceaux de l'humanité, un pays qui n'a jamais été colonisé." },
  { code: "GH", name: "Ghana", continent: "Afrique", population: "33 millions", fact: "Ancien royaume de l'or, aujourd'hui grand producteur de cacao." },
  { code: "SN", name: "Sénégal", continent: "Afrique", population: "18 millions", fact: "Pays d'Afrique de l'Ouest réputé pour sa légendaire hospitalité, la Teranga." },
  { code: "TN", name: "Tunisie", continent: "Afrique", population: "12 millions", fact: "Petit pays d'Afrique du Nord bordé par la mer Méditerranée." },
  { code: "CM", name: "Cameroun", continent: "Afrique", population: "28 millions", fact: "Surnommé « l'Afrique en miniature » pour son incroyable diversité de paysages." },
  { code: "MG", name: "Madagascar", continent: "Afrique", population: "29 millions", fact: "Grande île où vivent des animaux uniques au monde, comme les lémuriens." },
  { code: "TZ", name: "Tanzanie", continent: "Afrique", population: "65 millions", fact: "Abrite le Kilimandjaro, le plus haut sommet d'Afrique." },
  { code: "CI", name: "Côte d'Ivoire", continent: "Afrique", population: "28 millions", fact: "Premier producteur mondial de fèves de cacao." },

  // ---------- ASIE (15) ----------
  { code: "CN", name: "Chine", continent: "Asie", population: "1,4 milliard", fact: "Pays le plus peuplé du monde, avec la Grande Muraille visible sur des milliers de kilomètres." },
  { code: "JP", name: "Japon", continent: "Asie", population: "124 millions", fact: "Pays des mangas, des fleurs de cerisier et des trains à très grande vitesse." },
  { code: "IN", name: "Inde", continent: "Asie", population: "1,4 milliard", fact: "Pays du Taj Mahal, avec une incroyable diversité de langues et de cultures." },
  { code: "KR", name: "Corée du Sud", continent: "Asie", population: "52 millions", fact: "Connue dans le monde entier pour la K-pop et sa technologie de pointe." },
  { code: "TH", name: "Thaïlande", continent: "Asie", population: "72 millions", fact: "Pays des temples dorés et des plages tropicales du Sud-Est asiatique." },
  { code: "VN", name: "Vietnam", continent: "Asie", population: "99 millions", fact: "Pays en forme de S, célèbre pour ses rizières en terrasses." },
  { code: "ID", name: "Indonésie", continent: "Asie", population: "275 millions", fact: "Plus grand archipel du monde, avec plus de 17 000 îles." },
  { code: "MY", name: "Malaisie", continent: "Asie", population: "33 millions", fact: "Connue pour les tours jumelles Petronas et sa jungle tropicale luxuriante." },
  { code: "PH", name: "Philippines", continent: "Asie", population: "115 millions", fact: "Archipel de plus de 7 000 îles dans l'océan Pacifique." },
  { code: "SA", name: "Arabie saoudite", continent: "Asie", population: "36 millions", fact: "Grand pays du désert qui abrite les villes saintes de La Mecque et Médine." },
  { code: "AE", name: "Émirats arabes unis", continent: "Asie", population: "10 millions", fact: "Pays du Golfe connu pour Dubaï et ses gratte-ciel futuristes." },
  { code: "TR", name: "Turquie", continent: "Europe et Asie", population: "85 millions", fact: "Pays à cheval sur deux continents, avec Istanbul comme pont entre l'Europe et l'Asie." },
  { code: "IL", name: "Israël", continent: "Asie", population: "9 millions", fact: "Petit pays du Moyen-Orient avec la ville sainte de Jérusalem." },
  { code: "PK", name: "Pakistan", continent: "Asie", population: "240 millions", fact: "Traversé par le fleuve Indus, il abrite le K2, deuxième plus haut sommet du monde." },
  { code: "MN", name: "Mongolie", continent: "Asie", population: "3,4 millions", fact: "Pays des grandes steppes, terre des nomades et des chevaux." },

  // ---------- AMÉRIQUES (12) ----------
  { code: "US", name: "États-Unis", continent: "Amérique du Nord", population: "335 millions", fact: "Pays du Grand Canyon, d'Hollywood et de la Statue de la Liberté." },
  { code: "CA", name: "Canada", continent: "Amérique du Nord", population: "39 millions", fact: "Deuxième plus grand pays du monde, connu pour ses érables et ses ours." },
  { code: "MX", name: "Mexique", continent: "Amérique du Nord", population: "128 millions", fact: "Pays des pyramides mayas et aztèques, et inventeur du chocolat chaud." },
  { code: "BR", name: "Brésil", continent: "Amérique du Sud", population: "216 millions", fact: "Plus grand pays d'Amérique du Sud, qui abrite une grande partie de la forêt amazonienne." },
  { code: "AR", name: "Argentine", continent: "Amérique du Sud", population: "46 millions", fact: "Célèbre pour le tango, le football et les grandes plaines de la pampa." },
  { code: "CL", name: "Chili", continent: "Amérique du Sud", population: "19 millions", fact: "Pays très long et étroit, qui contient le désert d'Atacama, un des plus secs au monde." },
  { code: "PE", name: "Pérou", continent: "Amérique du Sud", population: "34 millions", fact: "Abrite la cité perdue du Machu Picchu, perchée dans les Andes." },
  { code: "CO", name: "Colombie", continent: "Amérique du Sud", population: "52 millions", fact: "Pays d'Amérique du Sud réputé pour son café et son incroyable biodiversité." },
  { code: "CU", name: "Cuba", continent: "Amérique centrale", population: "11 millions", fact: "Île des Caraïbes connue pour ses vieilles voitures colorées et sa musique." },
  { code: "JM", name: "Jamaïque", continent: "Amérique centrale", population: "2,8 millions", fact: "Île natale du reggae et de nombreux champions olympiques de sprint." },
  { code: "CR", name: "Costa Rica", continent: "Amérique centrale", population: "5 millions", fact: "Pays sans armée, célèbre pour ses forêts tropicales très bien protégées." },
  { code: "UY", name: "Uruguay", continent: "Amérique du Sud", population: "3,4 millions", fact: "Petit pays connu pour ses plages et sa grande passion pour le football." },

  // ---------- OCÉANIE (3) ----------
  { code: "AU", name: "Australie", continent: "Océanie", population: "26 millions", fact: "Île-continent qui abrite kangourous, koalas et la Grande Barrière de corail." },
  { code: "NZ", name: "Nouvelle-Zélande", continent: "Océanie", population: "5 millions", fact: "Pays aux paysages spectaculaires, terre des Maoris et du rugby des All Blacks." },
  { code: "FJ", name: "Fidji", continent: "Océanie", population: "0,9 million", fact: "Archipel du Pacifique Sud composé de plus de 300 îles paradisiaques." },
];
