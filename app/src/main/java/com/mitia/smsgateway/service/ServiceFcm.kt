package com.mitia.smsgateway.service

import android.util.Log
import android.content.Intent
import android.os.Build
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.mitia.smsgateway.AppPasserelleSms
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class ServiceFcm : FirebaseMessagingService() {

    companion object {
        private const val ETIQUETTE = "ServiceFcm"
    }

    private fun conteneur() =
        (application as AppPasserelleSms).conteneurApp

    override fun onNewToken(jeton: String) {
        super.onNewToken(jeton)
        Log.d(ETIQUETTE, "Nouveau jeton FCM : $jeton")

        CoroutineScope(Dispatchers.IO).launch {
            val cont = conteneur()
            val identifiants = cont.depotAppareils.obtenirIdentifiants()
            if (identifiants != null) {
                val (appareilId, jetonAuth) = identifiants
                val succes = cont.depotAppareils.mettreAJourJetonFcm(appareilId, jetonAuth, jeton)
                Log.d(ETIQUETTE, "Envoi jeton FCM au serveur : $succes")
            } else {
                Log.w(ETIQUETTE, "Pas d'identifiants appareil — jeton FCM stocké localement en attendant")
            }
        }
    }

    override fun onMessageReceived(messageDistant: RemoteMessage) {
        super.onMessageReceived(messageDistant)
        Log.d(ETIQUETTE, "Message FCM reçu : ${messageDistant.data}")

        if (messageDistant.data["action"] == "new_task") {
            Log.d(ETIQUETTE, "Nouvelle tâche détectée, déclenchement de la scrutation")
            CoroutineScope(Dispatchers.IO).launch {
                conteneur().depotJournaux.journaliser("notification push reçue")
            }
            val intention = Intent(applicationContext, ServicePasserelleSms::class.java)
            intention.action = "ACTION_POLL_NOW"
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(intention)
            } else {
                startService(intention)
            }
        }
    }
}
