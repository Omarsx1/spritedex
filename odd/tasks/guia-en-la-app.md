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

- [x] **GIA-01 — Extract the guide content model** (new `src/seo/guia.js`). Move the guide's
  structure and its bilingual copy out of `src/seo/contenido.js` into a pure module that returns
  a structured model for a given `lang` and `datos`: sections with headings, paragraphs, lists,
  tables and the FAQ (today `preguntas(lang, datos)`). No HTML strings in the model.
  - Acceptance: the model is importable from Node and from the app, and contains no markup.
- [x] **GIA-02 — Make the static generator consume the model.** `htmlGuia` becomes a renderer
  over the model; `prerender-seo.mjs` keeps computing the same numbers (or imports them from
  `src/` if that is cleaner, without changing their values).
  - Acceptance: `npm run build` and `dist/guia-espiritus/index.html` byte-identical to the
    pre-change build. This is the gate: report the diff (or its absence) explicitly.
- [x] **GIA-03 — Tests for the model** (`tests/guia.test.js`). Both languages, the FAQ count,
  the interpolated numbers appearing in the copy, and the invariant that no section is empty or
  contains raw markup.
- [x] **GIA-04 — In-app route.** `GuiaPage.jsx` renders the model inside the app shell with the
  app's own chrome and typography; `App.jsx` gains the route (derived from the path, synced on
  `popstate`, language aware) and applies the head from `etiquetasGuia`; the menu anchor keeps
  its `href` and intercepts a plain left click; `Todos los espíritus` navigates to the catalog.
  CSS: a new block for the view, reusing existing tokens, plus a mobile pass.
- [x] **GIA-05 — Verify and commit.** Suite, lint, build, the byte-diff gate, route checks in
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


## Evidence and disposition (final)

**GIA-01..03 (shared model).** The guide's copy, structure and FAQ moved to `src/seo/guia.js`,
and the number derivation to `src/seo/guiaDatos.js`; `htmlGuia` is now a renderer over the
model. The gate passed in both languages: `dist/guia-espiritus/index.html` and
`dist/en/guia-espiritus/index.html` stayed **byte-identical** to the pre-change build
(sha256 `959ab6ad…b2ec` and `170185ae…0c7`). Caveat: the "Datos revisados el …" note uses
`new Date()`, so byte identity is only reproducible within the same UTC day; that behaviour
predates this change.

**GIA-04 (in-app route).** `GuiaPage.jsx` renders the model inside the app chrome;
`src/utils/rutaGuia.js` holds the pure, language-aware route rule (covered by
`tests/rutaGuia.test.js`); `App.jsx` derives the route from the path, syncs it on `popstate`
and sets it in `irA`, and applies the head from `etiquetasGuia` (the same module the build
uses). The menu entry keeps its real `href` and only intercepts a plain left click, so
cmd/ctrl-click and "open in new tab" still reach the static page. `Todos los espíritus` now
navigates to the catalog.

**Independent verifier** re-derived nine claims by running the build, the suite, the linter and
the Vite module pipeline. Confirmed: static page unchanged; in-app numbers and copy identical to
the static page (268 spirits, 50 families, 15 costs, same rarity table, same FAQ); head correct
and noindex removed; no double navigation bar; real link preserved; route rule correct; no CSS
collision or orphan class; accessibility structure as designed.

**One bounded correction on top of GIA-05.** The verifier refuted the "nothing else broke" part of the
navbar hoisting: `BackupModal` and `PrivacyPolicyModal` were mounted only in the catalog return,
so on `/guia-espiritus` — the first non-catalog route that paints the navbar — the "Respaldo"
and "Cookies & Privacidad" entries were inert. Both are now built once as a `modales` element and
rendered in the guide and in the catalog, the same pattern already used for the navbar. Re-checked
after the fix: build exit 0, suite unchanged, static page still byte-identical.

Checks on the final bytes: `npm test` → 242 tests, 241 pass, 1 known pre-existing failure
(`tests/fecha-lanzamiento.test.js`); `npm run lint` → exit 1 only for the 2 `no-undef` errors in
the untracked `assets-src/marca/`, no new diagnostic on the changed files; `npm run build` →
exit 0; `grep -rn "dangerouslySetInnerHTML" src` → empty.

## Left open on purpose

- `/guia-espiritus` is not in `RUTAS`, so `aplicarSeoRuta` resolves it as the home and
  `aplicarSeoGuia` overrides the tags afterwards. The clean single-writer fix is an optional
  labels parameter in `head.js` (or a `RUTAS` entry excluded from the sitemap); adding the entry
  would change the sitemap, which the gate forbids. Also: the noindex branch deletes the JSON-LD
  and the in-app route does not restore it (crawlers read the static page).
- The guide reads `ALL_SPRITES`, not the CMS-merged list, so its rarity table stays identical to
  the static page even if a CMS override changes a rarity.
- `guia__lista` and the model's `lista` branch exist but nothing emits them today.
- The guide route omits the breadcrumb, the CTA and the catalog chrome (Header, grid,
  PrivacyNotice, InstallPrompt, FortnitemaresTransition). Deliberate: it is a content page.
- `skills-lock.json`, `assets-src/marca/` and `odd/tasks/marca-fantasma-definitiva.md` belong to
  other workstreams and stay out of these commits.

## Not proven

- No live pass: the sandbox cannot bind a port (`listen EPERM`), so neither the dev server nor
  `vite preview` can run here. The click interception, the `pushState`, the focus move and the
  back button are proven by code reading, build and tests, not in a browser.

## Commit identities (evidence)

- S1 `f988d4a` — refactor(guia): extrae a src el modelo de contenido y el de numeros (5 files).
- S2 `72246fc` — feat(guia): la guia se abre dentro de la app (6 files).
- S3 `cf3e7c5` — docs(guia): documento de la feature (1 file).
