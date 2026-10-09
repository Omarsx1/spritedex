# Retire the legacy friend modal

**Feature**: `amigos-retirar-modal-antigua`
**Status**: implemented and verified structurally; live smoke pass pending
**Date**: 2026-10-08
**Branch**: `codex/amigos-retirar-modal-antigua`

## Objective

Delete the legacy `FriendCompareModal` ("Radar de Amigos") and every artifact that existed
only to serve it: its wiring in `App.jsx` and `FriendsPage.jsx`, its dead CSS, its 74
`comparar.*` translation keys in both locales, and the helper export the modal was the last
consumer of.

## Problem and why

The user reported that pressing "Comparación completa" in `/amigos` and then the back arrow
resurfaces an old modal that should no longer exist. The cause was a state leak across two
render branches, not navigation:

1. `FriendsPage` ("Comparación completa") called `onAbrirModal`, wired in `App.jsx` to
   `setShowCompareModal(true)`.
2. The modal rendered only in the main tree. The `/amigos` branch returns early and never
   mounted it, so the click armed state invisibly.
3. The back arrow ran `onBack -> irA('/')` -> `setEnAmigos(false)`. The main tree mounted
   with `showCompareModal` still true, and the legacy modal popped up.

The legacy modal was also unreachable on purpose: `setShowCompareModal(true)` existed in one
place only (that button), the header radar button already routed to `/amigos`, and the modal
itself pushed to the page ("Página completa"). Nothing else in `src`, `tests`, or `scripts`
referenced it.

Decision (user, 2026-10-08): delete it, do not just cut the leak.

## Authorized scope and constraints

- Delete `src/components/FriendCompareModal.jsx` and all its wiring, CSS, i18n, and the
  helper export it alone consumed.
- Do NOT touch anything shared with other components:
  - `sdm-friends__*` classes shared with `FriendsPage` stay.
  - `sdm-share-pro` base and `__header`, `__title`, `__title-wrap`, `__subtitle` are shared
    with `SharePage` and stay.
  - `useFriendRequests`, the radar/session logic, and the `?share=` token flow are untouched.
- Grouped selectors: remove only the dead member, never the whole rule.
- Code comments and UI copy stay in Spanish. This document stays in English.
- TDD: off for this change. It is a deletion with no behavior change, so there is no
  meaningful RED; functional proof is the token/CSS/i18n scans plus the suite, lint, build.
- Receipt-driven development: off (decided by global). No review was started.
- Delivery strategy: `ask-on-risk`. The forecast is far over the ~400 authored-line budget,
  but the change is deletion-dominated and slice-ready. The chain-strategy ask is due before
  any PR, not before these local commits.
- No push, PR, merge, or deploy.

## Route and forecast

- Route: delegated direct. One bounded writer performed the deletion (writer trigger: 6 files
  including a 713-line component deletion). Independent verifier: one read-only verifier
  re-derived every claim on the frozen candidate (risk tier `high`/`unassessable` from
  `gentle-ai review assess`, so the tier table required it).
- Forecast: ~1,650 authored changed lines, deletion-dominated.
- Actual: 6 files, **+5 / -1,587** on the source side, plus 1 extra i18n key and 1 helper
  export found during verification (see AMR-06).
- Slices, one work-unit commit each: **S1** code, **S2** dead CSS, **S3** i18n + helper
  export + this document.

## Task

- [x] **AMR-01 — Cut the wiring.** `src/App.jsx`: removed the lazy import, the
  `showCompareModal` state, its two references in the account-claim effect, the
  `onAbrirModal` prop, and the render block; the obsolete "la modal sigue viva en paralelo"
  comment now states that `/amigos` is the only home of the radar.
  `src/components/FriendsPage.jsx`: removed the `onAbrirModal` prop and the "Comparación
  completa" button.
- [x] **AMR-02 — Delete the legacy component.** `src/components/FriendCompareModal.jsx`
  (713 lines) deleted.
- [x] **AMR-03 — Remove the dead CSS.** 691 lines removed: the whole `.sdm-compare*` family
  with its 600px media query and the now-unreferenced `@keyframes radarPulse`, the 480px
  `.sdm-compare__body` rule, `.sdm-share-pro__close` (+ `:hover`, also in the theme block),
  `.sdm-friends__head`/`__title`/`__refresh` and their variants, and the dead member
  `.sdm-compare__waiting` inside the grouped `backdrop-filter` rule. Shared `sdm-friends__*`
  and `sdm-share-pro` rules were preserved.
