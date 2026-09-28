-- Facturation par client + réponses automatiques + liste de blocage.
-- À exécuter UNE FOIS dans l'éditeur SQL Supabase.

-- ---------- 1. Facturation mensuelle (1 ligne / client / mois) ----------
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

-- ---------- 2. Réponses automatiques (mot-clé -> réponse) ----------
CREATE TABLE IF NOT EXISTS automatismes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  id_application uuid REFERENCES public.applications(id),
  mot_cle text NOT NULL,
  reponse text NOT NULL,
  actif boolean NOT NULL DEFAULT true,
  date_creation timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT automatismes_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_automatismes_application ON automatismes (id_application);

-- ---------- 3. Blocages (STOP : global si id_application NULL) ----------
CREATE TABLE IF NOT EXISTS blocages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  numero_destinataire text NOT NULL,
  id_application uuid REFERENCES public.applications(id),
  motif text NOT NULL DEFAULT 'STOP',
  date_creation timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blocages_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_blocages_numero ON blocages (numero_destinataire);

-- ---------- 4. Quota mensuel par client (NULL = illimité) ----------
ALTER TABLE applications ADD COLUMN IF NOT EXISTS quota_mensuel integer;
