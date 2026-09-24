-- Renomme la table de production messages -> taches
-- (cohérence diagramme : Tache = tâche d'envoi avec workflow).
-- À exécuter UNE FOIS dans l'éditeur SQL Supabase, AVANT ajout-bidirectionnel.sql.
-- Sûr : les contraintes FK, index et défauts suivent automatiquement.
-- Les tables des versions précédentes du SQL bidirectionnel, si exécutées
-- (sms_recus, liens_suivis, envois_rappel, receptions, raccourcis,
-- notifications, liens, rappels), peuvent être supprimées APRÈS
-- vérification qu'elles sont vides.

ALTER TABLE IF EXISTS messages RENAME TO taches;
