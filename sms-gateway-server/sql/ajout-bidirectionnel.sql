-- Bidirectionnel + notifications + liens.
-- À exécuter UNE FOIS dans l'éditeur SQL Supabase (après fix-base-reelle.sql
-- et renommer-messages-taches.sql).

-- ---------- 1. SMS entrants (réponses) ----------
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

-- ---------- 2. Liens (SMS -> Web) ----------
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

-- ---------- 3. File des notifications sortantes ----------
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

-- ---------- 4. Config notifications par client ----------
ALTER TABLE applications ADD COLUMN IF NOT EXISTS url_notification text;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS secret_notification text;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS evenements_notification text[] NOT NULL DEFAULT '{sms.recu,lien.clique}';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS notifications_actives boolean NOT NULL DEFAULT true;

-- ---------- 5. SIM dédiée (affectation appareil -> client) ----------
ALTER TABLE appareils ADD COLUMN IF NOT EXISTS id_application uuid REFERENCES public.applications(id);
