# Portugués para Brasil y Portugal (pt-BR, pt-PT)

Objetivo: la app se ve en portugués según el navegador, con pt-BR y pt-PT como locales separadas, sin cambiar español ni inglés.
Rama: `feat/locales-pt` (desde `main` 9c61807). Entrega: `ask-on-risk`. Pruebas: `npm test` (node --test); lint: `npm run lint`; build: `npm run build`.

## Specs

- S1. La app se muestra en portugués a usuarios de Brasil. Original (L1): "puedes hacer que la app se muestre todo en portugues cuando los usuarios sean de brasil? sin afectar a los demás usuarios e idiomas?"
- S2. Locales separadas `pt-BR` y `pt-PT`. Original: "mira si tanto en brasil como en portugal no difiere el portugues es el mismo exactamente, pues implementa esto como lo harian las grandes empresas." [supuesto: se implementan ambas porque difieren en vocabulario, gramática y ortografía]
- S3. Escala como una gran empresa. Original: "implementalo, recuerda que escalamos como una gran empresa" [supuesto: incluye SEO, textos del juego y nombres de espíritus, no solo la UI]
- S4. Sin efecto en español ni inglés: rutas `/` y `/en`, textos, claves de `localStorage` y pruebas existentes en `tests/i18n.test.js` siguen iguales. [supuesto derivado de "sin afectar a los demás usuarios e idiomas"]
- S5. El idioma se decide por el navegador, nunca por país (regla existente en `core.js` y en las pruebas). `pt` genérico cae a pt-BR. [supuesto]
- S6. Prefijos de URL `/pt-br` y `/pt-pt`, con la misma lógica que `/en`. [supuesto]
- S7. Selector con tres opciones: ES, EN, PT (pt-BR y pt-PT como etiquetas distintas). [supuesto]
- S8. Paridad de claves: `pt-BR.js` y `pt-PT.js` tienen exactamente las claves de `es.js`, con los mismos marcadores `{var}`. [supuesto]
- S9. Fase posterior: SEO prerenderizado (hreflang, canonical, sitemap) para pt-BR y pt-PT.
- S10. Fase posterior: textos del juego (`src/data/i18n/textos.juego.json`) y nombres de espíritus y familias en pt. Fuente de nombres pendiente de decidir (no hay captura oficial en portugués).

## Tareas

- T1 [inline] Núcleo: `IDIOMAS`, `normalizarIdioma` (pt-* ya no cae a en), `planDeArranque`, prefijos `/pt-br` y `/pt-pt`, pruebas. Specs S4, S5, S6. Commit: `da6e5e7`.
- T2 [delegado, escritor] `src/i18n/locales/pt-BR.js` completo, paridad con `es.js`. Specs S1, S8. Commit: `ea78287`. Evidencia: 428 claves, faltan/sobran 0, marcadores iguales.
- T3 [delegado, escritor] `src/i18n/locales/pt-PT.js` completo, paridad con `es.js`, portugués europeo. Specs S2, S8. Commit: `abbc34b`. Evidencia: 428 claves, faltan/sobran 0, marcadores iguales; se corrigió "Recarregar" por "Recarregue" en `amigos.necesitasSesion`.
- T4 [inline] Registro en `locales/index.js`, selector de cuatro opciones (S7), prueba de paridad. Commit: este mismo commit. Evidencia: `npm test` 266/266, `npm run build` ok, `npm run lint` sin errores.
- T5 [pendiente] SEO para pt-BR y pt-PT (S9).
- T6 [pendiente] Textos del juego y nombres de espíritus en pt (S10).
- T7 [pendiente] Verificación en navegador: golden path pt-BR, pt-PT, y que es/en no cambian.

## Log

- L1 (2026-10-15): usuario pidió portugués para Brasil sin afectar otros idiomas (S1). Luego preguntó si pt-BR y pt-PT son iguales y pidió implementar "como lo harían las grandes empresas" (S2, S3).
- L2: verificado que pt-BR y pt-PT difieren en vocabulario (celular/telemóvel, ônibus/autocarro), gramática (gerundio vs "a + infinitivo"; você vs tu) y ortografía (AO90 aplicado más lento en PT). Fuentes: translated.com, beelinguapp.com, migaku.com.
- L3: precedente en `odd/tasks/multilenguaje.md`: es/en, 388 claves, catálogo de nombres, textos del juego, SEO. Esta feature sigue el mismo patrón.
- L4: `normalizarIdioma` hoy convierte todo lo que no es `es` en `en`; por eso pt-BR caería a inglés sin cambio.
- L5 (corrección): el "388 claves" de L3 es la cifra de `multilenguaje.md`, no de hoy. `es.js` tiene 428 claves.
- L6: pendiente de verificar en T7: los escritores afirman que "Poeira Estelar" es el término oficial de Fortnite en pt-BR. No está comprobado en esta sesión.
- L7: pendiente de decisión para T6: fuente de los nombres de espíritus en portugués (glosario propio con revisión, o fuente oficial).
