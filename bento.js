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
  const GLOW_RADIUS = 160;   // hover influence radius in px
  const GLOW_COLOR = [41, 151, 255]; // accent blue RGB
  const FADE_SPEED = 0.04;   // how fast glow fades per frame

  let cols, rows, cells; // cell brightness array
  let mouseX = -9999, mouseY = -9999;
  let animId;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    cols = Math.ceil(canvas.width  / CELL) + 1;
    rows = Math.ceil(canvas.height / CELL) + 1;
    if (!cells || cells.length !== cols * rows) {
      cells = new Float32Array(cols * rows);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const x = c * CELL;
        const y = r * CELL;
        const inner = CELL - GAP;

        // Calculate distance from mouse to cell center
        const cx = x + CELL / 2;
        const cy = y + CELL / 2;
        const dist = Math.hypot(mouseX - cx, mouseY - cy);

        // Target brightness based on proximity
        const target = dist < GLOW_RADIUS
          ? Math.pow(1 - dist / GLOW_RADIUS, 2)
          : 0;

        // Smooth interpolation
        cells[idx] += (target - cells[idx]) * (target > cells[idx] ? 0.18 : FADE_SPEED);

        const brightness = cells[idx];

        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

        // Fill with glow when near mouse
        if (brightness > 0.01) {
          const bri = brightness;
          if (isDark) {
            ctx.fillStyle = `rgba(${GLOW_COLOR[0]}, ${GLOW_COLOR[1]}, ${GLOW_COLOR[2]}, ${bri * 0.18})`;
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + bri * 0.3})`;
          }
          ctx.fillRect(x + GAP / 2, y + GAP / 2, inner, inner);

          // Glowing border (blue glow in both themes)
          ctx.strokeStyle = `rgba(${GLOW_COLOR[0]}, ${GLOW_COLOR[1]}, ${GLOW_COLOR[2]}, ${bri * 0.7})`;
          ctx.lineWidth = isDark ? 1 : 1.2;
          ctx.strokeRect(x + GAP / 2 + 0.5, y + GAP / 2 + 0.5, inner - 1, inner - 1);
        } else {
          // Resting state — theme-aware border
          const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
          if (isDark) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${BORDER_ALPHA})`;
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, 0.6)`;
            ctx.fillRect(x + GAP / 2, y + GAP / 2, inner, inner);
            ctx.strokeStyle = `rgba(0, 0, 0, 0.10)`;
          }
          ctx.lineWidth = isDark ? 0.5 : 0.8;
          ctx.strokeRect(x + GAP / 2 + 0.5, y + GAP / 2 + 0.5, inner - 1, inner - 1);
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

  const TRAIL_LENGTH = 30;
  const trail = [];
  let mouseX = 0, mouseY = 0;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Add current mouse position
    trail.push({ x: mouseX, y: mouseY });
    if (trail.length > TRAIL_LENGTH) trail.shift();

    if (trail.length < 2) {
      requestAnimationFrame(draw);
      return;
    }

    // Draw neon trail with gradient
    for (let i = 1; i < trail.length; i++) {
      const t = i / trail.length; // 0→1 progress
      const alpha = t * 0.8;
      const width = t * 3 + 0.5;

      ctx.beginPath();
      ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
      ctx.lineTo(trail[i].x, trail[i].y);
      ctx.strokeStyle = `rgba(41, 151, 255, ${alpha})`;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.stroke();

      // Outer glow
      if (t > 0.3) {
        ctx.beginPath();
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
        ctx.lineTo(trail[i].x, trail[i].y);
        ctx.strokeStyle = `rgba(41, 151, 255, ${alpha * 0.3})`;
        ctx.lineWidth = width + 6;
        ctx.lineCap = "round";
        ctx.stroke();
      }
    }

    // Subtle glow at trail tip (no dot)
    const last = trail[trail.length - 1];
    const grad = ctx.createRadialGradient(last.x, last.y, 0, last.x, last.y, 14);
    grad.addColorStop(0, "rgba(41, 151, 255, 0.25)");
    grad.addColorStop(1, "rgba(41, 151, 255, 0)");
    ctx.beginPath();
    ctx.arc(last.x, last.y, 14, 0, Math.PI * 2);
    ctx.fillStyle = grad;
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
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;   // mouse X relative to card
      const y = e.clientY - rect.top;    // mouse Y relative to card
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Normalize -1 to 1
      const nx = (x - centerX) / centerX;
      const ny = (y - centerY) / centerY;

      // Tilt: card leans toward mouse (pulled out of screen)
      const tiltX = ny * 14;   // reversed — edge near mouse comes forward
      const tiltY = nx * -14;  // reversed — edge near mouse comes forward

      card.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.03, 1.03, 1.03)`;

      // Move shine/highlight effect
      const shine = card.querySelector(".bento-shine");
      if (shine) {
        shine.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(41,151,255,0.12) 0%, transparent 60%)`;
      }
    });

    card.addEventListener("mouseleave", () => {
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
