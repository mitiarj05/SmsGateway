package com.mitia.smsgateway.data.remote

import android.util.Log
import com.google.gson.Gson
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import com.mitia.smsgateway.data.local.DevicePreferences
import com.mitia.smsgateway.domain.model.GetTasksResponse
import com.mitia.smsgateway.domain.model.QuotaDto
import com.mitia.smsgateway.domain.model.QuotaResult
import com.mitia.smsgateway.domain.model.RegisterResponse
import com.mitia.smsgateway.domain.model.RegisterResult
import com.mitia.smsgateway.domain.model.StatusResult
import com.mitia.smsgateway.domain.model.TaskDto
import com.mitia.smsgateway.domain.model.TasksResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

/**
 * Client HTTP minimal pour communiquer avec le serveur SMS-Gateway.
 *
 * Toutes les méthodes sont "suspend" : elles doivent être appelées depuis
 * une coroutine. Elles utilisent Dispatchers.IO pour ne pas bloquer le thread UI.
 */
object ApiClient {

    private const val TAG = "ApiClient"

    /**
     * URL du serveur, modifiable sans recompiler :
     * [setBaseUrl] au démarrage (service / écran d'accueil).
     * En émulateur : http://10.0.2.2:3000 — sur téléphone : http://IP_DU_PC:3000
     */
    @Volatile
    var baseUrl: String = DevicePreferences.DEFAULT_SERVER_URL
        private set

    fun setBaseUrl(url: String) {
        baseUrl = DevicePreferences.normalizeUrl(url)
        Log.d(TAG, "Base URL : $baseUrl")
    }

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .writeTimeout(15, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()
    private val JSON = "application/json; charset=utf-8".toMediaType()

    // -------------------- Méthodes --------------------

    /**
     * Teste la joignabilité du serveur (GET racine, attendue 200).
     * Utilisé par l'écran d'accueil, avant d'enregistrer l'adresse.
     */
    suspend fun pingServer(): Boolean = pingLatencyMs() >= 0

    /**
     * Latence aller-retour vers le serveur en millisecondes (-1 si injoignable).
     * Utilisé par l'écran Diagnostic.
     */
    suspend fun pingLatencyMs(): Long = withContext(Dispatchers.IO) {
        try {
            val start = android.os.SystemClock.elapsedRealtime()
            val request = Request.Builder()
                .url(baseUrl)
                .get()
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext -1L
                return@withContext android.os.SystemClock.elapsedRealtime() - start
            }
        } catch (e: Exception) {
            Log.e(TAG, "pingServer échoué ($baseUrl)", e)
            return@withContext -1L
        }
    }

