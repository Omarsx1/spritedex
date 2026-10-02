# Friend list: stop flashing empty, keep what we already know

## Objective
The friends list must not claim you have no friends while it is still loading, and it must survive leaving and re-entering `/amigos` instead of starting from zero every time.

## Problem and why
Two user-visible symptoms, one design gap each:
1. `useFriendRequests` starts with `cargando = true` and an empty list, and nothing in the UI uses `cargando`. So on every entry the page renders "AMIGOS (0)" plus the "Todavía no tienes amigos aceptados…" message while the request is in flight. That is a FALSE EMPTY STATE, not slow loading.
2. `FriendsPage` unmounts when you leave `/amigos` (App returns the page from a branch), and the hook lives inside it, so the list, the requests and the sent invites die with it. There is no cache anywhere, so every entry pays a cold network read.
3. The hook resolves the user with `supabase.auth.getUser()`, which validates the token against the server on every mount, before the list query even starts. The app only needs the user id, which lives in the local session.

## Authorized scope and constraints
- Branch `codex/amigos-ficha-comparacion` (the previous work unit is not merged yet; branching from `main` would strand it). Do not push, open a PR, or merge.
- Touched files: `src/utils/redAmigos.js` (new), `tests/redAmigos.test.js` (new), `src/hooks/useFriendRequests.js`, `src/components/FriendsPage.jsx`, `src/i18n/locales/es.js`, `src/i18n/locales/en.js`, and this document.
- Do not touch Supabase, RLS, the CSS, the realtime subscription of the collection, or MODO AMIGO. Leave the refresh button and its `cargar()` behaviour in place.
- `useFriendRequests` has TWO consumers (`FriendsPage` and `FriendCompareModal`): both must keep working with no prop changes.
- Code comments and UI copy in Spanish. This document in English.
- TDD mode: **off** (same source as the previous work unit: the project's most recent explicit choice). Correct first, then test. Runner `npm test` (`node --test`). The new cache ships with focused tests.
- Receipt-driven development: **off** by global preference. Do not prompt for it.
- Delivery: `ask-on-risk`, one work unit, no chained PR.

## Task
- [x] **AML-01 — The cached network lives outside React.** New `src/utils/redAmigos.js` with a module-level slot and three exports: `leerRed(userId)` (null without a userId, null when the slot belongs to another user, otherwise the stored `{recibidas, enviadas, amigos}`), `guardarRed(userId, red)` (ignores an empty userId, otherwise replaces the slot; the newest read always wins), and nothing else. Prove it in `tests/redAmigos.test.js`: empty slot, same user returns the last save, another user returns null, no userId returns null, and a second save replaces the first.
  - Acceptance: the rule is pure, outside React, and `node --test` proves every branch.
- [x] **AML-02 — The hook stops lying and stops starting cold.** In `src/hooks/useFriendRequests.js`: read the session with `getSession()` instead of `getUser()`; add `const [cargado, setCargado] = useState(false)` (a network answer has arrived); on mount, when `leerRed(yo.id)` has something, paint it immediately, set `cargado` true and revalidate with `cargar({ silencioso: true })` so the list does not blink; otherwise `cargar()` as today. `cargar` gains that options argument, sets `cargado` true only on a successful read, always clears `cargando` in `finally`, and must set `cargando` false and return early when there is no session (today it returns leaving the flag true forever). Every successful read also calls `guardarRed(yo.id, red)`. Expose `cargado` from the hook.
  - Acceptance: with a session and a previous read, re-entering the page shows the list instantly and refreshes behind; with no cached read the hook reports `cargado === false` until an answer arrives; without a session `cargando` ends false.
- [x] **AML-03 — The page tells the truth while it waits.** In `FriendsPage`, inside the AMIGOS group: while `!radar.cargado && radar.cargando` render the loading hint `t('amigos.cargandoRed')` instead of the "no friends yet" message; otherwise keep today's behaviour. Add the key `amigos.cargandoRed` to BOTH `src/i18n/locales/es.js` and `src/i18n/locales/en.js` ("Cargando tu red…" / "Loading your network…"). Do not add any other key.
  - Acceptance: a cold entry never shows "Todavía no tienes amigos aceptados" before the first answer; a manual refresh and a re-entry with cached data never show the loading line.
- [x] **AML-04 — Verify and commit as one work unit.** Run the checks below, then record a Conventional Commit (Spanish, no AI attribution) and write its identity here.
  - Checks: `npm test`, `npm run lint`, `npm run build`.
  - Commit: `c4bc12380c47e05e4238ce683bbec12d201d4313` — `fix(amigos)`, 7 files,
    +189 / -13, on `codex/amigos-ficha-comparacion`.

## Evidence and disposition
Checks on the final bytes (2026-10-01, `codex/amigos-ficha-comparacion`):
- `npm test` → 98 tests, 98 pass, 0 fail (work-unit baseline 93; +5 cache cases).
- `npm run lint` → exit 0; no warning on a touched line.
- `npm run build` → exit 0.

Writer: one bounded writer implemented AML-01..03 and reported the three checks green.
Independent verifier: one read-only verifier returned CONFIRMED WITH RESERVATIONS and found
that the work unit closed only ONE of the three paths where the AMIGOS group asserted
something it had not verified. Nothing end to end is proven: there is no local Supabase
session and no test mounts the hook or the page.

Parent correction (one, bounded) — the verifier findings A, B and G:
- The session-resolution window still showed "Todavía no tienes amigos aceptados". The group
  now tells four states apart: a failed read, still waiting (including while the session
  resolves), no friends, and the list. `sesionLista` and `fallo` were added to the hook for
  that, with `amigos.noSePudoLeerRed` as the new key in both locales.
- `leerRed` now returns copies, so a caller cannot mutate the cached network from outside.
The three checks were re-run after the correction.

Left open on purpose, reported to the user:
- `getSession()` no longer validates the token server-side, so a revoked session shows the
  friend UI and fails on the first read instead of reporting no session.
- Across two tabs, one tab read can run under another account token and store an empty
  network under the old key: the cache turns a transient stale render into a persisted one.
- The refresh button stays enabled during the silent revalidation, so two concurrent reads
  can race and the slower one wins.
- `FriendCompareModal` shares the hook and still shows "no friends yet" while loading.
- `tests/redAmigos.test.js` depends on declaration order (the slot is a process singleton).

## Known limitation
There is no local Supabase session, so the cached re-entry and the silent revalidation cannot be exercised end to end here. The checks prove the pure cache, the lint and the build; they do NOT prove the live behaviour.

## Relevant files
- `src/hooks/useFriendRequests.js` — the hook, its two consumers, and the new cache.
- `src/utils/redAmigos.js` (new) — the module-level slot.
- `src/components/FriendsPage.jsx` — the AMIGOS group and its empty state.
- `tests/locale-parity.test.js` — fails if a key lands in only one locale.

## Next step
A live smoke pass on a real session: a cold entry with no cache, a re-entry with cache, and a
failed read. Then decide which of the open findings deserve their own change.
