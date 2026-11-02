// ============================================================================
// Évolution — le code commun à TOUS les niveaux sur la terre ferme
// (world.ground === 'land'). Rien ici ne connaît une espèce par son nom.
//
//   - La course : réactive, avec de l'élan quand on garde sa direction.
//   - Le pivot : les animaux sont dessinés de profil ; ici, leur dessin tourne
//     en perspective selon leur direction (vers le haut, on voit le corps
//     filer vers le haut de l'écran, comme vu d'un peu au-dessus).
//   - Le saut (hauteur = e.z) : il fait passer au-dessus des morsures et des
//     mares ; on rebondit sur la tête des adversaires (BOING !) ; en l'air, un
//     second appui fait un plongeon qui secoue tout autour (BOUM !).
//   - Les champignons-trampolines et les chaînes d'ADN à attraper en l'air.
//   - Les petits bonds des bêtes : le chasseur qui bondit, la proie qui détale.
// ============================================================================

import { INK, LANDFX, shade } from './art.js';
import { sfx } from './sound.js';

const TAU = Math.PI * 2;

/* ---------- Réglages de la course ---------- */
export const LAND_SPEED = 1.85;    // tous les niveaux sur terre vont à la même vitesse
export const LAND_MAX = 680;       // vitesse maximale (pour les très gros animaux)
const GRIP = 11;                   // au sol, on suit vite ce que demande le joueur
const GRIP_STOP = 9;               // et on s'arrête vite quand on lâche
const GRIP_AIR = 2.8;              // en l'air, on garde son élan
const ELAN_TIME = 1.3;             // s à garder sa direction pour être lancé à fond
const ELAN_BONUS = 0.28;           // lancé à fond : 28 % plus vite
const TURN_LAND = 13;              // rad/s pour se tourner

/* ---------- Réglages du pivot ---------- */
const MIN_WIDTH = 0.58;            // vu de dos ou de face, le corps paraît presque moitié moins long
const TILT = 0.62;                 // la caméra regarde d'un peu au-dessus

/* ---------- Réglages du saut ---------- */
const JUMP_TIME = 0.66;            // s en l'air (toujours pareil, quelle que soit la taille)
const SPRING_TIME = 1.25;          // s en l'air après un champignon
const SLAM_RECHARGE = 2.2;         // s entre deux plongeons
const SLAM_STUN = 1.3;             // s assommé par un plongeon
const STOMP_STUN = 2;              // s assommé par un rebond sur la tête

