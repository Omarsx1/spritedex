-- ============================================================================
-- USUARIO LIBRE: decir si un nombre esta cogido, sin filtrar nada mas
--
-- La credencial se crea como <usuario>@spritedex.gg en Supabase Auth, asi que la unicidad
-- del nombre ya la garantiza el correo. Esta funcion solo responde SI o NO mientras la
-- persona escribe: no devuelve correos, ni ids, ni cuantas cuentas hay.
--
-- SECURITY DEFINER es imprescindible: sin eso la funcion solo veria las filas de quien
-- llama (auth.users esta cerrado) y diria "libre" para nombres ya cogidos.
--
-- COMO APLICARLO: pega todo esto en el SQL Editor del proyecto y dale a Run.
-- Es idempotente (create or replace): se puede volver a ejecutar sin miedo.
-- Mientras no exista, la app simplemente no muestra el aviso de disponibilidad y deja
-- que el error del alta hable: nada se rompe.
-- ============================================================================

create or replace function public.usuario_libre(usuario text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from auth.users u
    -- Misma normalizacion que usuarioAEmail (src/utils/usuario.js): deben seguir en paso.
    where lower(u.email) = regexp_replace(lower(btrim(usuario)), '[^a-z0-9_]', '', 'g') || '@spritedex.gg'
  );
$$;

-- Solo la pueden llamar quien no tiene sesion (anon) y quien ya la tiene (authenticated).
revoke all on function public.usuario_libre(text) from public;
grant execute on function public.usuario_libre(text) to anon, authenticated;

comment on function public.usuario_libre(text) is
  'Devuelve true si <usuario>@spritedex.gg no existe todavia. No expone correos ni ids.';
