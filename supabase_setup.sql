-- ============================================================
-- SUPABASE DATABASE SETUP FOR FORTNITE SPRITEDEX
-- Copy and paste this script into your Supabase SQL Editor
-- ============================================================

-- 1. Create user_collections table
CREATE TABLE IF NOT EXISTS public.user_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    user_state JSONB DEFAULT '{}'::jsonb NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.user_collections ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Users can view only their own collection
CREATE POLICY "Users can select own collection"
ON public.user_collections
FOR SELECT
USING (auth.uid() = user_id);

-- 4. Policy: Users can insert their own collection
CREATE POLICY "Users can insert own collection"
ON public.user_collections
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 5. Policy: Users can update their own collection
CREATE POLICY "Users can update own collection"
ON public.user_collections
FOR UPDATE
USING (auth.uid() = user_id);

-- 6. Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_collections_updated_at
BEFORE UPDATE ON public.user_collections
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
