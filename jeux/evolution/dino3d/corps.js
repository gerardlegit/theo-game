// ============================================================================
// Évolution 3D — les corps. Chaque animal est construit ici, sans aucun fichier
// 3D : une colonne (de la queue au museau) entourée d'anneaux, des pattes, des
// dents, des yeux, le tout attaché à un vrai squelette animé. Les pieds se
// posent au sol (cinématique inverse) : rien ne glisse, dans aucune direction.
//
// Repère d'un animal : x = vers l'avant, y = vers le haut, z = sur le côté.
// Les mesures sont en mètres, l'origine est au sol, sous les hanches.
// ============================================================================

import * as THREE from 'three';

const TAU = Math.PI * 2;
const lerp = (a, b, k) => a + (b - a) * k;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (k) => k * k * (3 - 2 * k);

/** Bruit pseudo-aléatoire, stable pour un même point (taches sur la peau) */
function hash(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/* ---------- Un assemblage de sommets colorés, liés aux os ---------- */
class Geo {
  constructor() { this.pos = []; this.col = []; this.si = []; this.sw = []; this.idx = []; }

  vert(x, y, z, c, bones) {
    const i = this.pos.length / 3;
    this.pos.push(x, y, z);
    this.col.push(c.r, c.g, c.b);
    const b = [...bones];
    while (b.length < 4) b.push([0, 0]);
    this.si.push(b[0][0], b[1][0], b[2][0], b[3][0]);
    this.sw.push(b[0][1], b[1][1], b[2][1], b[3][1]);
    return i;
  }

  /** Une suite d'anneaux reliés : { c: centre, up, side, rx, ry, bones, color(sin, cos) } */
  loft(rings, sides = 12) {
    const first = this.pos.length / 3;
    for (const r of rings) {
      for (let k = 0; k < sides; k++) {
        const a = (k / sides) * TAU, co = Math.cos(a), si = Math.sin(a);
        const px = r.c[0] + r.side[0] * r.rx * co + r.up[0] * r.ry * si;
        const py = r.c[1] + r.side[1] * r.rx * co + r.up[1] * r.ry * si;
        const pz = r.c[2] + r.side[2] * r.rx * co + r.up[2] * r.ry * si;
        this.vert(px, py, pz, r.color(si, co), r.bones);
      }
    }
    const at = (i, k) => first + i * sides + ((k + sides) % sides);
    for (let i = 0; i < rings.length - 1; i++) {
      for (let k = 0; k < sides; k++) {
        this.idx.push(at(i, k), at(i + 1, k), at(i, k + 1));
        this.idx.push(at(i, k + 1), at(i + 1, k), at(i + 1, k + 1));
      }
    }
    // on ferme les deux bouts
    for (const [i, flip] of [[0, true], [rings.length - 1, false]]) {
      const r = rings[i];
      const c = this.vert(r.c[0], r.c[1], r.c[2], r.color(0, 0), r.bones);
      for (let k = 0; k < sides; k++) {
        if (flip) this.idx.push(c, at(i, k), at(i, k + 1));
        else this.idx.push(c, at(i, k + 1), at(i, k));
      }
    }
  }

  /** Une boule (un œil, une articulation), liée à un seul os */
  ball(c, r, col, bone, lat = 6, lon = 8) {
    const [rx, ry, rz] = Array.isArray(r) ? r : [r, r, r];
    const first = this.pos.length / 3;
    for (let i = 0; i <= lat; i++) {
      const v = (i / lat) * Math.PI;
      for (let k = 0; k < lon; k++) {
        const u = (k / lon) * TAU;
        this.vert(c[0] + rx * Math.sin(v) * Math.cos(u), c[1] + ry * Math.cos(v), c[2] + rz * Math.sin(v) * Math.sin(u), col, [[bone, 1]]);
      }
    }
    const at = (i, k) => first + i * lon + ((k + lon) % lon);
    for (let i = 0; i < lat; i++) {
      for (let k = 0; k < lon; k++) {
        this.idx.push(at(i, k), at(i, k + 1), at(i + 1, k));
        this.idx.push(at(i, k + 1), at(i + 1, k + 1), at(i + 1, k));
      }
    }
  }

  /** Une corne, une griffe, une dent : un cône de la base à la pointe */
  cone(base, tip, r, col, bone, sides = 6, tipBone = null) {
    const d = [tip[0] - base[0], tip[1] - base[1], tip[2] - base[2]];
    const n = Math.hypot(d[0], d[1], d[2]) || 1;
    const f = [d[0] / n, d[1] / n, d[2] / n];
    const ref = Math.abs(f[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const s = norm(cross(f, ref)), u = cross(s, f);
    const first = this.pos.length / 3;
    for (let k = 0; k < sides; k++) {
      const a = (k / sides) * TAU, co = Math.cos(a) * r, si = Math.sin(a) * r;
      this.vert(base[0] + s[0] * co + u[0] * si, base[1] + s[1] * co + u[1] * si, base[2] + s[2] * co + u[2] * si, col, [[bone, 1]]);
    }
    const t = this.vert(tip[0], tip[1], tip[2], col, [[tipBone ?? bone, 1]]);
    for (let k = 0; k < sides; k++) this.idx.push(first + k, t, first + (k + 1) % sides);
  }

  /** Une surface plate, vue des deux côtés (voile, plaque, aile, collerette) */
  flat(pts, col, boneOf) {
    for (const side of [1, -1]) {
      const first = this.pos.length / 3;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const b = boneOf(p, i);
        this.vert(p[0], p[1], p[2], Array.isArray(col) ? col[i] : col, Array.isArray(b[0]) ? b : [[b[0], 1]]);
      }
      for (let i = 1; i < pts.length - 1; i++) {
        if (side > 0) this.idx.push(first, first + i, first + i + 1);
        else this.idx.push(first, first + i + 1, first + i);
      }
    }
  }

  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(this.si, 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(this.sw, 4));
    g.setIndex(this.idx);
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return g;
  }
}

const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
function norm(a) { const n = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / n, a[1] / n, a[2] / n]; }

/* ---------- La peau ---------- */
function skin(s) {
  const c = {
    top: new THREE.Color(s.top),
    side: new THREE.Color(s.side || s.top),
    belly: new THREE.Color(s.belly || '#E8D9B0'),
    mark: new THREE.Color(s.mark || s.top),
    horn: new THREE.Color(s.horn || '#F0E6CC'),
    mouth: new THREE.Color('#5A1F24'),
    claw: new THREE.Color(s.claw || '#2B2420'),
    sail: new THREE.Color(s.sail || s.mark || s.top),
    white: new THREE.Color('#FFFFFF'),
    iris: new THREE.Color(s.iris || '#E8A33A'),
    black: new THREE.Color('#0E0B0A'),
  };
  return c;
}

