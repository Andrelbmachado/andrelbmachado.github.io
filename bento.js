/* ─────────────────────────────────────────────
   André Machado — Portfolio
   Bento interactions: grid bg, neon cursor, card tilt
   ───────────────────────────────────────────── */

/* ══════════════════════════════════════════════
   1. ANIMATED GRID BACKGROUND
   ══════════════════════════════════════════════ */
(function initGridBackground() {
  const canvas = document.getElementById("gridBg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  /* ── Isometric cube config ── */
  const CELL   = 48;          // grid spacing
  const CUBE_W = 40;          // base cube top-face width
  const CUBE_H = 20;          // base cube top-face height (iso)
  const DEPTH  = 14;          // resting cube side-face depth
  const HOVER_RADIUS = 200;   // mouse influence radius
  const MAX_RISE = 22;        // extra depth (rise) for cube under mouse
  const FADE_SPEED = 0.07;
  const GLOW_COLOR = [41, 151, 255];

  let cols, rows, rise;
  let mouseX = -9999, mouseY = -9999;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    cols = Math.ceil(canvas.width  / CELL) + 2;
    rows = Math.ceil(canvas.height / CELL) + 2;
    const len = cols * rows;
    if (!rise || rise.length !== len) rise = new Float32Array(len);
  }

  /* Draw one isometric cube at grid position (px,py) with given rise */
  function drawCube(px, py, r, isDark, brightness) {
    const hw = CUBE_W / 2;                // half width
    const hh = CUBE_H / 2;                // half height of top rhombus
    const d  = DEPTH + r;                 // total depth including rise

    // Top face corners (isometric diamond)
    const top = [
      [px,        py - hh],     // top
      [px + hw,   py],          // right
      [px,        py + hh],     // bottom
      [px - hw,   py],          // left
    ];

    // ── Top face ── (lightest — lit from above)
    ctx.beginPath();
    ctx.moveTo(top[0][0], top[0][1]);
    for (let i = 1; i < 4; i++) ctx.lineTo(top[i][0], top[i][1]);
    ctx.closePath();

    if (isDark) {
      const base = brightness > 0.01 ? 18 + brightness * 14 : 16;
      ctx.fillStyle = `rgb(${base}, ${base}, ${base + (brightness > 0.01 ? brightness * 8 : 0)})`;
    } else {
      const base = brightness > 0.01 ? 240 + brightness * 12 : 238;
      ctx.fillStyle = `rgb(${base}, ${base}, ${base})`;
    }
    ctx.fill();

    // Subtle top highlight line
    if (brightness > 0.05 && isDark) {
      ctx.strokeStyle = `rgba(${GLOW_COLOR[0]}, ${GLOW_COLOR[1]}, ${GLOW_COLOR[2]}, ${brightness * 0.35})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    } else {
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // ── Right face ── (medium shade)
    ctx.beginPath();
    ctx.moveTo(top[1][0], top[1][1]);       // right corner
    ctx.lineTo(top[2][0], top[2][1]);       // bottom corner
    ctx.lineTo(top[2][0], top[2][1] + d);   // bottom + depth
    ctx.lineTo(top[1][0], top[1][1] + d);   // right + depth
    ctx.closePath();

    if (isDark) {
      const base = brightness > 0.01 ? 10 + brightness * 8 : 9;
      ctx.fillStyle = `rgb(${base}, ${base}, ${base})`;
    } else {
      const base = brightness > 0.01 ? 215 + brightness * 10 : 212;
      ctx.fillStyle = `rgb(${base}, ${base}, ${base})`;
    }
    ctx.fill();

    if (brightness > 0.05 && isDark) {
      ctx.strokeStyle = `rgba(${GLOW_COLOR[0]}, ${GLOW_COLOR[1]}, ${GLOW_COLOR[2]}, ${brightness * 0.2})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // ── Left face ── (darkest)
    ctx.beginPath();
    ctx.moveTo(top[3][0], top[3][1]);       // left corner
    ctx.lineTo(top[2][0], top[2][1]);       // bottom corner
    ctx.lineTo(top[2][0], top[2][1] + d);   // bottom + depth
    ctx.lineTo(top[3][0], top[3][1] + d);   // left + depth
    ctx.closePath();

    if (isDark) {
      const base = brightness > 0.01 ? 6 + brightness * 5 : 5;
      ctx.fillStyle = `rgb(${base}, ${base}, ${base})`;
    } else {
      const base = brightness > 0.01 ? 200 + brightness * 10 : 198;
      ctx.fillStyle = `rgb(${base}, ${base}, ${base})`;
    }
    ctx.fill();

    if (brightness > 0.05 && isDark) {
      ctx.strokeStyle = `rgba(${GLOW_COLOR[0]}, ${GLOW_COLOR[1]}, ${GLOW_COLOR[2]}, ${brightness * 0.15})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // ── Blue glow halo when bright (dark mode only) ──
    if (brightness > 0.08 && isDark) {
      ctx.shadowColor = `rgba(${GLOW_COLOR[0]}, ${GLOW_COLOR[1]}, ${GLOW_COLOR[2]}, ${brightness * 0.5})`;
      ctx.shadowBlur = brightness * 12;
      ctx.beginPath();
      ctx.moveTo(top[0][0], top[0][1]);
      for (let i = 1; i < 4; i++) ctx.lineTo(top[i][0], top[i][1]);
      ctx.closePath();
      ctx.strokeStyle = `rgba(${GLOW_COLOR[0]}, ${GLOW_COLOR[1]}, ${GLOW_COLOR[2]}, ${brightness * 0.4})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

    // Draw back-to-front (top rows first) for correct overlap
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const px = c * CELL + (r % 2 === 0 ? 0 : CELL / 2);  // offset alternate rows
        const py = r * (CUBE_H * 0.75 + 4);

        const dist = Math.hypot(mouseX - px, mouseY - py);

        // Target rise
        let targetRise = 0;
        if (dist < HOVER_RADIUS) {
          const t = 1 - dist / HOVER_RADIUS;
          targetRise = MAX_RISE * t * t;
        }

        // Smooth interpolation
        rise[idx] += (targetRise - rise[idx]) * (targetRise > rise[idx] ? 0.25 : FADE_SPEED);

        const currentRise = rise[idx];
        const brightness = currentRise / MAX_RISE;

        drawCube(px, py - currentRise, currentRise, isDark, brightness);
      }
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  document.addEventListener("mouseleave", () => {
    mouseX = -9999;
    mouseY = -9999;
  });

  resize();
  draw();
})();


/* ══════════════════════════════════════════════
   2. NEON CURSOR TRAIL
   ══════════════════════════════════════════════ */
(function initNeonCursor() {
  const canvas = document.getElementById("neonTrail");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const TRAIL_LENGTH = 50;
  const trail = [];
  let mouseX = -100, mouseY = -100;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function getSmoothedPoint(i, points) {
    // Catmull-Rom-like smoothing via averaging neighbors
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[Math.min(points.length - 1, i + 1)];
    return {
      x: (p0.x + p1.x * 4 + p2.x) / 6,
      y: (p0.y + p1.y * 4 + p2.y) / 6
    };
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Add current mouse position
    trail.push({ x: mouseX, y: mouseY });
    if (trail.length > TRAIL_LENGTH) trail.shift();

    if (trail.length < 3) {
      requestAnimationFrame(draw);
      return;
    }

    // Build smooth path and draw as a single tapered comet stroke
    // Draw outer glow layer first (wider, lower alpha)
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // --- Outer glow ---
    for (let i = 2; i < trail.length; i++) {
      const t = i / trail.length;
      if (t < 0.2) continue;
      const p0 = getSmoothedPoint(i - 1, trail);
      const p1 = getSmoothedPoint(i, trail);
      const alpha = t * t * 0.2;
      const width = t * 10;

      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.strokeStyle = `rgba(41, 151, 255, ${alpha})`;
      ctx.lineWidth = width;
      ctx.stroke();
    }

    // --- Core trail (smooth comet) ---
    for (let i = 2; i < trail.length; i++) {
      const t = i / trail.length;
      const p0 = getSmoothedPoint(i - 1, trail);
      const p1 = getSmoothedPoint(i, trail);
      const alpha = Math.pow(t, 1.5) * 0.85;
      const width = Math.pow(t, 1.8) * 3.5 + 0.3;

      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.strokeStyle = `rgba(41, 151, 255, ${alpha})`;
      ctx.lineWidth = width;
      ctx.stroke();
    }

    // --- Bright tip glow ---
    const last = trail[trail.length - 1];
    const tipGrad = ctx.createRadialGradient(last.x, last.y, 0, last.x, last.y, 10);
    tipGrad.addColorStop(0, "rgba(120, 190, 255, 0.35)");
    tipGrad.addColorStop(0.5, "rgba(41, 151, 255, 0.12)");
    tipGrad.addColorStop(1, "rgba(41, 151, 255, 0)");
    ctx.beginPath();
    ctx.arc(last.x, last.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = tipGrad;
    ctx.fill();

    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  draw();
})();


/* ══════════════════════════════════════════════
   3. BENTO BOX 3D TILT ON HOVER
   ══════════════════════════════════════════════ */
(function initBentoTilt() {
  const cards = document.querySelectorAll(".bento-card");

  cards.forEach((card) => {
    let hovering = false;

    card.addEventListener("mouseenter", () => { hovering = true; });

    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const nx = (x - centerX) / centerX;
      const ny = (y - centerY) / centerY;

      // Apply transform IMMEDIATELY — no lerp, no rAF delay
      const tiltX = ny * 14;
      const tiltY = nx * -14;
      card.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.03, 1.03, 1.03)`;

      // Shine highlight
      const shine = card.querySelector(".bento-shine");
      if (shine) {
        shine.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(41,151,255,0.15) 0%, rgba(255,255,255,0.04) 40%, transparent 70%)`;
      }
    });

    card.addEventListener("mouseleave", () => {
      hovering = false;
      card.style.transform = "perspective(800px) rotateX(0) rotateY(0) scale3d(1,1,1)";
      const shine = card.querySelector(".bento-shine");
      if (shine) {
        shine.style.background = "transparent";
      }
    });
  });
})();


/* ══════════════════════════════════════════════
   4. REVEAL OBSERVER
   ══════════════════════════════════════════════ */
(function initReveal() {
  const reveals = document.querySelectorAll(".reveal");
  const obs = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add("visible");
    }),
    { threshold: 0.15 }
  );
  reveals.forEach((el) => obs.observe(el));
})();


/* ══════════════════════════════════════════════
   5. SMOOTH BENTO CARD ANCHORS
   ══════════════════════════════════════════════ */
(function initBentoLinks() {
  document.querySelectorAll(".bento-card[data-href]").forEach((card) => {
    card.addEventListener("click", () => {
      const target = document.querySelector(card.dataset.href);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
})();
