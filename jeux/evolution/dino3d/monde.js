// ============================================================================
// Évolution 3D — le monde d'un chapitre : le relief, l'eau, le ciel, les
// montagnes au loin, les forêts (milliers de plantes dessinées d'une seule fois,
// qui bougent au vent), le volcan et la météorite. Tout vient d'un « biome »
// (chapters[].biome dans levels/vers-les-dinosaures.js). Aucun fichier d'image.
// ============================================================================

import * as THREE from 'three';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (k) => { const c = clamp(k, 0, 1); return c * c * (3 - 2 * c); };

function mulberry(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- Le bruit : collines, taches du sol ---------- */
function makeNoise(seed) {
  const r = mulberry(seed);
  const P = new Float32Array(4096);
  for (let i = 0; i < 4096; i++) P[i] = r();
  const at = (x, y) => P[((x * 73 + y * 179) & 4095 + 4096) & 4095];
  const n2 = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const u = x - xi, v = y - yi;
    const su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v);
    return lerp(lerp(at(xi, yi), at(xi + 1, yi), su), lerp(at(xi, yi + 1), at(xi + 1, yi + 1), su), sv);
  };
  return (x, y, oct = 4) => {
    let s = 0, a = 1, t = 0, f = 1;
    for (let i = 0; i < oct; i++) { s += n2(x * f, y * f) * a; t += a; a *= 0.5; f *= 2.03; }
    return s / t;
  };
}

/* ---------- Un petit atelier de formes (chaque plante = une seule géométrie) ---------- */
class Shape {
  constructor() { this.p = []; this.c = []; }

  tri(a, b, c, col) {
    this.p.push(...a, ...b, ...c);
    const C = col instanceof THREE.Color ? col : new THREE.Color(col);
    for (let i = 0; i < 3; i++) this.c.push(C.r, C.g, C.b);
  }

