-- Suppression totale de la fonctionnalité Automatismes
-- (réponses automatiques STOP/START + règles mot-clé + blocages).
-- À exécuter APRÈS le déploiement du code qui ne les utilise plus.
-- Réversible uniquement par restauration : les données sont perdues.

DROP TABLE IF EXISTS blocages;
DROP TABLE IF EXISTS automatismes;

-- Recharge le schéma PostgREST (si exécuté via l'éditeur SQL Supabase).
NOTIFY pgrst, 'reload schema';
