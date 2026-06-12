// SPIDER-SWING — a web-swinging sandbox over a procedural dusk city.
// Three.js + UnrealBloom, pendulum-constraint swing physics, procedural hero animation.

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// ---------------------------------------------------------------- constants

const GRID = 14;            // city blocks per side
const SPACING = 64;         // meters per block
const GRAVITY = 30;
const RUN_SPEED = 24;
const SPRINT_SPEED = 33;
const JUMP_SPEED = 14;
const AIR_ACCEL = 16;       // WASD steering while airborne
const SWING_PUMP = 12;      // extra accel along velocity while holding W on the web
const REEL_SPEED = 10;      // shift reel-in
const AUTO_REEL = 1.2;      // slow natural shortening keeps swings energetic
const MAX_WEB_DIST = 150;
const PLAYER_R = 0.8;
const PLAYER_H = 2.3;
const CITY_EDGE = GRID * SPACING * 0.55;

const SUN_DIR = new THREE.Vector3(-0.55, 0.32, -0.42).normalize();

// ---------------------------------------------------------------- renderer

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x33204a, 0.00125);

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 4500);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight), 0.55, 0.5, 0.72
);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------------------------------------------------------------- sky

const sky = new THREE.Mesh(
  new THREE.SphereGeometry(2200, 32, 16),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      sunDir: { value: SUN_DIR.clone() },
      zenith: { value: new THREE.Color(0x0a0f2e) },
      horizon: { value: new THREE.Color(0xff7a3c) },
      glow: { value: new THREE.Color(0xffb56b) },
    },
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 sunDir, zenith, horizon, glow;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float t = pow(clamp(d.y, 0.0, 1.0), 0.5);
        vec3 col = mix(horizon, zenith, t);
        float s = clamp(dot(d, sunDir), 0.0, 1.0);
        col += glow * (pow(s, 8.0) * 0.65 + pow(s, 64.0) * 0.8);
        if (d.y < 0.0) col = mix(col, zenith * 0.4, clamp(-d.y * 6.0, 0.0, 1.0));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  })
);
scene.add(sky);

// stars in the upper sky
{
  const n = 700;
  const verts = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const v = new THREE.Vector3().randomDirection();
    v.y = Math.abs(v.y) * 0.9 + 0.12;
    v.normalize().multiplyScalar(2000);
    verts.set([v.x, v.y, v.z], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({
    color: 0xbfd2ff, size: 2.2, sizeAttenuation: false,
    transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
  })));
}

// sun sprite
{
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255,235,200,1)');
  grad.addColorStop(0.18, 'rgba(255,180,100,0.9)');
  grad.addColorStop(0.5, 'rgba(255,120,60,0.25)');
  grad.addColorStop(1, 'rgba(255,100,50,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending,
    depthWrite: false, fog: false,
  }));
  sun.position.copy(SUN_DIR).multiplyScalar(1900);
  sun.scale.setScalar(560);
  scene.add(sun);
}

// ---------------------------------------------------------------- lights

scene.add(new THREE.HemisphereLight(0x7a6acd, 0x241526, 0.55));

const sunLight = new THREE.DirectionalLight(0xffa264, 2.4);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.left = -180;
sunLight.shadow.camera.right = 180;
sunLight.shadow.camera.top = 180;
sunLight.shadow.camera.bottom = -180;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 700;
sunLight.shadow.bias = -0.0004;
scene.add(sunLight, sunLight.target);

// camera-side fill so the hero reads even when backlit by the sunset
const fillLight = new THREE.PointLight(0x99aaff, 0.9, 40, 1.2);
scene.add(fillLight);

// ---------------------------------------------------------------- ground

function makeGroundTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1b1b22';            // asphalt
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#26242c';            // block / sidewalk plate
  ctx.fillRect(42, 42, 172, 172);
  ctx.strokeStyle = '#34323c';
  ctx.lineWidth = 4;
  ctx.strokeRect(42, 42, 172, 172);
  ctx.strokeStyle = 'rgba(255,200,90,0.5)';   // lane dashes on street centerlines
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 18]);
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(256, 0);
  ctx.moveTo(0, 256); ctx.lineTo(256, 256);
  ctx.moveTo(0, 0); ctx.lineTo(0, 256);
  ctx.moveTo(256, 0); ctx.lineTo(256, 256);
  ctx.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(64, 64);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(4096, 4096),
  new THREE.MeshStandardMaterial({ map: makeGroundTexture(), roughness: 0.95, metalness: 0 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// street lamp glow dots at block corners
{
  const pts = [];
  const half = (GRID - 1) / 2;
  for (let i = 0; i <= GRID; i++) {
    for (let j = 0; j <= GRID; j++) {
      pts.push((i - half - 0.5) * SPACING, 6, (j - half - 0.5) * SPACING);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({
    color: 0xffa050, size: 2.6, transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })));
}

// ---------------------------------------------------------------- buildings

function makeWindowTexture(facade, litChance) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = facade;
  ctx.fillRect(0, 0, 64, 128);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 4; x++) {
      const lit = Math.random() < litChance;
      if (lit) {
        const b = 0.55 + Math.random() * 0.45;
        ctx.fillStyle = `rgb(${255 * b | 0},${198 * b | 0},${110 * b | 0})`;
      } else {
        ctx.fillStyle = Math.random() < 0.5 ? '#0b0e16' : '#101524';
      }
      ctx.fillRect(x * 16 + 4, y * 16 + 4, 9, 9);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const facadeColors = ['#2e3140', '#3a3344', '#28303a', '#39424e', '#332f3b', '#2b2b35'];
const windowMats = facadeColors.map((col, i) => {
  const tex = makeWindowTexture(col, 0.3 + (i % 3) * 0.12);
  return new THREE.MeshStandardMaterial({
    map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.85,
    roughness: 0.85, metalness: 0.1,
  });
});
const roofMat = new THREE.MeshStandardMaterial({ color: 0x23222b, roughness: 0.95 });
const towerMat = new THREE.MeshStandardMaterial({ color: 0x4a3528, roughness: 0.9 });

const buildings = [];        // { x, z, w, d, h } AABB colliders
const buildingMeshes = [];   // for web raycasts
const beacons = [];          // pulsing red rooftop lights

function addBuilding(cx, cz, w, d, h) {
  const geo = new THREE.BoxGeometry(w, h, d);
  // scale side-face UVs so windows keep a constant real-world size
  const uv = geo.attributes.uv;
  const normal = geo.attributes.normal;
  const floors = Math.max(1, Math.round(h / 8));
  for (let i = 0; i < uv.count; i++) {
    const ny = normal.getY(i);
    if (Math.abs(ny) < 0.5) {
      const horiz = Math.abs(normal.getX(i)) > 0.5 ? d : w;
      uv.setXY(i, uv.getX(i) * Math.max(1, Math.round(horiz / 8)), uv.getY(i) * floors);
    }
  }
  const winMat = windowMats[(Math.random() * windowMats.length) | 0];
  const mesh = new THREE.Mesh(geo, [winMat, winMat, roofMat, roofMat, winMat, winMat]);
  mesh.position.set(cx, h / 2, cz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  buildings.push({ x: cx, z: cz, w, d, h });
  buildingMeshes.push(mesh);

  // rooftop dressing
  if (h > 55 && Math.random() < 0.45) {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.6, 6, 10), towerMat);
    tower.position.set(cx + (Math.random() - 0.5) * w * 0.4, h + 3, cz + (Math.random() - 0.5) * d * 0.4);
    tower.castShadow = true;
    scene.add(tower);
  }
  if (h > 140 && beacons.length < 14) {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 14, 6), roofMat);
    mast.position.set(cx, h + 7, cz);
    scene.add(mast);
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0xff2222, emissiveIntensity: 2 });
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), lampMat);
    lamp.position.set(cx, h + 14, cz);
    scene.add(lamp);
    beacons.push({ mat: lampMat, phase: Math.random() * Math.PI * 2 });
  }
}

