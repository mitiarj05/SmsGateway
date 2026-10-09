-- Phase 2/3 — lie les comptes Firebase (application Android) aux applications clientes.
-- À exécuter dans Supabase Dashboard → SQL Editor → Run.
-- L'UID Firebase n'est pas un UUID : colonne texte séparée (pas de FK).

alter table applications
  add column if not exists firebase_uid text;

create index if not exists idx_applications_firebase_uid on applications (firebase_uid);
