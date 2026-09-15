package com.mitia.smsgateway

import android.content.Context
import androidx.datastore.preferences.core.edit
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

    const val DEFAULT_SERVER_HOST = "192.168.4.147"
    const val DEFAULT_SERVER_PORT = "3000"

    /**
     * URL complète du serveur.
     */
    suspend fun getServerUrl(context: Context): String {
        val host = getServerHost(context)
        val port = getServerPort(context)
        return "http://$host:$port"
    }

    /**
     * Sauvegarde la connexion serveur avec host et port séparés.
     */
    suspend fun saveServerUrl(context: Context, url: String) {
        val normalized = normalizeUrl(url)
        val hostPort = normalized
            .removePrefix("http://")
            .removePrefix("https://")
            .removeSuffix("/")
        val parts = hostPort.split(":")
        context.dataStore.edit { prefs ->
            prefs[KEY_SERVER_HOST] = parts.first()
            prefs[KEY_SERVER_PORT] = parts.getOrNull(1) ?: DEFAULT_SERVER_PORT
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
     * Normalise une URL brute en format host:port.
     */
    fun normalizeUrl(raw: String): String {
        var url = raw.trim().removeSuffix("/")
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "http://$url"
        }
        return url
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
     * Efface les données stockées (utile pour re-enregistrer le device).
     */
    suspend fun clear(context: Context) {
        context.dataStore.edit { prefs ->
            prefs.remove(KEY_DEVICE_ID)
            prefs.remove(KEY_TOKEN)
        }
    }
}