{
  const half = (GRID - 1) / 2;
  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      if (Math.random() < 0.12) continue;            // plaza
      const cx = (i - half) * SPACING + (Math.random() - 0.5) * 6;
      const cz = (j - half) * SPACING + (Math.random() - 0.5) * 6;
      const w = 28 + Math.random() * 14;
      const d = 28 + Math.random() * 14;
      const centerBoost = Math.exp(-Math.hypot(cx, cz) / 320);
      let h = 22 + Math.random() * 65;
      if (Math.random() < 0.22) h = 95 + Math.random() * 120;
      h = Math.min(255, h * (0.85 + 1.15 * centerBoost));
      addBuilding(cx, cz, w, d, h);
    }
  }
}

// ---------------------------------------------------------------- hero

const heroMats = {
  red: new THREE.MeshStandardMaterial({ color: 0xc8102e, roughness: 0.5, metalness: 0.05 }),
  blue: new THREE.MeshStandardMaterial({ color: 0x1c2d92, roughness: 0.55, metalness: 0.05 }),
  eye: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xbbccdd, emissiveIntensity: 0.35, roughness: 0.3 }),
};

const hero = new THREE.Group();
const limbs = {};

function capsule(r, len, mat) {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 10), mat);
  m.castShadow = true;
  return m;
}

{
  const torso = capsule(0.34, 0.55, heroMats.red);
  torso.position.y = 1.32;
  torso.scale.z = 0.75;
  hero.add(torso);

  const hips = capsule(0.3, 0.18, heroMats.blue);
  hips.position.y = 0.92;
  hips.scale.z = 0.8;
  hero.add(hips);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 14), heroMats.red);
  head.castShadow = true;
  head.position.y = 1.95;
  head.scale.set(0.92, 1, 0.95);
  hero.add(head);
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.105, 10, 8), heroMats.eye);
    eye.position.set(side * 0.105, 2.0, 0.19);
    eye.scale.set(0.85, 1.25, 0.45);
    eye.rotation.z = side * -0.45;
    hero.add(eye);
  }

  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.46, 1.62, 0);
    const seg = capsule(0.12, 0.62, heroMats.red);
    seg.position.y = -0.42;
    arm.add(seg);
    const hand = new THREE.Object3D();
    hand.position.y = -0.84;
    arm.add(hand);
    hero.add(arm);
    limbs[side === 1 ? 'armR' : 'armL'] = arm;
    if (side === 1) limbs.handR = hand;

    const leg = new THREE.Group();
    leg.position.set(side * 0.19, 0.86, 0);
    const lseg = capsule(0.135, 0.66, heroMats.blue);
    lseg.position.y = -0.45;
    leg.add(lseg);
    hero.add(leg);
    limbs[side === 1 ? 'legR' : 'legL'] = leg;
  }
}
scene.add(hero);

// web line: unit cylinder with its base at the origin, stretched hand→anchor
const webLine = new THREE.Mesh(
  new THREE.CylinderGeometry(0.045, 0.045, 1, 6, 1, true),
  new THREE.MeshBasicMaterial({ color: 0xf5f5ff, fog: false })
);
webLine.geometry.translate(0, 0.5, 0);
webLine.visible = false;
scene.add(webLine);

const webBlob = new THREE.Mesh(
  new THREE.SphereGeometry(0.3, 8, 8),
  new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false })
);
webBlob.visible = false;
scene.add(webBlob);

// ---------------------------------------------------------------- orbs

const ORB_COUNT = 26;
const orbs = [];
const orbMat = new THREE.MeshStandardMaterial({
  color: 0xff3344, emissive: 0xff2255, emissiveIntensity: 2.2, roughness: 0.3,
});
const orbGeo = new THREE.IcosahedronGeometry(1.1, 0);

function insideAnyBuilding(x, y, z, pad) {
  for (const b of buildings) {
    if (
      x > b.x - b.w / 2 - pad && x < b.x + b.w / 2 + pad &&
      z > b.z - b.d / 2 - pad && z < b.z + b.d / 2 + pad &&
      y < b.h + pad
    ) return true;
  }
  return false;
}

