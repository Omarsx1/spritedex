-- ============================================================================
-- ESPIRITUS COMPARTIDOS ENTRE AMIGOS
--
-- Un amigo puede regalarle un espiritu a otro desde la comparacion. La fila
-- nace "pending" y solo el receptor la resuelve. Registrar el espiritu en la
-- coleccion del receptor lo hace SU cliente, porque la politica de
-- user_collections solo deja escribir la propia fila.
--
-- COMO APLICARLO: pega todo esto en el SQL Editor de Supabase y dale a Run.
-- Es idempotente: se puede volver a ejecutar sin miedo.
-- ============================================================================

create table if not exists public.shared_sprites (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references auth.users(id) on delete cascade,
  from_code text not null default '',
  to_user uuid not null references auth.users(id) on delete cascade,
  to_code text not null default '',
  sprite_id text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_shared_to on public.shared_sprites (to_user, status);
create index if not exists idx_shared_from on public.shared_sprites (from_user, created_at desc);

-- Un solo envio pendiente por amigo y espiritu.
create unique index if not exists uq_shared_pending
  on public.shared_sprites (from_user, to_user, sprite_id)
  where status = 'pending';

alter table public.shared_sprites enable row level security;

drop policy if exists "shared: envio en mi nombre" on public.shared_sprites;
create policy "shared: envio en mi nombre"
  on public.shared_sprites for insert
  to authenticated
  with check (auth.uid() = from_user);

drop policy if exists "shared: leo lo mio" on public.shared_sprites;
create policy "shared: leo lo mio"
  on public.shared_sprites for select
  to authenticated
  using (auth.uid() = from_user or auth.uid() = to_user);

drop policy if exists "shared: resuelve el receptor" on public.shared_sprites;
create policy "shared: resuelve el receptor"
  on public.shared_sprites for update
  to authenticated
  using (auth.uid() = to_user)
  with check (auth.uid() = to_user);

drop policy if exists "shared: retiro el mio" on public.shared_sprites;
create policy "shared: retiro el mio"
  on public.shared_sprites for delete
  to authenticated
  using (auth.uid() = from_user);