export function createTerre(api) {
  let bumps = [];                  // les champignons-trampolines du chapitre
  let chains = [];                 // les chaînes d'ADN
  let chainT = 0;
  let botT = 0;

  const on = () => api.level().world.ground === 'land';
  const jumpH = (e) => 70 + e.size * 1.5;
  const airborne = () => on() && (api.player().z || 0) > api.player().size * 0.45;
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* ---------- La poussière (la couleur vient du sol du chapitre) ---------- */
  function dustColor() {
    const pal = api.chapter().palette;
    return pal.dust || shade(pal.floor, 0.28);
  }
  function dust(x, y, n, spread, size) {
    const col = dustColor();
    const list = api.particles();
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = rnd(spread * 0.25, spread);
      list.push({ x: x + Math.cos(a) * size, y: y + Math.sin(a) * size * 0.4, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.45 - 12, life: 0, max: rnd(0.3, 0.6), size: rnd(size * 0.35, size * 0.8), color: col });
    }
  }

  /* ---------- Un chapitre commence : on replante les champignons ---------- */
  function setup() {
    bumps = [];
    chains = [];
    if (!on()) return;
    const W = api.level().world, p = api.player();
    const ch = api.game().chapter;
    let seed = (api.game().level + 3) * 7919 + ch * 104729;
    const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const R = Math.min(170, 40 + api.chapter().size[0] * 0.7);
    const free = (x, y) => !api.zones().some((z) => Math.hypot(z.x - x, z.y - y) < z.r + R);
    for (let i = 0; i < 34; i++) {
      const x = 200 + r() * (W.w - 400), y = 200 + r() * (W.h - 400);
      if (free(x, y)) bumps.push({ x, y, r: R * (0.85 + r() * 0.3), t: 0, seed: r() * 10 });
    }
    // le premier est tout près, pour le découvrir tout de suite
    for (const [dx, dy] of [[R * 4, -R * 2], [-R * 4, -R * 2], [R * 4, R * 2.5], [-R * 4, R * 2.5]]) {
      if (free(p.x + dx, p.y + dy)) { bumps.push({ x: p.x + dx, y: p.y + dy, r: R, t: 0, seed: 1 }); break; }
    }
  }

  /* ---------- La course du joueur (remplace la nage) ---------- */
  function run(p, want, top, dt, dashing) {
    const air = (p.z || 0) > 0;
    const sp = Math.hypot(p.vx, p.vy);
    const along = want && sp > 20 ? (p.vx * want.x + p.vy * want.y) / sp : 1;
    // l'élan : il monte tant qu'on garde sa direction, il tombe quand on tourne fort
    if (want && along > 0.75) p.elan = Math.min(1, (p.elan || 0) + dt / ELAN_TIME);
    else p.elan = Math.max(0, (p.elan || 0) - dt * (want ? (along < 0 ? 4 : 1.2) : 2.5));
    const v = top * (1 + p.elan * ELAN_BONUS);
    const tx = want ? want.x * v : 0, ty = want ? want.y * v : 0;
    const grip = air ? (want ? GRIP_AIR : 0.5) : want ? GRIP : GRIP_STOP;
    const k = 1 - Math.exp(-grip * dt);
    p.vx += (tx - p.vx) * k;
    p.vy += (ty - p.vy) * k;
    if (air) return;
    // demi-tour à pleine vitesse : on dérape !
    if (want && along < -0.2 && sp > top * 0.6 && performance.now() > (p.skidAt || 0)) {
      p.skidAt = performance.now() + 450;
      dust(p.x, p.y + p.size * 0.85, 7, 90 + p.size, Math.max(5, p.size * 0.22));
      sfx.skid();
    }
    // la poussière sous les pattes ; lancé à fond, des traits de vitesse
    const speedK = Math.min(1.5, sp / Math.max(1, top));
    if (speedK > 0.55 && Math.random() < dt * (6 + speedK * 16)) dust(p.x - p.vx * 0.03, p.y + p.size * 0.85, 1, 40, Math.max(4, p.size * 0.2));
    if ((p.elan > 0.85 || dashing) && Math.random() < dt * 24) {
      const a = Math.atan2(p.vy, p.vx), o = rnd(-1, 1) * p.size * 1.1;
      api.particles().push({ x: p.x - Math.cos(a) * p.size - Math.sin(a) * o, y: p.y - p.size * 0.2 - Math.sin(a) * p.size + Math.cos(a) * o, vx: p.vx * 0.2, vy: p.vy * 0.2, life: 0, max: 0.22, size: p.size * rnd(0.6, 1.1), color: '#FFFFFF', streak: a });
    }
  }

  /* ---------- Le pivot : où regarde le corps (tourné progressivement) ---------- */
  function turn(e, dt) {
    if (!e.side) return;
    const f = e.face || 1;
    const cw = f * Math.max(Math.abs(Math.cos(e.angle)), MIN_WIDTH);
    const cs = Math.sin(e.angle) * TILT;
    if (e.tw === undefined) { e.tw = cw; e.ts = cs; return; }
    e.tw += (cw - e.tw) * (1 - Math.exp(-13 * dt));
    e.ts += (cs - e.ts) * (1 - Math.exp(-10 * dt));
  }

  /** Où est un point du corps (lx, ly en × taille, tourné vers l'avant), une fois pivoté */
  function bodyPoint(e, lx, ly) {
    if (e.tw === undefined) return { x: e.x + (e.face || 1) * e.size * lx, y: e.y + e.size * ly };
    return { x: e.x + e.tw * e.size * lx, y: e.y + e.size * (ly + e.ts * lx) };
  }

  /** Dessine un animal de profil, pivoté, à sa hauteur (son ombre reste au sol) */
  function paint(e, fn) {
    if (!e.side || !on()) { fn(); return; }
    if (e.tw === undefined) turn(e, 0);
    const c = api.ctx();
    const z = e.z || 0;
    const f = e.face || 1;
    if (z > 0) {
      const k = 1 / (1 + z / (e.size * 3 + 60));
      c.fillStyle = `rgba(0, 25, 15, ${0.32 * k})`;
      c.beginPath();
      c.ellipse(e.x, e.y + e.size * 0.9, e.size * 0.95 * k, e.size * 0.24 * k, 0, 0, TAU);
      c.fill();
    }
    // on s'étire en montant, on s'écrase en retombant au sol
    const vz = e.vz || 0;
    const stretch = z > 0 ? Math.max(-0.1, Math.min(0.14, Math.abs(vz) / (jumpH(e) * 22))) : -(e.landSq || 0) * 0.22;
    const pitch = z > 0 ? Math.max(-0.42, Math.min(0.42, -vz / (jumpH(e) * 12))) : 0;
    // le petit galop : le corps sautille quand on court vite
    const bob = z > 0 ? 0 : Math.abs(Math.sin(e.walk * 1.5)) * e.size * 0.05 * Math.min(1, e.speed || 0);
    // plus près de nous quand il descend vers le bas de l'écran
    const near = 1 + e.ts * 0.09;
    c.save();
    c.translate(e.x, e.y - z - bob + (stretch < 0 ? e.size * 0.9 * -stretch : 0));
    c.scale(near * (1 - stretch * 0.7), near * (1 + stretch));
    c.transform(e.tw * f, e.ts * f, 0, 1, 0, 0);
    if (pitch) c.rotate(f * pitch);
    c.translate(-e.x, -e.y);
    const was = LANDFX.noShadow;
    LANDFX.noShadow = z > 0;
    fn();
    LANDFX.noShadow = was;
    c.restore();
  }

  /* ---------- Le saut ---------- */
  function launch(e, h, T) {
    e.vz = 4 * h / T;
    e.g = 8 * h / (T * T);
    e.z = Math.max(e.z || 0, 0.01);
    e.gk = 1;
  }

  /** Espace (ou le bouton Saute) vient d'être appuyé */
  function press() {
    if (!on()) return;
    const p = api.player();
    if (!p || p.dead || api.blocked()) return;
    if (!(p.z > 0)) {
      launch(p, jumpH(p), JUMP_TIME);
      p.spring = false;
      p.slam = false;
      sfx.jump();
      dust(p.x, p.y + p.size * 0.85, 6, 70, Math.max(4, p.size * 0.2));
      api.game().jumped = true;
      return;
    }
    // presque au sol : on garde l'appui pour le prochain saut ; plus haut : le plongeon !
    if (p.vz < 0 && p.z < jumpH(p) * 0.22) { p.jumpQ = 0.16; return; }
    if ((p.slamT || 0) > 0 || p.slam) return;
    p.slam = true;
    p.slamFrom = p.z;
    p.vz = -(jumpH(p) * 9);
    p.vx *= 0.35;
    p.vy *= 0.35;
    p.gk = 1.5;
    sfx.dive();
  }

  /** On lâche : un petit saut (sauf sur un champignon ou en plein plongeon) */
  function release() {
    const p = api.player();
    if (!on() || !p || p.slam || p.spring) return;
    if (p.vz > 0) p.gk = 2.3;
  }

  function land(p) {
    p.z = 0;
    const fell = p.vz;
    p.vz = 0;
    p.landSq = 1;
    p.bounces = 0;
    const big = Math.max(5, p.size * 0.26);
    if (p.slam) {
      p.slam = false;
      p.slamT = SLAM_RECHARGE;
      slam(p);
    } else if (fell < -jumpH(p) * 2) {
      dust(p.x, p.y + p.size * 0.85, 8, 90 + p.size * 0.5, big);
      sfx.land();
    }
    if (p.jumpQ > 0) { p.jumpQ = 0; press(); }
  }

  /** Le plongeon arrive au sol : tout ce qui est autour est secoué */
  function slam(p) {
    const R = 170 + p.size * 2.3 + (p.slamFrom > jumpH(p) * 1.5 ? 120 : 0);
    api.ring(R, '#FFFFFF');
    dust(p.x, p.y + p.size * 0.8, 22, R * 0.9, Math.max(7, p.size * 0.32));
    api.addShake(0.42);
    sfx.slam();
    api.buzz(70);
    api.floater('BOUM !', p.x, p.y - p.size * 1.9, '#FFD24A', 1.4);
    let hits = 0;
    for (const c of api.creatures()) {
      const k = c.sp.kind;
      if (c.dead || c.sp.flying || c.home || !['prey', 'hunter', 'rival', 'defender', 'food'].includes(k) || k === 'food') continue;
      if (Math.hypot(c.x - p.x, c.y - p.y) > R + c.size * 0.5) continue;
      c.stunT = Math.max(c.stunT || 0, SLAM_STUN);
      c.rest = Math.max(c.rest || 0, SLAM_STUN + 1);
      if (c.state === 'chase' || c.state === 'alert' || c.state === 'charge') c.state = 'wander';
      hop(c, c.size * 0.5 + 16, 0.4);
      hits++;
    }
    if (hits >= 2) api.sayOnce('slamHit', api.lines().slamHit, 40, 2);
  }

  function updateJump(p, dt) {
    p.slamT = Math.max(0, (p.slamT || 0) - dt);
    p.jumpQ = Math.max(0, (p.jumpQ || 0) - dt);
    p.landSq = Math.max(0, (p.landSq || 0) - dt * 6);
    if (!(p.z > 0)) return;
    const wasUp = p.vz > 0;
    p.z += p.vz * dt;
    p.vz -= p.g * (p.vz > 0 ? p.gk : 1) * dt;
    if (wasUp && p.vz <= 0) p.gk = 1;
    if (p.z <= 0) land(p);
  }

  /* ---------- BOING ! On retombe sur quelqu'un ---------- */
  function stomp(p) {
    if (!(p.z > 0) || p.vz >= 0) return;
    for (const c of api.creatures()) {
      if (c.dead || c.sp.flying || c.home || c.buried || (c.stompT || 0) > 0) continue;
      const k = c.sp.kind;
      if (k === 'ally' || k === 'stray' || k === 'human' || k === 'shepherd' || k === 'food' || k === 'stinger') continue;
      if (p.z > c.size * 1.25 + 30) continue;
      if (Math.hypot(c.x - p.x, c.y - p.y) > c.size * 0.85 + p.size * 0.55) continue;
      c.stompT = 0.5;
      const wasSlam = p.slam;
      p.slam = false;
      if (api.canEat(c)) {
        api.eat(c);
        api.floater('Croc !', c.x, c.y - c.size * 1.4, '#7CF0A0', 1.1);
        launch(p, jumpH(p) * 0.6, JUMP_TIME * 0.7);
        if (wasSlam) slam(p);
        return;
      }
      p.bounces = (p.bounces || 0) + 1;
      api.game().boinged = true;
      const h = jumpH(p) * (1 + Math.min(p.bounces, 3) * 0.12);
      launch(p, h, JUMP_TIME * 1.05);
      p.spring = false;
      sfx.boing(p.bounces);
      api.addShake(0.16);
      burstStars(c);
      if (k === 'flock') { api.floater('Bêêê !', c.x, c.y - c.size * 1.5, '#FFFFFF', 1); return; }
      // déjà assommé : on rebondit, mais ça ne rapporte rien (et il finit par se réveiller)
      if (c.stunT > 0) { if (wasSlam) slam(p); return; }
      api.floater(p.bounces > 1 ? `BOING x${p.bounces} !` : 'BOING !', c.x, c.y - c.size * 1.5, '#FFD24A', 1.2 + Math.min(0.5, p.bounces * 0.1));
      if (k !== 'giant') {
        c.stunT = Math.max(c.stunT || 0, STOMP_STUN);
        c.rest = Math.max(c.rest || 0, STOMP_STUN + 1);
        if (c.state === 'chase' || c.state === 'alert' || c.state === 'charge') c.state = 'wander';
        c.landSq = 1;
        api.noteStun(c);
      }
      if (c.sp.hp && api.chapter().pack) c.hp = Math.max(1, c.hp - c.sp.hp * 0.12);
      api.deed(Math.min(2 + (p.bounces - 1) * 2, 12), c.x, c.y - c.size * 2.1);
      api.sayOnce('boing', api.lines().boing, 45, 2);
      if (wasSlam) slam(p);
      return;
    }
  }

  function burstStars(c) {
    api.burst(c.x, c.y - c.size * 0.7, 8, ['#FFD24A', '#FFFFFF'], c.size * 3 + 60, Math.max(2, c.size * 0.07));
  }

  /** Une morsure passe sous nos pattes : ouf, et bravo */
  function dodge(c) {
    const p = api.player();
    const now = performance.now();
    if (now < (p.dodgeAt || 0)) return;
    p.dodgeAt = now + 1200;
    api.floater('Esquive !', p.x, p.y - p.z - p.size * 1.7, '#9EE7FF', 1.1);
    api.deed(3, p.x, p.y - p.z - p.size * 2.5);
    sfx.phew();
    api.sayOnce('dodge', api.lines().dodge, 60, 2);
  }

  /* ---------- Les champignons-trampolines ---------- */
  function updateBumps(p, dt) {
    for (const b of bumps) b.t = Math.max(0, b.t - dt * 2.2);
    p.bumpT = Math.max(0, (p.bumpT || 0) - dt);
    if (p.bumpT > 0 || !(p.z > 0) || p.vz > 0) return;   // on rebondit en retombant dessus
    for (const b of bumps) {
      if (Math.abs(b.x - p.x) > b.r + p.size || Math.abs(b.y - p.y) > b.r + p.size) continue;
      if (Math.hypot(b.x - p.x, b.y - p.y) > b.r * 0.85 + p.size * 0.35 || p.z > b.r * 1.3) continue;
      b.t = 1;
      p.bumpT = 0.35;
      p.slam = false;
      launch(p, jumpH(p) * 2.8, SPRING_TIME);
      p.spring = true;
      p.vx *= 1.15;
      p.vy *= 1.15;
      p.elan = 1;
      sfx.spring();
      api.floater('Boiiing !', b.x, b.y - b.r * 1.5, '#FFB3C7', 1.2);
      api.sayOnce('bump', api.lines().bump, 90, 2);
      return;
    }
  }

  function drawBumps(inView) {
    const c = api.ctx();
    const snow = !!api.chapter().palette.snowy;
    for (const b of bumps) {
      if (!inView(b, b.r * 2)) continue;
      const pump = Math.sin(b.t * Math.PI * 3) * b.t;           // il s'écrase puis rebondit
      const sx = 1 + pump * 0.22, sy = 1 - pump * 0.3;
      const r = b.r;
      const capCol = snow ? '#7E9CC4' : '#E2574C';
      c.fillStyle = 'rgba(0, 25, 15, 0.22)';
      c.beginPath();
      c.ellipse(b.x, b.y + r * 0.36, r * 0.95, r * 0.3, 0, 0, TAU);
      c.fill();
      c.lineWidth = Math.max(2, r * 0.07);
      c.strokeStyle = INK;
      c.lineJoin = 'round';
      // le pied
      c.fillStyle = '#F4E8CE';
      c.beginPath();
      c.moveTo(b.x - r * 0.3, b.y + r * 0.34);
      c.quadraticCurveTo(b.x, b.y + r * 0.5, b.x + r * 0.3, b.y + r * 0.34);
      c.lineTo(b.x + r * 0.22, b.y - r * 0.2 * sy);
      c.lineTo(b.x - r * 0.22, b.y - r * 0.2 * sy);
      c.closePath();
      c.fill();
      c.stroke();
      // le chapeau
      const top = b.y - r * 0.15 * sy;
      c.fillStyle = capCol;
      c.beginPath();
      c.ellipse(b.x, top, r * sx, r * 0.72 * sy, 0, Math.PI, 0);
      c.quadraticCurveTo(b.x, top + r * 0.3, b.x - r * sx, top);
      c.closePath();
      c.fill();
      c.stroke();
      // les taches (ou la neige)
      c.fillStyle = snow ? '#F4FAFF' : '#FFF3D6';
      for (const [dx, dy, s] of [[-0.5, -0.22, 0.17], [0.05, -0.47, 0.2], [0.55, -0.2, 0.15], [0.02, -0.1, 0.11]]) {
        c.beginPath();
        c.ellipse(b.x + dx * r * sx, top + dy * r * sy, s * r, s * r * 0.75, 0, 0, TAU);
        c.fill();
      }
    }
  }

  /* ---------- Les chaînes d'ADN : à la bonne hauteur, seulement en sautant ---------- */
  function addChain(p) {
    const W = api.level().world;
    const diag = Math.hypot(api.viewW(), api.viewH());
    const a = Math.random() * TAU, d = diag * rnd(0.62, 1.2);
    const x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
    if (x < 200 || y < 200 || x > W.w - 200 || y > W.h - 200) return;
    const dir = Math.random() * TAU;
    const n = 7;
    const span = api.maxSpeed() * JUMP_TIME;
    const H = jumpH(p) * 0.85;
    const gems = [];
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      gems.push({ x: x + Math.cos(dir) * span * (u - 0.5), y: y + Math.sin(dir) * span * (u - 0.5), z: H * Math.sin(u * Math.PI), got: false });
    }
    chains.push({ x, y, gems, left: n });
  }

  function updateChains(p, dt) {
    chainT -= dt;
    const diag = Math.hypot(api.viewW(), api.viewH());
    if (chainT <= 0) {
      chainT = 0.8;
      chains = chains.filter((c) => c.left > 0 && Math.hypot(c.x - p.x, c.y - p.y) < diag * 2);
      if (chains.length < 7) addChain(p);
    }
    const H = jumpH(p);
    const R = p.size * 0.9 + 40;
    for (const c of chains) {
      if (Math.abs(c.x - p.x) > diag || Math.abs(c.y - p.y) > diag) continue;
      for (let i = 0; i < c.gems.length; i++) {
        const g = c.gems[i];
        if (g.got || Math.hypot(g.x - p.x, g.y - p.y) > R || Math.abs(g.z - (p.z || 0)) > H * 0.55) continue;
        g.got = true;
        c.left--;
        api.game().adn += 1;
        sfx.gem(c.gems.length - c.left);
        api.burst(g.x, g.y - g.z, 4, ['#FFE58A', '#FFFFFF'], 90, 4);
        if (c.left === 0) {
          const bonus = 6 + api.game().chapter * 3;
          api.deed(bonus, p.x, p.y - (p.z || 0) - p.size * 2);
          api.floater('Parfait !', p.x, p.y - (p.z || 0) - p.size * 2.8, '#FFD24A', 1.4);
          sfx.perfect();
          api.sayOnce('chain', api.lines().chain, 70, 2);
        }
      }
    }
  }

  function drawChains(inView, t) {
    const c = api.ctx();
    const z = api.zoom();
    const r = 11 / z + api.player().size * 0.05;
    for (const ch of chains) {
      for (let i = 0; i < ch.gems.length; i++) {
        const g = ch.gems[i];
        if (g.got || !inView(g, r * 4)) continue;
        // son ombre : pour savoir où sauter
        if (g.z > 4) {
          c.fillStyle = 'rgba(0, 25, 15, 0.16)';
          c.beginPath();
          c.ellipse(g.x, g.y + r * 0.6, r * 0.8, r * 0.3, 0, 0, TAU);
          c.fill();
        }
        const y = g.y - g.z + Math.sin(t * 3 + i * 0.7) * r * 0.25;
        const w = Math.cos(t * 4 + i * 0.6);                    // elle tourne sur elle-même
        c.fillStyle = 'rgba(255, 229, 138, 0.3)';
        c.beginPath();
        c.arc(g.x, y, r * 1.5, 0, TAU);
        c.fill();
        c.fillStyle = w > 0 ? '#FFD24A' : '#F2A93B';
        c.strokeStyle = INK;
        c.lineWidth = Math.max(1.2, r * 0.18);
        c.lineJoin = 'round';
        c.beginPath();
        c.moveTo(g.x, y - r);
        c.lineTo(g.x + r * 0.72 * Math.max(0.2, Math.abs(w)), y);
        c.lineTo(g.x, y + r);
        c.lineTo(g.x - r * 0.72 * Math.max(0.2, Math.abs(w)), y);
        c.closePath();
        c.fill();
        c.stroke();
      }
    }
  }

  /* ---------- Les bonds des bêtes (ça ne change que leur dessin) ---------- */
  function hop(c, h, T) {
    if (!(c.z > 0)) launch(c, h, T);
  }

  function stepCreature(c, dt) {
    if (!c.side) return;
    c.stompT = Math.max(0, (c.stompT || 0) - dt);
    c.landSq = Math.max(0, (c.landSq || 0) - dt * 5);
    if (c.z > 0) {
      c.z += c.vz * dt;
      c.vz -= c.g * dt;
      if (c.z <= 0) { c.z = 0; c.vz = 0; c.landSq = 0.5; }
    }
    if (c.z > 0 || c.stunT > 0) return;
    // le chasseur bondit au début de la poursuite
    if (c.state === 'chase' && c.lunge > 0 && !c.leapt) {
      c.leapt = true;
      hop(c, c.size * 0.55 + 30, 0.5);
    } else if (c.state !== 'chase') {
      c.leapt = false;
    }
    // la proie qui fuit détale à grands bonds
    if (c.fleeing && c.sp.kind !== 'giant' && c.size < 130 && Math.random() < dt * 2.2) hop(c, c.size * 0.45 + 14, 0.42);
    // ta meute saute avec toi
    if (c.sp.kind === 'ally' && api.player().z > 0 && api.player().vz > 0 && Math.random() < dt * 7) hop(c, c.size * 0.9 + 20, 0.55);
  }

  /* ---------- Le pilote automatique (?debug) saute aussi ---------- */
  function botThink(threat, dt) {
    const p = api.player();
    botT -= dt;
    if (!(p.z > 0) && ((threat > 0.3 && Math.random() < dt * 5) || botT <= 0)) {
      botT = rnd(2, 5);
      press();
      release();
    } else if (p.z > jumpH(p) * 0.5 && !p.slam && !(p.slamT > 0) && Math.random() < dt * 0.6) {
      press();
    }
  }

  return {
    on, airborne, run, turn, bodyPoint, paint, press, release, setup, dodge, stepCreature, botThink, drawBumps, drawChains,
    /** À chaque image, pour le joueur */
    update(p, dt) {
      if (!on() || p.dead) return;
      updateJump(p, dt);
      stomp(p);
      updateBumps(p, dt);
      updateChains(p, dt);
    },
    reset(p) { p.z = 0; p.vz = 0; p.slam = false; p.spring = false; },
    dust,
  };
}
