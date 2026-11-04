// ============================================================================
// Évolution 3D — le moteur du niveau des dinosaures. Caméra derrière l'animal,
// course dans toutes les directions, chasseurs qui traquent le joueur, cachettes,
// dangers de la nature, évolutions visibles sur le corps, et un duel à mort à la
// fin de chaque chapitre. Ce fichier ne connaît aucune espèce par son nom : tout
// est dans levels/vers-les-dinosaures.js.
//
// script.js lance startDinoGame(host) quand le niveau commence, et reprend la
// main à la fin (host.onFinish) pour le choix de la suite.
// ============================================================================

import * as THREE from 'three';
import { Animal } from './corps.js';
import { planOf } from './animaux.js';
import { createWorld } from './monde.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const turnTo = (a, b, m) => { const d = angDiff(a, b); return a + clamp(d, -m, m); };

/* ---------- Réglages ---------- */
const GROWTH_FULL = 100;
const GROWTH_RATE = 0.42;          // la part de ce qu'on mange qui fait grandir
const STAMINA_TIME = 3.2;          // s de sprint
const STAMINA_BACK = 4.5;          // s pour le recharger
const HIT_INVUL = 1.1;             // s d'invincibilité après un coup
const ATTACK_TIME = 0.34;
const ATTACK_COOLDOWN = 0.5;
const RESPAWN_TIME = 2.2;
const WINDUP = 0.62;               // le temps pour voir venir une morsure
const LUNGE_TIME = 0.34;
const RECOVER = 1.15;              // le chasseur reprend son souffle : c'est le moment !
const TIRED_BONUS = 2;             // pendant ce temps, les coups comptent double

