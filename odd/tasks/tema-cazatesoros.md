# Tema Cazatesoros — nueva temporada

## Objective
Finish the local Cazatesoros seasonal theme on top of the existing Spritedex brand: tropical backgrounds, parchment surfaces, and wood-framed controls, without touching the logo, the wordmark, or the app's established terminology.

Branch: `feat/tema-cazatesoros`. Delivery: local commits only. No push, PR, merge, or deploy.

## Specs

- **S1.** Activate the theme locally only. Production builds must resolve it as inactive until a separate launch decision. The preview is controlled by `?cazatesoros=0|1` and the storage key `spritedex_cazatesoros_override`, defaulting to on in development.
- **S2.** While Cazatesoros is active it takes precedence over Fortnitemares: no Halloween forest, fog, pumpkin, or violet wordmark may render at the same time.
- **S3.** Brand stays untouched. The hero keeps `FORTNITE` + `SPRITEDEX` exactly as outside the theme; there is no `CAZATESOROS` or `TESORODEX` line.
- **S4.** The ghost logo stays. Do not replace it with a pirate skull or any other mark; the earlier mockup was a suggestion, not a brand change.
- **S5.** The hero background is the supplied tropical island for desktop and the supplied beach with palms for mobile, served as WebP with no blocking first paint.
- **S6.** The two existing hero counters (`Atrapados`, `Maxeados`) become wooden plaque signs with the existing `ownedCount` and `masteredCount`. No third counter is added on desktop; the mobile `stats-bar` keeps `Total / Atrapados / Maxeados`.
- **S7.** The search field uses the parchment-and-wood treatment on desktop and mobile. Its placeholder and the status labels keep the established app copy; no seasonal renaming.
- **S8.** Sprite cards use a parchment surface with a wooden frame, ink-colored names, gold crown/mastery, and no cyber scan-line overlay. Rarity colors stay readable.
- **S9.** Filter tabs, filter pills, dropdowns, and navbar controls use the wood/parchment palette with sufficient text contrast.
- **S10.** The main content keeps the existing rolled parchment treatment, and the page below the hero remains legible and scrollable.
- **S11.** The two background assets ship optimized (WebP, under 200 KB each). Raw multi-megabyte sources never live in `public/`.

## Tasks

| ID | Specs | Route | Status | Commit |
|----|-------|-------|--------|--------|
| T1 | S1, S2 | inline | done | b7ac753 |
| T2 | S5, S11 | inline | done | 858f9fe |
| T3 | S3, S4, S6 | inline | done | 858f9fe |
| T4 | S7, S9 | inline | done | 858f9fe |
| T5 | S8 | inline | done | 858f9fe |
| T6 | S9 | inline | done | 858f9fe |
| T7 | all | inline | done | 858f9fe |

## Log

- **L1 (user, verbatim):** "[Image 1] [Image 2] optimiza nuestra web todo en local ya que vamos a preparar la app para la nueva temporada"
- **L2 (user, verbatim):** "pero todo en local"
- **L3 (decision, 2026-10-31):** Scope confirmed with the user: complete the Cazatesoros theme first. Performance optimization is out of scope for this session.
- **L4 (constraint):** Local only. No push, PR, merge, or deploy. Commits stay on `feat/tema-cazatesoros`.
- **L5 (baseline):** The branch already carried five theme commits. `src/styles/cazatesoros.css` had 68 lines covering only the parchment surface and the mobile search pill; hero, header, cards, filters, and counters were still themed for Fortnitemares/cyber.
- **L6 (user, verbatim):** "el logo no le puedes cambiar recuerda que ya tenemos una marca establecida, la imagen que te pasé al inicio solo era una sugerencia."
- **L6 (resolution):** Reverted every brand-facing change: navbar skull, three-line title, `Total` plaque, `Saqueados`/`Buscar tesoro` copy, and the i18n keys added for them. The theme is now visual-only. S3, S4, S6, and S7 were rewritten; T3 and T4 were reopened and closed again.
- **L7 (user, verbatim):** "este es el fondo de desktop y el de mobile es este: [Image 1] [Image 2]"
- **L7 (evidence):** Both attachments were recovered from the local session store: desktop 1920×1080, mobile 1056×2000. The same files were already sitting untracked in `public/` (`cazatesoros.jpg`, `cazatesorso_mob.jpg`). They now live in `design/cazatesoros/` as sources; the app ships `public/cazatesoros-fondo-desktop.webp` (185 KB) and `public/cazatesoros-fondo-mobile.webp` (179 KB, 1170×2217).
- **L8 (verification):** `npm test` 331/331 pass. `npm run lint` reports only pre-existing warnings. `npm run build` succeeds (867 prerendered pages). Headless Chrome at 1440×900 and 390×844 rendered the theme with no console or page errors; `?cazatesoros=0` fell back to the Fortnitemares theme in dev.
