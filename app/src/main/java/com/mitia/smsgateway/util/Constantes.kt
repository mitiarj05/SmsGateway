package com.mitia.smsgateway.util

/** Constantes partagées de la scrutation et du foreground service. */
object Constantes {
    /** Intervalle de scrutation des tâches. */
    const val INTERVALLE_SCRUTATION_MS = 30_000L

    /** Notification permanente du foreground service. */
    const val CANAL_PREMIER_PLAN_ID = "sms_gateway_channel"
    const val ID_NOTIFICATION_PREMIER_PLAN = 1

    // --- Accusés de réception réseau (DLR) ---
    /**
     * Action du broadcast de remise : le système (téléphonie) la déclenche
     * quand l'opérateur confirme que le SMS est arrivé, parfois plusieurs
     * minutes après l'envoi, et parfois jamais.
     */
    const val ACTION_SMS_LIVRE = "com.mitia.smsgateway.ACTION_SMS_LIVRE"

    /** Extrait portant l'identifiant de la tâche concernée par l'accusé. */
    const val EXTRA_TACHE_ID = "tache_id"

    /**
     * Au-delà de ce délai, un accusé jamais remonté au serveur est abandonné :
     * certains opérateurs n'émettent aucun DLR, on ne garde pas ça pour toujours.
     */
    const val EXPIRATION_ACCUSE_LIVRAISON_MS = 48 * 60 * 60 * 1000L
}
