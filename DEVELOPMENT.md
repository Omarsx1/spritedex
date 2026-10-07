# 🛠️ Guía de Desarrollo y Registro de Sugerencias — Spritedex

Este documento sirve como **guía de flujo de trabajo técnico y bitácora de sugerencias para el equipo de desarrollo de Spritedex**. Aquí se documentan las convenciones de gestión de contenido, patrones de datos, manejo de ítems "No Lanzados" (*Unreleased*), adición de nuevos sprites y el registro continuo de sugerencias para el roadmap.

---

## 🎯 1. Gestión de Sprites "No Lanzados" (Unreleased / Anunciados)

### Contexto y Caso de Uso
En el ecosistema de Fortnite y redes sociales, frecuentemente se **anuncian o filtran nuevos Sprites** en plataformas como X (Twitter), Discord o Reddit antes de su lanzamiento oficial en el juego.

### Convención de Estado (`unreleased`)
Para registrar un Sprite en estado "Anunciado" sin alterar la experiencia principal de los usuarios:

1. **Definir el flag `"unreleased": true`**:
   ```json
   {
     "id": "batman_quack",
     "name": "Quack Batman",
     "theme": "Quack",
     "rarity": "Special",
     "unreleased": true
   }
   ```

2. **Efecto en la Aplicación**:
   * **Visibilidad:** Oculto por defecto en la vista general.
   * **Filtro:** Visible únicamente cuando el usuario activa la casilla **"NO LANZADOS"** en la barra de controles.
   * **Probabilidad de Drop:** El sistema la calcula automáticamente en `0%` mientras permanezca como no lanzado.

3. **Promoción a Estado Oficial (Lanzado en Juego)**:
   * Cuando el sprite se lanza oficialmente en el juego, cambiar el valor a `"unreleased": false`.

---

## ➕ 2. Flujo Paso a Paso para Agregar Nuevos Sprites

