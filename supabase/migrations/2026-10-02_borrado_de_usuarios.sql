-- ============================================================================
-- BORRADO DE USUARIOS DESDE EL PANEL, SIN CLAVE DE SERVICIO EN EL NAVEGADOR
--
-- Quien puede borrar lo decide la BASE, no el boton: la funcion solo actua si quien llama
-- esta en la tabla admins. El panel solo pinta el boton; aunque alguien lo manipulase, no
-- podria borrar nada. La clave de servicio nunca sale del panel de Supabase.
--
-- COMO APLICARLO: pega todo esto en el SQL Editor y dale a Run.
-- Es idempotente: se puede volver a ejecutar sin miedo.
-- ============================================================================

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nota text,
  creado_en timestamptz not null default now()
);

create table if not exists public.admin_borrados (
  id bigserial primary key,
  admin_id uuid not null,
  objetivo_id uuid not null,
  codigo text,
  marcados int,
  snapshot jsonb,
  borrado_en timestamptz not null default now()
);

alter table public.admins enable row level security;
alter table public.admin_borrados enable row level security;
-- A proposito SIN politicas: nadie entra por la API. Solo las funciones de abajo, que son
-- SECURITY DEFINER, pueden leerlas.

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

create or replace function public.borrar_usuario(objetivo uuid, confirmacion text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  fila record;
  marcados int;
  codigo text;
  yo uuid := auth.uid();
begin
  if not public.es_admin() then
    raise exception 'Solo un administrador puede borrar usuarios.';
  end if;
  if objetivo = yo then
    raise exception 'No puedes borrarte a ti mismo.';
  end if;

  select c.friend_code, c.user_state
    into fila
    from public.user_collections c
   where c.user_id = objetivo;

  if not found then
    delete from auth.users where id = objetivo;
    return 'borrado sin coleccion';
  end if;

  codigo := fila.friend_code;
  select count(*) into marcados
    from jsonb_each(fila.user_state) e
   where e.key <> '_profile' and (e.value->>'owned')::boolean;

  -- Doble candado: hay que escribir el codigo exacto, y nadie con una coleccion de verdad
  -- se borra por un clic. Esos se borran a mano desde el SQL Editor, a proposito.
  if upper(btrim(coalesce(confirmacion, ''))) <> upper(btrim(coalesce(codigo, ''))) then
    raise exception 'La confirmacion no coincide con el codigo del usuario (%).', codigo;
  end if;
  if marcados >= 30 then
    raise exception 'Ese usuario tiene % espiritus marcados. Borralo desde el SQL Editor si de verdad quieres.', marcados;
  end if;

  -- El borrado deja rastro y copia: la papelera es esta misma tabla.
  insert into public.admin_borrados (admin_id, objetivo_id, codigo, marcados, snapshot)
  values (yo, objetivo, codigo, marcados, fila.user_state);

  delete from auth.users where id = objetivo;   -- su coleccion cae en cascada
  return 'borrado';
end;
$$;

revoke all on function public.borrar_usuario(uuid, text) from public;
grant execute on function public.borrar_usuario(uuid, text) to authenticated;   -- nunca a anon
revoke all on function public.es_admin() from public;

-- ---------------------------------------------------------------------------
-- TU CUENTA COMO ADMINISTRADORA (descomenta y ejecuta cuando quieras):
-- insert into public.admins (user_id, nota) values ('3cdba9b8-5663-4aa0-b923-f15b9d07f7ca', 'Omar')
--   on conflict (user_id) do nothing;
-- ---------------------------------------------------------------------------

comment on function public.borrar_usuario(uuid, text) is
  'Borra una identidad si quien llama esta en admins, el codigo coincide y el objetivo tiene menos de 30 marcados. Deja copia en admin_borrados.';

