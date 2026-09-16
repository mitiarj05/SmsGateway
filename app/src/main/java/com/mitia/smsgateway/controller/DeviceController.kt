package com.mitia.smsgateway.controller

import android.util.Log
import com.google.firebase.messaging.FirebaseMessaging
import com.mitia.smsgateway.domain.repository.DeviceRepository
import com.mitia.smsgateway.domain.repository.LogRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Authentification et enregistrement du device.
 * Utilisé au démarrage du service (et au boot).
 */
class DeviceController(
    private val devices: DeviceRepository,
    private val logs: LogRepository
) {

    private val tag = "DeviceController"

    /**
     * Charge (deviceId, token), sinon enregistre avec le nom configuré.
     * Retourne null si le serveur est injoignable.
     */
    suspend fun ensureRegistered(): Pair<String, String>? {
        val existing = devices.getCredentials()
        if (existing != null) {
            Log.d(tag, "Device déjà enregistré : id=${existing.first}")
            return existing
        }
        val deviceName = devices.getDeviceName()
        Log.d(tag, "Aucun device enregistré, tentative registerDevice(\"$deviceName\")...")
        val registered = devices.register(deviceName)
        if (registered == null) {
            Log.e(tag, "Échec registerDevice : vérifie BASE_URL, serveur Next.js démarré, et INTERNET")
            logs.log("échec enregistrement : serveur injoignable")
            return null
        }
        devices.saveCredentials(registered.first, registered.second)
        Log.d(tag, "Device enregistré et stocké : id=${registered.first}")
        logs.log("appareil enregistré : $deviceName")
        return registered
    }

    /** Envoie le token FCM actuel au serveur (best-effort, arrière-plan). */
    fun refreshFcmToken(deviceId: String, token: String) {
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (task.isSuccessful) {
                Log.d(tag, "Token FCM actuel : ${task.result}")
                CoroutineScope(Dispatchers.IO).launch {
                    devices.updateFcmToken(deviceId, token, task.result)
                }
            } else {
                Log.e(tag, "Impossible de récupérer le token FCM", task.exception)
            }
        }
    }
}
