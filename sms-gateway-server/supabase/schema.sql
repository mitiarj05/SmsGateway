-- =====================================================================
-- SMSTSIKA — Schéma complet (consolidé, idempotent : réexécutable sans risque).
-- Supabase Dashboard → SQL Editor → Run (en une fois, sur base neuve ou existante).
--
-- Vocabulaire v3 (uid prennent le préfixe de la table) :
--   client      (id_utilisateur → auth.users, evenement_souscrit, evenement_actif)
--   appareil    (id_client, firebase_uid, derniere_activite, solde_sim…)
--   tache       (id_client, id_appareil, statut_tache, livraison, reclame_a…)
--   parametre   (cle, valeur)
--   reponse     (id_client, id_appareil, statut_notification, tentative_notification)
--   evenement   (id_client, tentative, date_modification)
--   facturation (id_client, sms_envoye, sms_recu, echec, date_modification)
--   validation  (id_utilisateur, tentative) — codes d'inscription à 6 chiffres
-- Les blocs 0 migrent automatiquement une base encore en vocabulaire antérieur.
-- =====================================================================

-- ---------- 0. Enums ----------
-- statut_message (ancien nom) → statut_tache ; valeurs manquantes ajoutées.
DO $$
DECLARE t text;
BEGIN
  SELECT typname INTO t FROM pg_type WHERE typname = 'statut_message' LIMIT 1;
  IF t IS NOT NULL THEN
    ALTER TYPE statut_message RENAME TO statut_tache;
  END IF;
END $$;
ALTER TYPE statut_tache ADD VALUE IF NOT EXISTS 'PROGRAMME';
ALTER TYPE statut_tache ADD VALUE IF NOT EXISTS 'ASSIGNE';
ALTER TYPE statut_appareil ADD VALUE IF NOT EXISTS 'DESACTIVE';

-- ---------- 0-renommages A : anciennes tables au pluriel → singulier ----------
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'applications')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'client') THEN
    ALTER TABLE public.applications RENAME TO client;
    ALTER INDEX IF EXISTS idx_applications_user_id RENAME TO idx_client_id_utilisateur;
    ALTER INDEX IF EXISTS idx_client_user_id RENAME TO idx_client_id_utilisateur;
    ALTER INDEX IF EXISTS idx_applications_email RENAME TO idx_client_email;
    ALTER INDEX IF EXISTS idx_applications_firebase_uid RENAME TO idx_client_firebase_uid;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'appareils')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'appareil') THEN
    ALTER TABLE public.appareils RENAME TO appareil;
    ALTER INDEX IF EXISTS idx_appareils_android_id RENAME TO idx_appareil_android_id;
    ALTER INDEX IF EXISTS uq_appareils_android_espace RENAME TO uq_appareil_android_espace;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tache') THEN
    ALTER TABLE public.messages RENAME TO tache;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'taches')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tache') THEN
    ALTER TABLE public.taches RENAME TO tache;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'parametres')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'parametre') THEN
    ALTER TABLE public.parametres RENAME TO parametre;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages_entrants')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reponse') THEN
    ALTER TABLE public.messages_entrants RENAME TO reponse;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reponses')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reponse') THEN
    ALTER TABLE public.reponses RENAME TO reponse;
    ALTER INDEX IF EXISTS idx_reponses_expediteur RENAME TO idx_reponse_expediteur;
    ALTER INDEX IF EXISTS idx_reponses_application RENAME TO idx_reponse_client;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'livraisons_webhook')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'evenement') THEN
    ALTER TABLE public.livraisons_webhook RENAME TO evenement;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'evenement') THEN
    ALTER TABLE public.notifications RENAME TO evenement;
    ALTER INDEX IF EXISTS idx_notifications_due RENAME TO idx_evenement_due;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notification')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'evenement') THEN
    ALTER TABLE public.notification RENAME TO evenement;
    ALTER INDEX IF EXISTS idx_notification_due RENAME TO idx_evenement_due;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'codes_verification')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'validation') THEN
    ALTER TABLE public.codes_verification RENAME TO validation;
    ALTER INDEX IF EXISTS idx_codes_verification_email RENAME TO idx_validation_email;
  END IF;
