-- Lie chaque appareil à une identité Firebase Auth (inscription anonyme).
-- À exécuter UNE FOIS dans l'éditeur SQL Supabase.

ALTER TABLE appareils ADD COLUMN IF NOT EXISTS uid_firebase TEXT UNIQUE;
