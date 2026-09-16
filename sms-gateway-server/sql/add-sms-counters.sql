-- Compteurs horaires par device (maintenus par POST .../status à chaque SENT).
-- À exécuter UNE FOIS dans l'éditeur SQL Supabase (sans danger si déjà appliqué).

ALTER TABLE devices ADD COLUMN IF NOT EXISTS sms_last_hour INTEGER DEFAULT 0;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS sms_envoyes_heure INTEGER DEFAULT 0;