  /** Un tronc : d'un point à l'autre, en se rétrécissant */
  tube(a, b, ra, rb, colA, colB = colA, sides = 6) {
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const n = Math.hypot(...d) || 1;
    const f = d.map((v) => v / n);
    const ref = Math.abs(f[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const s = [f[1] * ref[2] - f[2] * ref[1], f[2] * ref[0] - f[0] * ref[2], f[0] * ref[1] - f[1] * ref[0]];
    const sn = Math.hypot(...s) || 1;
    s[0] /= sn; s[1] /= sn; s[2] /= sn;
    const u = [s[1] * f[2] - s[2] * f[1], s[2] * f[0] - s[0] * f[2], s[0] * f[1] - s[1] * f[0]];
    const ring = (c, r, k) => [c[0] + (s[0] * Math.cos(k) + u[0] * Math.sin(k)) * r, c[1] + (s[1] * Math.cos(k) + u[1] * Math.sin(k)) * r, c[2] + (s[2] * Math.cos(k) + u[2] * Math.sin(k)) * r];
    for (let i = 0; i < sides; i++) {
      const k0 = (i / sides) * TAU, k1 = ((i + 1) / sides) * TAU;
      this.tri(ring(a, ra, k0), ring(b, rb, k0), ring(a, ra, k1), colA);
      if (rb > 0.0001) this.tri(ring(a, ra, k1), ring(b, rb, k0), ring(b, rb, k1), colB);
    }
  }

  /** Une boule bosselée (feuillage, rocher) */
  blob(c, r, col, seed = 1, lumps = 0.22, ry = 1) {
    const rnd = mulberry(seed * 991 + 7);
    const lat = 4, lon = 6;
    const cache = [];
    for (let i = 0; i <= lat; i++) {
      cache[i] = [];
      for (let k = 0; k < lon; k++) {
        const v = (i / lat) * Math.PI, u = (k / lon) * TAU;
        const R = r * (1 + (i && i < lat ? (rnd() - 0.5) * lumps * 2 : 0));
        cache[i][k] = [c[0] + R * Math.sin(v) * Math.cos(u), c[1] + R * ry * Math.cos(v), c[2] + R * Math.sin(v) * Math.sin(u)];
      }
    }
    const C = new THREE.Color(col);
    for (let i = 0; i < lat; i++) {
      for (let k = 0; k < lon; k++) {
        const a = cache[i][k], b = cache[i][(k + 1) % lon], d = cache[i + 1][k], e = cache[i + 1][(k + 1) % lon];
        const shadeK = 0.82 + 0.3 * (1 - i / lat);
        const tint = C.clone().multiplyScalar(shadeK);
        if (i > 0) this.tri(a, b, d, tint);
        if (i < lat - 1) this.tri(b, e, d, tint);
      }
    }
  }

  /** Une palme : une tige recourbée, avec des folioles des deux côtés */
  frond(base, ang, len, droop, w, colA, colB, steps = 6) {
    const dir = [Math.cos(ang), Math.sin(ang)];
    let prev = base, prevL = null, prevR = null;
    const lift = 0.72;
    for (let i = 1; i <= steps; i++) {
      const u = i / steps;
      const y = base[1] + len * (lift * u - droop * u * u);
      const pt = [base[0] + dir[0] * len * u, y, base[2] + dir[1] * len * u];
      const wid = w * Math.sin(u * Math.PI) ** 0.7;
      const L = [pt[0] - dir[1] * wid, pt[1] - wid * 0.25, pt[2] + dir[0] * wid];
      const R = [pt[0] + dir[1] * wid, pt[1] - wid * 0.25, pt[2] - dir[0] * wid];
      const col = new THREE.Color(colA).lerp(new THREE.Color(colB), u);
      if (prevL) {
        this.tri(prev, pt, prevL, col); this.tri(pt, L, prevL, col);
        this.tri(prev, prevR, pt, col); this.tri(pt, prevR, R, col);
        // l'autre face, pour la voir de dessous
        this.tri(prev, prevL, pt, col); this.tri(pt, prevL, L, col);
        this.tri(prev, pt, prevR, col); this.tri(pt, R, prevR, col);
      } else {
        this.tri(prev, pt, L, col); this.tri(prev, R, pt, col);
        this.tri(prev, L, pt, col); this.tri(prev, pt, R, col);
      }
      prev = pt; prevL = L; prevR = R;
    }
  }

  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.computeVertexNormals();
    return g;
  }
}

/* ---------- Les plantes et les roches. Hauteur ≈ 1 : chaque exemplaire est mis à l'échelle ---------- */
const FLORA = {
  fougere: (c) => {
    const s = new Shape();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU + (i % 2) * 0.22;
      s.frond([0, 0.02, 0], a, 0.75 + (i % 3) * 0.12, 0.65 + (i % 2) * 0.2, 0.14, c.a, c.b, 4);
    }
    for (let i = 0; i < 4; i++) s.frond([0, 0.02, 0], (i / 4) * TAU + 0.5, 0.75, 0.25, 0.1, c.a, c.b, 3);
    return s;
  },
  herbe: (c) => {
    const s = new Shape();
    for (let i = 0; i < 5; i++) s.frond([0, 0, 0], (i / 5) * TAU, 0.6, 0.45, 0.07, c.a, c.b, 2);
    return s;
  },
  prele: (c) => {
    const s = new Shape();
    for (const [x, z, h] of [[0, 0, 1], [0.1, 0.06, 0.82], [-0.09, 0.08, 0.72]]) {
      const seg = 4;
      for (let i = 0; i < seg; i++) {
        const y0 = (i / seg) * h, y1 = ((i + 1) / seg) * h;
        s.tube([x, y0, z], [x, y1, z], 0.024 - i * 0.002, 0.022 - i * 0.002, i % 2 ? c.a : c.b, c.a, 4);
        if (i > 0) {
          for (let k = 0; k < 5; k++) {
            const a = (k / 5) * TAU + i;
            s.tri([x, y1 + 0.012, z], [x + Math.cos(a) * 0.11, y1 + 0.05, z + Math.sin(a) * 0.11], [x + Math.cos(a + 0.5) * 0.04, y1 + 0.02, z + Math.sin(a + 0.5) * 0.04], c.b);
          }
        }
      }
      s.tube([x, h, z], [x, h + 0.05, z], 0.02, 0.001, c.t, c.t, 4);
    }
    return s;
  },
  archaeopteris: (c) => {
    const s = new Shape();
    s.tube([0, 0, 0], [0, 0.72, 0], 0.05, 0.022, c.t);
    s.blob([0, 0.4, 0], 0.32, c.a, 2, 0.25, 0.32);
    s.blob([0.05, 0.58, 0.03], 0.3, c.b, 3, 0.25, 0.3);
    s.blob([-0.03, 0.74, 0], 0.24, c.a, 4, 0.25, 0.32);
    s.blob([0, 0.88, 0.01], 0.15, c.b, 5, 0.25, 0.45);
    return s;
  },
  lepido: (c) => {
    const s = new Shape();
    for (let i = 0; i < 6; i++) s.tube([0, i / 7.5, 0], [0, (i + 1) / 7.5, 0], 0.04 - i * 0.002, 0.038 - i * 0.002, i % 2 ? c.t : c.d, c.t, 7);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      const m = [Math.cos(a) * 0.12, 0.92, Math.sin(a) * 0.12];
      s.tube([0, 0.8, 0], m, 0.022, 0.012, c.t);
      s.blob(m, 0.085, i % 2 ? c.a : c.b, 8 + i, 0.3, 0.8);
      s.tube(m, [m[0] * 1.9, 0.99, m[2] * 1.9], 0.009, 0.004, c.t);
      s.blob([m[0] * 1.9, 1.0, m[2] * 1.9], 0.06, c.b, 18 + i, 0.3, 0.8);
    }
    return s;
  },
  'arbre-fougere': (c) => {
    const s = new Shape();
    s.tube([0, 0, 0], [0.02, 0.62, 0], 0.045, 0.034, c.t, c.d);
    for (let i = 0; i < 9; i++) s.frond([0.02, 0.62, 0], (i / 9) * TAU + (i % 2) * 0.2, 0.45, 0.62 + (i % 2) * 0.25, 0.08, c.a, c.b, 4);
    return s;
  },
  araucaria: (c) => {
    const s = new Shape();
    s.tube([0, 0, 0], [0, 0.82, 0], 0.03, 0.012, c.t, c.d);
    for (const [y, r, id] of [[0.8, 0.26, 1], [0.87, 0.2, 2], [0.93, 0.12, 3]]) s.blob([0, y, 0], r, id % 2 ? c.a : c.b, id + 30, 0.22, 0.28);
    return s;
  },
  conifere: (c) => {
    const s = new Shape();
    s.tube([0, 0, 0], [0, 0.3, 0], 0.026, 0.02, c.t);
    for (let i = 0; i < 5; i++) {
      const y = 0.2 + i * 0.15, r = 0.24 - i * 0.04;
      s.tube([0, y, 0], [0, y + 0.3, 0], r, 0.0001, i % 2 ? c.a : c.b, c.a, 7);
    }
    return s;
  },
  cycade: (c) => {
    const s = new Shape();
    s.tube([0, 0, 0], [0, 0.34, 0], 0.11, 0.09, c.t, c.d, 8);
    for (let i = 0; i < 10; i++) s.frond([0, 0.34, 0], (i / 10) * TAU, 0.62, 0.62 + (i % 3) * 0.1, 0.095, c.a, c.b, 4);
    s.tube([0, 0.32, 0], [0, 0.44, 0], 0.06, 0.012, '#D9A13A', '#E8C24A', 6);
    return s;
  },
  ginkgo: (c) => {
    const s = new Shape();
    s.tube([0, 0, 0], [0, 0.5, 0], 0.045, 0.028, c.t);
    s.tube([0, 0.4, 0], [0.16, 0.66, 0.05], 0.018, 0.008, c.t);
    s.tube([0, 0.45, 0], [-0.15, 0.68, -0.05], 0.018, 0.008, c.t);
    s.blob([0, 0.74, 0], 0.27, c.a, 41, 0.3, 0.85);
    s.blob([0.18, 0.66, 0.06], 0.2, c.b, 42, 0.3, 0.8);
    s.blob([-0.18, 0.68, -0.05], 0.2, c.b, 43, 0.3, 0.8);
    return s;
  },
  magnolia: (c) => {
    const s = new Shape();
    s.tube([0, 0, 0], [0, 0.42, 0], 0.035, 0.022, c.t);
    s.blob([0, 0.62, 0], 0.36, c.a, 51, 0.28, 0.72);
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4, r = 0.3, y = 0.56 + (i % 3) * 0.1;
      s.blob([Math.cos(a) * r, y, Math.sin(a) * r], 0.055, c.f || '#F4B8D0', 60 + i, 0.2, 0.7);
    }
    return s;
  },
  'arbre-mort': (c) => {
    const s = new Shape();
    s.tube([0, 0, 0], [0.02, 0.62, 0], 0.05, 0.02, c.t, c.d);
    for (const [a, h, l] of [[0.4, 0.45, 0.32], [2.2, 0.55, 0.28], [4.1, 0.38, 0.24], [5.2, 0.62, 0.22]]) {
      const e = [Math.cos(a) * l, h + l * 0.7, Math.sin(a) * l];
      s.tube([0.01, h, 0], e, 0.016, 0.003, c.t, c.d, 4);
    }
    return s;
  },
  rocher: (c) => {
    const s = new Shape();
    s.blob([0, 0.42, 0], 0.62, c.a, 71, 0.2, 0.7);
    s.blob([0.34, 0.2, 0.12], 0.32, c.b, 72, 0.2, 0.7);
    return s;
  },
  mesa: (c) => {
    // un grand rocher en couches, comme dans les déserts du Trias
    const s = new Shape();
    const layers = [[0, 0.25, 0.5, 0.42, c.a], [0.25, 0.5, 0.42, 0.37, c.b], [0.5, 0.72, 0.37, 0.33, c.a], [0.72, 1, 0.33, 0.28, c.b]];
    for (const [y0, y1, r0, r1, col] of layers) s.tube([0, y0, 0], [0, y1, 0], r0, r1, col, col, 9);
    s.blob([0, 1, 0], 0.28, c.b, 81, 0.05, 0.05);
    return s;
  },
};

