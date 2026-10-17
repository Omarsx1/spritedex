# Beta de reconocimiento de imagenes (camara -> inventario de espiritus)

Objetivo: el usuario apunta con la camara a su inventario de espiritus en Fortnite y la app
reconoce los que tiene atrapados y los marca en la app. Detras de un flag beta.

Rama: por decidir. Entrega: ask-on-risk. Pruebas: por definir.

## Contexto y decision (2026-10-15)

- Peticion original: "dime hay alguna forma gratuita para una opcion beta de reconocimiento de
  imagenes digamos el usuario apunta con su camara en su inventario en Fortnite entonces la app
  reconoce los que tiene atrapados y los marca en la app".
- Restriccion: "si, y debemos usar servicios gratuitos".
- Via elegida: reconocimiento **en el navegador** (OpenCV.js o TensorFlow.js). Gratis, sin
  servidor, sin APIs de pago y sin enviar fotos de los usuarios fuera del dispositivo.
- APIs de nube (Google Vision, AWS Rekognition, Azure AI Vision) **descartadas**: las cuotas
  gratuitas salieron de fuentes secundarias o contradictorias; ademas etiquetan objetos
  genericos (personaje, juguete), no espiritus de Fortnite; y mandar capturas de usuarios a un
  tercero es un proceso de datos nuevo que hoy no existe en la app.
- Enfoque inicial: coincidencia de **plantillas/features** contra las imagenes de espiritus que
  ya tiene el proyecto.

## Activos disponibles

- `public/sprites/thumbs/`: 285 miniaturas 448x448, RGBA con fondo transparente. Sirven como
  referencia de comparacion sin preparar nada.
- Collage 256x256 por espiritu.
- Prueba real: `public/Repo img/` (16 fotos/capturas de la pantalla de coleccion del juego:
  mezcla de foto hecha a una tele y captura movil, 720x1280 hasta 2712x1220).

## Riesgo principal

- Precision con fotos de camara: reflejos, angulo y brillo/moire de la pantalla. Hay que medir
  con una muestra real antes de prometer nada.

## Tareas

- T1 [en curso] Prototipo de medida offline con OpenCV (fuera del repo): etiquetar que espiritus
  se ven en cada captura de `public/Repo img/` y medir la tasa de acierto de la coincidencia.
  Entorno montado (OpenCV 5 headless en un entorno temporal fuera del repo). Primeros
  experimentos hechos; ver L2.
- T2 [pendiente] Implementar el reconocimiento en el navegador (OpenCV.js), detras de un flag beta.
- T3 [pendiente] Flujo de UI: captura con la camara -> propuesta de marcado -> confirmacion del usuario.

## Log

- L1 (2026-10-15): se investigaron via libre en navegador y cuotas de APIs de nube; se eligio
  on-device. Se verifico que los 285 espiritus tienen miniatura y collage RGBA. Quedo pendiente
  montar el entorno (no habia OpenCV en el sistema) y etiquetar las capturas. Este documento se
  crea a posteriori porque el plan solo vivia en el chat.
- L2 (2026-10-15): entorno montado y primeros experimentos sobre `desktop.jpg` (captura limpia del
  grid). Hallazgos: (1) la coincidencia de plantilla directa y multi-escala sobre la captura
  completa NO discrimina: 285 plantillas puntuan 0.98-0.99 y varias caen en el mismo pixel (se
  engancha al brillo, no a la forma); (2) la deteccion de cartas por luminancia encuentra cartas
  de ~90x100 en una rejilla regular (x~89/187/296/405, y~199/321/430) pero el fondo claro se
  fusiona entre cartas vecinas; (3) la deteccion por saturacion falla porque el escenario del
  juego es tan saturado como los sprites y todo se une en una mancha; (4) comparar en escala de
  grises pierde el color, que es el discriminante principal (naranja/azul/verde/purpura) -> hay
  que comparar en color (histograma H-S). Bloqueo de fondo: medir acierto exige etiquetas por
  celda, que son manuales. Los scripts del prototipo viven en un entorno temporal fuera del repo,
  no en el proyecto.
