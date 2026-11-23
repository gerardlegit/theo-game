// ============================================================================
// Le terrain d'un niveau : une grille de pixels (terre, roche, briques…) que
// les Pompons creusent et construisent, lue depuis le plan en lettres d'un
// niveau (voir levels/index.js), et sa peinture dans une image (texture deux
// fois plus fine que la grille, avec contours, herbe, neige, cailloux).
// ============================================================================

export const TILE = 16;            // une lettre du plan = un cube de 16 × 16 pixels
export const TS = 2;               // la texture est 2 fois plus fine que la grille

/* Ce qu'il y a dans chaque pixel de la grille */
export const VIDE = 0, TERRE = 1, ROCHE = 2, BRIQUE = 3, PLANCHE = 4;
/* Les dangers (on peut passer dedans… mais on est perdu) */
export const EAU = 1, RONCES = 2;

/* Petit hasard qui ne change jamais pour un même pixel */
function hash(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
export { hash };

/* ---------- Lecture du plan ---------- */
export function parseLevel(level) {
  const rows = level.plan;
  const cols = Math.max(...rows.map((r) => r.length));
  const W = cols * TILE;
  const H = rows.length * TILE;
  const ter = new Uint8Array(W * H);
  const haz = new Uint8Array(W * H);
  const water = [];
  const thorns = [];
  let entree = null;
  let sortie = null;

  const fill = (x0, y0, w, h, k, grid = ter) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) grid[y * W + x] = k;
  };

  rows.forEach((row, r) => {
    for (let c = 0; c < cols; c++) {
      const ch = row[c] || ' ';
      const x0 = c * TILE;
      const y0 = r * TILE;
      switch (ch) {
        case '#': fill(x0, y0, TILE, TILE, TERRE); break;
        case 'R': fill(x0, y0, TILE, TILE, ROCHE); break;
        case '/':
          for (let dy = 0; dy < TILE; dy++) for (let dx = 0; dx < TILE; dx++) {
            if (dy >= TILE - 1 - dx) ter[(y0 + dy) * W + x0 + dx] = TERRE;
          }
          break;
        case '\\':
          for (let dy = 0; dy < TILE; dy++) for (let dx = 0; dx < TILE; dx++) {
            if (dy >= dx) ter[(y0 + dy) * W + x0 + dx] = TERRE;
          }
          break;
        case '=': fill(x0, y0, TILE, 4, PLANCHE); break;
        case '~': fill(x0, y0, TILE, TILE, EAU, haz); water.push({ c, r }); break;
        case '^': fill(x0, y0 + 6, TILE, TILE - 6, RONCES, haz); thorns.push({ c, r }); break;
        case 'E': entree = { x: x0 + TILE / 2, y: y0 + TILE / 2 }; break;
        case 'S': sortie = { x: x0 + TILE / 2, y: y0 + TILE }; break;
        default: break;
      }
    }
  });
  /* l'eau du dessus d'une colonne d'eau fait des vagues */
  const isWater = (c, r) => r >= 0 && (rows[r] || '')[c] === '~';
  water.forEach((w) => { w.top = !isWater(w.c, w.r - 1); });

  return { W, H, cols, rowsN: rows.length, ter, haz, water, thorns, entree, sortie };
}

/* ---------- Questions sur la grille ---------- */
export function makeQueries(T) {
  const { W, H, ter, haz } = T;
  /* les bords gauche et droit du monde sont des murs ; en bas, c'est le vide */
  const solid = (x, y) => {
    if (x < 0 || x >= W) return true;
    if (y < 0 || y >= H) return false;
    return ter[y * W + x] !== VIDE;
  };
  const kind = (x, y) => (x < 0 || x >= W || y < 0 || y >= H ? VIDE : ter[y * W + x]);
  const danger = (x, y) => (x < 0 || x >= W || y < 0 || y >= H ? 0 : haz[y * W + x]);
  return { solid, kind, danger };
}

