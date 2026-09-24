import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const categories = {
  "webdesign": ["marketplace", "perfil-de-usuario", "dashboard-inicio", ...range("interface-web", 4, 10)],
  "modelos-3d": ["cuia", "oculos", ...range("projeto-3d", 3, 10)],
  "plugins-addons": ["figma-plug-ins", "blender-addons", "pipeline-tools", ...range("plug-in-add-on", 4, 10)],
  "animacoes": ["character-animation", "motion-graphics", "loop-animation", ...range("animacao", 4, 10)],
  "devops": ["deploy-estatico", "monitoramento", ...range("devops", 3, 10)],
};

function range(prefix, start, end) {
  const values = [];
  for (let i = start; i <= end; i += 1) values.push(`${prefix}-${String(i).padStart(2, "0")}`);
  return values;
}

function writePage(filePath, attrs) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, shell(attrs));
}

function shell(attrs) {
  const attrString = Object.entries(attrs)
    .map(([key, value]) => ` data-${key}="${value}"`)
    .join("");

  return `<!doctype html>
<html lang="pt-BR" data-theme="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>André Machado — Portfólio</title>
    <meta name="description" content="Página do portfólio de André Machado." />
    <meta name="color-scheme" content="dark light" />
    <link rel="stylesheet" href="/styles.css?v=20" />
    <script>
      (function () {
        var THEME_KEY = "am-theme";
        var html = document.documentElement;
        function apply(t) {
          html.setAttribute("data-theme", t);
          try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
        }
        var saved;
        try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
        if (saved) { apply(saved); } else { apply("dark"); }
        document.addEventListener("DOMContentLoaded", function () {
          var buttons = document.querySelectorAll("[data-theme-toggle]");
          buttons.forEach(function (btn) {
            btn.addEventListener("click", function () {
              var next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
              apply(next);
            });
          });
        });
      })();
    </script>
  </head>
  <body${attrString}>
    <canvas id="gridBg" class="grid-bg"></canvas>
    <canvas id="neonTrail" class="neon-trail"></canvas>

    <button class="theme-toggle" data-theme-toggle aria-label="Alternar tema">
      <svg class="icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
      <svg class="icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
    </button>

    <main id="pageRoot"></main>

    <script src="/portfolio-pages.js?v=2"></script>
    <script src="/bento.js?v=20"></script>
  </body>
</html>
`;
}

writePage(path.join(root, "sobre", "index.html"), { "page-type": "about" });

for (const [category, projects] of Object.entries(categories)) {
  writePage(path.join(root, category, "index.html"), { "page-type": "category", category });
  for (const project of projects) {
    writePage(path.join(root, category, project, "index.html"), {
      "page-type": "project",
      category,
      project,
    });
  }
}
