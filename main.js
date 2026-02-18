import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.164.1/examples/jsm/loaders/GLTFLoader.js";

const section3D = document.getElementById("sec-3d");
const stageElement = section3D.querySelector(".three-stage");
const canvasWrap = document.getElementById("threeCanvasWrap");
const trackSteps = Array.from(document.querySelectorAll(".track-step"));
const revealElements = Array.from(document.querySelectorAll(".reveal"));
const menuLinks = Array.from(document.querySelectorAll(".menu a"));
const allSections = Array.from(document.querySelectorAll("main section[id]"));

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(canvasWrap.clientWidth, canvasWrap.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
canvasWrap.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36, canvasWrap.clientWidth / canvasWrap.clientHeight, 0.1, 100);
camera.position.set(0, 0.95, 6.2);

const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
keyLight.position.set(4.4, 5.6, 6.3);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xdce4ff, 1.2);
fillLight.position.set(-4.2, 2.8, 4.4);
scene.add(fillLight);

const hemiLight = new THREE.HemisphereLight(0xf6f9ff, 0xe6e8ef, 1.1);
scene.add(hemiLight);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(3.9, 64),
  new THREE.MeshStandardMaterial({
    color: 0xf2f3f6,
    roughness: 0.92,
    metalness: 0.04,
    transparent: true,
    opacity: 0.94
  })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.25;
scene.add(floor);

const halo = new THREE.Mesh(
  new THREE.RingGeometry(3.2, 3.7, 64),
  new THREE.MeshBasicMaterial({ color: 0xe4e8f2, transparent: true, opacity: 0.42 })
);
halo.rotation.x = -Math.PI / 2;
halo.position.y = -1.24;
scene.add(halo);

const loader = new GLTFLoader();
const modelWrappers = [];
let animationClock = new THREE.Clock();
let currentScrollProgress = 0;

setupRevealAnimation();
setupActiveMenu();
init3D();
window.addEventListener("resize", onResize);

function setupRevealAnimation() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
        }
      });
    },
    { threshold: 0.2 }
  );

  revealElements.forEach((element) => observer.observe(element));
}

function setupActiveMenu() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          menuLinks.forEach((link) => {
            link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
          });
        }
      });
    },
    {
      rootMargin: "-35% 0px -55% 0px",
      threshold: 0
    }
  );

  allSections.forEach((section) => observer.observe(section));
}

async function init3D() {
  try {
    const [cuia, oculos] = await Promise.all([
      loadModel("./assets/models/cuia.glb", 2.4),
      loadModel("./assets/models/oculos.glb", 3.1)
    ]);

    const cuiaWrapper = new THREE.Group();
    cuiaWrapper.add(cuia);
    cuiaWrapper.position.set(-1.55, -0.08, 0);
    scene.add(cuiaWrapper);

    const oculosWrapper = new THREE.Group();
    oculosWrapper.add(oculos);
    oculosWrapper.position.set(1.65, -0.09, 0);
    scene.add(oculosWrapper);

    modelWrappers.push({
      key: "cuia",
      group: cuiaWrapper,
      baseRotationY: -0.38,
      basePosX: -1.55
    });

    modelWrappers.push({
      key: "oculos",
      group: oculosWrapper,
      baseRotationY: 0.58,
      basePosX: 1.65
    });

    update3DByScroll(0);
    animate();
  } catch (error) {
    const message = document.createElement("div");
    message.style.position = "absolute";
    message.style.inset = "0";
    message.style.display = "grid";
    message.style.placeItems = "center";
    message.style.fontSize = "0.95rem";
    message.style.color = "#6e6e73";
    message.textContent = "Não foi possível carregar os modelos 3D.";
    canvasWrap.appendChild(message);
    console.error(error);
  }
}

function loadModel(path, targetMaxSize) {
  return new Promise((resolve, reject) => {
    loader.load(
      path,
      (gltf) => {
        const model = gltf.scene;
        normalizeModelSize(model, targetMaxSize);
        optimizeMaterials(model);
        resolve(model);
      },
      undefined,
      (error) => reject(error)
    );
  });
}