    /**
     * Enregistre un nouveau device auprès du serveur.
     * Exige l'ID token Firebase Auth (connexion anonyme) : le serveur
     * refuse tout enregistrement non authentifié (401).
     */
    suspend fun registerDevice(nom: String, idToken: String): RegisterResult = withContext(Dispatchers.IO) {
        try {
            val body = gson.toJson(mapOf("nom" to nom))
                .toRequestBody(JSON)

            val request = Request.Builder()
                .url("$baseUrl/api/devices/register")
                .header("Authorization", "Bearer $idToken")
                .post(body)
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    val raw = try { response.body?.string() } catch (_: Exception) { null }
                    val serverMessage = try {
                        raw?.let { gson.fromJson(it, Map::class.java)["error"] as? String }
                    } catch (_: Exception) { null }
                    Log.e(TAG, "Register échoué : ${response.code} $serverMessage")
                    return@withContext RegisterResult.HttpError(response.code, serverMessage)
                }

                val responseBody = response.body?.string()
                    ?: return@withContext RegisterResult.HttpError(response.code, "réponse vide")
                val parsed = gson.fromJson(responseBody, RegisterResponse::class.java)
                Log.d(TAG, "Device enregistré : ${parsed.device.id}")
                return@withContext RegisterResult.Success(parsed.device.id, parsed.device.token)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erreur registerDevice", e)
            return@withContext RegisterResult.NetworkError
        }
    }

    /**
     * Récupère les tâches en attente pour ce device.
     */
    suspend fun getTasks(deviceId: String, token: String): List<TaskDto> = withContext(Dispatchers.IO) {
        when (val r = getTasksDetailed(deviceId, token)) {
            is TasksResult.Success -> r.tasks
            TasksResult.NetworkError -> emptyList()
        }
    }

    /**
     * Variante qui distingue "aucune tâche" de "réseau coupé"
     * (pour le backoff exponentiel côté service).
     */
    suspend fun getTasksDetailed(deviceId: String, token: String): TasksResult = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url("$baseUrl/api/devices/$deviceId/tasks")
                .header("Authorization", "Bearer $token")
                .get()
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    Log.e(TAG, "getTasks échoué : ${response.code} ${response.message}")
                    // 401/404 = problème d'auth, pas forcément réseau, mais on
                    // backoff quand même : inutile de spammer le serveur.
                    return@withContext TasksResult.NetworkError
                }

                val responseBody = response.body?.string()
                    ?: return@withContext TasksResult.Success(emptyList())
                val parsed = gson.fromJson(responseBody, GetTasksResponse::class.java)
                Log.d(TAG, "getTasks : ${parsed.count} tâche(s)")
                return@withContext TasksResult.Success(parsed.tasks)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erreur getTasks (réseau coupé ?)", e)
            return@withContext TasksResult.NetworkError
        }
    }

    /**
     * Confirme au serveur le statut d'une tâche.
     * @param statut "SENDING", "SENT" ou "FAILED"
     *
     * Compat : true si confirmé OU déjà confirmé (idempotent).
     */
    suspend fun updateTaskStatus(
        deviceId: String,
        token: String,
        taskId: String,
        statut: String,
        errorMessage: String? = null
    ): Boolean {
        return when (updateTaskStatusDetailed(deviceId, token, taskId, statut, errorMessage)) {
            StatusResult.Success, StatusResult.AlreadyConfirmed -> true
            else -> false
        }
    }

    /**
     * Version détaillée : distingue succès / conflit / réseau.
     * INDISPENSABLE pour l'anti-doublon (voir [StatusResult]).
     */
    suspend fun updateTaskStatusDetailed(
        deviceId: String,
        token: String,
        taskId: String,
        statut: String,
        errorMessage: String? = null
    ): StatusResult = withContext(Dispatchers.IO) {
        try {
            val payload = JsonObject().apply {
                addProperty("statut", statut)
                if (errorMessage != null) addProperty("error_message", errorMessage)
            }
            val body = gson.toJson(payload).toRequestBody(JSON)

            val request = Request.Builder()
                .url("$baseUrl/api/devices/$deviceId/tasks/$taskId/status")
                .header("Authorization", "Bearer $token")
                .post(body)
                .build()

            client.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    Log.d(TAG, "Statut mis à jour : $statut pour task $taskId")
                    return@withContext StatusResult.Success
                }
                if (response.code == 409) {
                    // Le serveur refuse : task déjà prise ou déjà finalisée.
                    // On parse le body pour savoir si c'est un succès idempotent.
                    val raw = try { response.body?.string() } catch (_: Exception) { null }
                    var currentStatus: String? = null
                    var assignedTo: String? = null
                    try {
                        val json = raw?.let { JsonParser.parseString(it)?.asJsonObject }
                        currentStatus = json?.get("current_status")?.takeIf { !it.isJsonNull }?.asString
                        assignedTo = json?.get("assigned_to")?.takeIf { !it.isJsonNull }?.asString
                    } catch (_: Exception) { }
                    if (currentStatus != null && currentStatus == statut) {
                        Log.d(TAG, "Task $taskId déjà confirmée $statut (idempotent, 409) → succès")
                        return@withContext StatusResult.AlreadyConfirmed
                    }
                    if (currentStatus == "SENT" || currentStatus == "FAILED") {
                        Log.w(TAG, "Task $taskId déjà finalisée ($currentStatus), on ne touche pas")
                        return@withContext StatusResult.FinalizedConflict(currentStatus)
                    }
                    Log.w(TAG, "Task $taskId assignée à un autre device ($assignedTo), on skip l'envoi")
                    return@withContext StatusResult.AssignedToOther(assignedTo)
                }
                Log.e(TAG, "updateTaskStatus échoué : ${response.code} ${response.message}")
                return@withContext StatusResult.HttpError(response.code)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erreur updateTaskStatus (réseau coupé ?), task=$taskId statut=$statut", e)
            return@withContext StatusResult.NetworkError
        }
    }

    /**
     * Envoie le token FCM au serveur.
     */
    suspend fun updateFcmToken(
        deviceId: String,
        authToken: String,
        fcmToken: String
    ): Boolean = withContext(Dispatchers.IO) {
        try {
            val body = gson.toJson(mapOf("fcm_token" to fcmToken))
                .toRequestBody(JSON)

            val request = Request.Builder()
                .url("$baseUrl/api/devices/$deviceId/fcm-token")
                .header("Authorization", "Bearer $authToken")
                .post(body)
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    Log.e(TAG, "updateFcmToken échoué : ${response.code}")
                    return@withContext false
                }
                Log.d(TAG, "Token FCM envoyé au serveur")
                return@withContext true
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erreur updateFcmToken", e)
            return@withContext false
        }
    }

    /**
     * Signale l'arrêt du device (bouton Déconnecter, service tué).
     * Le serveur passe le statut à OFFLINE (jamais DISABLED, réservé admin).
     */
    suspend fun disconnect(deviceId: String, token: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url("$baseUrl/api/devices/$deviceId/offline")
                .header("Authorization", "Bearer $token")
                .post(ByteArray(0).toRequestBody(null))
                .build()

            client.newCall(request).execute().use { response ->
                return@withContext response.isSuccessful
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erreur disconnect (réseau coupé ?)", e)
            return@withContext false
        }
    }

    /**
     * Quota et usage horaire du device (endpoint imposé par le serveur).
     * Utilisé par l'app pour l'écran Statut et les réglages.
     */
    suspend fun getQuotaDetailed(deviceId: String, token: String): QuotaResult = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url("$baseUrl/api/devices/$deviceId/quota")
                .header("Authorization", "Bearer $token")
                .get()
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    Log.e(TAG, "getQuota échoué : ${response.code} ${response.message}")
                    return@withContext QuotaResult.NetworkError
                }
                val responseBody = response.body?.string()
                    ?: return@withContext QuotaResult.NetworkError
                val parsed = gson.fromJson(responseBody, QuotaDto::class.java)
                return@withContext QuotaResult.Success(parsed)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erreur getQuota (réseau coupé ?)", e)
            return@withContext QuotaResult.NetworkError
        }
    }

    /**
     * Retry réseau avec backoff exponentiel pour les confirmations.
     *
     * Utilisé APRÈS l'envoi du SMS : le SMS n'est envoyé QU'UNE fois,
     * seule la confirmation HTTP est rejouée (jamais de 2e envoi SMS).
     *
     * @return true si le serveur a confirmé (ou avait déjà confirmé).
     */
    suspend fun confirmWithRetry(
        deviceId: String,
        token: String,
        taskId: String,
        statut: String,
        errorMessage: String? = null,
        maxAttempts: Int = 4
    ): Boolean {
        var waitMs = 1_000L
        repeat(maxAttempts) { attempt ->
            when (val r = updateTaskStatusDetailed(deviceId, token, taskId, statut, errorMessage)) {
                StatusResult.Success, StatusResult.AlreadyConfirmed -> return true
                // Conflit métier définitif : retry inutile → on purge la file
                // (le serveur fait foi ; le SMS a déjà été envoyé une seule fois).
                is StatusResult.AssignedToOther -> {
                    Log.w(TAG, "Confirmation $taskId ($statut) rejetée : assignée à ${r.assignedTo}, purge")
                    return true
                }
                is StatusResult.FinalizedConflict -> {
                    Log.w(TAG, "Confirmation $taskId ($statut) rejetée : déjà ${r.currentStatus}, purge")
                    return true
                }
                is StatusResult.HttpError, StatusResult.NetworkError -> {
                    if (attempt == maxAttempts - 1) return false
                    Log.d(TAG, "Retry confirmation $taskId ($statut) tentative ${attempt + 1}/$maxAttempts dans ${waitMs}ms")
                    delay(waitMs)
                    waitMs = (waitMs * 2).coerceAtMost(8_000L)
                }
            }
        }
        return false
    }
}
