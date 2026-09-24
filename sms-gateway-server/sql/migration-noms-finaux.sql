-- Migration vers les noms finaux (taches, reponses, liens, notifications).
-- À exécuter UNE FOIS dans l'éditeur SQL Supabase.
-- Tout est conditionnel : relançable sans risque, aucune donnée perdue
-- (RENAME conserve les lignes, contrairement à DROP + CREATE).

-- ---------- 0. Enum + paramètres par défaut (si pas déjà fait) ----------
ALTER TYPE statut_message ADD VALUE IF NOT EXISTS 'PROGRAMME';
ALTER TYPE statut_message ADD VALUE IF NOT EXISTS 'ASSIGNE';
ALTER TYPE statut_appareil ADD VALUE IF NOT EXISTS 'DESACTIVE';

INSERT INTO parametres (cle, valeur) VALUES
  ('sms_quota_per_hour', '20'),
  ('queue_alert_threshold', '10'),
  ('max_pending_hours', '24')
ON CONFLICT (cle) DO NOTHING;

-- ---------- 1. messages -> taches (les FK suivent automatiquement) ----------
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'taches') THEN
    ALTER TABLE public.messages RENAME TO taches;
  END IF;
END $$;

-- ---------- 2. messages_entrants -> reponses (+ colonnes) ----------
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages_entrants')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reponses') THEN
    ALTER TABLE public.messages_entrants RENAME TO reponses;
  END IF;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reponses' AND column_name = 'statut_webhook') THEN
    ALTER TABLE public.reponses RENAME COLUMN statut_webhook TO statut_notification;
  END IF;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reponses' AND column_name = 'tentatives_webhook') THEN
    ALTER TABLE public.reponses RENAME COLUMN tentatives_webhook TO tentatives_notification;
  END IF;
  IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_entrants_expediteur') THEN
    ALTER INDEX public.idx_entrants_expediteur RENAME TO idx_reponses_expediteur;
  END IF;
  IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_entrants_application') THEN
    ALTER INDEX public.idx_entrants_application RENAME TO idx_reponses_application;
  END IF;
END $$;

-- ---------- 3. liens_intelligents -> liens (+ colonne id_message -> id_tache) ----------
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'liens_intelligents')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'liens') THEN
    ALTER TABLE public.liens_intelligents RENAME TO liens;
  END IF;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'liens' AND column_name = 'id_message') THEN
    ALTER TABLE public.liens RENAME COLUMN id_message TO id_tache;
  END IF;
END $$;

-- ---------- 4. livraisons_webhook -> notifications ----------
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'livraisons_webhook')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    ALTER TABLE public.livraisons_webhook RENAME TO notifications;
  END IF;
END $$;

-- ---------- 5. Colonnes applications (données conservées) ----------
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'webhook_url') THEN
    ALTER TABLE public.applications RENAME COLUMN webhook_url TO url_notification;
  END IF;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'secret_webhook') THEN
    ALTER TABLE public.applications RENAME COLUMN secret_webhook TO secret_notification;
  END IF;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'evenements_webhook') THEN
    ALTER TABLE public.applications RENAME COLUMN evenements_webhook TO evenements_notification;
  END IF;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'webhooks_actifs') THEN
    ALTER TABLE public.applications RENAME COLUMN webhooks_actifs TO notifications_actives;
  END IF;
END $$;

-- ---------- 6. Index manquants (sans danger si déjà présents) ----------
CREATE INDEX IF NOT EXISTS idx_liens_application ON liens (id_application);
CREATE INDEX IF NOT EXISTS idx_notifications_due
  ON notifications (prochaine_tentative)
  WHERE statut = 'EN_ATTENTE';

-- ---------- 7. Vérification : doit lister applications, appareils, liens,
-- ----------    messages(absent si renommé), notifications, parametres,
-- ----------    reponses, taches
SELECT tablename AS table_finale
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
