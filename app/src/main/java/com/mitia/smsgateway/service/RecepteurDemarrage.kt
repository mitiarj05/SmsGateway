package com.mitia.smsgateway.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import com.mitia.smsgateway.data.local.PreferencesAppareil
import kotlinx.coroutines.runBlocking

class RecepteurDemarrage : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        Log.d("RecepteurDemarrage", "onReceive appelé, action = ${intent.action}")

        val action = intent.action
        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == "android.intent.action.QUICKBOOT_POWERON" ||
            action == Intent.ACTION_LOCKED_BOOT_COMPLETED ||
            action == "com.mitia.smsgateway.TEST_BOOT"
        ) {
            val demarrageAuto = runBlocking {
                runCatching { PreferencesAppareil.estDemarrageAuto(context) }.getOrDefault(true)
            }
            if (!demarrageAuto) {
                Log.d("RecepteurDemarrage", "Démarrage auto désactivé par l'utilisateur : rien à faire")
                return
            }
            Log.d("RecepteurDemarrage", "Démarrage du service déclenché par $action")
            val intentionService = Intent(context, ServicePasserelleSms::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intentionService)
            } else {
                context.startService(intentionService)
            }
        }
    }
}