function placeOrb(mesh) {
  for (let tries = 0; tries < 40; tries++) {
    const x = (Math.random() - 0.5) * GRID * SPACING * 0.9;
    const z = (Math.random() - 0.5) * GRID * SPACING * 0.9;
    const y = 18 + Math.random() * 110;
    if (!insideAnyBuilding(x, y, z, 4)) {
      mesh.position.set(x, y, z);
      return;
    }
  }
  mesh.position.set(0, 140, 0);
}

for (let i = 0; i < ORB_COUNT; i++) {
  const m = new THREE.Mesh(orbGeo, orbMat);
  placeOrb(m);
  m.userData.phase = Math.random() * Math.PI * 2;
  scene.add(m);
  orbs.push(m);
}

// ---------------------------------------------------------------- audio

let audio = null;

function initAudio() {
  if (audio) return;
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const master = ctx.createGain();
  master.gain.value = 0.7;
  master.connect(ctx.destination);

  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  // looping wind, gain driven by speed
  const wind = ctx.createBufferSource();
  wind.buffer = noiseBuf;
  wind.loop = true;
  const windFilter = ctx.createBiquadFilter();
  windFilter.type = 'bandpass';
  windFilter.frequency.value = 420;
  windFilter.Q.value = 0.6;
  const windGain = ctx.createGain();
  windGain.gain.value = 0;
  wind.connect(windFilter).connect(windGain).connect(master);
  wind.start();

  audio = { ctx, master, noiseBuf, windGain, windFilter };
}

function sfxThwip() {
  if (!audio) return;
  const { ctx, master, noiseBuf } = audio;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = 2500;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.5, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  src.connect(f).connect(g).connect(master);
  src.start(ctx.currentTime, Math.random() * 0.5, 0.13);
}

function sfxDing() {
  if (!audio) return;
  const { ctx, master } = audio;
  const o = ctx.createOscillator();
  o.type = 'triangle';
  o.frequency.setValueAtTime(880, ctx.currentTime);
  o.frequency.exponentialRampToValueAtTime(1480, ctx.currentTime + 0.09);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.35, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
  o.connect(g).connect(master);
  o.start();
  o.stop(ctx.currentTime + 0.4);
}

// ---------------------------------------------------------------- input

const keys = {};
let mouseDown = false;
let yaw = Math.PI;
let pitch = -0.15;
let playing = false;

const overlay = document.getElementById('overlay');
const hud = document.getElementById('hud');
const crosshair = document.getElementById('crosshair');

overlay.addEventListener('click', () => {
  initAudio();
  audio.ctx.resume();
  renderer.domElement.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
  playing = document.pointerLockElement === renderer.domElement;
  overlay.classList.toggle('hidden', playing);
  hud.classList.toggle('on', playing);
  if (!playing) mouseDown = false;
});

document.addEventListener('mousemove', (e) => {
  if (!playing) return;
  yaw -= e.movementX * 0.0023;
  pitch -= e.movementY * 0.0023;
  pitch = Math.max(-1.25, Math.min(0.9, pitch));
});

document.addEventListener('mousedown', (e) => {
  if (playing && e.button === 0) { mouseDown = true; tryAttachWeb(); }
});
document.addEventListener('mouseup', (e) => {
  if (e.button === 0) { mouseDown = false; detachWeb(); }
});

document.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (!playing) return;
  if (e.code === 'Space') {
    e.preventDefault();
    if (grounded) {
      vel.y = JUMP_SPEED;
      grounded = false;
    } else {
      tryAttachWeb();
    }
  }
  if (e.code === 'KeyR') resetPlayer();
});
document.addEventListener('keyup', (e) => {
  keys[e.code] = false;
  if (e.code === 'Space') detachWeb();
});

// ---------------------------------------------------------------- physics state

const pos = new THREE.Vector3();     // hero feet
const vel = new THREE.Vector3();
let grounded = false;
let webOn = false;
let ropeLen = 0;
const anchor = new THREE.Vector3();

let score = 0;
let orbsCollected = 0;

const raycaster = new THREE.Raycaster();

