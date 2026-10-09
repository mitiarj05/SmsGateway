-- Phase 1 — Comptes standard : lie chaque application cliente à un utilisateur Supabase Auth.
-- À exécuter dans Supabase Dashboard → SQL Editor → Run.
-- Réversible : ALTER TABLE applications DROP COLUMN user_id;

alter table applications
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists idx_applications_user_id on applications (user_id);
