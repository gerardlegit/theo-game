// ============================================================================
// PARTICULES — ambiance de chaque zone (lucioles, braises, pluie…) et
// explosions d'étincelles pendant les combats. Dessinées sur un <canvas>.
// ============================================================================

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const AMBIENT = {
  fireflies: { rate: 0.12, max: 40 },
  embers: { rate: 0.3, max: 70 },
  motes: { rate: 0.15, max: 50 },
  binary: { rate: 0.35, max: 70 },
  rain: { rate: 1.6, max: 220 },
  sparks: { rate: 0.25, max: 50 },
  glitch: { rate: 0.2, max: 24 },
  stars: { rate: 0.1, max: 40 },
  confetti: { rate: 0.9, max: 160 },
  dust: { rate: 0.08, max: 30 },
};

export class FX {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.parts = [];
    this.mode = null;
    this.acc = 0;
    this.running = false;
    this.w = 0; this.h = 0;
    this.last = 0;
    this.loop = this.loop.bind(this);
    new ResizeObserver(() => this.resize()).observe(canvas);
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = this.canvas.getBoundingClientRect();
    this.w = r.width; this.h = r.height;
    this.canvas.width = Math.max(1, Math.round(r.width * dpr));
    this.canvas.height = Math.max(1, Math.round(r.height * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  setMode(mode) {
    this.mode = mode;
    this.parts = this.parts.filter((p) => p.burst);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    this.parts = [];
    this.ctx.clearRect(0, 0, this.w, this.h);
  }

  spawn(kind) {
    const W = this.w, H = this.h, R = Math.random;
    const p = { kind, life: 0, x: R() * W, y: R() * H, vx: 0, vy: 0, size: 2, max: 6 };
    switch (kind) {
      case 'fireflies': Object.assign(p, { size: 1.5 + R() * 2, max: 5 + R() * 5, vx: (R() - 0.5) * 12, vy: (R() - 0.5) * 12, hue: R() < 0.8 ? '#7DFFB8' : '#FFE27A', phase: R() * 6 }); break;
      case 'embers': Object.assign(p, { y: H + 5, size: 1 + R() * 2.5, max: 3 + R() * 3, vx: (R() - 0.5) * 20, vy: -30 - R() * 50, hue: R() < 0.7 ? '#FF9A3D' : '#FFD23F' }); break;
      case 'motes': Object.assign(p, { size: 1 + R() * 2.5, max: 6 + R() * 6, vx: (R() - 0.5) * 8, vy: -4 - R() * 8, hue: R() < 0.5 ? '#FF4FD8' : '#B98CFF' }); break;
      case 'binary': Object.assign(p, { y: -20, size: 10 + R() * 8, max: 5, vy: 60 + R() * 90, ch: R() < 0.5 ? '0' : '1', hue: '#35F2FF' }); break;
      case 'rain': Object.assign(p, { y: -20, x: R() * (W + 200) - 100, size: 10 + R() * 14, max: 2, vx: -120, vy: 700 + R() * 300, hue: 'rgba(255,170,190,.35)' }); break;
      case 'sparks': Object.assign(p, { size: 1 + R() * 2, max: 0.4 + R() * 0.5, vx: (R() - 0.5) * 300, vy: (R() - 0.5) * 300, hue: R() < 0.5 ? '#BFE9FF' : '#FFD23F' }); break;
      case 'glitch': Object.assign(p, { size: 10 + R() * 60, h2: 2 + R() * 8, max: 0.15 + R() * 0.3, hue: R() < 0.6 ? 'rgba(255,45,85,.35)' : 'rgba(53,242,255,.25)' }); break;
      case 'stars': Object.assign(p, { size: 0.8 + R() * 1.8, max: 3 + R() * 3, hue: '#FFFFFF' }); break;
      case 'confetti': Object.assign(p, { y: -10, size: 5 + R() * 6, max: 6, vx: (R() - 0.5) * 60, vy: 80 + R() * 120, rot: R() * 6, vr: (R() - 0.5) * 8, hue: ['#FF4FD8', '#35F2FF', '#FFD23F', '#3DFFB0', '#FF8A3D', '#C77DFF'][Math.floor(R() * 6)] }); break;
      case 'dust': Object.assign(p, { size: 1 + R() * 2, max: 8, vx: 4 + R() * 8, vy: -2 + R() * 4, hue: 'rgba(200,230,255,.6)' }); break;
    }
    this.parts.push(p);
  }

  /** Explosion d'étincelles en (x, y), coordonnées relatives au canvas. */
  burst(x, y, { color = '#35F2FF', count = 30, speed = 260, size = 3, life = 0.8, colors = null } = {}) {
    if (reduceMotion) count = Math.ceil(count / 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, s = speed * (0.3 + Math.random() * 0.7);
      this.parts.push({
        burst: true, kind: 'burst', x, y, life: 0, max: life * (0.6 + Math.random() * 0.6),
        vx: Math.cos(a) * s, vy: Math.sin(a) * s, size: size * (0.5 + Math.random()),
        hue: colors ? colors[i % colors.length] : color,
      });
    }
    this.start();
  }

  loop(now) {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const cfg = this.mode && AMBIENT[this.mode];
    if (cfg && !reduceMotion && this.w > 0) {
      this.acc += cfg.rate * dt * 60;
      const ambient = this.parts.length;
      while (this.acc >= 1) {
        this.acc -= 1;
        if (ambient < cfg.max) this.spawn(this.mode);
      }
    }
    const c = this.ctx;
    c.clearRect(0, 0, this.w, this.h);
    const keep = [];
    for (const p of this.parts) {
      p.life += dt;
      if (p.life > p.max || p.y > this.h + 40 || p.y < -60 || p.x < -120 || p.x > this.w + 120) continue;
      keep.push(p);
      const k = p.life / p.max;
      const fade = Math.min(1, p.life * 3) * (1 - k);
      switch (p.kind) {
        case 'fireflies':
          p.vx += (Math.random() - 0.5) * 20 * dt; p.vy += (Math.random() - 0.5) * 20 * dt;
          p.x += p.vx * dt; p.y += p.vy * dt;
          this.glow(p.x, p.y, p.size, p.hue, fade * (0.6 + 0.4 * Math.sin(p.life * 4 + p.phase)));
          break;
        case 'embers':
          p.x += (p.vx + Math.sin(p.life * 3) * 10) * dt; p.y += p.vy * dt;
          this.glow(p.x, p.y, p.size, p.hue, fade);
          break;
        case 'motes': case 'dust': case 'stars':
          p.x += p.vx * dt; p.y += p.vy * dt;
          this.glow(p.x, p.y, p.size, p.hue, fade * (p.kind === 'stars' ? Math.abs(Math.sin(p.life * 2)) : 1));
          break;
        case 'binary':
          p.y += p.vy * dt;
          c.globalAlpha = 0.5 * (1 - k);
          c.fillStyle = p.hue;
          c.font = `${p.size}px monospace`;
          c.fillText(p.ch, p.x, p.y);
          break;
        case 'rain':
          p.x += p.vx * dt; p.y += p.vy * dt;
          c.globalAlpha = 1;
          c.strokeStyle = p.hue; c.lineWidth = 1.2;
          c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + p.vx * 0.02, p.y + p.size); c.stroke();
          break;
        case 'sparks': {
          const x0 = p.x;
          const y0 = p.y;
          p.x += p.vx * dt; p.y += p.vy * dt;
          c.globalAlpha = 1 - k;
          c.strokeStyle = p.hue; c.lineWidth = p.size;
          c.beginPath(); c.moveTo(x0, y0); c.lineTo(p.x, p.y); c.stroke();
          break;
        }
        case 'glitch':
          c.globalAlpha = 1 - k;
          c.fillStyle = p.hue;
          c.fillRect(p.x, p.y, p.size, p.h2);
          break;
        case 'confetti':
          p.x += (p.vx + Math.sin(p.life * 3) * 30) * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
          c.save(); c.globalAlpha = Math.min(1, (1 - k) * 2);
          c.translate(p.x, p.y); c.rotate(p.rot);
          c.fillStyle = p.hue; c.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          c.restore();
          break;
        case 'burst':
          p.vx *= 1 - 2.2 * dt; p.vy = p.vy * (1 - 2.2 * dt) + 160 * dt;
          p.x += p.vx * dt; p.y += p.vy * dt;
          this.glow(p.x, p.y, p.size, p.hue, 1 - k);
          break;
      }
    }
    c.globalAlpha = 1;
    this.parts = keep;
    requestAnimationFrame(this.loop);
  }

  glow(x, y, r, color, alpha) {
    const c = this.ctx;
    c.globalAlpha = Math.max(0, alpha) * 0.35;
    c.fillStyle = color;
    c.beginPath(); c.arc(x, y, r * 3, 0, Math.PI * 2); c.fill();
    c.globalAlpha = Math.max(0, alpha);
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  }
}
