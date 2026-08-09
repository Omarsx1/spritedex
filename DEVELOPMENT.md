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

## 📋 Lista de Verificación (Checklist de Calidad)

Antes de hacer commit de un nuevo Sprite o cambio en los datos:

- [ ] El `id` sigue la convención `familia_variante` (ej. `batman_gold`).
- [ ] La imagen está presente en `public/sprites/${id}.png` o `.svg`.
- [ ] El atributo `unreleased` refleja el estado real (anunciado vs disponible).
- [ ] Los filtros de búsqueda, variante y familia funcionan correctamente en la UI.
- [ ] El commit utiliza frases cortas en español y sigue la estructura por unidades de trabajo.
