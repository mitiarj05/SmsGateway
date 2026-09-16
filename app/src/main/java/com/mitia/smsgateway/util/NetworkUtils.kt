package com.mitia.smsgateway.util

import android.content.Context
import android.net.ConnectivityManager

/** Helpers réseau transverses (aucune permission dangereuse requise). */
object NetworkUtils {

    /** Une connexion réseau est-elle active ? (ACCESS_NETWORK_STATE, normale) */
    fun isOnline(context: Context): Boolean {
        return try {
            val cm = context.getSystemService(ConnectivityManager::class.java)
                ?: return false
            cm.activeNetwork != null
        } catch (_: Exception) {
            false
        }
    }
}
