# Friend ficha: the comparison obeys the click

## Objective
Make the friend ficha in `/amigos` behave deterministically: clicking "Ver colección"
always opens the comparison view, the failure notice never sticks to a later success, the
redundant "Ver su colección" button disappears once that friend's collection is already on
screen, and a click stops issuing the same Supabase query twice.

## Problem and why
A read-only diagnosis on 2026-10-01 found four real defects in one flow:

1. **The value of a route is used as the trigger of an event.** The comparison tab is
   derived from `codigoFicha` and switched by `useEffect([codigoFicha])`. Clicking the same
   friend again navigates `/amigos/SDEX-XXXX` to `/amigos/SDEX-XXXX`: the value does not
   change, the effect never fires, and nothing visible happens. The first click works only
   because the route had no code before it.
2. **The failure notice sticks.** `verColeccion` assigns the notice on failure and never
   clears it, so "No pudimos ver esa colección" survives a later successful load.
3. **A no-op button stays on screen.** Inside the comparison view the ficha still renders
   "Ver su colección" for the collection that is already loaded, so the click does nothing.
4. **The same query runs twice per click.** `handleConnectFriendCode` fetches the
   collection and then sets `connectedFriendCode`, which re-triggers the loader effect on
   that dependency. That effect also owns the realtime subscription, so loading and
   subscribing are tangled in one place.

## Authorized scope and constraints
- Branch `codex/amigos-ficha-comparacion`. Do not push, open a PR, merge, or deploy.
- Touched files: `src/utils/fichaAmigo.js` (new), `tests/fichaAmigo.test.js` (new),
  `src/components/FriendsPage.jsx`, `src/App.jsx`, and this document.
- Do not touch Supabase, the RLS policies, the `?share=` token flow, or MODO AMIGO.
- Code comments and UI copy stay in Spanish, matching the surrounding code. This document
  stays in English, matching `odd/tasks/fortnitemares-seasonal-event.md`.
- Effective TDD mode: **off**, inherited from the project's most recent explicit choice
  (2026-09-30). Correct first, then test. Runner: `npm test` (`node --test`). The new pure
  rule still ships with focused tests, following the `src/utils/visitaEnlace.js` +
  `tests/visitaEnlace.test.js` precedent: the rule leaves the component so it can be proved
  without mounting the app.
- Receipt-driven development: **off** by global preference (`gentle-ai review mode status`
  reports "off (decided by global)"). Do not prompt for it and do not toggle it.
- Delivery strategy: `ask-on-risk`. The forecast is far below the 400-line budget, so no
  chained PR is expected.

## Route and forecast
- Route: delegated direct. One bounded writer implements the four fixes and runs the
  applicable checks. The parent owns this document, its Engram mirror (topic
  `odd/amigos-ficha-comparacion/tasks`), the readback, and the work-unit commit.
- Forecast: roughly 70 lines of new pure module plus tests, and 60 lines of edit across the
  two components. Well under the 400-line review budget.
- Running authored lines from work-unit commits: 0.
- Delegation evidence: writer trigger fired (two non-trivial component files plus a new
  module and its test). Mapping and exploration stayed with the parent because the
  diagnosis was already complete before authorization.

## Task
- [x] **AMF-01 — One pure rule for "this ficha is already loaded".** Add
  `src/utils/fichaAmigo.js` with `codigoNormalizado(codigo)` (strips the `SDEX-` prefix,
  non-alphanumerics and case) and `fichaYaCargada({ codigoFicha, codigoCargado, hayColeccion })`,
  which is true only when a collection is present AND both codes normalize to the same
  non-empty value. Cover it in `tests/fichaAmigo.test.js`: prefixed vs bare, lower case,
  empty loaded code, no collection, different codes.
  - Acceptance: the rule lives outside the component and `node --test` proves every branch.
