-- Equipo compartido en tiempo real para el contador de cofres.
-- Ejecutar en el SQL Editor del proyecto Supabase de la app.
-- Cada usuario pertenece a un solo equipo. El equipo tiene un código de invitación.
-- Los contadores se actualizan por RPC atómica y se leen en vivo por Realtime.

create extension if not exists pgcrypto;

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null default 'Mi equipo',
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null default 'Jugador',
  total integer not null default 0 check (total >= 0),
  dias jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (team_id, user_id),
  unique (user_id)
);

create index if not exists idx_team_members_team on public.team_members(team_id);

alter table public.teams enable row level security;
alter table public.team_members enable row level security;

-- Helper security definer: evita recursion de RLS al comprobar pertenencia.
create or replace function public.pertenezco_al_equipo(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.team_members m
    where m.team_id = p_team_id and m.user_id = auth.uid()
  );
$$;

revoke all on function public.pertenezco_al_equipo(uuid) from public;
grant execute on function public.pertenezco_al_equipo(uuid) to authenticated;

drop policy if exists "equipos de mis equipos" on public.teams;
create policy "equipos de mis equipos"
  on public.teams for select
  using (public.pertenezco_al_equipo(id));

drop policy if exists "miembros de mis equipos" on public.team_members;
create policy "miembros de mis equipos"
  on public.team_members for select
  using (public.pertenezco_al_equipo(team_id));

drop policy if exists "salir de mi equipo" on public.team_members;
create policy "salir de mi equipo"
  on public.team_members for delete
  using (user_id = auth.uid());

-- Crear equipo: borra el equipo propio anterior y la pertenencia previa.
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
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  delete from public.teams where owner_id = v_uid;
  delete from public.team_members where user_id = v_uid;

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

-- Unirse por código: borra la pertenencia anterior y entra al equipo.
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
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select t.id, t.code, t.name into v_id, v_code, v_name
  from public.teams t
  where upper(t.code) = upper(trim(p_code))
  limit 1;

  if v_id is null then raise exception 'team_not_found'; end if;

  delete from public.teams where owner_id = v_uid;
  delete from public.team_members where user_id = v_uid;

  insert into public.team_members (team_id, user_id, display_name)
  values (v_id, v_uid, v_display);

  return query select v_id, v_code, v_name;
end;
$$;

-- Sumar (o restar, para deshacer) cofres del usuario en su equipo.
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
  where team_id = p_team_id and user_id = auth.uid();

  if not found then raise exception 'not_member'; end if;
end;
$$;

-- Salir: el dueño disuelve el equipo; un miembro solo borra su fila.
create or replace function public.salir_equipo(p_team_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;

  if exists (select 1 from public.teams t where t.id = p_team_id and t.owner_id = auth.uid()) then
    delete from public.teams where id = p_team_id;
  else
    delete from public.team_members where team_id = p_team_id and user_id = auth.uid();
  end if;
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

-- Realtime para ver los totales del equipo en vivo.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'team_members'
  ) then
    alter publication supabase_realtime add table public.team_members;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'teams'
  ) then
    alter publication supabase_realtime add table public.teams;
  end if;
end $$;
