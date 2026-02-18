/* ─────────────────────────────────────────────
   André Machado — Portfolio  ·  Three.js 3D
   Dark/Light mode + mouse-drag rotation
   ───────────────────────────────────────────── */

import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.164.1/examples/jsm/loaders/GLTFLoader.js";

/* ── DOM refs ────────────────────────────── */
const stage       = document.getElementById("stage");
const canvasWrap  = document.getElementById("stageCanvas");
const slides      = Array.from(document.querySelectorAll(".stage-slide"));
const reveals     = Array.from(document.querySelectorAll(".reveal"));
const navLinks    = Array.from(document.querySelectorAll(".nav-links a"));
const sections    = Array.from(document.querySelectorAll("main section[id]"));
const themeBtn    = document.getElementById("themeToggle");
const htmlEl      = document.documentElement;

/* ── Theme toggle ────────────────────────── */
const THEME_KEY = "am-theme";
function applyTheme(t) {
  htmlEl.setAttribute("data-theme", t);
  localStorage.setItem(THEME_KEY, t);
}
// init from storage or system preference
const stored = localStorage.getItem(THEME_KEY);
if (stored) {
  applyTheme(stored);
} else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
  applyTheme("dark");
}
themeBtn.addEventListener("click", () => {
  const next = htmlEl.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
});

/* ── Set stage height ────────────────────── */
const NUM_SLIDES = slides.length;
stage.style.height = `${(NUM_SLIDES + 1) * 100}vh`;

/* ── Renderer ────────────────────────────── */
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(canvasWrap.clientWidth, canvasWrap.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
canvasWrap.appendChild(renderer.domElement);

/* ── Scene ───────────────────────────────── */
const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  34, canvasWrap.clientWidth / canvasWrap.clientHeight, 0.1, 100
);
camera.position.set(0, 0.6, 6);

/* ── Lighting — studio setup ─────────────── */
const keyL = new THREE.DirectionalLight(0xffffff, 2.6);
keyL.position.set(5, 6, 7);
scene.add(keyL);

const fillL = new THREE.DirectionalLight(0xd8e0f3, 1.4);
fillL.position.set(-4, 3, 5);
scene.add(fillL);

const rimL = new THREE.DirectionalLight(0xffffff, 1.0);
rimL.position.set(0, 4, -5);
scene.add(rimL);

const hemiL = new THREE.HemisphereLight(0xf0f4ff, 0xe4e6ec, 0.9);
scene.add(hemiL);

/* ── Floor ───────────────────────────────── */
const floor = new THREE.Mesh(
  new THREE.CircleGeometry(4.5, 64),
  new THREE.MeshStandardMaterial({
    color: 0xecedf0,
    roughness: 0.95,
    metalness: 0.02,
    transparent: true,
    opacity: 0.7,
  })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.45;
scene.add(floor);

/* ── Models ──────────────────────────────── */
const loader = new GLTFLoader();
const models = [];
let smoothProgress = 0;
const clock = new THREE.Clock();

const MODEL_DEFS = [
  { path: "./assets/models/cuia.glb",   size: 2.6, y: -0.1, rotY: -0.3  },
  { path: "./assets/models/oculos.glb", size: 3.4, y: -0.05, rotY:  0.5 },
];

/* ── Mouse drag rotation ─────────────────── */
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragRotX = 0;    // user-applied rotation around Y
let dragRotY = 0;    // user-applied rotation around X
let targetDragRotX = 0;
let targetDragRotY = 0;

canvasWrap.addEventListener("pointerdown", (e) => {
  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  canvasWrap.setPointerCapture(e.pointerId);
});

canvasWrap.addEventListener("pointermove", (e) => {
  if (!isDragging) return;
  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;
  targetDragRotX += dx * 0.008;
  targetDragRotY += dy * 0.004;
  // clamp vertical tilt
  targetDragRotY = Math.max(-0.6, Math.min(0.6, targetDragRotY));
  dragStartX = e.clientX;
  dragStartY = e.clientY;
});

canvasWrap.addEventListener("pointerup", () => { isDragging = false; });
canvasWrap.addEventListener("pointercancel", () => { isDragging = false; });

/* ── Init ────────────────────────────────── */
initReveal();
initActiveNav();
init3D();
window.addEventListener("resize", onResize);

/* ── Reveal observer ─────────────────────── */
function initReveal() {
  const obs = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add("visible");
    }),
    { threshold: 0.15 }
  );
  reveals.forEach((el) => obs.observe(el));
}

/* ── Active nav link ─────────────────────── */
function initActiveNav() {
  const obs = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) {
        const id = e.target.id;
        navLinks.forEach((l) =>
          l.classList.toggle("active", l.getAttribute("href") === `#${id}`)
        );
      }
    }),
    { rootMargin: "-30% 0px -60% 0px" }
  );
  sections.forEach((s) => obs.observe(s));
}