END $$;

-- ---------- 0-renommages B : anciens noms de colonnes → vocabulaire v3 ----------
DO $$
BEGIN
  -- client : user_id → id_utilisateur ; événements au singulier.
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='client' AND column_name='user_id') THEN
    ALTER TABLE client RENAME COLUMN user_id TO id_utilisateur;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='client' AND column_name='evenements_souscrits') THEN
    ALTER TABLE client RENAME COLUMN evenements_souscrits TO evenement_souscrit;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='client' AND column_name='evenements_actifs') THEN
    ALTER TABLE client RENAME COLUMN evenements_actifs TO evenement_actif;
  END IF;

  -- appareil : uid_firebase → firebase_uid ; id_application → id_client.
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='appareil' AND column_name='uid_firebase') THEN
    ALTER TABLE appareil RENAME COLUMN uid_firebase TO firebase_uid;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='appareil' AND column_name='id_application') THEN
    ALTER TABLE appareil RENAME COLUMN id_application TO id_client;
  END IF;

  -- tache : id_application → id_client.
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tache' AND column_name='id_application') THEN
    ALTER TABLE tache RENAME COLUMN id_application TO id_client;
  END IF;

  -- reponse : id_application → id_client ; variantes du miroir → statut_notification / tentative_notification.
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reponse' AND column_name='id_application') THEN
    ALTER TABLE reponse RENAME COLUMN id_application TO id_client;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reponse' AND column_name='statut_evenement') THEN
    ALTER TABLE reponse RENAME COLUMN statut_evenement TO statut_notification;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reponse' AND column_name='tentatives_evenement') THEN
    ALTER TABLE reponse RENAME COLUMN tentatives_evenement TO tentative_notification;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reponse' AND column_name='tentatives_notification') THEN
    ALTER TABLE reponse RENAME COLUMN tentatives_notification TO tentative_notification;
  END IF;

  -- evenement : id_application → id_client ; tentatives → tentative ; date_maj → date_modification.
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='evenement' AND column_name='id_application') THEN
    ALTER TABLE evenement RENAME COLUMN id_application TO id_client;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='evenement' AND column_name='tentatives') THEN
    ALTER TABLE evenement RENAME COLUMN tentatives TO tentative;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='evenement' AND column_name='date_maj') THEN
    ALTER TABLE evenement RENAME COLUMN date_maj TO date_modification;
  END IF;

  -- facturation : id_client + colonnes au singulier.
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='facturation' AND column_name='id_application') THEN
    ALTER TABLE facturation RENAME COLUMN id_application TO id_client;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='facturation' AND column_name='sms_envoyes') THEN
    ALTER TABLE facturation RENAME COLUMN sms_envoyes TO sms_envoye;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='facturation' AND column_name='sms_recus') THEN
    ALTER TABLE facturation RENAME COLUMN sms_recus TO sms_recu;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='facturation' AND column_name='echecs') THEN
    ALTER TABLE facturation RENAME COLUMN echecs TO echec;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='facturation' AND column_name='date_maj') THEN
    ALTER TABLE facturation RENAME COLUMN date_maj TO date_modification;
  END IF;

  -- validation : user_id → id_utilisateur ; tentatives → tentative.
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='validation' AND column_name='user_id') THEN
    ALTER TABLE validation RENAME COLUMN user_id TO id_utilisateur;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='validation' AND column_name='tentatives') THEN
    ALTER TABLE validation RENAME COLUMN tentatives TO tentative;
  END IF;
END $$;

