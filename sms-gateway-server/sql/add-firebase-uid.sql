-- Lie chaque device à une identité Firebase Auth (inscription anonyme).
-- À exécuter UNE FOIS dans l'éditeur SQL Supabase.

ALTER TABLE devices ADD COLUMN IF NOT EXISTS firebase_uid TEXT UNIQUE;
