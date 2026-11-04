// ============================================================================
// NIVEAU 2 — VERS LES DINOSAURES (en 3D : voir dino3d/)
//
// De la sortie de l'eau (il y a 375 millions d'années) au règne des dinosaures…
// et à la météorite. Caméra derrière l'animal, on court dans toutes les
// directions, tout veut nous manger : il faut se cacher, ne pas courir pour
// rien, grandir, puis gagner un duel à la fin de chaque chapitre.
// Au Trias, le joueur choisit : carnivore (il chasse) ou herbivore (il broute,
// il encaisse et il charge). Les deux chemins mènent au roi de la Terre.
//
// Tout le niveau est décrit ici ; le moteur (dino3d/jeu.js) ne connaît aucune
// espèce par son nom. Les corps sont dans dino3d/animaux.js.
//   faune[id] : name, plural, animal (son corps), fact, kind :
//     prey (fuit, se mange), hunter (chasse), defender (charge si on s'approche),
//     giant (écrase sans le faire exprès), neutral (broute), flyer (vole, pique),
//     swimmer (reste dans l'eau, attrape) ; scale, speed, hp, bite (dégâts), sense
//     (portée de ses sens), pack (nombre), food (ce qu'il fait grandir), adn.
//   chapters[].d3 : hero (ou heroes par régime), biome (voir dino3d/monde.js),
//     fauna, hazards, missions (ou missionsBy), boss, evolutions, tips.
//   Missions : eat, plants, defeat, hide, grow, duel (toujours la dernière).
// ============================================================================

/* Pour le décor de la toute fin (dessin 2D de la météorite) */
const world = {
  ground: 'land',
  w: 4000,
  h: 3000,
  start: { x: 2000, y: 1500 },
  decor: [],
};

const species = {
  parasaurolophus: { name: 'Parasaurolophus', plural: 'Parasaurolophus', kind: 'neutral', look: 'parasaurolophus', color: '#8E6E96', size: 120, speed: 100, sense: 200, adn: 0, fact: '' },
  triceratops: { name: 'Triceratops', plural: 'Triceratops', kind: 'neutral', look: 'triceratops', color: '#A58A52', size: 150, speed: 90, sense: 200, adn: 0, fact: '' },
  ankylosaure: { name: 'Ankylosaurus', plural: 'Ankylosaurus', kind: 'neutral', look: 'ankylosaure', color: '#7A7050', size: 120, speed: 80, sense: 200, adn: 0, fact: '' },
  gallimimus: { name: 'Gallimimus', plural: 'Gallimimus', kind: 'neutral', look: 'gallimimus', color: '#B58A3C', size: 100, speed: 120, sense: 200, adn: 0, fact: '' },
};

