# 🌌 Spritedex

> **Plataforma interactiva y coleccionador visual para consultar, filtrar y gestionar Sprites de Fortnite inspirada en la interfaz oficial de fortnite.gg.**

![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-11.2-F69220?style=for-the-badge&logo=pnpm&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.style=for-the-badge)

---

## ✨ Características Principales

* 🔍 **Filtros Avanzados e Inspección:**
  * **Variante / Base:** Basic, Gold, Gummy, Galaxy, Holofoil, Cube, Gem.
  * **Familia de Sprites:** Filtra por colecciones (Batman, Water, Earth, Peely, Fishstick, Zero Point, etc.).
  * **Ordenamiento Dinámico:** Por Rareza, Probabilidad de Drop, Nombre (A-Z / Z-A), Estado de Adquisición (Poseídos / Faltantes).
  * **Modos de Vista:** Conmutación entre vista en cuadrícula de tarjetas (*Grid*) y vista compacta de lista (*List*).

* 🏆 **Seguimiento de Colección y Maestría:**
  * Marcar Sprites como **Poseídos** u **Omitidos**.
  * Sistema de niveles de maestría del Nivel 1 al 5.
  * Persistencia de datos mediante `localStorage` para guardar el progreso del usuario.

* 📊 **Exportación e Importación:**
  * **Compartir Colección:** Generación de tarjetas visuales en canvas para compartir en redes sociales.
  * **Copia de Seguridad (Backup):** Exportación e importación de la colección en formato JSON.

---

## ⚡ Inicio Rápido

### Requisitos Previos
* **Node.js** v18+ 
* **pnpm** (o npm / yarn)

### Instalación y Ejecución

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/spritedex.git
cd spritedex

# 2. Instalar dependencias
pnpm install

# 3. Iniciar el servidor de desarrollo
pnpm dev

# 4. Compilar para producción
pnpm build
```

---

## 📂 Estructura del Proyecto

```text
spritedex/
├── public/
│   └── sprites/               # Imágenes estáticas (.png / .svg) de los Sprites
├── scripts/                   # Scripts en Node.js para scraping, descarga y generación
│   ├── download_all_fnsprites.cjs  # Descarga PNGs oficiales evitando duplicados
│   ├── fetch_sprites.cjs           # Scraping de HTML de datos de Sprites
│   ├── generate_sprite_assets.js   # Generador procedural de SVGs vectoriales
│   ├── translate_sprites.js        # Traductor de metadatos al español
│   └── fnsprites_data.js           # Matriz de datos base de Sprites
├── src/
│   ├── components/            # Componentes React (Header, FilterBar, Cards, Modals)
│   ├── data/                  # Base de datos local (official_sprites.json, spritesData.js)
│   ├── styles/                # Estilos globales y temas
│   ├── App.jsx                # Componente principal con lógica de filtros y estado
│   └── main.jsx               # Punto de entrada de la aplicación React
├── package.json
└── vite.config.js
```

---

## 🛠️ Flujo de Datos y Gestión de Sprites (`scripts/`)

La aplicación sirve los sprites de forma **estática** desde [`public/sprites/`](file:///Users/omarsalazar/Documents/Astro.nosync/spritedex/public/sprites/) sin realizar peticiones externas en tiempo de ejecución. 

Si necesitas actualizar o generar nuevos sprites, utiliza los scripts de la carpeta [`scripts/`](file:///Users/omarsalazar/Documents/Astro.nosync/spritedex/scripts/):

| Script | Comando | Descripción | Comportamiento con existentes |
| :--- | :--- | :--- | :--- |
| **Descargador PNG** | `node scripts/download_all_fnsprites.cjs` | Descarga imágenes PNG oficiales desde la fuente remota y actualiza `official_sprites.json`. | **Omite archivos previamente descargados** para optimizar tiempo y ancho de banda. |
| **Generador SVG** | `node scripts/generate_sprite_assets.js` | Genera proceduralmente ilustraciones vectoriales `.svg` para prototipos y variaciones de sprites. | Sobrescribe los `.svg` locales generados en `public/sprites/`. |
| **Scraper HTML** | `node scripts/fetch_sprites.cjs` | Extrae y analiza la estructura HTML de ítems de fortnite.gg. | Guarda el resultado de la extracción en `scripts/page.html`. |
| **Traducción** | `node scripts/translate_sprites.js` | Convierte nombres y descripciones de metadatos al español. | Actualiza los strings en las estructuras JS. |

---

## 🛠️ Tecnologías Utilizadas

- **Framework:** [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/)
- **Iconos:** [Lucide React](https://lucide.dev/)
- **Efectos:** [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)
- **Linter & Code Quality:** [Oxlint](https://oxc.rs/)
- **Estilos:** CSS3 nativo con temas dinámicos, gradientes y diseño adaptativo.

---

## 📄 Licencia

Este proyecto está distribuido bajo la licencia **MIT**. Consulta el archivo `LICENSE` para más información.
