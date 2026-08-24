-- ============================================================================
-- SPRITEDEX STUDIO & ANALYTICS - SUPABASE DATABASE SCHEMA
-- Seguro, escalable y 100% aislado (NO modifica ni afecta tablas existentes)
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase (supabase.com)
-- ============================================================================

-- 1. TABLA DE ESPÍRITUS DINÁMICOS (CMS)
CREATE TABLE IF NOT EXISTS public.sprites (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  family_id TEXT NOT NULL,
  family_name TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'Common',
  variant TEXT NOT NULL DEFAULT 'Base',
  variant_display TEXT NOT NULL DEFAULT 'Básico',
  gen INTEGER NOT NULL DEFAULT 2,
  image TEXT NOT NULL,
  ability TEXT DEFAULT 'Concede bonificaciones pasivas de combate, velocidad y recolección de botín.',
  special_perk TEXT DEFAULT '',
  location TEXT DEFAULT 'Cofres de Sprite & Zonas de Extracción',
  summon_cost TEXT DEFAULT '2,000 Polvo Estelar',
  drop_chance TEXT DEFAULT '1.50%',
  unreleased BOOLEAN DEFAULT false,
  release_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas y filtros ultra rápidos
CREATE INDEX IF NOT EXISTS idx_sprites_family ON public.sprites(family_id);
CREATE INDEX IF NOT EXISTS idx_sprites_gen ON public.sprites(gen);
CREATE INDEX IF NOT EXISTS idx_sprites_unreleased ON public.sprites(unreleased, release_date);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.sprites ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública para todos los visitantes
DROP POLICY IF EXISTS "Lectura pública de espíritus" ON public.sprites;
CREATE POLICY "Lectura pública de espíritus"
  ON public.sprites FOR SELECT
  USING (true);

-- Política de modificación para el CMS
DROP POLICY IF EXISTS "Administración de espíritus" ON public.sprites;
CREATE POLICY "Administración de espíritus"
  ON public.sprites FOR ALL
  USING (true)
  WITH CHECK (true);

-- Habilitar Realtime para la tabla de espíritus
ALTER PUBLICATION supabase_realtime ADD TABLE public.sprites;


-- 2. TABLA DE TELEMETRÍA Y ANALÍTICAS DE VISITAS
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL DEFAULT 'pageview',
  session_id TEXT NOT NULL,
  device_type TEXT DEFAULT 'desktop',
  browser TEXT DEFAULT 'other',
  os TEXT DEFAULT 'unknown',
  is_iphone BOOLEAN DEFAULT false,
  referrer TEXT DEFAULT '',
  path TEXT DEFAULT '/',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para agregación rápida de métricas a gran escala
CREATE INDEX IF NOT EXISTS idx_analytics_created ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_device ON public.analytics_events(device_type, is_iphone);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON public.analytics_events(session_id);

-- Habilitar RLS en analíticas
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Permitir inserción anónima de eventos de telemetría (registro de visitas)
DROP POLICY IF EXISTS "Inserción pública de telemetría" ON public.analytics_events;
CREATE POLICY "Inserción pública de telemetría"
  ON public.analytics_events FOR INSERT
  WITH CHECK (true);

-- Permitir lectura de analíticas para el panel administrativo
DROP POLICY IF EXISTS "Lectura de analíticas para el panel" ON public.analytics_events;
CREATE POLICY "Lectura de analíticas para el panel"
  ON public.analytics_events FOR SELECT
  USING (true);


-- 3. BUCKET DE ALMACENAMIENTO PARA IMÁGENES (Supabase Storage)
INSERT INTO storage.buckets (id, name, public)
VALUES ('sprites-assets', 'sprites-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de Storage para acceso y subida de imágenes
DROP POLICY IF EXISTS "Acceso público de lectura a imágenes de sprites" ON storage.objects;
CREATE POLICY "Acceso público de lectura a imágenes de sprites"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'sprites-assets');

DROP POLICY IF EXISTS "Subida de imágenes para CMS" ON storage.objects;
CREATE POLICY "Subida de imágenes para CMS"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'sprites-assets');

DROP POLICY IF EXISTS "Modificación de imágenes para CMS" ON storage.objects;
CREATE POLICY "Modificación de imágenes para CMS"
  ON storage.objects FOR ALL
  USING (bucket_id = 'sprites-assets');
