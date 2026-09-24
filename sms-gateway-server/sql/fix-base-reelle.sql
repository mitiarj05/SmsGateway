-- Correctifs base réelle (schéma + logs du dashboard) :
-- 1. "PROGRAMME" manque à l'enum statut_message → les envois différés échouent.
-- 2. "DESACTIVE"/"ASSIGNE" non confirmés → ajoutés par sécurité (le toggle
--    admin écrit DESACTIVE ; sans la valeur, le PATCH plantera en 500).
-- 3. La table parametres a sa PK mais semble VIDE → .single() échoue
--    ("Cannot coerce..."), le dashboard retombe sur les défauts.
-- À exécuter UNE FOIS dans l'éditeur SQL Supabase.

-- ---------- 1. Valeurs d'enum manquantes ----------
ALTER TYPE statut_message ADD VALUE IF NOT EXISTS 'PROGRAMME';
ALTER TYPE statut_message ADD VALUE IF NOT EXISTS 'ASSIGNE';
ALTER TYPE statut_appareil ADD VALUE IF NOT EXISTS 'DESACTIVE';

-- Vérification (doit lister les valeurs réelles des deux enums) :
-- SELECT t.typname AS enum, e.enumlabel AS valeur
-- FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.typid
-- WHERE t.typname IN ('statut_appareil', 'statut_message')
-- ORDER BY t.typname, e.enumsortorder;

-- ---------- 2. Lignes de paramètres par défaut ----------
-- ON CONFLICT ne fait rien si déjà configurées (PK existante sur cle).
INSERT INTO parametres (cle, valeur) VALUES
  ('sms_quota_per_hour', '20'),
  ('queue_alert_threshold', '10'),
  ('max_pending_hours', '24')
ON CONFLICT (cle) DO NOTHING;
