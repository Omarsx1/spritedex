-- ============================================================================
-- CODIGOS DE AMIGO: que los garantice la base, no el navegador
--
-- El codigo de amigo es la identidad publica de una cuenta. Hasta hoy la inventaba el
-- cliente (la derivaba en JS, adoptaba la de la base y la reescribia al guardar) y la base
-- aceptaba NULL y repetidos. Estado medido el 2026-09-30: 6 cuentas SIN codigo y 3
-- compartiendo SDEX-3CDB (dos de ellas ajenas a ese codigo).
--
-- ESTE SCRIPT NO BORRA NADA. Solo reasigna codigos donde faltan o donde chocan: el
-- progreso (user_state), el perfil y el token de compartir quedan intactos.
--
-- SE EJECUTA COMO UNA TRANSACCION, para poder ensayarlo:
--   1. Pega todo esto en el SQL Editor y dale a Run.
--   2. Mira los NOTICE y las dos comprobaciones del final (tienen que dar cero).
--   3. Si todo esta bien:  commit;
--      Si algo no cuadra: rollback;   (no queda nada aplicado)
--
-- Es idempotente: se puede volver a ejecutar sin miedo.
-- ============================================================================

begin;

-- ------------------------------------------------- PASO 1: arreglar los datos que hay
do $$
declare
  fila record;
  dup record;
  base text;
  intento text;
  largo int;
begin
  -- 1a. Nadie sin codigo. Se deriva de su id (los mismos 4 caracteres que usa la app) y,
  --     si esa combinacion ya estuviera cogida, se alarga hasta encontrar una libre.
  for fila in
    select user_id from public.user_collections
    where friend_code is null or btrim(friend_code) = ''
  loop
    base := upper(substr(replace(fila.user_id::text, '-', ''), 1, 12));
    largo := 4;
    loop
      intento := 'SDEX-' || substr(base, 1, largo);
      exit when not exists (select 1 from public.user_collections c where c.friend_code = intento);
      largo := largo + 1;
    end loop;
    update public.user_collections set friend_code = intento where user_id = fila.user_id;
    raise notice 'sin codigo: % -> %', fila.user_id, intento;
  end loop;

  -- 1b. Codigos repetidos: se queda con el suyo QUIEN LO DERIVA de verdad (su id empieza
  --     por esos 4 caracteres). A los demas se les da uno libre derivado de su id. Si
  --     ninguno lo deriva, se reasignan todos: el codigo no era de nadie.
  for dup in
    select friend_code from public.user_collections
    where friend_code is not null
    group by friend_code having count(*) > 1
  loop
    for fila in
      select user_id from public.user_collections
      where friend_code = dup.friend_code
        and 'SDEX-' || upper(substr(replace(user_id::text, '-', ''), 1, 4)) is distinct from dup.friend_code
    loop
      base := upper(substr(replace(fila.user_id::text, '-', ''), 1, 12));
      largo := 4;
      loop
        intento := 'SDEX-' || substr(base, 1, largo);
        exit when not exists (select 1 from public.user_collections c where c.friend_code = intento);
        largo := largo + 1;
      end loop;
      update public.user_collections set friend_code = intento where user_id = fila.user_id;
      raise notice 'repetido %: % -> %', dup.friend_code, fila.user_id, intento;
    end loop;
  end loop;
end $$;

-- Comprobacion: las dos consultas tienen que devolver CERO filas.
select 'repetidos' as problema, friend_code, count(*) as cuentas
from public.user_collections
where friend_code is not null
group by friend_code having count(*) > 1;

select 'sin codigo' as problema, count(*) as cuentas
from public.user_collections
where friend_code is null or btrim(friend_code) = '';

-- --------------------------------------------- PASO 2: que no vuelva a pasar

-- 2a. Si un cliente intenta guardar sin codigo, lo rellena el servidor.
--     SECURITY DEFINER es imprescindible: sin eso la funcion solo veria la fila de quien
--     llama, daria por libre un codigo ya cogido y el candado del paso 2b rechazaria el
--     guardado: el usuario perderia su sincronizacion sin enterarse.
create or replace function public.asignar_codigo_de_amigo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base text;
  intento text;
  largo int := 4;
begin
  if new.friend_code is not null and btrim(new.friend_code) <> '' then
    return new;   -- respeta el codigo que ya tenga: nunca lo pisa
  end if;
  base := upper(substr(replace(new.user_id::text, '-', ''), 1, 12));
  loop
    intento := 'SDEX-' || substr(base, 1, largo);
    exit when not exists (select 1 from public.user_collections where friend_code = intento);
    largo := largo + 1;
  end loop;
  new.friend_code := intento;
  return new;
end $$;

drop trigger if exists tr_asignar_codigo_de_amigo on public.user_collections;
create trigger tr_asignar_codigo_de_amigo
before insert on public.user_collections
for each row execute function public.asignar_codigo_de_amigo();

-- 2b. El candado. A partir de aqui un codigo repetido o vacio es IMPOSIBLE, no improbable.
alter table public.user_collections alter column friend_code set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'user_collections_friend_code_unico') then
    alter table public.user_collections
      add constraint user_collections_friend_code_unico unique (friend_code);
  end if;
end $$;

-- Nada de esto se aplica hasta que decidas:
--   commit;     -> lo dejas puesto
--   rollback;   -> no queda nada
-- commit;
