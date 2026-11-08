# Monetización — propuesta de trabajo

> Estado: **propuesta, sin implementar**. Se trabaja más adelante.
> Fecha: 2026-11-08

Objetivo: generar ingresos sin dañar la experiencia. En este tamaño de proyecto el
resultado realista es "pagar algunas comidas", no un sueldo; el mayor lever es
tráfico y retención, no apretar más la monetización.

---

## 1. Principios

- **Los datos del juego son gratis.** La colección, las fichas, el tracking y las
  alertas no se pagan nunca: es lo que se usa a diario.
- **Se monetiza lo cosmético/personal**: insignias, temas de lona, ausencia de
  anuncios, acceso anticipado.
- **Nada de interstitials, pop-ups, anuncios en la lona que se comparte ni vídeo
  automático.**
- **Medir antes de tocar.** Sin números de tráfico no se decide.
- **Cumplimiento primero**: Epic es dueño de la IP, la audiencia incluye menores y
  hoy ya existe aviso de no afiliación.

---

## 2. Activos que ya existen

| Activo | Dónde | Para qué sirve |
|---|---|---|
| Telemetría propia con opt-out | `src/utils/telemetry.js`, tabla `analytics_events` | Medir visitas, países y recurrencia sin Google |
| Insights de audiencia | `src/components/admin/AudienceInsightsView.jsx` | Ver el tráfico antes de decidir |
| 972 páginas prerenderizadas (SEO) | `scripts/prerender-seo.mjs`, `verificar-seo.mjs` | Volumen orgánico y "contenido" para aprobar AdSense |
| 3 idiomas (es / en / pt-BR) | `src/i18n/locales` | CPM más alto en inglés |
| Lona para compartir con marca | `src/utils/canvasExporter.js` | Bucle viral gratuito |
| PWA instalable | `public/`, manifest | Retención |
| Consentimiento de cookies con toggles | `PrivacyNotice.jsx`, `PrivacyPolicyModal.jsx` | Base legal para publicidad |
| Aviso de no afiliación a Epic | menú/footer | Protección legal |

---

## 3. Opciones, de menor a mayor daño

### 3.1 Donaciones / "supporter" — empezar aquí

- **Qué**: Ko-fi o Buy Me a Coffee en el footer y una tarjeta discreta en Ajustes.
- **Perks**: insignia en la lona compartida, sin anuncios, temas de lona, acceso
  anticipado a funciones. Precio sugerido: 2–3 USD/mes o 5 USD pago único.
- **Daño UX**: prácticamente cero (nunca interrumpe).
- **Esfuerzo**: bajo.
- **Techo**: bajo-medio. Con ~2.000 activos mensuales, 1–2 % de conversión son
  5–20 supporters.

### 3.2 Afiliados contextuales

- **Qué**: Amazon Afiliados en las guías ("mejor mouse/teclado/headset para
  Fortnite"), nunca en la colección ni en modales.
- **Daño UX**: cero si es contextual y con disclosure.
- **Esfuerzo**: bajo.
- **Techo**: bajo (comisión típica de 3 %). Pasivo y acumulativo.
- **Evitar**: V-Bucks, cuentas, keys y resellers (estafas + ToS de Epic).

### 3.3 Un solo anuncio display

- **Qué**: un bloque (AdSense o Ezoic) debajo de la grilla o dentro de una ficha,
  con carga diferida después del LCP.
- **Daño UX**: medio. Debe respetar el presupuesto de rendimiento
  (`perf/budget.json`: LCP ≤ 1700 ms a 4G) y no moverse al cargar (CLS).
- **Esfuerzo**: medio (alta de cuenta, consentimiento, pruebas de rendimiento).
- **Techo**: depende del tráfico. Referencia: 10k páginas vistas/mes en LATAM ≈
  5–20 USD; el tráfico en inglés paga más.
- **Riesgo**: AdSense puede rechazar por "contenido de bajo valor" si solo ve
  fichas de datos. Las guías y novedades ayudan.
- **Reglas**: nunca en la lona compartida, nunca interstitial, nunca sticky, nunca
  anuncios personalizados para menores.

### 3.4 Patrocinio de comunidad

- **Qué**: un bloque "patrocinado por" vendido a creadores, Discords o marcas
  pequeñas.
- **Daño UX**: bajo si es un bloque fijo y honesto.
- **Esfuerzo**: manual (contacto y facturación).
- **Techo**: 20–100 USD/mes al inicio.

### Descartado

- Paywall de la colección o de datos del juego.
- Vender datos de usuarios.
- Crypto/NFT y "pases" especulativos.
- Pop-ups, interstitials y anuncios que tapen la app.

---

## 4. Plan de 30 días (cuando se retome)

- [ ] **Semana 1 — medir**: revisar `analytics_events` (visitas/mes, países,
      recurrencia, tiempo de sesión). Abrir Ko-fi y definir los perks.
- [ ] **Semana 2 — apoyo**: link en footer + tarjeta en Ajustes + página de
      supporter. Añadir categoría "publicidad" al consentimiento de cookies.
- [ ] **Semana 3 — anuncio**: aplicar a AdSense o Ezoic, montar **un** bloque
      diferido y verificar el budget de rendimiento en móvil.
- [ ] **Semana 4 — afiliados y evaluación**: 3–5 enlaces contextuales en guías,
      medir clics y decidir si se escala.

---

## 5. Métricas a vigilar

- Visitas/mes y países (deciden el RPM).
- Recurrencia y tiempo de sesión.
- Conversión a supporter y bajas.
- CTR de afiliados.
- RPM del anuncio y **LCP móvil** (no romper `perf/budget.json`).
- Quejas o caídas de uso tras cada cambio.

---

## 6. Legal y operativo

- Mantener visible el aviso de **no afiliación a Epic**; no usar logos de Epic en
  anuncios ni vender assets del juego.
- Consentimiento explícito para publicidad (categoría propia en los toggles) y
  CMP para EEA/UK.
- Disclosure de afiliados en las guías.
- Menores: evitar anuncios personalizados; contenido apto.
- Impuestos (Perú): declarar los ingresos de Ko-fi/PayPal; consultar contador.

---

## 7. Números de referencia (órdenes de magnitud)

| Tráfico mensual | Anuncios | Donaciones | Afiliados | Total |
|---|---|---|---|---|
| ~10k páginas vistas | 5–20 USD | 10–50 USD | 5–30 USD | 20–100 USD |
| ~100k páginas vistas | 50–200 USD | 100–500 USD | 50–300 USD | 200–1.000 USD |

---

## 8. Decisiones pendientes

- Ko-fi vs Buy Me a Coffee.
- AdSense vs Ezoic (y si el sitio califica).
- Precio y perks exactos del supporter.
- Ubicación exacta del único bloque de anuncio.
