/* ─────────────────────────────────────────────
   André Machado — Portfolio
   Bento interactions: grid bg, neon cursor, card tilt
   ───────────────────────────────────────────── */

/* ══════════════════════════════════════════════
   1. ANIMATED GRID BACKGROUND — PS2-style towers
   ══════════════════════════════════════════════ */
(function initGridBackground() {
  const canvas = document.getElementById("gridBg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  /* ── Tower / cube config ── */
  const CELL         = 64;      // grid spacing
  const CUBE         = 58;      // top-face size (stays constant — no scale)
  const DEPTH        = 5;       // resting side-face depth
  const HOVER_RADIUS = 240;     // mouse influence radius
  const MAX_RISE     = 60;      // max extra extrusion on hover (tall towers!)
  const FADE_SPEED   = 0.08;
  const RISE_SPEED   = 0.22;    // how fast cubes grow on approach
  const GLOW_COLOR   = [41, 151, 255];

  /* Projection angles for the "3/4 top-down" look
     offX = horizontal spread of side faces
     offY = vertical   spread of side faces          */
  const PROJ_X = 0.22;   // moderate horizontal
  const PROJ_Y = 0.55;   // strong vertical → shows height

  let cols, rows, rise, drawOrder;
  let mouseX = -9999, mouseY = -9999;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    cols = Math.ceil(canvas.width  / CELL) + 2;
    rows = Math.ceil(canvas.height / CELL) + 2;
    const len = cols * rows;
    if (!rise || rise.length !== len) rise = new Float32Array(len);
    drawOrder = new Array(len);
    for (let i = 0; i < len; i++) drawOrder[i] = i;
  }

  /* ── Draw one tower at grid pos (x,y) ── */
  function drawCube(x, y, riseVal, isDark, brightness) {
    const d   = DEPTH + riseVal;           // total visible extrusion
    const s   = CUBE;                      // face size (constant)
    const oX  = d * PROJ_X;               // horizontal projection
    const oY  = d * PROJ_Y;               // vertical projection

    // Top-face is shifted UP proportionally to rise
    const liftY = riseVal * 0.35;
    const tx = x;
    const ty = y - liftY;

    /* ── Right side face ── */
    if (d > 0.5) {
      ctx.beginPath();
      ctx.moveTo(tx + s,       ty);
      ctx.lineTo(tx + s + oX,  ty + oY);
      ctx.lineTo(tx + s + oX,  ty + s + oY);
      ctx.lineTo(tx + s,       ty + s);
      ctx.closePath();
      if (isDark) {
        ctx.fillStyle = brightness > 0.01
          ? `rgb(${Math.round(5 + brightness * 12)}, ${Math.round(5 + brightness * 12)}, ${Math.round(5 + brightness * 18)})`
          : 'rgb(3, 3, 3)';
      } else {
        ctx.fillStyle = brightness > 0.01
          ? `rgba(0, 0, 0, ${(0.06 + brightness * 0.08).toFixed(3)})`
          : 'rgba(0, 0, 0, 0.04)';
      }
      ctx.fill();

      /* ── Bottom side face ── */
      ctx.beginPath();
      ctx.moveTo(tx,           ty + s);
      ctx.lineTo(tx + s,       ty + s);
      ctx.lineTo(tx + s + oX,  ty + s + oY);
      ctx.lineTo(tx + oX,      ty + s + oY);
      ctx.closePath();
      if (isDark) {
        ctx.fillStyle = brightness > 0.01
          ? `rgb(${Math.round(2 + brightness * 8)}, ${Math.round(2 + brightness * 8)}, ${Math.round(2 + brightness * 14)})`
          : 'rgb(1, 1, 1)';
      } else {
        ctx.fillStyle = brightness > 0.01
          ? `rgba(0, 0, 0, ${(0.08 + brightness * 0.09).toFixed(3)})`
          : 'rgba(0, 0, 0, 0.055)';
      }
      ctx.fill();
    }

    /* ── Top face (the lit square) ── */
    ctx.beginPath();
    ctx.rect(tx, ty, s, s);

    if (isDark) {
      if (brightness > 0.01) {
        const base = 14 + brightness * 20;
        ctx.fillStyle = `rgb(${Math.round(base)}, ${Math.round(base)}, ${Math.round(Math.min(255, base + brightness * 14))})`;
      } else {
        ctx.fillStyle = 'rgb(10, 10, 10)';
      }
    } else {
      if (brightness > 0.01) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.9 + brightness * 0.1})`;
      } else {
        ctx.fillStyle = 'rgba(248, 248, 250, 0.85)';
      }
    }
    ctx.fill();

    /* ── Edge lines for definition ── */
    if (isDark) {
      ctx.strokeStyle = brightness > 0.05
        ? `rgba(${GLOW_COLOR[0]}, ${GLOW_COLOR[1]}, ${GLOW_COLOR[2]}, ${(brightness * 0.35).toFixed(3)})`
        : 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = brightness > 0.05 ? 0.9 : 0.4;
    } else {
      ctx.strokeStyle = brightness > 0.05
        ? `rgba(${GLOW_COLOR[0]}, ${GLOW_COLOR[1]}, ${GLOW_COLOR[2]}, ${(0.15 + brightness * 0.3).toFixed(3)})`
        : 'rgba(0, 0, 0, 0.04)';
      ctx.lineWidth = brightness > 0.05 ? 0.8 : 0.4;
    }
    ctx.stroke();

    /* ── Inset shadow (light mode resting) ── */
    if (!isDark && brightness <= 0.01) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.025)';
      ctx.fillRect(tx, ty, 1.5, s);
      ctx.fillRect(tx, ty, s, 1.5);
    }

    /* ── Glow halo on hover ── */
    if (brightness > 0.08) {
      ctx.shadowColor = `rgba(${GLOW_COLOR[0]}, ${GLOW_COLOR[1]}, ${GLOW_COLOR[2]}, ${(brightness * (isDark ? 0.55 : 0.35)).toFixed(3)})`;
      ctx.shadowBlur = brightness * (isDark ? 16 : 10);
      ctx.beginPath();
      ctx.rect(tx, ty, s, s);
      ctx.strokeStyle = `rgba(${GLOW_COLOR[0]}, ${GLOW_COLOR[1]}, ${GLOW_COLOR[2]}, ${(brightness * (isDark ? 0.45 : 0.3)).toFixed(3)})`;
      ctx.lineWidth = isDark ? 1.2 : 0.8;
      ctx.stroke();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }
  }

  /* ── Main loop ── */
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const count = cols * rows;

    /* 1. Update rise for every cube */
    for (let i = 0; i < count; i++) {
      const c  = i % cols;
      const r  = (i - c) / cols;
      const px = c * CELL;
      const py = r * CELL;
      const dist = Math.hypot(mouseX - (px + CUBE / 2), mouseY - (py + CUBE / 2));

      let target = 0;
      if (dist < HOVER_RADIUS) {
        const t = 1 - dist / HOVER_RADIUS;
        target = MAX_RISE * t * t;
      }
      rise[i] += (target - rise[i]) * (target > rise[i] ? RISE_SPEED : FADE_SPEED);
    }

    /* 2. Sort draw order: shortest towers first → tallest on top
          Secondary: back-to-front (lower row index = further back) */
    for (let i = 0; i < count; i++) drawOrder[i] = i;
    drawOrder.length = count;
    drawOrder.sort((a, b) => {
      const diff = rise[a] - rise[b];
      if (diff > 0.5)  return  1;
      if (diff < -0.5) return -1;
      // Same height → back rows first
      const ra = (a / cols) | 0, rb = (b / cols) | 0;
      if (ra !== rb) return ra - rb;
      return (a % cols) - (b % cols);
    });

    /* 3. Draw in sorted order */
    for (let i = 0; i < count; i++) {
      const idx = drawOrder[i];
      const c   = idx % cols;
      const r   = (idx - c) / cols;
      const px  = c * CELL;
      const py  = r * CELL;
      const cur = rise[idx];
      const bri = cur / MAX_RISE;
      drawCube(px, py, cur, isDark, bri);
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
    card.addEventListener("mouseenter", () => {
      // Disable CSS transition so JS transform is instant
      card.style.transition = 'box-shadow 0.3s, border-color 0.3s, background 0.4s';
    });

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
      // Re-enable CSS transition for smooth return
      card.style.transition = 'transform 0.22s ease-out, box-shadow 0.3s, border-color 0.3s, background 0.4s';
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
