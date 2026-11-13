-- Contador de cofres (Beta): historial por usuario para sincronizar entre dispositivos.
-- Ejecutar en el SQL Editor del proyecto de Supabase que usa la app.
-- Es una tabla aislada: no toca user_collections ni sprites.

create table if not exists public.chest_counters (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.chest_counters enable row level security;

drop policy if exists "contador de cofres propio" on public.chest_counters;
create policy "contador de cofres propio"
  on public.chest_counters
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
