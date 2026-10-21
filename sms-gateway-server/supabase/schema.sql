-- =====================================================================
-- SMSTSIKA — Schéma complet (consolidé, idempotent : réexécutable sans risque).
-- Supabase Dashboard → SQL Editor → Run (en une fois, sur base neuve ou existante).
-- Noms des tables au SINGULIER : client, appareil, tache, parametre,
-- reponse, notification, facturation, demande (+ liens, retirée du produit).
-- Le bloc 0-renommages migre automatiquement une base encore en pluriel.
-- =====================================================================

-- ---------- 0. BASE HISTORIQUE (ex-dossier sql/) ----------
-- Enums (valeurs manquantes sur les bases réelles).
ALTER TYPE statut_message ADD VALUE IF NOT EXISTS 'PROGRAMME';
ALTER TYPE statut_message ADD VALUE IF NOT EXISTS 'ASSIGNE';
ALTER TYPE statut_appareil ADD VALUE IF NOT EXISTS 'DESACTIVE';

-- ---------- 0-renommages. Base encore en pluriel ? Ça passe au singulier ici.
-- Anciens noms de l'histoire du projet (messages, reponses…) renommés aussi.
-- Chaque renommage ne s'exécute que si l'ancienne table existe et la nouvelle non.
DO $$
BEGIN
  -- applications → client
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'applications')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'client') THEN
    ALTER TABLE public.applications RENAME TO client;
    ALTER INDEX IF EXISTS idx_applications_user_id RENAME TO idx_client_user_id;
    ALTER INDEX IF EXISTS idx_applications_email RENAME TO idx_client_email;
    ALTER INDEX IF EXISTS idx_applications_firebase_uid RENAME TO idx_client_firebase_uid;
  END IF;

  -- appareils → appareil
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'appareils')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'appareil') THEN
    ALTER TABLE public.appareils RENAME TO appareil;
    ALTER INDEX IF EXISTS idx_appareils_android_id RENAME TO idx_appareil_android_id;
    ALTER INDEX IF EXISTS uq_appareils_android_espace RENAME TO uq_appareil_android_espace;
  END IF;

  -- messages (très ancien nom) ou taches → tache
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tache') THEN
    ALTER TABLE public.messages RENAME TO tache;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'taches')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tache') THEN
    ALTER TABLE public.taches RENAME TO tache;
  END IF;

  -- parametres → parametre
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'parametres')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'parametre') THEN
    ALTER TABLE public.parametres RENAME TO parametre;
  END IF;

  -- reponses (ou messages_entrants, très ancien nom) → reponse
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages_entrants')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reponse') THEN
    ALTER TABLE public.messages_entrants RENAME TO reponse;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reponses')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reponse') THEN
    ALTER TABLE public.reponses RENAME TO reponse;
    ALTER INDEX IF EXISTS idx_reponses_expediteur RENAME TO idx_reponse_expediteur;
    ALTER INDEX IF EXISTS idx_reponses_application RENAME TO idx_reponse_application;
  END IF;

  -- notifications (ou livraisons_webhook, très ancien nom) → notification
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'livraisons_webhook')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notification') THEN
    ALTER TABLE public.livraisons_webhook RENAME TO notification;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notification') THEN
    ALTER TABLE public.notifications RENAME TO notification;
    ALTER INDEX IF EXISTS idx_notifications_due RENAME TO idx_notification_due;
  END IF;

  -- demandes → demande
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'demandes')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'demande') THEN
    ALTER TABLE public.demandes RENAME TO demande;
    ALTER INDEX IF EXISTS idx_demandes_statut RENAME TO idx_demande_statut;
  END IF;
END $$;

-- Client (ex-table applications) : la racine de tout l'espace client.
CREATE TABLE IF NOT EXISTS client (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  cle_api text NOT NULL UNIQUE,
  date_creation timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT client_pkey PRIMARY KEY (id)
);

-- Appareil : le téléphone Android relais.
CREATE TABLE IF NOT EXISTS appareil (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  jeton text NOT NULL UNIQUE,
  statut statut_appareil NOT NULL DEFAULT 'HORS_LIGNE',
  jeton_fcm text,
  id_application uuid REFERENCES public.client(id),
  date_creation timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT appareil_pkey PRIMARY KEY (id)
);

-- Tache : un SMS à envoyer.
CREATE TABLE IF NOT EXISTS tache (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  numero_destinataire text NOT NULL,
  contenu text NOT NULL,
  statut statut_message NOT NULL DEFAULT 'EN_ATTENTE',
  id_appareil uuid REFERENCES public.appareil(id),
  id_application uuid REFERENCES public.client(id),
  date_creation timestamptz NOT NULL DEFAULT now(),
  date_modification timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tache_pkey PRIMARY KEY (id)
);

