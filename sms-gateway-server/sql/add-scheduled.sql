-- Envoi différé : une tâche SCHEDULED attend sa date puis bascule PENDING.
-- À exécuter UNE FOIS dans l'éditeur SQL Supabase (sans danger si déjà appliqué).

ALTER TABLE sms_tasks ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
