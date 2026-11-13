-- Equipo compartido: historial y transferencia de propiedad.
-- Ejecutar DESPUÉS de 2026-11-13_equipos_compartidos.sql.
--
-- Cambios:
--  - team_members.left_at: null = activo; con fecha = salió y queda en el historial.
--  - team_members.joined_at: para elegir un nuevo dueño de forma estable.
--  - teams.archived_at: el equipo se archiva solo cuando no queda ningún miembro activo.
--  - Al salir el dueño, la propiedad pasa al miembro activo con más cofres.
--  - No se borran filas: los contadores de quien sale se conservan para el historial.
--  - Un usuario solo puede tener una pertenencia ACTIVA; puede tener varias históricas.

alter table public.teams add column if not exists archived_at timestamptz;
alter table public.team_members add column if not exists left_at timestamptz;
alter table public.team_members add column if not exists joined_at timestamptz not null default now();

-- La antigua unicidad por user_id impedía volver a unirse a otro equipo conservando la historia.
alter table public.team_members drop constraint if exists team_members_user_id_key;
create unique index if not exists team_members_un_activo
  on public.team_members(user_id)
  where left_at is null;

-- No se permite borrar filas directamente: salir es un soft delete por RPC.
drop policy if exists "salir de mi equipo" on public.team_members;

create or replace function public.salir_equipo(p_team_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_next uuid;
  v_activos integer;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select owner_id into v_owner from public.teams where id = p_team_id;
  if v_owner is null then return; end if;

  if not exists (
    select 1 from public.team_members
    where team_id = p_team_id and user_id = v_uid and left_at is null
  ) then
    return;
  end if;

  if v_owner = v_uid then
    select count(*) into v_activos
    from public.team_members
    where team_id = p_team_id and left_at is null and user_id <> v_uid;

    if v_activos > 0 then
      select user_id into v_next
      from public.team_members
      where team_id = p_team_id and left_at is null and user_id <> v_uid
      order by total desc, joined_at asc, user_id asc
      limit 1;

      update public.teams set owner_id = v_next where id = p_team_id;
    else
      update public.teams set archived_at = now() where id = p_team_id;
    end if;
  end if;

  update public.team_members
  set left_at = now(), updated_at = now()
  where team_id = p_team_id and user_id = v_uid and left_at is null;
end;
$$;

create or replace function public.crear_equipo(p_nombre text, p_display text)
returns table (id uuid, code text, name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_code text;
  v_name text := coalesce(nullif(trim(p_nombre), ''), 'Mi equipo');
  v_display text := coalesce(nullif(trim(p_display), ''), 'Jugador');
  v_intento integer := 0;
  v_old uuid;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select team_id into v_old
  from public.team_members
  where user_id = v_uid and left_at is null
  limit 1;

  if v_old is not null then
    perform public.salir_equipo(v_old);
  end if;

  loop
    v_intento := v_intento + 1;
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text || v_intento::text), 1, 8));
    begin
      insert into public.teams (code, name, owner_id)
      values (v_code, v_name, v_uid)
      returning teams.id into v_id;
      exit;
    exception when unique_violation then
      if v_intento >= 5 then raise; end if;
    end;
  end loop;

  insert into public.team_members (team_id, user_id, display_name)
  values (v_id, v_uid, v_display);

  return query select v_id, v_code, v_name;
end;
$$;

create or replace function public.unir_equipo(p_code text, p_display text)
returns table (id uuid, code text, name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_code text;
  v_name text;
  v_display text := coalesce(nullif(trim(p_display), ''), 'Jugador');
  v_old uuid;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select t.id, t.code, t.name into v_id, v_code, v_name
  from public.teams t
  where upper(t.code) = upper(trim(p_code))
  limit 1;

  if v_id is null then raise exception 'team_not_found'; end if;

  select team_id into v_old
  from public.team_members
  where user_id = v_uid and left_at is null
  limit 1;

  -- Si ya está en otro equipo, sale de forma segura (transfiere o archiva).
  if v_old is not null and v_old <> v_id then
    perform public.salir_equipo(v_old);
  end if;

  -- Reutiliza la fila histórica si vuelve al mismo equipo: conserva sus cofres.
  insert into public.team_members (team_id, user_id, display_name)
  values (v_id, v_uid, v_display)
  on conflict (team_id, user_id) do update
    set left_at = null,
        display_name = excluded.display_name,
        updated_at = now();

  update public.teams set archived_at = null where id = v_id;

  return query select v_id, v_code, v_name;
end;
$$;

create or replace function public.sumar_cofre_equipo(p_team_id uuid, p_delta integer, p_dia text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_delta is null or p_delta = 0 or p_delta < -1000 or p_delta > 1000 then
    raise exception 'invalid_delta';
  end if;
  if p_dia is null or p_dia !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'invalid_day';
  end if;

  update public.team_members
  set total = greatest(0, total + p_delta),
      dias = jsonb_set(
        dias,
        array[p_dia],
        to_jsonb(greatest(0, coalesce((dias->>p_dia)::integer, 0) + p_delta)),
        true
      ),
      updated_at = now()
  where team_id = p_team_id and user_id = auth.uid() and left_at is null;

  if not found then raise exception 'not_member'; end if;
end;
$$;

revoke all on function public.crear_equipo(text, text) from public;
revoke all on function public.unir_equipo(text, text) from public;
revoke all on function public.sumar_cofre_equipo(uuid, integer, text) from public;
revoke all on function public.salir_equipo(uuid) from public;
grant execute on function public.crear_equipo(text, text) to authenticated;
grant execute on function public.unir_equipo(text, text) to authenticated;
grant execute on function public.sumar_cofre_equipo(uuid, integer, text) to authenticated;
grant execute on function public.salir_equipo(uuid) to authenticated;
