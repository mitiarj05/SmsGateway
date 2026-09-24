package com.mitia.smsgateway.util

import android.content.Context
import android.net.ConnectivityManager

/** Helpers réseau transverses (aucune permission dangereuse requise). */
object UtilitairesReseau {

    /** Une connexion réseau est-elle active ? (ACCESS_NETWORK_STATE, normale) */
    fun estEnLigne(context: Context): Boolean {
        return try {
            val gestionnaireConnectivite = context.getSystemService(ConnectivityManager::class.java)
                ?: return false
            gestionnaireConnectivite.activeNetwork != null
        } catch (_: Exception) {
            false
        }
    }
}
