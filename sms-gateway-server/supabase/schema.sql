-- =====================================================================
-- SMSTSIKA — Schéma complet (consolidé, idempotent : réexécutable sans risque).
-- Supabase Dashboard → SQL Editor → Run (en une fois, sur base neuve ou existante).
-- Regroupe l'historique du dossier sql/ (supprimé) + les phases 2/3.
-- =====================================================================

-- ---------- 0. BASE HISTORIQUE (ex-dossier sql/) ----------
-- Enums (valeurs manquantes sur les bases réelles).
ALTER TYPE statut_message ADD VALUE IF NOT EXISTS 'PROGRAMME';
ALTER TYPE statut_message ADD VALUE IF NOT EXISTS 'ASSIGNE';
ALTER TYPE statut_appareil ADD VALUE IF NOT EXISTS 'DESACTIVE';

-- Paramètres serveur + valeurs par défaut (sans écraser l'existant).
CREATE TABLE IF NOT EXISTS parametres (
  cle TEXT PRIMARY KEY,
  valeur TEXT NOT NULL,
  date_modification TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO parametres (cle, valeur) VALUES
  ('sms_quota_per_hour', '20'),
  ('queue_alert_threshold', '10'),
  ('max_pending_hours', '24')
ON CONFLICT (cle) DO NOTHING;

-- Renommages historiques (messages -> taches, etc. — conditionnels, sans perte).
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'taches') THEN
    ALTER TABLE public.messages RENAME TO taches;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages_entrants')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reponses') THEN
    ALTER TABLE public.messages_entrants RENAME TO reponses;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'liens_intelligents')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'liens') THEN
    ALTER TABLE public.liens_intelligents RENAME TO liens;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'livraisons_webhook')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    ALTER TABLE public.livraisons_webhook RENAME TO notifications;
  END IF;
END $$;

-- SMS entrants (réponses).
CREATE TABLE IF NOT EXISTS reponses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  id_application uuid REFERENCES public.applications(id),
  id_appareil uuid REFERENCES public.appareils(id),
  expediteur text NOT NULL,
  contenu text NOT NULL,
  date_reception timestamptz NOT NULL DEFAULT now(),
  statut_notification text NOT NULL DEFAULT 'EN_ATTENTE',
  tentatives_notification integer NOT NULL DEFAULT 0,
  date_creation timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reponses_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_reponses_expediteur ON reponses (expediteur);
CREATE INDEX IF NOT EXISTS idx_reponses_application ON reponses (id_application);

