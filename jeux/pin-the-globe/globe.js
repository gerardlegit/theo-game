// ============================================================================
// Le globe 3D de "Pin the Globe" (Three.js).
//
// La Terre ne bouge pas : c'est la caméra qui tourne autour (OrbitControls),
// ce qui garde les coordonnées du monde = les coordonnées du globe.
//
// Couches, de l'intérieur vers l'extérieur :
//  - la Terre (texture NASA « Blue Marble », relief, reflets sur les océans)
//  - le calque de surbrillance (pays de l'indice, dessiné sur un canvas)
//  - les frontières et les côtes (lignes, calculées depuis Natural Earth)
//  - le voile d'atmosphère au bord du globe, puis le halo bleu autour
//  - les étoiles
// Les épingles et étiquettes sont des éléments HTML posés par-dessus.
// ============================================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as topojson from 'https://cdn.jsdelivr.net/npm/topojson-client@3/+esm';

const TEX_BASE = 'https://cdn.jsdelivr.net/npm/three-globe@2.45.3/example/img/';
const WORLD_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';

const DEG = Math.PI / 180;
const EARTH_RADIUS_KM = 6371;
const FOV = 40;
const MIN_DIST = 1.15;
const HALO_SCALE = 1.16;

// ---------------------------------------------------------------- géométrie