-- ---------- 1. Tables ----------
-- Client : la racine de tout l'espace client.
CREATE TABLE IF NOT EXISTS client (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  cle_api text NOT NULL UNIQUE,
  date_creation timestamptz NOT NULL DEFAULT now(),
  url_application text,
  secret_signature text,
  evenement_souscrit text[] NOT NULL DEFAULT '{sms.recu}',
  evenement_actif boolean NOT NULL DEFAULT true,
  id_utilisateur uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  email text,
  suspendu boolean NOT NULL DEFAULT false,
  firebase_uid text,
  CONSTRAINT client_pkey PRIMARY KEY (id)
);
ALTER TABLE client ADD COLUMN IF NOT EXISTS url_application text;
ALTER TABLE client ADD COLUMN IF NOT EXISTS secret_signature text;
ALTER TABLE client ADD COLUMN IF NOT EXISTS evenement_souscrit text[] NOT NULL DEFAULT '{sms.recu}';
ALTER TABLE client ADD COLUMN IF NOT EXISTS evenement_actif boolean NOT NULL DEFAULT true;
ALTER TABLE client ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE client ADD COLUMN IF NOT EXISTS suspendu boolean NOT NULL DEFAULT false;
ALTER TABLE client ADD COLUMN IF NOT EXISTS firebase_uid text;
ALTER TABLE client ALTER COLUMN cle_api SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_client_id_utilisateur ON client (id_utilisateur);
CREATE INDEX IF NOT EXISTS idx_client_email ON client (email);
CREATE INDEX IF NOT EXISTS idx_client_firebase_uid ON client (firebase_uid);

-- Appareil : le téléphone Android relais.
CREATE TABLE IF NOT EXISTS appareil (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  jeton text NOT NULL UNIQUE,
  statut statut_appareil NOT NULL DEFAULT 'HORS_LIGNE',
  jeton_fcm text,
  firebase_uid text UNIQUE,
  derniere_activite timestamptz,
  id_client uuid REFERENCES public.client(id),
  date_creation timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT appareil_pkey PRIMARY KEY (id)
);
ALTER TABLE appareil ADD COLUMN IF NOT EXISTS firebase_uid text UNIQUE;
ALTER TABLE appareil ADD COLUMN IF NOT EXISTS derniere_activite TIMESTAMPTZ;
ALTER TABLE appareil ADD COLUMN IF NOT EXISTS android_id text;
ALTER TABLE appareil ADD COLUMN IF NOT EXISTS solde_sim text;
ALTER TABLE appareil ADD COLUMN IF NOT EXISTS solde_devise text;
ALTER TABLE appareil ADD COLUMN IF NOT EXISTS solde_texte text;
ALTER TABLE appareil ADD COLUMN IF NOT EXISTS solde_maj_le TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_appareil_android_id ON appareil (android_id);
DROP INDEX IF EXISTS uq_appareil_android_espace;
CREATE UNIQUE INDEX IF NOT EXISTS uq_appareil_android_espace
  ON appareil (android_id, id_client)
  WHERE android_id IS NOT NULL AND id_client IS NOT NULL;

-- parametre : réglages globaux de la passerelle (clé → valeur).
CREATE TABLE IF NOT EXISTS parametre (
  cle text NOT NULL,
  valeur text NOT NULL,
  date_modification timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT parametre_pkey PRIMARY KEY (cle)
);
INSERT INTO parametre (cle, valeur) VALUES
  ('sms_quota_per_hour', '20'),
  ('queue_alert_threshold', '10'),
  ('max_pending_hours', '24')
ON CONFLICT (cle) DO NOTHING;

