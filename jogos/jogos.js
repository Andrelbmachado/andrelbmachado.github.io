(function () {
  const track = document.getElementById("jogosTrack");
  const dotsEl = document.getElementById("jogosDots");
  const enterLink = document.getElementById("jogosEnter");
  const prevBtn = document.querySelector(".jogos-arrow-prev");
  const nextBtn = document.querySelector(".jogos-arrow-next");
  if (!track) return;

  const slides = Array.from(track.querySelectorAll(".jogos-slide"));
  const len = slides.length;
  let active = 0;

  const positions = {
    0: { x: "0px", z: "0px", scale: 1, opacity: 1, blur: "0px" },
    "-1": { x: "-230px", z: "-160px", scale: 0.78, opacity: 0.55, blur: "1px" },
    1: { x: "230px", z: "-160px", scale: 0.78, opacity: 0.55, blur: "1px" },
  };

  slides.forEach((slide, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "jogos-dot";
    dot.setAttribute("aria-label", `Ir para jogo ${i + 1}`);
    dot.addEventListener("click", () => setActive(i));
    dotsEl.appendChild(dot);

    const link = slide.querySelector(".jogos-slide-link");
    link.addEventListener("click", (event) => {
      if (i !== active) {
        event.preventDefault();
        setActive(i);
      }
    });
  });

  const dots = Array.from(dotsEl.children);

  function circularDiff(i) {
    return ((i - active + len + 1) % len) - 1;
  }

  function render() {
    slides.forEach((slide, i) => {
      const diff = circularDiff(i);
      const pos = positions[diff] || { x: "0px", z: "-260px", scale: 0.5, opacity: 0, blur: "3px" };
      slide.style.setProperty("--x", pos.x);
      slide.style.setProperty("--z", pos.z);
      slide.style.setProperty("--scale", pos.scale);
      slide.style.setProperty("--opacity", pos.opacity);
      slide.style.setProperty("--blur", pos.blur);
      slide.classList.toggle("is-active", diff === 0);
      slide.classList.toggle("is-prev", diff === -1);
      slide.classList.toggle("is-next", diff === 1);
    });
    dots.forEach((dot, i) => dot.classList.toggle("is-active", i === active));
    const activeLink = slides[active].querySelector(".jogos-slide-link");
    if (enterLink && activeLink) enterLink.href = activeLink.href;
  }

  function setActive(i) {
    active = ((i % len) + len) % len;
    render();
  }

  if (prevBtn) prevBtn.addEventListener("click", () => setActive(active - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => setActive(active + 1));

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") setActive(active - 1);
    if (event.key === "ArrowRight") setActive(active + 1);
  });

  render();
})();