/** La couleur d'un point de la peau : dos sombre, ventre clair, rayures ou taches */
function skinColor(C, o, x, si, co, region) {
  const col = new THREE.Color();
  const k = smooth(clamp((si + 0.55) / 0.95, 0, 1));
  col.copy(C.belly).lerp(C.side, k);
  if (si > 0.35) col.lerp(C.top, smooth((si - 0.35) / 0.65));
  if (region !== 'tete' || o.markHead) {
    if (o.stripes && si > -0.15) {
      const w = Math.sin(x * o.stripes + Math.abs(co) * 0.8);
      if (w > 0.35) col.lerp(C.mark, 0.85);
    }
    if (o.spots && si > -0.3) {
      const cell = hash(Math.floor(x * o.spots), Math.floor((si + co * 0.6) * 3.2));
      if (cell > 0.68) col.lerp(C.mark, 0.8);
    }
    if (o.dorsal && si > 0.82) col.lerp(C.mark, 0.8);
  }
  return col;
}

/* ---------- Les os ---------- */
class Rig {
  constructor() { this.bones = []; this.byName = {}; }
  add(name, parent, x, y, z = 0) {
    const i = this.bones.length;
    this.bones.push({ name, parent: parent === null ? -1 : this.byName[parent], x, y, z });
    this.byName[name] = i;
    return i;
  }
}