/* ---------- La peinture du terrain ---------- */
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export function createTerrainPainter(T, theme, seed = 1) {
  const { W, H, ter, haz } = T;
  const cv = document.createElement('canvas');
  cv.width = W * TS;
  cv.height = H * TS;
  const g = cv.getContext('2d');
  const P = {
    terre: hex(theme.terre),
    terreFonce: hex(theme.terreFonce),
    caillou: hex(theme.caillou),
    herbe: theme.herbe ? hex(theme.herbe) : null,
    herbeClaire: theme.herbeClaire ? hex(theme.herbeClaire) : null,
    roche: hex(theme.roche),
    rocheFonce: hex(theme.rocheFonce),
    brique: hex('#EDA65A'),
    briqueFonce: hex('#B86E2F'),
    planche: hex('#C98A4B'),
    plancheFonce: hex('#8E5A2B'),
    contour: hex(theme.contour || '#3A2618'),
  };
  const at = (x, y) => (x < 0 || x >= W || y < 0 || y >= H ? (x < 0 || x >= W ? 1 : 0) : ter[y * W + x]);

  function colorOf(x, y, k) {
    const n = hash(x, y, seed) - 0.5;
    if (k === TERRE) {
      let up = 0;
      while (up < 9 && at(x, y - up - 1) !== VIDE) up++;
      if (P.herbe && up < 4 && at(x, y - up - 1) === VIDE && y - up - 1 >= 0 && haz[(y - up - 1) * W + x] !== 1) {
        const c = up === 0 ? P.herbeClaire : P.herbe;
        return mix(c, [0, 0, 0], 0.04 + n * 0.08 + (up === 3 ? 0.12 : 0));
      }
      /* les cailloux : de petits ronds sur une grille de 7 pixels */
      const cx = Math.floor(x / 7);
      const cy = Math.floor(y / 7);
      const hp = hash(cx, cy, seed + 7);
      if (hp < 0.22) {
        const px = cx * 7 + 1 + Math.floor(hash(cx, cy, seed + 8) * 5);
        const py = cy * 7 + 1 + Math.floor(hash(cx, cy, seed + 9) * 5);
        const d = (x - px) * (x - px) + (y - py) * (y - py);
        if (d <= (hp < 0.07 ? 3 : 1)) return mix(P.caillou, [255, 255, 255], d === 0 ? 0.25 : 0);
      }
      const shade = up < 6 && P.herbe ? 0.18 : 0;
      /* de douces couches de terre, comme dans une vraie falaise */
      const band = Math.floor((y + Math.sin(x * 0.045 + seed) * 5) / 34) % 3;
      const strata = band === 1 ? 0.14 : band === 2 ? -0.06 : 0;
      return mix(mix(P.terre, P.terreFonce, Math.min(1, Math.max(0, shade + strata + (hash(cx, cy, seed + 3) - 0.5) * 0.3 + 0.15))), [0, 0, 0], n * 0.1);
    }
    if (k === ROCHE) {
      const row = Math.floor(y / 9);
      const off = (row % 2) * 7;
      const sx = (x + off) % 14;
      const sy = y % 9;
      if (sx === 0 || sy === 0) return P.rocheFonce;
      const v = hash(Math.floor((x + off) / 14), row, seed + 5) - 0.5;
      const base = mix(P.roche, [255, 255, 255], sy === 1 || sx === 1 ? 0.22 : 0);
      return mix(base, [0, 0, 0], v * 0.25 + n * 0.06);
    }
    if (k === BRIQUE) {
      const top = at(x, y - 1) !== BRIQUE;
      return mix(top ? mix(P.brique, [255, 255, 255], 0.2) : P.brique, P.briqueFonce, (hash(Math.floor(x / 6), Math.floor(y / 2), 11) * 0.4) + n * 0.1);
    }
    if (k === PLANCHE) {
      const grain = (y % 4 === 0) ? 0.25 : 0;
      return mix(P.planche, P.plancheFonce, grain + n * 0.2 + (x % 23 === 0 ? 0.5 : 0));
    }
    return P.terre;
  }

  /* repeint le rectangle [x0, x1[ × [y0, y1[ de la grille */
  function paint(x0, y0, x1, y1) {
    x0 = Math.max(0, x0 | 0); y0 = Math.max(0, y0 | 0);
    x1 = Math.min(W, Math.ceil(x1)); y1 = Math.min(H, Math.ceil(y1));
    const w = x1 - x0;
    const h = y1 - y0;
    if (w <= 0 || h <= 0) return;
    const img = g.createImageData(w * TS, h * TS);
    const d = img.data;
    const tw = w * TS;
    const put = (px, py, col, a = 255) => {
      const i = (py * tw + px) * 4;
      d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = a;
    };
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const k = ter[y * W + x];
        if (!k) continue;
        const col = colorOf(x, y, k);
        const tx = (x - x0) * TS;
        const ty = (y - y0) * TS;
        put(tx, ty, col); put(tx + 1, ty, col); put(tx, ty + 1, col); put(tx + 1, ty + 1, col);
        /* contour foncé sur les bords qui touchent le vide */
        const eu = at(x, y - 1) === VIDE && y > 0;
        const ed = at(x, y + 1) === VIDE && y < H - 1;
        const el = at(x - 1, y) === VIDE;
        const er = at(x + 1, y) === VIDE;
        if (eu || ed || el || er) {
          const ct = P.contour;
          if (eu) { put(tx, ty, ct); put(tx + 1, ty, ct); }
          if (ed) { put(tx, ty + 1, ct); put(tx + 1, ty + 1, ct); }
          if (el) { put(tx, ty, ct); put(tx, ty + 1, ct); }
          if (er) { put(tx + 1, ty, ct); put(tx + 1, ty + 1, ct); }
        }
      }
    }
    g.putImageData(img, x0 * TS, y0 * TS);
  }
  paint(0, 0, W, H);

  /* le fond de la terre : tout ce qui est sous la surface de départ (grottes,
     trous creusés) a une paroi sombre derrière, à moitié transparente */
  const back = document.createElement('canvas');
  back.width = W;
  back.height = H;
  const bg = back.getContext('2d');
  const bimg = bg.createImageData(W, H);
  const bd = bimg.data;
  const wall = mix(P.terreFonce, [20, 16, 30], theme.fond === 'grotte' ? 0.45 : 0.35);
  for (let x = 0; x < W; x++) {
    let top = 0;
    while (top < H && ter[top * W + x] === VIDE) top++;
    for (let y = top; y < H; y++) {
      const n = hash(x >> 1, y >> 1, seed + 21) - 0.5;
      const big = Math.sin(x * 0.07 + y * 0.03) * Math.sin(y * 0.09 - x * 0.02);
      const col = mix(wall, [0, 0, 0], n * 0.08 + big * 0.1 + Math.min(0.25, (y - top) / 400));
      const i = (y * W + x) * 4;
      bd[i] = col[0]; bd[i + 1] = col[1]; bd[i + 2] = col[2]; bd[i + 3] = 215;
    }
  }
  bg.putImageData(bimg, 0, 0);
  /* sous le monde : la terre continue (là où la dernière rangée est pleine) */
  const bottomRuns = [];
  let run = -1;
  for (let x = 0; x <= W; x++) {
    const full = x < W && (ter[(H - 1) * W + x] !== VIDE || haz[(H - 1) * W + x] === 1);
    if (full && run < 0) run = x;
    if (!full && run >= 0) { bottomRuns.push([run, x]); run = -1; }
  }
  const deep = mix(P.terreFonce, [0, 0, 0], 0.2);
  return { canvas: cv, paint, back, bottomRuns, deep: `rgb(${deep.map(Math.round).join(',')})` };
}
