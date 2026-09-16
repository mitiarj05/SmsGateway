package com.mitia.smsgateway.service

import android.util.Log
import android.content.Intent
import android.os.Build
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.mitia.smsgateway.SmsGatewayApp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class FcmService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "FcmService"
    }

    private fun container() =
        (application as SmsGatewayApp).appContainer

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "Nouveau token FCM : $token")

        CoroutineScope(Dispatchers.IO).launch {
            val c = container()
            val credentials = c.deviceRepository.getCredentials()
            if (credentials != null) {
                val (deviceId, authToken) = credentials
                val success = c.deviceRepository.updateFcmToken(deviceId, authToken, token)
                Log.d(TAG, "Envoi token FCM au serveur : $success")
            } else {
                Log.w(TAG, "Pas de credentials device — token FCM stocké localement en attendant")
            }
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        Log.d(TAG, "Message FCM reçu : ${message.data}")

        if (message.data["action"] == "new_task") {
            Log.d(TAG, "Nouvelle tâche détectée, déclenchement du polling")
            CoroutineScope(Dispatchers.IO).launch {
                container().logRepository.log("notification push reçue")
            }
            val intent = Intent(applicationContext, SmsGatewayService::class.java)
            intent.action = "ACTION_POLL_NOW"
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(intent)
            } else {
                startService(intent)
            }
        }
    }
}
