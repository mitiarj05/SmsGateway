package com.mitia.smsgateway

import android.util.Log
import com.google.gson.Gson
import com.google.gson.JsonObject
import com.google.gson.JsonParser
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
@Suppress("PropertyName") // noms snake_case volontaires : identiques au JSON serveur
object ApiClient {

    private const val TAG = "ApiClient"

    /**
     * URL du serveur, modifiable sans recompiler :
     * [setBaseUrl] au démarrage (service / écran d'accueil).
     * En émulateur : http://10.0.2.2:3001 — sur téléphone : http://IP_DU_PC:3001
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

    // -------------------- Data classes --------------------

    data class RegisterResponse(
        val message: String,
        val device: DeviceDto
    )

    data class DeviceDto(
        val id: String,
        val nom: String,
        val token: String,
        val statut: String,
        val created_at: String
    )

    data class TaskDto(
        val id: String,
        val numero_destinataire: String,
        val message: String,
        val statut: String,
        val created_at: String
    )

    data class GetTasksResponse(
        val device: DeviceSimpleDto,
        val tasks: List<TaskDto>,
        val count: Int
    )

    data class DeviceSimpleDto(
        val id: String,
        val nom: String
    )

    data class StatusResponse(
        val message: String,
        val task: TaskDto
    )

    // -------------------- Résultats détaillés (anti-doublon) --------------------

    /**
     * Résultat précis d'un updateTaskStatus.
     *
     * Pourquoi pas un simple Boolean ? Piège 3 :
     * - le téléphone retry une confirmation SENT après une coupure WiFi ;
     *   si le serveur répond 409 "déjà SENT", c'est un SUCCÈS idempotent,
     *   pas un échec (le SMS est bien parti, inutile de le renvoyer).
     * - si la task est assignée à un AUTRE device (409), il ne faut PAS
     *   envoyer le SMS : on skip.
     */
    sealed interface StatusResult {
        data object Success : StatusResult
        /** 409 mais current_status == statut demandé → le retry a déjà abouti. */
        data object AlreadyConfirmed : StatusResult
        /** Task claimée par un autre device → ne pas envoyer le SMS. */
        data class AssignedToOther(val assignedTo: String?) : StatusResult
        /** Task finalisée (SENT/FAILED) avec un statut différent → ne pas toucher. */
        data class FinalizedConflict(val currentStatus: String?) : StatusResult
        data class HttpError(val code: Int) : StatusResult
        /** Timeout, DNS, WiFi coupé... → à retry plus tard, JAMAIS renvoyer le SMS. */
        data object NetworkError : StatusResult
    }

    sealed interface TasksResult {
        data class Success(val tasks: List<TaskDto>) : TasksResult
        data object NetworkError : TasksResult
    }

    // -------------------- Méthodes --------------------

    /**
     * Enregistre un nouveau device auprès du serveur.
     * Retourne (deviceId, token) ou null en cas d'erreur.
     */
    suspend fun registerDevice(nom: String): Pair<String, String>? = withContext(Dispatchers.IO) {
        try {
            val body = gson.toJson(mapOf("nom" to nom))
                .toRequestBody(JSON)

            val request = Request.Builder()
                .url("$baseUrl/api/devices/register")
                .post(body)
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    Log.e(TAG, "Register échoué : ${response.code} ${response.message}")
                    return@withContext null
                }

                val responseBody = response.body?.string() ?: return@withContext null
                val parsed = gson.fromJson(responseBody, RegisterResponse::class.java)
                Log.d(TAG, "Device enregistré : ${parsed.device.id}")
                return@withContext parsed.device.id to parsed.device.token
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erreur registerDevice", e)
            return@withContext null
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