-- Tache : un SMS à envoyer.
CREATE TABLE IF NOT EXISTS tache (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  numero_destinataire text NOT NULL,
  contenu text NOT NULL,
  statut statut_tache NOT NULL DEFAULT 'EN_ATTENTE',
  id_appareil uuid REFERENCES public.appareil(id),
  id_client uuid REFERENCES public.client(id),
  date_creation timestamptz NOT NULL DEFAULT now(),
  date_modification timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tache_pkey PRIMARY KEY (id)
);
ALTER TABLE tache ADD COLUMN IF NOT EXISTS programme_a TIMESTAMPTZ;
ALTER TABLE tache ADD COLUMN IF NOT EXISTS reclame_a TIMESTAMPTZ;
ALTER TABLE tache ADD COLUMN IF NOT EXISTS message_erreur text;
-- Accusés de réception réseau (DLR) : suivi SÉPARÉ du statut d'envoi.
-- statut reste la vérité de l'envoi (ENVOYE / ECHOUE) : facturation, compteurs
-- et statistiques s'appuient dessus. Ces colonnes disent seulement ce que
-- l'opérateur a confirmé APRÈS coup. NULL = aucun accusé reçu.
ALTER TABLE tache ADD COLUMN IF NOT EXISTS livraison TEXT;         -- LIVRE | ECHEC_LIVRAISON
ALTER TABLE tache ADD COLUMN IF NOT EXISTS livre_le TIMESTAMPTZ;  -- date de l'accusé
ALTER TABLE tache ADD COLUMN IF NOT EXISTS livraison_code INTEGER; -- code brut SmsManager (diagnostic)

-- reponse : SMS entrant + miroir du statut de livraison au site du client.
CREATE TABLE IF NOT EXISTS reponse (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  id_client uuid REFERENCES public.client(id),
  id_appareil uuid REFERENCES public.appareil(id),
  expediteur text NOT NULL,
  contenu text NOT NULL,
  date_reception timestamptz NOT NULL DEFAULT now(),
  date_creation timestamptz NOT NULL DEFAULT now(),
  statut_notification text NOT NULL DEFAULT 'EN_ATTENTE',
  tentative_notification integer NOT NULL DEFAULT 0,
  CONSTRAINT reponse_pkey PRIMARY KEY (id)
);
ALTER TABLE reponse ADD COLUMN IF NOT EXISTS statut_notification text NOT NULL DEFAULT 'EN_ATTENTE';
ALTER TABLE reponse ADD COLUMN IF NOT EXISTS tentative_notification integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_reponse_expediteur ON reponse (expediteur);
CREATE INDEX IF NOT EXISTS idx_reponse_client ON reponse (id_client);

-- evenement : file des livraisons d'événements sortants (POST signé vers l'URL du client).
CREATE TABLE IF NOT EXISTS evenement (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  id_client uuid REFERENCES public.client(id),
  type_evenement text NOT NULL,
  charge jsonb NOT NULL,
  statut text NOT NULL DEFAULT 'EN_ATTENTE',
  tentative integer NOT NULL DEFAULT 0,
  prochaine_tentative timestamptz NOT NULL DEFAULT now(),
  date_creation timestamptz NOT NULL DEFAULT now(),
  date_modification timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT evenement_pkey PRIMARY KEY (id)
);
ALTER TABLE evenement DROP COLUMN IF EXISTS dernier_code_http;
CREATE INDEX IF NOT EXISTS idx_evenement_due
  ON evenement (prochaine_tentative)
  WHERE statut = 'EN_ATTENTE';

-- facturation : 1 ligne / client / mois.
CREATE TABLE IF NOT EXISTS facturation (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  id_client uuid NOT NULL REFERENCES public.client(id),
  mois text NOT NULL,
  sms_envoye integer NOT NULL DEFAULT 0,
  sms_recu integer NOT NULL DEFAULT 0,
  echec integer NOT NULL DEFAULT 0,
  date_modification timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT facturation_pkey PRIMARY KEY (id),
  CONSTRAINT facturation_unique_mois UNIQUE (id_client, mois)
);

