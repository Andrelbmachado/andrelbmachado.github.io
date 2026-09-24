(function () {
  const categories = {
    "webdesign": {
      label: "Web Design",
      overline: "WEBDESIGN",
      title: "Projetos de interfaces web.",
      body: "Uma coleção de interfaces pensadas para clareza, ritmo, conversão e apresentação de produto.",
      layout: "grid",
      projects: [
        { slug: "marketplace", title: "Marketplace", image: "/assets/images/webdesign/marketplace.png", body: "Hierarquia clara, busca proeminente e categorização visual." },
        { slug: "perfil-de-usuario", title: "Perfil de Usuário", image: "/assets/images/webdesign/perfil.png", body: "Métricas, histórico e personalização." },
        { slug: "dashboard-inicio", title: "Dashboard Início", image: "/assets/images/webdesign/tela-inicio.png", body: "Widgets modulares e atalhos contextuais." },
        ...emptyProjects("Interface Web", 4, 10),
      ],
    },
    "modelos-3d": {
      label: "Modelagem 3D",
      overline: "MODELOS 3D",
      title: "Projetos de modelagem 3D.",
      body: "Objetos, materiais e estudos volumétricos preparados para apresentação digital e render real-time.",
      layout: "grid",
      projects: [
        { slug: "cuia", title: "Cuia", body: "Estudo volumétrico inspirado em cultura regional, formas orgânicas e texturas terrosas.", tags: ["PBR", "WebGL", "Modelo 3D"] },
        { slug: "oculos", title: "Óculos", body: "Produto com proporção técnica, acabamento industrial e iluminação de estúdio.", tags: ["Hard Surface", "Glass Shader", "Real-time"] },
        ...emptyProjects("Projeto 3D", 3, 10),
      ],
    },
    "plugins-addons": {
      label: "Plug-ins & Addons",
      overline: "PLUG-INS & ADDONS",
      title: "Ferramentas para Figma e Blender.",
      body: "Plug-ins, addons e utilitários criados para acelerar fluxos reais de design e produção 3D.",
      layout: "grid",
      projects: [
        { slug: "figma-plug-ins", image: "/assets/images/plugins/figma-plug-ins.svg", title: "Figma Plug-ins", body: "Automações para organizar componentes, acelerar revisões e reduzir trabalho repetitivo em interfaces.", tags: ["Figma", "Design Ops"] },
        { slug: "blender-addons", image: "/assets/images/plugins/blender-addons.svg", title: "Blender Addons", body: "Ferramentas para apoiar modelagem, materiais, cenas e rotinas de produção 3D.", tags: ["Blender", "3D"] },
        { slug: "pipeline-tools", image: "/assets/images/plugins/pipeline-tools.svg", title: "Pipeline Tools", body: "Utilitários criados para conectar design, assets e entrega com menos fricção.", tags: ["Pipeline", "Automação"] },
        ...emptyProjects("Plug-in/Add-on", 4, 10).map((project) => ({ ...project, image: `/assets/images/plugins/${project.slug}.svg` })),
      ],
    },
    "animacoes": {
      label: "Animações",
      overline: "ANIMAÇÕES",
      title: "Projetos de animação.",
      body: "Loops, motion graphics e estudos de movimento para reforçar narrativa e identidade visual.",
      layout: "grid",
      projects: [
        { slug: "character-animation", title: "Character Animation", image: "/assets/images/animacao/homer.gif", body: "Timing expressivo e loop suave." },
        { slug: "motion-graphics", title: "Motion Graphics", image: "/assets/images/animacao/8A1zI.gif", body: "Transições dinâmicas e storytelling." },
        { slug: "loop-animation", title: "Loop Animation", image: "/assets/images/animacao/nyan.webp", body: "Pixel art estilizado e nostalgia digital." },
        ...emptyProjects("Animação", 4, 10),
      ],
    },
    "devops": {
      label: "DevOps",
      overline: "DEVOPS",
      title: "Projetos de entrega e automação.",
      body: "Build, deploy, monitoramento e práticas para deixar produtos digitais mais confiáveis.",
      layout: "grid",
      projects: [
        { slug: "deploy-estatico", title: "Deploy Estático", body: "GitHub Pages, Vercel ou Netlify com build otimizado e zero downtime.", tags: ["Deploy", "Static Hosting"] },
        { slug: "monitoramento", title: "Monitoramento", body: "Lighthouse CI, Core Web Vitals e alertas de regressão.", tags: ["Lighthouse", "Core Web Vitals"] },
        ...emptyProjects("DevOps", 3, 10),
      ],
    },
  };

  function emptyProjects(prefix, start, end) {
    const projects = [];
    for (let i = start; i <= end; i += 1) {
      const label = `${prefix} ${String(i).padStart(2, "0")}`;
      projects.push({ slug: slugify(label), title: label, body: "Espaço reservado para inserir este projeto depois." });
    }
    return projects;
  }

  function slugify(value) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function esc(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function projectCard(category, project) {
    const href = `/${category}/${project.slug}/`;
    if (project.image) {
      return `<a class="card card-img project-link-card reveal" href="${href}"><img src="${esc(project.image)}" alt="${esc(project.title)}" loading="lazy"/><h3>${esc(project.title)}</h3><p>${esc(project.body)}</p></a>`;
    }
    return `<a class="empty-card reveal" href="${href}"><span>${esc(project.title)}</span></a>`;
  }

  function renderCategory(root, categoryKey) {
    const category = categories[categoryKey];
    if (!category) {
      renderNotFound(root);
      return;
    }
    const gridClass = category.layout === "phone" ? "phone-grid" : "page-project-grid";
    root.innerHTML = `
      <section class="page-shell">
        <div class="page-inner">
          ${renderNav()}
          <header class="page-hero reveal">
            <p class="overline">${esc(category.overline)}</p>
            <h1 class="page-title">${esc(category.title)}</h1>
            <p class="page-body">${esc(category.body)}</p>
          </header>
          <div class="${gridClass}">
            ${category.projects.map((project) => projectCard(categoryKey, project)).join("")}
          </div>
          ${renderPageFooter()}
        </div>
      </section>`;
  }

  function renderProject(root, categoryKey, projectSlug) {
    const category = categories[categoryKey];
    const project = category?.projects.find((item) => item.slug === projectSlug);
    if (!category || !project) {
      renderNotFound(root);
      return;
    }
    const tags = project.tags || [category.label, "Projeto", "Portfólio"];
    root.innerHTML = `
      <section class="page-shell">
        <div class="page-inner">
          ${renderNav()}
          <header class="page-hero reveal">
            <p class="overline">${esc(category.overline)} / PROJETO</p>
            <h1 class="page-title">${esc(project.title)}</h1>
            <p class="page-body">${esc(project.body)}</p>
            <div class="page-actions">
              <a href="/${categoryKey}/">Todos os projetos</a>
              <a href="/">Início</a>
            </div>
          </header>
          <section class="project-detail-layout">
            <figure class="project-media hover-tilt reveal">
              ${project.image ? `<img src="${esc(project.image)}" alt="${esc(project.title)}" loading="lazy"/>` : `<div class="project-placeholder"><span>${esc(project.title)}</span></div>`}
            </figure>
            <article class="project-notes detail-card reveal">
              <h2>Detalhes do projeto</h2>
              <p>Esta página está pronta para receber imagens, contexto, processo, ferramentas usadas e próximos materiais deste projeto.</p>
              <div class="project-meta">${tags.map((tag) => `<span>${esc(tag)}</span>`).join("")}</div>
            </article>
          </section>
          ${renderPageFooter()}
        </div>
      </section>`;
  }

  function renderAbout(root) {
    root.innerHTML = `
      <section class="page-shell">
        <div class="page-inner">
          ${renderNav()}
          <header class="page-hero reveal">
            <p class="overline">SOBRE MIM</p>
            <h1 class="page-title">Construir é a minha linguagem.</h1>
            <p class="page-body">Sou designer e desenvolvedor com experiência em interfaces digitais, modelagem 3D, prototipação e entrega de produto.</p>
          </header>
          <section class="about-feature reveal">
            <figure class="about-photo-card">
              <img src="/assets/images/sobre/andre-zeus.jpg" alt="André Machado com Zeus, seu rottweiler mais velho" loading="lazy" onerror="this.onerror=null;this.src='/assets/images/sobre/andre-zeus.svg';" />
            </figure>
            <div class="about-story">
              <h3>Dono de 7 rottweilers.</h3>
              <p>Além do trabalho com design, código e 3D, minha rotina tem uma equipe de peso em casa: sete rottweilers. Esse bonitão da foto é o Zeus, o mais velho, companheiro de muitos projetos e pausas entre uma entrega e outra.</p>
              <div class="skills-grid">
                <div class="skill-chip">UX / UI Design</div>
                <div class="skill-chip">Front-end</div>
                <div class="skill-chip">Modelagem 3D</div>
                <div class="skill-chip">Motion Design</div>
                <div class="skill-chip">Design Systems</div>
                <div class="skill-chip">Prototipação</div>
                <div class="skill-chip">Three.js / WebGL</div>
                <div class="skill-chip">DevOps básico</div>
              </div>
            </div>
          </section>
          ${renderPageFooter()}
        </div>
      </section>`;
  }

  function renderNav() {
    return `
      <nav class="page-nav" aria-label="Navegação de páginas">
        <a href="/">Início</a>
        <a href="/sobre/">Sobre mim</a>
        <a href="/modelos-3d/">Modelagem 3D</a>
        <a href="/webdesign/">Web Sites</a>
        <a href="/jogos/">Jogos</a>
        <a href="/plugins-addons/">Plug-ins &amp; Addons</a>
        <a href="/animacoes/">Animações</a>
        <a href="/devops/">DevOps</a>
      </nav>`;
  }

  function renderPageFooter() {
    return `<footer class="page-footer"><span>&copy; 2026 André Machado.</span><a href="/">Voltar para o início</a></footer>`;
  }

  function renderNotFound(root) {
    root.innerHTML = `
      <section class="page-shell">
        <div class="page-inner">
          ${renderNav()}
          <header class="page-hero reveal">
            <p class="overline">PORTFÓLIO</p>
            <h1 class="page-title">Página não encontrada.</h1>
            <p class="page-body">O projeto ou categoria solicitado ainda não existe neste portfólio.</p>
            <div class="page-actions"><a href="/">Voltar ao início</a></div>
          </header>
        </div>
      </section>`;
  }

  const root = document.getElementById("pageRoot");
  if (!root) return;

  const { pageType, category, project } = document.body.dataset;
  if (pageType === "about") renderAbout(root);
  if (pageType === "category") renderCategory(root, category);
  if (pageType === "project") renderProject(root, category, project);
})();
