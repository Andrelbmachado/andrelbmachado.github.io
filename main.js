import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";
import { PointerLockControls } from "https://unpkg.com/three@0.164.1/examples/jsm/controls/PointerLockControls.js";

const WORLD_HALF_SIZE = 62.5;
const PLAYER_HEIGHT = 1.72;
const MOVE_SPEED = 9;
const DAY_LENGTH_SECONDS = 180;
const CLOUD_AREA = 180;

const hudHint = document.getElementById("hint");
const panel = document.getElementById("panel");
const panelTitle = document.getElementById("panelTitle");
const panelBody = document.getElementById("panelBody");
const closePanelBtn = document.getElementById("closePanel");
const enterButton = document.getElementById("enterButton");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x6d8296);
scene.fog = new THREE.Fog(0x6d8296, 45, 210);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 450);
camera.position.set(0, PLAYER_HEIGHT, 18);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);
scene.add(controls.getObject());

const ambientLight = new THREE.HemisphereLight(0x87a6c8, 0x2d3134, 0.42);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfff1d1, 1.2);
sunLight.position.set(45, 55, 15);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 220;
sunLight.shadow.camera.left = -80;
sunLight.shadow.camera.right = 80;
sunLight.shadow.camera.top = 80;
sunLight.shadow.camera.bottom = -80;
scene.add(sunLight);

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(2.3, 18, 18),
  new THREE.MeshBasicMaterial({ color: 0xffe9aa, transparent: true, opacity: 0.95 })
);
scene.add(sun);

const ground = createGround();
scene.add(ground);

const cloudData = createClouds(10);

const worldBorder = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(WORLD_HALF_SIZE * 2, 0.1, WORLD_HALF_SIZE * 2)),
  new THREE.LineBasicMaterial({ color: 0x6d8499, transparent: true, opacity: 0.35 })
);
worldBorder.position.y = 0.05;
scene.add(worldBorder);

const portfolioSections = {
  sobre: {
    title: "Sobre",
    body: `
      <p>Designer e desenvolvedor focado em experiências digitais imersivas, produtos web e interfaces funcionais.</p>
      <div class="panel-grid">
        <div class="chip">UX/UI Design</div>
        <div class="chip">Prototipação</div>
        <div class="chip">Front-end (JS/TS)</div>
        <div class="chip">3D para Web</div>
        <div class="chip">Motion & Interaction</div>
        <div class="chip">Design Systems</div>
      </div>
    `
  },
  projetos: {
    title: "Projetos",
    body: `
      <div class="panel-grid">
        <article class="project-card">
          <h3>Projeto Atlas</h3>
          <p>Dashboard estratégico com visualização de dados em tempo real.</p>
          <a href="#" aria-label="Ver projeto Atlas">Ver mais</a>
        </article>
        <article class="project-card">
          <h3>Projeto Verge</h3>
          <p>Landing de alta conversão com foco em experiência e performance.</p>
          <a href="#" aria-label="Ver projeto Verge">Ver mais</a>
        </article>
        <article class="project-card">
          <h3>Projeto Frame</h3>
          <p>Plataforma de apresentação de portfólio 3D para equipes criativas.</p>
          <a href="#" aria-label="Ver projeto Frame">Ver mais</a>
        </article>
        <article class="project-card">
          <h3>Projeto Orbit</h3>
          <p>Experiência interativa para storytelling de produto no browser.</p>
          <a href="#" aria-label="Ver projeto Orbit">Ver mais</a>
        </article>
      </div>
    `
  },
  contato: {
    title: "Contato",
    body: `
      <div class="contacts">
        <div><strong>E-mail:</strong> andremachado.placeholder@email.com</div>
        <a href="#" aria-label="LinkedIn">LinkedIn (placeholder)</a>
        <a href="#" aria-label="GitHub">GitHub (placeholder)</a>
        <a href="#" aria-label="Behance">Behance (placeholder)</a>
      </div>
    `
  }
};

const trees = [];
const interactionTargets = [];

addPortfolioTree("sobre", "Sobre", new THREE.Vector3(-18, 0, -12));
addPortfolioTree("projetos", "Projetos", new THREE.Vector3(0, 0, -22));
addPortfolioTree("contato", "Contato", new THREE.Vector3(18, 0, -10));

const raycaster = new THREE.Raycaster();
raycaster.far = 18;

const keys = {
  KeyW: false,
  KeyA: false,
  KeyS: false,
  KeyD: false
};

let activeTree = null;
let panelOpen = false;
let lastFrameTime = performance.now();

setHint("Clique para entrar • WASD para mover • Mouse para olhar");

enterButton.addEventListener("click", () => {
  controls.lock();
});

controls.addEventListener("lock", () => {
  enterButton.style.display = "none";
  if (!panelOpen) {
    setHint("Explore o mundo • Mire em uma árvore para interagir");
  }
});