-- validation : codes d'inscription à 6 chiffres (15 min de validité).
-- Aucune policy RLS volontaire : le serveur écrit via service_role uniquement.
CREATE TABLE IF NOT EXISTS validation (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  id_utilisateur uuid NOT NULL,
  nom text NOT NULL DEFAULT '',
  expire_le timestamptz NOT NULL,
  tentative integer NOT NULL DEFAULT 0,
  date_creation timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT validation_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_validation_email ON validation (email);

-- ---------- Fonctionnalités retirées : nettoyage définitif ----------
DROP TABLE IF EXISTS liens;
DROP TABLE IF EXISTS blocages;
DROP TABLE IF EXISTS automatismes;
DROP TABLE IF EXISTS codes_recharge;
DROP TABLE IF EXISTS demande;
DROP TABLE IF EXISTS notification;
DROP TABLE IF EXISTS notifications;
ALTER TABLE client DROP COLUMN IF EXISTS quota_mensuel;
ALTER TABLE appareil DROP COLUMN IF EXISTS sms_envoyes_heure;
ALTER TABLE facturation DROP COLUMN IF EXISTS clics;

-- ---------- 2. Lien vers auth.users (comptes standard) ----------
ALTER TABLE client
  ADD COLUMN IF NOT EXISTS id_utilisateur uuid REFERENCES auth.users (id) ON DELETE SET NULL;

-- ---------- 3. Row Level Security ----------
-- Validation : aucune policy volontairement (service_role uniquement).
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['client', 'appareil', 'tache', 'reponse', 'evenement', 'validation']
  LOOP
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
      EXECUTE format('alter table %I enable row level security', t);
    END IF;
  END LOOP;
END $$;

-- Anciennes politiques (anciens noms de tables/colonnes) : nettoyées, puis
-- recréées avec le vocabulaire v3. Uniquement utile aux connexions
-- authentifiées ; le serveur passe la clé service_role.
drop policy if exists "applications_select_own" on client;
drop policy if exists "applications_update_own" on client;
drop policy if exists "applications_insert_own" on client;
drop policy if exists "client_select_own" on client;
create policy "client_select_own" on client
  for select to authenticated using (id_utilisateur = auth.uid());
create policy "client_update_own" on client
  for update to authenticated
  using (id_utilisateur = auth.uid())
  with check (id_utilisateur = auth.uid());
create policy "client_insert_own" on client
  for insert to authenticated
  with check (id_utilisateur = auth.uid());

drop policy if exists "taches_all_own" on tache;
drop policy if exists "tache_all_own" on tache;
create policy "tache_all_own" on tache
  for all to authenticated
  using (id_client in (select id from client where id_utilisateur = auth.uid()))
  with check (id_client in (select id from client where id_utilisateur = auth.uid()));

drop policy if exists "reponses_all_own" on reponse;
drop policy if exists "reponse_all_own" on reponse;
create policy "reponse_all_own" on reponse
  for all to authenticated
  using (id_client in (select id from client where id_utilisateur = auth.uid()))
  with check (id_client in (select id from client where id_utilisateur = auth.uid()));

drop policy if exists "evenements_all_own" on evenement;
drop policy if exists "evenement_all_own" on evenement;
create policy "evenement_all_own" on evenement
  for all to authenticated
  using (id_client in (select id from client where id_utilisateur = auth.uid()))
  with check (id_client in (select id from client where id_utilisateur = auth.uid()));

-- Appareil : modèle individuel — chacun ses téléphones liés.
-- (l'association se fait côté serveur via QR, sans lecture directe)
drop policy if exists "appareils_select_pool" on appareil;
drop policy if exists "appareils_select_own" on appareil;
drop policy if exists "appareil_select_own" on appareil;
create policy "appareil_select_own" on appareil
  for select to authenticated
  using (id_client in (select id from client where id_utilisateur = auth.uid()));

-- ---------- 4. Forfait illimité pour tous ----------
-- Le seul vrai crédit est la SIM du client : aucun quota imposé.

-- Recharge le cache PostgREST (sinon l'API peut voir l'ancien schéma).
NOTIFY pgrst, 'reload schema';
