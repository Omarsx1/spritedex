# The guide opens inside the app

**Feature**: `guia-en-la-app`
**Status**: in progress
**Date**: 2026-10-09
**Branch**: `codex/footer-al-menu-hamburguesa` — this completes the same undelivered change: the menu added there links here.

## Objective

Make the two informational destinations in the navbar menu work like app destinations instead
of ejecting the user to a build-time static page: `/guia-espiritus` renders inside the app
shell, and `Todos los espíritus` returns to the catalog. The prerendered static pages stay
untouched for crawlers, and both renderers share **one** source of content.

## Problem and why

Reported by the user: "cuando presiono guía de espíritus no abre ni muestra nada".

Diagnosis (verified 2026-10-09):
- `/guia-espiritus` is not an app route. It is static HTML generated at build time by
  `scripts/prerender-seo.mjs` into `dist/guia-espiritus/index.html`.
- Production serves it correctly: `https://spritedex.gg/guia-espiritus` → 200, 12,563 bytes,
  its own `<h1>`, no SPA root. The `vercel.json` catch-all rewrite does not shadow it.
- The **dev server never has it**: `vite.config.js` keeps the default `appType: 'spa'`, so
  Vite answers with the SPA shell, and `App.jsx` has no branch for that path. The app renders
  the grid at that URL, which reads as "nothing happened".
- Even in production the link throws the user out of the app shell into a page with a different
  chrome, which in an installed PWA feels like leaving the app.

The repo already solves this exact shape for sprite deep links: `/espiritu/<slug>` is a
prerendered static page AND the app resolves it (`espirituDeEnlace` in `App.jsx`). This change
follows that precedent instead of inventing a new one.

## Authorized scope and constraints

- **One source of content.** The guide's copy and structure move to a shared module consumed by
  BOTH the static generator and the React view. Copy duplicated in two places is the thing this
  feature must not create.
- **The static HTML must not regress.** Gate: after the refactor, rebuild and diff
  `dist/guia-espiritus/index.html` against the pre-change output. Any difference must be
  explained and approved before proceeding; a silent change to an indexed page is a defect.
- No `dangerouslySetInnerHTML` for the guide body in React.
- Menu links stay **real anchors** (`href` preserved) and are enhanced with client-side
  navigation on plain left click, so cmd/ctrl-click, middle click and "open in new tab" keep
  working.
- Language aware: `/guia-espiritus` and `/en/guia-espiritus` are the same screen, matching how
  `/amigos` already behaves.
- The in-app route must set the page head from the same source (`etiquetasGuia(lang)`) through
  the existing `aplicarSeoRuta` path, without duplicating titles.
- Accessibility: a single `<h1>`, real landmarks, the FAQ keeps `<details>/<summary>`
  semantics, and focus moves to the content on in-app navigation.
- Do NOT touch the static page chrome (`src/seo/plantilla.js`), the other content pages
  (`novedades`, `acerca`, `privacidad`) nor the hub generator's output.
- Never introduce "Pokédex" or any Pokémon trademark in copy.
- TDD: the extracted model is pure, so it ships with `node --test` coverage (precedent:
  `src/utils/visitaEnlace.js` + `tests/visitaEnlace.test.js`). The React view is proven by
  build, lint and the route checks; no DOM test harness exists in this repo.
- Receipt-driven development: off (decided by global). No review is started.
- Delivery strategy: `ask-on-risk`; the chain-strategy ask is due before any PR.
- No push, PR, merge or deploy from here.

## Product decision recorded

`Todos los espíritus` in the menu becomes an in-app navigation to the catalog (`/`) instead of
opening the static hub. In-app, an unfiltered index of every spirit would duplicate the grid the
user already has (with generation filters), and the static hub keeps doing its own job for
crawlers and is already linked from the prerendered pages' own footer.

## Route and forecast

- Route: delegated direct, two sequential work units (the second consumes the first module). It stays on the same branch because the menu that links to the guide has not been delivered yet.
- Forecast: ~250 lines for the shared model plus refactor and tests (W1), ~280 lines for the
  React view, routing, CSS and menu wiring (W2).
- Slices: **S1** W1 (model + refactor + tests), **S2** W2 (view + route + menu + CSS),
  **S3** documentation and evidence.

## Task

- [ ] **GIA-01 — Extract the guide content model** (new `src/seo/guia.js`). Move the guide's
  structure and its bilingual copy out of `src/seo/contenido.js` into a pure module that returns
  a structured model for a given `lang` and `datos`: sections with headings, paragraphs, lists,
  tables and the FAQ (today `preguntas(lang, datos)`). No HTML strings in the model.
  - Acceptance: the model is importable from Node and from the app, and contains no markup.
- [ ] **GIA-02 — Make the static generator consume the model.** `htmlGuia` becomes a renderer
  over the model; `prerender-seo.mjs` keeps computing the same numbers (or imports them from
  `src/` if that is cleaner, without changing their values).
  - Acceptance: `npm run build` and `dist/guia-espiritus/index.html` byte-identical to the
    pre-change build. This is the gate: report the diff (or its absence) explicitly.
- [ ] **GIA-03 — Tests for the model** (`tests/guia.test.js`). Both languages, the FAQ count,
  the interpolated numbers appearing in the copy, and the invariant that no section is empty or
  contains raw markup.
- [ ] **GIA-04 — In-app route.** `GuiaPage.jsx` renders the model inside the app shell with the
  app's own chrome and typography; `App.jsx` gains the route (derived from the path, synced on
  `popstate`, language aware) and applies the head from `etiquetasGuia`; the menu anchor keeps
  its `href` and intercepts a plain left click; `Todos los espíritus` navigates to the catalog.
  CSS: a new block for the view, reusing existing tokens, plus a mobile pass.
- [ ] **GIA-05 — Verify and commit.** Suite, lint, build, the byte-diff gate, route checks in
  both languages, and the greps that prove no dead code was left behind.

## Evidence and disposition

Pending.

## Not proven

- No browser pass in this environment: the sandbox cannot bind a port (`listen EPERM`), so the
  dev server and `vite preview` cannot run here. Route behaviour is proven by build, tests and
  code reading; the live click needs the user's own dev server.

## Relevant files

- `src/seo/guia.js` (new) — the shared content model.
- `src/seo/contenido.js` — `htmlGuia` becomes a renderer over the model.
- `scripts/prerender-seo.mjs` — the numbers and the static emission.
- `src/components/GuiaPage.jsx` (new) — the in-app view.
- `src/App.jsx` — the route, `popstate` sync and head.
- `src/components/Navbar.jsx` — the menu entries.
- `tests/guia.test.js` (new) — the model's proof.

## Next step

Live pass in the user's dev server: menu → Guía de espíritus opens inside the app, back button
returns, `/en/guia-espiritus` works, and cmd-click still opens the static page in a new tab.