/* ---------- Tous les animaux du niveau ---------- */
const faune = {
  insecte: { name: 'Insecte', plural: 'insectes', animal: 'insecte', kind: 'prey', scale: 1.4, speed: 3.2, hp: 0.5, food: 8, adn: 2, sense: 5, fact: "Les premiers insectes sont apparus il y a plus de 400 millions d'années. Ils ont conquis la terre bien avant nous !" },
  'mille-pattes': { name: 'Mille-pattes', plural: 'mille-pattes', animal: 'mille-pattes', kind: 'prey', scale: 1.5, speed: 2.8, hp: 0.5, food: 10, adn: 3, sense: 5, fact: "Les mille-pattes figurent parmi les tout premiers animaux à avoir marché sur la terre ferme. Et non : ils n'ont jamais vraiment mille pattes !" },
  scorpion: { name: 'Scorpion des marais', plural: 'scorpions', animal: 'scorpion', kind: 'hunter', scale: 1, speed: 8.6, hp: 3, bite: 1, sense: 11, food: 16, adn: 8, fact: "Les scorpions ont quitté l'eau il y a plus de 400 millions d'années. Certains étaient grands comme un chien !" },
  hyneria: { name: 'Hyneria', plural: 'Hyneria', animal: 'hyneria', kind: 'swimmer', scale: 1, speed: 8.5, hp: 8, bite: 2, sense: 14, food: 0, adn: 10, fact: "Hyneria était un poisson géant de 4 mètres, avec d'énormes dents. Pour les premiers animaux à pattes, l'eau n'était pas un abri !" },
  'scorpion-geant': { name: 'Scorpion géant', plural: 'scorpions géants', animal: 'scorpion-geant', kind: 'hunter', scale: 1.65, speed: 10.6, hp: 6, bite: 2, sense: 18, food: 25, adn: 14, fact: "Pulmonoscorpius, un scorpion du Carbonifère, mesurait 70 centimètres. Son dard était gros comme une prune !" },

  blatte: { name: 'Blatte géante', plural: 'blattes géantes', animal: 'blatte', kind: 'prey', scale: 1.5, speed: 4.2, hp: 1, food: 7, adn: 2, sense: 6, fact: "Il y a 300 millions d'années, les blattes étaient déjà là, et bien plus grandes qu'aujourd'hui. Elles ont survécu à presque tout !" },
  meganeura: { name: 'Meganeura', plural: 'Meganeura', animal: 'meganeura', kind: 'flyer', scale: 1.4, speed: 9, hp: 2, bite: 1, sense: 16, food: 10, adn: 6, alt: 2.2, fact: "Meganeura était une libellule grande comme un corbeau : 70 centimètres d'envergure ! Il y avait tant d'oxygène dans l'air que les insectes devenaient géants." },
  arthropleura: { name: 'Arthropleura', plural: 'Arthropleura', animal: 'arthropleura', kind: 'defender', scale: 1, speed: 3.5, hp: 10, bite: 2, sense: 5, food: 22, adn: 14, fact: "Arthropleura, le plus grand mille-pattes de tous les temps : plus de 2 mètres de long ! Il ne mangeait que des plantes, mais il ne fallait pas le déranger." },
  dimetrodon: { name: 'Dimetrodon', plural: 'Dimetrodon', animal: 'dimetrodon', kind: 'hunter', scale: 1, speed: 11, hp: 9, bite: 2, sense: 22, food: 28, adn: 18, fact: "Avec sa grande voile sur le dos, Dimetrodon ressemble à un dinosaure. Pourtant, il a vécu bien avant eux… et il est plus proche de toi que du T. rex !" },
  edaphosaure: { name: 'Edaphosaurus', plural: 'Edaphosaurus', animal: 'edaphosaure', kind: 'neutral', scale: 1, speed: 3, hp: 5, food: 18, adn: 10, sense: 10, fact: "Edaphosaurus portait lui aussi une voile sur le dos, mais il mangeait des plantes. C'était un des premiers grands herbivores de la terre ferme." },

  cynodonte: { name: 'Cynodonte', plural: 'cynodontes', animal: 'cynodonte', kind: 'prey', scale: 1.5, speed: 7.5, hp: 1, food: 9, adn: 3, sense: 10, fact: "Les cynodontes sont les ancêtres des mammifères. Ils se cachaient des dinosaures… et un jour, ce sont leurs descendants qui ont dominé la Terre !" },
  coelophysis: { name: 'Coelophysis', plural: 'Coelophysis', animal: 'coelophysis', kind: 'hunter', scale: 1, speed: 15, hp: 5, bite: 2, sense: 24, pack: 3, food: 16, adn: 12, fact: "Coelophysis, un des premiers dinosaures, était fin et très rapide. On a retrouvé des centaines de squelettes ensemble : ils vivaient sans doute en groupe." },
  postosuchus: { name: 'Postosuchus', plural: 'Postosuchus', animal: 'postosuchus', kind: 'hunter', scale: 1, speed: 15, hp: 14, bite: 3, sense: 26, food: 30, adn: 24, fact: "Postosuchus n'était pas un dinosaure mais un cousin des crocodiles. Au Trias, c'était lui le grand chasseur, et les premiers dinosaures en avaient peur !" },
  'plateosaure-sauvage': { name: 'Plateosaurus', plural: 'Plateosaurus', animal: 'plateosaure', kind: 'neutral', scale: 1.15, speed: 5, hp: 9, food: 22, adn: 14, sense: 14, herd: 3, fact: "Plateosaurus, long comme une camionnette, a été un des premiers grands dinosaures herbivores. Son long cou lui servait à atteindre les hautes branches." },

  compsognathus: { name: 'Compsognathus', plural: 'Compsognathus', animal: 'compsognathus', kind: 'prey', scale: 1.5, speed: 9, hp: 1, food: 7, adn: 3, sense: 14, herd: 3, fact: "Compsognathus était un dinosaure grand comme une poule. Ses dents minuscules lui servaient à attraper des lézards." },
  dryosaure: { name: 'Dryosaurus', plural: 'Dryosaurus', animal: 'dryosaure', kind: 'prey', scale: 1.5, speed: 12, hp: 2, food: 12, adn: 5, sense: 20, herd: 4, fact: "Dryosaurus, un petit herbivore, comptait sur ses longues pattes pour échapper aux chasseurs : il courait très vite !" },
  brachiosaure: { name: 'Brachiosaurus', plural: 'Brachiosaurus', animal: 'brachiosaure', kind: 'giant', scale: 1.5, speed: 4.2, hp: 99, bite: 3, sense: 0, food: 0, adn: 0, fact: "Brachiosaurus pesait autant que 10 éléphants, et sa tête montait à la hauteur d'un immeuble de 4 étages. Rien ne pouvait l'attaquer…" },
  diplodocus: { name: 'Diplodocus', plural: 'Diplodocus', animal: 'diplodocus', kind: 'giant', scale: 1.4, speed: 4.6, hp: 99, bite: 3, sense: 0, food: 0, adn: 0, fact: "Diplodocus mesurait plus de 25 mètres, dont une queue immense. Elle claquait peut-être comme un fouet, assez fort pour faire un bang !" },
  'stegosaure-sauvage': { name: 'Stegosaurus', plural: 'Stegosaurus', animal: 'stegosaure', kind: 'defender', scale: 1, speed: 7, hp: 16, bite: 3, sense: 12, food: 30, adn: 22, fact: "Les pointes de la queue de Stegosaurus étaient redoutables : on a retrouvé un os d'Allosaurus percé par l'une d'elles !" },
  'allosaure-sauvage': { name: 'Allosaurus', plural: 'Allosaurus', animal: 'allosaure-sauvage', kind: 'hunter', scale: 1, speed: 21, hp: 22, bite: 3, sense: 34, food: 32, adn: 30, fact: "Allosaurus était le grand chasseur du Jurassique. Il ouvrait la gueule très grand et frappait comme avec une hache !" },
  ceratosaure: { name: 'Ceratosaurus', plural: 'Ceratosaurus', animal: 'ceratosaure', kind: 'hunter', scale: 1, speed: 19.5, hp: 16, bite: 2, sense: 30, food: 26, adn: 24, fact: "Ceratosaurus portait une corne sur le nez et une rangée de petites plaques sur le dos. Personne ne sait vraiment à quoi servait sa corne !" },
  rhamphorhynchus: { name: 'Rhamphorhynchus', plural: 'Rhamphorhynchus', animal: 'rhamphorhynchus', kind: 'flyer', scale: 1.6, speed: 12, hp: 2, bite: 1, sense: 20, food: 8, adn: 5, alt: 3.5, fact: "Rhamphorhynchus n'était pas un dinosaure mais un ptérosaure, un reptile volant. Sa longue queue se terminait par une petite palette en forme de losange." },

  edmontosaure: { name: 'Edmontosaurus', plural: 'Edmontosaurus', animal: 'edmontosaure', kind: 'prey', scale: 1, speed: 13, hp: 12, food: 22, adn: 14, sense: 26, herd: 4, fact: "Edmontosaurus avait un bec de canard et des centaines de dents pour broyer les plantes. On a trouvé des traces de morsures de T. rex sur ses os… guéries !" },
  parasaurolophus: { name: 'Parasaurolophus', plural: 'Parasaurolophus', animal: 'parasaurolophus', kind: 'prey', scale: 0.95, speed: 13, hp: 10, food: 20, adn: 14, sense: 26, herd: 3, fact: "La grande crête de Parasaurolophus était creuse : il s'en servait sans doute comme d'une trompette, pour appeler son troupeau !" },
  ankylosaure: { name: 'Ankylosaurus', plural: 'Ankylosaurus', animal: 'ankylosaure', kind: 'defender', scale: 1, speed: 7, hp: 26, bite: 3, sense: 12, food: 32, adn: 28, fact: "Ankylosaurus était un vrai char d'assaut : blindé de plaques d'os, jusqu'aux paupières ! Un coup de sa queue-massue pouvait briser une patte de T. rex." },
  'triceratops-sauvage': { name: 'Triceratops', plural: 'Triceratops', animal: 'triceratops-sauvage', kind: 'defender', scale: 1, speed: 12, hp: 30, bite: 4, sense: 18, food: 40, adn: 34, fact: "Le crâne de Triceratops mesurait plus de 2 mètres : un des plus grands de tous les animaux terrestres. On a trouvé ses os marqués par les dents du T. rex." },
  dakotaraptor: { name: 'Dakotaraptor', plural: 'Dakotaraptor', animal: 'dakotaraptor', kind: 'hunter', scale: 1, speed: 25, hp: 11, bite: 3, sense: 36, pack: 3, food: 22, adn: 20, fact: "Dakotaraptor, un raptor géant de 5 mètres, avait des plumes et une griffe en forme de faux à chaque pied. Et il chassait à côté du T. rex !" },
  'trex-sauvage': { name: 'Tyrannosaurus rex', plural: 'T. rex', animal: 'trex-sauvage', kind: 'hunter', scale: 1, speed: 23, hp: 45, bite: 4, sense: 46, food: 60, adn: 60, fact: "La morsure du T. rex est la plus forte de tous les animaux terrestres connus : assez pour broyer les os. Et son odorat était incroyable !" },
  quetzalcoatlus: { name: 'Quetzalcoatlus', plural: 'Quetzalcoatlus', animal: 'quetzalcoatlus', kind: 'flyer', scale: 1, speed: 16, hp: 8, bite: 2, sense: 30, food: 18, adn: 14, alt: 7, fact: "Quetzalcoatlus, grand comme une girafe et avec 10 mètres d'envergure, est le plus grand animal volant de tous les temps !" },
};

