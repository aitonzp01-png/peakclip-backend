-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)
-- after creating your Supabase project.

-- Users table: mirrors auth.users with app-level fields
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  credits INTEGER NOT NULL DEFAULT 3,
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clips table: stores generated clips per user
CREATE TABLE IF NOT EXISTS clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'processing',
  video_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user-scoped queries
CREATE INDEX IF NOT EXISTS idx_clips_user_id ON clips(user_id);
CREATE INDEX IF NOT EXISTS idx_clips_created_at ON clips(created_at DESC);

-- Helper: create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, credits, plan)
  VALUES (
    NEW.id,
    NEW.email,
    3,
    'free'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: automatically create user profile on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clips ENABLE ROW LEVEL SECURITY;

-- RLS: users can only read/update their own row
CREATE POLICY user_read_own ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY user_update_own ON users
  FOR UPDATE USING (auth.uid() = id);

-- RLS: clips are scoped to the owning user
CREATE POLICY clips_select_own ON clips
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY clips_insert_own ON clips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY clips_update_own ON clips
  FOR UPDATE USING (auth.uid() = user_id);
