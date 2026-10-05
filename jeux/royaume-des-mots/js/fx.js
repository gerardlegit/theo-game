// ============================================================================
// EFFETS — confettis, étincelles et pièces d'or, dessinés sur un <canvas>
// qui recouvre tout l'écran (sans bloquer les clics).
// ============================================================================

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const canvas = document.createElement('canvas');
canvas.className = 'fx-layer';
document.body.appendChild(canvas);
const g = canvas.getContext('2d');
let parts = [];
let running = false;
let W = 0, H = 0;

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resize();
window.addEventListener('resize', resize);

const COLORS = ['#E7B416', '#C8102E', '#1F55B3', '#2E7D32', '#9A5BC7', '#FFFFFF', '#F28C28'];

function loop() {
  g.clearRect(0, 0, W, H);
  parts = parts.filter((p) => p.life > 0);
  parts.forEach((p) => {
    p.life -= 1;
    p.vy += p.grav;
    p.vx *= p.drag; p.vy *= p.drag;
    p.x += p.vx; p.y += p.vy;
    p.rot += p.vr;
    const a = Math.min(1, p.life / 25);
    g.save();
    g.globalAlpha = a;
    g.translate(p.x, p.y);
    g.rotate(p.rot);
    if (p.kind === 'confetti') {
      g.fillStyle = p.color;
      g.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    } else if (p.kind === 'spark') {
      g.fillStyle = p.color;
      g.beginPath();
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2;
        g.lineTo(Math.cos(ang) * p.size, Math.sin(ang) * p.size);
        g.lineTo(Math.cos(ang + Math.PI / 4) * p.size * 0.3, Math.sin(ang + Math.PI / 4) * p.size * 0.3);
      }
      g.closePath();
      g.fill();
    }
    g.restore();
  });
  if (parts.length) requestAnimationFrame(loop);
  else { running = false; g.clearRect(0, 0, W, H); }
}

function start() {
  if (!running) { running = true; requestAnimationFrame(loop); }
}

/** Pluie de confettis depuis le haut de l'écran. */
export function confetti(n = 120) {
  if (reduceMotion) return;
  for (let i = 0; i < n; i++) {
    parts.push({
      kind: 'confetti', x: Math.random() * W, y: -20 - Math.random() * H * 0.4,
      vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 3, grav: 0.04, drag: 0.995,
      rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, size: 8 + Math.random() * 6,
      color: COLORS[i % COLORS.length], life: 160 + Math.random() * 80,
    });
  }
  start();
}

/** Gerbe d'étincelles autour d'un élément (ou d'un point). */
export function sparkle(target, n = 22, color = '#FFD54A') {
  if (reduceMotion) return;
  let x, y;
  if (target instanceof Element) {
    const r = target.getBoundingClientRect();
    x = r.left + r.width / 2; y = r.top + r.height / 2;
  } else ({ x, y } = target);
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2;
    const sp = 2 + Math.random() * 5;
    parts.push({
      kind: 'spark', x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 1, grav: 0.08, drag: 0.94,
      rot: 0, vr: 0.2, size: 4 + Math.random() * 5, color: Math.random() < 0.3 ? '#FFFFFF' : color, life: 40 + Math.random() * 25,
    });
  }
  start();
}

/** Fait voler des pièces d'or d'un élément vers un autre (le compteur d'or). */
export function flyCoins(from, to, n = 6) {
  if (!from || !to || reduceMotion) return;
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  for (let i = 0; i < n; i++) {
    const c = document.createElement('div');
    c.className = 'fly-coin';
    c.style.left = `${a.left + a.width / 2 + (Math.random() - 0.5) * 60}px`;
    c.style.top = `${a.top + a.height / 2 + (Math.random() - 0.5) * 30}px`;
    document.body.appendChild(c);
    const dx = b.left + b.width / 2 - parseFloat(c.style.left);
    const dy = b.top + b.height / 2 - parseFloat(c.style.top);
    c.animate(
      [{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 60}px) scale(1.3)`, opacity: 1, offset: 0.5 }, { transform: `translate(${dx}px, ${dy}px) scale(0.6)`, opacity: 0.4 }],
      { duration: 800 + i * 70, easing: 'ease-in-out', delay: i * 60 },
    ).onfinish = () => c.remove();
  }
}

/** Texte qui s'envole (ex. « -1 », « +5 »). */
export function floatText(target, text, cls = '') {
  const r = target.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = `float-text ${cls}`;
  el.textContent = text;
  el.style.left = `${r.left + r.width / 2}px`;
  el.style.top = `${r.top + r.height * 0.3}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1300);
}

/** Secoue un élément. */
export function shake(el, strength = 'normal') {
  if (!el || reduceMotion) return;
  el.classList.remove('shake', 'shake-big');
  void el.offsetWidth;
  el.classList.add(strength === 'big' ? 'shake-big' : 'shake');
}
