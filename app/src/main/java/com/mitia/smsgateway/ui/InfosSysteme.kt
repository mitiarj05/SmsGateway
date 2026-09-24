package com.mitia.smsgateway.ui

import android.app.ActivityManager
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.BatteryManager
import android.os.PowerManager
import android.util.Log

/** Le service de scrutation tourne-t-il en ce moment ? */
fun serviceEnCoursExecution(context: Context): Boolean {
    val gestionnaireActivite = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    @Suppress("DEPRECATION")
    return gestionnaireActivite.getRunningServices(Int.MAX_VALUE)
        .any { it.service.className == "com.mitia.smsgateway.service.ServicePasserelleSms" }
}

/** Type de réseau actif (nécessite ACCESS_NETWORK_STATE, normale). */
fun typeReseau(context: Context): String {
    return try {
        val gestionnaireConnectivite = context.getSystemService(ConnectivityManager::class.java)
            ?: return "Inconnu"
        val capacites = gestionnaireConnectivite.getNetworkCapabilities(gestionnaireConnectivite.activeNetwork)
            ?: return "Hors ligne"
        when {
            capacites.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "WiFi"
            capacites.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> "Données mobiles"
            capacites.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> "Ethernet"
            else -> "Connecté"
        }
    } catch (e: Exception) {
        Log.w("InfosSysteme", "Lecture réseau impossible", e)
        "Inconnu"
    }
}

data class InfosBatterie(val pourcentage: Int, val enCharge: Boolean)

/** Niveau + charge via l'intent sticky batterie (sans permission). */
fun infosBatterie(context: Context): InfosBatterie {
    return try {
        val intention = context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        val niveau = intention?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val echelle = intention?.getIntExtra(BatteryManager.EXTRA_SCALE, 100) ?: 100
        val statut = intention?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
        val pourcentage = if (niveau >= 0 && echelle > 0) (niveau * 100 / echelle) else -1
        InfosBatterie(
            pourcentage,
            statut == BatteryManager.BATTERY_STATUS_CHARGING ||
                statut == BatteryManager.BATTERY_STATUS_FULL
        )
    } catch (e: Exception) {
        Log.w("InfosSysteme", "Lecture batterie impossible", e)
        InfosBatterie(-1, false)
    }
}

/** L'app est-elle exemptée d'optimisation batterie (indispensable à la scrutation) ? */
fun batterieSansRestriction(context: Context): Boolean {
    return try {
        val gestionnaireAlimentation = context.getSystemService(PowerManager::class.java)
            ?: return false
        gestionnaireAlimentation.isIgnoringBatteryOptimizations(context.packageName)
    } catch (e: Exception) {
        Log.w("InfosSysteme", "Lecture batterie impossible", e)
        false
    }
}

fun texteTempsEcoule(horodatage: Long): String {
    if (horodatage <= 0) return "jamais synchronisé"
    val s = (System.currentTimeMillis() - horodatage) / 1000
    return when {
        s < 5 -> "à l'instant"
        s < 60 -> "il y a $s s"
        s < 3600 -> "il y a ${s / 60} min"
        else -> "il y a ${s / 3600} h"
    }
}