| Paso | Acción | Archivo Afectado |
| :--- | :--- | :--- |
| **1. Definir Metadatos Base** | Agregar el objeto del nuevo sprite en la lista `baseSprites`. | [`scripts/fnsprites_data.js`](file:///Users/omarsalazar/Documents/Astro.nosync/spritedex/scripts/fnsprites_data.js) |
| **2. Colocar o Generar Imagen** | Guardar la imagen como `${sprite.id}.png` o `${sprite.id}.svg`. | [`public/sprites/`](file:///Users/omarsalazar/Documents/Astro.nosync/spritedex/public/sprites/) |
| **3. Sincronizar Base de Datos** | Actualizar `official_sprites.json` con los nuevos ítems. | [`src/data/official_sprites.json`](file:///Users/omarsalazar/Documents/Astro.nosync/spritedex/src/data/official_sprites.json) |
| **4. Verificar Mapeo de Familias** | Asegurar que la familia esté mapeada en `FAMILY_NAMES_MAP`. | [`src/data/spritesData.js`](file:///Users/omarsalazar/Documents/Astro.nosync/spritedex/src/data/spritesData.js) |

---

## 💡 3. Bitácora de Sugerencias y Buenas Prácticas de Desarrollo

> [!TIP]
> **Espacio Colaborativo:** Utiliza esta sección para ir agregando comentarios, ideas o sugerencias técnicas que ayuden al equipo a mejorar la aplicación.

### 📝 Registro de Sugerencias

#### 🔹 [SUG-01] Optimización de Cargas y Caché Local de Descargas
- **Sugerencia:** Mantener la verificación `fs.existsSync` en los scripts de descarga para evitar peticiones duplicadas y no saturar servidores remotos.
- **Estado:** ✅ Implementado en `scripts/download_all_fnsprites.cjs`.

#### 🔹 [SUG-02] Fuente e Hipervínculo para Sprites Anunciados
- **Sugerencia:** Añadir un campo opcional `"sourceUrl"` en los objetos de sprites no lanzados. Esto permitirá mostrar un enlace directo a la publicación de la red social o filtración en el modal de detalle del sprite.
- **Estado:** 💡 Propuesta para el Roadmap.

#### 🔹 [SUG-03] Generador SVG para Nuevas Variantes
- **Sugerencia:** Si se añaden nuevas variantes estilizadas (ej. *Neon*, *Prismática*), incluir las definiciones de gradientes en `<defs>` dentro de `generate_sprite_assets.js` para mantener coherencia visual.
- **Estado:** 📌 Guía de mantenimiento.

#### 🔹 [SUG-04] Plantilla de Sugerencias Futuras (Copia y pega para añadir más)
```markdown
#### 🔹 [SUG-XX] Título corto de la sugerencia
- **Sugerencia:** Descripción clara de la idea o cambio propuesto.
- **Estado:** 💡 Propuesta / 🚧 En Progreso / ✅ Implementado.
```

---

## 🐛 4. Regresión: fichas que desaparecían al arrancar (Total = Atrapados)

**Síntoma (reportado en octubre de 2026):** al abrir la app, el **Total** nacía muy por debajo
del real (p. ej. 33 en 2ª Generación) o **igual a Atrapados** (116/116, 120/120) y subía a su
valor correcto (122) unos segundos después, cuando respondía Supabase. Parecía que se ocultaban
espíritus.

**Causa raíz:** `Array.map` invoca la función con `(elemento, índice)`. En el arranque había:

```js
ALL_SPRITES.map(evaluateReleaseStatus)   // 'ahora' = 0, 1, 2, ... (¡el índice!)
```

Y `evaluateReleaseStatus(sprite, ahora = Date.now())` tomaba ese índice como el instante. Con
`ahora ≈ 0`, la condición `programado = releaseTime > ahora` daba **verdadero para toda ficha con
fecha** → se marcaba como *no lanzada* y se ocultaba. El error además **se pegaba**, porque
`estadoLanzamiento` mira primero el flag `unreleased` y ya no vuelve a mirar la fecha. Solo se
corregía cuando la consulta reconstruía el estado desde cero. El mismo patrón estaba en el
refresco automático de cada 30 s.

**Arreglo (PR #26):**
- `src/hooks/useDynamicSprites.js`: los dos `.map(evaluateReleaseStatus)` pasan a
  `(s) => evaluateReleaseStatus(s)`.
- `src/utils/lanzamiento.js`: `instanteReal()` ignora un `ahora` que no sea un instante real
  (un índice, `0`…) y usa el reloj. Así el patrón no puede volver a colarse desde ningún llamador.
- `tests/lanzamiento-programado.test.js`: regresión (un índice de `Array.map` no oculta; una
  fecha futura real sí programa).

**Regla para no repetirlo:** una función con `ahora` opcional (`estadoLanzamiento`,
`evaluateReleaseStatus`, `esNovedad`, `fechaDeLanzamiento`) **nunca** se pasa directa como
callback de `.map` / `.filter` / `.forEach` / `.some` / `.find` / `.reduce`; siempre envuelta,
por ejemplo `(s) => fn(s)`.

**Qué cubre la automatización (`.github/workflows/sync-sprites.yml`):** el job corre
`pnpm test`, `npx oxlint --config .oxlintrc.json --deny=error`, `pnpm run build` y `pnpm smoke`
**antes** de commitear, y **solo** commitea `src/data/` y `public/sprites/` (nunca código). Por
eso **no puede reintroducir este bug**: el fallo estaba en el código y el workflow no publica
código; si un cambio de datos rompiera la regla, los tests tumban el job y no se sube nada.

**Dónde sigue habiendo exposición (es a propósito):** el estado de una ficha vive en los DATOS.
Poner `"unreleased": true`, o una `"release_date"` en el futuro, **oculta** la ficha: es el
mecanismo de programación, no un bug. Un dato mal puesto (una fecha futura en una ficha ya
publicada, o una marca de más) sí oculta una ficha, y **los tests no lo detectan** (validan la
regla, no cada dato). Por eso el checklist manual de abajo sigue siendo obligatorio.

---

## 📋 Lista de Verificación (Checklist de Calidad)

Antes de hacer commit de un nuevo Sprite o cambio en los datos:

- [ ] El `id` sigue la convención `familia_variante` (ej. `batman_gold`).
- [ ] La imagen está presente en `public/sprites/${id}.png` o `.svg`.
- [ ] El atributo `unreleased` refleja el estado real (anunciado vs disponible).
- [ ] Ninguna ficha ya disponible lleva `unreleased: true` ni una `release_date` futura (eso la oculta).
- [ ] Ninguna función con `ahora` opcional (`estadoLanzamiento`, `evaluateReleaseStatus`, `esNovedad`, `fechaDeLanzamiento`) se pasa directa como callback de `.map` / `.filter` / `.forEach` / `.some` / `.find`; va envuelta: `(s) => fn(s)`.
- [ ] Los filtros de búsqueda, variante y familia funcionan correctamente en la UI.
- [ ] El commit utiliza frases cortas en español y sigue la estructura por unidades de trabajo.
