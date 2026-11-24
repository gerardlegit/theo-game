# CLAUDE.md

**La Cabane à Jeux** (https://www.la-cabane.app): a free website of educational games for French-speaking kids. It is a 100% static site: plain HTML/CSS/vanilla JS, with no build step, no package.json and no bundler. It is hosted on GitHub Pages (`CNAME`), and the git root is this `kids-hub/` folder.

## Language

All user-facing text, code comments, project docs (`COMMENT-HEBERGER.md`, `FIREBASE-SETUP.md`) and identifiers like storage keys and game ids are in **French**. Keep it that way, and use proper French typography (`’`, `…`, non-breaking spaces before `!?:` where the surrounding code does). The audience is children, so the tone should be friendly, encouraging and simple.

## Layout

```
index.html, style.css     Home page: hero, theme sections (Lecture, Maths, Nature,
                          Histoire-Géo, Science, Anglais, Logique) with game cards, "Jeu épique" block
shared/                   ES modules used by every game
  firebase-config.js      Real Firebase web config (public by design; security = Firestore rules)
  leaderboard.js          fetchTopScores / submitScore / isLeaderboardConfigured
  visits.js               Daily visit counter (home page) + history for admin
  messages.js             « Laisser un commentaire » form (home #avis): send / fetch / delete
  guide.css, guide.js     « Parents et enseignants » text under each game
admin/index.html          Visit stats behind a client-side "admin/admin" login (not real security);
                          visitor messages behind a real Firebase Auth login (admin UID in the rules)
jeux/<slug>/              One folder per game, served at /jeux/<slug>/
sitemap.xml, robots.txt   SEO; /admin/ is disallowed
```

Each game is self-contained in `jeux/<slug>/`: `index.html`, `style.css`, `script.js` (entry, `<script type="module">`), plus optional `data.js` (content), `art.js` (drawings), and `sound.js`/`audio.js` (sound effects). Bigger games split further (`royaume-des-mots/js/…` with `content/` per French topic, `livraisons-espace/levels/`).

Cross-game reuse to be aware of:
- `safari-planete/` has **only** an `index.html` and runs `../pin-the-globe/script.js` + `style.css`. `<body data-game="safari">` selects the `GAMES.safari` config in `pin-the-globe/script.js`. Changes to pin-the-globe affect Safari Planète.
- `livraisons-espace/` imports `../espace/art.js`, `../espace/data.js` and `../espace/style.css` (Mission Cosmos). The levels are documented in `livraisons-espace/levels/index.js` ("POUR AJOUTER UN NIVEAU").
- `marche-des-pompons/` (La Marche des Pompons, theme Logique) is an original puzzle game in the « walkers you give jobs to » genre: Pompons fall from a cloud and walk straight; the seven jobs are `stop`, `pont`, `creuse`, `tunnel`, `grimpe`, `parapluie` and `echelle` (world 5, the Volcan). A ladder (`planLadder` in `monde.js`) goes against a wall to climb or over an edge to go down; it stays, and works both ways for every Pompon, which is what the Volcan puzzles are built on. Lava is the letter `L` in the maps. It uses `../espace/style.css` plus its own `style.css`. `monde.js` is the whole simulation, with no drawing, run at a fixed 30 steps per second so that a replay always gives the same result. `terrain.js` holds the pixel grid and its painting, and the levels are letter maps in `levels/` (legend and rules in `levels/index.js`, « POUR AJOUTER UN NIVEAU »). Each level carries a `solution`: with `?debug`, `__pom.verifie()` replays them all and also checks that doing nothing loses. Run it after any change to the rules or to a map. `?debug&niveau=N` opens level N, `__pom.auto()` plays the solution live, `__pom.bench()` gives ms per frame. The start screen shows a map of the worlds (`renderWorldMap` in `script.js`): a finished world can be replayed at any time, the current one opens on the next level to do, and the worlds after it stay locked.
- `evolution/`: one 2D engine (`script.js`) for every level. Sea animals are drawn from above along a spine that follows the head (fluid turns), in `art.js`/`art-mer.js`/`art-requins.js`; the land animals of levels 2, 3 and 4 were too, in `art-dessus.js` (one simple drawer `drawLand`, species = measurements in `ANIMAUX`, looks `vd-…`; legs trot out from under the body). Profile drawings exist only for the cinematics: `art-profil.js` (shrew and wolf-cub heroes of the intros, wolves, dog-breed parade, humans of the dog ending) and the lizard/tetrapod in `art-terre.js`. `art-mammiferes.js` and `art-loup.js` now hold only top-down extras (titanoboa, flying bird, thrown bone) and decor. The user rejected 3D, a computed 3/4 view and a « papier découpé » style for land animals. Since then, every land level has been redrawn in the humans' 3/4 style at the user's explicit request (next bullet); `art-dessus.js` stays for the thumbnails and cinematics that still use it.
  - Asked for explicitly: the dinosaur level `vers-les-dinosaures`, the mammals level `voie-des-mammiferes` and the wolf level `loup-et-humain` keep the top-down engine (same decor, rules and AI) but are **drawn like the humans' level** (`world.style: 'tqv'`): `decor-tqv.js` redraws its `world.decor` (snow, ponds, camps with hide tents, villages, the pen fence, tall grass, pines) with the `art-humains.js` drawers, and its species use `th-…` looks (standing animals in profile, round humans). `bite` keeps each species' old bite reach (not `reach`, which already means how far a water hunter leaves its pond); `drawK` draws humans smaller than their game size; `palette.decorK` grows the decor with the player (mammals: shrew → sabre-tooth); reptiles, birds and insects reuse the `vc-…` profiles via `standing()`; anything standing in a pond is drawn half-submerged (`drawWading` in `script.js`), while fish stay top-down under the water and top-down flyers are lifted above their shadow. Dinosaurs live in `art-dinos-tq.js` (`drawMammal` from `art-profil.js` gained `biped`, `longNeck`, `behind`, tail `pointe` + `end`); `TAIL_TIP` keeps the giants' tail bite (`tailBite`) working without a spine. The camera is `TQ_ZOOM` closer, but spawning and hearing distances use `playW()`/`playH()` (the top-down view size), so the rules don't change. Static decor is drawn once into cached sprites (`sprite()` in `decor-tqv.js`, keyed by type/variant/size/zoom/palette, cleared on chapter change); drawing a fern live costs ~100 ellipses, and hundreds on screen dropped the game to 10 fps. `__evo.bench()` (debug URL) returns ms per frame: keep it under ~5 ms in headless Edge. Don't use `git stash` here: with `autocrlf` it rewrites LF files as CRLF.
  - Exception, asked for explicitly: the two level-3 paths `voie-des-airs` (birds) and `voie-des-reptiles` (jungle) are **seen from the side** (`world.view: 'cote'`). `cote.js` builds each chapter's landscape (cliffs and ledges, trees to climb, lakes, sea, thermals, camps) and runs the side physics (walk, fly with the 💨 wing meter, climb, swim, dive). `art-cote.js` draws birds, reptiles, turtles, fish and insects in profile (looks `vc-…`, mammals and humans via `art-profil.js`), plus nests. `intro-cote.js` holds their intro and ending. Side-only mission types are `nest`, `feed`, `visit` and `escape`; see `levels/index.js` « LA VUE DE CÔTÉ ».
  - Exception, asked for explicitly: the last level `voie-des-humains` is a 2D map **in 3/4 view** (`world.view: 'tqv'`): the ground is seen from above, and everything standing (people, animals, trees, huts, palisade) is drawn upright and sorted back to front. `tqv.js` holds the one map of the level (the village built in a chapter stays for the next ones), gathering, building sites, fields, raids and the night lights. `art-humains.js` draws the humans, the ice-age animals (through `art-profil.js`), the decor and the buildings (looks `th-…`). `intro-humains.js` holds its intro and ending. Nobody eats here: the currency is 💡 ideas (`world.currency`), and a level's `lines` can replace any of Ammo's lines from `data.js`. 3/4-only mission types are `gather`, `build`, `deliver`, `harvest` and `defend`; see `levels/index.js` « LA VUE DE TROIS QUARTS ».
  - Its sequel, asked for explicitly: level 5 `premieres-villes` (`?debug&niveau=10`) is the same 3/4 engine plus `world.city`, handled by `villes.js` (created inside `tqv.js`, which calls its hooks only when `world.city` exists): the square stone city (walls, gates, houses, market), the river you can only cross on the bridge (`land.riverBlock`), the road built in pieces, four towns (West always friendly, the others drawn at random per game; hostile ones send `fierce` soldiers who steal coins), markets where you sell wheat and wool for coins (`argent`) and friendship, caravans, the yard where you hire workers, the port and its boats, and the monument (pyramid, ziggurat, temple or lighthouse, chosen in a dialog) that rises while there are workers, stone and wood. Drawings are in `art-villes.js` (sprite-cached), intro and tourist ending in `intro-villes.js`. Its mission types are `trade`, `meet`, `friend`, `money`, `choose`, `hire`, `boat` and `monument`; see `levels/index.js` « LES PREMIÈRES VILLES ». The `?debug` autopilot plays it to the end (`tqvBot` routes through gates and the bridge).

## Conventions

- **No assets in the repo for games.** Art is drawn in code (inline SVG strings or `<canvas>` in `art.js`). Sound is synthesized with WebAudio (`sound.js`), with no audio files. Photos/emoji come from external URLs (Wikimedia, Noto Emoji via fonts.gstatic.com). Games that use photos list them in a `credits.html`: add an attribution there when you add a photo.
- **External libs via CDN only**, with pinned versions: d3/topojson (continents), three.js via `importmap` (pin-the-globe), flag-icons CSS, Firebase 12.17.1 from gstatic, Google Fonts (Baloo 2 + Quicksand on most pages).
- **Header comments**: files open with a `// ====…` banner explaining in French what the file does. Match that style and the existing comment density.
- **localStorage**: keys are prefixed with the game slug (`espace-sound`, `la-quete-save-v1`, `royaume-des-mots-v2`…). Every access is wrapped in `try/catch`, because storage can be blocked. Save formats carry a version, so bump the key/version instead of breaking old saves.
- **Internal links point to folders, never to `index.html`**: `jeux/<slug>/`, `../../` (back to home), `./` (from `credits.html`). This matches the canonical URLs and the sitemap.
- **SEO head of a game page**: canonical, `og:*` and description all point to `https://www.la-cabane.app/jeux/<slug>/`. `<title>` puts the search keywords first: `<what people search> – <Game name> | La Cabane à Jeux`. `og:title` stays `<Game name> — La Cabane à Jeux`. The description is ≤ 155 chars and identical to `og:description`. A JSON-LD block (`LearningResource` + a 2-level `BreadcrumbList`) sits just before `<meta name="description">`; copy it from an existing game.
- **Guide « Parents et enseignants »** (SEO text, 150–300 words): every game page ends with `<section class="cab-guide" id="guide">` (level, programme skills, rules, ideas for class/home), styled by `shared/guide.css`. On scrolling pages it sits under the game. On full-screen games (no scroll) it is `class="cab-guide is-overlay" hidden`, opened by a `[data-guide-open]` button on the game's start screen and driven by `shared/guide.js`. Keep the text in sync when a game's rules or content change.
- Favicon: the home page uses `favicon.ico` (64 + 192 px) and `favicon-192.png` (what Google shows in results); game pages use `../../favicon.png`.
- Avoid emojis newer than Unicode 12: Windows 10 shows boxes for 🪙 🪵 🪣 🪶 and similar.

## Leaderboard (Firestore)

- One collection `leaderboard_scores` `{game, name, value, createdAt}`. Firestore rules (in `FIREBASE-SETUP.md`) allow create only, `name` ≤ 20 chars, and `0 < value < 100000`.
- **Smaller `value` = better.** Games where higher is better store an encoded value via `encodeScore`/`decodeScore`, e.g. `MAX_POINTS - pts + 1`, or `(total - pts) * 10000 + time + 1` to break ties on time. Keep values within the rule bounds.
- `game` ids are per game or per mode (`quiz-animaux-36`, `espace-cadet`, `continents-${key}`). Changing an id or the score encoding starts a fresh leaderboard, so do it deliberately (e.g. `course-multiplications-2`).
- Games either import `../../shared/leaderboard.js` statically or lazily with `import(...).catch(() => null)`, so they still work offline or when Firebase fails. Always handle `isLeaderboardConfigured()` being false or an empty result.
- A new Firestore collection needs new rules in `FIREBASE-SETUP.md`, and the site owner must publish them in the Firebase console.
- `messages` (visitor comments and new-game requests) is **private**: create-only for everyone, read/delete only for the admin's Firebase Auth UID. Visitors are children, so never display these messages on the site, and render them with `textContent` only.

## Adding a new game

1. Create `jeux/<slug>/` following an existing game of similar shape (`memory/` is the smallest).
2. Give it the full SEO head (see Conventions), including its own JSON-LD block, and its « Parents et enseignants » guide.
3. On the home page `index.html`: add an `<a class="card" href="jeux/<slug>/">` in the right theme section, add the game to the JSON-LD `ItemList`, and update the game count everywhere it appears (meta/og descriptions, JSON-LD description, `hero-stats`).
4. Add the URL to `sitemap.xml`, and update `<lastmod>` of any page you change.

## Running / testing

There is no build and no test suite. Serve the folder over HTTP, because ES modules don't load from `file://`:

```
python -m http.server 8000   # then open http://localhost:8000/
```

Node is not installed on the dev machine, but Python and Edge are, so verification uses headless Edge. Git stores every file with **LF** endings (`core.autocrlf=true`), but the working copy is mixed: many files are CRLF on disk (e.g. all of `royaume-des-mots/js/`, `style.css`), others LF. Keep each file's existing line endings when editing, and check `git diff --stat` so that no whole file shows as rewritten. A few files start with a UTF-8 BOM (`quiz-animaux/*`, `continents/data.js`, `continents/index.html`); leave them as they are.

## Deployment

Pushing to `main` on GitHub (`origin`) publishes via GitHub Pages to `www.la-cabane.app`. Commits so far are all titled "Initial commit". Don't push unless asked.