- [x] **AMF-02 — FriendsPage obeys the click.** Accept a `codigoCargado` prop. In
  `verColeccion`, on success clear the notice and set the tab to `comparacion` directly
  (the click is the intent; the route is only a fallback for link visits), and on failure
  keep the existing notice. Render "Ver su colección" only while the rule says the ficha is
  not loaded yet, so a visitor arriving by link still has a way to load it, while someone
  already looking at that collection does not see a no-op button. Leave "Comparación
  completa" and "Vista de amigo" untouched.
  - Acceptance: pressing "Ver colección" on the same friend twice opens the comparison both
    times; a failed attempt followed by a successful one shows no stale notice; the button
    is gone once that friend's collection is on screen and stays for `/amigos/SDEX-XXXX`
    opened cold.
- [x] **AMF-03 — App keeps one identity for the loaded collection.** Add a single
  `codigoCargado` state, written by BOTH loaders: `handleConnectFriendCode` and the
  `?share=` token effect (cleared on disconnect). Split the tangled effect into two: the
  load effect skips the fetch when the connected code already matches `codigoCargado`, and
  a separate subscription effect reacts to the loaded owner id. Do not use
  `connectedFriendCode` as the "already loaded" signal: the token path never sets it, and a
  stale value from localStorage can disagree with what is on screen.
  - Acceptance: the same code is fetched once per click; the realtime subscription still
    opens for the loaded friend and closes when the code changes or on disconnect; the
    `?share=` visit still loads without a subscription.
- [ ] **AMF-04 — Verify and commit as one work unit.** Run the checks below, then record a
  Conventional Commit (Spanish, no AI attribution) on the feature branch and write its
  identity here as evidence.
  - Checks: `npm test` (`node --test`), `npm run lint`, `npm run build`.

## Evidence and disposition
Checks on the final bytes (2026-10-01, `codex/amigos-ficha-comparacion`):
- `npm test` → 93 tests, 93 pass, 0 fail (branch-point baseline 87; +6 new cases).
- `npm run lint` → exit 0; warnings only, all pre-existing and none on the changed lines.
- `npm run build` → exit 0, `✓ built in 640ms`.

Writer: one bounded writer implemented AMF-01..03, reported the three checks green, and
disclosed that it ran two read-only git commands against instruction. Independent verifier:
one read-only verifier re-derived the change and returned CONFIRMED WITH RESERVATIONS.
Acceptance for AMF-02 and AMF-03 is NOT proven locally: the 6 new tests cover only the pure
rule, and nothing mounts the components.

Parent correction (one, bounded) — the verifier's F1. `onVerColeccion` in `src/App.jsx`
never returned `ok`, so `FriendsPage` always received `undefined`. That deadness is
pre-existing on `HEAD`, but the new `setVista('comparacion')` turned a failed click into a
blank comparison with no message. Fixed by returning `ok`; the three checks above were
re-run after the fix.

Left open on purpose — out of the authorized scope, all pre-existing:
- Crossed data: routing to `/amigos/R` while `friendState` still belongs to a
  last-connected code `X` shows `X`'s collection under `R`'s code.
- A `?share=` visit does not suppress the last-connected load, so the token snapshot can be
  overwritten, and the new subscription effect can open realtime on a token visit.
- `codigoFicha` is read from `window.location.pathname` during render, so the ficha depends
  on an unrelated state change to re-read the route.
- `aviso` is one state shared by the copy, send and collection notices, so clearing it after
  a successful load can drop an unrelated notice.

## Known limitation of this verification
There is no local Supabase session, so the friends flow cannot be exercised end to end
here. The checks above prove the pure rule, the lint and the build; they do NOT prove the
live click. Say so plainly instead of implying a live pass.

## Relevant files
- `src/components/FriendsPage.jsx` — the ficha, its tabs, and the "Ver colección" handlers.
- `src/App.jsx` — the friend loaders, `codigoCargado`, and the realtime subscription.
- `src/utils/fichaAmigo.js` (new) — the pure "already loaded" rule.
- `src/styles/index.css:8246` — `data-vista` decides which block is visible; unchanged.

## Next step
A live smoke pass against a real Supabase session to exercise the click, the failure notice
and the subscription close on disconnect — the parts these checks cannot prove. Then decide
whether the out-of-scope findings above are worth their own change.
