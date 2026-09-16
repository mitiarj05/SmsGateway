-- Paramètres serveur du dashboard (quota, seuils d'alerte).
-- À exécuter UNE FOIS dans l'éditeur SQL Supabase.

CREATE TABLE IF NOT EXISTS settings (
  cle TEXT PRIMARY KEY,
  valeur TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Valeurs par défaut (ne pas écraser si déjà configurées).
-- À ré-exécuter après ajout d'une nouvelle clé (INSERT ... DO NOTHING).
INSERT INTO settings (cle, valeur) VALUES
  ('sms_quota_per_hour', '20'),
  ('queue_alert_threshold', '10'),
  ('max_pending_hours', '24')
ON CONFLICT (cle) DO NOTHING;