function resetPlayer() {
  // spawn on the tallest building near the center
  let best = buildings[0];
  for (const b of buildings) {
    if (Math.hypot(b.x, b.z) < 220 && b.h > best.h) best = b;
  }
  pos.set(best.x, best.h, best.z);
  vel.set(0, 0, 0);
  grounded = true;
  detachWeb();
}
resetPlayer();

function camForward() {
  return new THREE.Vector3(
    -Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    -Math.cos(yaw) * Math.cos(pitch)
  );
}

function tryAttachWeb() {
  if (webOn || grounded) return;
  const origin = camera.position.clone();
  const dir = camForward();
  raycaster.set(origin, dir);
  raycaster.far = MAX_WEB_DIST + 60;
  const hits = raycaster.intersectObjects(buildingMeshes, false);
  let target = null;
  for (const h of hits) {
    if (h.point.y > pos.y - 4) { target = h.point.clone(); break; }
  }
  if (!target) {
    // no building in the crosshair — sling at a point up and ahead
    const f = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    target = pos.clone().addScaledVector(f, 42).add(new THREE.Vector3(0, 52, 0));
  }
  target.y = Math.max(target.y, pos.y + 6);
  anchor.copy(target);
  ropeLen = Math.max(4, anchor.distanceTo(pos) * 0.96);
  webOn = true;
  sfxThwip();
}

function detachWeb() {
  webOn = false;
  webLine.visible = false;
  webBlob.visible = false;
}

function supportHeight(x, z) {
  let h = 0;
  for (const b of buildings) {
    if (
      x > b.x - b.w / 2 - PLAYER_R * 0.5 && x < b.x + b.w / 2 + PLAYER_R * 0.5 &&
      z > b.z - b.d / 2 - PLAYER_R * 0.5 && z < b.z + b.d / 2 + PLAYER_R * 0.5
    ) h = Math.max(h, b.h);
  }
  return h;
}

function resolveWallCollisions() {
  for (const b of buildings) {
    if (pos.y > b.h - 0.05) continue;           // above the roof — handled by support
    const dx = pos.x - b.x;
    const dz = pos.z - b.z;
    const ox = b.w / 2 + PLAYER_R - Math.abs(dx);
    const oz = b.d / 2 + PLAYER_R - Math.abs(dz);
    if (ox > 0 && oz > 0) {
      if (ox < oz) {
        pos.x = b.x + Math.sign(dx) * (b.w / 2 + PLAYER_R);
        vel.x *= -0.1;
      } else {
        pos.z = b.z + Math.sign(dz) * (b.d / 2 + PLAYER_R);
        vel.z *= -0.1;
      }
    }
  }
}

