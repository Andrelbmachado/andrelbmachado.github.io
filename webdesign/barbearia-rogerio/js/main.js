/* ========================================
   BARBEARIA ROGER — Main JavaScript
   ======================================== */

(function () {
  'use strict';

  // ===============================
  // 0. Ambient background particles
  // ===============================
  const particleCanvas = document.getElementById('particleCanvas');
  const particleCtx = particleCanvas ? particleCanvas.getContext('2d') : null;
  let particleWidth = 0;
  let particleHeight = 0;
  let particles = [];

  class Particle {
    constructor() {
      this.colors = ['30, 90, 168', '245, 247, 250', '141, 151, 166'];
      this.reset();
    }

    reset() {
      this.x = Math.random() * particleWidth;
      this.y = Math.random() * particleHeight;
      this.size = Math.random() * 1.5 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.speedY = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.4 + 0.1;
      this.color = this.colors[Math.floor(Math.random() * this.colors.length)];
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      if (
        this.x < 0 ||
        this.x > particleWidth ||
        this.y < 0 ||
        this.y > particleHeight
      ) {
        this.reset();
      }
    }

    draw() {
      particleCtx.beginPath();
      particleCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      particleCtx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
      particleCtx.fill();
    }
  }

  function resizeParticles() {
    if (!particleCanvas || !particleCtx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    particleWidth = window.innerWidth;
    particleHeight = window.innerHeight;
    particleCanvas.width = Math.floor(particleWidth * dpr);
    particleCanvas.height = Math.floor(particleHeight * dpr);
    particleCanvas.style.width = particleWidth + 'px';
    particleCanvas.style.height = particleHeight + 'px';
    particleCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    particles = Array.from({ length: 60 }, () => new Particle());
  }

  function animateParticles() {
    if (!particleCtx) return;

    particleCtx.clearRect(0, 0, particleWidth, particleHeight);
    particles.forEach(particle => {
      particle.update();
      particle.draw();
    });
    requestAnimationFrame(animateParticles);
  }

  if (particleCanvas && particleCtx) {
    resizeParticles();
    animateParticles();
    window.addEventListener('resize', resizeParticles);
  }

  // ===============================
  // 1. Mobile Menu
  // ===============================
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileNav.classList.toggle('active');
      document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
    });

    // Close mobile nav on link click
    mobileNav.querySelectorAll('.mobile-nav__link').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileNav.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // ===============================
  // 2. Header scroll behavior
  // ===============================
  const header = document.getElementById('header');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const current = window.scrollY;
    if (header) {
      if (current > 80) {
        header.style.background = 'rgba(11, 13, 16, 0.95)';
      } else {
        header.style.background = 'rgba(11, 13, 16, 0.85)';
      }
    }
    lastScroll = current;
  }, { passive: true });

  // ===============================
  // 3. Active nav link on scroll
  // ===============================
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const headerMenu = document.querySelector('.header__menu');
  const navLinks = document.querySelectorAll('.header__link, .mobile-nav__link');
  let activeIndicator = null;
  let activeIndicatorTimer = null;
  let lastIndicatorX = 0;
  let lastIndicatorWidth = 0;

  if (headerMenu) {
    activeIndicator = document.createElement('span');
    activeIndicator.className = 'header__active-indicator';
    activeIndicator.setAttribute('aria-hidden', 'true');
    headerMenu.appendChild(activeIndicator);
    window.requestAnimationFrame(() => {
      moveActiveIndicator(document.querySelector('.header__link.active'));
    });
  }

  function moveActiveIndicator(activeLink) {
    if (!headerMenu || !activeIndicator || !activeLink) return;

    const menuRect = headerMenu.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    const nextX = linkRect.left - menuRect.left;
    const nextWidth = linkRect.width;
    const nextEnd = nextX + nextWidth;
    const lastEnd = lastIndicatorX + (lastIndicatorWidth || nextWidth);
    const distance = Math.abs(nextX - lastIndicatorX);
    const isMovingRight = nextX >= lastIndicatorX;
    const compressedWidth = Math.min(
      Math.max(nextWidth * 0.72, 24),
      nextWidth
    );
    const compressedX = isMovingRight ? nextEnd - compressedWidth : nextX;
    const stretchedX = isMovingRight ? lastIndicatorX : nextX;
    const stretchedEnd = isMovingRight ? nextEnd : lastEnd;
    const stretchedWidth = Math.max(compressedWidth, stretchedEnd - stretchedX);

    if (activeIndicatorTimer) {
      window.clearTimeout(activeIndicatorTimer);
    }

    activeIndicator.style.setProperty('--indicator-move-duration', '360ms');
    activeIndicator.style.setProperty('--indicator-width-duration', '520ms');
    activeIndicator.style.setProperty('--indicator-x', compressedX + 'px');
    activeIndicator.style.setProperty('--indicator-width', compressedWidth + 'px');

    window.requestAnimationFrame(() => {
      activeIndicator.style.setProperty('--indicator-x', stretchedX + 'px');
      activeIndicator.style.setProperty('--indicator-width', stretchedWidth + 'px');
    });

    activeIndicatorTimer = window.setTimeout(() => {
      activeIndicator.style.setProperty('--indicator-move-duration', '260ms');
      activeIndicator.style.setProperty('--indicator-width-duration', '420ms');
      activeIndicator.style.setProperty('--indicator-x', nextX + 'px');
      activeIndicator.style.setProperty('--indicator-width', nextWidth + 'px');
    }, 240);

    lastIndicatorX = nextX;
    lastIndicatorWidth = nextWidth;
  }

  function updateActiveNav() {
    if (!navLinks.length) return;
    if (!sections.length) {
      moveActiveIndicator(document.querySelector('.header__link.active'));
      return;
    }

    const headerOffset = header ? header.offsetHeight : 0;
    const activationLine = headerOffset + window.innerHeight * 0.32;
    let activeId = sections[0].id;

    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= activationLine && rect.bottom > headerOffset) {
        activeId = section.id;
      }
    });

    let activeHeaderLink = null;

    navLinks.forEach(link => {
      const isActive = link.getAttribute('href') === '#' + activeId;
      link.classList.toggle('active', isActive);
      if (isActive && link.classList.contains('header__link')) {
        activeHeaderLink = link;
      }
    });

    moveActiveIndicator(activeHeaderLink);
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  window.addEventListener('resize', updateActiveNav);
  updateActiveNav();

  // ===============================
  // 4. Scroll reveal (Intersection Observer)
  // ===============================
  const revealElements = document.querySelectorAll(
    '.section__header, ' +
    '.gallery-grid .tilt-card, ' +
    '.reviews-grid .card, ' +
    '.reviews-hero, ' +
    '.location__info, ' +
    '.location__map, ' +
    '.contact__buttons, ' +
    '.contact-form'
  );

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // ===============================
  // 5. 3D Tilt Cards (antes/depois)
  //    Instant follow — no transition delay
  // ===============================
  const tiltCards = document.querySelectorAll('[data-tilt]');

  tiltCards.forEach(wrapper => {
    const card = wrapper.querySelector('.ba-card');
    if (!card) return;

    const shine = card.querySelector('.ba-card__shine');
    const maxTilt = 12; // degrees

    wrapper.addEventListener('mousemove', (e) => {
      const rect = wrapper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Normalized values (-1 to 1)
      const normalX = (x - centerX) / centerX;
      const normalY = (y - centerY) / centerY;

      // Rotation (inverted for natural tilt)
      const rotateX = -normalY * maxTilt;
      const rotateY = normalX * maxTilt;

      // Apply transform instantly (no transition)
      card.style.transition = 'box-shadow 250ms ease';
      card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

      // Shine position
      if (shine) {
        const percentX = (x / rect.width) * 100;
        const percentY = (y / rect.height) * 100;
        shine.style.setProperty('--mouse-x', percentX + '%');
        shine.style.setProperty('--mouse-y', percentY + '%');
      }
    });

    wrapper.addEventListener('mouseleave', () => {
      // Smooth return to rest
      card.style.transition = 'transform 400ms ease, box-shadow 250ms ease';
      card.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
  });

  // ===============================
  // 6. Button cursor glow
  // ===============================
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      btn.style.setProperty('--mx', x + '%');
      btn.style.setProperty('--my', y + '%');
    });
  });

  // ===============================
  // 7. Smooth scroll for anchor links
  // ===============================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const headerHeight = header ? header.offsetHeight : 72;
        const top = target.getBoundingClientRect().top + window.scrollY - headerHeight;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ===============================
  // 8. Contact form (simple handler)
  // ===============================
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      // Simple WhatsApp redirect with message
      const name = contactForm.querySelector('input[type="text"]').value;
      const phone = contactForm.querySelector('input[type="tel"]').value;
      const subject = contactForm.querySelector('select').value;
      const message = contactForm.querySelector('textarea').value;

      const whatsappMsg = encodeURIComponent(
        `Olá! Me chamo ${name}.\nTelefone: ${phone}\nAssunto: ${subject}\nMensagem: ${message}`
      );

      window.open(`https://wa.me/5515992014976?text=${whatsappMsg}`, '_blank');
    });
  }

})();
