-- Ajouter la colonne sms_last_hour à la table devices
ALTER TABLE devices ADD COLUMN IF NOT EXISTS sms_last_hour INTEGER DEFAULT 0;

-- Créer un index pour accélérer la requête de sélection du device
CREATE INDEX IF NOT EXISTS idx_devices_sms_last_hour ON devices(sms_last_hour) WHERE statut = 'ONLINE';

-- Réinitialiser le compteur (optionnel, à faire une fois)
UPDATE devices SET sms_last_hour = 0 WHERE sms_last_hour IS NULL;
