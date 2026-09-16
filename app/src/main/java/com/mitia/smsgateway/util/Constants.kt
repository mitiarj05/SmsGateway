package com.mitia.smsgateway.util

/** Constantes partagées du polling et du foreground service. */
object Constants {
    /** Intervalle de polling des tâches. */
    const val POLL_INTERVAL_MS = 30_000L

    /** Notification permanente du foreground service. */
    const val FOREGROUND_CHANNEL_ID = "sms_gateway_channel"
    const val FOREGROUND_NOTIFICATION_ID = 1
}
