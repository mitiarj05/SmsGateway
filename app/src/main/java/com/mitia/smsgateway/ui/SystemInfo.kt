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

/** Le service de polling tourne-t-il en ce moment ? */
fun isServiceRunning(context: Context): Boolean {
    val am = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    @Suppress("DEPRECATION")
    return am.getRunningServices(Int.MAX_VALUE)
        .any { it.service.className == "com.mitia.smsgateway.SmsGatewayService" }
}

/** Type de réseau actif (nécessite ACCESS_NETWORK_STATE, normale). */
fun networkType(context: Context): String {
    return try {
        val cm = context.getSystemService(ConnectivityManager::class.java)
            ?: return "Inconnu"
        val caps = cm.getNetworkCapabilities(cm.activeNetwork)
            ?: return "Hors ligne"
        when {
            caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "WiFi"
            caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> "Données mobiles"
            caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> "Ethernet"
            else -> "Connecté"
        }
    } catch (e: Exception) {
        Log.w("SystemInfo", "Lecture réseau impossible", e)
        "Inconnu"
    }
}

data class BatteryInfo(val percent: Int, val charging: Boolean)

/** Niveau + charge via l'intent sticky batterie (sans permission). */
fun batteryInfo(context: Context): BatteryInfo {
    return try {
        val intent = context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        val level = intent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale = intent?.getIntExtra(BatteryManager.EXTRA_SCALE, 100) ?: 100
        val status = intent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
        val pct = if (level >= 0 && scale > 0) (level * 100 / scale) else -1
        BatteryInfo(
            pct,
            status == BatteryManager.BATTERY_STATUS_CHARGING ||
                status == BatteryManager.BATTERY_STATUS_FULL
        )
    } catch (e: Exception) {
        Log.w("SystemInfo", "Lecture batterie impossible", e)
        BatteryInfo(-1, false)
    }
}

/** L'app est-elle exemptée d'optimisation batterie (indispensable au polling) ? */
fun isBatteryUnrestricted(context: Context): Boolean {
    return try {
        val pm = context.getSystemService(PowerManager::class.java)
            ?: return false
        pm.isIgnoringBatteryOptimizations(context.packageName)
    } catch (e: Exception) {
        Log.w("SystemInfo", "Lecture batterie impossible", e)
        false
    }
}

fun timeAgoText(at: Long): String {
    if (at <= 0) return "jamais synchronisé"
    val s = (System.currentTimeMillis() - at) / 1000
    return when {
        s < 5 -> "à l'instant"
        s < 60 -> "il y a $s s"
        s < 3600 -> "il y a ${s / 60} min"
        else -> "il y a ${s / 3600} h"
    }
}
