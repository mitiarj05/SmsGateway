-- Compteur horaire par appareil (maintenu par POST .../status à chaque ENVOYE).
-- À exécuter UNE FOIS dans l'éditeur SQL Supabase (sans danger si déjà appliqué).

ALTER TABLE appareils ADD COLUMN IF NOT EXISTS sms_envoyes_heure INTEGER DEFAULT 0;
