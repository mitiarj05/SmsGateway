-- Phase 2/3 — e-mail de contact + suspension sur les applications clientes.
-- À exécuter dans Supabase Dashboard → SQL Editor → Run (après 20261008_link_applications_user.sql).
-- `email` permet la détection du compte (login) sans passer par les demandes.
-- `suspendu` permet à l'admin de couper l'accès sans supprimer les données.

alter table applications
  add column if not exists email text;

alter table applications
  add column if not exists suspendu boolean not null default false;

create index if not exists idx_applications_email on applications (email);