/* ---------- Le sol et les plantes de chaque époque ---------- */
const VERT = { a: '#2F6B34', b: '#6FA83E', t: '#4A3A24', d: '#6B5534' };

/* ---------- L'histoire, en cinq chapitres ---------- */
const chapters = [
  {
    title: "La sortie de l'eau", ago: [375, 360], form: 'tetrapode', skin: { body: '#4FAE9C', belly: '#F1E3A0', dark: '#1D5A4E', stripe: '#2E7A6C' },
    size: [20, 40], growth: 100, species: {}, unlock: [], missions: [], intro: '',
    palette: { water: ['#5E7F4E', '#33452A'], floor: '#7C8A55', motes: 'rgba(255, 250, 200, 0.5)' },
    d3: {
      hero: { animal: 'tetrapode', walk: 5, run: 7.5, sprint: 12, hp: 6, bite: 1, reach: 0.65, scale: [0.85, 1.25], cam: 3.2, label: 'Tétrapode' },
      biome: {
        radius: 150, amp: 11, freq: 0.022, base: 0.52, water: 0, waterCol: '#2E8078', startR: 16, startH: 0.35, texScale: 2.2, rockSlope: 0.9,
        ground: { low: '#7A7244', mid: '#5E7A3E', high: '#46693A', rock: '#5A5A4E', patch: '#6E8A3C' },
        sky: { top: '#3E7E8A', mid: '#8FC0B2', low: '#D8E4BE', sun: '#FFF2C4', cloud: '#F4F7E8', cover: 0.62 },
        fog: { color: '#AACBB4', near: 12, far: 92 }, far: '#7FA89A', far2: '#94B8A8',
        light: { sky: '#DDF2E2', ground: '#5A6A3A', sun: '#FFF0C8', hemi: 1.55, power: 2.1 },
        tuft: { c: { a: '#3E6E32', b: '#8FB84E' }, s: 0.42, cell: 1.5 },
        flora: [
          { type: 'prele', n: 500, s: [2.2, 5.5], wind: 0.05, c: { a: '#2F6B3A', b: '#5FA84E', t: '#3A5A2A' } },
          { type: 'archaeopteris', n: 130, s: [8, 16], solid: 0.06, shadow: true, wind: 0.05, c: { a: '#2F6B34', b: '#558E38', t: '#4A3A24' } },
          { type: 'fougere', n: 120, s: [2.2, 3.6], hide: 0.74, cluster: 14, spread: 5, wind: 0.04, c: { a: '#2E7A3C', b: '#7FC24E' } },
          { type: 'rocher', n: 70, s: [0.6, 2.2], solid: 0.45, wind: 0, c: { a: '#6A6A58', b: '#7E7E68' } },
        ],
      },
      fauna: [['insecte', 20], ['mille-pattes', 14], ['scorpion', 3], ['hyneria', 3]],
      missions: [
        { type: 'eat', species: 'insecte', n: 5 },
        { type: 'eat', species: 'mille-pattes', n: 4 },
        { type: 'hide', n: 1, text: "Sème un scorpion en te cachant dans les fougères" },
        { type: 'grow', text: 'Grandis au maximum' },
        { type: 'duel', species: 'scorpion-geant' },
      ],
      boss: { species: 'scorpion-geant', scale: 2.1, hp: 16, bite: 1, speed: 7.5, title: 'Le scorpion géant', line: "Tu es sorti de l'eau… et lui ne veut pas partager la terre ferme !" },
      evolutions: [
        { id: 'pattes', icon: '🦵', name: 'Pattes solides', short: 'Tu cours bien plus vite', fact: "Les premières pattes servaient sans doute d'abord à pousser dans la vase. Puis elles ont porté le corps hors de l'eau.", effect: { run: 1.18 }, mods: { legW: 0.06, H: 0.23, foreH: 0.22 } },
        { id: 'poumons', icon: '💨', name: 'Grands poumons', short: 'Ton sprint dure plus longtemps', fact: "Grâce à leurs poumons, les premiers tétrapodes respiraient l'air. Pour eux, tout un monde vide s'ouvrait !", effect: { stamina: 1.5 }, mods: { d: 0.18 } },
        { id: 'machoire', icon: '🦷', name: 'Mâchoire puissante', short: 'Tu mords plus fort', fact: "Sur la terre, la nourriture ne vient pas toute seule dans la bouche : il faut une mâchoire forte pour attraper et mâcher.", effect: { bite: 1.5 }, mods: { hl: 0.31, hh: 0.2, teeth: 4 } },
        { id: 'peau', icon: '🛡️', name: 'Peau épaisse', short: 'Tu encaisses un coup de plus', fact: "Une peau plus épaisse garde l'eau dans le corps. Elle protège aussi des griffes !", effect: { hp: 1.25 }, mods: { back: { from: -0.5, to: 0.55, n: 14, h: 0.035 } } },
      ],
      intro: "Il y a 375 millions d'années, personne n'avait encore marché sur la terre. Tu es un des premiers ! Croque les insectes, cours sur les berges… et méfie-toi : dans l'eau, Hyneria guette, et sur la terre, les scorpions chassent.",
      tips: [
        "Les touches ← ↑ ↓ → pour courir partout, Maj pour sprinter… mais un sprint, ça s'entend de loin !",
        "Un chasseur te poursuit ? Plonge dans les fougères et ne sprinte plus : il va te perdre.",
        "Quand un cercle rouge apparaît sous toi, écarte-toi : il attaque !",
      ],
    },
  },
  {
    title: 'La forêt de charbon', ago: [300, 290], form: 'reptile', skin: { body: '#D98E3A', belly: '#F7E0A8', dark: '#6B3A12', stripe: '#8A4A16' },
    size: [40, 70], growth: 100, species: {}, unlock: [], missions: [], intro: '',
    palette: { water: ['#3D5A3A', '#1E2E1C'], floor: '#4F6B3A', motes: 'rgba(210, 255, 170, 0.45)' },
    d3: {
      hero: { animal: 'reptile', walk: 6.5, run: 9.5, sprint: 15, hp: 8, bite: 2, reach: 0.7, scale: [0.95, 1.5], cam: 3.8, label: 'Reptile' },
      biome: {
        radius: 190, amp: 16, freq: 0.018, base: 0.44, water: 0, waterCol: '#1E5A54', startR: 18, startH: 1, texScale: 2.6, rockSlope: 0.75,
        ground: { low: '#3A3A22', mid: '#3F5A2C', high: '#30502E', rock: '#3E3E36', patch: '#5A6E2C' },
        sky: { top: '#1E3A3E', mid: '#6A8E6E', low: '#A8B890', sun: '#E8F0B0', cloud: '#7E9A80', cover: 0.78 },
        fog: { color: '#6E8A6A', near: 10, far: 85 }, far: '#4E6E58', far2: '#5E7E64',
        light: { sky: '#BFE0B8', ground: '#3A4A28', sun: '#E8F0C0', hemi: 1.4, power: 1.5 },
        tuft: { c: { a: '#2E5A2A', b: '#6E9A3A' }, s: 0.55, cell: 1.8 },
        flora: [
          { type: 'lepido', n: 300, s: [18, 34], solid: 0.045, shadow: true, wind: 0.03, tilt: 0.05, c: { a: '#2A5A2E', b: '#4E8A38', t: '#3A3226', d: '#5A4A32' } },
          { type: 'arbre-fougere', n: 200, s: [6, 12], solid: 0.05, shadow: true, wind: 0.05, c: { a: '#2E6E34', b: '#6EB048', t: '#3A2E20', d: '#54442E' } },
          { type: 'fougere', n: 150, s: [2.6, 4], hide: 0.74, cluster: 18, spread: 6, c: { a: '#245E30', b: '#68B044' } },
          { type: 'prele', n: 360, s: [3, 7], wind: 0.05, c: { a: '#2F6B3A', b: '#5FA84E', t: '#3A5A2A' } },
          { type: 'arbre-mort', n: 50, s: [5, 11], solid: 0.05, wind: 0, c: { t: '#3E3428', d: '#5A4C3A' } },
        ],
      },
      fauna: [['blatte', 16], ['mille-pattes', 8], ['meganeura', 4], ['arthropleura', 3], ['edaphosaure', 4], ['scorpion-geant', 3], ['dimetrodon', 2]],
      hazards: [{ type: 'foudre', every: [11, 19], r: 3.2, dmg: 1, line: "L'orage ! Regarde bien : la foudre tombe où le sol s'allume en rouge." }],
      missions: [
        { type: 'eat', species: 'blatte', n: 6 },
        { type: 'defeat', species: 'meganeura', n: 2, text: 'Attrape 2 Meganeura au vol' },
        { type: 'defeat', species: 'scorpion-geant', n: 1, text: 'Bats un scorpion géant' },
        { type: 'grow', text: 'Grandis au maximum' },
        { type: 'duel', species: 'dimetrodon' },
      ],
      boss: { species: 'dimetrodon', scale: 1.5, hp: 36, bite: 2, speed: 10.5, title: 'Le Dimetrodon à la grande voile', line: "Le roi de la forêt de charbon t'a repéré. Il n'y a plus qu'à se battre !" },
      evolutions: [
        { id: 'ecailles', icon: '🐉', name: 'Écailles', short: 'Tu encaisses plus de coups', fact: "Les écailles gardent l'eau dans le corps : les reptiles ont pu quitter les mares pour de bon.", effect: { hp: 1.25 }, mods: { back: { from: -0.8, to: 0.6, n: 18, h: 0.04 }, spots: 10 } },
        { id: 'oeuf', icon: '🥚', name: 'Œuf à coquille', short: 'Tu reprends des forces plus vite', fact: "Un œuf à coquille n'a pas besoin d'eau : c'est la grande invention des reptiles ! Fini les têtards dans les mares.", effect: { heal: 1.6 }, mods: { d: 0.17 } },
        { id: 'griffes', icon: '🐾', name: 'Griffes', short: 'Tu mords et griffes plus fort', fact: "Les griffes aident à grimper, à creuser et à se battre. Elles sont faites de la même matière que tes ongles !", effect: { bite: 1.4 }, mods: { toeClaw: 0.14, legW: 0.06 } },
        { id: 'sprinteur', icon: '💨', name: 'Longues pattes', short: 'Tu sprintes plus vite', fact: "Des pattes plus longues sous le corps : c'est le début d'une course bien plus rapide.", effect: { run: 1.15 }, mods: { H: 0.33, foreH: 0.3, splay: 0.28 } },
      ],
      intro: "Des millions d'années ont passé. Te voilà reptile, dans une forêt d'arbres géants. Il y fait sombre, l'orage gronde, et d'énormes libellules te guettent du ciel. Et quelque part, un chasseur à la grande voile fait sa ronde…",
      tips: [
        "La libellule pique sur toi ? Mords quand elle arrive à ta hauteur !",
        "Tu as grandi : ce qui te faisait fuir tout à l'heure, tu peux maintenant l'affronter.",
        "Écoute : le cœur qui bat plus vite veut dire qu'un chasseur approche, même si tu ne le vois pas.",
      ],
    },
  },
  {
    title: 'Les premiers dinosaures', ago: [230, 215], form: 'dino', skin: { body: '#C8553D', belly: '#F6CFA8', dark: '#5E1F14', stripe: '#7A2A1C' },
    size: [70, 110], growth: 100, species: {}, unlock: [], missions: [], intro: '',
    palette: { water: ['#B98F5A', '#7A5534'], floor: '#C2A36B', motes: 'rgba(255, 230, 180, 0.5)' },
    d3: {
      choice: true,
      heroes: {
        carnivore: { animal: 'herrerasaure', walk: 9, run: 13, sprint: 20, hp: 11, bite: 3, reach: 0.95, scale: [0.9, 1.4], cam: 6.2, label: 'Herrerasaurus', attackName: 'Mords', attackIcon: '🦷' },
        herbivore: { animal: 'plateosaure', walk: 8, run: 11.5, sprint: 17, hp: 15, bite: 2, reach: 1.25, scale: [0.9, 1.4], cam: 7, label: 'Plateosaurus', attackName: 'Griffe', attackIcon: '🐾', ram: 2 },
      },
      biome: {
        radius: 290, amp: 30, freq: 0.0095, base: 0.47, terrace: 5, startR: 26, startH: 5, texScale: 5, rockSlope: 0.55,
        ground: { low: '#C99A5E', mid: '#C28454', high: '#A85E3E', rock: '#8A4A32', patch: '#B8AE66' },
        sky: { top: '#3E7CC0', mid: '#A6C4D8', low: '#F4DEC0', sun: '#FFF0C4', cloud: '#FFF8E8', cover: 0.28 },
        fog: { color: '#E8CDA8', near: 30, far: 190 }, far: '#C69470', far2: '#D8B090',
        light: { sky: '#FFF0D8', ground: '#B07A4A', sun: '#FFE8BE', hemi: 1.5, power: 2.6 },
        tuft: { c: { a: '#8A8A3C', b: '#C8B458' }, s: 0.6, cell: 3 },
        food: { type: 'cycade', n: 110, s: [1.5, 2.5], c: { a: '#3E8A3C', b: '#8AD04E', t: '#6B5534', d: '#8A7048' } },
        flora: [
          { type: 'mesa', n: 34, s: [20, 55], solid: 0.36, wide: 1.25, shadow: true, wind: 0, maxSlope: 2, c: { a: '#A85E3E', b: '#C8805A' } },
          { type: 'araucaria', n: 210, s: [12, 22], solid: 0.03, shadow: true, wind: 0.03, cluster: 22, spread: 30, c: { a: '#2F5E34', b: '#467A3A', t: '#5A3E28', d: '#6E5236' } },
          { type: 'fougere', n: 170, s: [4.5, 7], hide: 0.74, cluster: 20, spread: 10, c: { a: '#3E7A34', b: '#94B848' } },
          { type: 'cycade', n: 90, s: [2, 3.6], cluster: 22, spread: 16, c: { a: '#3E7A34', b: '#7FAE44', t: '#6B5534', d: '#8A7048' } },
          { type: 'arbre-mort', n: 50, s: [5, 10], wind: 0, c: { t: '#6E4E32', d: '#8E6E4A' } },
          { type: 'rocher', n: 120, s: [1, 4], solid: 0.45, wind: 0, c: { a: '#A8664A', b: '#BE7C5A' } },
        ],
      },
      fauna: [['cynodonte', 14], ['plateosaure-sauvage', 5], ['coelophysis', 6], ['postosuchus', 2]],
      hazards: [{ type: 'rocs', every: [14, 24], r: 4.5, dmg: 2, line: "Attention, ça s'éboule ! Sors vite du cercle rouge." }],
      missionsBy: {
        carnivore: [
          { type: 'eat', species: 'cynodonte', n: 5 },
          { type: 'defeat', species: 'coelophysis', n: 2, text: 'Bats 2 Coelophysis' },
          { type: 'eat', species: 'plateosaure-sauvage', n: 1, text: 'Chasse un Plateosaurus' },
          { type: 'grow', text: 'Grandis au maximum' },
          { type: 'duel', species: 'postosuchus' },
        ],
        herbivore: [
          { type: 'plants', n: 10, text: 'Broute 10 cycas' },
          { type: 'hide', n: 2, text: 'Sème 2 chasseurs en te cachant' },
          { type: 'defeat', species: 'coelophysis', n: 2, text: 'Fais fuir 2 Coelophysis à coups de griffes' },
          { type: 'grow', text: 'Grandis au maximum' },
          { type: 'duel', species: 'postosuchus' },
        ],
      },
      boss: { species: 'postosuchus', scale: 1.5, hp: 70, bite: 3, speed: 13.5, title: 'Postosuchus, le maître du Trias', line: "Lui, il n'a jamais perdu. C'est le moment de lui montrer que les dinosaures arrivent !" },
      evolutionsBy: {
        carnivore: [
          { id: 'dents', icon: '🦷', name: 'Dents en scie', short: 'Tes morsures font bien plus mal', fact: "Les dents des dinosaures carnivores ressemblent à des couteaux à pain : leurs bords en scie coupent la viande.", effect: { bite: 1.4 }, mods: { hl: 0.5, hh: 0.31, toothL: 0.055, teeth: 8 } },
          { id: 'jambes', icon: '🏃', name: 'Grandes jambes', short: 'Tu vas beaucoup plus vite', fact: "Les dinosaures ont les pattes bien droites sous le corps. Contrairement aux crocodiles : c'est leur grand secret pour courir vite.", effect: { run: 1.15 }, mods: { H: 0.95, tail: 1.9 } },
          { id: 'griffes-t', icon: '🐾', name: 'Griffes de chasseur', short: 'Une griffe de plus quand tu mords', fact: "Herrerasaurus avait de longues griffes aux mains pour saisir ses proies.", effect: { bite: 1.25 }, mods: { armL: 0.28, armW: 0.05 } },
          { id: 'cuir', icon: '🛡️', name: 'Cuir épais', short: 'Tu encaisses plus de coups', fact: "Une peau bien épaisse : dans une bagarre entre chasseurs, c'est souvent ce qui fait la différence.", effect: { hp: 1.3 }, mods: { d: 0.34, back: { from: -1.2, to: 0.9, n: 16, h: 0.07 } } },
        ],
        herbivore: [
          { id: 'long-cou', icon: '🦒', name: 'Long cou', short: 'Tu broutes de plus loin, et plus vite', fact: "Un long cou permet de manger beaucoup sans bouger, et d'atteindre des feuilles que personne d'autre n'atteint.", effect: { graze: 1.5 }, mods: { neck: 1.25, neckR: 0.15 } },
          { id: 'griffe-pouce', icon: '🐾', name: 'Griffe du pouce', short: 'Tes coups font bien plus mal', fact: "Plateosaurus avait une grande griffe au pouce : une arme contre les chasseurs !", effect: { bite: 1.5 }, mods: { armL: 0.46, armW: 0.1 } },
          { id: 'gros-ventre', icon: '🍖', name: 'Gros ventre', short: 'Tu encaisses bien plus de coups', fact: "Pour digérer autant de plantes, il faut un immense estomac. Et plus on est gros, moins on a peur !", effect: { hp: 1.3 }, mods: { fat: 1.22, d: 0.47 } },
          { id: 'course', icon: '🏃', name: 'Pattes de coureur', short: 'Tu vas plus vite', fact: "Les jeunes Plateosaurus couraient sur deux pattes. Pour fuir, c'est très utile !", effect: { run: 1.15 }, mods: { H: 1.22 } },
        ],
      },
      intro: "Le Trias ! Un désert de roches rouges. Tes descendants marchent maintenant sur deux pattes : les tout premiers dinosaures. Mais pour l'instant, ce sont les cousins des crocodiles qui commandent ici.",
      tips: [
        "Une meute ! Si l'un d'eux te voit, tous les autres arrivent.",
        "Le sol tremble ? Un gros chasseur approche. Cherche vite une cachette.",
        "Fonce sur un ennemi puis attaque juste après son attaque : il est fatigué, ça fait bien plus mal !",
      ],
    },
  },
  {
    title: 'Le Jurassique', ago: [155, 145], form: 'grand-dino', skin: { body: '#3E7CB8', belly: '#DCEAF5', dark: '#1B3A5C', stripe: '#F2C14E' },
    size: [110, 170], growth: 100, species: {}, unlock: [], missions: [], intro: '',
    palette: { water: ['#5C7F4A', '#2F4A2A'], floor: '#6E8B4E', motes: 'rgba(255, 255, 210, 0.5)' },
    d3: {
      heroes: {
        carnivore: { animal: 'allosaure', walk: 13, run: 18, sprint: 27, hp: 14, bite: 6, reach: 1.9, scale: [0.85, 1.2], cam: 13, label: 'Allosaurus', attackName: 'Mords', attackIcon: '🦷' },
        herbivore: { animal: 'stegosaure', walk: 11, run: 15.5, sprint: 23, hp: 20, bite: 5, reach: 2.8, scale: [0.85, 1.2], cam: 12.5, label: 'Stegosaurus', attackName: 'Queue', attackIcon: '💥', ram: 3, tailHit: true },
      },
      biome: {
        radius: 420, amp: 40, freq: 0.0065, base: 0.44, water: 0, waterCol: '#2E8AA0', startR: 40, startH: 6, texScale: 8, rockSlope: 0.7,
        ground: { low: '#A8A070', mid: '#6E9648', high: '#4E7E40', rock: '#6A6A5A', patch: '#8AAE4C' },
        sky: { top: '#2E7EC8', mid: '#9FCDE0', low: '#E2F0D8', sun: '#FFF8D8', cloud: '#FFFFFF', cover: 0.46 },
        fog: { color: '#BBDBCC', near: 50, far: 300 }, far: '#7EA890', far2: '#9DBCB0',
        light: { sky: '#F0FFF0', ground: '#6E8A4A', sun: '#FFF2CC', hemi: 1.5, power: 2.5 },
        tuft: { c: { a: '#4E8A38', b: '#9FCC52' }, s: 1.1, cell: 4.2 },
        food: { type: 'cycade', n: 120, s: [2.8, 4.4], c: { a: '#2F7A3C', b: '#8AD04E', t: '#6B5534', d: '#8A7048' } },
        flora: [
          { type: 'araucaria', n: 320, s: [30, 52], solid: 0.03, shadow: true, wind: 0.025, cluster: 26, spread: 42, c: { a: '#2A5E30', b: '#3E7A38', t: '#54402A', d: '#6E5636' } },
          { type: 'conifere', n: 220, s: [16, 30], solid: 0.03, shadow: true, wind: 0.03, cluster: 22, spread: 34, c: { a: '#265A2E', b: '#357036', t: '#54402A' } },
          { type: 'arbre-fougere', n: 200, s: [10, 18], solid: 0.05, wind: 0.05, c: { a: '#2E6E34', b: '#6EB048', t: '#4A3A28', d: '#6B5534' } },
          { type: 'fougere', n: 220, s: [7, 11], hide: 0.74, cluster: 24, spread: 14, c: { a: '#2E7038', b: '#86C04A' } },
          { type: 'cycade', n: 120, s: [3.5, 6], cluster: 30, spread: 20, c: { a: '#2F7A3C', b: '#7FB84A', t: '#6B5534', d: '#8A7048' } },
          { type: 'rocher', n: 110, s: [2, 8], solid: 0.45, wind: 0, c: { a: '#70705E', b: '#888870' } },
        ],
      },
      fauna: [['compsognathus', 12], ['dryosaure', 12], ['rhamphorhynchus', 4], ['brachiosaure', 3], ['diplodocus', 3], ['stegosaure-sauvage', 3], ['ceratosaure', 3], ['allosaure-sauvage', 3]],
      hazards: [{ type: 'ruee', species: 'dryosaure', every: [26, 40], n: 14, line: "Une ruée ! Tout un troupeau arrive en courant… Qu'est-ce qui leur fait peur ?" }],
      missionsBy: {
        carnivore: [
          { type: 'eat', species: 'dryosaure', n: 5 },
          { type: 'defeat', species: 'ceratosaure', n: 1, text: 'Bats un Ceratosaurus' },
          { type: 'eat', species: 'stegosaure-sauvage', n: 1, text: 'Ose attaquer un Stegosaurus (gare à sa queue !)' },
          { type: 'grow', text: 'Grandis au maximum' },
          { type: 'duel', species: 'allosaure-sauvage' },
        ],
        herbivore: [
          { type: 'plants', n: 12, text: 'Broute 12 cycas' },
          { type: 'hide', n: 2, text: 'Sème 2 chasseurs en te cachant' },
          { type: 'defeat', species: 'ceratosaure', n: 1, text: 'Repousse un Ceratosaurus à coups de queue' },
          { type: 'grow', text: 'Grandis au maximum' },
          { type: 'duel', species: 'allosaure-sauvage' },
        ],
      },
      boss: { species: 'allosaure-sauvage', scale: 1.3, hp: 140, bite: 4, speed: 20, title: "L'Allosaurus borgne", line: "Le plus terrible chasseur du Jurassique. Il a mangé tous ceux qui l'ont défié…" },
      evolutionsBy: {
        carnivore: [
          { id: 'hache', icon: '⚔️', name: 'Mâchoire-hache', short: 'Tes morsures sont dévastatrices', fact: "Allosaurus ouvrait la gueule à presque 80 degrés et frappait de haut en bas avec ses dents, comme avec une hache !", effect: { bite: 1.4 }, mods: { hl: 1.22, hh: 0.8, hw: 0.36, toothL: 0.15 } },
          { id: 'cornes', icon: '😈', name: 'Cornes de combat', short: 'Tu fais peur : les petits fuient, tu encaisses mieux', fact: "Allosaurus avait deux petites cornes au-dessus des yeux. Elles servaient sans doute à impressionner ses rivaux.", effect: { hp: 1.2, bite: 1.1 }, mods: { brows: 0.42 } },
          { id: 'muscles', icon: '💪', name: 'Grandes cuisses', short: 'Tu vas beaucoup plus vite', fact: "Une énorme cuisse, attachée à la queue par un long muscle : c'est le moteur des grands dinosaures.", effect: { run: 1.15 }, mods: { legW: 0.42, H: 2.2 } },
          { id: 'crete', icon: '🦎', name: 'Crête dorsale', short: 'Tu encaisses plus de coups', fact: "Beaucoup de dinosaures avaient une rangée d'écailles osseuses sur le dos, peut-être pour se protéger ou se reconnaître.", effect: { hp: 1.3 }, mods: { back: { from: -3, to: 2, n: 26, h: 0.2 } } },
        ],
        herbivore: [
          { id: 'plaques', icon: '🛡️', name: 'Grandes plaques', short: 'Tu encaisses bien plus de coups', fact: "Les plaques du Stegosaurus étaient pleines de vaisseaux sanguins. Elles rougissaient peut-être pour faire peur à ses ennemis !", effect: { hp: 1.3 }, mods: { plates: { from: -2.0, to: 1.9, n: 13, h: 1.05 } } },
          { id: 'piques', icon: '💥', name: 'Grands piquants', short: 'Tes coups de queue font très mal', fact: "Les paléontologues appellent ces quatre piquants un « thagomizer », à cause d'une bande dessinée ! Le mot est resté.", effect: { bite: 1.5 }, mods: { spikes: { bone: 'tail3', L: 1.25 } } },
          { id: 'cuirasse', icon: '🦴', name: 'Gorge blindée', short: 'Tu encaisses mieux les morsures', fact: "Le Stegosaurus avait la gorge protégée par de petits osselets dans la peau.", effect: { armor: 0.8 }, mods: { d: 0.92 } },
          { id: 'charge', icon: '🏃', name: 'Pattes de charge', short: 'Tu vas plus vite, tu charges plus fort', fact: "Un adulte pesait autant qu'un camion : mieux vaut ne pas le voir arriver lancé !", effect: { run: 1.12, ram: 1.4 }, mods: { foreH: 1.2, legW: 0.3 } },
        ],
      },
      intro: "Le Jurassique, l'âge des géants ! Regarde en l'air : ces colonnes, ce sont des pattes. Les Brachiosaurus ne te voient même pas, ils peuvent t'écraser sans le faire exprès. Et dans cette forêt, l'Allosaurus chasse.",
      tips: [
        "Ne passe pas sous les pattes des géants… ou alors très vite !",
        "Les chasseurs hésitent à te suivre entre les pattes d'un troupeau de géants.",
        "Une ruée de petits dinosaures qui courent ? C'est qu'un grand chasseur arrive derrière eux.",
      ],
    },
  },
  {
    title: 'Le Crétacé', ago: [68, 66], form: 'tyran', skin: { body: '#2F6E73', belly: '#F2D7A6', dark: '#123336', stripe: '#E9822B' },
    size: [170, 260], growth: 100, species: {}, unlock: [], missions: [], intro: '',
    palette: { water: ['#7C7A4A', '#3F3C24'], floor: '#8A8656', motes: 'rgba(255, 240, 200, 0.5)' },
    d3: {
      heroes: {
        carnivore: { animal: 'trex', walk: 15, run: 21, sprint: 32, hp: 20, bite: 11, reach: 2.9, scale: [0.85, 1.2], cam: 18, label: 'Tyrannosaurus rex', attackName: 'Mords', attackIcon: '🦷' },
        herbivore: { animal: 'triceratops', walk: 13, run: 18, sprint: 28, hp: 30, bite: 9, reach: 3.4, scale: [0.85, 1.2], cam: 16, label: 'Triceratops', attackName: 'Cornes', attackIcon: '🦏', ram: 7 },
      },
      biome: {
        radius: 520, amp: 46, freq: 0.0052, base: 0.44, water: 0, waterCol: '#3A7A8A', startR: 46, startH: 7, texScale: 9, rockSlope: 0.65, volcano: 0.9, meteor: true,
        ground: { low: '#8E8A5A', mid: '#7A8A44', high: '#5E6E3A', rock: '#4A4238', patch: '#A89048' },
        sky: { top: '#3A2E5A', mid: '#D8724E', low: '#F4C07A', sun: '#FFE0A0', cloud: '#E8A080', cover: 0.5 },
        fog: { color: '#D89E78', near: 60, far: 360 }, far: '#7A5A58', far2: '#A87060',
        light: { sky: '#FFD8B8', ground: '#6E5A3A', sun: '#FFC890', hemi: 1.35, power: 2.4 },
        sunDir: [-0.7, 0.42, 0.45],
        tuft: { c: { a: '#6E8A3C', b: '#C8B858' }, s: 1.4, cell: 5 },
        food: { type: 'magnolia', n: 110, s: [4.5, 7], c: { a: '#3E7A3C', t: '#54402A', f: '#FFB8D0' } },
        flora: [
          { type: 'ginkgo', n: 200, s: [22, 40], solid: 0.045, shadow: true, wind: 0.035, cluster: 22, spread: 40, c: { a: '#6E8A34', b: '#94A83C', t: '#4A3A28' } },
          { type: 'conifere', n: 240, s: [24, 42], solid: 0.03, shadow: true, wind: 0.03, cluster: 26, spread: 44, c: { a: '#3A5E30', b: '#4E7036', t: '#4A3A28' } },
          { type: 'magnolia', n: 170, s: [7, 12], solid: 0.04, cluster: 26, spread: 26, c: { a: '#3E7A3C', t: '#54402A', f: '#FFD0E0' } },
          { type: 'fougere', n: 240, s: [9, 14], hide: 0.74, cluster: 26, spread: 18, c: { a: '#3E7034', b: '#A8B84A' } },
          { type: 'arbre-mort', n: 60, s: [12, 22], solid: 0.05, wind: 0, c: { t: '#3A2E26', d: '#54443A' } },
          { type: 'rocher', n: 110, s: [3, 12], solid: 0.45, wind: 0, c: { a: '#4E463E', b: '#6A5E50' } },
        ],
      },
      fauna: [['edmontosaure', 9], ['parasaurolophus', 6], ['quetzalcoatlus', 4], ['ankylosaure', 3], ['triceratops-sauvage', 4], ['dakotaraptor', 6], ['trex-sauvage', 2]],
      hazards: [{ type: 'bombes', every: [9, 16], r: 9, dmg: 3, line: "Le volcan crache des rochers en feu ! Regarde par terre : sors du cercle rouge, vite !" }],
      missionsBy: {
        carnivore: [
          { type: 'eat', species: 'edmontosaure', n: 3, text: 'Chasse 3 Edmontosaurus' },
          { type: 'defeat', species: 'dakotaraptor', n: 3, text: 'Bats 3 Dakotaraptor' },
          { type: 'eat', species: 'triceratops-sauvage', n: 1, text: 'Vaincs un Triceratops' },
          { type: 'grow', text: 'Grandis au maximum' },
          { type: 'duel', species: 'trex-sauvage' },
        ],
        herbivore: [
          { type: 'plants', n: 12, text: 'Broute 12 magnolias' },
          { type: 'defeat', species: 'dakotaraptor', n: 3, text: 'Encorne 3 Dakotaraptor' },
          { type: 'hide', n: 2, text: 'Sème 2 grands chasseurs en te cachant' },
          { type: 'grow', text: 'Grandis au maximum' },
          { type: 'duel', species: 'trex-sauvage' },
        ],
      },
      boss: { species: 'trex-sauvage', scale: 1.28, hp: 300, bite: 5, speed: 24, title: 'Le dernier des tyrans', line: "Le duel pour le titre de roi de la Terre. Un seul de vous deux restera debout !" },
      evolutionsBy: {
        carnivore: [
          { id: 'morsure', icon: '🦷', name: 'Morsure broyeuse', short: 'Plus rien ne résiste à tes dents', fact: "Le T. rex mordait avec une force de plusieurs tonnes. Il broyait les os et les avalait !", effect: { bite: 1.4 }, mods: { hl: 2.0, hh: 1.36, hw: 0.72, toothL: 0.28 } },
          { id: 'flair', icon: '👃', name: 'Flair incroyable', short: 'Le radar te montre tout, de très loin', fact: "Dans le crâne du T. rex, les zones de l'odorat étaient énormes. Il sentait sa proie à des kilomètres.", effect: { radar: 1.6 }, mods: { top: '#0E2A2E' } },
          { id: 'puissance', icon: '💪', name: 'Cuisses géantes', short: 'Tu cours bien plus vite', fact: "Un T. rex adulte pesait autant que deux éléphants. Il fallait des cuisses énormes pour le porter !", effect: { run: 1.14 }, mods: { legW: 0.64, d: 1.35 } },
          { id: 'peau-epaisse', icon: '🛡️', name: 'Peau d\'écailles', short: 'Tu encaisses plus de coups', fact: "On a retrouvé des empreintes de peau de T. rex : de petites écailles, et peut-être un peu de plumes sur le dos.", effect: { hp: 1.3 }, mods: { back: { from: -4.2, to: 2.6, n: 30, h: 0.28 } } },
        ],
        herbivore: [
          { id: 'cornes-g', icon: '🦏', name: 'Cornes géantes', short: 'Tes charges sont terribles', fact: "Les cornes du Triceratops mesuraient plus d'un mètre. Des fossiles montrent des combats entre Triceratops, cornes contre cornes !", effect: { bite: 1.5, ram: 1.3 }, mods: { horns: [{ at: 0.3, up: 0.45, z: 0.42, L: 1.5, r: 0.17, fwd: 0.92, rise: 0.38, out: 0.05 }, { at: 0.86, up: 0.1, L: 0.5, r: 0.11, fwd: 0.5, rise: 0.8 }] } },
          { id: 'collerette', icon: '🛡️', name: 'Grande collerette', short: 'Tu encaisses bien plus de coups', fact: "La collerette protégeait le cou… et servait sans doute aussi à faire le beau !", effect: { hp: 1.3 }, mods: { frill: { r: 1.5, back: 0.95 } } },
          { id: 'bec', icon: '🌿', name: 'Bec tranchant', short: 'Tu broutes vite, tes blessures guérissent', fact: "Avec son bec et ses centaines de dents, le Triceratops pouvait couper les plantes les plus dures.", effect: { graze: 1.6, heal: 1.4 }, mods: { hl: 1.55 } },
          { id: 'charge-t', icon: '💨', name: 'Charge', short: 'Tu vas beaucoup plus vite', fact: "On pense qu'un Triceratops pouvait charger à la vitesse d'une voiture en ville : 6 tonnes lancées à toute allure !", effect: { run: 1.15, ram: 1.2 }, mods: { legW: 0.42 } },
        ],
      },
      intro: "La fin du Crétacé. Les premières fleurs ont poussé, le volcan gronde, une étrange étoile grossit dans le ciel… Tu es devenu immense. Mais un seul animal peut régner sur la Terre, et ce titre, il faudra le prendre.",
      tips: [
        "Le ciel s'obscurcit, regarde l'étoile qui grossit… Il ne te reste plus beaucoup de temps.",
        "Tu as grandi : la plupart des animaux te fuient. Sauf un.",
      ],
    },
  },
];