INSERT INTO parametre (cle, valeur) VALUES
  ('sms_quota_per_hour', '20'),
  ('queue_alert_threshold', '10'),
  ('max_pending_hours', '24')
ON CONFLICT (cle) DO NOTHING;

-- SMS entrants (réponses).
CREATE TABLE IF NOT EXISTS reponse (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  id_application uuid REFERENCES public.client(id),
  id_appareil uuid REFERENCES public.appareil(id),
  expediteur text NOT NULL,
  contenu text NOT NULL,
  date_reception timestamptz NOT NULL DEFAULT now(),
  statut_notification text NOT NULL DEFAULT 'EN_ATTENTE',
  tentatives_notification integer NOT NULL DEFAULT 0,
  date_creation timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reponse_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_reponse_expediteur ON reponse (expediteur);
CREATE INDEX IF NOT EXISTS idx_reponse_application ON reponse (id_application);

-- Fonctionnalité Liens intelligents supprimée du produit :
-- suppression définitive de la table (données de suivi périmées).
DROP TABLE IF EXISTS liens;

-- File des notifications sortantes.
CREATE TABLE IF NOT EXISTS notification (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  id_application uuid REFERENCES public.client(id),
  type_evenement text NOT NULL,
  charge jsonb NOT NULL,
  statut text NOT NULL DEFAULT 'EN_ATTENTE',
  tentatives integer NOT NULL DEFAULT 0,
  prochaine_tentative timestamptz NOT NULL DEFAULT now(),
  dernier_code_http integer,
  date_creation timestamptz NOT NULL DEFAULT now(),
  date_maj timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_notification_due
  ON notification (prochaine_tentative)
  WHERE statut = 'EN_ATTENTE';

-- Demandes d'accès clients.
CREATE TABLE IF NOT EXISTS demande (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  contact text NOT NULL,
  usage_prevu text NOT NULL,
  statut text NOT NULL DEFAULT 'EN_ATTENTE',
  date_creation timestamptz NOT NULL DEFAULT now(),
  date_traitement timestamptz,
  CONSTRAINT demande_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_demande_statut ON demande (statut);

-- Facturation mensuelle (1 ligne / client / mois).
CREATE TABLE IF NOT EXISTS facturation (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  id_application uuid NOT NULL REFERENCES public.client(id),
  mois text NOT NULL,
  sms_envoyes integer NOT NULL DEFAULT 0,
  sms_recus integer NOT NULL DEFAULT 0,
  clics integer NOT NULL DEFAULT 0,
  echecs integer NOT NULL DEFAULT 0,
  date_maj timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT facturation_pkey PRIMARY KEY (id),
  CONSTRAINT facturation_unique_mois UNIQUE (id_application, mois)
);

-- Fonctionnalité Automatismes supprimée du code : nettoyage définitif.
DROP TABLE IF EXISTS blocages;
DROP TABLE IF EXISTS automatismes;

-- ---------- Codes de recharge : fonctionnalité retirée ----------
-- (forfait illimité : le seul vrai crédit est la SIM du client)
DROP TABLE IF EXISTS codes_recharge;

-- Colonnes applicatives historiques.
ALTER TABLE appareil ADD COLUMN IF NOT EXISTS uid_firebase TEXT UNIQUE;
ALTER TABLE appareil ADD COLUMN IF NOT EXISTS sms_envoyes_heure INTEGER DEFAULT 0;
ALTER TABLE appareil ADD COLUMN IF NOT EXISTS id_application uuid REFERENCES public.client(id);
ALTER TABLE tache ADD COLUMN IF NOT EXISTS programme_a TIMESTAMPTZ;

-- Accusés de réception réseau (DLR) : suivi SÉPARÉ du statut d'envoi.
-- statut_message reste la vérité de l'envoi (ENVOYE / ECHOUE) : facturation,
-- quotas et statistiques s'appuient dessus. Ces colonnes disent seulement ce
-- que l'opérateur a confirmé APRÈS coup. NULL = aucun accusé reçu.
ALTER TABLE tache ADD COLUMN IF NOT EXISTS livraison TEXT;       -- LIVRE | ECHEC_LIVRAISON
ALTER TABLE tache ADD COLUMN IF NOT EXISTS livre_le TIMESTAMPTZ; -- date de l'accusé
ALTER TABLE tache ADD COLUMN IF NOT EXISTS livraison_code INTEGER; -- code brut SmsManager (diagnostic)

-- Solde de la carte SIM, relevé par code USSD depuis l'appareil.
-- Un seul vrai crédit existe : la SIM du client. Ces colonnes disent où elle en
-- est, pour qu'on sache quand recharger avant que les envois ne s'arrêtent.
-- NULL = aucun relevé (code USSD non renseigné, ou opérateur muet).
ALTER TABLE appareil ADD COLUMN IF NOT EXISTS solde_sim TEXT;        -- montant tel que lu
ALTER TABLE appareil ADD COLUMN IF NOT EXISTS solde_devise TEXT;     -- FCFA, €, DH…
ALTER TABLE appareil ADD COLUMN IF NOT EXISTS solde_texte TEXT;      -- réponse brute de l'opérateur
ALTER TABLE appareil ADD COLUMN IF NOT EXISTS solde_maj_le TIMESTAMPTZ;
ALTER TABLE client ADD COLUMN IF NOT EXISTS url_notification text;
ALTER TABLE client ADD COLUMN IF NOT EXISTS secret_notification text;
ALTER TABLE client ADD COLUMN IF NOT EXISTS evenements_notification text[] NOT NULL DEFAULT '{sms.recu}';
ALTER TABLE client ADD COLUMN IF NOT EXISTS notifications_actives boolean NOT NULL DEFAULT true;
ALTER TABLE client ADD COLUMN IF NOT EXISTS quota_mensuel integer;

-- Forfait illimité : le seul vrai crédit est la SIM du client.
UPDATE client SET quota_mensuel = NULL WHERE quota_mensuel IS NOT NULL;

-- ---------- 1. Comptes standard : clients liés aux utilisateurs ----------
alter table client
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists idx_client_user_id on client (user_id);

-- ---------- 2. E-mail de contact + suspension ----------
alter table client
  add column if not exists email text;

alter table client
  add column if not exists suspendu boolean not null default false;

create index if not exists idx_client_email on client (email);

-- ---------- 3. Row Level Security (neutre si une table est absente) ----------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['client', 'appareil', 'tache', 'reponse', 'notification', 'demande']
  LOOP
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
      EXECUTE format('alter table %I enable row level security', t);
    END IF;
  END LOOP;
END $$;

-- Anciennes politiques (ports sur les tables renommées) : nettoyées, puis
-- recréées avec les noms singuliers. RLS contourné côté serveur par la clé
-- service_role ; ces politiques ne servent qu'aux connexions authentifiées.
drop policy if exists "applications_select_own" on client;
drop policy if exists "client_select_own" on client;
create policy "client_select_own" on client
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "applications_update_own" on client;
drop policy if exists "client_update_own" on client;
create policy "client_update_own" on client
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "applications_insert_own" on client;
drop policy if exists "client_insert_own" on client;
create policy "client_insert_own" on client
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "taches_all_own" on tache;
create policy "tache_all_own" on tache
  for all to authenticated
  using (id_application in (select id from client where user_id = auth.uid()))
  with check (id_application in (select id from client where user_id = auth.uid()));

drop policy if exists "reponses_all_own" on reponse;
create policy "reponse_all_own" on reponse
  for all to authenticated
  using (id_application in (select id from client where user_id = auth.uid()))
  with check (id_application in (select id from client where user_id = auth.uid()));

drop policy if exists "notifications_all_own" on notification;
create policy "notification_all_own" on notification
  for all to authenticated
  using (id_application in (select id from client where user_id = auth.uid()))
  with check (id_application in (select id from client where user_id = auth.uid()));

-- Appareil : modèle individuel — chacun ses téléphones liés.
-- (l'association se fait côté serveur via QR, sans lecture directe)
drop policy if exists "appareils_select_pool" on appareil;
drop policy if exists "appareils_select_own" on appareil;
create policy "appareil_select_own" on appareil
  for select to authenticated
  using (id_application in (select id from client where user_id = auth.uid()));

-- Demande : aucune politique = accès direct refusé (service_role uniquement).
-- (aucune policy créée volontairement)

-- ---------- 4. Comptes Firebase (application Android native) ----------
alter table client
  add column if not exists firebase_uid text;

create index if not exists idx_client_firebase_uid on client (firebase_uid);

-- ---------- 5. Anti-doublon matériel ----------
alter table appareil
  add column if not exists android_id text;

create index if not exists idx_appareil_android_id on appareil (android_id);

drop index if exists uq_appareils_android_espace;
drop index if exists uq_appareil_android_espace;
create unique index uq_appareil_android_espace
  on appareil (android_id, id_application)
  where android_id is not null and id_application is not null;

-- ---------- 6. Forfait illimité pour tous ----------
-- Le seul vrai crédit est la SIM du client : aucun quota imposé.
UPDATE client SET quota_mensuel = NULL WHERE quota_mensuel IS NOT NULL;

-- Recharge le cache PostgREST (sinon l'API peut voir l'ancien schéma).
NOTIFY pgrst, 'reload schema';
