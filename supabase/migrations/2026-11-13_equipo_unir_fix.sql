-- Fix: unir_equipo fallaba con "column reference id is ambiguous" por los parámetros
-- de salida (id, code, name) y las columnas de teams. La directiva use_column le dice
-- a PL/pgSQL que en una referencia ambigua gane la columna.
-- Ejecutar en el SQL Editor del proyecto Supabase de la app.

create or replace function public.unir_equipo(p_code text, p_display text)
returns table (id uuid, code text, name text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
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

  if v_old is not null and v_old <> v_id then
    perform public.salir_equipo(v_old);
  end if;

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

revoke all on function public.unir_equipo(text, text) from public;
grant execute on function public.unir_equipo(text, text) to authenticated;
