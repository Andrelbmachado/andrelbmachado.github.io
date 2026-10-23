/* Casa Julieta — Scripts */

// ---- Always start at top on reload ----
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
window.addEventListener('load', () => {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
});
window.addEventListener('beforeunload', () => {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
});

// ---- Intro animation (GSAP) — hi-res with crossfade ----
(function () {
  if (typeof gsap === 'undefined') return;

  var brand    = document.querySelector('.brand');
  var navLine  = document.getElementById('navLine');
  var mainNav  = document.querySelector('.main-nav');
  var navLinks = mainNav ? Array.from(mainNav.querySelectorAll('a')) : [];
  var heroCta  = document.querySelector('.hero-cta');

  if (!brand || !navLine || !mainNav) return;

  document.body.style.overflow = 'hidden';

  function run() {
    /* ---- measure brand's final position ---- */
    var brandRect = brand.getBoundingClientRect();
    var brandCx   = brandRect.left + brandRect.width / 2;
    var brandCy   = brandRect.top  + brandRect.height / 2;
    var brandW    = brandRect.width;
    var screenCx  = window.innerWidth / 2;
    var screenCy  = window.innerHeight / 2;

    /* ---- create hi-res clone (large native font-size) ---- */
    var hires = document.createElement('span');
    hires.textContent = 'Casa Julieta';
    hires.style.cssText =
      'position:fixed;z-index:10001;top:50%;left:50%;' +
      'transform:translate(-50%,-50%);' +
      'font-family:"Cormorant Garamond",Georgia,serif;' +
      'font-size:clamp(5rem,14vw,12rem);font-weight:700;' +
      'line-height:1.2;letter-spacing:0.06em;white-space:nowrap;' +
      'background:linear-gradient(105deg,#b8920a 0%,#DBAD00 25%,#fff5c0 40%,#DBAD00 55%,#b8920a 80%,#DBAD00 100%);' +
      'background-size:250% 100%;' +
      '-webkit-background-clip:text;background-clip:text;' +
      '-webkit-text-fill-color:transparent;' +
      'animation:goldShimmer 4s ease-in-out infinite;' +
      'opacity:0;pointer-events:none;';
    document.body.appendChild(hires);

    /* measure hi-res at scale=1 to compute exact final scale ratio */
    var hiresRect = hires.getBoundingClientRect();
    var endScale  = brandW / hiresRect.width;

    /* ---- nav offsets ---- */
    var navLineRect = navLine.getBoundingClientRect();
    var navCenterX  = navLineRect.left + navLineRect.width / 2;
    var offsets = navLinks.map(function (link) {
      var r = link.getBoundingClientRect();
      return navCenterX - (r.left + r.width / 2);
    });

    /* ---- initial states ---- */
    gsap.set(brand, { opacity: 0 });
    gsap.set(navLine, { scaleX: 0 });
    navLinks.forEach(function (link, i) {
      gsap.set(link, { x: offsets[i], opacity: 0 });
    });
    if (heroCta) gsap.set(heroCta, { opacity: 0 });

    /* ---- timeline ---- */
    var tl = gsap.timeline({
      onComplete: function () {
        document.body.style.overflow = '';
      }
    });

    /* 0–0.3s: fade in hi-res at center */
    tl.to(hires, { opacity: 1, duration: 0.3, ease: 'power1.in' }, 0);

    /* 0–2s: hi-res grows from small to full size */
    tl.fromTo(hires,
      { scale: 0.3, css: { transform: 'translate(-50%,-50%) scale(0.3)' } },
      { css: { transform: 'translate(-50%,-50%) scale(1)' }, duration: 2, ease: 'power2.out' },
      0
    );

    /* 2–3s: hi-res shrinks & flies to brand position */
    tl.to(hires, {
      css: {
        top: brandCy + 'px',
        left: brandCx + 'px',
        transform: 'translate(-50%,-50%) scale(' + endScale + ')'
      },
      duration: 1,
      ease: 'power3.inOut'
    }, 2);

    /* 3–3.3s: crossfade — hi-res out, brand in */
    tl.to(hires, { opacity: 0, duration: 0.3, ease: 'none',
      onComplete: function () { hires.remove(); }
    }, 3);
    tl.to(brand, { opacity: 1, duration: 0.3, ease: 'none' }, 3);

    /* 2–3s: gold line grows from center */
    tl.to(navLine, { scaleX: 1, duration: 1, ease: 'power2.inOut' }, 2);

    /* 2–3s: nav links spread from center */
    tl.to(navLinks, { x: 0, opacity: 1, duration: 1, ease: 'power2.out', stagger: 0.05 }, 2);

    /* 3.2–3.7s: hero CTA fades in */
    if (heroCta) tl.to(heroCta, { opacity: 1, duration: 0.5, ease: 'power1.out' }, 3.2);
  }

  /* wait for fonts so measurements are accurate */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      requestAnimationFrame(run);
    });
  } else {
    window.addEventListener('load', run);
  }
})();

// ---- Year ----
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---- Header scroll background (disabled — header is static) ----