/* ── Load 3D models ──────────────────────── */
async function init3D() {
  try {
    const loaded = await Promise.all(
      MODEL_DEFS.map((d) => loadModel(d.path, d.size))
    );

    loaded.forEach((mesh, i) => {
      const group = new THREE.Group();
      group.add(mesh);
      group.position.y = MODEL_DEFS[i].y;
      group.rotation.y = MODEL_DEFS[i].rotY;
      group.visible = false;
      scene.add(group);
      models.push({ group, baseY: MODEL_DEFS[i].y });
    });

    animate();
  } catch (err) {
    console.error("3D load error:", err);
    const msg = document.createElement("div");
    Object.assign(msg.style, {
      position: "absolute", inset: "0",
      display: "grid", placeItems: "center",
      fontSize: ".95rem", color: "#6e6e73",
    });
    msg.textContent = "Não foi possível carregar os modelos 3D.";
    canvasWrap.appendChild(msg);
  }
}

function loadModel(path, targetSize) {
  return new Promise((resolve, reject) => {
    loader.load(path, (gltf) => {
      const m = gltf.scene;
      const box = new THREE.Box3().setFromObject(m);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      const s = targetSize / (Math.max(size.x, size.y, size.z) || 1);
      m.scale.setScalar(s);
      m.position.sub(center.multiplyScalar(s));

      m.traverse((c) => {
        if (c.isMesh && c.material) {
          const mats = Array.isArray(c.material) ? c.material : [c.material];
          mats.forEach((mat) => {
            mat.transparent = true;
            mat.needsUpdate = true;
          });
        }
      });

      resolve(m);
    }, undefined, reject);
  });
}

/* ── Scroll-driven 3D update ─────────────── */
function updateScroll(dt) {
  if (!models.length) return;

  // smooth user drag rotation
  dragRotX += (targetDragRotX - dragRotX) * 0.12;
  dragRotY += (targetDragRotY - dragRotY) * 0.12;

  // slowly decay drag back when not dragging
  if (!isDragging) {
    targetDragRotX *= 0.98;
    targetDragRotY *= 0.98;
  }

  const stageRect = stage.getBoundingClientRect();
  const vh = window.innerHeight;

  const raw = THREE.MathUtils.clamp(
    -stageRect.top / (stageRect.height - vh), 0, 1
  );

  smoothProgress = THREE.MathUtils.damp(
    smoothProgress, raw, 5.5, Math.max(dt, 1 / 120)
  );

  const p = smoothProgress;
  const t = performance.now();

  const segSize = 1 / NUM_SLIDES;

  models.forEach((m, i) => {
    const segStart = i * segSize;

    const local = THREE.MathUtils.clamp(
      (p - segStart) / segSize, 0, 1
    );

    const fadeIn  = THREE.MathUtils.smoothstep(local, 0.0,  0.15);
    const fadeOut = 1 - THREE.MathUtils.smoothstep(local, 0.82, 1.0);
    const opacity = i === NUM_SLIDES - 1
      ? fadeIn
      : Math.min(fadeIn, fadeOut);

    const isActive = opacity > 0.01;
    m.group.visible = isActive;

    if (!isActive) return;

    // float + auto-rotate + user drag
    m.group.position.y = m.baseY + Math.sin(t * 0.0012 + i) * 0.06;
    m.group.rotation.y = MODEL_DEFS[i].rotY + t * 0.00025 + dragRotX;
    m.group.rotation.x = dragRotY;

    // scale entrance
    const scaleT = THREE.MathUtils.smoothstep(local, 0.0, 0.2);
    const s = THREE.MathUtils.lerp(0.7, 1, scaleT);
    m.group.scale.setScalar(s);

    // opacity
    m.group.traverse((c) => {
      if (c.isMesh && c.material) {
        const mats = Array.isArray(c.material) ? c.material : [c.material];
        mats.forEach((mat) => { mat.opacity = opacity; });
      }
    });
  });

  // slide text visibility
  slides.forEach((slide, i) => {
    const segStart = i * segSize;
    const local = (p - segStart) / segSize;
    const vis = local > 0.1 && local < 0.9;
    const textEl = slide.querySelector(".slide-text");
    if (textEl) textEl.classList.toggle("visible", vis);
  });

  // camera
  camera.position.x = THREE.MathUtils.lerp(0.1, -0.1, p);
  camera.position.z = THREE.MathUtils.lerp(6, 5.2, p);
  camera.lookAt(0, 0, 0);
}

/* ── Resize ──────────────────────────────── */
function onResize() {
  const w = canvasWrap.clientWidth;
  const h = canvasWrap.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.fov = window.innerWidth < 760 ? 40 : 34;
  camera.updateProjectionMatrix();
}

/* ── Render loop ─────────────────────────── */
function animate() {
  const dt = clock.getDelta();
  updateScroll(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