/* ---------- La colonne : de la queue au museau ---------- */
function catmull(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

function buildSpine(geo, rig, C, o, pts) {
  // les os posés sur la colonne, à l'endroit indiqué
  const tagged = pts.map((p, i) => ({ i, bone: p.bone })).filter((p) => p.bone);
  const boneAt = (t) => {
    let a = tagged[0], b = tagged[tagged.length - 1];
    if (t <= a.i) return [[rig.byName[a.bone], 1]];
    if (t >= b.i) return [[rig.byName[b.bone], 1]];
    for (let k = 0; k < tagged.length - 1; k++) {
      if (t >= tagged[k].i && t <= tagged[k + 1].i) { a = tagged[k]; b = tagged[k + 1]; break; }
    }
    const w = smooth((t - a.i) / (b.i - a.i));
    return [[rig.byName[a.bone], 1 - w], [rig.byName[b.bone], w]];
  };
  const rings = [];
  const sub = 3;
  const at = (i) => pts[clamp(i, 0, pts.length - 1)];
  for (let i = 0; i < pts.length - 1; i++) {
    for (let s = 0; s < sub + (i === pts.length - 2 ? 1 : 0); s++) {
      const u = s / sub;
      const cr = (key) => catmull(at(i - 1)[key], at(i)[key], at(i + 1)[key], at(i + 2)[key], u);
      const x = cr('x'), y = cr('y');
      const rx = Math.max(0.002, cr('w')), ry = Math.max(0.002, cr('h'));
      const dx = lerp(at(i + 1).x - at(i - 1).x, at(i + 2).x - at(i).x, u);
      const dy = lerp(at(i + 1).y - at(i - 1).y, at(i + 2).y - at(i).y, u);
      const n = Math.hypot(dx, dy) || 1;
      const up = [-dy / n, dx / n, 0];
      const region = (pts[i].head || pts[i + 1].head) ? 'tete' : 'corps';
      const mouthLine = !!pts[i].head && !!pts[i + 1].head;
      rings.push({
        c: [x, y, 0], up, side: [0, 0, 1], rx, ry, bones: boneAt(i + u),
        color: (si, co) => {
          if (mouthLine && si < -0.72) return C.mouth;
          return skinColor(C, o, x, si, co, region);
        },
      });
    }
  }
  geo.loft(rings, o.sides || 12);
}

/* ---------- Une patte : des tubes droits vers le bas, que le squelette pliera ---------- */
function buildLeg(geo, rig, C, o, L, name, parent, side) {
  const [l1, l2, l3] = L.lens;
  const [w1, w2, w3] = L.w;
  const z = L.z * side;
  const hip = rig.add(`${name}0`, parent, L.x, L.y, z);
  const knee = rig.add(`${name}1`, `${name}0`, L.x, L.y - l1, z);
  const ankle = rig.add(`${name}2`, `${name}1`, L.x, L.y - l1 - l2, z);
  const foot = rig.add(`${name}3`, `${name}2`, L.x, L.y - l1 - l2 - l3, z);
  const y0 = L.y;
  const rings = [];
  const shape = [
    [0, w1 * 0.8, hip, hip, 0],
    [l1 * 0.3, w1, hip, hip, 0],
    [l1 * 0.75, lerp(w1, w2, 0.45), hip, hip, 0],
    [l1, lerp(w1, w2, 0.7), hip, knee, 0.5],
    [l1 + l2 * 0.25, w2, knee, knee, 0],
    [l1 + l2 * 0.8, lerp(w2, w3, 0.5), knee, knee, 0],
    [l1 + l2, w3 * 1.08, knee, ankle, 0.5],
    [l1 + l2 + l3 * 0.5, w3, ankle, ankle, 0],
    [l1 + l2 + l3, w3 * 0.9, ankle, foot, 0.6],
  ];
  for (const [d, w, a, b, k] of shape) {
    rings.push({
      c: [L.x, y0 - d, z], up: [1, 0, 0], side: [0, 0, 1], rx: w * 0.92, ry: w,
      bones: k ? [[a, 1 - k], [b, k]] : [[a, 1]],
      color: (si, co) => (d > l1 + l2 * 0.5 ? skinColor(C, o, L.x, co * 0.2 - 0.05, co, 'tete') : skinColor(C, o, L.x + d * 0.3, co * 0.5 + 0.1, si, 'corps')),
    });
  }
  geo.loft(rings, 8);
  // le pied, à plat vers l'avant, et ses griffes
  const fy = y0 - l1 - l2 - l3;
  const fl = L.foot.L, fw = L.foot.W;
  const toes = L.foot.toes;
  const footCol = skinColor(C, o, L.x, -0.1, 0, 'tete');
  for (let t = 0; t < toes; t++) {
    const off = toes === 1 ? 0 : (t / (toes - 1) - 0.5) * 2;
    const spread = off * fw;
    const len = fl * (1 - Math.abs(off) * 0.22);
    const bx = L.x, tx = L.x + len;
    geo.loft([
      { c: [bx - fl * 0.12, fy + w3 * 0.45, z + spread * 0.5], up: [0, 1, 0], side: [0, 0, 1], rx: w3 * 0.72, ry: w3 * 0.55, bones: [[foot, 1]], color: () => footCol },
      { c: [lerp(bx, tx, 0.6), fy + w3 * 0.32, z + spread * 0.85], up: [0, 1, 0], side: [0, 0, 1], rx: w3 * 0.5, ry: w3 * 0.35, bones: [[foot, 1]], color: () => footCol },
      { c: [tx, fy + w3 * 0.16, z + spread], up: [0, 1, 0], side: [0, 0, 1], rx: w3 * 0.3, ry: w3 * 0.2, bones: [[foot, 1]], color: () => footCol },
    ], 6);
    if (L.foot.claw) geo.cone([tx - w3 * 0.1, fy + w3 * 0.14, z + spread], [tx + L.foot.claw, fy, z + spread * 1.05], w3 * 0.2, C.claw, foot, 5);
  }
  return { name, side, joints: [hip, knee, ankle, foot], lens: L.lens, y: L.y, x: L.x, z, meta: L.meta ?? 0.4, back: !!L.back, phase: L.phase, splay: L.splay || 0 };
}

/* ---------- La tête : les yeux, les dents, la mâchoire du bas ---------- */
function buildHead(geo, rig, C, o, H) {
  const head = rig.byName.head;
  const jaw = rig.add('jaw', 'head', H.x + H.l * 0.08, H.y - H.h * 0.22, 0);
  const jx = H.x + H.l * 0.08, jy = H.y - H.h * 0.22;
  const jawL = H.l * (H.jaw || 0.86);
  const jw = H.w * 0.8;
  const jh = H.h * 0.17 * (H.jawH || 1);
  const jc = (si, co) => (si > 0.45 ? C.mouth : skinColor(C, o, jx, si * 0.7 - 0.5, co, 'tete'));
  const jr = (k, w, h, drop = 0) => ({ c: [jx + jawL * k, jy - drop, 0], up: [0, 1, 0], side: [0, 0, 1], rx: w, ry: h, bones: [[jaw, 1]], color: jc });
  geo.loft([jr(-0.08, jw * 0.8, jh), jr(0.2, jw, jh * 1.1, jh * 0.2), jr(0.55, jw * 0.82, jh, jh * 0.3), jr(0.85, jw * 0.55, jh * 0.8, jh * 0.2), jr(1, jw * 0.3, jh * 0.45, 0)], 8);
  // les yeux
  const er = H.eye * (o.cute ? 1.25 : 1);
  const ex = H.x + H.l * H.eyeX, ey = H.y + H.h * H.eyeY, ez = H.w * H.eyeZ;
  for (const s of [1, -1]) {
    geo.ball([ex, ey, ez * s], er, C.white, head, 6, 8);
    geo.ball([ex + er * 0.45, ey + er * 0.02, (ez + er * 0.5) * s], er * 0.62, C.iris, head, 5, 7);
    geo.ball([ex + er * 0.68, ey + er * 0.02, (ez + er * 0.72) * s], er * 0.36, C.black, head, 4, 6);
    geo.ball([ex + er * 0.82, ey + er * 0.3, (ez + er * 0.72) * s], er * 0.13, C.white, head, 3, 5);
    // le sourcil : c'est lui qui rend le regard méchant
    if (o.brow) geo.cone([ex - er * 1.2, ey + er * 1.05, (ez + er * 0.15) * s], [ex + er * 1.5, ey + er * 0.62, (ez + er * 0.1) * s], er * 0.46, C.side.clone().multiplyScalar(0.72), head, 5);
  }
  // les narines
  if (o.nostril !== false) {
    for (const s of [1, -1]) geo.ball([H.x + H.l * 0.9, H.y + H.h * 0.02, H.w * 0.24 * s], H.h * 0.04, C.black, head, 3, 5);
  }
  // les dents
  if (H.teeth) {
    const n = H.teeth;
    const tl = H.toothL || H.h * 0.13;
    for (const s of [1, -1]) {
      for (let i = 0; i < n; i++) {
        const k = (i + 0.5) / n;
        const x = H.x + H.l * lerp(0.28, 0.95, k);
        const zw = H.w * lerp(0.62, 0.2, k) * s;
        const y = H.y - H.h * lerp(0.22, 0.26, k);
        const size = tl * (0.75 + Math.sin(k * Math.PI) * 0.45);
        geo.cone([x, y + size * 0.3, zw], [x, y - size, zw], size * 0.3, C.white, head, 4);
        const jk = lerp(0.3, 0.92, k);
        geo.cone([jx + jawL * jk, jy + jh * 0.3, H.w * lerp(0.58, 0.16, k) * s], [jx + jawL * jk, jy + jh * 0.3 + size * 0.78, H.w * lerp(0.58, 0.16, k) * s], size * 0.26, C.white, jaw, 4);
      }
    }
  }
  // un bec (herbivores)
  if (H.beak) {
    geo.cone([H.x + H.l * 0.78, H.y - H.h * 0.14, 0], [H.x + H.l * 1.1, H.y - H.h * 0.26, 0], H.w * 0.34, new THREE.Color(H.beak), head, 7);
    geo.cone([jx + jawL * 0.78, jy, 0], [jx + jawL * 1.05, jy + jh * 0.2, 0], jw * 0.32, new THREE.Color(H.beak), jaw, 7);
  }
}

/* ---------- Ce qui rend chaque espèce reconnaissable ---------- */
function buildExtras(geo, rig, C, o, H, pts) {
  const b = rig.byName;
  const top = (x) => {
    for (let i = 0; i < pts.length - 1; i++) {
      if (x >= pts[i].x && x <= pts[i + 1].x) {
        const k = (x - pts[i].x) / (pts[i + 1].x - pts[i].x || 1);
        return { y: lerp(pts[i].y, pts[i + 1].y, k), h: lerp(pts[i].h, pts[i + 1].h, k), w: lerp(pts[i].w, pts[i + 1].w, k), bone: pts[i].bone || pts[i + 1].bone };
      }
    }
    return null;
  };
  const near = (x) => {
    let best = b.hip, bd = Infinity;
    for (const p of pts) {
      if (!p.bone) continue;
      const d = Math.abs(p.x - x);
      if (d < bd) { bd = d; best = b[p.bone]; }
    }
    return best;
  };
  // la voile (Dimetrodon, Spinosaurus)
  if (o.sail) {
    const { from, to, h } = o.sail;
    const n = 9;
    const line = [];
    for (let i = 0; i <= n; i++) {
      const x = lerp(from, to, i / n), T = top(x);
      if (T) line.push({ x, y: T.y + T.h * 0.85, hh: h * Math.sin((i / n) * Math.PI) ** 0.7 });
    }
    for (let i = 0; i < line.length - 1; i++) {
      const a = line[i], c = line[i + 1];
      const bone = near((a.x + c.x) / 2);
      const col = C.sail.clone().lerp(C.white, i % 2 ? 0 : 0.14);
      geo.flat([[a.x, a.y, 0], [c.x, c.y, 0], [c.x, c.y + c.hh, 0], [a.x, a.y + a.hh, 0]], col, () => [bone]);
    }
  }
  // les plaques du dos (Stegosaurus) et les piquants de la queue
  if (o.plates) {
    const { from, to, n, h } = o.plates;
    for (let i = 0; i < n; i++) {
      const k = (i + 0.5) / n;
      const x = lerp(from, to, k);
      const T = top(x);
      if (!T) continue;
      const pl = h * (0.55 + Math.sin(k * Math.PI) * 0.6);
      const y0 = T.y + T.h * 0.8;
      const w = pl * 0.62;
      const bone = near(x);
      const z = (i % 2 ? 1 : -1) * T.w * 0.08;
      geo.flat([[x - w, y0, z], [x + w, y0, z], [x + w * 0.2, y0 + pl, z * 2.5], [x - w * 0.3, y0 + pl * 0.9, z * 2.5]], [C.sail, C.sail, C.mark, C.mark], () => [bone]);
    }
  }
  if (o.spikes) {
    const last = rig.byName[o.spikes.bone];
    for (const [dx, zz, yy] of [[0, 1, 0.5], [0, -1, 0.5], [o.spikes.L * 0.55, 1, 0.65], [o.spikes.L * 0.55, -1, 0.65]]) {
      const B = rig.bones[last];
      geo.cone([B.x + dx, B.y, 0], [B.x + dx - o.spikes.L * 0.3, B.y + o.spikes.L * yy, zz * o.spikes.L], o.spikes.L * 0.11, C.horn, last, 6);
    }
  }
  // les rangées de pointes et l'armure (Ankylosaurus)
  if (o.armor) {
    const { from, to, n, h } = o.armor;
    for (let i = 0; i < n; i++) {
      const x = lerp(from, to, (i + 0.5) / n), T = top(x);
      if (!T) continue;
      const bone = near(x);
      for (const a of [0.25, 0.8, 1.3]) {
        for (const s of [1, -1]) {
          const y = T.y + Math.sin(a) * T.h * 0.95, z = Math.cos(a) * T.w * 0.95 * s;
          geo.cone([x, y, z], [x, y + Math.sin(a) * h, z + Math.cos(a) * h * s], h * 0.42, C.horn, bone, 5);
        }
      }
    }
  }
  if (o.club) {
    const B = rig.bones[rig.byName[o.club.bone]];
    geo.ball([B.x - o.club.back, B.y, 0], [o.club.r * 1.15, o.club.r * 0.8, o.club.r], C.horn, rig.byName[o.club.bone], 5, 7);
  }
  if (o.back) {
    // une crête de petites écailles le long du dos
    const { from, to, n, h } = o.back;
    for (let i = 0; i < n; i++) {
      const x = lerp(from, to, (i + 0.5) / n), T = top(x);
      if (!T) continue;
      geo.cone([x, T.y + T.h * 0.82, 0], [x - h * 0.3, T.y + T.h * 0.82 + h, 0], h * 0.55, C.mark, near(x), 4);
    }
  }
  if (!H) return;
  const head = rig.byName.head;
  // la collerette et les cornes (Triceratops)
  if (H.frill) {
    const F = H.frill;
    const n = 10, ring = [];
    for (let i = 0; i <= n; i++) {
      const a = -1.45 + (i / n) * 2.9;
      ring.push([H.x - F.back * Math.cos(a) * 0.65 + F.r * 0.05, H.y + H.h * 0.1 + Math.cos(a) * F.r * 0.82, Math.sin(a) * F.r]);
    }
    const center = [H.x + H.l * 0.05, H.y + H.h * 0.05, 0];
    for (let i = 0; i < n; i++) {
      geo.flat([center, ring[i], ring[i + 1]], [C.mark, C.sail, C.sail], () => [head]);
      geo.ball(ring[i], F.r * 0.075, C.horn, head, 3, 5);
    }
  }
  for (const h of H.horns || []) {
    const bx = H.x + H.l * h.at, by = H.y + H.h * h.up;
    for (const s of h.z ? [1, -1] : [0]) {
      geo.cone([bx, by, H.w * (h.z || 0) * s], [bx + h.L * h.fwd, by + h.L * h.rise, (H.w * (h.z || 0) + h.L * (h.out || 0)) * s], h.r, C.horn, head, 7);
    }
  }
  if (H.dome) geo.ball([H.x + H.l * 0.14, H.y + H.h * 0.42, 0], [H.l * 0.36, H.h * 0.55, H.w * 0.78], skinColor(C, o, 0, 0.9, 0, 'tete'), head, 6, 9);
  if (H.crest) {
    const c = H.crest;
    geo.flat([[H.x + H.l * c.from, H.y + H.h * 0.42, 0], [H.x + H.l * c.to, H.y + H.h * 0.42, 0], [H.x + H.l * c.tipX, H.y + H.h * 0.42 + c.h, 0]], C.sail, () => [head]);
  }
  if (H.tube) {
    // la crête en tube (Parasaurolophus)
    geo.cone([H.x + H.l * 0.25, H.y + H.h * 0.4, 0], [H.x - H.tube, H.y + H.h * 0.9 + H.tube * 0.3, 0], H.h * 0.18, C.sail, head, 7);
  }
  if (H.brows) {
    // les petites cornes au-dessus des yeux (Allosaurus)
    for (const s of [1, -1]) geo.cone([H.x + H.l * 0.28, H.y + H.h * 0.38, H.w * 0.5 * s], [H.x + H.l * 0.24, H.y + H.h * 0.38 + H.brows, H.w * 0.55 * s], H.brows * 0.55, C.mark, head, 5);
  }
}

/* ---------- Le plan d'un animal → sa géométrie, ses os ---------- */
/**
 * o : { top, side, belly, mark, iris…  (couleurs)
 *       spine : [{ x, y, w, h, bone?, head? }…] de la queue au museau
 *       head : { x, y, l, h, w, eye, eyeX, eyeY, eyeZ, teeth, beak, horns, frill… }
 *       hind / fore : [leg] ; arms ; bones : la chaîne (noms des os posés sur la colonne) }
 */
export function buildPlan(o) {
  const C = skin(o);
  const rig = new Rig();
  const geo = new Geo();
  const pts = o.spine;
  // la chaîne : des hanches vers la queue, des hanches vers la tête
  const hipI = pts.findIndex((p) => p.bone === 'hip');
  rig.add('hip', null, pts[hipI].x, pts[hipI].y);
  let parent = 'hip';
  const tails = [];
  for (let i = hipI - 1; i >= 0; i--) {
    if (!pts[i].bone) continue;
    rig.add(pts[i].bone, parent, pts[i].x, pts[i].y);
    tails.push(rig.byName[pts[i].bone]);
    parent = pts[i].bone;
  }
  parent = 'hip';
  const fronts = [];
  for (let i = hipI + 1; i < pts.length; i++) {
    if (!pts[i].bone) continue;
    rig.add(pts[i].bone, parent, pts[i].x, pts[i].y);
    fronts.push({ i: rig.byName[pts[i].bone], name: pts[i].bone });
    parent = pts[i].bone;
  }
  buildSpine(geo, rig, C, o, pts);
  if (o.head) buildHead(geo, rig, C, o, o.head);
  buildExtras(geo, rig, C, o, o.head, pts);
  // les pattes
  const legs = [];
  (o.hind || []).forEach((L) => { legs.push(buildLeg(geo, rig, C, o, L, `hind${L.key || ''}${L.side > 0 ? 'D' : 'G'}`, 'hip', L.side)); });
  (o.fore || []).forEach((L) => { legs.push(buildLeg(geo, rig, C, o, L, `fore${L.key || ''}${L.side > 0 ? 'D' : 'G'}`, L.parent || 'chest', L.side)); });
  // les petits bras (ils ne touchent pas le sol)
  const arms = [];
  for (const s of (o.arms ? [1, -1] : [])) {
    const A = o.arms;
    const nm = `arm${s > 0 ? 'D' : 'G'}`;
    const a0 = rig.add(`${nm}0`, 'chest', A.x, A.y, A.z * s);
    const a1 = rig.add(`${nm}1`, `${nm}0`, A.x, A.y - A.l1, A.z * s);
    const col = (si, co) => skinColor(C, o, A.x, co * 0.4, si, 'tete');
    geo.loft([
      { c: [A.x, A.y + A.w * 0.3, A.z * s], up: [1, 0, 0], side: [0, 0, 1], rx: A.w, ry: A.w, bones: [[a0, 1]], color: col },
      { c: [A.x, A.y - A.l1, A.z * s], up: [1, 0, 0], side: [0, 0, 1], rx: A.w * 0.72, ry: A.w * 0.72, bones: [[a0, 0.5], [a1, 0.5]], color: col },
      { c: [A.x, A.y - A.l1 - A.l2, A.z * s], up: [1, 0, 0], side: [0, 0, 1], rx: A.w * 0.5, ry: A.w * 0.5, bones: [[a1, 1]], color: col },
    ], 6);
    if (A.claw) for (const k of [-1, 1]) geo.cone([A.x, A.y - A.l1 - A.l2, A.z * s + k * A.w * 0.3], [A.x + A.claw, A.y - A.l1 - A.l2 - A.claw * 0.6, A.z * s + k * A.w * 0.5], A.w * 0.22, C.claw, a1, 4);
    arms.push({ a0, a1, s });
  }
  // les ailes
  const wings = [];
  if (o.wing) {
    const W = o.wing;
    for (const s of [1, -1]) {
      const nm = `wing${s > 0 ? 'D' : 'G'}`;
      const a = rig.add(`${nm}0`, 'chest', W.x, W.y, W.z * s);
      const b = rig.add(`${nm}1`, `${nm}0`, W.x, W.y, (W.z + W.span * 0.5) * s);
      const cc = new THREE.Color(W.col || o.sail || o.top);
      const c2 = new THREE.Color(W.tipCol || W.col || o.top);
      geo.flat([[W.x + W.chord * 0.5, W.y, W.z * s], [W.x + W.chord * 0.4, W.y, (W.z + W.span * 0.5) * s], [W.x - W.chord * 0.5, W.y, (W.z + W.span * 0.5) * s], [W.x - W.chord, W.y, W.z * s]], cc, () => [a]);
      geo.flat([[W.x + W.chord * 0.4, W.y, (W.z + W.span * 0.5) * s], [W.x + W.chord * 0.1, W.y, (W.z + W.span) * s], [W.x - W.chord * 0.5, W.y, (W.z + W.span * 0.5) * s]], c2, () => [b]);
      wings.push({ a, b, s });
    }
  }
  // de nombreuses petites pattes, sans os (mille-pattes, scorpion, insecte)
  if (o.manyLegs) {
    const M = o.manyLegs;
    const col = new THREE.Color(M.col || o.side || o.top);
    for (let i = 0; i < M.n; i++) {
      const x = lerp(M.from, M.to, (i + 0.5) / M.n);
      const T = (() => { for (let k = 0; k < pts.length - 1; k++) if (x >= pts[k].x && x <= pts[k + 1].x) return lerp(pts[k].y, pts[k + 1].y, (x - pts[k].x) / (pts[k + 1].x - pts[k].x || 1)); return pts[hipI].y; })();
      let best = 0, bd = Infinity;
      rig.bones.forEach((B, n) => { if (!B.z) { const d = Math.abs(B.x - x); if (d < bd) { bd = d; best = n; } } });
      for (const s of [1, -1]) geo.cone([x, T, M.z * 0.6 * s], [x + (i % 2 ? 0.15 : -0.15) * M.L, 0.01, (M.z + M.L) * s], M.r, col, best, 4);
    }
  }
  if (o.claws) {
    // les pinces (scorpion)
    const P = o.claws;
    const pc = new THREE.Color(P.col || o.mark || o.top);
    for (const s of [1, -1]) {
      const nm = `pince${s > 0 ? 'D' : 'G'}`;
      const a = rig.add(nm, 'chest', P.x, P.y, P.z * s);
      geo.cone([P.x, P.y, P.z * s], [P.x + P.L, P.y, (P.z + P.L * 0.35) * s], P.r, pc, a, 7);
      geo.ball([P.x + P.L * 1.15, P.y, (P.z + P.L * 0.4) * s], [P.L * 0.42, P.r * 1.1, P.r * 1.2], pc, a, 5, 7);
      geo.cone([P.x + P.L * 1.3, P.y, (P.z + P.L * 0.52) * s], [P.x + P.L * 1.9, P.y, (P.z + P.L * 0.32) * s], P.r * 0.45, pc, a, 5);
      geo.cone([P.x + P.L * 1.3, P.y, (P.z + P.L * 0.3) * s], [P.x + P.L * 1.85, P.y, (P.z + P.L * 0.28) * s], P.r * 0.4, pc, a, 5);
      arms.push({ a0: a, a1: a, s, pince: true });
    }
  }
  const geometry = geo.build();
  const names = fronts.map((f) => f.name);
  const plan = {
    geometry,
    bones: rig.bones,
    legs,
    arms,
    wings,
    tails,
    necks: fronts.filter((f) => f.name.startsWith('neck')).map((f) => f.i),
    chest: rig.byName.chest,
    hip: rig.byName.hip,
    head: rig.byName.head ?? null,
    jaw: rig.byName.jaw ?? null,
    names,
    hipY: pts[hipI].y,
    stride: o.stride || 0.5,
    bob: o.bob ?? 0.04,
    lift: o.lift ?? 0.3,
    wave: o.wave || 0,
    outline: o.outline ?? 0.012,
    flies: !!o.flies,
    fixedBones: !!o.manyLegs || !!o.noLegs,
  };
  // les inverses des os, calculés une seule fois
  plan.inverses = rig.bones.map((B) => new THREE.Matrix4().makeTranslation(-B.x, -B.y, -B.z));
  return plan;
}

/* ---------- Le dégradé de la lumière : un rendu de dessin animé ---------- */
let toonRamp = null;
function ramp() {
  if (toonRamp) return toonRamp;
  const data = new Uint8Array([120, 120, 120, 255, 182, 182, 182, 255, 235, 235, 235, 255, 255, 255, 255, 255]);
  toonRamp = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat);
  toonRamp.minFilter = THREE.NearestFilter;
  toonRamp.magFilter = THREE.NearestFilter;
  toonRamp.needsUpdate = true;
  return toonRamp;
}
const skinMat = () => new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: ramp() });

