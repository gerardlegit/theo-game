# CLAUDE.md

**La Cabane à Jeux** (https://www.la-cabane.app): a free website of educational games for French-speaking kids. It is a 100% static site: plain HTML/CSS/vanilla JS, with no build step, no package.json and no bundler. It is hosted on GitHub Pages (`CNAME`), and the git root is this `kids-hub/` folder.

## Language

All user-facing text, code comments, project docs (`COMMENT-HEBERGER.md`, `FIREBASE-SETUP.md`) and identifiers like storage keys and game ids are in **French**. Keep it that way, and use proper French typography (`’`, `…`, non-breaking spaces before `!?:` where the surrounding code does). The audience is children, so the tone should be friendly, encouraging and simple.

## Layout

```
index.html, style.css     Home page: hero, theme sections (Lecture, Maths, Nature,
                          Histoire-Géo, Science, Anglais) with game cards, "Jeu épique" block
shared/                   ES modules used by every game
  firebase-config.js      Real Firebase web config (public by design; security = Firestore rules)
  leaderboard.js          fetchTopScores / submitScore / isLeaderboardConfigured
  visits.js               Daily visit counter (home page) + history for admin
admin/index.html          Visit stats; client-side "admin/admin" login (not real security)
jeux/<slug>/              One folder per game, served at /jeux/<slug>/
sitemap.xml, robots.txt   SEO; /admin/ is disallowed
```

Each game is self-contained in `jeux/<slug>/`: `index.html`, `style.css`, `script.js` (entry, `<script type="module">`), plus optional `data.js` (content), `art.js` (drawings), and `sound.js`/`audio.js` (sound effects). Bigger games split further (`royaume-des-mots/js/…` with `content/` per French topic, `livraisons-espace/levels/`).

Cross-game reuse to be aware of:
- `safari-planete/` has **only** an `index.html` and runs `../pin-the-globe/script.js` + `style.css`. `<body data-game="safari">` selects the `GAMES.safari` config in `pin-the-globe/script.js`. Changes to pin-the-globe affect Safari Planète.
- `livraisons-espace/` imports `../espace/art.js`, `../espace/data.js` and `../espace/style.css` (Mission Cosmos). The levels are documented in `livraisons-espace/levels/index.js` ("POUR AJOUTER UN NIVEAU").

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