/* ---------- Une matière qui bouge au vent ---------- */
function windy(mat, uniforms, amp) {
  mat.onBeforeCompile = (s) => {
    s.uniforms.uTime = uniforms.uTime;
    s.vertexShader = `uniform float uTime;\n${s.vertexShader}`.replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
        vec2 wp = instanceMatrix[3].xz;
        float wk = position.y * position.y;
        transformed.x += sin(uTime * 1.3 + wp.x * 0.13 + position.y * 2.0) * ${amp.toFixed(3)} * wk;
        transformed.z += cos(uTime * 1.1 + wp.y * 0.11 + position.y * 2.0) * ${amp.toFixed(3)} * wk;
      #endif`);
  };
  mat.customProgramCacheKey = () => `vent-${amp.toFixed(3)}`;
  return mat;
}

/* ---------- Le ciel ---------- */
function makeSky(B, sun) {
  const uni = {
    uTop: { value: new THREE.Color(B.sky.top) },
    uMid: { value: new THREE.Color(B.sky.mid) },
    uLow: { value: new THREE.Color(B.sky.low) },
    uSun: { value: new THREE.Color(B.sky.sun || '#FFF4D8') },
    uDir: { value: sun.clone().normalize() },
    uCloud: { value: new THREE.Color(B.sky.cloud || '#FFFFFF') },
    uCover: { value: B.sky.cover ?? 0.5 },
    uTime: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: uni,
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); vec4 p = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * p; gl_Position.z = gl_Position.w * 0.9999; }`,
    fragmentShader: `
      varying vec3 vP;
      uniform vec3 uTop, uMid, uLow, uSun, uDir, uCloud; uniform float uCover, uTime;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
      float fbm(vec2 p){ float s=0.0,a=0.5; for(int i=0;i<4;i++){ s+=a*n(p); p*=2.1; a*=0.5; } return s; }
      void main(){
        vec3 d = normalize(vP);
        float y = max(d.y, 0.0);
        vec3 col = y < 0.22 ? mix(uLow, uMid, y/0.22) : mix(uMid, uTop, min(1.0,(y-0.22)/0.55));
        float sd = max(dot(d, uDir), 0.0);
        col += uSun * (pow(sd, 480.0)*1.6 + pow(sd, 18.0)*0.28);
        if (d.y > 0.01) {
          vec2 q = d.xz/(d.y+0.18)*0.9 + vec2(uTime*0.008, 0.0);
          float c = smoothstep(1.0-uCover, 1.0-uCover+0.32, fbm(q));
          col = mix(col, uCloud*(0.84+0.22*fbm(q*2.0+3.0)), c*0.86*smoothstep(0.01,0.2,d.y));
        }
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(10, 24, 14), mat);
  m.renderOrder = -10;
  m.frustumCulled = false;
  return { mesh: m, uni };
}