export function startDinoGame(host) {
  const LV = host.level;
  const game = host.game;
  const F = LV.faune;
  const lines = LV.lines;
  const sfx = host.sfx;
  const debug = !!host.debug;
  const phone = !!host.isPhone;

  if (!game.dino) game.dino = { diet: null, growth: 0, picks: [], prog: {} };
  const D = game.dino;

  /* ---------- La qualité, selon l'appareil ---------- */
  const quality = phone
    ? { terrain: 110, flora: 0.42, shadows: false, shadowSize: 512, outline: false, pixel: Math.min(window.devicePixelRatio || 1, 1.25) }
    : { terrain: 190, flora: 1, shadows: true, shadowSize: 1536, outline: true, pixel: Math.min(window.devicePixelRatio || 1, 1.75) };

  /* ---------- L'écran ---------- */
  const root = document.createElement('div');
  root.id = 'dino3d';
  root.innerHTML = `
    <canvas class="d3-canvas"></canvas>
    <div class="d3-vignette" data-v="danger"></div>
    <div class="d3-vignette d3-hurt" data-v="hurt"></div>
    <div class="d3-vignette d3-hide" data-v="hide"></div>
    <div class="d3-bars">
      <div class="d3-bar d3-hp"><span class="d3-bar-icon">❤️</span><span class="d3-bar-track"><i data-b="hp"></i></span></div>
      <div class="d3-bar d3-grow"><span class="d3-bar-icon">📏</span><span class="d3-bar-track"><i data-b="grow"></i></span></div>
      <p class="d3-era"><b data-t="form"></b> · <span data-t="era"></span></p>
    </div>
    <div class="d3-hidden" data-t="hiddenBadge" hidden>🌿 Caché !</div>
    <div class="d3-missions"><button class="d3-mis-head" data-a="misToggle">🎯 <span data-t="chapTitle"></span></button><ol data-t="missions"></ol></div>
    <div class="d3-boss" data-t="bossBar" hidden><p data-t="bossName"></p><span class="d3-bar-track"><i data-b="boss"></i></span></div>
    <canvas class="d3-radar" width="340" height="340" aria-label="Radar : proies, chasseurs et cachettes"></canvas>
    <div class="d3-arrows" data-t="arrows"></div>
    <div class="d3-floaters" data-t="floaters"></div>
    <div class="d3-ammo"><div class="d3-ammo-face" data-t="ammoFace"></div><div class="d3-bubble" data-t="bubble"></div></div>
    <div class="photo-card fact-card d3-fact" data-t="fact" hidden>
      <div class="pc-pic"><img data-t="factImg" alt=""></div>
      <div class="pc-body">
        <p class="pc-tag"><span class="tag tag-new" data-t="factTag"></span></p>
        <p class="pc-name"><span data-t="factName"></span> <small data-t="factWhen"></small></p>
        <p class="pc-fact" data-t="factText"></p>
      </div>
    </div>
    <div class="d3-pad">
      <div class="d3-stick" data-t="stick"><div class="d3-knob" data-t="knob"></div></div>
      <div class="d3-actions">
        <button class="d3-act d3-dash" data-a="sprint"><span class="d3-act-fill" data-b="stamina"></span><span class="d3-act-txt">💨 <span class="d3-lab">Fonce</span> <kbd class="d3-key">Maj</kbd></span></button>
        <button class="d3-act d3-bite" data-a="attack"><span class="d3-act-txt"><span data-t="attackIcon">🦷</span> <span class="d3-lab" data-t="attackName">Mords</span> <kbd class="d3-key">F</kbd></span></button>
      </div>
    </div>
    <div class="d3-sound"><button data-a="sound" aria-label="Couper ou remettre le son">🔊</button></div>
    <div class="d3-letter d3-letter-top"></div><div class="d3-letter d3-letter-bot"></div>
    <div class="d3-title" data-t="bigTitle" hidden></div>
    <div class="d3-black" data-t="black"></div>
    <div class="d3-screen" data-t="screen" hidden></div>
  `;
  document.body.appendChild(root);
  document.body.classList.add('dino-on');
  const $ = (k) => root.querySelector(`[data-t="${k}"]`);
  const $b = (k) => root.querySelector(`[data-b="${k}"]`);
  const $v = (k) => root.querySelector(`[data-v="${k}"]`);
  const canvas = root.querySelector('.d3-canvas');
  const radar = root.querySelector('.d3-radar');
  const rctx = radar.getContext('2d');
  $('ammoFace').innerHTML = host.ammoSvg;
  root.querySelector('[data-a="sound"]').textContent = host.isSoundOn() ? '🔊' : '🔇';
  if (phone) root.classList.add('d3-phone');

  /* ---------- three.js ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !phone, powerPreference: 'high-performance' });
  renderer.setPixelRatio(quality.pixel);
  renderer.shadowMap.enabled = quality.shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  let scene = null, world = null;
  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 1200);
  let portraitRT = null;

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  /* ---------- Le chapitre et le héros ---------- */
  let CH = null, D3 = null, HERO = null, missions = [], evolutions = [];
  const stats = { run: 1, bite: 1, hp: 1, armor: 1, heal: 1, stamina: 1, graze: 1, ram: 1, radar: 1 };
  let p = null;                      // le joueur
  let creatures = [];
  let boss = null;
  let time = 0, slow = 1, slowT = 0;
  let paused = false, modal = false, finished = false, stopped = false;
  let cinematic = null;
  let camYaw = 0, camShake = 0, camPull = 0;
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
  let hurtFlash = 0;
  let duelState = 'none';            // none | ready | fight | won
  let drumT = 0, heartT = 0, heartClose = 0;
  let directorT = 15, hazardT = 20, rumbleT = 0, safeT = 8;
  let tipT = 28, tipI = 0, lastSay = 0, sayPrio = 0;
  let saveT = 0, seenT = 0;
  let attackReadyAt = 0;             // un seul chasseur attaque à la fois
  let botOn = false, botDirV = null, botT = 0;
  const botLog = [];
  let hazards = [];
  let frameCount = 0, fpsT = 0, fpsN = 0;
  const seen = game.seen || (game.seen = {});

  const heroDef = () => (D3.heroes ? D3.heroes[D.diet || 'carnivore'] : D3.hero);
  const missionsDef = () => (D3.missionsBy ? D3.missionsBy[D.diet || 'carnivore'] : D3.missions);
  const evolutionsDef = () => (D3.evolutionsBy ? D3.evolutionsBy[D.diet || 'carnivore'] : D3.evolutions);
  const herbivore = () => D.diet === 'herbivore' && !!D3.heroes;

  function recalcStats() {
    for (const k of Object.keys(stats)) stats[k] = 1;
    for (const id of D.picks) {
      const e = evolutions.find((x) => x.id === id);
      if (!e) continue;
      for (const [k, v] of Object.entries(e.effect)) stats[k] = (stats[k] || 1) * v;
    }
  }

  const heroScale = () => lerp(HERO.scale[0], HERO.scale[1], D.growth / GROWTH_FULL);
  const heroRadius = () => (p.plan.geometry.boundingSphere.radius * 0.17 * heroScale());
  const heroHpMax = () => HERO.hp * stats.hp;
  const heroBite = () => HERO.bite * stats.bite * (0.8 + 0.5 * D.growth / GROWTH_FULL);
  const heroReach = () => HERO.reach * heroScale();

  function mergedMods() {
    const mods = {};
    for (const id of D.picks) {
      const e = evolutions.find((x) => x.id === id);
      if (e && e.mods) Object.assign(mods, e.mods);
    }
    return Object.keys(mods).length ? mods : null;
  }

  function buildHero(x, z, yaw) {
    if (p && p.anim) { p.anim.dispose(); }
    const plan = planOf(HERO.animal, mergedMods());
    const anim = new Animal(plan, quality.outline);
    scene.add(anim.group);
    const old = p;
    p = {
      ...(old || {}), anim, plan, x, z, yaw, y: 0, vx: old ? old.vx : 0, vz: old ? old.vz : 0, speedNow: 0, yawRate: 0, attackT: 0, attackCD: 0,
      hp: old ? old.hp : 1, stamina: old ? old.stamina : 1, sprinting: false, invul: old ? old.invul : 2, dead: false, deadT: 0, hidden: false,
      moving: false, jawT: 0, roarT: 0, lean: 0, noiseT: 0, water: false, chasers: 0,
    };
  }

  /* ---------- Les bulles d'Ammo ---------- */
  function say(text, prio = 1, dur = 4800) {
    const now = performance.now();
    if (now < lastSay && prio < sayPrio) return;
    const b = $('bubble');
    b.textContent = text;
    b.classList.remove('show');
    void b.offsetWidth;
    b.classList.add('show');
    root.querySelector('.d3-ammo').classList.add('talking');
    lastSay = now + dur;
    sayPrio = prio;
    sfx.ammo();
  }
  const cool = {};
  function sayOnce(key, list, cd = 25, prio = 1) {
    if ((cool[key] || 0) > time) return;
    cool[key] = time + cd;
    say(typeof list === 'string' ? list : pick(list), prio);
  }

  /* ---------- Les petits textes qui montent ---------- */
  const floaters = [];
  function floater(text, x, y, z, color = '#FFD24A', size = 1) {
    const el = document.createElement('div');
    el.className = 'd3-floater';
    el.textContent = text;
    el.style.color = color;
    el.style.fontSize = `${1.25 * size}rem`;
    $('floaters').appendChild(el);
    floaters.push({ el, x, y, z, t: 0 });
    if (floaters.length > 14) { const f = floaters.shift(); f.el.remove(); }
  }
  const proj = new THREE.Vector3();
  function updateFloaters(dt) {
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i];
      f.t += dt;
      proj.set(f.x, f.y + f.t * 1.2 * (p ? heroScale() : 1), f.z).project(camera);
      if (f.t > 1.25 || proj.z > 1) { f.el.remove(); floaters.splice(i, 1); continue; }
      f.el.style.transform = `translate(calc(${((proj.x + 1) / 2) * 100}vw - 50%), ${((1 - proj.y) / 2) * 100}vh)`;
      f.el.style.opacity = f.t > 0.85 ? String(1 - (f.t - 0.85) / 0.4) : '1';
    }
  }

  /* ---------- Particules ---------- */
  const PART_MAX = 900;
  let partGeo = null, partPts = null, partI = 0;
  const part = { x: new Float32Array(PART_MAX), y: new Float32Array(PART_MAX), z: new Float32Array(PART_MAX), vx: new Float32Array(PART_MAX), vy: new Float32Array(PART_MAX), vz: new Float32Array(PART_MAX), life: new Float32Array(PART_MAX), max: new Float32Array(PART_MAX), g: new Float32Array(PART_MAX) };
  function makeParticles() {
    partGeo = new THREE.BufferGeometry();
    partGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PART_MAX * 3), 3));
    partGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(PART_MAX * 4), 4));
    partGeo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(PART_MAX), 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      vertexShader: `attribute float size; attribute vec4 color; varying vec4 vC; uniform float uScale; void main(){ vC=color; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=size*uScale/-mv.z; gl_Position=projectionMatrix*mv; }`,
      fragmentShader: `varying vec4 vC; void main(){ float d=length(gl_PointCoord-0.5); if(d>0.5) discard; gl_FragColor=vec4(vC.rgb, vC.a*smoothstep(0.5,0.22,d));
#include <colorspace_fragment>
      }`,
      uniforms: { uScale: { value: window.innerHeight * 0.9 } },
    });
    partPts = new THREE.Points(partGeo, mat);
    partPts.frustumCulled = false;
    scene.add(partPts);
    part.life.fill(0);
    part.max.fill(0);
  }
  const tmpCol = new THREE.Color();
  function spawnP(x, y, z, vx, vy, vz, life, size, color, g = 0) {
    const i = partI;
    partI = (partI + 1) % PART_MAX;
    part.x[i] = x; part.y[i] = y; part.z[i] = z;
    part.vx[i] = vx; part.vy[i] = vy; part.vz[i] = vz;
    part.life[i] = life; part.max[i] = life; part.g[i] = g;
    tmpCol.set(color);
    const c = partGeo.attributes.color;
    c.setXYZW(i, tmpCol.r, tmpCol.g, tmpCol.b, 1);
    partGeo.attributes.size.setX(i, size);
  }
  function burst(x, y, z, n, speed, size, colors, life = 0.6, g = 6) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, u = Math.random() * 2 - 1, s = speed * rnd(0.3, 1), sq = Math.sqrt(1 - u * u);
      spawnP(x, y, z, Math.cos(a) * sq * s, u * s * 0.8 + speed * 0.3, Math.sin(a) * sq * s, life * rnd(0.6, 1.2), size * rnd(0.6, 1.2), pick(colors), g);
    }
  }
  function updateParticles(dt) {
    const pos = partGeo.attributes.position, col = partGeo.attributes.color;
    for (let i = 0; i < PART_MAX; i++) {
      if (part.life[i] <= 0) { col.setW(i, 0); continue; }
      part.life[i] -= dt;
      part.vy[i] -= part.g[i] * dt;
      part.x[i] += part.vx[i] * dt;
      part.y[i] += part.vy[i] * dt;
      part.z[i] += part.vz[i] * dt;
      pos.setXYZ(i, part.x[i], part.y[i], part.z[i]);
      col.setW(i, clamp(part.life[i] / part.max[i], 0, 1) * 0.92);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
    partGeo.attributes.size.needsUpdate = true;
  }

  /* ---------- Les marques au sol : le danger se voit toujours avant ---------- */
  let decalPool = [];
  function makeDecals() {
    decalPool = [];
    for (let i = 0; i < 12; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: '#FF3B30', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, fog: false });
      const m = new THREE.Mesh(new THREE.CircleGeometry(1, 28), mat);
      m.rotation.x = -Math.PI / 2;
      m.visible = false;
      m.renderOrder = 3;
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.93, 1, 40), new THREE.MeshBasicMaterial({ color: '#FFE0A0', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, fog: false }));
      ring.renderOrder = 4;
      m.add(ring);
      scene.add(m);
      decalPool.push({ m, ring, used: false });
    }
  }
  function addDecal(x, z, r, life, opts = {}) {
    const d = decalPool.find((o) => !o.used);
    if (!d) return null;
    d.used = true;
    d.life = life; d.max = life; d.x = x; d.z = z; d.r = r; d.follow = opts.follow || null;
    d.sx = opts.sx || 1; d.sz = opts.sz || 1; d.yaw = opts.yaw || 0;
    d.m.visible = true;
    return d;
  }
  function updateDecals(dt) {
    for (const d of decalPool) {
      if (!d.used) continue;
      d.life -= dt;
      if (d.life <= 0) { d.used = false; d.m.visible = false; continue; }
      if (d.follow) { d.x = d.follow.x; d.z = d.follow.z; }
      const g = world.height(d.x, d.z);
      const k = 1 - d.life / d.max;
      d.m.position.set(d.x, Math.max(g, world.water) + 0.08 + d.r * 0.012, d.z);
      d.m.rotation.z = d.yaw;
      d.m.scale.set(d.r * d.sx, d.r * d.sz, 1);
      const pulse = 0.28 + 0.2 * Math.sin(k * 22) + k * 0.25;
      d.m.material.opacity = pulse;
      d.ring.material.opacity = 0.9;
    }
  }

  /* ---------- Les marques au-dessus des têtes ---------- */
  const markTex = {};
  function markTexture(sym, col) {
    const key = sym + col;
    if (markTex[key]) return markTex[key];
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = col;
    x.strokeStyle = '#1A0E0A';
    x.lineWidth = 8;
    x.beginPath();
    x.arc(64, 64, 52, 0, TAU);
    x.fill();
    x.stroke();
    x.fillStyle = '#FFFFFF';
    x.font = "800 84px 'Baloo 2', sans-serif";
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(sym, 64, 68);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    markTex[key] = t;
    return t;
  }
  function setMark(c, sym, col, dur) {
    if (!c.mark) {
      c.mark = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest: false, transparent: true, fog: false }));
      c.mark.renderOrder = 8;
      scene.add(c.mark);
    }
    c.mark.material.map = markTexture(sym, col);
    c.mark.material.needsUpdate = true;
    c.mark.visible = true;
    c.markT = dur;
  }

  /* ---------- Les créatures ---------- */
  const heightOf = (c) => {
    const g = world.height(c.x, c.z);
    return g;
  };
  function makeCreature(id, x, z, opts = {}) {
    const sp = F[id];
    const plan = planOf(sp.animal);
    const anim = new Animal(plan, quality.outline && (opts.boss || plan.geometry.boundingSphere.radius > 0.9));
    const scale = (opts.scale || sp.scale || 1) * rnd(0.94, 1.06);
    anim.group.scale.setScalar(scale);
    scene.add(anim.group);
    const c = {
      id, sp, plan, anim, x, z, y: world.height(x, z), yaw: Math.random() * TAU, scale, state: 'idle', t: 0, speedNow: 0, yawRate: 0,
      hp: (opts.hp || sp.hp), hpMax: (opts.hp || sp.hp), bite: opts.bite || sp.bite || 1, speed: opts.speed || sp.speed,
      r: plan.geometry.boundingSphere.radius * 0.26 * scale, gx: x, gz: z, jawT: 0, attackK: 0, roarK: 0, stunK: 0, dead: false, deadT: 0, boss: !!opts.boss,
      seed: Math.random() * 100, packId: opts.packId || 0, skip: 0, hitT: 0,
    };
    c.reach = (plan.geometry.boundingSphere.radius * 0.5 + 0.4) * scale;
    if (plan.flies) c.alt = (sp.alt || 3);
    creatures.push(c);
    return c;
  }

  function removeCreature(c) {
    c.dead = true;
    c.gone = true;
    c.anim.dispose();
    if (c.mark) { scene.remove(c.mark); c.mark.material.dispose(); }
  }

  /** Une place, hors de la vue, plutôt derrière le joueur */
  function spawnSpot(sp, behind = false) {
    const fog = D3.biome.fog;
    for (let tries = 0; tries < 14; tries++) {
      let a = Math.random() * TAU;
      if (behind) a = camYaw + Math.PI + rnd(-0.9, 0.9);
      const d = rnd(fog.near * 1.1, fog.far * 0.72);
      const x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
      if (Math.hypot(x, z) > world.radius * 0.9) continue;
      const g = world.height(x, z);
      if (sp.kind === 'swimmer' ? g > world.water - 0.7 : g < world.water + 0.05) continue;
      return { x, z };
    }
    return null;
  }

  function populate(initial) {
    const want = {};
    for (const [id, n] of D3.fauna) want[id] = Math.round(n * (phone ? 0.65 : 1));
    for (const c of creatures) if (!c.boss && !c.stamp) want[c.id] = (want[c.id] || 0) - 1;
    let added = 0;
    for (const [id] of D3.fauna) {
      const sp = F[id];
      const group = sp.pack || sp.herd || 1;
      while (want[id] > 0 && added < (initial ? 200 : 2)) {
        const spot = spawnSpot(sp, sp.kind === 'hunter' && !initial);
        if (!spot) break;
        const pid = Math.random();
        for (let k = 0; k < group && want[id] > 0; k++) {
          const x = spot.x + rnd(-3, 3) * group * (sp.scale || 1), z = spot.z + rnd(-3, 3) * group * (sp.scale || 1);
          const c = makeCreature(id, x, z, { packId: group > 1 ? pid : 0 });
          if (initial && sp.kind === 'hunter') c.t = rnd(0, 6);
          want[id]--;
          added++;
        }
      }
    }
  }

  /* ---------- Faire mal au joueur ---------- */
  function hurtPlayer(by, dmg, text = 'Aïe !') {
    if (p.dead || p.invul > 0 || duelCine()) return;
    const real = dmg * stats.armor;
    if (botOn) botLog.push(`${Math.round(time)} coup ${by ? by.id + ':' + by.state : text} -${real.toFixed(1)} (${p.hp.toFixed(1)})`);
    p.hp -= real;
    p.invul = HIT_INVUL;
    hurtFlash = 1;
    camShake = Math.max(camShake, 0.7);
    sfx.thud();
    host.buzz(80);
    floater(text, p.x, p.y + heroHeight() * 1.4, p.z, '#FF8F7A', 1.25);
    burst(p.x, p.y + heroHeight() * 0.6, p.z, 14, 5 * heroScale(), 0.35 * heroScale(), ['#FFD24A', '#FFFFFF', '#FF8F7A']);
    if (by) {
      const dx = p.x - by.x, dz = p.z - by.z, d = Math.hypot(dx, dz) || 1;
      p.vx += (dx / d) * HERO.run * 1.1;
      p.vz += (dz / d) * HERO.run * 1.1;
    }
    if (p.hp <= 0) killPlayer();
    else if (p.hp < heroHpMax() * 0.34) sayOnce('low', lines.low, 18, 3);
    else sayOnce('bitten', lines.bitten, 14, 2);
  }

  function killPlayer() {
    p.dead = true;
    p.deadT = RESPAWN_TIME;
    p.hp = 0;
    slow = 0.25;
    slowT = 0.8;
    if (duelState !== 'fight') D.growth = Math.max(0, D.growth - 8);
    game.stats.deaths++;
    if (botOn) { botDeaths++; botLog.push(`${Math.round(time)} MORT`); }
    say(pick(lines.eaten), 4, 3800);
    sfx.gulp();
    host.buzz([120, 60, 160]);
    if (duelState === 'fight' && boss) {
      boss.hp = Math.min(boss.hpMax, boss.hp + boss.hpMax * 0.12);
      say(pick(lines.bossLost), 4, 4000);
    }
    for (const c of creatures) {
      if (c.state !== 'idle' && !c.boss) { c.state = 'idle'; c.t = 0; c.rest = 8; }
    }
  }

  function respawn() {
    // on renaît dans la cachette la plus proche… pas trop près du danger
    let best = null, bd = Infinity;
    for (const h of world.hides) {
      const d = Math.hypot(h.x - p.x, h.z - p.z);
      if (d < bd && d > 12 * heroScale() && !creatures.some((c) => c.sp.kind === 'hunter' && Math.hypot(c.x - h.x, c.z - h.z) < 14 * heroScale())) { bd = d; best = h; }
    }
    if (best) { p.x = best.x; p.z = best.z; }
    p.vx = p.vz = 0;
    p.dead = false;
    p.hp = heroHpMax();
    p.stamina = 1;
    p.invul = 3;
    safeT = 12;
    p.anim.group.rotation.x = 0;
    updateScale();
    if (duelState === 'fight' && boss) {
      // il revient vers toi, et il est blessé
      const a = p.yaw + Math.PI;
      boss.x = p.x + Math.cos(a) * 34 * heroScale();
      boss.z = p.z + Math.sin(a) * 34 * heroScale();
      boss.state = 'circle';
      boss.t = 0;
    }
  }

  const heroHeight = () => p.plan.hipY * heroScale();

  /* ---------- Les coups du joueur ---------- */
  function startAttack() {
    if (!p || p.dead || p.attackCD > 0 || isFrozen()) return;
    p.attackT = ATTACK_TIME;
    p.attackCD = ATTACK_COOLDOWN;
    p.jawT = ATTACK_TIME;
    p.didHit = false;
    sfx.snap();
    // l'élan du coup, vers l'avant
    const fx = Math.cos(p.yaw), fz = Math.sin(p.yaw);
    p.vx += fx * HERO.run * 0.8;
    p.vz += fz * HERO.run * 0.8;
  }

  function attackHits() {
    // une zone devant la gueule (derrière, pour la queue du stégosaure)
    const fx = Math.cos(p.yaw), fz = Math.sin(p.yaw);
    const reach = heroReach();
    const dir = HERO.tailHit ? -1 : 1;
    const R = heroRadius();
    const cx = p.x + dir * fx * (R + reach * 0.7), cz = p.z + dir * fz * (R + reach * 0.7);
    let best = null, bd = Infinity;
    for (const c of creatures) {
      if (c.dead || c.gone) continue;
      if (c.alt && c.state !== 'dive' && c.state !== 'hover') continue;
      const d = Math.hypot(c.x - cx, c.z - cz) - c.r;
      if (d < reach * 1.1 && d < bd) { bd = d; best = c; }
    }
    return best;
  }
  const groundAt = (c) => world.height(c.x, c.z);

  function strikeCreature(c, mult = 1, ram = false) {
    const tired = c.state === 'recover' || c.stunK > 0.1;
    let dmg = heroBite() * mult * (tired ? TIRED_BONUS : 1);
    if (c.boss && !tired) dmg *= 0.5;
    c.hp -= dmg;
    c.hitT = 0.3;
    camShake = Math.max(camShake, tired ? 0.6 : 0.35);
    slow = 0.35;
    slowT = tired ? 0.12 : 0.05;
    sfx.eat(Math.min(1, c.r / 2));
    if (tired) sfx.thud();
    const col = tired ? '#FFD24A' : '#FFFFFF';
    floater(tired ? 'CRAC !' : (ram ? 'BAM !' : 'Croc !'), c.x, c.y + c.plan.hipY * c.scale * 1.6, c.z, col, tired ? 1.6 : 1.15);
    burst(c.x, c.y + c.plan.hipY * c.scale * 0.8, c.z, tired ? 18 : 10, 6 * Math.max(0.7, c.r * 0.6), 0.32 * Math.max(0.5, c.r), ['#FFD24A', '#FFFFFF', '#FFB03A']);
    if (!c.boss) {
      // un coup, ça fait reculer et ça arrête
      const dx = c.x - p.x, dz = c.z - p.z, d = Math.hypot(dx, dz) || 1;
      c.x += (dx / d) * 0.4 * c.scale;
      c.z += (dz / d) * 0.4 * c.scale;
      if (c.sp.kind === 'neutral') { c.state = 'flee'; c.t = 0; }
      if (c.sp.kind === 'hunter' && c.state === 'idle') { c.state = 'chase'; c.t = 0; }
    }
    if (c.hp <= 0) defeatCreature(c);
    else if (c.boss && c.state !== 'recover' && Math.random() < 0.25) { c.state = 'circle'; c.t = 0; }
  }

  function defeatCreature(c) {
    if (c.boss) { winDuel(c); return; }
    c.dead = true;
    c.deadT = 2.4;
    c.state = 'dead';
    D.prog.defeated = D.prog.defeated || {};
    D.prog.eaten = D.prog.eaten || {};
    D.prog.defeated[c.id] = (D.prog.defeated[c.id] || 0) + 1;
    const carn = !herbivore();
    if (carn) D.prog.eaten[c.id] = (D.prog.eaten[c.id] || 0) + 1;
    game.stats.eaten++;
    game.adn += c.sp.adn || 0;
    const food = (c.sp.food || 0) * (carn ? 1 : 0.55);
    feed(food, c);
    if (carn) { p.jawT = 0.3; sfx.gulp(); }
    floater(`+${c.sp.adn || 0} 🧬`, c.x, c.y + c.plan.hipY * c.scale * 2, c.z, '#FFE58A', 1);
    burst(c.x, c.y + c.plan.hipY * c.scale, c.z, 16, 5, 0.3 * Math.max(0.6, c.r), ['#FFE58A', '#FFFFFF']);
    checkMissions();
  }

  function feed(food, from) {
    if (food <= 0) return;
    p.hp = Math.min(heroHpMax(), p.hp + heroHpMax() * 0.07 * stats.heal * (food / 10));
    const before = D.growth;
    D.growth = Math.min(GROWTH_FULL, D.growth + food * GROWTH_RATE);
    updateScale();
    if (Math.floor(before / 20) !== Math.floor(D.growth / 20)) {
      floater('Tu grandis !', p.x, p.y + heroHeight() * 1.8, p.z, '#7CF0A0', 1.15);
      sfx.pickup();
      sayOnce('grow', lines.grow, 40, 1);
      burst(p.x, p.y + heroHeight() * 0.5, p.z, 22, 4 * heroScale(), 0.28 * heroScale(), ['#7CF0A0', '#FFE58A', '#FFFFFF'], 0.8, 3);
    }
    // une évolution à choisir, à 40 % et à 80 %
    for (const th of [40, 80]) {
      if (before < th && D.growth >= th) later(() => openEvolution(), 0.3);
    }
    checkMissions();
  }

  function updateScale() {
    p.anim.group.scale.setScalar(heroScale());
  }

  /* ---------- Les chutes de temps : une petite file d'attente ---------- */
  const timers = [];
  function later(fn, s) { timers.push({ at: time + s, fn }); }
  function runTimers() {
    for (let i = timers.length - 1; i >= 0; i--) {
      if (timers[i].at <= time) { const t = timers[i]; timers.splice(i, 1); t.fn(); }
    }
  }

  /* ---------- Le cerveau des animaux ---------- */
  function steerTo(c, tx, tz, speed, dt, turn = 3.2) {
    const dx = tx - c.x, dz = tz - c.z, d = Math.hypot(dx, dz);
    if (d > 0.01) {
      const want = Math.atan2(dz, dx);
      const prev = c.yaw;
      c.yaw = turnTo(c.yaw, want, turn * dt);
      c.yawRate = lerp(c.yawRate, angDiff(prev, c.yaw) / Math.max(dt, 0.001), 0.3);
    }
    c.speedNow += (speed - c.speedNow) * Math.min(1, dt * 4);
    const step = c.speedNow * dt;
    c.x += Math.cos(c.yaw) * step;
    c.z += Math.sin(c.yaw) * step;
  }

  function canSense(c, d) {
    const sense = c.sp.sense * Math.max(1, c.scale * 0.5);
    if (safeT > 0 || p.dead) return false;
    if (p.hidden) return d < c.r + heroRadius() + 1.2 * heroScale();  // caché : seulement s'il te marche dessus
    const k = p.noiseT > 0 ? 1.7 : p.moving ? 1 : 0.62;
    return d < sense * k;
  }

  const activeChasers = () => creatures.filter((o) => !o.dead && !o.boss && (o.state === 'chase' || o.state === 'alert' || o.state === 'windup' || o.state === 'lunge')).length;

  /** Celui qui a peur de toi : tu es trop fort pour lui */
  const fearsPlayer = (c) => !c.boss && heroBite() > c.hp * 1.05 && c.sp.kind === 'hunter' && D.growth > 25;

  function thinkHunter(c, d, dt) {
    const sp = c.sp;
    if (c.rest > 0) c.rest -= dt;
    c.t += dt;
    switch (c.state) {
      case 'idle': {
        if (Math.hypot(c.gx - c.x, c.gz - c.z) < 3 * c.scale || c.t > 7) {
          const a = Math.random() * TAU, dd = rnd(10, 32) * Math.max(0.6, c.scale);
          // sans rien savoir, il rôde vers le joueur : on n'est jamais tranquille
          const toward = Math.random() < 0.42;
          c.gx = toward ? p.x + rnd(-1, 1) * dd : c.x + Math.cos(a) * dd;
          c.gz = toward ? p.z + rnd(-1, 1) * dd : c.z + Math.sin(a) * dd;
          c.t = 0;
        }
        steerTo(c, c.gx, c.gz, c.speed * 0.32, dt, 2);
        if (!(c.rest > 0) && canSense(c, d) && (fearsPlayer(c) || c.packId || activeChasers() < 2)) {
          if (fearsPlayer(c)) {
            c.state = 'flee'; c.t = 0;
            sayOnce('turn', lines.turnTables, 90, 1);
          } else {
            c.state = 'alert';
            c.t = 0;
            setMark(c, '!', '#E5392F', 0.9);
            sfx.alert();
            if (p.noiseT > 0) sayOnce('noise', lines.noise, 28, 2); else sayOnce('spotted', lines.spotted, 16, 2);
            // la meute arrive aussi
            if (c.packId) for (const o of creatures) if (o.packId === c.packId && o !== c && o.state === 'idle') { o.state = 'alert'; o.t = -0.2; }
            if (c.r > 1.4) { sfx.roar(Math.min(1.3, c.r / 3 + 0.3)); c.roarT = 0.9; camShake = Math.max(camShake, 0.3); }
          }
        }
        break;
      }
      case 'alert':
        c.speedNow *= Math.exp(-6 * dt);
        c.yaw = turnTo(c.yaw, Math.atan2(p.z - c.z, p.x - c.x), 6 * dt);
        if (c.t > 0.55) { c.state = 'chase'; c.t = 0; c.chaseT = 0; }
        break;
      case 'chase': {
        c.chaseT = (c.chaseT || 0) + dt;
        if (p.dead) { c.state = 'idle'; break; }
        // caché, et assez loin : il ne sait plus où tu es
        if (p.hidden && d > c.r + heroRadius() + 1.2 * heroScale()) {
          c.state = 'search';
          c.t = 0;
          c.gx = p.x + rnd(-3, 3) * heroScale();
          c.gz = p.z + rnd(-3, 3) * heroScale();
          setMark(c, '?', '#E5A52F', 1.4);
          sayOnce('hidden', lines.hidden, 12, 2);
          break;
        }
        if (d > c.sp.sense * Math.max(1, c.scale * 0.5) * 2.1 || c.chaseT > 16) {
          c.state = 'idle'; c.t = 0; c.rest = 4;
          sayOnce('lost', lines.lost, 20, 2);
          sfx.phew();
          game.stats.escapes++;
          break;
        }
        // la meute arrive de plusieurs côtés
        let tx = p.x + p.vx * 0.35, tz = p.z + p.vz * 0.35;
        if (c.packId) {
          const a = (c.seed * 7) % TAU;
          const k = clamp((d - c.reach) / 14, 0, 1);
          tx += Math.cos(a) * 7 * k * heroScale();
          tz += Math.sin(a) * 7 * k * heroScale();
        }
        const boost = d > 26 * heroScale() ? 1.22 : 1;
        steerTo(c, tx, tz, c.speed * boost, dt, 4.6);
        if (d < c.reach + heroRadius() + c.speedNow * 0.2 && attackReadyAt <= time) {
          attackReadyAt = time + 1.5;
          startWindup(c);
        }
        break;
      }
      case 'search':
        steerTo(c, c.gx, c.gz, c.speed * 0.55, dt, 2.5);
        if (Math.hypot(c.gx - c.x, c.gz - c.z) < 2 * c.scale) { c.gx = c.x + rnd(-14, 14); c.gz = c.z + rnd(-14, 14); }
        if (!p.hidden && canSense(c, d)) { c.state = 'chase'; c.t = 0; break; }
        if (c.t > 4.5) {
          c.state = 'idle'; c.t = 0; c.rest = 5;
          if (p.hidden) {
            D.prog.hide = (D.prog.hide || 0) + 1;
            game.stats.escapes++;
            sayOnce('lost', lines.lost, 8, 3);
            sfx.phew();
            floater('Ouf, il t\'a perdu !', p.x, p.y + heroHeight() * 1.6, p.z, '#9EE7FF', 1.1);
            checkMissions();
          }
        }
        break;
      case 'windup':
        c.speedNow *= Math.exp(-9 * dt);
        c.yaw = turnTo(c.yaw, Math.atan2(p.z - c.z, p.x - c.x), 3.5 * dt);
        c.attackK = -clamp(c.t / WINDUP, 0, 1) * 0.5;
        c.jawT = 0.2;
        if (c.t > WINDUP * (c.packId ? 1.15 : 1)) {
          c.state = 'lunge';
          c.t = 0;
          c.hitDone = false;
          sfx.snap();
        }
        break;
      case 'lunge': {
        const v = Math.max(c.speed * 1.6, (c.reach * 1.5) / LUNGE_TIME);
        c.speedNow = v;
        c.x += Math.cos(c.yaw) * v * dt;
        c.z += Math.sin(c.yaw) * v * dt;
        c.attackK = 1;
        c.jawT = 0.2;
        if (!c.hitDone && touchesPlayerMouth(c)) {
          c.hitDone = true;
          c.bit = true;
          hurtPlayer(c, c.bite, c.sp.hurt || 'Aïe !');
        }
        if (c.t > LUNGE_TIME) {
          c.state = 'recover';
          c.t = 0;
          c.speedNow *= 0.3;
        }
        break;
      }
      case 'recover':
        c.speedNow *= Math.exp(-8 * dt);
        c.attackK = 0;
        c.stunK = 0.5;
        if (c.t > RECOVER) {
          c.stunK = 0;
          c.t = 0;
          if (c.bit) {
            // il a mordu : il s'éloigne un moment, pour mieux revenir
            c.bit = false;
            c.state = 'idle';
            c.rest = rnd(4, 7);
            const a = Math.random() * TAU;
            c.gx = p.x + Math.cos(a) * 30 * heroScale();
            c.gz = p.z + Math.sin(a) * 30 * heroScale();
          } else {
            c.state = 'chase';
          }
        }
        break;
      case 'flee':
        if (c.t > 7 || d > 50 * heroScale()) { c.state = 'idle'; c.t = 0; c.rest = 3; break; }
        steerTo(c, c.x + (c.x - p.x), c.z + (c.z - p.z), c.speed * 1.05, dt, 4);
        break;
      default:
        c.state = 'idle';
    }
    if (sp.kind === 'hunter' && c.state === 'chase') heartClose = Math.max(heartClose, 1 - clamp(d / (34 * heroScale()), 0, 1));
  }

  function touchesPlayerMouth(c) {
    const fx = Math.cos(c.yaw), fz = Math.sin(c.yaw);
    const mx = c.x + fx * c.reach * 0.9, mz = c.z + fz * c.reach * 0.9;
    return Math.hypot(mx - p.x, mz - p.z) < c.reach * 0.55 + heroRadius() * 1.2;
  }

  function startWindup(c) {
    c.state = 'windup';
    c.t = 0;
    const L = c.reach * 1.6;
    const yaw = c.yaw;
    addDecal(c.x + Math.cos(yaw) * L * 0.75, c.z + Math.sin(yaw) * L * 0.75, c.reach * 0.75, WINDUP * 0.95, { });
    sfx.alert();
  }

  function thinkPrey(c, d, dt) {
    c.t += dt;
    if (c.state === 'flee' || (c.sp.sense && d < c.sp.sense * (p.sprinting ? 1.4 : 1) && !p.hidden)) {
      if (c.state !== 'flee') { c.state = 'flee'; c.t = 0; }
      if (d > c.sp.sense * 1.9 || c.t > 9) { c.state = 'idle'; c.t = 0; }
      else {
        const a = Math.atan2(c.z - p.z, c.x - p.x) + Math.sin(time * 3 + c.seed) * 0.55;
        steerTo(c, c.x + Math.cos(a) * 10, c.z + Math.sin(a) * 10, c.speed, dt, 7);
      }
      return;
    }
    if (Math.hypot(c.gx - c.x, c.gz - c.z) < 1.4 * c.scale || c.t > 6) {
      const a = Math.random() * TAU, dd = rnd(3, 12) * c.scale;
      c.gx = c.x + Math.cos(a) * dd;
      c.gz = c.z + Math.sin(a) * dd;
      c.t = 0;
      c.pause = Math.random() < 0.45 ? rnd(0.5, 2.5) : 0;
    }
    if (c.pause > 0) { c.pause -= dt; c.speedNow *= Math.exp(-5 * dt); return; }
    steerTo(c, c.gx, c.gz, c.speed * 0.28, dt, 3);
  }

  function thinkDefender(c, d, dt) {
    c.t += dt;
    switch (c.state) {
      case 'charge': {
        const v = c.speed * 1.55;
        c.speedNow = v;
        c.yaw = turnTo(c.yaw, Math.atan2(p.z - c.z, p.x - c.x), 0.9 * dt);
        c.x += Math.cos(c.yaw) * v * dt;
        c.z += Math.sin(c.yaw) * v * dt;
        c.attackK = 0.7;
        if (!c.hitDone && touchesPlayerMouth(c)) { c.hitDone = true; hurtPlayer(c, c.bite, 'Bam !'); }
        if (c.t > 1.6) { c.state = 'recover'; c.t = 0; }
        break;
      }
      case 'recover':
        c.speedNow *= Math.exp(-6 * dt);
        c.attackK = 0;
        c.stunK = 0.5;
        if (c.t > 1.4) { c.state = 'idle'; c.t = 0; c.stunK = 0; c.rest = 2; }
        break;
      case 'alert':
        c.speedNow *= Math.exp(-6 * dt);
        c.yaw = turnTo(c.yaw, Math.atan2(p.z - c.z, p.x - c.x), 4 * dt);
        if (c.t > 0.6) { c.state = 'charge'; c.t = 0; c.hitDone = false; sfx.stomp(0.8); }
        break;
      default: {
        if (c.rest > 0) c.rest -= dt;
        thinkGraze(c, dt);
        if (!(c.rest > 0) && safeT <= 0 && !p.dead && !p.hidden && d < c.sp.sense * Math.max(1, c.scale * 0.5) + heroRadius()) {
          c.state = 'alert'; c.t = 0;
          setMark(c, '!', '#E5392F', 0.9);
          sfx.alert();
          sayOnce('defender', "Il baisse la tête… Il charge ! Écarte-toi !", 22, 2);
        }
      }
    }
  }

  function thinkGraze(c, dt) {
    c.t += dt;
    if (Math.hypot(c.gx - c.x, c.gz - c.z) < 2 * c.scale || c.t > 9) {
      const a = Math.random() * TAU, dd = rnd(6, 22) * Math.max(0.5, c.scale);
      c.gx = c.x + Math.cos(a) * dd;
      c.gz = c.z + Math.sin(a) * dd;
      c.t = 0;
      c.pause = Math.random() < 0.5 ? rnd(1.5, 5) : 0;
    }
    if (c.pause > 0) {
      c.pause -= dt;
      c.speedNow *= Math.exp(-4 * dt);
      c.grazeK = Math.min(1, (c.grazeK || 0) + dt);
      return;
    }
    c.grazeK = Math.max(0, (c.grazeK || 0) - dt);
    steerTo(c, c.gx, c.gz, c.speed * 0.3, dt, 1.4);
  }

  /** Un géant : il marche droit devant, le sol tremble, et ses pieds écrasent */
  function thinkGiant(c, d, dt) {
    c.t += dt;
    if (Math.hypot(c.gx - c.x, c.gz - c.z) < 6 || c.t > 26) {
      // ils passent souvent près du joueur : c'est là qu'on a peur
      const near = Math.random() < 0.6;
      c.gx = near ? p.x + rnd(-40, 40) : c.x + rnd(-90, 90);
      c.gz = near ? p.z + rnd(-40, 40) : c.z + rnd(-90, 90);
      c.t = 0;
    }
    steerTo(c, c.gx, c.gz, c.speed * 0.9, dt, 0.45);
    // chaque pas fait trembler le sol
    const step = Math.floor(c.anim.ph * 2);
    if (step !== c.lastStep) {
      c.lastStep = step;
      const k = clamp(1 - d / (130), 0, 1);
      if (k > 0.05) {
        sfx.stomp(k);
        camShake = Math.max(camShake, k * 0.42);
        if (k > 0.5) sayOnce('giant', lines.giant, 50, 1);
      }
    }
    // les pattes écrasent vraiment : on regarde où elles sont
    if (d < c.r * 3 + 6 && p.invul <= 0 && !p.dead) {
      const pos = new THREE.Vector3();
      for (const L of c.plan.legs) {
        c.anim.bones[L.joints[3]].getWorldPosition(pos);
        const R = (L.lens[0] * 0.28 + 0.4) * c.scale;
        if (pos.y - c.y < 0.5 * c.scale && Math.hypot(pos.x - p.x, pos.z - p.z) < R + heroRadius() * 0.8) {
          hurtPlayer(c, c.bite, 'Écrasé !');
          break;
        }
      }
    }
  }

  /** Dans l'eau : il guette, il attrape au bord */
  function thinkSwimmer(c, d, dt) {
    c.t += dt;
    const inWater = (x, z) => world.height(x, z) < world.water - 0.45;
    if (c.state === 'lunge') {
      const v = c.speed * 2.3;
      c.speedNow = v;
      const nx = c.x + Math.cos(c.yaw) * v * dt, nz = c.z + Math.sin(c.yaw) * v * dt;
      c.x = nx; c.z = nz;
      c.attackK = 1;
      c.jawT = 0.2;
      if (!c.hitDone && touchesPlayerMouth(c)) { c.hitDone = true; hurtPlayer(c, c.bite, 'Aïe, les dents !'); }
      if (c.t > 0.4) { c.state = 'recover'; c.t = 0; }
      return;
    }
    if (c.state === 'recover') {
      c.speedNow *= Math.exp(-5 * dt);
      c.attackK = 0;
      c.stunK = 0.4;
      if (!inWater(c.x, c.z)) {
        // il retourne à l'eau
        c.x += (c.hx - c.x) * dt * 1.5;
        c.z += (c.hz - c.z) * dt * 1.5;
      }
      if (c.t > 1.4) { c.state = 'idle'; c.t = 0; c.stunK = 0; }
      return;
    }
    if (inWater(c.x, c.z)) { c.hx = c.x; c.hz = c.z; }
    const close = !p.dead && safeT <= 0 && d < c.sp.sense && (p.water || world.height(p.x, p.z) < world.water + 0.6);
    if (close) {
      if (d < c.reach + heroRadius() + 2) {
        c.state = 'windupW';
        c.yaw = turnTo(c.yaw, Math.atan2(p.z - c.z, p.x - c.x), 7 * dt);
        c.speedNow *= Math.exp(-7 * dt);
        c.wt = (c.wt || 0) + dt;
        c.jawT = 0.2;
        if (c.wt > 0.55) { c.wt = 0; c.state = 'lunge'; c.t = 0; c.hitDone = false; sfx.splash(); }
        return;
      }
      if (inWater(c.x + Math.cos(Math.atan2(p.z - c.z, p.x - c.x)), c.z + Math.sin(Math.atan2(p.z - c.z, p.x - c.x)))) {
        steerTo(c, p.x, p.z, c.speed, dt, 3);
        heartClose = Math.max(heartClose, 1 - clamp(d / 20, 0, 1));
        sayOnce('hyneria', "Dans l'eau, il va plus vite que toi ! Sors de là !", 25, 2);
        return;
      }
    }
    c.state = 'idle';
    if (Math.hypot(c.gx - c.x, c.gz - c.z) < 2 || c.t > 5 || !inWater(c.gx, c.gz)) {
      const a = Math.random() * TAU, dd = rnd(6, 16);
      const gx = c.x + Math.cos(a) * dd, gz = c.z + Math.sin(a) * dd;
      if (inWater(gx, gz)) { c.gx = gx; c.gz = gz; }
      c.t = 0;
    }
    steerTo(c, c.gx, c.gz, c.speed * 0.3, dt, 2);
  }

  /** Dans les airs : il tourne, puis il pique */
  function thinkFlyer(c, d, dt) {
    c.t += dt;
    const ground = world.height(c.x, c.z);
    const base = Math.max(ground, world.water) + c.alt * Math.max(1, heroHeight() * 1.4);
    if (c.state === 'dive') {
      c.yaw = turnTo(c.yaw, Math.atan2(p.z - c.z, p.x - c.x), 2.8 * dt);
      c.speedNow = c.speed * 1.5;
      c.x += Math.cos(c.yaw) * c.speedNow * dt;
      c.z += Math.sin(c.yaw) * c.speedNow * dt;
      c.flyY = lerp(c.flyY, p.y + heroHeight() * 0.9, dt * 3.4);
      c.jawT = 0.2;
      if (!c.hitDone && d < c.r + heroRadius() + 0.8 * heroScale() && Math.abs(c.flyY - (p.y + heroHeight())) < heroHeight() * 1.3) {
        c.hitDone = true;
        hurtPlayer(c, c.bite, 'Aïe !');
      }
      if (c.t > 2.1 || c.hitDone) { c.state = 'hover'; c.t = 0; }
      return;
    }
    if (c.state === 'hover') {
      c.speedNow *= Math.exp(-5 * dt);
      c.stunK = 0.5;
      c.flyY = lerp(c.flyY, p.y + heroHeight() * 0.8, dt * 2);
      if (c.t > 2.4) { c.state = 'rise'; c.t = 0; c.stunK = 0; }
      return;
    }
    c.flyY = lerp(c.flyY ?? base, base, dt * (c.state === 'rise' ? 1.6 : 0.8));
    const a = c.seed + time * 0.5;
    const R = 22 * Math.max(1, heroScale());
    steerTo(c, p.x + Math.cos(a) * R, p.z + Math.sin(a) * R, c.speed * 0.8, dt, 1.5);
    if (c.state !== 'rise' && c.t > 8 && attackReadyAt <= time && safeT <= 0 && !p.dead && !p.hidden && d < c.sp.sense * Math.max(1, heroScale()) && Math.random() < dt * 0.5) {
      attackReadyAt = time + 3;
      c.state = 'dive';
      c.t = 0;
      c.hitDone = false;
      setMark(c, '!', '#E5392F', 0.8);
      sfx.alert();
    } else if (c.state === 'rise' && c.t > 2) {
      c.state = 'idle';
      c.t = 0;
    }
  }

  /* ---------- Le duel ---------- */
  function startDuel() {
    if (duelState !== 'none') return;
    duelState = 'ready';
    const B = D3.boss;
    // les autres s'écartent : c'est entre vous deux
    for (const c of creatures) if (c.sp.kind === 'hunter' || c.sp.kind === 'defender') { c.state = 'flee'; c.t = 0; c.rest = 90; }
    const a = p.yaw;
    const dist = 36 * heroScale();
    let x = p.x + Math.cos(a) * dist, z = p.z + Math.sin(a) * dist;
    if (Math.hypot(x, z) > world.radius * 0.85 || world.height(x, z) < world.water + 0.1) {
      x = p.x - Math.cos(a) * dist;
      z = p.z - Math.sin(a) * dist;
    }
    boss = makeCreature(B.species, x, z, { boss: true, scale: B.scale, hp: B.hp, bite: B.bite, speed: B.speed });
    boss.yaw = Math.atan2(p.z - z, p.x - x);
    boss.state = 'intro';
    boss.t = 0;
    cinematic = { type: 'duel', t: 0, dur: botOn ? 0.1 : 4 };
    root.classList.add('d3-cine');
    $('bigTitle').innerHTML = `<small>DUEL</small>${esc(B.title)}`;
    $('bigTitle').hidden = false;
    sfx.alert();
    later(() => { sfx.roar(1.3); boss.roarT = 1.8; camShake = Math.max(camShake, 0.9); }, 0.8);
    say(B.line, 5, 5200);
    game.adn += 0;
  }

  function endDuelIntro() {
    cinematic = null;
    root.classList.remove('d3-cine');
    $('bigTitle').hidden = true;
    duelState = 'fight';
    boss.state = 'circle';
    boss.t = 0;
    $('bossBar').hidden = false;
    $('bossName').textContent = D3.boss.title;
  }

  const duelCine = () => !!cinematic;

  function thinkBoss(c, d, dt) {
    c.t += dt;
    const rage = c.hp < c.hpMax * 0.5 ? 1.25 : 1;
    const toP = Math.atan2(p.z - c.z, p.x - c.x);
    const scaleP = heroScale();
    switch (c.state) {
      case 'intro':
        c.yaw = turnTo(c.yaw, toP, 2 * dt);
        break;
      case 'circle': {
        // il tourne autour de toi, il te jauge
        const side = c.seed % 2 > 1 ? 1 : -1;
        const a = toP + Math.PI + side * (0.9 + c.t * 0.5);
        const R = Math.max(c.reach * 2.4, 11 * scaleP);
        steerTo(c, p.x + Math.cos(a) * R, p.z + Math.sin(a) * R, c.speed * 0.8 * rage, dt, 4.8);
        if (c.t > 1.5 / rage && !p.dead) {
          const r = Math.random();
          c.t = 0;
          if (d > c.reach * 4 && r < 0.45) {
            // la charge : une longue ligne droite
            c.state = 'chargeWind';
            const yaw = toP;
            const len = Math.max(30, d + 8) * 0.5;
            addDecal(c.x + Math.cos(yaw) * len, c.z + Math.sin(yaw) * len, 1, 0.85, { sx: c.reach * 0.55, sz: len, yaw: yaw - Math.PI / 2 + Math.PI });
            c.chargeYaw = yaw;
            sfx.alert();
          } else if (r < 0.3) {
            // le rugissement : une onde tout autour
            c.state = 'roarWind';
            addDecal(c.x, c.z, c.reach * 3.6, 1.05, {});
            sfx.alert();
            c.roarT = 1.05;
          } else {
            c.state = 'approach';
          }
        }
        break;
      }
      case 'approach':
        steerTo(c, p.x + p.vx * 0.3, p.z + p.vz * 0.3, c.speed * 1.25 * rage, dt, 5.5);
        if (d < c.reach + heroRadius() + c.speedNow * 0.2) { startWindup(c); }
        else if (c.t > 3) { c.state = 'circle'; c.t = 0; }
        break;
      case 'chargeWind':
        c.speedNow *= Math.exp(-8 * dt);
        c.yaw = turnTo(c.yaw, c.chargeYaw, 8 * dt);
        c.attackK = -0.4;
        c.jawT = 0.2;
        if (c.t > 0.85 / rage) { c.state = 'charge'; c.t = 0; c.hitDone = false; sfx.roar(0.9); camShake = Math.max(camShake, 0.4); }
        break;
      case 'charge': {
        const v = c.speed * 2.2 * rage;
        c.speedNow = v;
        c.x += Math.cos(c.yaw) * v * dt;
        c.z += Math.sin(c.yaw) * v * dt;
        c.attackK = 0.85;
        c.jawT = 0.25;
        if (Math.random() < dt * 20) burst(c.x, c.y + 0.1, c.z, 2, 3, 0.5 * c.r, [D3.biome.ground.mid, '#FFFFFF'], 0.5, 1);
        if (!c.hitDone && Math.hypot(c.x - p.x, c.z - p.z) < c.reach * 0.7 + heroRadius()) { c.hitDone = true; hurtPlayer(c, c.bite * 1.15, 'Bam !'); }
        if (c.t > 0.95) { c.state = 'recover'; c.t = 0; bossOpen(); }
        break;
      }
      case 'roarWind':
        c.speedNow *= Math.exp(-8 * dt);
        c.yaw = turnTo(c.yaw, toP, 3 * dt);
        c.roarT = Math.max(c.roarT, 0.4);
        if (c.t > 1.05 / rage) {
          c.state = 'recover';
          c.t = -0.15;
          sfx.roar(1.3);
          camShake = Math.max(camShake, 1);
          burst(c.x, c.y + 0.3, c.z, 28, 12 * Math.max(0.6, c.r * 0.4), 0.55 * c.r, ['#FFFFFF', '#FFE0A0', D3.biome.ground.mid], 0.7, 2);
          if (d < c.reach * 3.6) hurtPlayer(c, c.bite, 'Le souffle !');
          bossOpen();
        }
        break;
      case 'windup':
        c.speedNow *= Math.exp(-9 * dt);
        c.yaw = turnTo(c.yaw, toP, 3 * dt);
        c.attackK = -clamp(c.t / WINDUP, 0, 1) * 0.55;
        c.jawT = 0.2;
        if (c.t > WINDUP / rage) { c.state = 'lunge'; c.t = 0; c.hitDone = false; sfx.snap(); }
        break;
      case 'lunge': {
        const v = Math.max(c.speed * 1.7, (c.reach * 1.6) / LUNGE_TIME);
        c.speedNow = v;
        c.x += Math.cos(c.yaw) * v * dt;
        c.z += Math.sin(c.yaw) * v * dt;
        c.attackK = 1;
        c.jawT = 0.2;
        if (!c.hitDone && touchesPlayerMouth(c)) { c.hitDone = true; hurtPlayer(c, c.bite, 'Aïe !'); }
        if (c.t > LUNGE_TIME) { c.state = 'recover'; c.t = 0; bossOpen(); }
        break;
      }
      case 'recover':
        c.speedNow *= Math.exp(-7 * dt);
        c.attackK = 0;
        c.stunK = clamp(c.t * 4, 0, 1);
        if (c.t > 0) {
          if (Math.random() < dt * 8) burst(c.x, c.y + c.plan.hipY * c.scale * 1.9, c.z, 1, 1, 0.3 * c.r, ['#FFD24A'], 0.5, -2);
        }
        if (c.t > 2.5 / rage) { c.stunK = 0; c.state = 'circle'; c.t = 0; }
        break;
      default:
        c.state = 'circle';
    }
    heartClose = Math.max(heartClose, 0.7);
  }
  function bossOpen() {
    setMark(boss, '★', '#E5A52F', 1.6);
    sayOnce('bossOpen', lines.bossOpen, 14, 2);
  }

  function winDuel(c) {
    duelState = 'won';
    c.dead = true;
    c.state = 'dead';
    c.deadT = 99;
    $('bossBar').hidden = true;
    D.prog.duel = true;
    D.growth = GROWTH_FULL;
    updateScale();
    game.adn += 60;
    game.stats.eaten++;
    cinematic = { type: 'win', t: 0, dur: botOn ? 0.1 : 5.4 };
    root.classList.add('d3-cine');
    slow = 0.2;
    slowT = 1.1;
    camShake = 1.2;
    sfx.boom();
    burst(c.x, c.y + c.plan.hipY * c.scale, c.z, 40, 14, 0.7 * c.r, ['#FFE58A', '#FFFFFF', '#FF8F7A'], 1, 4);
    say(pick(lines.bossWin), 5, 5000);
    p.invul = 99;
    $('bigTitle').innerHTML = `<small>VICTOIRE</small>${esc(D3.boss.title)} est vaincu !`;
    $('bigTitle').hidden = false;
    later(() => { p.roarT = 2.2; sfx.roar(1.3); camShake = Math.max(camShake, 0.8); sfx.victory(); host.confetti(90); }, 1.3);
    checkMissions();
  }

  /* ---------- Les dangers de la nature ---------- */
  function fireHazard() {
    if (!D3.hazards) return;
    const H = pick(D3.hazards);
    sayOnce(`hz-${H.type}`, H.line, 70, 2);
    if (H.type === 'ruee') {
      // une ruée : tout un troupeau traverse, en panique
      const a = camYaw + (Math.random() < 0.5 ? 0.5 : -0.5) * Math.PI + rnd(-0.3, 0.3);
      const dist = 60 * heroScale();
      const sx = p.x - Math.cos(a) * dist, sz = p.z - Math.sin(a) * dist;
      sfx.rumble();
      camShake = Math.max(camShake, 0.3);
      for (let i = 0; i < H.n; i++) {
        const o = rnd(-1, 1) * 18 * heroScale();
        const x = sx - Math.sin(a) * o + rnd(-8, 8), z = sz + Math.cos(a) * o + rnd(-8, 8);
        if (world.height(x, z) < world.water + 0.05) continue;
        const c = makeCreature(H.species, x, z, {});
        c.stamp = { a, t: rnd(0, 0.5) };
        c.yaw = a;
        c.state = 'stamp';
      }
      return;
    }
    // ça tombe du ciel : sur toi, ou là où tu vas
    const n = H.type === 'bombes' ? 3 : H.type === 'rocs' ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const lead = i === 0 ? 1.0 : rnd(0.4, 1.8);
      const x = p.x + p.vx * lead + rnd(-1, 1) * (i ? 16 : 3) * heroScale();
      const z = p.z + p.vz * lead + rnd(-1, 1) * (i ? 16 : 3) * heroScale();
      const r = H.r * Math.max(0.8, heroScale());
      const dur = 1.35 + i * 0.25;
      addDecal(x, z, r, dur, {});
      hazards.push({ type: H.type, x, z, r, t: dur, max: dur, dmg: H.dmg });
    }
  }

  function updateHazards(dt) {
    for (let i = hazards.length - 1; i >= 0; i--) {
      const h = hazards[i];
      h.t -= dt;
      const g = Math.max(world.height(h.x, h.z), world.water);
      const k = 1 - h.t / h.max;
      if (h.type !== 'foudre' && Math.random() < dt * 40) {
        const y = g + (1 - k) * 60 * Math.max(1, heroScale());
        burst(h.x + (1 - k) * 14, y, h.z, 2, 1.5, h.r * (h.type === 'bombes' ? 0.42 : 0.3), h.type === 'bombes' ? ['#FF8A2A', '#FFD24A', '#3A3238'] : ['#8A6A52', '#6E5238'], 0.5, 0);
      }
      if (h.t > 0) continue;
      hazards.splice(i, 1);
      const d = Math.hypot(h.x - p.x, h.z - p.z);
      camShake = Math.max(camShake, clamp(1 - d / (h.r * 6), 0, 1) * 0.8);
      if (h.type === 'foudre') {
        sfx.bolt();
        flashT = 1;
        for (let n = 0; n < 16; n++) spawnP(h.x + rnd(-0.3, 0.3), g + n * 2.2, h.z + rnd(-0.3, 0.3), 0, 0, 0, 0.22, h.r * 0.7, '#E8F4FF');
        burst(h.x, g + 0.3, h.z, 18, 6, 0.3, ['#FFFFFF', '#BFE8FF'], 0.4);
      } else {
        sfx.boom();
        burst(h.x, g + 0.4, h.z, 30, h.r * 2, h.r * 0.28, h.type === 'bombes' ? ['#FF8A2A', '#FFD24A', '#3A3238'] : ['#A8805A', '#6E5238', '#FFFFFF'], 0.8, 8);
      }
      if (d < h.r + heroRadius()) hurtPlayer(null, h.dmg, h.type === 'foudre' ? 'Zzzap !' : 'Boum !');
    }
  }
  let flashT = 0;

  /** Le metteur en scène : il veille à ce que le joueur n'ait jamais la paix bien longtemps */
  function director(dt) {
    directorT -= dt;
    hazardT -= dt;
    rumbleT -= dt;
    safeT = Math.max(0, safeT - dt);
    if (duelState !== 'none') return;
    if (hazardT <= 0) {
      const H = D3.hazards && D3.hazards[0];
      hazardT = H ? rnd(H.every[0], H.every[1]) : 999;
      if (H && safeT <= 0) fireHazard();
    }
    if (directorT <= 0 && safeT <= 0) {
      directorT = rnd(14, 26);
      const hunters = creatures.filter((c) => c.sp.kind === 'hunter' && !c.dead && !c.boss);
      if (hunters.some((c) => c.state === 'chase' || c.state === 'windup')) return;
      const list = hunters.filter((c) => !fearsPlayer(c) && !(c.rest > 0));
      const c = list.length ? list[Math.floor(Math.random() * list.length)] : null;
      if (!c) return;
      // il vient d'arriver dans ton dos : un cri, le sol qui tremble…
      const a = camYaw + Math.PI + rnd(-1, 1);
      const dist = D3.biome.fog.near * rnd(1.15, 1.7);
      const x = p.x + Math.cos(a) * dist, z = p.z + Math.sin(a) * dist;
      if (world.height(x, z) >= world.water + 0.05 && Math.hypot(x, z) < world.radius * 0.9) {
        c.x = x; c.z = z;
        c.gx = p.x; c.gz = p.z;
        c.state = 'idle';
        c.t = 0;
        sfx.roar(Math.min(0.8, c.r / 4 + 0.2));
        if (c.r > 1) { sfx.rumble(); camShake = Math.max(camShake, 0.2); sayOnce('rumble', lines.rumble, 25, 1); } else sayOnce('roarFar', lines.roarFar, 25, 1);
      }
    }
  }

  /* ---------- Les missions ---------- */
  function missionInfo(m) {
    const P = D.prog;
    const nm = (id, n) => (n > 1 ? F[id].plural : F[id].name);
    switch (m.type) {
      case 'eat': { const cur = (P.eaten?.[m.species] || 0); return { text: m.text || `Croque ${m.n} ${nm(m.species, m.n)}`, cur: Math.min(cur, m.n), max: m.n, done: cur >= m.n, target: (c) => c.id === m.species }; }
      case 'defeat': { const cur = (P.defeated?.[m.species] || 0); return { text: m.text || `Bats ${m.n} ${nm(m.species, m.n)}`, cur: Math.min(cur, m.n), max: m.n, done: cur >= m.n, target: (c) => c.id === m.species }; }
      case 'plants': { const cur = P.plants || 0; return { text: m.text || `Broute ${m.n} plantes`, cur: Math.min(cur, m.n), max: m.n, done: cur >= m.n, plant: true }; }
      case 'hide': { const cur = P.hide || 0; return { text: m.text || 'Sème un chasseur', cur: Math.min(cur, m.n), max: m.n, done: cur >= m.n, hide: true }; }
      case 'grow': return { text: m.text || 'Grandis au maximum', cur: Math.floor(D.growth), max: GROWTH_FULL, done: D.growth >= GROWTH_FULL, pct: true };
      case 'duel': return { text: `Gagne le duel : ${D3.boss.title}`, cur: 0, max: 1, done: !!P.duel, duel: true };
      default: return { text: '', cur: 0, max: 1, done: true };
    }
  }

  let missionsKey = '';
  function renderMissions() {
    const infos = missions.map(missionInfo);
    const key = infos.map((m) => `${m.cur}${m.done}`).join('|');
    if (key === missionsKey) return;
    missionsKey = key;
    $('missions').innerHTML = infos.map((m) => {
      const prog = m.max > 1 && !m.done ? `<small>${m.cur}${m.pct ? ' %' : ` / ${m.max}`}</small>` : '';
      return `<li class="${m.done ? 'done' : ''}${m.duel ? ' duel' : ''}"><span>${m.duel ? '⚔️' : m.done ? '✅' : '◻️'}</span><span class="d3-mis-t">${esc(m.text)} ${prog}</span></li>`;
    }).join('');
  }

  let lastDoneCount = 0;
  function checkMissions() {
    const infos = missions.map(missionInfo);
    const done = infos.filter((m) => m.done).length;
    if (done > lastDoneCount && lastDoneCount >= 0 && time > 0.5) {
      sfx.mission();
      const nowDone = infos.find((m, i) => m.done && !(D.prog.seenDone || []).includes(i));
      if (nowDone) floater('Mission réussie !', p.x, p.y + heroHeight() * 2, p.z, '#7CF0A0', 1.25);
    }
    if (botOn && done !== lastDoneCount) botLog.push(`${Math.round(time)} missions ${done} croissance ${Math.round(D.growth)}`);
    D.prog.seenDone = infos.map((m, i) => (m.done ? i : -1)).filter((i) => i >= 0);
    lastDoneCount = done;
    renderMissions();
    host.save();
    // tout est fait, sauf le duel ?
    const duelI = infos.findIndex((m) => m.duel);
    if (duelI >= 0 && infos.every((m, i) => i === duelI || m.done) && duelState === 'none' && !modal) {
      say('Tu es prêt… Quelque chose arrive. Cette fois, tu ne pourras pas fuir !', 4, 3500);
      later(() => { if (!modal) startDuel(); else later(startDuelSafe, 1); }, botOn ? 0.2 : 3.2);
    }
  }
  function startDuelSafe() { if (!modal) startDuel(); else later(startDuelSafe, 1); }

  /* ---------- La fiche « Le savais-tu ? » : avec le vrai animal ---------- */
  function renderPortrait(animalId, mods = null, extra = null) {
    const S = 180;
    if (!portraitRT) portraitRT = new THREE.WebGLRenderTarget(S, S);
    const sc = new THREE.Scene();
    sc.background = new THREE.Color(0x1F5A6E);
    sc.add(new THREE.HemisphereLight(0xffffff, 0x88a0a8, 2));
    const dl = new THREE.DirectionalLight(0xfff0d8, 2.6);
    dl.position.set(2, 3, 3);
    sc.add(dl);
    const plan = planOf(animalId, mods);
    const a = new Animal(plan, false);
    a.pose({ speed: 0, jaw: 0.2 }, 0);
    sc.add(a.group);
    sc.updateMatrixWorld(true);
    const s = plan.geometry.boundingSphere;
    const cam = new THREE.PerspectiveCamera(30, 1, 0.01, 800);
    const head = plan.head != null ? plan.bones[plan.head] : { x: s.center.x, y: s.center.y };
    const focus = new THREE.Vector3(lerp(s.center.x, head.x, 0.45), lerp(s.center.y, head.y, 0.45), 0);
    cam.position.set(focus.x + s.radius * 1.1, focus.y + s.radius * 0.5, s.radius * 2.8);
    cam.lookAt(focus);
    renderer.setRenderTarget(portraitRT);
    renderer.render(sc, cam);
    const buf = new Uint8Array(S * S * 4);
    renderer.readRenderTargetPixels(portraitRT, 0, 0, S, S, buf);
    renderer.setRenderTarget(null);
    a.mesh.skeleton.dispose();
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const x = c.getContext('2d');
    const im = x.createImageData(S, S);
    for (let j = 0; j < S; j++) {
      for (let i = 0; i < S * 4; i += 4) {
        const from = (S - 1 - j) * S * 4 + i, to = j * S * 4 + i;
        for (let k = 0; k < 3; k++) {
          const v = buf[from + k] / 255;
          im.data[to + k] = Math.pow(Math.min(1, v), 1 / 2.2) * 255;
        }
        im.data[to + 3] = 255;
      }
    }
    x.putImageData(im, 0, 0);
    return c.toDataURL('image/png');
  }
  const thumbs = {};
  function thumbOf(animalId) {
    if (!thumbs[animalId]) thumbs[animalId] = renderPortrait(animalId);
    return thumbs[animalId];
  }

  let factT = 0;
  const factQ = [];
  function showFact(id) {
    const sp = F[id];
    if (!$('fact').hidden) { factQ.push(id); return; }
    $('factImg').src = botOn ? '' : thumbOf(sp.animal);
    $('factTag').textContent = sp.kind === 'hunter' || sp.kind === 'swimmer' || sp.kind === 'flyer' ? '⚠️ Danger !' : sp.kind === 'giant' ? '⚠️ Géant !' : '👀 Nouvelle espèce';
    $('factName').textContent = sp.name;
    $('factWhen').textContent = `il y a ${CH.ago[0]} millions d'années`;
    $('factText').textContent = sp.fact;
    $('fact').hidden = false;
    $('fact').classList.remove('pop');
    void $('fact').offsetWidth;
    $('fact').classList.add('pop');
    factT = 9;
  }

  /* ---------- Les choix : l'évolution, carnivore ou herbivore ---------- */
  function openEvolution() {
    if (D.picks.length >= 2 && !evolutions.some((e) => !D.picks.includes(e.id))) return;
    const left = evolutions.filter((e) => !D.picks.includes(e.id));
    if (!left.length) return;
    const offer = left.sort(() => Math.random() - 0.5).slice(0, 3);
    if (botOn) { applyEvolution(offer[0]); return; }
    modal = true;
    sfx.evolve();
    const scr = $('screen');
    scr.innerHTML = `
      <div class="d3-card">
        <p class="d3-card-kicker">🧬 Tes descendants évoluent !</p>
        <h2>Choisis ce qu'ils vont gagner</h2>
        <div class="d3-choices">${offer.map((e) => `
          <button class="d3-choice" data-evo="${e.id}">
            <span class="d3-choice-icon">${e.icon}</span>
            <b>${esc(e.name)}</b>
            <span>${esc(e.short)}</span>
            <small>${esc(e.fact)}</small>
          </button>`).join('')}</div>
      </div>`;
    scr.hidden = false;
    scr.querySelectorAll('[data-evo]').forEach((b) => b.addEventListener('click', () => {
      scr.hidden = true;
      scr.innerHTML = '';
      modal = false;
      applyEvolution(evolutions.find((e) => e.id === b.dataset.evo));
      host.resetTimers?.();
    }));
  }

  function applyEvolution(e) {
    const ratio = p.hp / heroHpMax();
    D.picks.push(e.id);
    recalcStats();
    buildHero(p.x, p.z, p.yaw);
    updateScale();
    p.hp = heroHpMax() * Math.max(ratio, 0.7);
    game.stats.evolutions++;
    sfx.evolve();
    flashT = 0.8;
    burst(p.x, p.y + heroHeight() * 0.7, p.z, 34, 6 * heroScale(), 0.34 * heroScale(), ['#7CF0A0', '#FFE58A', '#FFFFFF'], 1, 2);
    floater(e.name, p.x, p.y + heroHeight() * 2, p.z, '#7CF0A0', 1.4);
    host.save();
    checkMissions();
  }

  function openDietChoice(then) {
    if (botOn) { D.diet = botDiet; then(); return; }
    modal = true;
    const defs = D3.heroes;
    const scr = $('screen');
    scr.innerHTML = `
      <div class="d3-card d3-diet">
        <p class="d3-card-kicker">🦖 Les premiers dinosaures</p>
        <h2>Quel dinosaure deviendras-tu ?</h2>
        <p class="d3-card-sub">Tes descendants vont suivre ce chemin jusqu'au bout. Choisis bien !</p>
        <div class="d3-choices">
          <button class="d3-choice d3-carn" data-diet="carnivore">
            <img src="${renderPortrait(defs.carnivore.animal)}" alt="">
            <b>🥩 Le chasseur</b>
            <span>Rapide et féroce. Tu traques tes proies et tu les croques. Tu finiras <b>Tyrannosaurus rex</b>.</span>
          </button>
          <button class="d3-choice d3-herb" data-diet="herbivore">
            <img src="${renderPortrait(defs.herbivore.animal)}" alt="">
            <b>🌿 Le colosse</b>
            <span>Solide, blindé, tout le monde te veut. Tu broutes, tu encaisses, et tu charges. Tu finiras <b>Triceratops</b>.</span>
          </button>
        </div>
      </div>`;
    scr.hidden = false;
    scr.querySelectorAll('[data-diet]').forEach((b) => b.addEventListener('click', () => {
      D.diet = b.dataset.diet;
      scr.hidden = true;
      scr.innerHTML = '';
      modal = false;
      sfx.chapter();
      then();
    }));
  }

  /* ---------- Un nouveau chapitre ---------- */
  function clearWorld() {
    if (world) {
      for (const c of creatures) { if (!c.gone) { c.anim.dispose(); if (c.mark) c.mark.material.dispose(); } }
      creatures = [];
      boss = null;
      world.dispose();
      world = null;
    }
    while (floaters.length) floaters.pop().el.remove();
  }

  function setupChapter(fresh, thenIntro = true) {
    CH = LV.chapters[game.chapter];
    D3 = CH.d3;
    const go = () => {
      clearWorld();
      scene = new THREE.Scene();
      HERO = heroDef();
      missions = missionsDef();
      evolutions = evolutionsDef() || [];
      if (fresh) { D.growth = 0; D.picks = []; D.prog = {}; }
      recalcStats();
      time = time || 0;
      world = createWorld(scene, D3.biome, 1000 + game.chapter * 137 + game.level * 11, quality);
      camera.far = Math.max(600, D3.biome.radius * 4);
      camera.updateProjectionMatrix();
      makeParticles();
      makeDecals();
      const old = p;
      if (p) { p.anim = null; }
      p = null;
      const sx = D.pos && !fresh ? D.pos.x : 0, sz = D.pos && !fresh ? D.pos.z : 0;
      buildHero(sx, sz, D.pos && !fresh ? D.pos.yaw : 0);
      p.hp = heroHpMax();
      p.stamina = 1;
      p.vx = p.vz = 0;
      p.invul = 3;
      updateScale();
      camYaw = p.yaw;
      duelState = D.prog.duel ? 'won' : 'none';
      lastDoneCount = missions.map(missionInfo).filter((m) => m.done).length;
      safeT = 10;
      hazardT = 26;
      directorT = 22;
      tipT = 34;
      tipI = 0;
      hazards = [];
      $('fact').hidden = true;
      factQ.length = 0;
      $('chapTitle').textContent = `${game.chapter + 1}. ${CH.title}`;
      $('form').textContent = HERO.label;
      $('era').textContent = `il y a ${CH.ago[0]} millions d'années`;
      $('attackName').textContent = HERO.attackName || 'Mords';
      $('attackIcon').textContent = HERO.attackIcon || '🦷';
      $('bossBar').hidden = true;
      $('bigTitle').hidden = true;
      missionsKey = '';
      renderMissions();
      populate(true);
      snapCamera();
      if (thenIntro) openChapterIntro(fresh);
      host.save();
      void old;
    };
    if (D3.choice && !D.diet) { scene = scene || new THREE.Scene(); openDietChoice(go); } else go();
  }

  function openChapterIntro(fresh) {
    if (botOn) return;
    const missionsHtml = missions.map((m) => `<li>${missionInfo(m).duel ? '⚔️' : '🎯'} ${esc(missionInfo(m).text)}</li>`).join('');
    modal = true;
    const scr = $('screen');
    scr.innerHTML = `
      <div class="d3-card">
        <p class="d3-card-kicker">Chapitre ${game.chapter + 1} / ${LV.chapters.length} · il y a ${CH.ago[0]} millions d'années</p>
        <h2>${esc(CH.title)}</h2>
        <p class="d3-card-sub">${esc(D3.intro)}</p>
        <ul class="d3-card-missions">${missionsHtml}</ul>
        <button class="d3-go" data-go="1">C'est parti !</button>
      </div>`;
    scr.hidden = false;
    const close = () => {
      scr.hidden = true;
      scr.innerHTML = '';
      modal = false;
      sfx.click();
      if (fresh) later(() => sayOnce('start', pick(D3.tips || ['']), 1, 2), 1.2);
      checkMissions();
    };
    scr.querySelector('[data-go]').addEventListener('click', close);
    scr.querySelector('[data-go]').focus({ preventScroll: true });
  }

  function nextChapter() {
    const next = LV.chapters[game.chapter + 1];
    if (!next) { startEnding(); return; }
    game.chapter++;
    D.pos = null;
    cinematic = null;
    root.classList.remove('d3-cine');
    $('bigTitle').hidden = true;
    // le temps passe
    const scr = $('screen');
    modal = true;
    sfx.time();
    scr.innerHTML = `<div class="d3-time"><p>Des millions d'années passent…</p><h2>il y a ${next.ago[0]} millions d'années</h2><span class="d3-time-bar"><i></i></span></div>`;
    scr.hidden = false;
    setTimeout(() => {
      scr.hidden = true;
      scr.innerHTML = '';
      modal = false;
      setupChapter(true);
    }, botOn ? 0 : 2600);
    if (botOn) { scr.hidden = true; scr.innerHTML = ''; modal = false; setupChapter(true); }
  }

  /* ---------- La toute fin : le roi de la Terre… et le ciel qui tombe ---------- */
  function startEnding() {
    finished = true;
    cinematic = { type: 'fin', t: 0, dur: botOn ? 0.05 : 15 };
    root.classList.add('d3-cine');
    $('bigTitle').innerHTML = `<small>${D.diet === 'herbivore' ? 'TRICERATOPS' : 'T. REX'}</small>Le roi de la Terre !`;
    $('bigTitle').hidden = false;
    p.invul = 99;
    p.roarT = 2;
    sfx.roar(1.3);
    host.confetti(120);
    say('Tu as réussi ! Plus personne n\'ose te défier.', 5, 3500);
    later(() => { $('bigTitle').hidden = true; say("Regarde le ciel… Cette étoile a beaucoup grossi.", 5, 4000); sfx.rumble(); }, 4.5);
    later(() => { say('Elle tombe !', 5, 3000); sfx.rumble(); }, 9);
  }

  /* ---------- Le joueur ---------- */
  const keys = {};
  const stick = { x: 0, y: 0, id: null, cx: 0, cy: 0 };
  let sprintHeld = false;
  let drag = null;

  function moveInput() {
    if (botOn) return botDirV;
    let ix = 0, iy = 0;
    if (keys.ArrowLeft || keys.KeyA) ix -= 1;
    if (keys.ArrowRight || keys.KeyD) ix += 1;
    if (keys.ArrowUp || keys.KeyW) iy += 1;
    if (keys.ArrowDown || keys.KeyS) iy -= 1;
    if (stick.id !== null) { ix = stick.x; iy = -stick.y; }
    const n = Math.hypot(ix, iy);
    if (n < 0.08) return null;
    const m = Math.min(1, n);
    ix /= n; iy /= n;
    // haut = vers l'avant de la caméra ; gauche / droite = de côté
    const fwd = camYaw, sx = Math.cos(fwd), sz = Math.sin(fwd);
    return { x: sx * iy - sz * ix, z: sz * iy + sx * ix, m };
  }

  function updatePlayer(dt) {
    p.invul = Math.max(0, p.invul - dt);
    p.attackCD = Math.max(0, p.attackCD - dt);
    p.jawT = Math.max(0, p.jawT - dt);
    p.roarT = Math.max(0, p.roarT - dt);
    p.noiseT = Math.max(0, p.noiseT - dt);
    if (p.dead) {
      p.deadT -= dt;
      p.vx *= Math.exp(-5 * dt);
      p.vz *= Math.exp(-5 * dt);
      p.anim.group.rotation.x = lerp(p.anim.group.rotation.x, 1.45, dt * 3);
      p.speedNow = 0;
      if (p.deadT <= 0) respawn();
      updateHeroTransform(dt, 0);
      return;
    }
    const input = isFrozen() ? null : moveInput();
    const g = world.height(p.x, p.z);
    p.water = g < world.water - 0.1 * heroScale();
    const swimFast = game.chapter === 0 && p.water;
    p.sprinting = !!(input && (botOn ? botSprint : sprintHeld) && p.stamina > 0.02);
    const base = lerp(HERO.walk, HERO.run, input ? input.m : 1) * stats.run * Math.sqrt(heroScale());
    const sprintV = HERO.sprint * stats.run * Math.sqrt(heroScale());
    let top = p.sprinting ? sprintV : base;
    if (p.water && !swimFast) top *= 0.72;
    if (swimFast) top *= 1.05;
    // le sprint
    if (p.sprinting) {
      p.stamina -= dt / (STAMINA_TIME * stats.stamina);
      p.noiseT = 0.35;
      if (p.stamina <= 0.02) { sprintHeld = false; floater('À bout de souffle !', p.x, p.y + heroHeight() * 1.8, p.z, '#9EE7FF', 0.9); }
    } else {
      p.stamina = Math.min(1, p.stamina + dt / STAMINA_BACK);
    }
    // les mouvements : on suit le doigt tout de suite, on garde un peu d'élan
    const tvx = input ? input.x * top : 0, tvz = input ? input.z * top : 0;
    const grip = input ? (p.attackT > 0 ? 4 : 12) : 8;
    const k = 1 - Math.exp(-grip * dt);
    p.vx += (tvx - p.vx) * k;
    p.vz += (tvz - p.vz) * k;
    const v = Math.hypot(p.vx, p.vz);
    p.moving = v > HERO.walk * 0.3;
    if (v > 0.2) {
      const prev = p.yaw;
      const turnRate = input ? 10 : 4;
      if (input) p.yaw = turnTo(p.yaw, Math.atan2(input.z, input.x), turnRate * dt);
      p.yawRate = lerp(p.yawRate, angDiff(prev, p.yaw) / Math.max(dt, 0.001), 0.25);
    } else {
      p.yawRate *= 0.8;
    }
    // on va un peu moins vite en montée, un peu plus en descente
    const nx = p.x + p.vx * dt, nz = p.z + p.vz * dt;
    const gh = world.height(nx, nz);
    const climb = clamp((gh - g) / Math.max(0.05, v * dt), -1.5, 3);
    const climbK = climb > 0.2 ? clamp(1 - (climb - 0.2) * 0.5, 0.45, 1) : 1;
    p.x += p.vx * dt * climbK;
    p.z += p.vz * dt * climbK;
    const pos = { x: p.x, z: p.z };
    if (world.collide(pos, heroRadius() * 0.8)) { p.x = pos.x; p.z = pos.z; }
    const dist0 = Math.hypot(p.x, p.z);
    if (dist0 > world.radius * 1.02) { p.x *= (world.radius * 1.02) / dist0; p.z *= (world.radius * 1.02) / dist0; }
    p.speedNow = Math.hypot(p.vx, p.vz) * climbK;
    // les pieds soulèvent la poussière ; un sprint, c'est un nuage
    const dusty = p.speedNow > HERO.walk;
    if (dusty && Math.random() < dt * (p.sprinting ? 34 : 9)) {
      const sc = heroScale();
      const col = p.water ? '#DFF3F0' : D3.biome.ground.high;
      spawnP(p.x + rnd(-0.3, 0.3) * sc - p.vx * 0.04, p.y + 0.1, p.z + rnd(-0.3, 0.3) * sc - p.vz * 0.04, -p.vx * 0.1 + rnd(-0.6, 0.6), rnd(0.4, 1.4) * sc, -p.vz * 0.1 + rnd(-0.6, 0.6), rnd(0.35, 0.7), heroRadius() * rnd(0.6, 1.2) * (p.sprinting ? 1.5 : 1), col, 0.6);
    }
    if (p.water && p.moving && Math.random() < dt * 12) spawnP(p.x, world.water + 0.05, p.z, rnd(-0.6, 0.6), rnd(0.8, 2), rnd(-0.6, 0.6), 0.5, heroRadius() * 0.7, '#FFFFFF', 4);
    // caché ?
    const h = world.inHide(p.x, p.z);
    const wasHidden = p.hidden;
    p.hidden = !!h && !p.sprinting && p.attackT <= 0;
    if (p.hidden !== wasHidden) {
      $('hiddenBadge').hidden = !p.hidden;
      if (p.hidden) sfx.rustle();
    }
    // le coup part au milieu de l'élan
    if (p.attackT > 0) {
      const before = p.attackT;
      p.attackT -= dt;
      if (before > ATTACK_TIME * 0.45 && p.attackT <= ATTACK_TIME * 0.45) {
        const t = attackHits();
        if (t) strikeCreature(t);
        else if (herbivore() && HERO.ram) { /* rien à toucher */ }
      }
    }
    // l'herbivore lancé à fond renverse tout ce qu'il touche
    if (herbivore() && HERO.ram && p.sprinting) {
      for (const c of creatures) {
        if (c.dead || c.alt || c.sp.kind === 'giant' || (c.ramT || 0) > time) continue;
        if (Math.hypot(c.x - p.x, c.z - p.z) < c.r + heroRadius() + heroReach() * 0.2) {
          c.ramT = time + 0.8;
          const m = (HERO.ram / heroBite()) * stats.ram * (0.6 + (D.growth / 100));
          strikeCreature(c, Math.max(0.8, m), true);
          p.stamina = Math.max(0, p.stamina - 0.12);
        }
      }
    }
    // manger en passant : les petits qui sont dans la gueule
    if (!herbivore()) {
      for (const c of creatures) {
        if (c.dead || c.sp.kind === 'giant' || c.alt) continue;
        if (c.sp.kind === 'prey' && c.hp <= heroBite() * 1.6) {
          const mx = p.x + Math.cos(p.yaw) * (heroRadius() + heroReach() * 0.5), mz = p.z + Math.sin(p.yaw) * (heroRadius() + heroReach() * 0.5);
          if (Math.hypot(c.x - mx, c.z - mz) < c.r + heroReach() * 0.72) {
            p.jawT = 0.26;
            sfx.eat(Math.min(1, c.r));
            burst(c.x, c.y + 0.1, c.z, 6, 2.5, 0.16 * Math.max(0.5, c.r), ['#FFFFFF', '#FFE58A'], 0.35, 4);
            defeatCreature(c);
            c.deadT = 0.1;
            c.anim.group.visible = false;
            sayOnce('combo', '', 1e9, 0);
          }
        }
      }
    } else {
      // l'herbivore broute en passant
      const reach = heroReach() * 1.15 * stats.graze;
      for (const P of world.plants) {
        if (!P.alive) continue;
        if (Math.hypot(P.x - p.x, P.z - p.z) < reach + P.s * 0.42 + heroRadius()) {
          P.alive = false;
          P.t = 28;
          world.setPlant(P, 0.001);
          D.prog.plants = (D.prog.plants || 0) + 1;
          game.adn += 2;
          sfx.eat(0.2);
          p.jawT = 0.26;
          burst(P.x, P.y + P.s * 0.4, P.z, 10, 3, 0.2 * heroScale(), ['#7CF0A0', '#BFE85A', '#FFFFFF'], 0.6, 4);
          floater('Miam !', P.x, P.y + P.s, P.z, '#7CF0A0', 0.95);
          sayOnce('graze', lines.graze, 90, 1);
          feed(7, null);
        }
      }
    }
    for (const P of world.plants) {
      if (P.alive) continue;
      P.t -= dt;
      if (P.t <= 0) { P.alive = true; world.setPlant(P, 1); }
    }
    updateHeroTransform(dt, v);
    p.anim.group.rotation.x = 0;
  }

  function updateHeroTransform(dt, v) {
    const g = world.height(p.x, p.z);
    const sc = heroScale();
    let y = g;
    if (g < world.water) y = lerp(g, world.water - p.plan.hipY * sc * 0.55, clamp((world.water - g) / (p.plan.hipY * sc), 0, 1));
    p.y = y;
    const G = p.anim.group;
    G.position.set(p.x, y, p.z);
    // il suit la pente, et penche dans les virages
    const fx = Math.cos(p.yaw), fz = Math.sin(p.yaw);
    const e = Math.max(0.5, heroRadius());
    const slopeF = (world.height(p.x + fx * e, p.z + fz * e) - world.height(p.x - fx * e, p.z - fz * e)) / (2 * e);
    G.rotation.order = 'YZX';
    G.rotation.y = -p.yaw;
    G.rotation.z = lerp(G.rotation.z, clamp(Math.atan(slopeF), -0.6, 0.6), Math.min(1, dt * 8));
    const local = p.speedNow / sc;
    const lk = p.attackT > 0 ? Math.sin((1 - p.attackT / ATTACK_TIME) * Math.PI) : 0;
    p.anim.pose({
      speed: local,
      yawRate: p.yawRate,
      lean: p.sprinting ? 0.12 : 0.04,
      jaw: p.roarT > 0 ? 1 : p.jawT > 0 ? 1 : 0.05,
      roar: p.roarT > 0 ? Math.min(1, p.roarT * 2) : 0,
      attack: lk,
      crouch: p.hidden ? 1 : p.dead ? 0 : 0,
      lookY: clamp(-p.yawRate * 0.12, -0.6, 0.6),
      lookP: 0,
    }, dt);
    // clignote quand il est invincible
    const blink = p.invul > 0 && p.invul < 50 && !finished && duelState !== 'won' && Math.floor(p.invul * 8) % 2 === 1;
    p.anim.group.visible = !blink;
  }

  /* ---------- Toutes les créatures, à chaque image ---------- */
  function updateCreatures(dt) {
    heartClose = 0;
    let far = D3.biome.fog.far * 1.3;
    for (const c of creatures) {
      if (c.gone) continue;
      c.markT = (c.markT || 0) - dt;
      if (c.mark) {
        c.mark.visible = c.markT > 0;
        if (c.markT > 0) {
          c.mark.position.set(c.x, c.y + (c.plan.hipY * 2 + 0.5) * c.scale + c.r * 0.5, c.z);
          const s = Math.max(0.8, c.r * 0.9 + heroScale() * 0.5);
          c.mark.scale.set(s, s, 1);
        }
      }
      c.hitT = Math.max(0, c.hitT - dt);
      c.jawT = Math.max(0, (c.jawT || 0) - dt);
      c.roarT = Math.max(0, (c.roarT || 0) - dt);
      const d = Math.hypot(c.x - p.x, c.z - p.z);
      if (c.dead) {
        c.deadT -= dt;
        c.speedNow *= Math.exp(-5 * dt);
        c.anim.group.rotation.x = lerp(c.anim.group.rotation.x, 1.45, dt * 3.5);
        if (c.deadT < 0.6) c.anim.group.position.y -= dt * c.scale * 0.8;
        else c.anim.group.position.y = c.y;
        if (c.deadT <= 0) { removeCreature(c); continue; }
        c.anim.pose({ speed: 0, stun: 0.2, jaw: 0.6 }, dt);
        continue;
      }
      if (!c.boss && !c.stamp && d > far) { removeCreature(c); continue; }
      if (c.stamp) {
        // la ruée : droit devant, sans s'arrêter
        c.stamp.t += dt;
        c.speedNow = c.speed * 1.5;
        c.x += Math.cos(c.yaw) * c.speedNow * dt;
        c.z += Math.sin(c.yaw) * c.speedNow * dt;
        if (d < c.r + heroRadius() && p.invul <= 0) hurtPlayer(c, 1, 'Bam !');
        if (c.stamp.t > 11) { removeCreature(c); continue; }
      } else if (c.boss) thinkBoss(c, d, dt);
      else {
        switch (c.sp.kind) {
          case 'hunter': thinkHunter(c, d, dt); break;
          case 'prey': thinkPrey(c, d, dt); break;
          case 'defender': thinkDefender(c, d, dt); break;
          case 'giant': thinkGiant(c, d, dt); break;
          case 'swimmer': thinkSwimmer(c, d, dt); break;
          case 'flyer': thinkFlyer(c, d, dt); break;
          default:
            if (c.state === 'flee') {
              if (c.t > 6) { c.state = 'idle'; c.t = 0; }
              c.t += dt;
              steerTo(c, c.x + (c.x - p.x), c.z + (c.z - p.z), c.speed * 1.1, dt, 4);
            } else thinkGraze(c, dt);
        }
      }
      // le sol, les obstacles, les autres
      if (Math.hypot(c.x, c.z) > world.radius * 0.98 && !c.boss) { c.gx = 0; c.gz = 0; const k = (world.radius * 0.98) / Math.hypot(c.x, c.z); c.x *= k; c.z *= k; }
      if (c.boss && Math.hypot(c.x, c.z) > world.radius * 1.02) { const k = (world.radius * 1.02) / Math.hypot(c.x, c.z); c.x *= k; c.z *= k; }
      const pos = { x: c.x, z: c.z };
      if (c.sp.kind !== 'giant' && !c.alt && c.r > 0.2 && !c.stamp) {
        if (world.collide(pos, c.r * 0.5)) { c.x = pos.x; c.z = pos.z; c.t += dt * 2; }
      }
      const g = world.height(c.x, c.z);
      if (c.alt) {
        c.y = c.flyY ?? g + c.alt;
      } else if (c.sp.kind === 'swimmer') {
        c.y = Math.max(g, world.water - c.plan.hipY * c.scale * 0.75);
      } else {
        c.y = g < world.water ? lerp(g, world.water - c.plan.hipY * c.scale * 0.5, clamp((world.water - g) / (c.plan.hipY * c.scale + 0.01), 0, 1)) : g;
      }
      // on ne s'occupe du dessin que de ce qu'on peut voir
      const vis = d < far;
      c.anim.group.visible = vis;
      if (vis) {
        const G = c.anim.group;
        G.position.set(c.x, c.y, c.z);
        G.rotation.order = 'YZX';
        G.rotation.y = -c.yaw;
        G.rotation.z = 0;
        c.skip = (c.skip + 1) % (d > 90 ? 3 : d > 45 ? 2 : 1);
        if (c.skip === 0) {
          const local = c.speedNow / c.scale;
          const ddt = dt * (d > 90 ? 3 : d > 45 ? 2 : 1);
          const look = c.state === 'chase' || c.state === 'alert' || c.boss ? clamp(angDiff(c.yaw, Math.atan2(p.z - c.z, p.x - c.x)), -0.8, 0.8) : 0;
          c.anim.pose({
            speed: local,
            yawRate: c.yawRate,
            lean: c.state === 'chase' || c.state === 'flee' ? 0.1 : 0,
            jaw: c.roarT > 0 ? 1 : c.jawT > 0 ? 0.9 : Math.sin(time * 0.8 + c.seed) > 0.96 ? 0.25 : 0,
            attack: Math.max(0, c.attackK || 0),
            roar: c.roarT > 0 ? Math.min(1, c.roarT * 2) : 0,
            lookY: -look,
            lookP: (c.grazeK || 0) * -0.9 - Math.min(0, c.attackK || 0) * 0.7,
            stun: c.stunK || 0,
            crouch: c.hitT > 0 ? 0.6 : 0,
            flap: c.alt ? (c.state === 'dive' ? 1.8 : 3.8) : 0,
          }, ddt);
        }
      }
    }
    creatures = creatures.filter((c) => !c.gone);
    if (boss && boss.gone) boss = null;
  }

  /* ---------- La caméra : basse, derrière lui, qui s'écarte quand ça va vite ---------- */
  const isFrozen = () => !!cinematic || modal;

  function snapCamera() {
    const dist = HERO.cam * heroScale() * 0.76;
    const y = p.y + dist * 0.46;
    camPos.set(p.x - Math.cos(camYaw) * dist, y, p.z - Math.sin(camYaw) * dist);
    camLook.set(p.x, p.y + heroHeight(), p.z);
  }

  function updateCamera(dt) {
    const sc = heroScale();
    const sprintK = clamp((p.speedNow - HERO.run) / (HERO.sprint - HERO.run + 0.01), 0, 1);
    camPull += (sprintK - camPull) * Math.min(1, dt * 2.6);
    if (cinematic) { cinemaCamera(dt); return; }
    // elle se replace toute seule derrière la course
    if (p.speedNow > 1 && !drag) {
      const k = duelState === 'fight' ? 0.9 : 2.1;
      const moving = Math.atan2(p.vz, p.vx);
      const back = Math.abs(angDiff(camYaw, moving));
      // (quand il revient vers la caméra, elle tourne doucement)
      camYaw = turnTo(camYaw, moving, (back > 2.4 ? 0.8 : k) * dt);
    }
    // pendant un duel, elle garde l'adversaire dans le cadre
    if (duelState === 'fight' && boss && !boss.dead && !drag) {
      const toB = Math.atan2(boss.z - p.z, boss.x - p.x);
      camYaw = turnTo(camYaw, toB, 1.6 * dt);
    }
    const dist = HERO.cam * sc * 0.76 * (1 + camPull * 0.28);
    const hgt = dist * (0.46 - camPull * 0.04);
    const tx = p.x - Math.cos(camYaw) * dist, tz = p.z - Math.sin(camYaw) * dist;
    const minY = Math.max(world.height(tx, tz), world.water) + 0.8 * sc;
    const ty = Math.max(p.y + hgt, minY);
    const follow = 1 - Math.exp(-9 * dt);
    camPos.x += (tx - camPos.x) * follow;
    camPos.y += (ty - camPos.y) * follow;
    camPos.z += (tz - camPos.z) * follow;
    const lookX = p.x + Math.cos(camYaw) * dist * 0.28, lookZ = p.z + Math.sin(camYaw) * dist * 0.28;
    const look = 1 - Math.exp(-12 * dt);
    camLook.x += (lookX - camLook.x) * look;
    camLook.y += (p.y + heroHeight() * 1.05 - camLook.y) * look;
    camLook.z += (lookZ - camLook.z) * look;
    applyCamera(62 + camPull * 17 + (duelState === 'fight' ? 3 : 0), dt);
  }

  function applyCamera(fov, dt) {
    camera.position.copy(camPos);
    camShake = Math.max(0, camShake - dt * 2.2);
    if (camShake > 0) {
      const s = camShake * camShake * HERO.cam * heroScale() * 0.035;
      camera.position.x += rnd(-1, 1) * s;
      camera.position.y += rnd(-1, 1) * s;
      camera.position.z += rnd(-1, 1) * s;
    }
    camera.lookAt(camLook);
    if (Math.abs(camera.fov - fov) > 0.05) {
      camera.fov += (fov - camera.fov) * Math.min(1, dt * 5);
      camera.updateProjectionMatrix();
    }
  }

  function cinemaCamera(dt) {
    const C = cinematic;
    const k = 1 - Math.exp(-3 * dt);
    if (C.type === 'duel' && boss) {
      const R = Math.max(boss.r * 3.4, 6);
      const yaw = boss.yaw + 0.5 + C.t * 0.07;
      camPos.lerp(new THREE.Vector3(boss.x + Math.cos(yaw) * R, boss.y + boss.plan.hipY * boss.scale * 0.8, boss.z + Math.sin(yaw) * R), k);
      camLook.lerp(new THREE.Vector3(boss.x, boss.y + boss.plan.hipY * boss.scale * 1.4, boss.z), k * 1.3);
    } else if (C.type === 'win' || C.type === 'fin') {
      const R = HERO.cam * heroScale() * (C.type === 'fin' ? 1.3 : 0.9);
      const yaw = p.yaw + 0.9 + C.t * 0.3;
      const y = p.y + heroHeight() * 1.1;
      camPos.lerp(new THREE.Vector3(p.x + Math.cos(yaw) * R, y, p.z + Math.sin(yaw) * R), k);
      const skyward = C.type === 'fin' && C.t > 4.5 && world.meteor;
      const lookY = skyward ? p.y + heroHeight() * 1.4 + (C.t - 4.5) * HERO.cam * heroScale() * 0.4 : p.y + heroHeight() * 1.2;
      camLook.lerp(new THREE.Vector3(p.x, lookY, p.z), k);
    }
    applyCamera(55, dt);
  }

  function updateCinematic(dt) {
    const C = cinematic;
    C.t += dt;
    if (C.type === 'duel' && C.t >= C.dur) endDuelIntro();
    else if (C.type === 'win' && C.t >= C.dur) nextChapter();
    else if (C.type === 'fin' && C.t >= C.dur) finish();
    else if (C.type === 'fin' && C.t > 12.4) {
      const k = (C.t - 12.4) / 2.6;
      $('black').style.background = `rgba(255, 240, 210, ${Math.min(1, k * 1.8)})`;
      $('black').style.opacity = '1';
      camShake = Math.max(camShake, 1.4);
      if (!C.boom) { C.boom = true; sfx.boom(); host.buzz([200, 100, 300]); }
    }
  }

  function finish() {
    if (stopped) return;
    stop();
    host.onFinish();
  }

  /* ---------- La météorite : plus on avance dans le chapitre, plus elle est là ---------- */
  function updateMeteor(dt) {
    if (!world.meteor) return;
    const M = world.meteor;
    let k = D.growth / GROWTH_FULL * 0.4 + (duelState !== 'none' ? 0.2 : 0);
    if (cinematic && cinematic.type === 'fin') k = 0.6 + clamp((cinematic.t - 4) / 8.5, 0, 1) * 0.4;
    const R = world.radius;
    const a = camYaw * 0 + 2.2;
    const dist = lerp(R * 2.4, R * 0.4, k * k);
    M.position.set(p.x + Math.cos(a) * dist, p.y + lerp(R * 1.1, R * 0.08, k * k), p.z + Math.sin(a) * dist);
    M.scale.setScalar(R * lerp(0.012, 0.12, k * k));
    void dt;
  }

  /* ---------- La peur : le cœur, les bords de l'écran, les flèches ---------- */
  function updateFear(dt) {
    hurtFlash = Math.max(0, hurtFlash - dt * 1.8);
    flashT = Math.max(0, flashT - dt * 3);
    $v('hurt').style.opacity = String(hurtFlash * 0.85);
    const hpK = p.hp / heroHpMax();
    const low = hpK < 0.34 ? 0.35 + Math.sin(time * 5) * 0.15 : 0;
    $v('danger').style.opacity = String(Math.min(0.95, heartClose * 0.72 + low));
    $v('hide').style.opacity = p.hidden ? '1' : '0';
    if ($('black').dataset.flash !== String(flashT > 0.01)) $('black').dataset.flash = String(flashT > 0.01);
    if (!(cinematic && cinematic.type === 'fin')) {
      $('black').style.background = flashT > 0 ? `rgba(255,255,255,${flashT * 0.5})` : 'transparent';
      $('black').style.opacity = '1';
    }
    heartT -= dt;
    if (heartClose > 0.04 && heartT <= 0 && !p.dead) {
      sfx.heart(heartClose > 0.45);
      heartT = heartClose > 0.45 ? 0.42 : 0.72;
    }
    // le tambour du duel
    if (duelState === 'fight') {
      drumT -= dt;
      if (drumT <= 0) {
        drumT = boss && boss.hp < boss.hpMax * 0.5 ? 0.42 : 0.56;
        sfx.drum(boss && boss.hp < boss.hpMax * 0.5);
      }
    }
  }

  /* ---------- Des flèches sur les bords : la cible, et ce qui te traque ---------- */
  const arrowEls = [];
  const v3 = new THREE.Vector3();
  function setArrow(i, x, y, z, cls, sym) {
    let el = arrowEls[i];
    if (!el) {
      el = document.createElement('div');
      el.className = 'd3-arrow';
      $('arrows').appendChild(el);
      arrowEls[i] = el;
    }
    v3.set(x, y, z).project(camera);
    const behind = v3.z > 1;
    let sx = v3.x, sy = v3.y;
    if (behind) { sx = -sx; sy = -sy; }
    const onScreen = !behind && Math.abs(sx) < 0.86 && Math.abs(sy) < 0.8;
    if (onScreen && !cls.includes('near')) { el.style.display = 'none'; return; }
    const ang = Math.atan2(sy, sx);
    const mx = 0.86, my = 0.8;
    const n = Math.max(Math.abs(Math.cos(ang)) / mx, Math.abs(Math.sin(ang)) / my);
    const ex = (Math.cos(ang) / n + 1) / 2, ey = (1 - Math.sin(ang) / n) / 2;
    el.style.display = '';
    el.className = `d3-arrow ${cls}`;
    el.style.left = `${ex * 100}%`;
    el.style.top = `${ey * 100}%`;
    el.innerHTML = `<i style="transform:rotate(${-ang}rad)"></i><span>${sym}</span>`;
  }

  function updateArrows() {
    let i = 0;
    if (!cinematic && !modal) {
      // la cible de la mission en cours
      const todo = missions.map(missionInfo).find((m) => !m.done);
      let best = null, bd = Infinity;
      if (todo) {
        if (todo.target) {
          for (const c of creatures) {
            if (c.dead || !todo.target(c)) continue;
            const d = Math.hypot(c.x - p.x, c.z - p.z);
            if (d < bd) { bd = d; best = { x: c.x, y: c.y, z: c.z }; }
          }
        } else if (todo.plant) {
          for (const P of world.plants) {
            if (!P.alive) continue;
            const d = Math.hypot(P.x - p.x, P.z - p.z);
            if (d < bd) { bd = d; best = { x: P.x, y: P.y, z: P.z }; }
          }
        } else if (todo.hide && creatures.some((c) => c.state === 'chase')) {
          for (const h of world.hides) {
            const d = Math.hypot(h.x - p.x, h.z - p.z);
            if (d < bd) { bd = d; best = { x: h.x, y: world.height(h.x, h.z), z: h.z }; }
          }
        }
      }
      if (best) setArrow(i++, best.x, best.y, best.z, 'd3-goal', '🎯');
      // ce qui te chasse, dans ton dos
      const chasers = creatures.filter((c) => !c.dead && (c.state === 'chase' || c.state === 'windup' || c.boss)).sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z)).slice(0, 2);
      for (const c of chasers) setArrow(i++, c.x, c.y + c.plan.hipY * c.scale, c.z, 'd3-threat', '⚠️');
    }
    for (; i < arrowEls.length; i++) arrowEls[i].style.display = 'none';
  }

  /* ---------- Le radar ---------- */
  function drawRadar() {
    const S = radar.width, c = S / 2;
    rctx.clearRect(0, 0, S, S);
    const range = Math.max(38, D3.biome.fog.far * 0.62) * stats.radar;
    rctx.save();
    rctx.translate(c, c);
    rctx.beginPath();
    rctx.arc(0, 0, c - 6, 0, TAU);
    rctx.fillStyle = 'rgba(12, 30, 26, 0.72)';
    rctx.fill();
    rctx.clip();
    // la carte tourne avec la caméra : le haut, c'est devant toi
    rctx.rotate(-camYaw - Math.PI / 2);
    const k = (c - 8) / range;
    rctx.fillStyle = 'rgba(90, 210, 110, 0.32)';
    for (const h of world.hides) {
      const dx = (h.x - p.x) * k, dz = (h.z - p.z) * k;
      if (Math.abs(dx) > c || Math.abs(dz) > c) continue;
      rctx.beginPath();
      rctx.arc(dx, dz, Math.max(4, h.r * k), 0, TAU);
      rctx.fill();
    }
    if (herbivore()) {
      rctx.fillStyle = '#BFE85A';
      for (const P of world.plants) {
        if (!P.alive) continue;
        const dx = (P.x - p.x) * k, dz = (P.z - p.z) * k;
        if (Math.abs(dx) > c || Math.abs(dz) > c) continue;
        rctx.fillRect(dx - 3, dz - 3, 6, 6);
      }
    }
    for (const a of creatures) {
      if (a.dead) continue;
      const dx = (a.x - p.x) * k, dz = (a.z - p.z) * k;
      if (dx * dx + dz * dz > c * c) continue;
      const kd = a.sp.kind;
      const danger = kd === 'hunter' || kd === 'swimmer' || kd === 'flyer' || kd === 'defender' || a.boss;
      if (kd === 'giant') { rctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; rctx.beginPath(); rctx.arc(dx, dz, 9, 0, TAU); rctx.fill(); continue; }
      rctx.fillStyle = danger ? (a.state === 'chase' || a.boss ? '#FF4B3A' : '#E88A6A') : '#FFD24A';
      rctx.beginPath();
      rctx.arc(dx, dz, a.boss ? 11 : danger ? 7 : 4.5, 0, TAU);
      rctx.fill();
    }
    rctx.restore();
    // toi, au milieu : une flèche vers le haut
    rctx.save();
    rctx.translate(c, c);
    rctx.rotate(p.yaw - camYaw);
    rctx.fillStyle = '#FFFFFF';
    rctx.beginPath();
    rctx.moveTo(12, 0);
    rctx.lineTo(-8, -8);
    rctx.lineTo(-4, 0);
    rctx.lineTo(-8, 8);
    rctx.closePath();
    rctx.fill();
    rctx.restore();
    rctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    rctx.lineWidth = 3;
    rctx.beginPath();
    rctx.arc(c, c, c - 6, 0, TAU);
    rctx.stroke();
  }

  /* ---------- L'affichage ---------- */
  let lastHud = '';
  function renderHud() {
    const hp = clamp(p.hp / heroHpMax(), 0, 1);
    const key = `${Math.round(hp * 100)}|${Math.round(D.growth)}|${Math.round(p.stamina * 40)}|${boss ? Math.round((boss.hp / boss.hpMax) * 200) : ''}`;
    if (key === lastHud) return;
    lastHud = key;
    $b('hp').style.width = `${hp * 100}%`;
    $b('hp').classList.toggle('low', hp < 0.34);
    $b('grow').style.width = `${D.growth}%`;
    $b('stamina').style.width = `${p.stamina * 100}%`;
    if (boss) $b('boss').style.width = `${clamp(boss.hp / boss.hpMax, 0, 1) * 100}%`;
  }

  /* ---------- La boucle ---------- */
  function tips(dt) {
    tipT -= dt;
    if (tipT <= 0 && D3.tips) {
      tipT = rnd(30, 44);
      if (performance.now() > lastSay) {
        say(D3.tips[tipI % D3.tips.length], 1, 6000);
        tipI++;
      }
    }
    if (performance.now() > lastSay) root.querySelector('.d3-ammo').classList.remove('talking'), $('bubble').classList.remove('show');
    factT -= dt;
    if (factT <= 0 && !$('fact').hidden) {
      $('fact').hidden = true;
      const q = factQ.shift();
      if (q) later(() => showFact(q), 0.5);
    }
    seenT -= dt;
    if (seenT <= 0) {
      seenT = 0.6;
      for (const c of creatures) {
        if (seen[c.id] || c.dead || !F[c.id].fact || c.stamp) continue;
        if (Math.hypot(c.x - p.x, c.z - p.z) < D3.biome.fog.far * 0.45) {
          seen[c.id] = true;
          showFact(c.id);
          break;
        }
      }
    }
  }

  function step(dt) {
    const pausedAll = paused || (modal && !cinematic);
    if (pausedAll) return;
    if (slowT > 0) slowT -= dt; else slow = 1;
    const sdt = dt * slow;
    time += sdt;
    runTimers();
    if (cinematic) updateCinematic(dt);
    if (!p || stopped) return;
    updatePlayer(sdt);
    updateCreatures(sdt);
    updateHazards(sdt);
    if (!cinematic) director(sdt);
    updateDecals(sdt);
    updateFear(dt);
    updateMeteor(dt);
    if (!botOn) tips(dt);
    saveT += dt;
    if (saveT > 8) {
      saveT = 0;
      D.pos = { x: Math.round(p.x), z: Math.round(p.z), yaw: p.yaw };
      host.save();
    }
    if (Math.floor(time) !== Math.floor(time - sdt)) populate(false);
  }

  let lastT = 0;
  let raf = 0;
  function loop(now) {
    if (stopped) return;
    raf = requestAnimationFrame(loop);
    if (!scene || !world || !p) return;
    let dt = Math.min(0.05, lastT ? (now - lastT) / 1000 : 0);
    lastT = now;
    paused = host.isPaused();
    if (botOn) return;
    step(dt);
    if (paused || stopped) return;
    frameCount++;
    updateParticles(dt * (modal ? 0 : 1));
    updateCamera(modal ? 0 : dt);
    world.update(time, camera, camPos.clone().lerp(new THREE.Vector3(p.x, p.y, p.z), 0.9), Math.max(24, HERO.cam * heroScale() * 2.6));
    updateFloaters(dt);
    updateArrows();
    if (frameCount % 3 === 0) drawRadar();
    renderHud();
    renderer.render(scene, camera);
    // l'appareil rame ? on baisse la qualité, sans rien dire
    fpsT += dt;
    fpsN++;
    if (fpsT > 4) {
      const fps = fpsN / fpsT;
      fpsT = 0;
      fpsN = 0;
      if (fps < 30) lowerQuality();
    }
  }
  let qualityStep = 0;
  function lowerQuality() {
    qualityStep++;
    if (qualityStep === 1) {
      renderer.shadowMap.enabled = false;
      quality.shadows = false;
      scene.traverse((o) => { if (o.isDirectionalLight) o.castShadow = false; if (o.material) o.material.needsUpdate = true; });
    } else if (qualityStep <= 3) {
      renderer.setPixelRatio(Math.max(0.7, quality.pixel * (1 - qualityStep * 0.22)));
      resize();
    }
  }

  /* ---------- Les commandes ---------- */
  function onKey(e) {
    if (stopped) return;
    if (e.type === 'keydown') {
      if (modal || host.isPaused()) {
        if ((e.code === 'Enter' || e.code === 'Space') && root.querySelector('[data-go]')) { e.preventDefault(); root.querySelector('[data-go]').click(); }
        return;
      }
      if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
      keys[e.code] = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'Space') sprintHeld = true;
      if (!e.repeat && (e.code === 'KeyF' || e.code === 'Enter' || e.code === 'KeyE')) startAttack();
    } else {
      keys[e.code] = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'Space') sprintHeld = false;
    }
  }
  function onBlur() { for (const k of Object.keys(keys)) keys[k] = false; sprintHeld = false; stick.id = null; stick.x = stick.y = 0; }
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKey);
  window.addEventListener('blur', onBlur);

  const stickEl = $('stick'), knob = $('knob');
  function placeKnob() { knob.style.transform = `translate(${stick.x * 34}px, ${stick.y * 34}px)`; }
  canvas.addEventListener('pointerdown', (e) => {
    if (modal || cinematic) return;
    if (e.pointerType === 'touch' && e.clientX < window.innerWidth * 0.45 && stick.id === null) {
      // le pouce gauche : un joystick là où il se pose
      stick.id = e.pointerId;
      stick.cx = e.clientX;
      stick.cy = e.clientY;
      stick.x = stick.y = 0;
      stickEl.style.left = `${e.clientX}px`;
      stickEl.style.top = `${e.clientY}px`;
      stickEl.classList.add('on');
      placeKnob();
      canvas.setPointerCapture?.(e.pointerId);
      return;
    }
    drag = { id: e.pointerId, x: e.clientX, moved: 0, start: performance.now() };
    canvas.setPointerCapture?.(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerId === stick.id) {
      const dx = e.clientX - stick.cx, dy = e.clientY - stick.cy;
      const n = Math.hypot(dx, dy), m = Math.min(1, n / 46);
      stick.x = n ? (dx / n) * m : 0;
      stick.y = n ? (dy / n) * m : 0;
      placeKnob();
      return;
    }
    if (drag && e.pointerId === drag.id) {
      const dx = e.clientX - drag.x;
      drag.x = e.clientX;
      drag.moved += Math.abs(dx);
      camYaw += dx * 0.006;
    }
  });
  const endPointer = (e) => {
    if (e.pointerId === stick.id) {
      stick.id = null;
      stick.x = stick.y = 0;
      stickEl.classList.remove('on');
      placeKnob();
      return;
    }
    if (drag && e.pointerId === drag.id) {
      // un simple clic (sans glisser) : un coup
      if (drag.moved < 8 && performance.now() - drag.start < 300 && !phone) startAttack();
      drag = null;
    }
  };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  const btn = (a) => root.querySelector(`[data-a="${a}"]`);
  btn('sprint').addEventListener('pointerdown', (e) => { e.preventDefault(); sprintHeld = true; });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn('sprint').addEventListener(ev, () => { sprintHeld = false; }));
  btn('attack').addEventListener('pointerdown', (e) => { e.preventDefault(); startAttack(); });
  btn('sound').addEventListener('click', (e) => { e.currentTarget.textContent = host.toggleSound() ? '🔊' : '🔇'; });
  btn('misToggle').addEventListener('click', () => { root.querySelector('.d3-missions').classList.toggle('closed'); });
  if (phone) root.querySelector('.d3-missions').classList.add('closed');

  function stop() {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(raf);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('keyup', onKey);
    window.removeEventListener('blur', onBlur);
    window.removeEventListener('resize', resize);
    if (p && world) { D.pos = { x: Math.round(p.x), z: Math.round(p.z), yaw: p.yaw }; }
    host.save();
    clearWorld();
    renderer.dispose();
    renderer.forceContextLoss?.();
    root.remove();
    document.body.classList.remove('dino-on');
  }

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* ---------- (?debug) Le pilote automatique : pour tester l'équilibre ---------- */
  let botDiet = 'carnivore', botDeaths = 0, botSprint = false, botCareful = true;
  function botThink(dt) {
    botT -= dt;
    botSprint = false;
    if (p.dead) { botDirV = null; return; }
    const todo = missions.map(missionInfo).find((m) => !m.done);
    let tx = null, tz = null;
    // le danger d'abord
    let threat = null, td = Infinity;
    for (const c of creatures) {
      if (c.dead || c.boss) continue;
      if (c.sp.kind !== 'hunter' && c.sp.kind !== 'defender') continue;
      if (c.state === 'windup' || c.state === 'lunge' || c.state === 'charge' || c.state === 'chase' || c.state === 'alert') {
        const d = Math.hypot(c.x - p.x, c.z - p.z);
        if (d < td) { td = d; threat = c; }
      }
    }
    const mustFight = todo && todo.target && threat && todo.target(threat);
    if (threat && !mustFight && !fearsPlayer(threat) && td < 22 * heroScale() && (botCareful ? true : p.hp < heroHpMax() * 0.5)) {
      // fuir vers une cachette
      let best = null, bd = Infinity;
      for (const h of world.hides) { const d = Math.hypot(h.x - p.x, h.z - p.z); if (d < bd) { bd = d; best = h; } }
      if (best) { tx = best.x; tz = best.z; botSprint = bd > best.r; if (bd < best.r * 0.5) { botDirV = null; return; } }
    }
    if (boss && !boss.dead && duelState === 'fight') {
      const d = Math.hypot(boss.x - p.x, boss.z - p.z);
      if (boss.state === 'recover') {
        tx = boss.x; tz = boss.z;
        botSprint = true;
        if (d < boss.r + heroRadius() + heroReach() * 1.4) { p.yaw = turnTo(p.yaw, Math.atan2(boss.z - p.z, boss.x - p.x), 12 * dt); startAttack(); }
      } else {
        // s'écarter de sa ligne d'attaque (ou de son souffle)
        const away = Math.atan2(p.z - boss.z, p.x - boss.x);
        const a = boss.state === 'roarWind' ? away : away + 1.25;
        tx = p.x + Math.cos(a) * 20;
        tz = p.z + Math.sin(a) * 20;
        botSprint = boss.state === 'windup' || boss.state === 'chargeWind' || boss.state === 'charge' || boss.state === 'roarWind' || boss.state === 'lunge';
      }
    } else if (tx === null && todo) {
      if (todo.target) {
        let best = null, bd = Infinity;
        for (const c of creatures) {
          if (c.dead || !todo.target(c)) continue;
          const d = Math.hypot(c.x - p.x, c.z - p.z);
          if (d < bd) { bd = d; best = c; }
        }
        if (best) {
          tx = best.x; tz = best.z;
          botSprint = bd < 26 * heroScale() && p.stamina > 0.3 && (!best.alt || best.state === 'hover');
          if (bd < best.r + heroRadius() + heroReach() * 1.3) { p.yaw = turnTo(p.yaw, Math.atan2(best.z - p.z, best.x - p.x), 12 * dt); startAttack(); }
        }
      } else if (todo.plant || todo.grow || (herbivore() && !todo.target && !todo.hide && !todo.duel)) {
        let best = null, bd = Infinity;
        for (const P of world.plants) { if (!P.alive) continue; const d = Math.hypot(P.x - p.x, P.z - p.z); if (d < bd) { bd = d; best = P; } }
        if (best) { tx = best.x; tz = best.z; }
      } else if (todo.hide) {
        // se faire poursuivre, puis se cacher
        let best = null, bd = Infinity;
        for (const h of world.hides) { const d = Math.hypot(h.x - p.x, h.z - p.z); if (d < bd) { bd = d; best = h; } }
        if (best && creatures.some((c) => c.state === 'chase' || c.state === 'search')) { tx = best.x; tz = best.z; botSprint = bd > best.r * 2; if (bd < best.r * 0.5) { botDirV = null; return; } } else {
          const h = creatures.find((c) => c.sp.kind === 'hunter' && !c.dead);
          if (h) { tx = h.x; tz = h.z; }
        }
      }
      if (tx === null && !todo.duel) {
        // grandir : on mange ce qu'on trouve
        let best = null, bd = Infinity;
        for (const c of creatures) {
          if (c.dead || c.alt || !(c.sp.food > 0) || c.sp.kind === 'giant') continue;
          const d = Math.hypot(c.x - p.x, c.z - p.z);
          if (d < bd && (c.sp.kind === 'prey' || c.sp.kind === 'neutral' || heroBite() * 3 > c.hp)) { bd = d; best = c; }
        }
        if (best) { tx = best.x; tz = best.z; if (bd < best.r + heroRadius() + heroReach() * 1.3) startAttack(); }
      }
    }
    // celui qui nous attaque, on le frappe
    if (threat && td < threat.r + heroRadius() + heroReach() * 1.5 && (threat.state === 'recover' || !botCareful || mustFight)) startAttack();
    if (tx === null) { botDirV = null; return; }
    const dx = tx - p.x, dz = tz - p.z, n = Math.hypot(dx, dz);
    botDirV = n > 0.2 ? { x: dx / n, z: dz / n, m: 1 } : null;
  }

  /* ---------- Lancement ---------- */
  setupChapter(!game.dino.started);
  game.dino.started = true;
  raf = requestAnimationFrame(loop);

  const api = {
    stop,
    /** (?debug) joue en accéléré, sans dessiner : combien de temps ? combien de morts ? */
    simulate(maxSec = 900, diet = 'carnivore', careful = true) {
      botOn = true;
      botDiet = diet;
      botCareful = careful;
      if (!D.diet && game.chapter >= 2) D.diet = diet;
      const res = [];
      let chStart = 0, sim = 0, ch = game.chapter;
      const dt = 1 / 30;
      modal = false;
      $('screen').hidden = true;
      if (D3.choice && !D.diet) D.diet = diet;
      if (!p) setupChapter(true, false);
      for (; sim < maxSec && !stopped; sim += dt) {
        if (finished && cinematic && cinematic.type === 'fin') break;
        botThink(dt);
        step(dt);
        if (game.chapter !== ch) {
          res.push({ ch: ch + 1, s: Math.round(sim - chStart), deaths: botDeaths });
          ch = game.chapter;
          chStart = sim;
        }
      }
      res.push({ ch: ch + 1, s: Math.round(sim - chStart), deaths: botDeaths, end: finished });
      const out = { total: Math.round(sim), deaths: botDeaths, chapters: res, diet: D.diet, finished, growth: Math.round(D.growth), missions: missions.map((m) => missionInfo(m).done), log: botLog.filter((l) => l.includes('missions')).slice(0, 70), duel: duelState, bossHp: boss ? [Math.round(boss.hp), boss.hpMax] : null };
      botOn = false;
      return out;
    },
    get state() { return { chapter: game.chapter, p, creatures, boss, duelState, world, D, modal, cinematic, time }; },
    closeModal() { const b = root.querySelector('[data-go]'); if (b) b.click(); },
    go(i) { game.chapter = i; if (!D.diet && i >= 2) D.diet = 'carnivore'; setupChapter(true, false); },
    spawn(id, dx, dz) { return makeCreature(id, p.x + dx, p.z + dz, {}); },
    duel() { startDuel(); },
    feed(n) { feed(n / GROWTH_RATE, null); },
    diet() { D.diet = null; setupChapter(true); },
    camera,
    get scene() { return scene; },
    get info() { return renderer.info.render; },
  };
  if (debug) window.__dino = api;
  return api;
}
