package com.mitia.smsgateway.domain.repository

import com.mitia.smsgateway.domain.model.QuotaDto
import com.mitia.smsgateway.domain.model.RegisterResult

/**
 * Device, serveur et état de synchronisation.
 * Façade au-dessus d'ApiClient (remote) + DevicePreferences (local).
 */
interface DeviceRepository {
    // Identifiants
    suspend fun getCredentials(): Pair<String, String>?
    suspend fun saveCredentials(deviceId: String, token: String)
    suspend fun clearCredentials()

    // Serveur
    suspend fun getServerUrl(): String
    suspend fun saveServerUrl(url: String): String
    suspend fun pingServer(): Boolean
    /** Teste une adresse saisie (sans l'enregistrer). */
    suspend fun ping(url: String): Boolean

    // Appareil
    suspend fun getDeviceName(): String
    suspend fun saveDeviceName(name: String)
    suspend fun register(deviceName: String, idToken: String): RegisterResult
    suspend fun disconnect(deviceId: String, token: String): Boolean
    suspend fun updateFcmToken(deviceId: String, token: String, fcmToken: String): Boolean

    // Quota serveur
    suspend fun getQuota(deviceId: String, token: String): QuotaDto?

    // Snapshots d'état (écrans)
    suspend fun saveSync(at: Long, count: Int)
    suspend fun loadSync(): Pair<Long, Int>
    suspend fun saveQuotaSnapshot(quota: Int, usage: Int)
    suspend fun loadQuotaSnapshot(): Pair<Int, Int>
}