/* ---------- Une texture de sol : pour que le terrain défile sous les pattes ---------- */
function groundTexture(seed) {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d');
  x.fillStyle = '#FFFFFF';
  x.fillRect(0, 0, S, S);
  const r = mulberry(seed);
  for (let i = 0; i < 2600; i++) {
    const v = 150 + r() * 105;
    x.fillStyle = `rgba(${v},${v},${v},${0.25 + r() * 0.4})`;
    const s = 1 + r() * r() * 7;
    x.beginPath();
    x.ellipse(r() * S, r() * S, s, s * (0.4 + r() * 0.6), r() * 3, 0, TAU);
    x.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ============================================================================
   Le monde
   ============================================================================ */
export function createWorld(scene, B, seed, quality) {
  const rnd = mulberry(seed);
  const noise = makeNoise(seed + 5);
  const R = B.radius;
  const WATER = B.water ?? -999;
  const N = quality.terrain;
  const L = R * 2.3;
  const STEP = L / N;
  const uniforms = { uTime: { value: 0 } };

  /* ---- Le relief, calculé une fois pour toutes ---- */
  const rawH = (x, z) => {
    const f = B.freq;
    let n = noise(x * f + 40, z * f + 40, 5);
    if (B.terrace) {
      const t = n * B.terrace;
      const fl = Math.floor(t);
      n = (fl + smooth((t - fl - 0.35) / 0.3)) / B.terrace;
    }
    if (B.ridge) n = lerp(n, 1 - Math.abs(noise(x * f * 0.7 + 90, z * f * 0.7 - 30, 4) * 2 - 1), B.ridge);
    let h = (n - (B.base ?? 0.42)) * B.amp;
    h += (noise(x * f * 7 + 9, z * f * 7 - 3, 2) - 0.5) * B.amp * 0.05;
    // au bord du monde : le terrain monte et bloque le chemin, comme une vallée
    const d = Math.hypot(x, z);
    h += smooth((d - R * 0.92) / (R * 0.2)) * B.amp * 2.6;
    // le départ est dégagé
    const near = smooth(1 - d / (B.startR ?? 30));
    if (near > 0) h = lerp(h, B.startH ?? (WATER > -100 ? WATER + 0.3 : 0.3), near);
    return h;
  };
  const grid = new Float32Array((N + 1) * (N + 1));
  for (let j = 0; j <= N; j++) {
    for (let i = 0; i <= N; i++) grid[j * (N + 1) + i] = rawH(-L / 2 + i * STEP, -L / 2 + j * STEP);
  }
  const height = (x, z) => {
    const fx = clamp((x + L / 2) / STEP, 0, N - 0.001), fz = clamp((z + L / 2) / STEP, 0, N - 0.001);
    const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j;
    const a = grid[j * (N + 1) + i], b = grid[j * (N + 1) + i + 1], c = grid[(j + 1) * (N + 1) + i], d = grid[(j + 1) * (N + 1) + i + 1];
    return lerp(lerp(a, b, u), lerp(c, d, u), v);
  };
  const slope = (x, z, e = 1) => Math.hypot(height(x + e, z) - height(x - e, z), height(x, z + e) - height(x, z - e)) / (2 * e);

  /* ---- Le sol ---- */
  const geo = new THREE.PlaneGeometry(L, L, N, N);
  geo.rotateX(-Math.PI / 2);
  const P = geo.attributes.position;
  const colors = new Float32Array(P.count * 3);
  const G = {
    low: new THREE.Color(B.ground.low), mid: new THREE.Color(B.ground.mid),
    high: new THREE.Color(B.ground.high), rock: new THREE.Color(B.ground.rock), patch: new THREE.Color(B.ground.patch || B.ground.mid),
  };
  const col = new THREE.Color();
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), z = P.getZ(i);
    const y = height(x, z);
    P.setY(i, y);
    const hk = clamp((y - (WATER > -100 ? WATER : 0)) / (B.amp * 0.55), 0, 1);
    col.copy(G.low).lerp(G.mid, smooth(hk * 3.5));
    col.lerp(G.high, smooth((hk - 0.32) * 2.2));
    col.lerp(G.patch, smooth((noise(x * 0.06 + 5, z * 0.06, 3) - 0.48) * 7) * 0.65);
    const sl = slope(x, z, STEP);
    col.lerp(G.rock, smooth((sl - (B.rockSlope ?? 0.55)) * 3));
    const v = 0.93 + noise(x * 0.5, z * 0.5, 2) * 0.14;
    colors[i * 3] = col.r * v; colors[i * 3 + 1] = col.g * v; colors[i * 3 + 2] = col.b * v;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const uv = geo.attributes.uv;
  const rep = L / (B.texScale ?? 7);
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * rep, uv.getY(i) * rep);
  geo.computeVertexNormals();
  const tex = groundTexture(seed + 2);
  const groundMat = new THREE.MeshLambertMaterial({ vertexColors: true, map: tex });
  const ground = new THREE.Mesh(geo, groundMat);
  ground.receiveShadow = true;
  scene.add(ground);

  /* ---- L'eau : de petites vagues ---- */
  let water = null;
  if (WATER > -100) {
    const wg = new THREE.PlaneGeometry(L, L, Math.min(90, N >> 1), Math.min(90, N >> 1));
    wg.rotateX(-Math.PI / 2);
    const wm = new THREE.MeshPhongMaterial({ color: B.waterCol || '#3E8FA0', transparent: true, opacity: 0.8, flatShading: true, shininess: 90, specular: 0xBFE8EE });
    wm.onBeforeCompile = (s) => {
      s.uniforms.uTime = uniforms.uTime;
      s.vertexShader = `uniform float uTime;\n${s.vertexShader}`.replace('#include <begin_vertex>', `#include <begin_vertex>
        transformed.y += sin(position.x * 0.5 + uTime * 1.3) * 0.05 + cos(position.z * 0.43 + uTime * 1.05) * 0.05;`);
    };
    water = new THREE.Mesh(wg, wm);
    water.position.y = WATER;
    scene.add(water);
  }

  /* ---- Les montagnes au loin : on sent que le monde continue ---- */
  const far = new THREE.Group();
  const range = (dist, hMin, hMax, n, colr) => {
    const s = new Shape();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rnd() * 0.05;
      const w = 0.09 + rnd() * 0.1;
      const h = lerp(hMin, hMax, rnd());
      const peak = [Math.cos(a) * dist, h, Math.sin(a) * dist];
      for (let k = 0; k < 5; k++) {
        const a0 = a + ((k - 2.5) / 2.5) * w, a1 = a + ((k - 1.5) / 2.5) * w;
        const base0 = [Math.cos(a0) * dist * 1.04, -2, Math.sin(a0) * dist * 1.04];
        const base1 = [Math.cos(a1) * dist * 1.04, -2, Math.sin(a1) * dist * 1.04];
        s.tri(base0, peak, base1, new THREE.Color(colr).multiplyScalar(0.92 + (k % 2) * 0.12));
      }
    }
    return new THREE.Mesh(s.build(), new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide }));
  };
  far.add(range(R * 2.3, R * 0.1, R * 0.28, 42, B.far || B.sky.low));
  far.add(range(R * 2.8, R * 0.2, R * 0.46, 34, B.far2 || B.sky.mid));
  scene.add(far);

  /* ---- Le volcan (et sa colonne de fumée) ---- */
  let volcano = null;
  if (B.volcano) {
    const V = new THREE.Group();
    const s = new Shape();
    const vr = R * 0.75, vh = R * 0.58;
    const n = 14;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * TAU, a1 = ((i + 1) / n) * TAU;
      const b0 = [Math.cos(a0) * vr, 0, Math.sin(a0) * vr], b1 = [Math.cos(a1) * vr, 0, Math.sin(a1) * vr];
      const t0 = [Math.cos(a0) * vr * 0.15, vh, Math.sin(a0) * vr * 0.15], t1 = [Math.cos(a1) * vr * 0.15, vh, Math.sin(a1) * vr * 0.15];
      const dark = new THREE.Color('#2A2022').multiplyScalar(0.8 + (i % 3) * 0.2);
      s.tri(b0, t0, b1, dark); s.tri(b1, t0, t1, dark);
      if (i % 3 === 0) {
        // une coulée de lave
        const m0 = [lerp(t0[0], b0[0], 0.55), lerp(t0[1], b0[1], 0.55), lerp(t0[2], b0[2], 0.55)];
        s.tri([t0[0] * 1.02, t0[1], t0[2] * 1.02], [t1[0] * 1.02 * 0.2 + t0[0] * 0.8, t1[1], t1[2] * 1.02 * 0.2 + t0[2] * 0.8], [m0[0] * 1.02, m0[1], m0[2] * 1.02], '#FF6A1E');
      }
    }
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * TAU, a1 = ((i + 1) / n) * TAU;
      s.tri([0, vh, 0], [Math.cos(a1) * vr * 0.15, vh, Math.sin(a1) * vr * 0.15], [Math.cos(a0) * vr * 0.15, vh, Math.sin(a0) * vr * 0.15], '#FFB03A');
    }
    V.add(new THREE.Mesh(s.build(), new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide })));
    V.position.set(Math.cos(B.volcano) * R * 1.65, -1, Math.sin(B.volcano) * R * 1.65);
    scene.add(V);
    volcano = { group: V, top: new THREE.Vector3(V.position.x, vh - 1, V.position.z), h: vh };
    // la fumée : de grosses boules grises qui montent
    const smokeGeo = new THREE.IcosahedronGeometry(1, 1);
    const smoke = new THREE.InstancedMesh(smokeGeo, new THREE.MeshBasicMaterial({ color: '#3A3238', fog: false, transparent: true, opacity: 0.86 }), 26);
    smoke.frustumCulled = false;
    volcano.smoke = smoke;
    scene.add(smoke);
  }

  /* ---- Les forêts ---- */
  const obstacles = new Map();
  const CELL = 24;
  const cellKey = (x, z) => `${Math.floor(x / CELL)},${Math.floor(z / CELL)}`;
  const addObstacle = (x, z, r) => {
    const n = Math.ceil(r / CELL);
    for (let i = -n; i <= n; i++) {
      for (let j = -n; j <= n; j++) {
        const k = cellKey(x + i * CELL, z + j * CELL);
        if (!obstacles.has(k)) obstacles.set(k, []);
        obstacles.get(k).push({ x, z, r });
      }
    }
  };
  const hides = [];
  const meshes = [];
  const dummy = new THREE.Object3D();
  const matCache = new Map();
  const floraMat = (amp) => {
    if (!matCache.has(amp)) matCache.set(amp, windy(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), uniforms, amp));
    return matCache.get(amp);
  };
  const place = (V) => {
    const shape = FLORA[V.type](V.c || {});
    const geom = shape.build();
    const n = Math.round(V.n * (V.hide ? Math.max(quality.flora, 0.7) : quality.flora));
    let used = 0;
    const cells = new Map();
    const CS = R / 3.2;
    const clusterC = [];
    if (V.cluster) for (let i = 0; i < V.cluster; i++) clusterC.push([(rnd() * 2 - 1) * R * 0.85, (rnd() * 2 - 1) * R * 0.85]);
    for (let tries = 0; tries < n * 6 && used < n; tries++) {
      let x, z;
      if (clusterC.length) {
        const C = clusterC[Math.floor(rnd() * clusterC.length)];
        const a = rnd() * TAU, d = Math.sqrt(rnd()) * (V.spread ?? R * 0.14);
        x = C[0] + Math.cos(a) * d; z = C[1] + Math.sin(a) * d;
      } else {
        x = (rnd() * 2 - 1) * R; z = (rnd() * 2 - 1) * R;
      }
      const d0 = Math.hypot(x, z);
      if (d0 > R * 0.96 || d0 < (V.min ?? (B.startR ?? 30) * 0.45)) continue;
      const y = height(x, z);
      if (V.inWater ? y > WATER + 0.3 : y < WATER + 0.12) continue;
      if (slope(x, z, 2) > (V.maxSlope ?? 0.7)) continue;
      const s = lerp(V.s[0], V.s[1], rnd());
      dummy.position.set(x, y - 0.02 * s, z);
      dummy.rotation.set((rnd() - 0.5) * (V.tilt ?? 0.08), rnd() * TAU, (rnd() - 0.5) * (V.tilt ?? 0.08));
      dummy.scale.set(s * (V.wide ?? 1), s, s * (V.wide ?? 1));
      dummy.updateMatrix();
      const ck = `${Math.floor(x / CS)},${Math.floor(z / CS)}`;
      if (!cells.has(ck)) cells.set(ck, []);
      cells.get(ck).push(dummy.matrix.clone());
      used++;
      if (V.solid) addObstacle(x, z, s * V.solid);
      if (V.hide) hides.push({ x, z, r: s * V.hide });
    }
    for (const list of cells.values()) {
      const m = new THREE.InstancedMesh(geom, floraMat(V.wind ?? 0.04), list.length);
      m.castShadow = !!V.shadow && quality.shadows;
      list.forEach((mat, i) => m.setMatrixAt(i, mat));
      m.instanceMatrix.needsUpdate = true;
      m.computeBoundingSphere();
      m.userData.center = m.boundingSphere.center.clone();
      m.userData.radius = m.boundingSphere.radius;
      scene.add(m);
      meshes.push(m);
    }
  };
  B.flora.forEach(place);

  /* ---- Ce qui se mange (pour les herbivores) : des plantes qui repoussent ---- */
  const plants = [];
  let plantMesh = null;
  if (B.food) {
    const F = B.food;
    plantMesh = new THREE.InstancedMesh(FLORA[F.type](F.c).build(), floraMat(0.04), F.n);
    for (let i = 0; i < F.n; i++) {
      let x = 0, z = 0, ok = false;
      for (let t = 0; t < 12 && !ok; t++) {
        const a = rnd() * TAU, d = Math.sqrt(rnd()) * R * 0.86 + (B.startR ?? 30) * 0.5;
        x = Math.cos(a) * d; z = Math.sin(a) * d;
        ok = height(x, z) > WATER + 0.15 && slope(x, z, 2) < 0.65;
      }
      const s = lerp(F.s[0], F.s[1], rnd());
      plants.push({ x, y: height(x, z), z, s, alive: true, t: 0, i, a: rnd() * TAU });
    }
    plantMesh.frustumCulled = false;
    scene.add(plantMesh);
  }
  const setPlant = (p, k) => {
    if (!plantMesh) return;
    const s = p.s * k;
    dummy.position.set(p.x, p.y, p.z);
    dummy.rotation.set(0, p.a, 0);
    dummy.scale.set(Math.max(s, 0.0001), Math.max(s, 0.0001), Math.max(s, 0.0001));
    dummy.updateMatrix();
    plantMesh.setMatrixAt(p.i, dummy.matrix);
    plantMesh.instanceMatrix.needsUpdate = true;
  };
  plants.forEach((p) => setPlant(p, 1));

  /* ---- De l'herbe partout autour du joueur : c'est elle qui donne la vitesse ---- */
  let tufts = null;
  const TUFT = B.tuft;
  const tuftCount = Math.round(650 * quality.flora);
  if (TUFT) {
    tufts = new THREE.InstancedMesh(FLORA.herbe(TUFT.c).build(), floraMat(0.05), tuftCount);
    tufts.frustumCulled = false;
    scene.add(tufts);
  }
  let tuftCx = 1e9, tuftCz = 1e9;
  const updateTufts = (x, z) => {
    if (!tufts) return;
    const S = TUFT.cell;
    const cx = Math.round(x / S), cz = Math.round(z / S);
    if (cx === tuftCx && cz === tuftCz) return;
    tuftCx = cx; tuftCz = cz;
    let used = 0;
    const span = Math.floor(Math.sqrt(tuftCount) / 2);
    for (let i = -span; i < span && used < tuftCount; i++) {
      for (let j = -span; j < span && used < tuftCount; j++) {
        const ci = cx + i, cj = cz + j;
        const h1 = Math.abs(Math.sin(ci * 12.9898 + cj * 78.233) * 43758.5453) % 1;
        const h2 = Math.abs(Math.sin(ci * 39.346 + cj * 11.135) * 24634.6345) % 1;
        const px = (ci + h1) * S, pz = (cj + h2) * S;
        const y = height(px, pz);
        if (y < WATER + 0.06 || h1 < 0.1) continue;
        const s = TUFT.s * (0.65 + h2 * 0.8);
        dummy.position.set(px, y, pz);
        dummy.rotation.set(0, h1 * TAU, 0);
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        tufts.setMatrixAt(used++, dummy.matrix);
      }
    }
    tufts.count = used;
    tufts.instanceMatrix.needsUpdate = true;
  };

  /* ---- La lumière ---- */
  const sunDir = new THREE.Vector3(...(B.sunDir || [0.55, 0.8, 0.35])).normalize();
  const hemi = new THREE.HemisphereLight(B.light.sky, B.light.ground, B.light.hemi ?? 1.5);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(B.light.sun, B.light.power ?? 2.2);
  sun.position.copy(sunDir).multiplyScalar(80);
  if (quality.shadows) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(quality.shadowSize, quality.shadowSize);
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.03;
  }
  scene.add(sun);
  scene.add(sun.target);
  const skyObj = makeSky(B, sunDir);
  scene.add(skyObj.mesh);
  scene.fog = new THREE.Fog(B.fog.color, B.fog.near, B.fog.far);

  /* ---- La météorite : une étoile qui grossit, chapitre après chapitre ---- */
  let meteor = null;
  if (B.meteor) {
    const g = new THREE.Group();
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#FFF0C0', fog: false }));
    const glow = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7, 1), new THREE.MeshBasicMaterial({ color: '#FF8A2A', fog: false, transparent: true, opacity: 0.45 }));
    const tail = new THREE.Mesh(new THREE.ConeGeometry(1.3, 12, 8), new THREE.MeshBasicMaterial({ color: '#FFB25E', fog: false, transparent: true, opacity: 0.5 }));
    tail.position.y = 6.5;
    g.add(head, glow, tail);
    g.rotation.z = -0.9;
    scene.add(g);
    meteor = g;
  }

  return {
    height, slope, hides, plants, setPlant, water: WATER, radius: R, sunDir, volcano, meteor,
    /** Pousse un cercle hors des troncs et des rochers */
    collide(pos, r) {
      const list = obstacles.get(cellKey(pos.x, pos.z));
      if (!list) return false;
      let hit = false;
      for (const o of list) {
        const dx = pos.x - o.x, dz = pos.z - o.z, d = Math.hypot(dx, dz), m = o.r + r;
        if (d < m && d > 0.001) {
          pos.x = o.x + (dx / d) * m;
          pos.z = o.z + (dz / d) * m;
          hit = true;
        }
      }
      return hit;
    },
    inHide(x, z, r = 0) {
      for (const h of hides) {
        const dx = x - h.x, dz = z - h.z;
        if (dx * dx + dz * dz < (h.r - r) * (h.r - r)) return h;
      }
      return null;
    },
    update(t, cam, focus, shadowSpan) {
      uniforms.uTime.value = t;
      skyObj.uni.uTime.value = t;
      skyObj.mesh.position.copy(cam.position);
      skyObj.mesh.scale.setScalar(Math.min(cam.far * 0.9, 900) / 10);
      far.position.set(0, 0, 0);
      updateTufts(focus.x, focus.z);
      // ce qui est dans le brouillard n'est pas dessiné
      const farV = B.fog.far * 1.05;
      for (const m of meshes) {
        const c = m.userData.center;
        m.visible = Math.hypot(c.x - focus.x, c.z - focus.z) - m.userData.radius < farV;
      }
      if (water) { water.position.x = 0; }
      sun.target.position.copy(focus);
      sun.position.copy(focus).addScaledVector(sunDir, shadowSpan * 3);
      if (quality.shadows) {
        const C = sun.shadow.camera;
        if (C.right !== shadowSpan) {
          C.left = C.bottom = -shadowSpan;
          C.right = C.top = shadowSpan;
          C.near = 0.1;
          C.far = shadowSpan * 7;
          C.updateProjectionMatrix();
        }
      }
      if (volcano) {
        for (let i = 0; i < 26; i++) {
          const u = ((t * 0.035 + i / 26) % 1);
          const s = R * (0.05 + u * 0.28);
          dummy.position.set(volcano.top.x + Math.sin(i * 7.3 + u * 3) * s * 0.7 + u * R * 0.22, volcano.top.y + u * R * 0.9, volcano.top.z + Math.cos(i * 3.1) * s * 0.5);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.setScalar(s);
          dummy.updateMatrix();
          volcano.smoke.setMatrixAt(i, dummy.matrix);
        }
        volcano.smoke.instanceMatrix.needsUpdate = true;
      }
    },
    dispose() {
      const list = [];
      scene.traverse((o) => { list.push(o); });
      for (const o of list) {
        if (o.isBone || o.isSkinnedMesh) continue;
        if (o.geometry) o.geometry.dispose();
        if (o.material && !o.isSkinnedMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
      }
      tex.dispose();
    },
  };
}
