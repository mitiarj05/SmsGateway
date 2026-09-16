package com.mitia.smsgateway.data.local

import android.content.Context
import android.os.Build
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first

/**
 * Stockage local du deviceId et du token d'authentification.
 * Utilise DataStore Preferences (recommandé par Android depuis 2020).
 */
private val Context.dataStore by preferencesDataStore(name = "sms_gateway_prefs")

/** Instance partagée (même fichier) pour les autres stores du package. */
internal val Context.sharedPrefsDataStore
    get() = dataStore

object DevicePreferences {

    private val KEY_DEVICE_ID = stringPreferencesKey("device_id")
    private val KEY_TOKEN = stringPreferencesKey("device_token")
    private val KEY_SERVER_HOST = stringPreferencesKey("server_host")
    private val KEY_SERVER_PORT = stringPreferencesKey("server_port")
    private val KEY_SERVER_URL = stringPreferencesKey("server_url")
    private val KEY_DEVICE_NAME = stringPreferencesKey("device_name")
    private val KEY_LAST_SYNC = longPreferencesKey("last_sync")
    private val KEY_LAST_COUNT = intPreferencesKey("last_task_count")
    private val KEY_QUOTA = intPreferencesKey("quota")
    private val KEY_QUOTA_USAGE = intPreferencesKey("quota_usage")

    const val DEFAULT_SERVER_HOST = "192.168.4.147"
    const val DEFAULT_SERVER_PORT = "3000"

    /**
     * URL complète du serveur, exactement telle que saisie
     * (ex. https://sms-gateway-omega.vercel.app ou http://192.168.1.10:3000).
     * Migration : anciennes versions stockées en host/port séparés.
     */
    suspend fun getServerUrl(context: Context): String {
        val prefs = context.dataStore.data.first()
        prefs[KEY_SERVER_URL]?.takeIf { it.isNotBlank() }?.let { return it }
        val host = prefs[KEY_SERVER_HOST] ?: DEFAULT_SERVER_HOST
        val port = prefs[KEY_SERVER_PORT] ?: DEFAULT_SERVER_PORT
        return "http://$host:$port"
    }

    /**
     * Sauvegarde l'URL telle que saisie (sans ajout de port).
     */
    suspend fun saveServerUrl(context: Context, url: String) {
        context.dataStore.edit { prefs ->
            prefs[KEY_SERVER_URL] = normalizeUrl(url)
        }
    }

    /**
     * Récupère le host du serveur (IP ou nom de domaine).
     */
    suspend fun getServerHost(context: Context): String {
        val prefs = context.dataStore.data.first()
        return prefs[KEY_SERVER_HOST] ?: DEFAULT_SERVER_HOST
    }

    /**
     * Récupère le port du serveur.
     */
    suspend fun getServerPort(context: Context): String {
        val prefs = context.dataStore.data.first()
        return prefs[KEY_SERVER_PORT] ?: DEFAULT_SERVER_PORT
    }

    /**
     * Met à jour uniquement le host du serveur (le port reste 3000).
     * Appelle cette méthode quand tu changes de WiFi.
     */
    suspend fun saveServerHost(context: Context, host: String) {
        context.dataStore.edit { prefs ->
            prefs[KEY_SERVER_HOST] = host
        }
    }

    /**
     * Normalise une URL saisie : rogne les espaces et le "/" final, ajoute un
     * schéma seulement s'il manque (http pour le local, https sinon).
     * Le port n'est JAMAIS ajouté : saisissez-le explicitement si besoin
     * (ex. http://192.168.1.10:3000).
     */
    fun normalizeUrl(raw: String): String {
        var url = raw.trim().removeSuffix("/")
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            val host = url.substringBefore(":").substringBefore("/").lowercase()
            url = if (isLocalHost(host)) "http://$url" else "https://$url"
        }
        return url
    }

    private fun isLocalHost(host: String): Boolean {
        if (host == "localhost" || host == "127.0.0.1" || host == "10.0.2.2") return true
        if (host.startsWith("192.168.") || host.startsWith("10.")) return true
        if (host.startsWith("172.")) {
            val second = host.split(".").getOrNull(1)?.toIntOrNull()
            if (second != null && second in 16..31) return true
        }
        // Toute autre adresse IPv4 = réseau local par défaut.
        if (host.matches(Regex("\\d+\\.\\d+\\.\\d+\\.\\d+"))) return true
        return false
    }

    /**
     * Nom affiché du device sur le dashboard (modèle du téléphone par défaut).
     * Utilisé à l'enregistrement ; changer de nom ensuite = réinitialiser + redémarrer.
     */
    suspend fun getDeviceName(context: Context): String {
        val prefs = context.dataStore.data.first()
        return prefs[KEY_DEVICE_NAME]?.takeIf { it.isNotBlank() } ?: Build.MODEL
    }

    suspend fun saveDeviceName(context: Context, name: String) {
        context.dataStore.edit { prefs ->
            prefs[KEY_DEVICE_NAME] = name.trim()
        }
    }

    /**
     * Sauvegarde le deviceId et le token.
     */
    suspend fun save(context: Context, deviceId: String, token: String) {
        context.dataStore.edit { prefs ->
            prefs[KEY_DEVICE_ID] = deviceId
            prefs[KEY_TOKEN] = token
        }
    }

    /**
     * Récupère (deviceId, token) ou null si non enregistré.
     */
    suspend fun load(context: Context): Pair<String, String>? {
        val prefs = context.dataStore.data.first()
        val deviceId = prefs[KEY_DEVICE_ID]
        val token = prefs[KEY_TOKEN]
        return if (deviceId != null && token != null) {
            deviceId to token
        } else {
            null
        }
    }

    /**
     * Dernier polling réussi (epoch ms, 0 = jamais) + tâches vues.
     * Alimente les écrans Statut / Tâches.
     */
    suspend fun saveSync(context: Context, at: Long, count: Int) {
        context.dataStore.edit { prefs ->
            prefs[KEY_LAST_SYNC] = at
            prefs[KEY_LAST_COUNT] = count
        }
    }

    suspend fun loadSync(context: Context): Pair<Long, Int> {
        val prefs = context.dataStore.data.first()
        return (prefs[KEY_LAST_SYNC] ?: 0L) to (prefs[KEY_LAST_COUNT] ?: 0)
    }

    /** Snapshot quota serveur (usage / quota), affiché écrans Statut / Réglages. */
    suspend fun saveQuotaSnapshot(context: Context, quota: Int, usage: Int) {
        context.dataStore.edit { prefs ->
            prefs[KEY_QUOTA] = quota
            prefs[KEY_QUOTA_USAGE] = usage
        }
    }

    suspend fun loadQuotaSnapshot(context: Context): Pair<Int, Int> {
        val prefs = context.dataStore.data.first()
        return (prefs[KEY_QUOTA] ?: 20) to (prefs[KEY_QUOTA_USAGE] ?: 0)
    }

    /**
     * Efface les données stockées (utile pour re-enregistrer le device).
     */
    suspend fun clear(context: Context) {
        context.dataStore.edit { prefs ->
            prefs.remove(KEY_DEVICE_ID)
            prefs.remove(KEY_TOKEN)
        }
    }
}