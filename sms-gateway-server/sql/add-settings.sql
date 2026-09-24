-- Paramètres serveur du dashboard (quota, seuils d'alerte).
-- À exécuter UNE FOIS dans l'éditeur SQL Supabase.

CREATE TABLE IF NOT EXISTS parametres (
  cle TEXT PRIMARY KEY,
  valeur TEXT NOT NULL,
  date_modification TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Valeurs par défaut (ne pas écraser si déjà configurées).
-- À ré-exécuter après ajout d'une nouvelle clé (INSERT ... DO NOTHING).
INSERT INTO parametres (cle, valeur) VALUES
  ('sms_quota_per_hour', '20'),
  ('queue_alert_threshold', '10'),
  ('max_pending_hours', '24')
ON CONFLICT (cle) DO NOTHING;
