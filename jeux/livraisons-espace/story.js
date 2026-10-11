// ============================================================================
// L'HISTOIRE — 5 chapitres. Dans chacun des 4 premiers, un « chef de chantier »
// confie 5 missions de livraison pour construire un bâtiment. Une fois le
// bâtiment fini, un magasin ouvre et de nouveaux clients arrivent.
// Le chapitre 5 (le portail) se finance avec l'or : voir PORTAL_PARTS.
//
//  - host      : l'astre où l'on construit (et où se tient le chef)
//  - shop      : le magasin qui ouvre quand le bâtiment est fini
//  - customers : les habitants qui proposent ensuite des quêtes (les « ! »)
//  - say       : ce que dit le chef pour présenter la mission (court !)
// ============================================================================

export const CHAPTERS = [
  {
    id: 'iss', title: 'La Station spatiale', chef: 'lila', host: 'iss',
    intro: "Bienvenue, livreur ! Ensemble, on va construire la Station spatiale internationale, juste au-dessus de la Terre. J'ai besoin de toi pour 5 livraisons.",
    built: 'La Station spatiale est construite !',
    fact: "La vraie Station spatiale a été assemblée dans l'espace, morceau par morceau, à partir de 1998. Elle est grande comme un terrain de foot !",
    unlocks: [
      "💥 L'Armurerie du Colonel Boum ouvre ses portes.",
      '📦 Capitaine Lila et le Professeur Zinzin te proposeront des livraisons (les « ! ») qui rapportent de l\'or.',
      "⚠️ Attention : les OVNI s'agitent au-delà de la ceinture d'astéroïdes !",
    ],
    shop: 'boum', customers: ['lila', 'zinzin'],
    missions: [
      { title: 'Le squelette de la station', needs: { fer: 2 }, reward: 40, say: "Il me faut du fer pour la charpente. Mercure, la planète toute proche du Soleil, en est pleine !" },
      { title: 'Les panneaux solaires', needs: { sable: 2, fer: 1 }, reward: 50, say: "Les panneaux solaires sont faits de silicium… et le silicium, on le fabrique avec du sable ! Le sable rouge de Mars fera l'affaire." },
      { title: 'Le bouclier', needs: { lune: 3 }, reward: 60, say: "La poussière de Lune peut protéger les astronautes des rayons du Soleil. Rapporte-m'en 3 caisses !" },
      { title: 'Le laboratoire', needs: { fer: 2, lune: 2 }, reward: 70, say: "Un laboratoire pour faire des expériences en apesanteur ! Il faut du fer et de la poussière de Lune." },
      { title: "L'eau des astronautes", needs: { comete: 2, sable: 1 }, reward: 80, say: "Les comètes sont faites de glace : de l'eau à boire ! Attention, la comète bouge tout le temps, il faut la rattraper." },
    ],
  },
  {
    id: 'lune', title: 'La base lunaire', chef: 'mamie', host: 'lune',
    intro: "Coucou mon petit ! Je me sens bien seule sur ma Lune. Et si tu construisais une base pour que des astronautes viennent habiter chez moi ?",
    built: 'La base lunaire est construite !',
    fact: "Avec le programme Artemis, des astronautes doivent bientôt retourner sur la Lune… et peut-être y construire une vraie base !",
    unlocks: [
      '🔧 Le Garage de Gus ouvre : soute plus grande, moteur plus rapide…',
      '📦 Nouveaux clients : Mamie Lune et le Général Gloubi.',
    ],
    shop: 'gus', customers: ['mamie', 'gloubi'],
    missions: [
      { title: 'Les fondations', needs: { lune: 3, fer: 1 }, reward: 90, say: "On commence par les fondations : de la poussière de Lune bien tassée, et un peu de fer." },
      { title: "L'eau de la base", needs: { eau: 3 }, reward: 110, say: "Il faut de l'eau ! Il y en a sous la glace d'Europe, une lune de Jupiter. Mais attention aux OVNI, là-bas…" },
      { title: 'Les dômes', needs: { sable: 2, fer: 2 }, reward: 120, say: "Avec du sable, on fabrique du verre. Je veux des dômes transparents pour regarder les étoiles !" },
      { title: 'Les batteries', needs: { soufre: 3, fer: 1 }, reward: 140, say: "Sur la Lune, la nuit dure 14 jours ! Il faut de grosses batteries… au soufre des volcans d'Io." },
      { title: 'La serre', needs: { eau: 2, comete: 2, lune: 1 }, reward: 160, say: "Pour finir, une serre pour faire pousser des légumes. Les astronautes adorent la salade !" },
    ],
  },
  {
    id: 'mars', title: 'La base martienne', chef: 'martin', host: 'mars',
    intro: "Glouglou ! Des voisins humains sur Mars ? Super ! Construisons ensemble la toute première base martienne.",
    built: 'La première base sur Mars est construite !',
    fact: "Aucun humain n'est encore allé sur Mars : le voyage dure environ 7 mois ! Pour l'instant, ce sont des robots qui l'explorent.",
    unlocks: [
      "🎨 L'Atelier de Stella ouvre : peins et décore ta fusée !",
      '📦 Nouveaux clients : Martin le Martien et la Reine des Anneaux.',
    ],
    shop: 'stella', customers: ['martin', 'reine'],
    missions: [
      { title: 'Les habitats', needs: { sable: 3, fer: 2 }, reward: 160, say: "D'abord, des maisons solides contre les tempêtes de poussière !" },
      { title: 'Le carburant du retour', needs: { methane: 3 }, reward: 180, say: "Les fusées peuvent voler au méthane. Il y en a des lacs entiers sur Titan, la grande lune de Saturne !" },
      { title: "L'usine à oxygène", needs: { eau: 4, fer: 2 }, reward: 200, say: "En cassant l'eau en morceaux, on fabrique de l'oxygène pour respirer. Il me faut beaucoup d'eau !" },
      { title: 'Le potager martien', needs: { puant: 2, eau: 2, sable: 2 }, reward: 220, say: "Mes plantes adorent le gaz qui pue d'Uranus (beurk !). Avec de l'eau et du sable, mon potager sera parfait." },
      { title: 'La grande antenne', needs: { soufre: 2, methane: 2, fer: 2 }, reward: 250, say: "Une antenne pour parler avec la Terre : un message met jusqu'à 20 minutes pour arriver !" },
    ],
  },
  {
    id: 'triton', title: 'La station de Triton', chef: 'nova', host: 'triton',
    intro: "Bonjour, je suis l'ingénieure Nova ! Mon rêve : un portail vers une autre étoile. Mais d'abord, il me faut une station tout au bout du système solaire, sur Triton, la grande lune de Neptune.",
    built: 'La station de Triton est construite !',
    fact: "Triton tourne autour de Neptune « à l'envers », et des geysers y crachent de l'azote glacé !",
    unlocks: [
      '🌀 Le Chantier du Portail ouvre, au bord du système solaire.',
      "📦 Tous les habitants te proposent des livraisons : gagne de l'or pour le portail !",
    ],
    shop: 'nova', customers: [],
    missions: [
      { title: "L'ancrage dans la glace", needs: { azote: 3, fer: 2 }, reward: 250, say: "Triton est couverte de glace d'azote, comme Pluton. Il en faut pour sceller les fondations !" },
      { title: 'Les fenêtres en diamant', needs: { diamant: 3, sable: 2 }, reward: 280, say: "Le diamant est transparent et très solide : parfait pour les fenêtres ! Il en pleut peut-être dans Neptune." },
      { title: 'Le carburant', needs: { methane: 3, comete: 2 }, reward: 300, say: "La station a besoin de carburant : du méthane de Titan et de la glace de comète." },
      { title: 'Le grand radar', needs: { diamant: 2, soufre: 2, fer: 2 }, reward: 330, say: "Un radar géant pour surveiller les OVNI… et pour viser l'autre étoile !" },
      { title: "Le cœur d'énergie", needs: { etoile: 3, azote: 2, eau: 2 }, reward: 380, say: "La dernière pièce : de la poussière d'étoile, là où naissent les étoiles. Courage, c'est loin et dangereux !" },
    ],
  },
  {
    id: 'portail', title: 'Le portail vers Proxima du Centaure', chef: 'nova', host: null,
    intro: "Grâce à ta station, on peut enfin construire le portail ! Gagne de l'or avec les livraisons des habitants, puis achète les pièces sur mon chantier, au bord du système solaire.",
    missions: [],
  },
];

export const STORY_STEPS = CHAPTERS.length;
