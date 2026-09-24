// Tira um print de página inteira de cada tela do portfólio.
// Uso: node scripts/screenshots.mjs  (a partir da raiz do repositório)
// Requer Playwright + Chromium disponíveis no ambiente.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { execSync, spawn } from "node:child_process";

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  const globalRoot = execSync("npm root -g").toString().trim();
  ({ chromium } = require(path.join(globalRoot, "playwright")));
}

const root = process.cwd();
const outDir = path.join(root, "screenshots");
const IGNORE = new Set([".git", "node_modules", "screenshots", "assets", "scripts", "Mini-merlin"]);

function findPages(dir, rel = "") {
  const pages = [];
  if (fs.existsSync(path.join(dir, "index.html"))) pages.push(`/${rel}`);
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || IGNORE.has(entry.name) || entry.name.startsWith(".")) continue;
    pages.push(...findPages(path.join(dir, entry.name), rel ? `${rel}/${entry.name}` : entry.name));
  }
  return pages;
}

// servidor estático simples (python3 -m http.server) servindo a raiz do repositório
const PORT = 8765;
const server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1"], { cwd: root, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 1200));
const base = `http://127.0.0.1:${PORT}`;

const only = process.argv.slice(2);
const pages = findPages(root).sort().filter((p) => !only.length || only.some((o) => p.startsWith(o)));
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

for (const pagePath of pages) {
  const name = pagePath === "/" ? "inicio" : pagePath.replace(/^\/|\/$/g, "").replace(/\//g, "__");
  const page = await context.newPage();
  try {
    await page.goto(base + pagePath, { waitUntil: "load", timeout: 30000 });
    await page.waitForTimeout(800);
    // rola até o fim para disparar as animações de "reveal"
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(2200);
    // fullPage deixa algumas telas em branco; em vez disso, estica a viewport até a altura total
    const height = await page.evaluate(() => Math.min(document.documentElement.scrollHeight, 12000));
    await page.setViewportSize({ width: 1440, height: Math.max(900, height) });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, `${name}.png`) });
    console.log("ok", pagePath);
  } catch (err) {
    console.log("erro", pagePath, err.message);
  }
  await page.close();
}

await browser.close();
server.kill();
