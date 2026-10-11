// ============================================================================
// L'ANIMATION DE DÉPART — au Centre spatial guyanais, à Kourou (le vrai
// port spatial de l'Europe) : l'astronaute rejoint la fusée, monte dans
// l'ascenseur de la tour, embarque… compte à rebours, décollage, traversée
// du ciel et des nuages, et arrivée dans l'espace au-dessus de la Terre.
//
// createIntro({ drawRocket, sfx }) renvoie { update(dt), draw(ctx, W, H), done }.
// drawRocket(ctx, t, thrust) dessine la fusée du joueur, pointe vers la droite.
// ============================================================================

const TAU = Math.PI * 2;

/* Le déroulé, en secondes */
const T = {
  walkEnd: 3.4,       // l'astronaute arrive au pied de la tour
  liftEnd: 5.0,       // l'ascenseur arrive en haut
  boardEnd: 6.1,      // il est entré dans la fusée
  armAway: 6.6,       // le bras d'accès s'écarte
  count: 7.0,         // 3… 2… 1…
  ignition: 10.0,     // mise à feu
  liftoff: 10.6,      // la fusée quitte le sol
  space: 15.0,        // on est dans l'espace
  end: 18.0,
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = (k) => k * k * (3 - 2 * k);

function mix(a, b, k) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) & 255) * (1 - k) + ((pb >> 16) & 255) * k);
  const g = Math.round(((pa >> 8) & 255) * (1 - k) + ((pb >> 8) & 255) * k);
  const bl = Math.round((pa & 255) * (1 - k) + (pb & 255) * k);
  return `rgb(${r},${g},${bl})`;
}

function mulberry32(seed) {
  return function () {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** L'astronaute, les pieds en (0, 0), haut de s pixels. walk = phase de marche (ou null) */
function drawAstronaut(c, s, walk, wave = 0) {
  const k = s / 100;
  c.save();
  c.scale(k, k);
  c.lineJoin = 'round';
  const swing = walk == null ? 0 : Math.sin(walk) * 0.5;
  // jambes
  [[-9, swing], [9, -swing]].forEach(([x, a]) => {
    c.save();
    c.translate(x, -42);
    c.rotate(a);
    c.fillStyle = '#E8EDF5';
    c.strokeStyle = '#2E2A4D';
    c.lineWidth = 3;
    c.beginPath();
    c.roundRect(-8, 0, 16, 40, 6);
    c.fill();
    c.stroke();
    c.fillStyle = '#7C88A8';
    c.fillRect(-9, 32, 18, 10);
    c.restore();
  });
  // sac à dos
  c.fillStyle = '#C9CED8';
  c.strokeStyle = '#2E2A4D';
  c.lineWidth = 3;
  c.beginPath();
  c.roundRect(-30, -90, 16, 44, 5);
  c.fill();
  c.stroke();
  // corps
  c.fillStyle = '#F2F4F8';
  c.beginPath();
  c.roundRect(-20, -92, 40, 54, 14);
  c.fill();
  c.stroke();
  c.fillStyle = '#4FB8E8';
  c.fillRect(-6, -78, 12, 8);
  c.fillStyle = '#FF6F91';
  c.fillRect(-6, -70, 12, 4);
  // bras (l'un salue)
  [[-20, swing * 0.8], [20, -swing * 0.8 - wave]].forEach(([x, a]) => {
    c.save();
    c.translate(x, -86);
    c.rotate(a + (x > 0 ? -0.15 : 0.15));
    c.fillStyle = '#E8EDF5';
    c.beginPath();
    c.roundRect(-6, 0, 12, 34, 6);
    c.fill();
    c.stroke();
    c.restore();
  });
  // casque, visière dorée
  c.fillStyle = '#FFFFFF';
  c.beginPath();
  c.arc(0, -108, 22, 0, TAU);
  c.fill();
  c.stroke();
  const g = c.createLinearGradient(-14, -118, 14, -98);
  g.addColorStop(0, '#FFE58A');
  g.addColorStop(1, '#C99212');
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(4, -108, 15, 12, 0, 0, TAU);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.7)';
  c.beginPath();
  c.ellipse(-2, -113, 5, 3, -0.5, 0, TAU);
  c.fill();
  c.restore();
}

/** Un palmier en ombre chinoise */
function palm(c, x, y, h, lean) {
  c.save();
  c.translate(x, y);
  c.strokeStyle = '#1F3A2A';
  c.lineWidth = h * 0.06;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(lean * h * 0.3, -h * 0.5, lean * h * 0.15, -h);
  c.stroke();
  c.translate(lean * h * 0.15, -h);
  c.fillStyle = '#1F3A2A';
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i - 2.5) * 0.55;
    c.save();
    c.rotate(a + Math.PI / 2);
    c.beginPath();
    c.ellipse(h * 0.22, 0, h * 0.26, h * 0.06, 0.25, 0, TAU);
    c.fill();
    c.restore();
  }
  c.restore();
}