function physics(dt) {
  const fwd = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
  const move = new THREE.Vector3();
  if (keys.KeyW) move.add(fwd);
  if (keys.KeyS) move.sub(fwd);
  if (keys.KeyD) move.add(right);
  if (keys.KeyA) move.sub(right);
  if (move.lengthSq() > 0) move.normalize();

  if (grounded) {
    const speed = keys.ShiftLeft || keys.ShiftRight ? SPRINT_SPEED : RUN_SPEED;
    const target = move.clone().multiplyScalar(speed);
    vel.x += (target.x - vel.x) * Math.min(1, 10 * dt);
    vel.z += (target.z - vel.z) * Math.min(1, 10 * dt);
    vel.y = 0;
  } else {
    vel.y -= GRAVITY * dt;
    vel.addScaledVector(move, AIR_ACCEL * dt);
    // mild horizontal drag
    const drag = Math.min(1, 0.045 * dt * 60) * 0.012;
    vel.x *= 1 - drag;
    vel.z *= 1 - drag;
    if (vel.y < -85) vel.y = -85;

    if (webOn) {
      let reel = AUTO_REEL;
      if (keys.ShiftLeft || keys.ShiftRight) reel += REEL_SPEED;
      ropeLen = Math.max(3.5, ropeLen - reel * dt);
      if (keys.KeyW && vel.lengthSq() > 4) {
        vel.addScaledVector(vel.clone().normalize(), SWING_PUMP * dt);
      }
    }
  }

  pos.addScaledVector(vel, dt);

  // pendulum constraint
  if (webOn) {
    const toP = pos.clone().sub(anchor);
    const d = toP.length();
    if (d > ropeLen) {
      const dir = toP.divideScalar(d);
      pos.copy(anchor).addScaledVector(dir, ropeLen);
      const vr = vel.dot(dir);
      if (vr > 0) vel.addScaledVector(dir, -vr);
    }
  }

  resolveWallCollisions();

  // landings & falls
  const sup = supportHeight(pos.x, pos.z);
  if (pos.y <= sup + 0.02 && vel.y <= 0.01) {
    pos.y = sup;
    if (!grounded) {
      grounded = true;
      detachWeb();
    }
    vel.y = 0;
  } else if (grounded && pos.y > sup + 0.6) {
    grounded = false;     // ran off an edge
  } else if (grounded) {
    pos.y = sup;
  }

  // soft city bounds
  const r = Math.hypot(pos.x, pos.z);
  if (r > CITY_EDGE) {
    const inward = new THREE.Vector3(-pos.x / r, 0, -pos.z / r);
    vel.addScaledVector(inward, 40 * dt * (r - CITY_EDGE) * 0.1);
  }

  // orbs
  for (const orb of orbs) {
    if (orb.position.distanceToSquared(pos) < 16) {
      score += 100;
      orbsCollected++;
      sfxDing();
      spawnPopup(orb.position, '+100');
      placeOrb(orb);
    }
  }
}

// ---------------------------------------------------------------- hero animation

const tmpQ = new THREE.Quaternion();
const tmpE = new THREE.Euler();

function lerpAngle(cur, target, t) {
  return cur + (target - cur) * t;
}

function animateHero(dt, t) {
  hero.position.copy(pos);

  const hSpeed = Math.hypot(vel.x, vel.z);
  const speed = vel.length();

  // facing
  let targetYaw = yaw + Math.PI;     // model faces camera-forward by default
  if (hSpeed > 2) targetYaw = Math.atan2(vel.x, vel.z);

  // lean: forward with horizontal speed when airborne, pitch by vertical velocity
  let lean = 0;
  if (!grounded) {
    lean = Math.min(1.25, hSpeed * 0.022) + THREE.MathUtils.clamp(-vel.y * 0.012, -0.4, 0.5);
  } else {
    lean = Math.min(0.25, hSpeed * 0.008);
  }
  tmpE.set(lean, targetYaw, 0, 'YXZ');
  tmpQ.setFromEuler(tmpE);
  hero.quaternion.slerp(tmpQ, Math.min(1, 8 * dt));

  // limb targets per state
  const k = Math.min(1, 10 * dt);
  let aR = 0, aL = 0, lR = 0, lL = 0, splay = 0.12;
  if (grounded) {
    if (hSpeed > 1) {
      const c = Math.sin(t * (4 + hSpeed * 0.35));
      aR = c * 0.9; aL = -c * 0.9;
      lR = -c * 0.95; lL = c * 0.95;
    }
  } else if (webOn) {
    aR = -2.7;                                  // web arm overhead
    aL = -0.7 + Math.sin(t * 2.4) * 0.15;
    lR = 0.55 + Math.sin(t * 3.1) * 0.2;
    lL = 0.3 + Math.cos(t * 2.7) * 0.2;
    splay = 0.3;
  } else {
    aR = 1.1 + Math.sin(t * 2.2) * 0.1;          // free fall — arms swept back
    aL = 1.1 + Math.cos(t * 2.5) * 0.1;
    lR = -0.35; lL = 0.25;
    splay = 0.45;
  }
  limbs.armR.rotation.x = lerpAngle(limbs.armR.rotation.x, aR, k);
  limbs.armL.rotation.x = lerpAngle(limbs.armL.rotation.x, aL, k);
  limbs.armR.rotation.z = lerpAngle(limbs.armR.rotation.z, -splay, k);
  limbs.armL.rotation.z = lerpAngle(limbs.armL.rotation.z, splay, k);
  limbs.legR.rotation.x = lerpAngle(limbs.legR.rotation.x, lR, k);
  limbs.legL.rotation.x = lerpAngle(limbs.legL.rotation.x, lL, k);

  // web visuals
  if (webOn) {
    const hand = new THREE.Vector3();
    limbs.handR.getWorldPosition(hand);
    const span = anchor.clone().sub(hand);
    const len = span.length();
    webLine.position.copy(hand);
    webLine.scale.set(1, len, 1);
    webLine.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), span.divideScalar(len));
    webLine.visible = true;
    webBlob.position.copy(anchor);
    webBlob.visible = true;
  }

  return speed;
}