/* Ce que dit Ammo, ton guide, dans ce niveau */
const lines = {
  start: "Bloub ! Moi, je reste au bord de l'eau, mais je te suis partout. Sur la terre, c'est un vrai défi : seuls les plus malins survivent !",
  spotted: ["Il t'a vu ! Cours !", 'Le voilà ! Une cachette, vite !', "Ne reste pas là, il arrive !"],
  rumble: ['Tu sens le sol trembler ?', "Boum… boum… Ce n'est pas bon signe.", "Quelque chose d'énorme approche…"],
  roarFar: ["Tu as entendu ? Il n'est pas loin…", 'Ce cri ! Il chasse, et il te cherche peut-être.'],
  hidden: ['Chut… Reste caché, ne sprinte pas.', 'Parfait ! Il ne te voit plus. Ne bouge pas trop.'],
  lost: ['Ouf ! Il a perdu ta trace.', 'Bien joué : tu es plus malin que lui !'],
  noise: ['Ce sprint a fait du bruit… Ils t\'ont entendu !'],
  bitten: ['Aïe ! Fuis ou réplique, mais ne reste pas là !', 'Ça fait mal ! Il te reste encore des forces.'],
  low: ['Tu es blessé ! Mange quelque chose pour reprendre des forces, vite !'],
  eaten: ['Croqué ! Heureusement, tes petits continuent le voyage…', 'Oh non ! Allez, on recommence, et cette fois, on se cache mieux.'],
  grow: ['Tu grandis ! Regarde ta taille !', 'Encore plus gros ! Bientôt, ce sont eux qui auront peur.'],
  turnTables: ["Il est plus petit que toi maintenant ! À toi de le chasser !"],
  bossOpen: ['Il souffle : il est fatigué ! Attaque, ça compte double !', 'Maintenant ! Mords-le pendant qu\'il reprend son souffle !'],
  bossWin: ['Tu as gagné ! Personne ne te barrera plus la route.', 'Quel combat ! Tu es le plus fort, maintenant.'],
  bossLost: ['Il a gagné cette fois… mais il est blessé. Recommence : il ne guérira pas complètement !'],
  graze: ['Miam, des feuilles ! Chaque plante te fait grandir et te soigne.'],
  giant: ["Attention, c'est juste une patte ! Il ne te voit même pas…"],
};