controls.addEventListener("unlock", () => {
  if (!panelOpen) {
    enterButton.style.display = "inline-flex";
    setHint("Clique para voltar • WASD para mover • Mouse para olhar");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.code in keys) {
    keys[event.code] = true;
  }

  if (event.code === "KeyE") {
    event.preventDefault();
    if (activeTree && controls.isLocked && !panelOpen) {
      openSectionPanel(activeTree.sectionKey);
    }
  }

  if (event.code === "Escape" && panelOpen) {
    closePanel();
  }
});

document.addEventListener("keyup", (event) => {
  if (event.code in keys) {
    keys[event.code] = false;
  }
});

closePanelBtn.addEventListener("click", closePanel);
panel.addEventListener("click", (event) => {
  if (event.target === panel) {
    closePanel();
  }
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();

function createGround() {
  const geometry = new THREE.PlaneGeometry(145, 145, 32, 32);
  geometry.rotateX(-Math.PI / 2);

  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
    const height = Math.sin(x * 0.075) * 0.22 + Math.cos(z * 0.05) * 0.18;
    positions.setY(i, height);
  }
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: 0x405447,
    roughness: 0.92,
    metalness: 0.02,
    flatShading: true
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}

function createClouds(count) {
  const cloudEntries = [];

  for (let i = 0; i < count; i += 1) {
    const width = 8 + Math.random() * 8;
    const height = 3 + Math.random() * 2;
    const cloud = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshStandardMaterial({
        color: 0xe8f0f8,
        transparent: true,
        opacity: 0.58,
        depthWrite: false
      })
    );

    cloud.position.set((Math.random() - 0.5) * CLOUD_AREA, 22 + Math.random() * 12, (Math.random() - 0.5) * CLOUD_AREA);
    cloud.rotation.x = -Math.PI * 0.48;
    cloud.rotation.z = (Math.random() - 0.5) * 0.22;
    scene.add(cloud);

    cloudEntries.push({
      mesh: cloud,
      speed: 1.2 + Math.random() * 1.8
    });
  }

  return cloudEntries;
}

function addPortfolioTree(sectionKey, label, position) {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.5, 3.6, 6),
    new THREE.MeshStandardMaterial({ color: 0x4d3a30, roughness: 0.93, flatShading: true })
  );
  trunk.position.y = 1.8;
  trunk.castShadow = true;
  tree.add(trunk);

  const foliageMain = new THREE.Mesh(
    new THREE.ConeGeometry(2.25, 4.2, 7),
    new THREE.MeshStandardMaterial({ color: 0x516a57, roughness: 0.95, flatShading: true })
  );
  foliageMain.position.y = 4.8;
  foliageMain.castShadow = true;
  tree.add(foliageMain);

  const foliageTop = new THREE.Mesh(
    new THREE.ConeGeometry(1.7, 2.6, 7),
    new THREE.MeshStandardMaterial({ color: 0x5d7b65, roughness: 0.95, flatShading: true })
  );
  foliageTop.position.y = 6.5;
  foliageTop.castShadow = true;
  tree.add(foliageTop);

  const cardTexture = makeCardTexture(label);
  const card = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: cardTexture,
      transparent: true,
      depthWrite: false,
      color: 0xeaf2ff
    })
  );
  card.position.set(0, 8.2, 0);
  card.scale.set(5.8, 2.0, 1);
  tree.add(card);

  const trigger = new THREE.Mesh(
    new THREE.SphereGeometry(2.8, 8, 8),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  trigger.position.set(0, 5.1, 0);
  trigger.userData.treeRef = { sectionKey, label, card };
  tree.add(trigger);

  tree.position.copy(position);
  scene.add(tree);

  const treeData = {
    sectionKey,
    label,
    tree,
    card,
    trigger,
    baseCardScale: new THREE.Vector3(5.8, 2.0, 1),
    baseCardY: 8.2,
    hoverLerp: 0
  };

  trees.push(treeData);
  interactionTargets.push(trigger);
}

function makeCardTexture(label) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 176;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(11, 16, 21, 0.82)";
  roundRect(ctx, 12, 14, canvas.width - 24, canvas.height - 28, 22);
  ctx.fill();

  ctx.strokeStyle = "rgba(171, 214, 255, 0.78)";
  ctx.lineWidth = 4;
  roundRect(ctx, 12, 14, canvas.width - 24, canvas.height - 28, 22);
  ctx.stroke();

  ctx.fillStyle = "#eaf2ff";
  ctx.font = "600 54px Inter, Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label.toUpperCase(), canvas.width / 2, canvas.height / 2 + 4);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function openSectionPanel(sectionKey) {
  const content = portfolioSections[sectionKey];
  if (!content) {
    return;
  }

  panelTitle.textContent = content.title;
  panelBody.innerHTML = content.body;
  panel.classList.remove("hidden");
  panelOpen = true;
  controls.unlock();
  setHint("Painel aberto • Feche para continuar explorando");
  enterButton.style.display = "none";
}

