package com.mitia.smsgateway.controller

import android.util.Log
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.messaging.FirebaseMessaging
import com.mitia.smsgateway.domain.model.RegisterResult
import com.mitia.smsgateway.domain.repository.DeviceRepository
import com.mitia.smsgateway.domain.repository.LogRepository
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
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
     * Charge (deviceId, token), sinon connecte anonymement via Firebase Auth
     * puis enregistre avec le nom configuré. Retourne null si impossible
     * (serveur injoignable ou auth Firebase échouée).
     */
    suspend fun ensureRegistered(): Pair<String, String>? {
        val existing = devices.getCredentials()
        if (existing != null) {
            Log.d(tag, "Device déjà enregistré : id=${existing.first}")
            return existing
        }
        // 1. Identité Firebase (anonyme) — exigée par /api/devices/register.
        val idToken = signInAnonymously()
        if (idToken == null) {
            Log.e(tag, "Échec connexion anonyme Firebase Auth")
            logs.log("échec auth Firebase : vérifie la connexion et le projet gateway")
            return null
        }
        val deviceName = devices.getDeviceName()
        Log.d(tag, "Aucun device enregistré, tentative registerDevice(\"$deviceName\")...")
        when (val registered = devices.register(deviceName, idToken)) {
            is RegisterResult.Success -> {
                devices.saveCredentials(registered.deviceId, registered.token)
                Log.d(tag, "Device enregistré et stocké : id=${registered.deviceId}")
                logs.log("appareil enregistré : $deviceName")
                return registered.deviceId to registered.token
            }
            is RegisterResult.HttpError -> {
                Log.e(tag, "Échec registerDevice : ${registered.code} ${registered.message}")
                logs.log("register rejeté (${registered.code}) : ${registered.message ?: "voir logs serveur"}")
                return null
            }
            RegisterResult.NetworkError -> {
                Log.e(tag, "Échec registerDevice : serveur injoignable (réseau ?)")
                logs.log("échec enregistrement : serveur injoignable")
                return null
            }
        }
    }

    /**
     * Connexion anonyme Firebase + ID token frais (exigé à l'enregistrement).
     * Retourne null si la connexion échoue (méthode Anonyme à activer
     * dans Firebase Console → Authentication → Sign-in method).
     */
    private suspend fun signInAnonymously(): String? {
        return try {
            val auth = FirebaseAuth.getInstance()
            if (auth.currentUser == null) {
                auth.signInAnonymously().await()
            }
            val user = auth.currentUser ?: return null
            user.getIdToken(true).await().token
        } catch (e: CancellationException) {
            // Arrêt du service en cours de connexion : propagation normale,
            // pas une erreur d'auth (ne rien logger ni mettre en file).
            throw e
        } catch (e: Exception) {
            Log.e(tag, "signInAnonymously impossible", e)
            logs.log("échec auth Firebase : ${e.message}")
            null
        }
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