- [x] **AMR-04 — Drop the `comparar.*` keys.** All 74 removed from both locales.
- [x] **AMR-05 — Verify and commit as three work units.** Checks below; three Conventional
  Commits on the feature branch.
- [x] **AMR-06 — Close the orphans found in verification.** Removed
  `amigos.comparacionCompleta` (the deleted button was its only consumer) from both locales,
  and deleted the now-dead `generatePermanentFriendUrl` export in
  `src/utils/friendCode.js`, whose only consumer was the deleted modal.

## Evidence and disposition

Delegated writer, then one independent read-only verifier on the frozen candidate.

Checks (node --test suite, oxlint, vite build, plus deterministic scans):
- `npm test` → `# tests 232 | # pass 231 | # fail 1`. The single failure
  (`tests/fecha-lanzamiento.test.js:21`, "el CMS si puede mover el lanzamiento") is
  pre-existing: neither the test nor `src/utils/lanzamiento.js` is in the changed paths, and
  it fails deterministically with literal dates. Re-run by the parent after AMR-06: same
  result.
- `npm run lint` → exit 1, 2 errors, both `no-undef: 'process'` in
  `assets-src/marca/marca-iconos.mjs`, an untracked file from an unrelated parked
  workstream. No new diagnostic on the changed files.
- `npm run build` → exit 0; the `FriendCompareModal` chunk no longer appears in `dist`.
- `grep -rn "FriendCompareModal|showCompareModal|onAbrirModal" src tests scripts` → empty.
- `grep -c "sdm-compare" src/styles/index.css` → 0.
- `grep -rn "comparar\.|comparacionCompleta" src tests scripts` → empty.
- Locale parity after AMR-06: 423 keys in each file, identical sets, no duplicates.
- `index.css` braces balanced (1372/1372); no dangling comma in the two grouped selectors
  touched; no `animation:` pointing at a removed keyframe.
- Class-token scan of the deleted component (68 tokens) against the remaining
  `src/**/*.{jsx,js}`: every class that lost its CSS rule was modal-only; every class kept by
  a live component retained its rule.

Verifier verdict: all seven claims CONFIRMED (one with reservations). The parent refuted one
of its residual findings as a false positive: the `onVerEnApp &&` guard that disappeared
wrapped the deleted button (whose handler was `onAbrirModal`), not the "Vista de amigo"
button, which was already unguarded on `HEAD`. The other residual finding was accepted and
closed as AMR-06.

## Left open on purpose

- The base tree is not green: `npm test` has one pre-existing failure
  (`tests/fecha-lanzamiento.test.js`) from the manual-release guard commit, and `npm run lint`
  is red because of the untracked `assets-src/marca/` workstream. Both are unrelated to this
  change and were not touched.
- Two untracked paths belonging to other workstreams (`assets-src/marca/`,
  `odd/tasks/marca-fantasma-definitiva.md`) stay out of these commits.

## Not proven

- The live click. There is no Supabase session here, so the friend flow cannot be exercised
  end to end. "The modal no longer reappears after the back arrow" is proven structurally
  (no code path can render it, and the build drops the chunk), not in a browser.

## Relevant files

- `src/components/FriendCompareModal.jsx` — deleted.
- `src/App.jsx` — lazy import, `showCompareModal`, render block.
- `src/components/FriendsPage.jsx` — `onAbrirModal` prop and the dead button.
- `src/styles/index.css` — dead `.sdm-compare*` and modal-only `sdm-friends__*` /
  `sdm-share-pro__*` rules.
- `src/i18n/locales/es.js`, `src/i18n/locales/en.js` — 75 keys removed each.
- `src/utils/friendCode.js` — dead `generatePermanentFriendUrl` export removed.
- `tests/locale-parity.test.js` — enforces key parity between both locales.

## Next step

A live smoke pass on `/amigos`: the button is gone, the back arrow returns to the main
screen with no modal, the header radar button still reaches `/amigos`, and "Vista de amigo"
still switches the profile.