function closePanel() {
  if (!panelOpen) {
    return;
  }

  panelOpen = false;
  panel.classList.add("hidden");
  setHint("Clique para entrar • WASD para mover • Mouse para olhar");
  enterButton.style.display = "inline-flex";
}

function setHint(text) {
  hudHint.textContent = text;
}

function updateMovement(deltaSeconds) {
  if (!controls.isLocked || panelOpen) {
    return;
  }

  const moveZ = Number(keys.KeyW) - Number(keys.KeyS);
  const moveX = Number(keys.KeyD) - Number(keys.KeyA);

  if (moveZ !== 0) {
    controls.moveForward(moveZ * MOVE_SPEED * deltaSeconds);
  }

  if (moveX !== 0) {
    controls.moveRight(moveX * MOVE_SPEED * deltaSeconds);
  }

  const player = controls.getObject().position;
  player.y = PLAYER_HEIGHT;
  player.x = THREE.MathUtils.clamp(player.x, -WORLD_HALF_SIZE, WORLD_HALF_SIZE);
  player.z = THREE.MathUtils.clamp(player.z, -WORLD_HALF_SIZE, WORLD_HALF_SIZE);
}

function updateTreeHover(deltaSeconds) {
  if (!controls.isLocked || panelOpen) {
    if (activeTree) {
      activeTree = null;
      setHint("Explore o mundo • Mire em uma árvore para interagir");
    }
    trees.forEach((treeData) => {
      treeData.hoverLerp = THREE.MathUtils.damp(treeData.hoverLerp, 0, 7, deltaSeconds);
      applyTreeCardAnimation(treeData, performance.now() * 0.001);
    });
    return;
  }

  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
  const intersections = raycaster.intersectObjects(interactionTargets, false);
  const hovered = intersections.length > 0 ? trees.find((tree) => tree.trigger === intersections[0].object) : null;

  if (hovered !== activeTree) {
    activeTree = hovered || null;
    if (activeTree) {
      setHint(`E para abrir: ${activeTree.label}`);
    } else {
      setHint("Explore o mundo • Mire em uma árvore para interagir");
    }
  }

  trees.forEach((treeData) => {
    const target = treeData === activeTree ? 1 : 0;
    treeData.hoverLerp = THREE.MathUtils.damp(treeData.hoverLerp, target, 8, deltaSeconds);
    applyTreeCardAnimation(treeData, performance.now() * 0.001);
  });
}

function applyTreeCardAnimation(treeData, timeSeconds) {
  const t = treeData.hoverLerp;
  const bounce = Math.sin(timeSeconds * 9) * 0.11 * t;
  const scaleBoost = 1 + t * 0.24;

  treeData.card.scale.set(
    treeData.baseCardScale.x * scaleBoost,
    treeData.baseCardScale.y * scaleBoost,
    1
  );
  treeData.card.position.y = treeData.baseCardY + bounce;
  treeData.card.material.opacity = 0.88 + t * 0.12;
  treeData.card.material.color.setHex(t > 0.05 ? 0xffffff : 0xeaf2ff);
}

function updateSkyAndSun(elapsedSeconds) {
  const phase = (elapsedSeconds % DAY_LENGTH_SECONDS) / DAY_LENGTH_SECONDS;
  const angle = phase * Math.PI * 2;

  const dayFactor = Math.max(0, Math.sin(angle));
  const twilightFactor = Math.max(0, Math.sin(angle + 0.38));

  const skyDay = new THREE.Color(0x7891a6);
  const skyNight = new THREE.Color(0x0a1320);
  scene.background.copy(skyNight).lerp(skyDay, dayFactor * 0.95 + twilightFactor * 0.15);
  scene.fog.color.copy(scene.background);

  const ambientStrength = 0.08 + dayFactor * 0.34 + twilightFactor * 0.12;
  ambientLight.intensity = ambientStrength;
  sunLight.intensity = 0.08 + dayFactor * 1.1;

  const radius = 82;
  sun.position.set(Math.cos(angle) * radius, Math.sin(angle) * 55 + 10, Math.sin(angle) * 20);
  sunLight.position.copy(sun.position);
  sun.material.opacity = 0.3 + dayFactor * 0.7;

  cloudData.forEach((cloudEntry) => {
    cloudEntry.mesh.position.x += cloudEntry.speed * 0.01;
    if (cloudEntry.mesh.position.x > CLOUD_AREA * 0.55) {
      cloudEntry.mesh.position.x = -CLOUD_AREA * 0.55;
    }
    cloudEntry.mesh.material.opacity = 0.18 + dayFactor * 0.4;
  });
}

function animate() {
  const now = performance.now();
  const elapsedSeconds = now * 0.001;
  const deltaSeconds = Math.min((now - lastFrameTime) / 1000, 0.1);
  lastFrameTime = now;

  updateMovement(deltaSeconds);
  updateTreeHover(deltaSeconds);
  updateSkyAndSun(elapsedSeconds);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}