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

  const CELL = 48;           // px per square
  const GAP  = 2;            // gap between squares
  const BORDER_ALPHA = 0.08; // subtle resting border
  const GLOW_RADIUS = 200;   // hover influence radius in px
  const SCALE_RADIUS = 180;  // scale influence radius
  const GLOW_COLOR = [41, 151, 255]; // accent blue RGB
  const FADE_SPEED = 0.06;   // how fast glow fades per frame
  const MAX_SCALE = 1.7;     // scale of square directly under mouse
  const MIN_SCALE = 1.2;     // scale at edge of influence

  let cols, rows, cells, scales; // cell brightness & scale arrays
  let mouseX = -9999, mouseY = -9999;
  let animId;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    cols = Math.ceil(canvas.width  / CELL) + 1;
    rows = Math.ceil(canvas.height / CELL) + 1;
    const len = cols * rows;
    if (!cells || cells.length !== len) {
      cells  = new Float32Array(len);
      scales = new Float32Array(len).fill(1);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const baseX = c * CELL;
        const baseY = r * CELL;
        const inner = CELL - GAP;

        // Calculate distance from mouse to cell center
        const cx = baseX + CELL / 2;
        const cy = baseY + CELL / 2;
        const dist = Math.hypot(mouseX - cx, mouseY - cy);

        // Target brightness based on proximity
        const target = dist < GLOW_RADIUS
          ? Math.pow(1 - dist / GLOW_RADIUS, 2)
          : 0;

        // Target scale: 1.7 at center, lerp down to 1.2 at edge, 1.0 outside
        let targetScale = 1;
        if (dist < SCALE_RADIUS) {
          const t = 1 - dist / SCALE_RADIUS;
          targetScale = 1 + (MAX_SCALE - 1) * t * t + (MIN_SCALE - 1) * (1 - t * t) * t;
        }

        // Smooth interpolation
        cells[idx]  += (target - cells[idx]) * (target > cells[idx] ? 0.22 : FADE_SPEED);
        scales[idx] += (targetScale - scales[idx]) * 0.18;

        const brightness = cells[idx];
        const scale = scales[idx];

        // Scaled square dimensions
        const sInner = inner * scale;
        const sx = cx - sInner / 2;
        const sy = cy - sInner / 2;

        // 3D volume offsets
        const volOff = (scale - 1) * 3;

        if (brightness > 0.01) {
          const bri = brightness;

          // --- Shadow / volume layer ---
          if (isDark) {
            // Dark: top-left light edge for volume
            ctx.fillStyle = `rgba(${GLOW_COLOR[0]}, ${GLOW_COLOR[1]}, ${GLOW_COLOR[2]}, ${bri * 0.06})`;
            ctx.fillRect(sx - volOff * 0.5, sy - volOff * 0.5, sInner + volOff, sInner + volOff);
          } else {
            // Light: drop shadow beneath for cube depth
            ctx.fillStyle = `rgba(0, 0, 0, ${0.06 + bri * 0.08})`;
            ctx.fillRect(sx + volOff * 0.8, sy + volOff * 0.8, sInner, sInner);
          }

          // --- Main fill ---
          if (isDark) {
            ctx.fillStyle = `rgba(${GLOW_COLOR[0]}, ${GLOW_COLOR[1]}, ${GLOW_COLOR[2]}, ${bri * 0.22})`;
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${0.7 + bri * 0.25})`;
          }
          ctx.fillRect(sx, sy, sInner, sInner);

          // --- Highlight edge (top-left for 3D) ---
          if (isDark) {
            ctx.fillStyle = `rgba(${GLOW_COLOR[0]}, ${GLOW_COLOR[1]}, ${GLOW_COLOR[2]}, ${bri * 0.12})`;
            ctx.fillRect(sx, sy, sInner, 1.5);
            ctx.fillRect(sx, sy, 1.5, sInner);
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${bri * 0.5})`;
            ctx.fillRect(sx, sy, sInner, 1.5);
            ctx.fillRect(sx, sy, 1.5, sInner);
          }

          // Glowing border (blue glow in both themes)
          ctx.strokeStyle = `rgba(${GLOW_COLOR[0]}, ${GLOW_COLOR[1]}, ${GLOW_COLOR[2]}, ${bri * 0.7})`;
          ctx.lineWidth = isDark ? 1 : 1.2;
          ctx.strokeRect(sx + 0.5, sy + 0.5, sInner - 1, sInner - 1);
        } else {
          // Resting state — theme-aware + subtle volume
          if (isDark) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${BORDER_ALPHA})`;
            ctx.lineWidth = 0.5;
          } else {
            // Light: white fill + subtle shadow for depth
            ctx.fillStyle = `rgba(0, 0, 0, 0.03)`;
            ctx.fillRect(sx + 1.5, sy + 1.5, sInner, sInner);
            ctx.fillStyle = `rgba(255, 255, 255, 0.65)`;
            ctx.fillRect(sx, sy, sInner, sInner);
            ctx.strokeStyle = `rgba(0, 0, 0, 0.10)`;
            ctx.lineWidth = 0.8;
          }
          ctx.strokeRect(sx + 0.5, sy + 0.5, sInner - 1, sInner - 1);
        }
      }
    }

    animId = requestAnimationFrame(draw);
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
    // Direct property-based approach — no CSS transition delay
    let currentTiltX = 0, currentTiltY = 0, currentScale = 1;
    let targetTiltX = 0, targetTiltY = 0, targetScale = 1;
    let ticking = false;

    function updateTransform() {
      // Instant lerp — very fast catch-up
      currentTiltX += (targetTiltX - currentTiltX) * 0.5;
      currentTiltY += (targetTiltY - currentTiltY) * 0.5;
      currentScale += (targetScale - currentScale) * 0.5;

      card.style.transform = `perspective(800px) rotateX(${currentTiltX}deg) rotateY(${currentTiltY}deg) scale3d(${currentScale}, ${currentScale}, ${currentScale})`;

      if (Math.abs(targetTiltX - currentTiltX) > 0.01 ||
          Math.abs(targetTiltY - currentTiltY) > 0.01 ||
          Math.abs(targetScale - currentScale) > 0.001) {
        requestAnimationFrame(updateTransform);
      } else {
        ticking = false;
      }
    }

    function startTicking() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateTransform);
      }
    }

    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const nx = (x - centerX) / centerX;
      const ny = (y - centerY) / centerY;

      targetTiltX = ny * 14;
      targetTiltY = nx * -14;
      targetScale = 1.03;

      startTicking();

      // Shine highlight
      const shine = card.querySelector(".bento-shine");
      if (shine) {
        shine.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(41,151,255,0.15) 0%, rgba(255,255,255,0.04) 40%, transparent 70%)`;
      }
    });

    card.addEventListener("mouseleave", () => {
      targetTiltX = 0;
      targetTiltY = 0;
      targetScale = 1;
      startTicking();

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
