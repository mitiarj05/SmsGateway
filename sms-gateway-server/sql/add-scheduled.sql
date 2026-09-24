-- Envoi différé : un message PROGRAMME attend sa date puis bascule EN_ATTENTE.
-- À exécuter UNE FOIS dans l'éditeur SQL Supabase (sans danger si déjà appliqué).

ALTER TABLE messages ADD COLUMN IF NOT EXISTS programme_a TIMESTAMPTZ;