/* La fin : on domine la Terre… puis la météorite. Trois chemins pour la suite. */
const ending = {
  scene: 'meteorite',
  crowd: ['parasaurolophus', 'triceratops', 'ankylosaure', 'gallimimus'],
  title: 'La fin des dinosaures',
  sub: "Il y a 66 millions d'années, une météorite géante a frappé la Terre. Les grands dinosaures ont tous disparu… mais certains animaux ont survécu. Qui seront tes descendants ?",
  done: "Tu as dominé la Terre… jusqu'à la météorite",
  captions: [
    [0.4, 4, "Tu domines la Terre ! Aucun animal n'ose plus t'approcher…"],
    [4.2, 7.2, "Mais il y a 66 millions d'années, quelque chose arrive du ciel…"],
    [7.6, 11.6, "Une météorite géante s'écrase. Le ciel devient noir, il fait froid… Les grands dinosaures disparaissent."],
    [11.8, 15, "Mais certains animaux survivent…"],
  ],
  choices: [
    {
      id: 'airs', icon: '🐦', title: 'La voie des airs',
      text: "Tes descendants ont des plumes et deviennent de petits oiseaux… les seuls dinosaures encore vivants !",
      level: 'voie-des-airs',
      soon: 'Niveau 3 : La voie des airs',
      fact: "Les oiseaux sont des dinosaures ! La poule et le pigeon sont de lointains cousins du T. rex.",
    },
    {
      id: 'mammiferes', icon: '🐭', title: 'La voie des mammifères',
      text: 'De petites boules de poils, cachées dans leurs terriers… qui vont conquérir la planète.',
      level: 'voie-des-mammiferes',
      soon: 'Niveau 3 : La voie des mammifères',
      fact: "Les petits mammifères ont survécu en se cachant sous terre. Sans les dinosaures, ils ont pu grandir et se répandre partout.",
    },
    {
      id: 'reptiles', icon: '🐊', title: 'La voie des reptiles',
      text: 'Crocodiles, tortues et lézards : des survivants à toute épreuve.',
      level: 'voie-des-reptiles',
      soon: 'Niveau 3 : La voie des reptiles',
      fact: "Les crocodiles vivaient déjà au temps des dinosaures… et ils ont survécu à la météorite !",
    },
  ],
};

export default {
  id: 'vers-les-dinosaures',
  name: 'Vers les dinosaures',
  icon: '🦖',
  intro: 'terre',
  engine: 'dino3d',
  goal: "Tes descendants sortent de l'eau. Sur la terre, tout est dangereux : <b>seuls les plus malins survivent</b>. Cache-toi, ne cours pas pour rien, et deviens le plus grand des dinosaures :<br>🐸 le tétrapode → 🦎 le reptile → 🦖 le dinosaure → 👑 le roi de la Terre !",
  world,
  species,
  faune,
  evolutions: {},
  chapters,
  lines,
  ending,
};