-- Liens intelligents (SMS -> Web).
CREATE TABLE IF NOT EXISTS liens (
  id text NOT NULL,
  id_tache uuid REFERENCES public.taches(id),
  id_application uuid REFERENCES public.applications(id),
  numero_destinataire text NOT NULL,
  statut text NOT NULL DEFAULT 'CREE',
  date_creation timestamptz NOT NULL DEFAULT now(),
  date_clic timestamptz,
  CONSTRAINT liens_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_liens_application ON liens (id_application);

-- File des notifications sortantes.
CREATE TABLE IF NOT EXISTS notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  id_application uuid REFERENCES public.applications(id),
  type_evenement text NOT NULL,
  charge jsonb NOT NULL,
  statut text NOT NULL DEFAULT 'EN_ATTENTE',
  tentatives integer NOT NULL DEFAULT 0,
  prochaine_tentative timestamptz NOT NULL DEFAULT now(),
  dernier_code_http integer,
  date_creation timestamptz NOT NULL DEFAULT now(),
  date_maj timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_notifications_due
  ON notifications (prochaine_tentative)
  WHERE statut = 'EN_ATTENTE';

-- Demandes d'accès clients.
CREATE TABLE IF NOT EXISTS demandes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  contact text NOT NULL,
  usage_prevu text NOT NULL,
  statut text NOT NULL DEFAULT 'EN_ATTENTE',
  date_creation timestamptz NOT NULL DEFAULT now(),
  date_traitement timestamptz,
  CONSTRAINT demandes_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_demandes_statut ON demandes (statut);

-- Facturation mensuelle (1 ligne / client / mois).
CREATE TABLE IF NOT EXISTS facturation (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  id_application uuid NOT NULL REFERENCES public.applications(id),
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

-- Colonnes applicatives historiques.
ALTER TABLE appareils ADD COLUMN IF NOT EXISTS uid_firebase TEXT UNIQUE;
ALTER TABLE appareils ADD COLUMN IF NOT EXISTS sms_envoyes_heure INTEGER DEFAULT 0;
ALTER TABLE appareils ADD COLUMN IF NOT EXISTS id_application uuid REFERENCES public.applications(id);
ALTER TABLE taches ADD COLUMN IF NOT EXISTS programme_a TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS url_notification text;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS secret_notification text;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS evenements_notification text[] NOT NULL DEFAULT '{sms.recu,lien.clique}';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS notifications_actives boolean NOT NULL DEFAULT true;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS quota_mensuel integer;

-- ---------- 1. Comptes standard : applications liées aux utilisateurs ----------
alter table applications
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists idx_applications_user_id on applications (user_id);

-- ---------- 2. E-mail de contact + suspension ----------
alter table applications
  add column if not exists email text;

alter table applications
  add column if not exists suspendu boolean not null default false;

create index if not exists idx_applications_email on applications (email);

-- ---------- 3. Row Level Security ----------
alter table applications enable row level security;
alter table appareils enable row level security;
alter table taches enable row level security;
alter table reponses enable row level security;
alter table liens enable row level security;
alter table notifications enable row level security;
alter table demandes enable row level security;

-- Applications : chacun sa ligne (la clé service_role de l'app contourne RLS).
drop policy if exists "applications_select_own" on applications;
create policy "applications_select_own" on applications
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "applications_update_own" on applications;
create policy "applications_update_own" on applications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "applications_insert_own" on applications;
create policy "applications_insert_own" on applications
  for insert to authenticated
  with check (user_id = auth.uid());

-- Tables rattachées : via l'application possédée.
drop policy if exists "taches_all_own" on taches;
create policy "taches_all_own" on taches
  for all to authenticated
  using (id_application in (select id from applications where user_id = auth.uid()))
  with check (id_application in (select id from applications where user_id = auth.uid()));

drop policy if exists "reponses_all_own" on reponses;
create policy "reponses_all_own" on reponses
  for all to authenticated
  using (id_application in (select id from applications where user_id = auth.uid()))
  with check (id_application in (select id from applications where user_id = auth.uid()));

drop policy if exists "liens_all_own" on liens;
create policy "liens_all_own" on liens
  for all to authenticated
  using (id_application in (select id from applications where user_id = auth.uid()))
  with check (id_application in (select id from applications where user_id = auth.uid()));

drop policy if exists "notifications_all_own" on notifications;
create policy "notifications_all_own" on notifications
  for all to authenticated
  using (id_application in (select id from applications where user_id = auth.uid()))
  with check (id_application in (select id from applications where user_id = auth.uid()));

-- Appareils : modèle individuel — chacun ses téléphones liés.
-- (l'association se fait côté serveur via QR, sans lecture directe)
drop policy if exists "appareils_select_pool" on appareils;
drop policy if exists "appareils_select_own" on appareils;
create policy "appareils_select_own" on appareils
  for select to authenticated
  using (id_application in (select id from applications where user_id = auth.uid()));

-- Demandes : aucune politique = accès direct refusé (service_role uniquement).
-- (aucune policy créée volontairement)

-- ---------- 4. Comptes Firebase (application Android native) ----------
alter table applications
  add column if not exists firebase_uid text;

create index if not exists idx_applications_firebase_uid on applications (firebase_uid);

-- ---------- 5. Anti-doublon matériel ----------
alter table appareils
  add column if not exists android_id text;

create index if not exists idx_appareils_android_id on appareils (android_id);

drop index if exists uq_appareils_android_espace;
create unique index uq_appareils_android_espace
  on appareils (android_id, id_application)
  where android_id is not null and id_application is not null;
