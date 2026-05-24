# Portfólio Scroll 

Portfólio com rolagem vertical, navegação superior por categorias e seção 3D interativa com dois modelos GLB (`cuia.glb` e `oculos.glb`) animados pelo scroll.

## Estrutura

- `index.html`
- `styles.css`
- `main.js`
- `assets/models/cuia.glb`
- `assets/models/oculos.glb`

## Rodar localmente

### Opção 1: Live Server (VS Code)

1. Abra a pasta do projeto no VS Code.
2. Clique com botão direito em `index.html`.
3. Escolha **Open with Live Server**.

### Opção 2: Python HTTP server (somente local)

Na raiz do projeto:

```bash
python -m http.server 5500
```

Depois abra: `http://localhost:5500`

> Evite abrir com `file://`, pois módulos ES podem falhar por CORS.

## Seções do site

- 3D
- Webdesign
- Apps
- Animação
- DevOps

## Interações implementadas

- Barra superior sticky com destaque da seção ativa.
- Scroll storytelling com palco 3D fixo (sticky) na seção `3D`.
- Transição entre os dois modelos 3D conforme a rolagem.
- Cards com animação de entrada suave nas seções de conteúdo.

## Publicar no GitHub Pages

1. Faça push do conteúdo para a branch desejada (`main` ou `gh-pages`).
2. No GitHub, vá em **Settings → Pages**.
3. Em **Build and deployment**, selecione:
   - **Source**: Deploy from a branch
   - **Branch**: `main` (ou `gh-pages`) e pasta `/ (root)`
4. Salve e aguarde o deploy.
5. A URL será exibida na seção Pages do repositório.

## Observações de performance

- Site 100% estático e compatível com GitHub Pages.
- Sem backend em produção.
- Modelos carregados localmente via `assets/models`.
- Three.js + GLTFLoader via CDN (módulos ES).
