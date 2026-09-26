# 🌌 Spritedex

> **Plataforma web interactiva para consultar, filtrar y gestionar los Espíritus (Sprites) de Fortnite**, inspirada en la interfaz de [fortnite.gg](https://fortnite.gg).

![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-11.21-F69220?style=for-the-badge&logo=pnpm&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

---

## ✨ Características principales

### 🔍 Catálogo y filtros

- **Variantes:** Basic, Gold, Gummy, Galaxy, Holofoil, Cube, Gem.
- **Familias:** Water, Earth, Fire, Air, Batman, Peely, Fishstick, Zero Point y más, agrupadas por **generación** (1ª y 2ª).
- **Rareza** y **probabilidad de drop**.
- **Ordenamiento:** rareza, drop, nombre (A-Z / Z-A) y estado de adquisición.
- **Vistas:** cuadrícula de tarjetas (_Grid_) y lista compacta (_List_).
- **No lanzados:** los ítems con `"unreleased": true` quedan ocultos hasta activar el filtro **NO LANZADOS**; su probabilidad de drop se calcula en `0`.

### 🏆 Colección y maestría

- Marcar espíritus como **poseídos** u **omitidos**.
- **Maestría del nivel 1 al 5** por espíritu.
- Persistencia local (`localStorage`) con **sincronización opcional en Supabase**.
- **Comparación con amigos** mediante códigos de amigo.
- Escritura defensiva vía `src/utils/safeStorage.js` para entornos con almacenamiento restringido.

### 📊 Exportación y uso compartido

- Generación de **tarjetas visuales en canvas** para redes sociales.
- **Copia de seguridad** de la colección en JSON (exportar / importar).
- **Códigos QR** para compartir el perfil.

### 📱 PWA

- Instalable en móvil (`public/manifest.json`, iconos y metadatos iOS).
- Diseño adaptativo (incluye barra de filtros móvil y _swiper_ de tarjetas), tema oscuro y efectos de sonido.

### 🛠️ Panel administrativo (privado)

Acceso por rutas reservadas: `/studio-override`, `/nexus-core`, `/portal-override` o `?studio=true`.

- CRUD del catálogo de espíritus y gestión de familias.
- Gestión de usuarios y de sus colecciones.
- Analítica: visitas, países, dispositivos y franjas horarias.

---

## ⚡ Inicio rápido

### Requisitos previos

- **Node.js** `^20.19.0 || >=22.12.0` (el CI usa **22**).
- **pnpm** `11.21.0` (fijado en `packageManager` de `package.json`).

### Instalación y ejecución

```bash
# 1. Clonar el repositorio
git clone git@github.com:Omarsx1/spritedex.git
cd spritedex

# 2. Instalar dependencias
pnpm install

# 3. Iniciar el servidor de desarrollo
pnpm dev
```

### Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

Sin estas variables la aplicación arranca en **modo local**: `isSupabaseConfigured` es `false`, por lo que no hay autenticación, ni sincronización de progreso, ni telemetría. El catálogo se sigue mostrando porque los datos base viven en el bundle (ver `src/utils/supabase.js`).

### Comandos disponibles

```bash
pnpm dev          # Servidor de desarrollo (Vite)
pnpm build        # Build de producción en dist/
pnpm preview      # Sirve el build de producción
pnpm lint         # Oxlint
pnpm sync-sprites # Sincroniza el catálogo desde fortnite.gg
```

---

## 📜 Scripts de datos y assets

La aplicación sirve los sprites de forma **estática** desde `public/sprites/`, sin peticiones externas en tiempo de ejecución. Para actualizar o regenerar contenido usa los scripts de `scripts/`:

| Script | Comando | Descripción |
| :--- | :--- | :--- |
| **Sincronizador** | `pnpm sync-sprites` | Scrapea fortnite.gg con Chrome headless y actualiza `src/data/` y `public/sprites/`. |
| **Descargador PNG** | `node scripts/download_all_fnsprites.cjs` | Descarga imágenes PNG oficiales y actualiza `official_sprites.json`; omite las ya descargadas. |
| **Generador SVG** | `node scripts/generate_sprite_assets.js` | Genera ilustraciones vectoriales `.svg` procedurales para prototipos y variantes. |
| **Scraper HTML** | `node scripts/fetch_sprites.cjs` | Extrae la estructura HTML de ítems de fortnite.gg en `scripts/page.html`. |
| **Traducción** | `node scripts/translate_sprites.js` | Traduce nombres y descripciones de metadatos al español. |

> `sync-sprites.js` usa `puppeteer-core`: necesita Chrome instalado o bien `PUPPETEER_EXECUTABLE_PATH` / `CHROME_PATH` apuntando al binario.

---

## 🤖 Sincronización automática del catálogo

El workflow [%%.github/workflows/sync-sprites.yml%%](.github/workflows/sync-sprites.yml) se ejecuta en GitHub Actions:

1. Scrapea fortnite.gg con Chrome headless (`node scripts/sync-sprites.js`).
2. Valida con `oxlint --deny=error` y `pnpm build`.
3. Si hay cambios en `src/data/` o `public/sprites/`, commitea como `github-actions[bot]` y mantiene `dev` y `main` sincronizadas.
4. Programación: varias revisiones los jueves y dos diarias el resto de la semana (hora local UTC-5). También acepta ejecución manual (`workflow_dispatch`).

---

## 📂 Estructura del proyecto

```text
spritedex/
├── public/                  # Assets estáticos: sprites, tipografías, iconos, manifest
│   └── sprites/             # Imágenes PNG/SVG de los espíritus
├── scripts/                 # Scraping, descarga, generación y sincronización de datos
├── src/
│   ├── assets/
│   ├── components/          # UI pública: header, filtros, tarjetas y modales
│   │   └── admin/           # Suite administrativa: catálogo, usuarios y analítica
│   ├── data/                # official_sprites.json, spritesData.js, share_sprites_order.json
│   ├── hooks/               # useDynamicSprites, useIsMobile
│   ├── styles/              # Estilos globales y temas
│   ├── utils/               # Supabase, telemetría, canvas, QR, códigos de amigo, almacenamiento
│   ├── App.jsx              # Lógica de filtros, estado y ruteo del portal administrativo
│   └── main.jsx             # Punto de entrada de React
├── supabase_schema.sql      # Tablas sprites y analytics_events, RLS y bucket de Storage
├── supabase_setup.sql       # Tabla user_collections y trigger de updated_at
└── vite.config.js
```

Para el flujo completo de datos, la convención de ítems no lanzados y el checklist de calidad al agregar espíritus, consulta [DEVELOPMENT.md](DEVELOPMENT.md).

---

## 🗄️ Backend (Supabase)

| Recurso | Uso |
| :--- | :--- |
| `public.sprites` | Catálogo editable desde el panel administrativo; sus cambios tienen prioridad sobre los datos del bundle. |
| `public.user_collections` | Estado de la colección por usuario (RLS: cada usuario accede solo a la suya). |
| `public.analytics_events` | Telemetría de uso: visitas, dispositivos, países y franjas horarias. |
| `storage: sprites-assets` | Imágenes subidas desde el CMS, con lectura pública. |

Para preparar un entorno nuevo, ejecuta `supabase_setup.sql` y `supabase_schema.sql` en el SQL Editor de Supabase.

---

## 🛠️ Tecnologías utilizadas

- **Framework:** [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/)
- **Gestor de paquetes:** pnpm
- **Backend:** [Supabase](https://supabase.com/) (Auth, Postgres, Storage)
- **Iconos:** [Lucide React](https://lucide.dev/)
- **Animación y efectos:** [GSAP](https://gsap.com/), [canvas-confetti](https://www.npmjs.com/package/canvas-confetti)
- **Diálogos:** [SweetAlert2](https://sweetalert2.github.io/)
- **Scraping (CI):** Puppeteer Core
- **Linter:** [Oxlint](https://oxc.rs/)
- **Estilos:** CSS3 nativo con temas dinámicos y diseño adaptativo

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Consulta el archivo [LICENSE](LICENSE).
