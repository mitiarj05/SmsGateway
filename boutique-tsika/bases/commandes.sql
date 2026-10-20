-- Boutique Tsika — sa propre base (Supabase — un projet distinct de toute passerelle).
-- À exécuter dans le SQL Editor du PROJET Supabase de la boutique :
-- donnees/commandes.sql. La clé service de CE projet va dans BOUTIQUE_DB_KEY.

CREATE TABLE IF NOT EXISTS commandes (
  code         TEXT PRIMARY KEY,
  nom          TEXT NOT NULL,
  numero       TEXT NOT NULL,
  article      TEXT NOT NULL,
  prix         INTEGER NOT NULL,
  statut       TEXT NOT NULL DEFAULT 'ATTENTE_PAIEMENT', -- ATTENTE_PAIEMENT | PAYEE
  cree_le      TIMESTAMPTZ NOT NULL DEFAULT now(),
  paye_le      TIMESTAMPTZ,
  paye_par     TEXT,
  sms_envoye_le TIMESTAMPTZ,
  sms_task     TEXT,
  sms_erreur   TEXT
);
CREATE INDEX IF NOT EXISTS idx_commandes_cree_le ON commandes (cree_le DESC);

-- La boutique est seule chez elle : accès full par sa clé service, RLS pour le reste.
ALTER TABLE commandes ENABLE ROW LEVEL SECURITY;