// ---- Scroll fade-up ----
const fadeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        fadeObserver.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -30px 0px" }
);
document.querySelectorAll(".fade-up").forEach((el) => fadeObserver.observe(el));

// ---- Typewriter effect for "about" text ----
(function initTypewriter() {
  const container = document.getElementById('aboutTypewriter');
  if (!container) return;

  const paragraphs = Array.from(container.querySelectorAll('p'));
  if (!paragraphs.length) return;

  // Store original text and clear paragraphs
  const texts = paragraphs.map((p) => p.textContent);
  paragraphs.forEach((p) => {
    p.textContent = '';
    p.classList.add('typewriter-line');
  });

  let started = false;

  const twObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting && !started) {
        started = true;
        twObserver.disconnect();
        runTypewriter(paragraphs, texts, 0);
      }
    });
  }, { threshold: 0.3 });

  twObserver.observe(container);

  function runTypewriter(els, txts, idx) {
    if (idx >= els.length) return;

    const el = els[idx];
    const text = txts[idx];
    const charCount = text.length;
    // ~80 chars per second (fast typewriter)
    const duration = charCount / 80;

    el.textContent = text;
    el.style.setProperty('--tw-steps', charCount);
    el.style.setProperty('--tw-duration', duration + 's');
    el.classList.add('typing');

    // After animation ends, mark done and start next
    const timeMs = duration * 1000 + 200;
    setTimeout(() => {
      el.classList.remove('typing');
      el.classList.add('done');
      runTypewriter(els, txts, idx + 1);
    }, timeMs);
  }
})();

// ---- Mobile menu ----
const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".main-nav");
if (toggle && nav) {
  toggle.addEventListener("click", () => {
    nav.classList.toggle("open");
  });
  nav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => nav.classList.remove("open"))
  );
}

// ---- Page transitions ----
document.querySelectorAll('a[href$=".html"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const href = a.getAttribute("href");
    if (!href || href.startsWith("http")) return;
    e.preventDefault();
    document.body.style.transition = "opacity 0.25s ease";
    document.body.style.opacity = "0";
    setTimeout(() => (window.location.href = href), 260);
  });
});

// =====================================================
// MAGNETIC CURSOR — btn-gold buttons
// =====================================================
(function initMagneticBtn() {
  if ('ontouchstart' in window) return;

  // Create circle element
  const circle = document.createElement('div');
  circle.className = 'magnetic-circle';
  circle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#003912" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>';
  document.body.appendChild(circle);

  let mx = 0, my = 0;
  let cx = 0, cy = 0;
  let active = false;
  let currentBtn = null;
  const EASE = 0.18;
  const MAGNETIC_STRENGTH = 0.35; // how strongly it pulls back (0-1)

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
  });

  function tick() {
    if (active && currentBtn) {
      const rect = currentBtn.getBoundingClientRect();
      const btnCx = rect.left + rect.width / 2;
      const btnCy = rect.top + rect.height / 2;

      // Magnetic: blend mouse pos toward button center
      const targetX = mx + (btnCx - mx) * MAGNETIC_STRENGTH;
      const targetY = my + (btnCy - my) * MAGNETIC_STRENGTH;

      cx += (targetX - cx) * EASE;
      cy += (targetY - cy) * EASE;
    } else {
      cx += (mx - cx) * 0.3;
      cy += (my - cy) * 0.3;
    }

    circle.style.left = cx + 'px';
    circle.style.top = cy + 'px';
    requestAnimationFrame(tick);
  }
  tick();

  document.querySelectorAll('.btn-gold').forEach((btn) => {
    btn.addEventListener('mouseenter', () => {
      active = true;
      currentBtn = btn;
      circle.classList.add('active');
      document.body.style.cursor = 'none';
    });

    btn.addEventListener('mouseleave', () => {
      active = false;
      currentBtn = null;
      circle.classList.remove('active');
      document.body.style.cursor = '';
    });

    // Click the circle -> navigate
    btn.style.pointerEvents = 'auto';
  });
})();

// =====================================================
// HERO TITLE SPOTLIGHT — "lantern" follows the cursor
// =====================================================
(function initSpotlight() {
  const title = document.getElementById("heroTitle");
  if (!title) return;

  // Set data-text for the ::after pseudo element
  title.setAttribute("data-text", title.textContent);

  title.addEventListener("mousemove", (e) => {
    const rect = title.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    title.style.setProperty("--spotlight-x", x + "px");
    title.style.setProperty("--spotlight-y", y + "px");
    title.style.setProperty("--spotlight-opacity", "1");
  });

  title.addEventListener("mouseleave", () => {
    title.style.setProperty("--spotlight-opacity", "0");
  });
})();

// =====================================================
// BAR SLIDESHOW — auto crossfade with Ken Burns
// =====================================================
(function initBarSlideshow() {
  const slides = document.querySelectorAll('.bar-slide');
  if (slides.length < 2) return;

  let current = 0;
  const interval = 5000; // 5s per slide

  function next() {
    slides[current].classList.remove('bar-slide--active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('bar-slide--active');
  }

  setInterval(next, interval);
})();