// ---------------------------------------------------------------- camera & HUD

const camPos = new THREE.Vector3(0, 160, 320);

function updateCamera(dt, speed) {
  const center = pos.clone().add(new THREE.Vector3(0, 1.6, 0));
  const dist = 7.5 + Math.min(4, speed * 0.05);
  const back = camForward().multiplyScalar(-dist);
  const desired = center.clone().add(back).add(new THREE.Vector3(0, 0.6, 0));
  desired.y = Math.max(desired.y, 1.2);
  camPos.lerp(desired, 1 - Math.exp(-14 * dt));
  camera.position.copy(camPos);
  const look = center.clone().addScaledVector(vel, 0.04);
  camera.lookAt(look);

  const targetFov = 72 + Math.min(20, speed * 0.28);
  camera.fov += (targetFov - camera.fov) * Math.min(1, 6 * dt);
  camera.updateProjectionMatrix();
}

const elScore = document.getElementById('score');
const elOrbs = document.getElementById('orbs');
const elSpeed = document.getElementById('speed');
const elAlt = document.getElementById('alt');

function updateHUD(speed) {
  elScore.textContent = score;
  elOrbs.textContent = `${orbsCollected}`;
  elSpeed.textContent = Math.round(speed * 2.237);
  elAlt.textContent = Math.round(pos.y);
  crosshair.classList.toggle('locked', webOn);
}

function spawnPopup(worldPos, text) {
  const v = worldPos.clone().project(camera);
  if (v.z > 1) return;
  const div = document.createElement('div');
  div.className = 'popup';
  div.textContent = text;
  div.style.left = `${(v.x * 0.5 + 0.5) * window.innerWidth}px`;
  div.style.top = `${(-v.y * 0.5 + 0.5) * window.innerHeight}px`;
  hud.appendChild(div);
  setTimeout(() => div.remove(), 900);
}

// ---------------------------------------------------------------- main loop

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 1 / 30);
  const t = clock.elapsedTime;

  let speed = 0;
  if (playing) {
    physics(dt);
    speed = animateHero(dt, t);
    updateCamera(dt, speed);
    updateHUD(speed);
  } else {
    // title screen: slow orbit over the skyline
    const a = t * 0.06;
    camera.position.set(Math.sin(a) * 260, 150 + Math.sin(t * 0.3) * 15, Math.cos(a) * 260);
    camera.lookAt(0, 70, 0);
    camera.fov = 60;
    camera.updateProjectionMatrix();
    animateHero(dt, t);
  }

  // ambience
  for (const orb of orbs) {
    orb.rotation.y += dt * 1.5;
    orb.rotation.x += dt * 0.7;
    orb.position.y += Math.sin(t * 2 + orb.userData.phase) * dt * 0.8;
  }
  for (const b of beacons) {
    b.mat.emissiveIntensity = 1.6 + 1.6 * Math.sin(t * 2.5 + b.phase);
  }
  if (audio) {
    audio.windGain.gain.value = Math.min(1, speed / 65) * 0.4;
    audio.windFilter.frequency.value = 300 + speed * 12;
  }

  // keep sky, shadows and sun centred on the action
  const focus = playing ? pos : new THREE.Vector3();
  sky.position.copy(camera.position);
  sunLight.position.copy(focus).addScaledVector(SUN_DIR, 320);
  sunLight.target.position.copy(focus);
  fillLight.position.copy(camera.position).addScaledVector(camera.up, 2);

  composer.render();
}

tick();
