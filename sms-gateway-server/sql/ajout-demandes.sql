-- Demandes d'accès clients (inscription sur approbation admin).
-- À exécuter UNE FOIS dans l'éditeur SQL Supabase.

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
