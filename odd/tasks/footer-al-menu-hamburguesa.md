# Move the footer links into the hamburger menu

**Feature**: `footer-al-menu-hamburguesa`
**Status**: implemented, verified, one bounded correction applied; live pass pending
**Date**: 2026-10-09
**Branch**: `codex/footer-al-menu-hamburguesa` (from `origin/main` = b0c597e)

## Objective

Delete the app footer and move its three links into the navbar hamburger menu, so the
product behaves like the app it is instead of like a website with a footer.

## Problem and why

Decision (user, 2026-10-09): "llévalo al menú hamburguesa". The footer was a website artifact
in an installable app: it lived at the end of a scroll of hundreds of cards, its dominant
content was a copyright notice, and it once needed a disclosure panel, a left-edge trigger
and a touch-target workaround just to fit at 320px. The navbar hamburger menu already exists
on both breakpoints (no `display: none` at any width) and already held exactly this family of
items: Generaciones + Herramientas (Animaciones, Instalar, Respaldo).

Facts that made this safe (verified before writing):
- `src/seo/plantilla.js:145` (`pieDePagina`) already generates a real `<footer class="pie">`
  with the same three links inside every prerendered static page, so internal linking for
  crawlers never depended on the app shell.
- The app footer links were never in the static HTML either: the panel rendered only while
  open (`{abierto && ...}`), so moving them is SEO-neutral.
- Nothing else rendered or imported `Footer`: only `src/App.jsx:22` and `:1395`.
- `footer.*` keys were used only by `Footer.jsx`.

## Authorized scope and constraints

- Delete `src/components/Footer.jsx` and the artifacts that existed only to serve it.
- One home for the three links: the navbar hamburger menu, new "Ayuda y legal" section.
- Do NOT build a link farm: three items plus a quiet copyright caption.
- Do NOT touch the static pages' own footer (`pieDePagina`) or the prerendered pages.
- Never introduce "Pokédex" or any Pokémon trademark in copy (hard project rule).
- Copy: Spanish in `es.js`, English in `en.js`, reusing the strings that already existed.
- TDD: off. A move plus a deletion with no new pure logic; proof is the suite, lint, build and
  the absence greps.
- Receipt-driven development: off (decided by global). No review was started.
- Delivery strategy: `ask-on-risk`. Actual authored change: +182 / -404 (the biggest block is
  CSS deletion). Split is cohesive per commit. Chain-strategy ask is due before any PR.
- No push, PR, merge or deploy from here.

## Route and forecast

- Route: delegated direct. One bounded writer implemented AMH-01..06; one independent
  read-only verifier re-derived eight claims on the frozen candidate (the native assessment
  landed on `high`/`unassessable`, so the tier table required it). The verifier refuted one
  claim and the parent applied the single bounded correction (AMH-08).
- Actual: 6 source files touched plus one deletion, +182 / -404 authored lines.
- Slices: **S1** menu + wiring + component deletion, **S2** dead CSS (+ the AMH-08
  restoration), **S3** i18n + this document.

## Task

- [x] **AMH-01 — "Ayuda y legal" section in the hamburger menu.** Three entries added after
  the Herramientas section using the existing divider, section-label and
  `app-navbar__menu-action-btn` / `action-btn-left` markup: two real `<a>` elements
  (`/guia-espiritus`, `/espiritus`, both through `conIdioma`) and one `<button>` for
  `Cookies & Privacidad` wired to the new `onOpenPrivacy` prop; every entry closes the menu.
  Plus the copyright caption (`nav.copyright`).
- [x] **AMH-02 — Escape closes the navbar dropdowns** and returns focus to the trigger that
  opened them. The listener is only attached while a dropdown is open, and it does not
  interfere with the existing outside-click handler (different event types).
- [x] **AMH-03 — Rewired App.** `onOpenPrivacy={() => setShowFooterPrivacyModal(true)}` is
  passed to `<Navbar>`; the `Footer` import and render (which also carried an unused
  `totalSprites` prop) are gone.
- [x] **AMH-04 — Deleted** `src/components/Footer.jsx`.
- [x] **AMH-05 — Removed the dead CSS.** 27 `.app-footer*` rules, `.footer-short-text`,
  `.footer-full-text` and the three grouped members, plus two small additions: the anchor
  reset (`a.app-navbar__menu-action-btn { text-decoration: none }`) and the caption rule.
