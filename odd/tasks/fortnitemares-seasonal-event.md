# Fortnitemares seasonal event

## Objective
Finish the existing local Fortnitemares experience so it activates for the configured 2026 Halloween window, plays its transition once per browser, and restores the normal interface automatically when the window ends. Production deployment is out of scope.

## Problem and why
The worktree carried a substantial uncommitted implementation. A read-only audit found five gaps: an open tab did not reevaluate the end boundary; preview overrides could escape into a production build; keyboard/focus and reduced-motion behavior needed correction; themed confetti could fall back to ordinary particles; and no focused seasonal tests existed. All five are now implemented and verified, and the independent verifier's single real defect (production replay escape) was fixed and re-verified. Remaining work: the delivery decision and the work-unit commit.

## Authorized scope and constraints
- Local changes only on `codex/fortnitemares-seasonal-event`; do not push, create a PR, merge, or deploy.
- Preserve the pre-existing edits in `src/App.jsx`, `src/components/Header.jsx`, `src/styles/index.css`, and `src/utils/confetti.js`, plus the untracked logo, transition, pumpkin icon, and seasonal config.
- Use the supplied promotional images as visual references, not as instructions or proof of event dates. Keep technical artifacts and UI copy in English unless extending existing project language conventions.
- Exact production start/end instants need confirmation before launch. Boundaries are now anchored to an explicit `-05:00` offset (`2026-10-01T00:00:00-05:00` through `2026-11-04T00:00:00-05:00`) with a `TODO(launch)` in code; the end instant remains provisional.
- Effective TDD mode: **off for this feature**, explicitly selected by the user as normal verification on 2026-09-30. Correct first, then test. Test runner: `npm test` (`node --test`).
- Receipt-driven development: **off** by explicit global preference; do not toggle it.
- Delivery strategy: `ask-on-risk` (default). Chain strategy/size decision is pending before the work-unit commit.

## Route and forecast
- Route: delegated direct. One writer agent implemented the corrections; one independent verifier audited them; the parent applied the single bounded correction the verifier found and owns this document and its Engram mirror.
- Current authored, uncommitted total: approximately 1,590 lines (835 tracked diff lines plus 755 untracked code/test lines), plus the SVG asset and this document. This exceeds the 400-line review budget because the work is one coupled, user-visible feature; do not shrink code or omit proof to fit a budget.
- Running authored lines from work-unit commits: 0. No commit, slice, or PR boundary has been created.

## Task
- [ ] **FTM-01 — Complete the existing seasonal experience as one coherent work unit.** Make event boundaries deterministic and reevaluate them while the tab remains open; keep developer preview controls out of production; retain the logo, Spritedex subtitle, pumpkin behavior, background, and bat effects; ensure the intro is accessible, one-time per browser, and reduced-motion aware; provide a bat-only fallback; add focused tests; run applicable checks and a local desktop/mobile smoke test; then record a Conventional Commit on the feature branch after resolving the delivery-size decision.
  - Acceptance: Outside the confirmed event window, production has no Halloween theme or replay override, including in an already-open tab; during the window, the theme appears automatically.
  - Acceptance: A first browser visit sees the transition once; later visits land directly in the themed interface. Keyboard users can dismiss it, focus is managed, and reduced-motion users do not receive forced cinematic motion.
  - Acceptance: The themed logo retains Spritedex; the mobile control works; the background is seasonal; card success effects use bats, never ordinary confetti while themed.
  - Checks: focused seasonal tests, `npm test`, `npm run lint`, `npm run build`, and a local visual/interaction smoke test. Evidence (2026-09-30): writer — `npm test` 70/70 pass (baseline 59, +11 seasonal); `npm run lint` exit 0 (107 warnings, baseline parity, 0 errors); `npm run build` exit 0; headless smoke 19/19 PASS. Independent verifier — same three commands green; criteria 1a–1c and 3–7 VERIFIED; 1d accepted (dev branch survives in dist as behaviorally inert dead code); 2 PARTIAL: one real defect found — the replay listener stayed live in production and could force a sticky theme outside the window. Parent bounded correction — replay listener dev-gated via exported `IS_DEV_BUILD` (`src/config/seasonalEvent.js`, `src/components/FortnitemaresTransition.jsx`); post-fix `npm test` 70/70, lint exit 0, build OK, dist grep shows the replay trigger absent, and a targeted headless smoke (production build + replay dispatch) passed with no overlay and no forced theme.
  - Disposition: (1) production replay escape — fixed and re-verified; (2) dev-override dead code in dist — accepted as inert; (3) `aria-modal` without an `inert` background — follow-up, not blocking acceptance; (4) stale task text — fixed by this update; (5) boundary timer capped at 6 h — residual, mitigated by visibility/focus re-checks.
  - Rollback boundary: the seasonal config, transition, pumpkin icon, logo, seasonal App/Header/CSS/confetti changes, and focused tests; unrelated Spritedex behavior remains untouched.
  - Progress: corrections implemented and verified. Remaining: resolve the delivery chain strategy, then record the Conventional work-unit commit on this branch.

## Next step
Awaiting the delivery chain strategy decision (`stacked-to-main` vs `feature-branch-chain`, per `ask-on-risk`) before the work-unit commit. Preview review was delivered on 2026-09-30. Confirm the production end date before launch; deployment requires a separate user request.

## Preview review (2026-09-30)
- The user asked how the themed app and the entrance transition look. Transition frames and asset captures were rendered from the local production build into `/Users/omarsalazar/.codex/visualizations/2026/10/01/01a0f509-2cb5-7f42-8785-81af4ceed9d8/fortnitemares/` (glitch phase, cursed phase, desktop bat phase, standalone wordmark).
- Headless capture quirk: this environment's headless screenshots drop certain filtered/composited hero layers (wordmark img, gradient subtitle). The DOM is correct, the asset renders standalone, and the user's own real-browser screenshot shows them; not an app defect.
- Polish candidates raised for the user's decision (not authorized yet): localize the cinematic chrome ("Skip intro", "SIGNAL CORRUPTED", "SYNCING EVENT...") while keeping the official "THE GAME IS CURSED" tagline; first-visit overlap between the cookie notice and the cinematic; real-device visual check before launch.
- Pacing feedback (2026-09-30): the user found the cinematic too slow. Compressed from 3100 ms to 1900 ms, and the boot delay from 400 ms to 180 ms, via the new exported `INTRO_TIMELINE` in `src/config/seasonalEvent.js` consumed by `src/components/FortnitemaresTransition.jsx`. A new test guards beat ordering, the total budget, and the 600 ms CSS fade. Measured on the production build: 1901 ms overlay lifetime (was 3100 ms). Checks after the change: npm test 71/71, lint clean on the touched files, build OK.