function normalizeModelSize(object, targetMaxSize) {
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const maxAxis = Math.max(size.x, size.y, size.z) || 1;
  const scale = targetMaxSize / maxAxis;
  object.scale.setScalar(scale);

  object.position.x -= center.x * scale;
  object.position.y -= center.y * scale;
  object.position.z -= center.z * scale;
}

function optimizeMaterials(object) {
  object.traverse((child) => {
    if (!child.isMesh || !child.material) {
      return;
    }

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      material.transparent = true;
      material.opacity = 1;
      material.needsUpdate = true;
    });
  });
}

function easeInOut(value) {
  return value * value * (3 - 2 * value);
}

function segmentProgress(progress, start, end) {
  const range = end - start;
  if (range <= 0) return 0;
  const normalized = (progress - start) / range;
  return THREE.MathUtils.clamp(normalized, 0, 1);
}

function update3DByScroll(deltaSeconds) {
  const stageRect = stageElement.getBoundingClientRect();
  const viewport = window.innerHeight;
  const raw = (viewport * 0.55 - stageRect.top) / (stageRect.height - viewport * 0.2);
  const progress = THREE.MathUtils.clamp(raw, 0, 1);

  currentScrollProgress = THREE.MathUtils.damp(currentScrollProgress, progress, 6.5, Math.max(deltaSeconds, 1 / 120));

  const intro = easeInOut(segmentProgress(currentScrollProgress, 0.04, 0.45));
  const switchToSecond = easeInOut(segmentProgress(currentScrollProgress, 0.52, 0.96));

  const cuiaWeight = THREE.MathUtils.clamp(1 - switchToSecond * 1.2, 0, 1);
  const oculosWeight = THREE.MathUtils.clamp((switchToSecond - 0.05) * 1.2, 0, 1);

  const cuia = modelWrappers[0];
  const oculos = modelWrappers[1];

  if (cuia && oculos) {
    cuia.group.position.x = THREE.MathUtils.lerp(cuia.basePosX, -0.35, intro);
    cuia.group.position.y = -0.08 + Math.sin(performance.now() * 0.0016) * 0.05;
    cuia.group.rotation.y = cuia.baseRotationY + intro * 0.72 + performance.now() * 0.00028;
    setModelOpacity(cuia.group, cuiaWeight);

    oculos.group.position.x = THREE.MathUtils.lerp(2.15, oculos.basePosX, switchToSecond);
    oculos.group.position.y = -0.08 + Math.sin(performance.now() * 0.0012 + 0.8) * 0.04;
    oculos.group.rotation.y = oculos.baseRotationY - switchToSecond * 0.86 - performance.now() * 0.00024;
    setModelOpacity(oculos.group, oculosWeight);

    camera.position.x = THREE.MathUtils.lerp(0.15, -0.1, switchToSecond * 0.55);
    camera.position.z = THREE.MathUtils.lerp(6.2, 5.5, currentScrollProgress);
    camera.lookAt(0, 0, 0);
  }

  halo.material.opacity = THREE.MathUtils.lerp(0.18, 0.56, currentScrollProgress);

  trackSteps[0]?.classList.toggle("is-visible", currentScrollProgress < 0.56 && currentScrollProgress > 0.08);
  trackSteps[1]?.classList.toggle("is-visible", currentScrollProgress >= 0.48);
}

function setModelOpacity(group, opacity) {
  group.traverse((child) => {
    if (!child.isMesh || !child.material) {
      return;
    }

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      material.opacity = opacity;
    });
  });
}

function onResize() {
  const width = canvasWrap.clientWidth;
  const height = canvasWrap.clientHeight;

  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  if (window.innerWidth < 760) {
    camera.fov = 42;
    camera.position.z = 6.6;
  } else {
    camera.fov = 36;
    camera.position.z = 6.2;
  }
  camera.updateProjectionMatrix();
}

function animate() {
  const delta = animationClock.getDelta();
  update3DByScroll(delta);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