- [x] **AMH-06 — Moved the copy to `nav.*`.** Four `footer.*` keys removed per locale, five
  `nav.*` added: the four moved values keep their exact original text in each language, and
  `nav.ayudaLegal` ("Ayuda y legal" / "Help & legal") is the only new string, used as the
  section label. Both files: 424 keys, identical sets.
- [x] **AMH-07 — Verified and committed** as three work units (identities below).
- [x] **AMH-08 — Corrected the one regression the verifier refuted.** The footer deletion
  range had swallowed `.sdm__ficha` and `.sdm__ficha:hover`, which sat inside that region and
  are used by `src/components/SpriteDetailModal.jsx:124` (the "Ver ficha" link). Both rules
  were restored verbatim from `HEAD` at the seam, and a deterministic scan now reports zero
  classes that are used in JSX and have no rule.

## Evidence and disposition

Independent read-only verifier on the frozen candidate: 7 of 8 claims CONFIRMED, claim 4
("no live CSS was lost") **REFUTED** with exact evidence (`HEAD` had the rules at 7592/7602;
`dist/assets/index-BpRqpjdE.css` had 0 occurrences while
`SpriteDetailModal.jsx:124` still used the class). The parent reproduced it, applied AMH-08,
and re-ran the checks.

Checks after the correction:
- `npm test` → 232 tests, 231 pass, 1 fail: `tests/fecha-lanzamiento.test.js:21`, a
  date-dependent expectation whose subject file is not among the changed paths. Pre-existing
  and unrelated (it already failed before this change on 2026-10-08 with the same actual value).
- `npm run lint` → no new diagnostics. The only warning on a changed line is the
  pre-existing unused `ChevronDown` import in `Navbar.jsx`, which was already imported and
  unused on `HEAD`. The tool exits 1 only because of 2 `no-undef: process` errors in the untracked `assets-src/marca/marca-iconos.mjs`; the parent re-ran it to confirm both the exit code and that no changed file adds a diagnostic. (The verifier reported exit 0 here; the parent re-run shows exit 1, and this is the accurate statement.)
- `npm run build` → exit 0; prerender emitted 544 spirit pages and a 549-URL sitemap.
- `grep -rn "app-footer|footer-short-text|footer-full-text" src` → empty.
- `grep -rnE "import .*Footer|</?Footer" src` → empty (no import, no JSX).
- No `footer.` key survives in either locale.
- Deterministic collateral scan over every selector removed from `index.css`: 13 tokens, and
  **0** of them are still used in `src/**/*.{jsx,js}` without a rule.
- `BookOpen` confirmed as a real export of the installed `lucide-react`.
- `.sdm__ficha` present again in the built CSS.

## Left open on purpose

- `showFooterPrivacyModal` in `App.jsx` keeps its old name; the footer it was named after no
  longer exists. Renaming it is a cosmetic follow-up, not part of this task.
- The pre-existing unused `ChevronDown` import in `Navbar.jsx`, and the lack of a
  `:focus-visible` treatment for `.app-navbar__menu-action-btn` (the default focus ring applies
  equally to the old buttons and the new anchors).
- `assets-src/marca/`, `odd/tasks/marca-fantasma-definitiva.md` and the modified
  `skills-lock.json` stay out of these commits: they belong to other workstreams.

## Not proven

- Nothing here ran on a device: the menu opening, the three destinations and the Escape
  behaviour are proven by build, greps and code reading, not by a live pass. There is no
  Supabase session available either.

## Relevant files

- `src/components/Navbar.jsx` — the "Ayuda y legal" section and the Escape handling.
- `src/App.jsx` — `onOpenPrivacy` wiring; footer import and render removed.
- `src/components/Footer.jsx` — deleted.
- `src/styles/index.css` — dead `.app-footer*` CSS removed, anchor reset and caption added,
  `.sdm__ficha` restored.
- `src/i18n/locales/es.js`, `en.js` — `footer.*` → `nav.*`.
- `src/seo/plantilla.js` — untouched; the static pages keep their own footer.

## Next step

A live pass on a phone: hamburger → "Ayuda y legal" → the three destinations, Escape closing
the menu and focusing the trigger, and no footer at the end of the grid. Then decide delivery.


## Commit identities (evidence)

- S1 `8aa462c` — feat(menu): mueve los enlaces del pie al menu de navegacion
  (3 files, +78 / -109, includes the Footer deletion).
- S2 `e8b43d2` — style(menu): borra el CSS del pie que ya no existe
  (1 file, +16 / -271, includes the sdm__ficha restoration).
- S3 `8edaf7c` — chore(i18n): mueve el copy del pie a las claves nav
  (3 files, +149 / -8, includes this document).

