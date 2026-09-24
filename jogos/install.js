// Mostra o comando de instalação do sistema do visitante e copia com um clique.
(function () {
  const box = document.getElementById("installBox");
  if (!box) return;

  const tabs = Array.from(box.querySelectorAll("[data-os]"));
  const panels = Array.from(box.querySelectorAll("[data-os-panel]"));

  function detectOs() {
    const platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "";
    const ua = navigator.userAgent || "";
    return /win/i.test(platform) || /windows/i.test(ua) ? "windows" : "mac";
  }

  function select(os) {
    tabs.forEach((tab) => tab.setAttribute("aria-selected", String(tab.dataset.os === os)));
    panels.forEach((panel) => { panel.hidden = panel.dataset.osPanel !== os; });
  }

  tabs.forEach((tab) => tab.addEventListener("click", () => select(tab.dataset.os)));
  select(detectOs());

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch (err) {}
      area.remove();
      return ok;
    }
  }

  box.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const source = button.closest(".code-box").querySelector("[data-copy-source]");
      const ok = await copyText(source.textContent.trim());
      button.textContent = ok ? "Copiado!" : "Selecione e copie";
      button.classList.toggle("is-copied", ok);
      clearTimeout(button._reset);
      button._reset = setTimeout(() => {
        button.textContent = "Copiar";
        button.classList.remove("is-copied");
      }, 2000);
    });
  });
})();
