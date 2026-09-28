# Optimizar el modal de compartir sin esperar el PNG

## Objetivo
Que al abrir la modal de compartir la captura aparezca en pantalla sin esperar la
codificación PNG, manteniendo **exactamente** la misma imagen descargada (mismos
píxeles, mismo formato al descargar).

## Problema (medido)
El profiler de Chrome sobre producción muestra que el dibujo JS de la plantilla
(~100 ms sin frenar CPU) NO es el cuello de botella. El coste está en el
rasterizado nativo + la codificación PNG de un lienzo de 1280x2515 (3,2 MP):

| Trabajo | Coste (CPU frenada) |
|---|---|
| Codificar PNG (canvas.toBlob) | 2,3 - 6,4 s (39-45% del total) |
| Resto (dibujo JS + raster) | 3,4 - 5,9 s |
| Total | 5,9 s (caliente) / 12,5 s (frío) |

Hoy la modal muestra la captura SOLO cuando el PNG ya está codificado, así que el
usuario espera la suma de todo.

## Por que
El usuario reporta ~10 s de espera para ver la captura HD en su movil. Se aprobo
reducir el trabajo de CPU en el dispositivo sin perder estilo ni calidad.

## Alcance
- src/utils/canvasExporter.js
- src/components/ShareImageModal.jsx
No se toca Supabase, ni rutas, ni datos, ni el resto de componentes.

## Checklist
- [x] T1 (canvasExporter) Devuelve `{ canvas, encode }` y expone `encodeCanvasToPng(canvas)` para codificar bajo demanda.
- [x] T2 (ShareImageModal) Pinta el canvas directamente en la vista previa en cuanto existe (contenedor propio + insercion manual del nodo).
- [x] T3 (ShareImageModal) Codifica el PNG en reposo (requestIdleCallback, timeout 1500 ms) y habilita Descargar/Compartir cuando el blob esta listo.
- [x] T4 (ambos) La cache guarda el canvas; reabrir con la misma clave pinta al instante y solo re-codifica si falta el blob.
- [x] T5 Verificacion: oxlint sin hallazgos nuevos, build correcto, medicion headless antes/despues.

## Resultado medido (CPU 20x, dist local, supabase bloqueado)
Escenario: vista previa visible (antes vs ahora) y disponibilidad del archivo.

| Metrica | Antes | Ahora |
|---|---|---|
| Captura visible | 5886 ms | **3965 ms** (-33%, -1.9 s) |
| Archivo listo | 5886 ms | 6454 ms |

El nodo de vista previa es un CANVAS de 1280x2515 (antes era un PNG ya codificado).
El trabajo total es el mismo: solo se deja de bloquear la vista con la codificacion.

## Ruta de implementacion
Inline. Motivo: es la ruta critica del pedido, el worktree lo comparte otra sesion y
el contexto del codigo ya estaba resuelto (2 archivos + 1 regla CSS acotada).

## Criterios de aceptacion
1. La captura se ve antes que hoy (debe ahorrarse el tiempo del PNG: 39-45% del total).
2. El archivo descargado es identico al de hoy (PNG, mismo canvas, mismo nombre).
3. Compartir/Descargar siguen funcionando: si el blob aun no esta, esperan a que termine, no fallan.
4. Ningun cambio visual en la captura generada.
5. Sin regresiones en el resto de la app (lint y build limpios).

## Restricciones
- NUNCA tocar la base de datos ni Supabase. Las pruebas headless deben bloquear supabase.co.
- No cambiar la resolucion del lienzo, ni el formato, ni el estilo en esta tarea.
- No reescribir los archivos completos: cambios acotados y legibles.
- Comentarios en espanol, mismo estilo que el archivo.