function outlineMat(width) {
  const m = new THREE.MeshBasicMaterial({ color: 0x14100E, side: THREE.BackSide });
  m.onBeforeCompile = (s) => {
    s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n transformed += normalize(normal) * ${width.toFixed(4)};`);
  };
  m.customProgramCacheKey = () => `contour-${width.toFixed(4)}`;
  return m;
}

/* ---------- Un animal vivant ---------- */
const MAT_CACHE = { skin: null };

export class Animal {
  constructor(plan, withOutline = true) {
    this.plan = plan;
    this.group = new THREE.Group();
    const bones = plan.bones.map((B) => {
      const b = new THREE.Bone();
      b.name = B.name;
      return b;
    });
    plan.bones.forEach((B, i) => {
      if (B.parent < 0) {
        bones[i].position.set(B.x, B.y, B.z);
      } else {
        const P = plan.bones[B.parent];
        bones[i].position.set(B.x - P.x, B.y - P.y, B.z - P.z);
        bones[B.parent].add(bones[i]);
      }
    });
    this.bones = bones;
    const skeleton = new THREE.Skeleton(bones, plan.inverses);
    if (!MAT_CACHE.skin) MAT_CACHE.skin = skinMat();
    this.mesh = new THREE.SkinnedMesh(plan.geometry, MAT_CACHE.skin);
    this.mesh.add(bones[0]);
    this.mesh.bind(skeleton, new THREE.Matrix4());
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = true;
    this.group.add(this.mesh);
    if (withOutline) {
      if (!plan.outlineMat) plan.outlineMat = outlineMat(plan.outline);
      this.line = new THREE.SkinnedMesh(plan.geometry, plan.outlineMat);
      this.line.bind(skeleton, new THREE.Matrix4());
      this.line.frustumCulled = false;
      this.group.add(this.line);
    }
    this.ph = Math.random();
    this.t = Math.random() * 10;
    this.jaw = 0;
    this.lookY = 0;
    this.lookP = 0;
    for (const L of plan.legs) {
      if (L.splay) this.bones[L.joints[0]].rotation.x = L.side * L.splay;
    }
    this.pose({ speed: 0 }, 0);
  }

  /**
   * st : { speed (m/s, à l'échelle de l'animal), yawRate, jaw (0–1), lookY, lookP,
   *        attack (0–1 : la tête fonce), roar (0–1), crouch (0–1), stun (0–1) }
   */
  pose(st, dt) {
    const P = this.plan, B = this.bones;
    this.t += dt;
    const v = st.speed || 0;
    const k = clamp(v / (P.stride * 0.8), 0, 1);
    this.ph += (v / (P.stride * 2.4)) * dt;
    const crouch = st.crouch || 0;
    // le corps
    const bobY = P.flies ? Math.sin(this.t * 2.4) * 0.05 : Math.sin(this.ph * TAU * 2) * P.bob * k;
    const breathe = Math.sin(this.t * 2) * 0.006;
    const hipBone = B[P.hip];
    hipBone.position.y = P.hipY + bobY + breathe - crouch * P.hipY * 0.14;
    const hipSway = Math.sin(this.ph * TAU) * 0.05 * k;
    hipBone.rotation.y = hipSway + (st.yawRate || 0) * 0.08;
    hipBone.rotation.x = Math.cos(this.ph * TAU) * 0.035 * k + clamp((st.yawRate || 0) * 0.08, -0.25, 0.25);
    const lean = (st.lean || 0) * k;
    hipBone.rotation.z = -lean + (st.pitch || 0);
    if (st.stun) hipBone.rotation.x += Math.sin(this.t * 7) * 0.09 * st.stun;
    // la queue ondule et traîne derrière les virages
    P.tails.forEach((b, i) => {
      const w = i + 1;
      B[b].rotation.y = Math.sin(this.t * (P.wave || 2.2) + this.ph * 3 - i * 0.7) * (0.05 + 0.06 * k + (P.wave ? 0.2 : 0)) + clamp((st.yawRate || 0) * 0.1 * w, -0.5, 0.5);
      B[b].rotation.z = Math.sin(this.ph * TAU * 2 - i * 0.6) * 0.02 * k + lean * 0.12;
    });
    // le cou et la tête regardent, mordent, rugissent
    this.lookY += ((st.lookY || 0) - this.lookY) * Math.min(1, dt * 6);
    this.lookP += ((st.lookP || 0) - this.lookP) * Math.min(1, dt * 6);
    const attack = st.attack || 0, roar = st.roar || 0;
    const n = Math.max(1, P.necks.length);
    P.necks.forEach((b) => {
      B[b].rotation.y = (this.lookY * 0.7) / n - hipSway * 0.5;
      B[b].rotation.z = (this.lookP * 0.7 + roar * 0.75 - attack * 0.3) / n + lean * 0.3 / n + Math.sin(this.ph * TAU * 2 + 1) * 0.015 * k;
    });
    if (P.chest != null && P.chest !== undefined) {
      B[P.chest].rotation.y = -hipSway * 1.4 + (st.yawRate || 0) * 0.05;
    }
    if (P.head != null) {
      const h = B[P.head];
      h.rotation.y = this.lookY * 0.3;
      h.rotation.z = this.lookP * 0.3 - attack * 0.15 + roar * 0.2;
      if (st.stun) h.rotation.x = Math.sin(this.t * 6) * 0.25 * st.stun;
      else h.rotation.x = 0;
    }
    if (P.jaw != null) {
      this.jaw += ((st.jaw || 0) - this.jaw) * Math.min(1, dt * 18);
      B[P.jaw].rotation.z = -this.jaw * (0.75 + roar * 0.15);
    }
    // les pattes : le pied se pose, recule au sol, puis revient en l'air
    for (const L of P.legs) {
      const f = (this.ph + L.phase) % 1;
      const stance = 0.58;
      const s = P.stride * (st.stride || 1);
      let fx, fy;
      if (f < stance) { fx = lerp(s, -s, f / stance); fy = 0; } else {
        const u = (f - stance) / (1 - stance);
        fx = lerp(-s, s, smooth(u));
        fy = Math.sin(u * Math.PI) * P.lift * L.y;
      }
      fx *= k;
      fy *= k;
      this.solveLeg(L, fx, fy, hipBone.position.y - P.hipY);
    }
    for (const A of P.arms) {
      if (A.pince) {
        B[A.a0].rotation.y = -A.s * (0.3 + Math.sin(this.t * 3) * 0.08 - attack * 0.5);
        continue;
      }
      B[A.a0].rotation.z = 0.8 + Math.sin(this.ph * TAU + (A.s > 0 ? 0 : Math.PI)) * 0.25 * k + attack * 0.5;
      B[A.a1].rotation.z = 0.7;
    }
    for (const W of P.wings) {
      const flap = Math.sin(this.t * (st.flap || 3.6));
      B[W.a].rotation.x = W.s * flap * 0.5;
      B[W.b].rotation.x = W.s * Math.sin(this.t * (st.flap || 3.6) - 0.8) * 0.45;
    }
  }

  /** La cinématique inverse : d'où part la jambe et où doit tomber le pied */
  solveLeg(L, fx, fy, hipDy) {
    const B = this.bones;
    const [l1, l2, l3] = L.lens;
    // le pied est au sol, repère du corps : (fx, fy − hauteur de la hanche)
    const meta = L.meta;
    const ax = fx - Math.sin(meta) * l3;
    const ay = fy + Math.cos(meta) * l3 - (L.y + hipDy);
    const d = clamp(Math.hypot(ax, ay), Math.abs(l1 - l2) + 0.001, l1 + l2 - 0.001);
    const base = Math.atan2(ax, -ay);
    const a1 = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
    const a2 = Math.acos(clamp((l2 * l2 + d * d - l1 * l1) / (2 * l2 * d), -1, 1));
    const sign = L.back ? -1 : 1;
    const thigh = base + sign * a1;
    const shin = base - sign * a2;
    B[L.joints[0]].rotation.z = thigh;
    B[L.joints[1]].rotation.z = shin - thigh;
    B[L.joints[2]].rotation.z = meta - shin;
    B[L.joints[3]].rotation.z = -meta;
  }

  dispose() {
    this.mesh.skeleton.dispose();
    if (this.group.parent) this.group.parent.remove(this.group);
  }
}

/* ============================================================================
   Les patrons : un théropode, un quadrupède, un sauropode, un lézard…
   Tout est calculé à partir de quelques mesures : chaque espèce (animaux.js)
   n'a plus qu'à dire ce qui la rend unique.
   ============================================================================ */

/** Un carnivore (ou un bipède) : queue tendue à l'horizontale, grosse tête, petits bras */
export function theropod(o) {
  const { H, d, trunk, neck, tail, hl, hh, hw } = o;
  const nr = o.neckR ?? d * 0.42;
  const rise = o.neckRise ?? 0.75;
  const nx = trunk + neck * Math.cos(rise), ny = H + d * 0.15 + neck * Math.sin(rise);
  const head = {
    x: nx + hl * 0.02, y: ny, l: hl, h: hh, w: hw, eye: o.eye ?? hh * 0.13, eyeX: 0.28, eyeY: 0.17, eyeZ: 0.7,
    teeth: o.teeth ?? 7, toothL: o.toothL, beak: o.beak, horns: o.horns, crest: o.crest, brows: o.brows, dome: o.dome, tube: o.tube, jaw: o.jawK, jawH: o.jawH,
  };
  const tl = o.tailLift ?? 0.02;
  const spine = [
    { x: -tail, y: H + tail * tl, w: 0.012 * d, h: 0.012 * d, bone: 'tail4' },
    { x: -tail * 0.72, y: H + tail * tl * 0.75, w: 0.12 * d, h: 0.14 * d, bone: 'tail3' },
    { x: -tail * 0.45, y: H + tail * tl * 0.5, w: 0.27 * d, h: 0.32 * d, bone: 'tail2' },
    { x: -tail * 0.2, y: H + d * 0.03, w: 0.46 * d, h: 0.55 * d, bone: 'tail1' },
    { x: 0, y: H + d * 0.05, w: 0.62 * d, h: 0.78 * d, bone: 'hip' },
    { x: trunk * 0.5, y: H + d * 0.02, w: 0.7 * d * (o.fat ?? 1), h: 0.98 * d * (o.fat ?? 1) },
    { x: trunk, y: H + d * 0.15, w: 0.56 * d, h: 0.72 * d, bone: 'chest' },
    { x: trunk + neck * 0.45 * Math.cos(rise), y: H + d * 0.15 + neck * 0.45 * Math.sin(rise), w: nr * 1.02, h: nr * 1.12, bone: 'neck1' },
    { x: nx - hl * 0.12, y: ny - hh * 0.05, w: nr * 0.86, h: nr * 0.96, bone: 'neck2' },
    { x: nx + hl * 0.05, y: ny + hh * 0.1, w: hw * 0.92, h: hh * 0.55, bone: 'head', head: true },
    { x: nx + hl * 0.42, y: ny + hh * 0.06, w: hw * 0.82, h: hh * 0.42, head: true },
    { x: nx + hl * 0.76, y: ny - hh * 0.05, w: hw * 0.56, h: hh * 0.28, head: true },
    { x: nx + hl, y: ny - hh * 0.11, w: hw * 0.28, h: hh * 0.15, head: true },
  ];
  const lens = [H * 0.52, H * 0.52, H * 0.3];
  const lw = o.legW ?? d * 0.4;
  const leg = (side, phase) => ({
    side, phase, x: 0.03, y: H, z: d * 0.46, lens, w: [lw, lw * 0.5, lw * 0.34], meta: 0.55,
    foot: { L: H * 0.3, W: lw * 0.5, toes: 3, claw: H * 0.08 },
  });
  return {
    ...o,
    head,
    spine,
    hind: [leg(1, 0), leg(-1, 0.5)],
    arms: { x: trunk * 0.92, y: H - d * 0.15, z: d * 0.48, l1: o.armL ?? H * 0.2, l2: o.armL ?? H * 0.2, w: o.armW ?? d * 0.1, claw: (o.armL ?? H * 0.2) * 0.35 },
    stride: H * 0.42,
    bob: H * 0.035,
    lift: 0.22,
    brow: o.brow ?? true,
    outline: o.outline ?? H * 0.012,
  };
}

/** Un animal à quatre pattes : dinosaure cuirassé, reptile à voile, sauropode */
export function quadruped(o) {
  const { H, d, trunk, neck, tail, hl, hh, hw } = o;
  const nr = o.neckR ?? d * 0.42;
  const rise = o.neckRise ?? 0.2;
  const FH = o.foreH ?? H;
  const chestY = FH + d * 0.08;
  const nx = trunk + neck * Math.cos(rise), ny = chestY + neck * Math.sin(rise);
  const head = {
    x: nx + hl * 0.02, y: ny, l: hl, h: hh, w: hw, eye: o.eye ?? hh * 0.13, eyeX: 0.26, eyeY: 0.2, eyeZ: 0.72,
    teeth: o.teeth ?? 0, toothL: o.toothL, beak: o.beak, horns: o.horns, frill: o.frill, crest: o.crest, dome: o.dome, tube: o.tube, jaw: o.jawK, jawH: o.jawH,
  };
  const tl = o.tailLift ?? 0.05;
  const midN = (k) => ({ x: trunk + neck * k * Math.cos(rise), y: chestY + neck * k * Math.sin(rise) });
  const spine = [
    { x: -tail, y: H + tail * tl, w: 0.012 * d, h: 0.012 * d, bone: 'tail4' },
    { x: -tail * 0.72, y: H + tail * tl * 0.8, w: 0.13 * d, h: 0.15 * d, bone: 'tail3' },
    { x: -tail * 0.45, y: H + tail * tl * 0.5, w: 0.28 * d, h: 0.32 * d, bone: 'tail2' },
    { x: -tail * 0.2, y: H + d * 0.05, w: 0.48 * d, h: 0.52 * d, bone: 'tail1' },
    { x: 0, y: H + d * 0.12, w: 0.8 * d, h: 0.84 * d, bone: 'hip' },
    { x: trunk * 0.5, y: Math.max(H, FH) + d * 0.1, w: 0.95 * d * (o.fat ?? 1), h: d * (o.fat ?? 1) },
    { x: trunk, y: chestY + d * 0.08, w: 0.74 * d, h: 0.78 * d, bone: 'chest' },
    { ...midN(0.45), w: nr * 1.06, h: nr * 1.1, bone: 'neck1' },
    { ...midN(0.86), w: nr * 0.86, h: nr * 0.92, bone: 'neck2' },
    { x: nx + hl * 0.05, y: ny + hh * 0.1, w: hw * 0.92, h: hh * 0.55, bone: 'head', head: true },
    { x: nx + hl * 0.42, y: ny + hh * 0.04, w: hw * 0.82, h: hh * 0.42, head: true },
    { x: nx + hl * 0.76, y: ny - hh * 0.06, w: hw * 0.58, h: hh * 0.29, head: true },
    { x: nx + hl, y: ny - hh * 0.12, w: hw * 0.32, h: hh * 0.17, head: true },
  ];
  const lw = o.legW ?? d * 0.34;
  const z = d * (o.legZ ?? 0.62);
  const splay = o.splay || 0;
  const hindL = (side, phase) => ({
    side, phase, x: 0, y: H, z, lens: [H * 0.56, H * 0.56, H * 0.12], w: [lw, lw * 0.72, lw * 0.56], meta: 0.08, splay,
    foot: { L: H * 0.17, W: lw * 0.55, toes: o.toes ?? 3, claw: H * (o.toeClaw ?? 0.05) },
  });
  const foreL = (side, phase) => ({
    side, phase, x: trunk * 0.95, y: FH, z, lens: [FH * 0.56, FH * 0.56, FH * 0.12], w: [lw * 0.88, lw * 0.64, lw * 0.5], meta: 0.08, back: true, splay,
    parent: 'chest',
    foot: { L: FH * 0.15, W: lw * 0.5, toes: o.toes ?? 3, claw: FH * (o.toeClaw ?? 0.05) },
  });
  const off = o.amble ? 0.25 : 0;
  return {
    ...o,
    head,
    spine,
    hind: [hindL(1, 0), hindL(-1, 0.5)],
    fore: [foreL(1, 0.5 + off), foreL(-1, off)],
    stride: Math.max(H, FH) * (o.strideK ?? 0.38),
    bob: H * 0.03,
    lift: 0.2,
    brow: o.brow ?? false,
    outline: o.outline ?? H * 0.012,
  };
}

/** Un corps sans pattes animées (mille-pattes, scorpion, poisson, insecte volant) */
export function crawler(o) {
  const n = o.spine.length;
  const hip = Math.floor(n / 2);
  return { noLegs: true, stride: o.stride ?? 0.4, bob: 0, lift: 0, ...o, spine: o.spine.map((p, i) => ({ ...p, bone: p.bone || (i === hip ? 'hip' : undefined) })) };
}
