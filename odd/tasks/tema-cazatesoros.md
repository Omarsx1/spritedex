# Tema Cazatesoros — nueva temporada

## Objective
Finish the local Cazatesoros seasonal theme on top of the existing Spritedex brand: tropical backgrounds, parchment surfaces, and wood-framed controls, without touching the logo, the wordmark, or the app's established terminology.

Branch: `feat/tema-cazatesoros`. Delivery: local commits only. No push, PR, merge, or deploy.

## Specs

- **S1.** Activate the theme locally only. Production builds must resolve it as inactive until a separate launch decision. The preview is controlled by `?cazatesoros=0|1` and the storage key `spritedex_cazatesoros_override`, defaulting to on in development.
- **S2.** While Cazatesoros is active it takes precedence over Fortnitemares: no Halloween forest, fog, pumpkin, or violet wordmark may render at the same time.
- **S3.** Brand stays untouched. The hero renders `FORTNITE` with the gold wordmark image (`public/fortnite-dorado.webp`, the user-supplied `Fortnite Dorado` asset) and `SPRITEDEX` as text. The glitch effect and its RGB copies are retired for this mini-season. There is no `CAZATESOROS` or `TESORODEX` line.
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
| T8 | S3 | inline | done | — |

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
- **L9 (user, verbatim):** "actualiza el logo"
- **L10 (user, verbatim):** "usa el logo que tenemos en la carpeta publick que se llama dorado, ya no usamos el efecto glitch en esta mini temporada"
- **L11 (user, verbatim):** "corrige ese brillo que está en la esquina superior izquierda de la letra E puede borrar eso que se sale de la letra?"
- **L9–L11 (resolution):** The hero `FORTNITE` line is now an image instead of text: `public/fortnite-dorado.webp` (1120×275, 66 KB). The raw sources (`fortnite-dorado.svg` 1.5 MB, `fortnite-dorado-original.webp`) moved to `assets-src/marca/` so `public/` never ships them. The glitch block, its `--tg-rgb-*` variables, both `hero-glitch-*` keyframes, and the `data-fnm-logo` themed gold treatment were deleted. The supplied raster had a black band below the wordmark (an unset `fill` rect in the SVG) and specular glints spilling outside the letters; the shipped WebP is masked to the letter silhouette and trimmed, so no glow leaves the glyphs. `SPRITEDEX` margins went from `-24px`/`-12px`/`-10px` to `2px`/`0`/`0` because the tuck was designed for text with lower padding. Verified: 331/331 tests, build OK, headless Chrome at 1440×900 and 390×844 with no console errors and the logo at the exact previous text width (560 px desktop, 350 px mobile).
- **L12 (user, verbatim):** "pero no quiero que se salga de la E como ves en la imagen ese brillo arreglalo por favoer"
- **L12 (root cause + fix):** The surviving glow was two SVG elements, not the raster: `<circle class="cls-10">` (cx 763.47, r 20.51, `mix-blend-mode: overlay`) over the final E and `<circle class="cls-11">` over the F. Removing them and re-rendering (then clipping to the base-path silhouette with a 1 px tolerance and dropping pale semi-transparent haze) leaves the E with flat gold and zero spill. The cleaned master is `assets-src/marca/fortnite-dorado-limpio.svg`; the untouched original stays next to it. The shipped asset is now 1120×274 at 65 KB. Re-verified: 331/331 tests, build OK, no console errors, and a 4× zoom of the E corner over a blue field shows no glow.
- **L13 (user, verbatim):** "que hiciste= porque las letras quedaron sin textura?"
- **L13 (root cause + fix):** Rendering the SVG with headless Chrome lost the gold-leaf grain: the SVG builds it with `mix-blend-mode: overlay/hard-light/soft-light`, and those blends do not reproduce outside the original export. The shipped asset is now derived from the user's own raster (`assets-src/marca/fortnite-dorado-original.webp`), so the texture is byte-identical to their art. The only edits are: flood-fill from the border through neutral/transparent pixels (removes the white-blue spill of the E and F while keeping interior speculars), a frequency-separation correction on the E's top-left corner (normalises the glow's low-frequency brightness while preserving the grain), and a crop to `y 43..799`. The SVG-derived `fortnite-dorado-limpio.svg` was deleted because it rendered without the blend modes. Verified with a ref-vs-shipped diff: differences fall only on 1 px letter edges, no missing glyph area. 331/331 tests, build OK, 1120×274 at 75 KB.
- **L14 (user, verbatim):** "cambialo a este color #0F1D39"
- **L14 (resolution):** The `SPRITEDEX` subtitle is now flat `#0F1D39`. The `.hero__title-line` base lost its white-to-indigo gradient and `background-clip: text` (the accent was the only consumer, and inheriting `-webkit-text-fill-color: transparent` would have made the navy invisible). The `titleShimmer` keyframes and the accent gradient were deleted; the Fortnitemares `--accent-fnm` variant points to the same flat colour. Verified in the browser: computed colour `rgb(15, 29, 57)`, no background image. 331/331 tests, build OK.
- **L15 (user, verbatim):** "en el fondo que tienen los espiritus detrás no se debe ver esas líneas rectas como si estuvirea pegado por partes todo, debe verse uniforme" / "es el pergamino que tenemos en la carpeta public"
- **L15 (root cause):** The paper was assembled from rectangular layers. `public/papiro-textura.webp` is a photographic collage with dark vertical bands inside it, so tiling it every 420–1560 px drew a straight line at every tile edge (visible both on the page and inside every sprite card). On top of that, the torn side borders were background layers that ended with a hard 96 px cut against a texture band of a different tone.
- **L15 (fix):** The page background is now one continuous surface: a lateral linear-gradient whose tones match each torn border, plus an SVG `feTurbulence` grain (seamless by construction) — no photographic tiles. The torn borders moved to `::before`/`::after` with a `mask-image` fade, so they dissolve into the paper instead of cutting it. For cards and controls, a new seamless tile `public/papiro-papel.webp` (400×400, 8 KB) was built from the paper area of `papiro.svg` render with a high-pass filter (blur 18) so the dark bands are gone; the 11 references to the old texture now point to it. The bottom roll stays at 126% width so its torn tips clear the paper edge. Verified at 1440, 390 wide: no straight seams, no console errors. 331/331 tests, build OK.
- **L16 (user, verbatim):** "no veo que se corrija" / "no puedes borrar todo ese papiro y usar por completo el svg? así o transformarlo a otro formato que puedas estirar verticalmente sin que se pierda calidad pero que se vea tal cual y no así por parte" / "pero corrige el papiro para qu se vea bien completo y las cards de los espíritus se vean dentro del papiro" / "y elimina los assets separados para que no sirvan"
- **L16 (attempt + rollback):** A single stretched sheet (`papiro-lienzo.webp`, sheet cropped from the SVG and set to `background-size: 100% 100%`) was tried and rejected: a 6× vertical stretch smeared the torn edges and the sheet's drop shadow darkened the whole surface.
- **L16 (final):** Back to a layered but seamless build. Paper = lateral gradient whose stops match each strip; strips carry the inward fade baked into the WebP (no `mask-image`), are mirrored vertically (seamless repeat) and the right strip is now a horizontal mirror of the left because the original right asset was far darker (`[139,94,47]` vs `[189,145,95]`) and dirtied the right edge. Rolls moved to `::before`/`::after` at 118% width so they can overflow the box and show their torn tips instead of being clipped straight. Inside padding keeps the sprite cards within the parchment.
- **L16 (cleanup):** Deleted `public/papiro-lienzo.webp` and `public/papiro-textura.webp`; moved the 5.8 MB `public/papiro.svg` to `assets-src/marca/papiro-fuente.svg`. `dist/` now ships only five small parchment assets (borders, papel tile, two rolls). Verified at 1440 and 390: no straight seams, torn tips visible on both rolls, cards inside the sheet, no console errors. 331/331 tests, build OK.
- **L17 (user, verbatim):** "corrige esa transferencia en los costados"
- **L17 (root cause):** The paper gradient only became opaque at 78 px while the side strips start fading at 43 px, so between those the strip faded over the page background and produced an olive/teal vertical band along both edges. The strip paper tone was also slightly off (`[200,157,107]` vs the paper's `[207,167,120]`).
- **L17 (fix):** Paper is now opaque from 38 px (26–38 px ramp), so it always sits under the strip's fade. The left strip's paper was colour-matched to the page paper with a per-channel gain and the right strip is rebuilt as its horizontal mirror. Desktop and mobile both get matched ramps (38 px / 13 px). Verified by cropping both edges at 2× at y≈2200: no band, continuous tear, no console errors. 331/331 tests, build OK.
- **L18 (user, verbatim):** "quiero que la barra de búsqueda se vea igual que la imagen 1 ese marco y las esquinas con ese punto como clavo"
- **L18 (resolution):** `.filter-search-box` became the wooden frame: 11 px padding, layered wood gradient, four metal corner plates (18×18) and four nails (10×10 radial gradient) positioned at the corners, bevel via inset shadows. The input keeps the parchment fill but loses its own border. All CSS, no new assets.
- **L19 (user, verbatim):** "Ahora solo en la versión mobile reduce el tamaño del texto FORTNITE y agranda un poco el de SPRITEDEX pero dale un poco de separación"
- **L19 (resolution):** Mobile only. `≤768`: logo `min(420px,84vw) → min(380px,78vw)`, subtitle `1.75 → 1.9rem`, `margin-top 0 → 8px`. `≤480`: logo `min(350px,90vw) → min(300px,76vw)`, subtitle `1.5 → 1.7rem`, `margin-top 0 → 8px`. Measured at 390 px: logo 296 px wide starting at 46.8, subtitle 27.2 px with an 8 px gap. Desktop untouched. 331/331 tests, build OK.
- **L20 (user, verbatim):** "para nada se parece a lo de la imagen en los dispositivos más pequeños" / "tiene que verse igual"
- **L20 (root cause):** The mobile search is a different component: `.mobile-glass-search-pill` in `MobileLiquidFilterBar.jsx`, which only had a 5 px `border-image` gradient. The desktop frame never applied there.
- **L20 (fix):** The mobile pill now uses the same recipe as desktop: 9 px wood frame (darker `#5f3b1e`), four 16 px metal corner plates, four nails 8 px inset 5 px, bevel via inset shadows, and the parchment moved to an inner layer (`calc(100% - 18px)` at `9px 9px`) so the search and filter icons sit on paper instead of on wood. Desktop was aligned to the same darker wood for consistency. Verified at 390 and 1440 by element screenshot. 331/331 tests, build OK.
- **L21 (user, verbatim):** "corrige que no esté muy salido"
- **L21 (cause + fix):** The corner plates were larger than the frame (16 px plate on a 9 px mobile frame, 17 px on a 12 px desktop frame), so their square corner jutted into the parchment and looked stuck on. Plates are now exactly the frame thickness (9 px mobile / 12 px desktop) anchored at the corner (0 0, 100% 0, …) with the nails inset 2 px / 3 px. The frame radius clips the outer corner, so the plate reads as a metal corner cap. Verified with 4× corner crops on both breakpoints. 331/331 tests, build OK.
- **L22 (user, verbatim):** "dale un poco de padding a la izquierda a la lupa"
- **L22 (fix):** `.mobile-glass-search-icon` gets `margin-left: 8px` (plus `flex-shrink: 0`), so the magnifier no longer touches the parchment edge inside the new frame. Desktop keeps its absolute `left: 22px`. 331/331 tests, build OK.
