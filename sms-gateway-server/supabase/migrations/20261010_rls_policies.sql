-- Phase 3 — Row Level Security : la clé anon (publique, dans le navigateur)
-- ne doit plus permettre de lire/écrire les tables directement.
-- L'application continue via service_role (contourne RLS) : aucun impact fonctionnel.
-- À exécuter dans Supabase Dashboard → SQL Editor → Run.

-- ---------- Activation ----------
alter table applications enable row level security;
alter table appareils enable row level security;
alter table taches enable row level security;
alter table reponses enable row level security;
alter table liens enable row level security;
alter table notifications enable row level security;
alter table demandes enable row level security;

-- ---------- Applications : chacun sa ligne ----------
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

-- ---------- Tables rattachées : via l'application possédée ----------
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

-- ---------- Appareils : parc mutualisé lisible, écriture réservée service_role ----------
drop policy if exists "appareils_select_pool" on appareils;
create policy "appareils_select_pool" on appareils
  for select to authenticated using (true);

-- ---------- Demandes : aucune politique = accès direct refusé (service_role uniquement) ----------
-- (aucune policy créée volontairement)
