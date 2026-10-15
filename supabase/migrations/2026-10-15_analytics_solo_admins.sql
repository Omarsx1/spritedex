-- ============================================================================
-- ANALITICAS: SOLO LOS ADMINISTRADORES LEEN Y BORRAN
--
-- Hoy cualquiera con la clave anonima publica puede leer y borrar analytics_events.
-- Esta migracion cierra esas dos puertas con public.es_admin() (migracion 2026-10-02).
-- La insercion no cambia: las visitas siguen registrandose para todos.
--
-- ANTES DE APLICAR: en el SQL Editor ejecuta `select public.es_admin();` logueada con tu
-- cuenta de Google; debe devolver true. Si no, no apliques esto (el panel se quedaria vacio).
-- COMO APLICARLO: pega todo esto en el SQL Editor y dale a Run.
-- Es idempotente: se puede volver a ejecutar sin miedo.
-- ============================================================================

drop policy if exists "Lectura de analíticas para el panel" on public.analytics_events;
create policy "Lectura de analíticas para el panel"
  on public.analytics_events for select
  to authenticated
  using (public.es_admin());

drop policy if exists "Eliminación de analíticas para el panel" on public.analytics_events;
create policy "Eliminación de analíticas para el panel"
  on public.analytics_events for delete
  to authenticated
  using (public.es_admin());
