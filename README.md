# Portfólio 3D Interativo (Three.js)

Portfólio em primeira pessoa no browser, com estética low-poly adulta, 3 árvores interativas (Sobre, Projetos, Contato), hover por mira, abertura com tecla `E` e ciclo dia/noite.

## Estrutura

- `index.html`
- `styles.css`
- `main.js`
- `assets/`

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

## Controles

- Mouse: olhar
- `W A S D`: mover
- `E`: abrir seção quando mirando na árvore
- `Esc`: sair do pointer lock e/ou fechar painel

## Publicar no GitHub Pages

1. Faça push do conteúdo para a branch desejada (`main` ou `gh-pages`).
2. No GitHub, vá em **Settings → Pages**.
3. Em **Build and deployment**, selecione:
   - **Source**: Deploy from a branch
   - **Branch**: `main` (ou `gh-pages`) e pasta `/ (root)`
4. Salve e aguarde o deploy.
5. A URL será exibida na seção Pages do repositório.

## Observações de performance

- Cena leve com geometrias simples (plane/cylinder/cone/sprite).
- Sem texturas externas pesadas e sem backend em produção.
- Mundo limitado para navegação curta (perímetro ~500 unidades/metros).