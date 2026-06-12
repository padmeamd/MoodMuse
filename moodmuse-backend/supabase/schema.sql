-- ============================================================
-- MoodMuse — Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor to bootstrap the DB.
-- ============================================================

-- PROJECTS ---------------------------------------------------------------
-- Stores AI-generated creative project plans.
create table public.projects (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  mood                   text not null,
  materials_image_url    text,
  detected_materials     jsonb not null default '[]',
  project_title          text not null,
  concept                text not null,
  emotional_explanation  text not null,
  instructions           jsonb not null default '[]',
  estimated_time         text not null,
  difficulty             text not null,
  museum_title           text not null,
  museum_description     text not null,
  artifact_meaning       text not null,
  museum_room            text not null,
  created_at             timestamptz not null default now()
);

create index idx_projects_user  on public.projects (user_id);
create index idx_projects_mood  on public.projects (mood);

-- ARTIFACTS --------------------------------------------------------------
-- Stores completed creations enshrined in the museum.
create table public.artifacts (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  project_id          uuid references public.projects(id) on delete set null,
  mood                text not null,
  artifact_name       text not null,
  final_image_url     text,
  model_3d_url        text,
  model_3d_status     text not null default 'none',   -- none | pending | complete | failed
  model_3d_job_id     text,                           -- external job reference
  museum_room         text not null,
  museum_description  text not null,
  created_at          timestamptz not null default now()
);

create index idx_artifacts_user on public.artifacts (user_id);
create index idx_artifacts_room on public.artifacts (museum_room);
create index idx_artifacts_mood on public.artifacts (mood);

-- ROW LEVEL SECURITY -----------------------------------------------------
alter table public.projects  enable row level security;
alter table public.artifacts enable row level security;

-- Users can CRUD only their own rows.
create policy "users own their projects"
  on public.projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users own their artifacts"
  on public.artifacts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- STORAGE BUCKETS --------------------------------------------------------
-- Create via Supabase Dashboard or CLI:
--   1. "materials"  — uploaded material photos   (private)
--   2. "creations"  — uploaded finished photos    (private)
--   3. "models"     — downloaded .glb files       (private)
--
-- Bucket policies (add in Dashboard > Storage > Policies):
--   Allow authenticated users to upload to their own folder:
--     bucket_id = 'materials' AND auth.uid()::text = (storage.foldername(name))[1]
--   Same pattern for 'creations' and 'models'.

-- SEED: museum room mapping (for reference — not a table, just a constant)
-- nostalgic, reflective, lonely   -> Hall of Nostalgia
-- hopeful, inspired, creative     -> Hall of Dreams
-- healing, overwhelmed            -> Hall of Healing
-- ambitious                       -> Hall of Ambition
-- curious                         -> Hall of Curiosity