export function latLonToVec3(lat, lon, r = 1, out = new THREE.Vector3()) {
  // Même convention que les UV de THREE.SphereGeometry : la texture
  // équirectangulaire tombe ainsi pile au bon endroit.
  const phi = (lon + 180) * DEG;
  const theta = (90 - lat) * DEG;
  return out.set(
    -r * Math.cos(phi) * Math.sin(theta),
    r * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

export function vec3ToLatLon(v) {
  const n = v.clone().normalize();
  const lat = Math.asin(THREE.MathUtils.clamp(n.y, -1, 1)) / DEG;
  let lon = Math.atan2(n.z, -n.x) / DEG - 180;
  if (lon < -180) lon += 360;
  return { lat, lon };
}

/** Distance à vol d'oiseau (formule de haversine), en km. */
export function distanceKm(a, b) {
  const dLat = (b.lat - a.lat) * DEG;
  const dLon = (b.lon - a.lon) * DEG;
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * DEG) * Math.cos(b.lat * DEG) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

function slerpUnit(a, b, t, out = new THREE.Vector3()) {
  const omega = a.angleTo(b);
  if (omega < 1e-6) return out.copy(a);
  const s = Math.sin(omega);
  return out.copy(a).multiplyScalar(Math.sin((1 - t) * omega) / s)
    .addScaledVector(b, Math.sin(t * omega) / s);
}

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

// ---------------------------------------------------------------- shaders

const ATMO_VERT = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main() {
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

// Halo extérieur : faces arrière d'une sphère plus grande. Au ras du globe,
// -dot(N, V) vaut sqrt(k²-1)/k (k = rayon du halo) ; au bord du halo, 0.
const HALO_FRAG = /* glsl */`
  uniform vec3 glowColor;
  uniform float edge;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main() {
    vec3 V = normalize(cameraPosition - vWorldPos);
    float d = clamp(-dot(normalize(vNormal), V) / edge, 0.0, 1.0);
    float i = pow(d, 3.2) * 1.15;
    gl_FragColor = vec4(glowColor * i, i);
  }
`;

// Voile d'atmosphère : bleu clair qui s'épaissit vers l'horizon du globe.
const RIM_FRAG = /* glsl */`
  uniform vec3 glowColor;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main() {
    vec3 V = normalize(cameraPosition - vWorldPos);
    float d = clamp(dot(normalize(vNormal), V), 0.0, 1.0);
    float i = pow(1.0 - d, 3.0) * 0.85;
    gl_FragColor = vec4(glowColor * i, i);
  }
`;

const STAR_VERT = /* glsl */`
  attribute float size;
  attribute float phase;
  attribute vec3 tint;
  uniform float time;
  uniform float pixelRatio;
  varying vec3 vTint;
  varying float vAlpha;
  void main() {
    vTint = tint;
    vAlpha = 0.55 + 0.45 * sin(time * (0.6 + phase * 0.25) + phase * 6.2831);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * pixelRatio;
    gl_Position = projectionMatrix * mv;
  }
`;

const STAR_FRAG = /* glsl */`
  varying vec3 vTint;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    float a = smoothstep(0.5, 0.0, r);
    a = a * a;
    gl_FragColor = vec4(vTint, a * vAlpha);
  }
`;

// ---------------------------------------------------------------- le globe

export class Globe {
  constructor(container, { onTap, onHover } = {}) {
    this.container = container;
    this.onTap = onTap;
    this.onHover = onHover;
    this.insets = { top: 0, right: 0, bottom: 0, left: 0 }; // zone cachée par l'interface (cible)
    this.shownInsets = { ...this.insets }; // valeurs affichées, qui glissent vers la cible
    this.markers = new Set();
    this.arcs = [];
    this.flight = null;
    this.tapEnabled = false;
    this.clock = new THREE.Clock();

    this._initRenderer();
    this._initScene();
    this._initControls();
    this._initPointer();

    this.overlay = document.createElement('div');
    this.overlay.className = 'globe-overlay';
    container.appendChild(this.overlay);

    this._resize();
    new ResizeObserver(() => this._resize()).observe(container);

    const home = latLonToVec3(28, 12).normalize();
    this.camera.position.copy(home).multiplyScalar(this.homeDistance());
    this.camera.lookAt(0, 0, 0);

    this.renderer.setAnimationLoop(() => this._frame());
  }

  // ---------------------------------------------------------- initialisation

  _initRenderer() {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    this.container.appendChild(renderer.domElement);
    renderer.domElement.classList.add('globe-canvas');
    this.renderer = renderer;
  }

  _initScene() {
    const scene = new THREE.Scene();
    this.scene = scene;

    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.005, 2000);
    this.camera = camera;
    scene.add(camera);

    // Lumière douce partout + un « soleil » accroché à la caméra, en haut à
    // gauche : la face qu'on regarde est toujours éclairée.
    scene.add(new THREE.AmbientLight(0xffffff, 1.15));
    const sun = new THREE.DirectionalLight(0xfff4e0, 2.1);
    sun.position.set(-2.2, 1.6, 2.4);
    camera.add(sun);
    camera.add(sun.target);
    sun.target.position.set(0, 0, -3);

    // La Terre : en attendant la texture, un joli bleu océan.
    const earthMat = new THREE.MeshPhongMaterial({
      color: 0x1d4f8c,
      specular: new THREE.Color(0x2a3c55),
      shininess: 14,
    });
    this.earth = new THREE.Mesh(new THREE.SphereGeometry(1, 160, 120), earthMat);
    scene.add(this.earth);

    // Voile d'atmosphère sur le globe.
    const rim = new THREE.Mesh(
      new THREE.SphereGeometry(1.003, 96, 72),
      new THREE.ShaderMaterial({
        vertexShader: ATMO_VERT,
        fragmentShader: RIM_FRAG,
        uniforms: { glowColor: { value: new THREE.Color(0x7ec8ff) } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    rim.renderOrder = 3;
    scene.add(rim);

    // Halo bleu autour du globe.
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(1, 96, 72),
      new THREE.ShaderMaterial({
        vertexShader: ATMO_VERT,
        fragmentShader: HALO_FRAG,
        uniforms: {
          glowColor: { value: new THREE.Color(0x4aa8ff) },
          edge: { value: Math.sqrt(HALO_SCALE * HALO_SCALE - 1) / HALO_SCALE },
        },
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    halo.scale.setScalar(HALO_SCALE);
    scene.add(halo);

    this._initStars();
    this._initGraticule();
  }

  _initStars() {
    const N = 2600;
    const pos = new Float32Array(N * 3);
    const size = new Float32Array(N);
    const phase = new Float32Array(N);
    const tint = new Float32Array(N * 3);
    const v = new THREE.Vector3();
    const palette = [[1, 1, 1], [0.8, 0.88, 1], [1, 0.92, 0.8], [0.85, 0.8, 1]];
    for (let i = 0; i < N; i++) {
      v.randomDirection().multiplyScalar(400 + Math.random() * 400);
      pos.set([v.x, v.y, v.z], i * 3);
      const big = Math.random() < 0.06;
      size[i] = big ? 3 + Math.random() * 3 : 0.8 + Math.random() * 1.8;
      phase[i] = Math.random();
      tint.set(palette[(Math.random() * palette.length) | 0], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(size, 1));
    geo.setAttribute('phase', new THREE.BufferAttribute(phase, 1));
    geo.setAttribute('tint', new THREE.BufferAttribute(tint, 3));
    this.starUniforms = {
      time: { value: 0 },
      pixelRatio: { value: this.renderer.getPixelRatio() },
    };
    const stars = new THREE.Points(geo, new THREE.ShaderMaterial({
      vertexShader: STAR_VERT,
      fragmentShader: STAR_FRAG,
      uniforms: this.starUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));
    this.scene.add(stars);
  }

  // L'équateur et les deux tropiques, en pointillés dorés très discrets.
  _initGraticule() {
    const group = new THREE.Group();
    const lines = [
      { lat: 0, color: 0xffd76a, opacity: 0.55 },
      { lat: 23.44, color: 0xffd76a, opacity: 0.22 },
      { lat: -23.44, color: 0xffd76a, opacity: 0.22 },
    ];
    for (const l of lines) {
      const pts = [];
      for (let lon = -180; lon <= 180; lon += 1) pts.push(latLonToVec3(l.lat, lon, 1.0015));
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geo, new THREE.LineDashedMaterial({
        color: l.color, transparent: true, opacity: l.opacity, dashSize: 0.012, gapSize: 0.01, depthWrite: false,
      }));
      line.computeLineDistances();
      group.add(line);
    }
    this.scene.add(group);
  }

  _initControls() {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.enablePan = false;
    controls.minDistance = MIN_DIST;
    controls.zoomSpeed = 0.9;
    controls.autoRotateSpeed = 0.45;
    controls.minPolarAngle = 0.12;
    controls.maxPolarAngle = Math.PI - 0.12;
    controls.addEventListener('start', () => {
      this.container.classList.add('dragging');
      this._endFlight();
    });
    controls.addEventListener('end', () => this.container.classList.remove('dragging'));
    this.controls = controls;
  }

  // Un « tap » = appui court sans déplacement, avec un seul doigt.
  _initPointer() {
    const el = this.renderer.domElement;
    const pointers = new Map();
    let tap = null;

    el.addEventListener('pointerdown', (e) => {
      pointers.set(e.pointerId, true);
      tap = pointers.size === 1 && e.button === 0
        ? { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId }
        : null;
    });
    el.addEventListener('pointermove', (e) => {
      if (tap && tap.id === e.pointerId && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 7) tap = null;
      if (e.pointerType === 'mouse' && this.onHover) this._hoverEvent = e;
    });
    const up = (e) => {
      pointers.delete(e.pointerId);
      if (!tap || tap.id !== e.pointerId) return;
      const quick = performance.now() - tap.t < 650;
      tap = null;
      if (!quick || !this.tapEnabled || !this.onTap) return;
      // `hit` vaut null si on touche à côté de la Terre : le mode Monuments
      // en a besoin pour les points posés tout au bord du globe.
      const rect = el.getBoundingClientRect();
      this.onTap(this.pick(e.clientX, e.clientY), { x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', (e) => { pointers.delete(e.pointerId); tap = null; });
    el.addEventListener('pointerleave', () => { if (this.onHover) this.onHover(null); });
  }

  // ---------------------------------------------------------- chargement

  /** Charge les textures et la carte des pays. Se résout quand la Terre est prête. */
  async load() {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    const loadTex = (name) => new Promise((resolve) => {
      loader.load(TEX_BASE + name, resolve, undefined, () => resolve(null));
    });

    const worldPromise = fetch(WORLD_URL).then((r) => r.json()).catch(() => null);
    const [map, bump, water, world] = await Promise.all([
      loadTex('earth-blue-marble.jpg'),
      loadTex('earth-topology.png'),
      loadTex('earth-water.png'),
      worldPromise,
    ]);

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    const mat = this.earth.material;
    if (map) {
      map.colorSpace = THREE.SRGBColorSpace;
      map.anisotropy = maxAniso;
      mat.map = map;
      mat.color.set(0xffffff);
    }
    if (bump) {
      bump.anisotropy = maxAniso;
      mat.bumpMap = bump;
      mat.bumpScale = 4;
    }
    if (water) {
      mat.specularMap = water;
      mat.specular.set(0x3d5370);
      mat.shininess = 34;
    }
    mat.needsUpdate = true;

    if (world) {
      this.world = world;
      this.countries = topojson.feature(world, world.objects.countries).features;
      this._buildBorders(world);
      if (!map) this._paintFallbackTexture();
    }
    return { textures: !!map, borders: !!world };
  }

  _sphereSegments(lines, radius, maxStepDeg = 0.8) {
    const out = [];
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const p = new THREE.Vector3();
    const q = new THREE.Vector3();
    const maxStep = maxStepDeg * DEG;
    for (const line of lines) {
      for (let i = 0; i < line.length - 1; i++) {
        latLonToVec3(line[i][1], line[i][0], 1, a);
        latLonToVec3(line[i + 1][1], line[i + 1][0], 1, b);
        const steps = Math.max(1, Math.ceil(a.angleTo(b) / maxStep));
        for (let s = 0; s < steps; s++) {
          slerpUnit(a, b, s / steps, p).multiplyScalar(radius);
          slerpUnit(a, b, (s + 1) / steps, q).multiplyScalar(radius);
          out.push(p.x, p.y, p.z, q.x, q.y, q.z);
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(out, 3));
    return geo;
  }

  _buildBorders(world) {
    const obj = world.objects.countries;
    const borders = topojson.mesh(world, obj, (a, b) => a !== b);
    const coasts = topojson.mesh(world, obj, (a, b) => a === b);

    const coastLines = new THREE.LineSegments(
      this._sphereSegments(coasts.coordinates, 1.0012),
      new THREE.LineBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.35, depthWrite: false }),
    );
    const borderLines = new THREE.LineSegments(
      this._sphereSegments(borders.coordinates, 1.0014),
      new THREE.LineBasicMaterial({ color: 0xfff6e0, transparent: true, opacity: 0.7, depthWrite: false }),
    );
    coastLines.renderOrder = 1;
    borderLines.renderOrder = 2;
    this.scene.add(coastLines, borderLines);
  }

  // Si la texture NASA ne se charge pas (hors ligne…), on peint une Terre
  // stylisée à partir de la carte des pays.
  _paintFallbackTexture() {
    const W = 4096;
    const H = 2048;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    const ocean = g.createLinearGradient(0, 0, 0, H);
    ocean.addColorStop(0, '#0f3d6e');
    ocean.addColorStop(0.5, '#1d6fa8');
    ocean.addColorStop(1, '#0f3d6e');
    g.fillStyle = ocean;
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#4f9a5a';
    for (const f of this.countries) {
      g.beginPath();
      this._tracePolygons(g, f.geometry, W, H);
      g.fill('evenodd');
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.earth.material.map = tex;
    this.earth.material.color.set(0xffffff);
    this.earth.material.needsUpdate = true;
  }

  _tracePolygons(g, geometry, W, H, filter = null) {
    if (!geometry) return;
    const polys = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
    for (const poly of polys) {
      if (filter && !filter(poly)) continue;
      for (const ring of poly) {
        ring.forEach(([lon, lat], i) => {
          const x = ((lon + 180) / 360) * W;
          const y = ((90 - lat) / 180) * H;
          if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
        });
        g.closePath();
      }
    }
  }

  // ---------------------------------------------------------- caméra

  setInsets(insets) {
    Object.assign(this.insets, insets);
    this.controls.maxDistance = this.homeDistance() * 1.6;
  }

  // Le globe glisse en douceur quand un panneau s'ouvre ou se ferme.
  _easeInsets() {
    let moved = false;
    for (const k of ['top', 'right', 'bottom', 'left']) {
      const diff = this.insets[k] - this.shownInsets[k];
      if (Math.abs(diff) < 0.5) {
        if (diff) { this.shownInsets[k] = this.insets[k]; moved = true; }
        continue;
      }
      this.shownInsets[k] += diff * 0.14;
      moved = true;
    }
    if (moved) this._applyViewOffset();
  }

  _resize() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.width = w;
    this.height = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this._applyViewOffset();
    this.controls.maxDistance = this.homeDistance() * 1.6;
  }

  _applyViewOffset() {
    const { top, right, bottom, left } = this.shownInsets;
    const sx = (left - right) / 2;
    const sy = (top - bottom) / 2;
    if (sx || sy) this.camera.setViewOffset(this.width, this.height, -sx, -sy, this.width, this.height);
    else this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
  }

  /** Demi-angle de vue utile (la plus petite dimension de la zone libre). */
  _halfView() {
    const { top, right, bottom, left } = this.insets;
    const freeW = Math.max(120, this.width - left - right);
    const freeH = Math.max(120, this.height - top - bottom);
    const t = Math.tan((FOV / 2) * DEG);
    return Math.atan(t * Math.min(freeW, freeH) / this.height);
  }

  /** Distance à laquelle tout le globe tient dans la zone libre. */
  homeDistance() {
    return 1 / Math.sin(this._halfView() * 0.9);
  }

  /** Distance pour voir une calotte de rayon angulaire alpha (radians). */
  fitDistance(alpha) {
    const home = this.homeDistance();
    if (alpha > 1.25) return home;
    const beta = this._halfView() * 0.78;
    const d = Math.cos(alpha) + Math.sin(alpha) / Math.tan(beta);
    return THREE.MathUtils.clamp(d, MIN_DIST + 0.03, home);
  }

  _stopInertia() {
    const c = this.controls;
    if (c._sphericalDelta) c._sphericalDelta.set(0, 0, 0);
    if (c.sphericalDelta) c.sphericalDelta.set(0, 0, 0);
  }

  /** Vol de caméra jusqu'à regarder la direction `dir`, à la distance `dist`. */
  flyTo(dir, dist, duration = 1400) {
    const target = dir.clone().normalize();
    // Les contrôles interdisent les pôles exacts : on reste un peu en dessous.
    const ll = vec3ToLatLon(target);
    latLonToVec3(THREE.MathUtils.clamp(ll.lat, -78, 78), ll.lon, 1, target);
    this._stopInertia();
    const from = this.camera.position.clone();
    const fromDir = from.clone().normalize();
    const fromDist = from.length();
    const angle = fromDir.angleTo(target);
    // Pour les grands voyages, on prend un peu de hauteur au milieu du vol.
    const bump = Math.max(0, angle - 0.5) * 0.55 * Math.max(fromDist, dist);
    this._endFlight();
    return new Promise((resolve) => {
      this.flight = { fromDir, target, fromDist, dist, bump, duration, t0: performance.now(), resolve };
    });
  }

  // Termine (ou interrompt) le vol en cours : sa promesse est toujours tenue.
  _endFlight() {
    if (!this.flight) return;
    const { resolve } = this.flight;
    this.flight = null;
    this._stopInertia();
    resolve();
  }

  flyToLatLon(lat, lon, dist, duration) {
    return this.flyTo(latLonToVec3(lat, lon), dist ?? this.camera.position.length(), duration);
  }

  /** Cadre plusieurs points (lat/lon) à la fois. */
  flyToFit(points, duration = 1400) {
    const vecs = points.map((p) => latLonToVec3(p.lat, p.lon));
    const center = new THREE.Vector3();
    vecs.forEach((v) => center.add(v));
    if (center.lengthSq() < 1e-6) center.copy(this.camera.position);
    center.normalize();
    let alpha = 0;
    vecs.forEach((v) => { alpha = Math.max(alpha, center.angleTo(v)); });
    return this.flyTo(center, this.fitDistance(Math.max(alpha + 0.05, 0.12)), duration);
  }

  goHome(duration = 1600) {
    return this.flyTo(this.camera.position.clone(), this.homeDistance(), duration);
  }

  zoomBy(factor) {
    this._stopInertia();
    const d = THREE.MathUtils.clamp(this.camera.position.length() * factor, MIN_DIST, this.controls.maxDistance);
    return this.flyTo(this.camera.position.clone(), d, 420);
  }

  setAutoRotate(on) {
    this.controls.autoRotate = on;
  }

  /** Le point du globe sous le curseur (ou null). */
  pick(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    const hit = ray.intersectObject(this.earth, false)[0];
    return hit ? vec3ToLatLon(hit.point) : null;
  }

  /** Position à l'écran d'un point du globe, et s'il est sur la face visible. */
  project(lat, lon) {
    const p = latLonToVec3(lat, lon);
    const visible = p.dot(this.camera.position) - 1 > 0.02;
    p.project(this.camera);
    return { x: (p.x + 1) / 2 * this.width, y: (1 - p.y) / 2 * this.height, visible };
  }

  // ---------------------------------------------------------- épingles & co

  /**
   * Pose un élément HTML sur le globe.
   * @returns {{el, setLatLon, remove}}
   */
  addMarker(el, lat, lon, { altitude = 0 } = {}) {
    const marker = {
      el,
      pos: latLonToVec3(lat, lon, 1 + altitude),
      setLatLon: (la, lo) => latLonToVec3(la, lo, 1 + altitude, marker.pos),
      remove: () => { el.remove(); this.markers.delete(marker); },
    };
    el.classList.add('marker');
    this.overlay.appendChild(el);
    this.markers.add(marker);
    this._placeMarker(marker);
    return marker;
  }

  _placeMarker(m) {
    const p = this._tmp || (this._tmp = new THREE.Vector3());
    p.copy(m.pos).project(this.camera);
    const x = (p.x + 1) / 2 * this.width;
    const y = (1 - p.y) / 2 * this.height;
    // Visible si le point est du côté de la caméra : p·cam > r².
    const facing = m.pos.dot(this.camera.position) - m.pos.lengthSq();
    const vis = THREE.MathUtils.clamp(facing * 12, 0, 1);
    m.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    m.el.style.opacity = vis.toFixed(3);
    m.el.style.visibility = vis < 0.02 ? 'hidden' : 'visible';
  }

  /**
   * Trace l'arc (grand cercle) entre deux points, en l'animant.
   * @returns {Promise<{apex: {lat, lon, altitude}}>}
   */
  addArc(a, b, { color = 0xffd54a, duration = 1000, animate = true } = {}) {
    const va = latLonToVec3(a.lat, a.lon);
    const vb = latLonToVec3(b.lat, b.lon);
    const angle = va.angleTo(vb);
    const height = Math.min(0.32, angle * 0.32) + 0.002;
    const n = Math.max(24, Math.ceil(angle * 90));
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push(slerpUnit(va, vb, t).multiplyScalar(1.002 + height * Math.sin(Math.PI * t)));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const dist = this.fitDistance(angle / 2 + 0.05);
    const radius = 0.0016 * (dist - 1) + 0.00035;
    const radial = 8;
    const geo = new THREE.TubeGeometry(curve, n * 2, radius, radial, false);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 }));
    mesh.renderOrder = 4;
    this.scene.add(mesh);
    const total = geo.index.count;
    const perSeg = radial * 6;
    const segs = n * 2;
    const arc = { mesh, total };
    this.arcs.push(arc);

    const mid = slerpUnit(va, vb, 0.5);
    const apex = { ...vec3ToLatLon(mid), altitude: height + 0.002 };
    if (!animate) return Promise.resolve({ apex });

    geo.setDrawRange(0, 0);
    return new Promise((resolve) => {
      arc.anim = {
        t0: performance.now(), duration,
        step: (k) => geo.setDrawRange(0, Math.min(total, Math.ceil(easeOut(k) * segs) * perSeg)),
        resolve: () => resolve({ apex }),
      };
    });
  }

  /**
   * Met un pays en valeur (calque doré + contour). Seules les parties du pays
   * proches de `near` sont gardées : pour Honolulu, on éclaire Hawaï et pas
   * tous les États-Unis ; pour Saint-Denis, La Réunion et pas la métropole.
   * @returns {{center: {lat, lon}, radius: number} | null}
   */
  highlightCountry(iso, near, maxKm = 2200) {
    this.clearHighlight();
    if (!this.countries) return null;
    const features = this.countries.filter((f) => f.id === iso);
    if (!features.length) return null;

    const keep = (poly) => poly[0].some(([lon, lat]) => distanceKm({ lat, lon }, near) < maxKm);
    const W = 2048;
    const H = 1024;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(255, 214, 90, 0.42)';

    const ringLines = [];
    const center = new THREE.Vector3();
    const v = new THREE.Vector3();
    let count = 0;
    for (const f of features) {
      g.beginPath();
      this._tracePolygons(g, f.geometry, W, H, keep);
      g.fill('evenodd');
      const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
      for (const poly of polys) {
        if (!keep(poly)) continue;
        ringLines.push(poly[0]);
        for (const [lon, lat] of poly[0]) { center.add(latLonToVec3(lat, lon, 1, v)); count++; }
      }
    }
    if (!count) return null;
    center.normalize();
    let radius = 0;
    for (const ring of ringLines) {
      for (const [lon, lat] of ring) radius = Math.max(radius, center.angleTo(latLonToVec3(lat, lon, 1, v)));
    }

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    const fill = new THREE.Mesh(
      new THREE.SphereGeometry(1.0008, 128, 96),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }),
    );
    const outline = new THREE.LineSegments(
      this._sphereSegments(ringLines, 1.0022, 0.5),
      new THREE.LineBasicMaterial({ color: 0xffd54a, transparent: true, opacity: 1, depthWrite: false }),
    );
    fill.renderOrder = 1;
    outline.renderOrder = 5;
    this.highlight = new THREE.Group();
    this.highlight.add(fill, outline);
    this.highlight.userData.t0 = performance.now();
    this.scene.add(this.highlight);
    return { center: vec3ToLatLon(center), radius };
  }

  clearHighlight() {
    if (!this.highlight) return;
    this.scene.remove(this.highlight);
    this.highlight.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
    });
    this.highlight = null;
  }

  clearArcs() {
    for (const a of this.arcs) {
      this.scene.remove(a.mesh);
      a.mesh.geometry.dispose();
      a.mesh.material.dispose();
    }
    this.arcs = [];
  }

  clearMarkers() {
    for (const m of [...this.markers]) m.remove();
  }

  clearAll() {
    this.clearArcs();
    this.clearMarkers();
    this.clearHighlight();
  }

  // ---------------------------------------------------------- boucle

  _frame() {
    const now = performance.now();
    this.starUniforms.time.value = this.clock.getElapsedTime();
    this._easeInsets();

    if (this.flight) {
      const f = this.flight;
      const k = Math.min(1, (now - f.t0) / f.duration);
      const e = easeInOut(k);
      const dir = slerpUnit(f.fromDir, f.target, e);
      const d = THREE.MathUtils.lerp(f.fromDist, f.dist, e) + f.bump * Math.sin(Math.PI * e);
      this.camera.position.copy(dir).multiplyScalar(d);
      this.camera.lookAt(0, 0, 0);
      if (k >= 1) this._endFlight();
    } else {
      // Plus on est près, plus la rotation doit être lente sous le doigt.
      const d = this.camera.position.length() - 1;
      this.controls.rotateSpeed = Math.min(0.62, 0.14 * d + 0.08 * d * d);
      this.controls.zoomSpeed = THREE.MathUtils.clamp(0.5 + d * 0.4, 0.5, 1);
      this.controls.update();
    }

    for (const a of this.arcs) {
      if (!a.anim) continue;
      const k = Math.min(1, (now - a.anim.t0) / a.anim.duration);
      a.anim.step(k);
      if (k >= 1) { const r = a.anim.resolve; a.anim = null; r(); }
    }

    if (this.highlight) {
      const t = (now - this.highlight.userData.t0) / 1000;
      this.highlight.children[1].material.opacity = 0.65 + 0.35 * Math.sin(t * 3.2);
    }

    if (this._hoverEvent) {
      const e = this._hoverEvent;
      this._hoverEvent = null;
      this.onHover(this.pick(e.clientX, e.clientY));
    }

    for (const m of this.markers) this._placeMarker(m);
    this.renderer.render(this.scene, this.camera);
  }
}
