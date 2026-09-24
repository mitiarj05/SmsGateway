package com.mitia.smsgateway.util

/** Constantes partagées de la scrutation et du foreground service. */
object Constantes {
    /** Intervalle de scrutation des tâches. */
    const val INTERVALLE_SCRUTATION_MS = 30_000L

    /** Notification permanente du foreground service. */
    const val CANAL_PREMIER_PLAN_ID = "sms_gateway_channel"
    const val ID_NOTIFICATION_PREMIER_PLAN = 1
}