/** Un nuage tout rond */
function cloud(c, x, y, w, alpha) {
  c.save();
  c.globalAlpha = alpha;
  c.fillStyle = '#FFFFFF';
  [[0, 0, 0.32], [0.28, -0.12, 0.26], [-0.3, 0.02, 0.24], [0.1, 0.1, 0.3], [-0.1, -0.18, 0.22]].forEach(([dx, dy, r]) => {
    c.beginPath();
    c.arc(x + dx * w, y + dy * w, r * w, 0, TAU);
    c.fill();
  });
  c.restore();
}

export function createIntro({ drawRocket, sfx }) {
  const R = mulberry32(2026);
  let t = 0;
  const cues = new Set();
  const smoke = [];       // fumée (coordonnées du sol)
  const trail = [];       // traînée de la fusée (coordonnées du sol)
  const stars = Array.from({ length: 180 }, () => ({ x: R(), y: R(), s: 0.6 + R() * 1.6, p: R() * TAU }));
  const clouds = Array.from({ length: 12 }, (_, i) => ({ x: R(), h: 0.55 + i * 0.32 + R() * 0.2, w: 0.12 + R() * 0.14 }));
  const palms = Array.from({ length: 7 }, (_, i) => ({ x: (i < 3 ? 0.02 + i * 0.07 : 0.72 + (i - 3) * 0.07) + R() * 0.03, h: 0.14 + R() * 0.06, lean: (R() - 0.5) * 0.6 }));
  let L = null;           // mise en page, calculée selon la taille de l'écran

  const cue = (name, at, fn) => {
    if (t >= at && !cues.has(name)) {
      cues.add(name);
      fn();
    }
  };

  function layout(W, H) {
    const m = Math.min(W, H);
    const k = m / 150;                       // échelle de la fusée
    const ground = H * 0.84;
    const rx = W * 0.5;
    const rcy = ground - 24 * k;             // centre de la fusée debout
    const towerX = rx + 14 * k + m * 0.05;
    return { W, H, m, k, ground, rx, rcy, towerX, towerW: m * 0.045, hatchY: rcy - 3 * k, astro: m * 0.075 };
  }

  /** Altitude de la fusée (en pixels au-dessus du sol) */
  function altitude() {
    if (t < T.liftoff) return 0;
    const u = t - T.liftoff;
    return 0.5 * L.m * 0.9 * u * u + L.m * 0.05 * u;
  }

  function update(dt) {
    t += dt;
    cue('bip', 4.2, () => sfx.bip());
    cue('hatch', T.boardEnd, () => sfx.open());
    cue('c3', T.count, () => sfx.beep(false));
    cue('c2', T.count + 1, () => sfx.beep(false));
    cue('c1', T.count + 2, () => sfx.beep(false));
    cue('fire', T.ignition, () => { sfx.beep(true); sfx.launch(); });
    cue('space', T.space, () => sfx.wormhole());
    if (!L) return;

    // vapeur avant la mise à feu, énorme nuage de fumée ensuite
    const alt = altitude();
    if (t > T.count + 1.2 && t < T.ignition && Math.random() < 0.3) {
      smoke.push({ x: L.rx + (Math.random() - 0.5) * 20 * L.k, y: L.ground - 4, vx: (Math.random() - 0.5) * 40, vy: -20, r: 8 * L.k, grow: 10 * L.k, life: 0, max: 2.2, a: 0.45 });
    }
    if (t > T.ignition && t < T.liftoff + 3) {
      const n = t < T.liftoff + 1 ? 6 : 2;
      for (let i = 0; i < n; i++) {
        const side = Math.random() < 0.5 ? -1 : 1;
        smoke.push({
          x: L.rx + side * Math.random() * 10 * L.k, y: L.ground - 6 - Math.min(alt, 40),
          vx: side * (80 + Math.random() * 320), vy: -Math.random() * 60, r: 10 * L.k, grow: (14 + Math.random() * 18) * L.k,
          life: 0, max: 3 + Math.random() * 2, a: 0.7,
        });
      }
    }
    if (t > T.liftoff && t < T.space + 1) {
      const by = L.rcy - alt + 22 * L.k;
      trail.push({ x: L.rx + (Math.random() - 0.5) * 6 * L.k, y: by + Math.random() * 10, r: (4 + Math.random() * 5) * L.k, life: 0, max: 2.5 });
    }
    for (const p of smoke) {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(0.35, dt);
      p.r += p.grow * dt;
    }
    for (const p of trail) {
      p.life += dt;
      p.r += 6 * L.k * dt;
    }
    for (const arr of [smoke, trail]) {
      for (let i = arr.length - 1; i >= 0; i--) if (arr[i].life > arr[i].max) arr.splice(i, 1);
    }
  }

  function draw(c, W, H) {
    if (!L || L.W !== W || L.H !== H) L = layout(W, H);
    const { m, k, ground, rx, rcy, towerX, towerW, hatchY } = L;
    const alt = altitude();
    // la caméra suit la fusée quand elle monte
    const cam = Math.max(0, alt - (rcy - H * 0.42));
    const high = clamp(cam / (H * 3.2), 0, 1);       // 0 = au sol, 1 = dans l'espace
    const shakeK = t > T.ignition && t < T.liftoff + 2.5 ? (1 - clamp((t - T.liftoff) / 2.5, 0, 1)) * 0.012 * m : 0;
    c.save();
    c.translate((Math.random() - 0.5) * shakeK, (Math.random() - 0.5) * shakeK);

    // ciel : bleu du matin → nuit de l'espace
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, mix('#4FA6E8', '#05061A', high));
    g.addColorStop(1, mix('#FFE3B8', '#0B0F33', Math.min(1, high * 1.4)));
    c.fillStyle = g;
    c.fillRect(-20, -20, W + 40, H + 40);
    // étoiles qui apparaissent
    const starA = clamp((high - 0.35) * 2, 0, 1);
    if (starA > 0) {
      for (const st of stars) {
        c.fillStyle = `rgba(255,255,255,${starA * (0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + st.p)))})`;
        c.fillRect(st.x * W, st.y * H, st.s, st.s);
      }
    }
    // le soleil du matin
    if (high < 0.6) {
      const sx = W * 0.82, sy = ground - H * 0.42 + cam * 0.3;
      const sg = c.createRadialGradient(sx, sy, 0, sx, sy, m * 0.2);
      sg.addColorStop(0, 'rgba(255,250,220,0.95)');
      sg.addColorStop(0.15, 'rgba(255,230,150,0.8)');
      sg.addColorStop(1, 'rgba(255,200,120,0)');
      c.fillStyle = sg;
      c.beginPath();
      c.arc(sx, sy, m * 0.2, 0, TAU);
      c.fill();
    }

    // la Terre vue de l'espace : sa courbe bleue monte du bas de l'écran
    if (high > 0.55) {
      const e = ease(clamp((high - 0.55) / 0.45, 0, 1));
      const ER = W * 1.3;
      const top = H + 10 - e * H * 0.3;
      const ex = W / 2, ey = top + ER;
      const atm = c.createRadialGradient(ex, ey, ER * 0.98, ex, ey, ER * 1.06);
      atm.addColorStop(0, 'rgba(120,200,255,0.9)');
      atm.addColorStop(1, 'rgba(120,200,255,0)');
      c.fillStyle = atm;
      c.beginPath();
      c.arc(ex, ey, ER * 1.06, 0, TAU);
      c.fill();
      const eg = c.createLinearGradient(0, top, 0, top + H * 0.3);
      eg.addColorStop(0, '#5FB4F0');
      eg.addColorStop(1, '#1C4F9C');
      c.fillStyle = eg;
      c.beginPath();
      c.arc(ex, ey, ER, 0, TAU);
      c.fill();
      // continents et nuages sur la courbe
      c.save();
      c.beginPath();
      c.arc(ex, ey, ER, 0, TAU);
      c.clip();
      c.fillStyle = 'rgba(88,180,100,0.8)';
      c.beginPath();
      c.ellipse(W * 0.3, top + H * 0.08, W * 0.16, H * 0.05, -0.1, 0, TAU);
      c.ellipse(W * 0.78, top + H * 0.12, W * 0.12, H * 0.06, 0.2, 0, TAU);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.6)';
      for (let i = 0; i < 5; i++) {
        c.beginPath();
        c.ellipse(W * (0.1 + i * 0.2) + Math.sin(t * 0.2 + i) * 10, top + H * (0.03 + (i % 2) * 0.05), W * 0.08, H * 0.012, 0, 0, TAU);
        c.fill();
      }
      c.restore();
      // lever de soleil sur le bord de la Terre
      const fx = W * 0.2, fy = top + 4;
      const fg = c.createRadialGradient(fx, fy, 0, fx, fy, m * 0.25);
      fg.addColorStop(0, `rgba(255,250,220,${0.9 * e})`);
      fg.addColorStop(0.2, `rgba(255,210,120,${0.5 * e})`);
      fg.addColorStop(1, 'rgba(255,200,120,0)');
      c.fillStyle = fg;
      c.beginPath();
      c.arc(fx, fy, m * 0.25, 0, TAU);
      c.fill();
    }

    // les nuages qu'on traverse
    for (const cl of clouds) {
      const y = ground - cl.h * H + cam;
      if (y < -H * 0.3 || y > H * 1.3) continue;
      // ils disparaissent une fois qu'on a quitté l'atmosphère
      cloud(c, cl.x * W, y, cl.w * W, 0.85 * clamp((0.7 - high) / 0.25, 0, 1));
    }

    // tout ce qui est au sol descend quand la caméra monte
    c.save();
    c.translate(0, cam);
    if (ground + cam - H * 0.6 < H) {
      // la mer au loin, la forêt, la plage
      c.fillStyle = '#3C8FC6';
      c.fillRect(-20, ground - H * 0.16, W + 40, H * 0.06);
      c.fillStyle = '#2F6B45';
      c.beginPath();
      c.moveTo(-20, ground - H * 0.08);
      for (let x = -20; x <= W + 20; x += W / 12) c.lineTo(x, ground - H * 0.1 - Math.sin(x * 0.013) * H * 0.025);
      c.lineTo(W + 20, ground);
      c.lineTo(-20, ground);
      c.closePath();
      c.fill();
      palms.forEach((p) => palm(c, p.x * W, ground - H * 0.03, p.h * Math.min(H, W * 0.75), p.lean));
      c.fillStyle = '#4E8F55';
      c.fillRect(-20, ground - H * 0.03, W + 40, H * 0.4);
      // le pas de tir en béton et sa tranchée pour les flammes
      c.fillStyle = '#B9BFCC';
      c.fillRect(rx - 34 * k, ground - 4 * k, 68 * k, 4 * k + H * 0.3);
      c.fillStyle = '#5A6488';
      c.fillRect(rx - 10 * k, ground - 4 * k, 20 * k, 6 * k);
      // panneau du centre spatial
      c.save();
      c.translate(W * 0.13, ground - H * 0.03);
      c.fillStyle = '#7A4E22';
      c.fillRect(-3, -m * 0.09, 6, m * 0.09);
      c.fillStyle = '#FFFCF3';
      c.strokeStyle = '#2E2A4D';
      c.lineWidth = 2;
      c.beginPath();
      c.roundRect(-m * 0.13, -m * 0.15, m * 0.26, m * 0.07, 6);
      c.fill();
      c.stroke();
      c.fillStyle = '#2E2A4D';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = `800 ${Math.round(m * 0.022)}px "Baloo 2", sans-serif`;
      c.fillText('Centre spatial guyanais', 0, -m * 0.125);
      c.font = `700 ${Math.round(m * 0.018)}px "Baloo 2", sans-serif`;
      c.fillText('Kourou, en Guyane', 0, -m * 0.098);
      c.restore();

      // la tour de lancement, avec son ascenseur et son bras d'accès
      const towerTop = rcy - 32 * k;
      c.strokeStyle = '#E85757';
      c.lineWidth = Math.max(2, k * 0.8);
      c.beginPath();
      c.moveTo(towerX, ground);
      c.lineTo(towerX, towerTop);
      c.moveTo(towerX + towerW, ground);
      c.lineTo(towerX + towerW, towerTop);
      for (let y = ground; y > towerTop; y -= towerW) {
        c.moveTo(towerX, y);
        c.lineTo(towerX + towerW, y - towerW);
        c.moveTo(towerX, y - towerW);
        c.lineTo(towerX + towerW, y - towerW);
      }
      c.stroke();
      // bras d'accès : il s'écarte avant le décollage
      const armA = ease(clamp((t - T.armAway) / 0.8, 0, 1)) * 1.2;
      c.save();
      c.translate(towerX, hatchY);
      c.rotate(-armA);
      c.fillStyle = '#C9CED8';
      c.fillRect(-(towerX - rx - 10 * k), -3 * k, towerX - rx - 10 * k, 6 * k);
      c.restore();
      // ascenseur
      const liftK = ease(clamp((t - T.walkEnd) / (T.liftEnd - T.walkEnd), 0, 1));
      const liftY = ground - liftK * (ground - hatchY);
      c.strokeStyle = '#FFC93C';
      c.lineWidth = 2;
      c.strokeRect(towerX + 2, liftY - L.astro * 1.15, towerW - 4, L.astro * 1.15);
    }
    c.restore();

    // fumée (au sol, elle reste derrière quand la fusée monte)
    c.save();
    c.translate(0, cam);
    for (const p of smoke) {
      const a = p.a * (1 - p.life / p.max);
      c.fillStyle = `rgba(235,235,240,${a})`;
      c.beginPath();
      c.arc(p.x, p.y, p.r, 0, TAU);
      c.fill();
    }
    for (const p of trail) {
      c.fillStyle = `rgba(240,240,245,${0.5 * (1 - p.life / p.max)})`;
      c.beginPath();
      c.arc(p.x, p.y, p.r, 0, TAU);
      c.fill();
    }
    c.restore();

    // la fusée
    const ry = rcy - alt + cam;
    const tilt = t > T.space - 1.5 ? ease(clamp((t - (T.space - 1.5)) / 2.5, 0, 1)) * 0.5 : 0;
    const thrust = t > T.ignition;
    if (thrust) {
      // grande flamme sous la fusée
      const fl = (t < T.liftoff ? (t - T.ignition) / (T.liftoff - T.ignition) : 1) * (30 + Math.sin(t * 40) * 4) * k;
      const fg = c.createLinearGradient(rx, ry + 20 * k, rx, ry + 20 * k + fl);
      fg.addColorStop(0, 'rgba(255,255,230,0.95)');
      fg.addColorStop(0.3, 'rgba(255,190,70,0.9)');
      fg.addColorStop(1, 'rgba(255,90,40,0)');
      c.save();
      c.translate(rx, ry);
      c.rotate(tilt);
      c.translate(-rx, -ry);
      c.fillStyle = fg;
      c.beginPath();
      c.moveTo(rx - 7 * k, ry + 19 * k);
      c.quadraticCurveTo(rx, ry + 20 * k + fl * 1.2, rx + 7 * k, ry + 19 * k);
      c.closePath();
      c.fill();
      c.restore();
    }
    c.save();
    c.translate(rx, ry);
    c.rotate(-Math.PI / 2 + tilt);
    c.scale(k, k);
    drawRocket(c, t, thrust);
    // la porte de la fusée : ouverte pendant l'embarquement
    if (t > T.liftEnd - 0.3 && t < T.boardEnd + 0.1) {
      c.fillStyle = '#1C2260';
      c.beginPath();
      c.roundRect(-2, -5, 10, 10, 2);
      c.fill();
    }
    c.restore();

    // l'astronaute : marche, ascenseur, passerelle, puis il entre dans la fusée
    if (t < T.boardEnd) {
      let ax, ay, walk = null, wave = 0, size = L.astro, left = false;
      if (t < T.walkEnd) {
        const u = t / T.walkEnd;
        ax = W * 0.08 + (towerX + towerW / 2 - W * 0.08) * u;
        ay = ground;
        walk = t * 9;
      } else if (t < T.liftEnd) {
        ax = towerX + towerW / 2;
        ay = ground - ease((t - T.walkEnd) / (T.liftEnd - T.walkEnd)) * (ground - hatchY);
        wave = Math.abs(Math.sin(t * 6)) * 1.2;
      } else {
        const u = clamp((t - T.liftEnd) / (T.boardEnd - T.liftEnd - 0.2), 0, 1);
        ax = towerX + towerW / 2 + (rx + 4 * k - towerX - towerW / 2) * u;
        ay = hatchY + 3 * k;
        walk = t * 9;
        left = true;
        size *= 1 - Math.max(0, u - 0.8) * 4;
      }
      if (size > 1) {
        c.save();
        c.translate(ax, ay + cam);
        if (left) c.scale(-1, 1);
        drawAstronaut(c, size, walk, wave);
        c.restore();
      }
    }


    // textes : compte à rebours, décollage, bienvenue dans l'espace
    const big = (text, alpha, scale, color = '#FFFFFF') => {
      c.save();
      c.globalAlpha = alpha;
      c.translate(W / 2, H * 0.3);
      c.scale(scale, scale);
      c.font = `800 ${Math.round(m * 0.16)}px "Baloo 2", sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.lineJoin = 'round';
      c.lineWidth = m * 0.015;
      c.strokeStyle = 'rgba(28,34,96,0.9)';
      c.strokeText(text, 0, 0);
      c.fillStyle = color;
      c.fillText(text, 0, 0);
      c.restore();
    };
    for (let i = 0; i < 3; i++) {
      const u = t - (T.count + i);
      if (u >= 0 && u < 1) big(String(3 - i), 1 - u * u, 1 + (1 - u) * 0.5 - 0.2);
    }
    const ig = t - T.ignition;
    if (ig >= 0 && ig < 2) big('Décollage !', ig < 1.5 ? 1 : (2 - ig) * 2, 0.55 + Math.min(ig, 0.3), '#FFC93C');
    const sp = t - T.space;
    if (sp >= 0 && sp < 3) big("Bienvenue dans l'espace !", Math.min(1, sp * 2, (3 - sp) * 2), 0.42, '#9EE7FF');
    // petit texte au début
    if (t < T.walkEnd) {
      c.save();
      c.globalAlpha = Math.min(1, t * 2, (T.walkEnd - t) * 2);
      c.font = `700 ${Math.round(m * 0.03)}px "Quicksand", sans-serif`;
      c.textAlign = 'center';
      c.fillStyle = '#FFFFFF';
      c.lineWidth = 4;
      c.strokeStyle = 'rgba(28,34,96,0.7)';
      const txt = "Ton astronaute rejoint sa fusée…";
      c.strokeText(txt, W / 2, H * 0.12);
      c.fillText(txt, W / 2, H * 0.12);
      c.restore();
    }
    c.restore();

    // fondu au début et à la fin
    const fade = Math.max(1 - t / 0.8, (t - (T.end - 0.8)) / 0.8);
    if (fade > 0) {
      c.fillStyle = `rgba(5,6,26,${clamp(fade, 0, 1)})`;
      c.fillRect(0, 0, W, H);
    }
  }

  return {
    update,
    draw,
    get done() { return t >= T.end; },
    get time() { return t; },
  };
}

export const INTRO_LENGTH = T.end;
