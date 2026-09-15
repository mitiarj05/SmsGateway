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
    private val KEY_SERVER_URL = stringPreferencesKey("server_url")

    const val DEFAULT_SERVER_URL = "http://192.168.4.147:3001"

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

    /**
     * URL du serveur (modifiable dans l'app quand on change de WiFi,
     * sans recompiler). Normalisée : sans '/' final.
     */
    suspend fun getServerUrl(context: Context): String {
        val prefs = context.dataStore.data.first()
        return normalizeUrl(prefs[KEY_SERVER_URL] ?: DEFAULT_SERVER_URL)
    }

    suspend fun saveServerUrl(context: Context, url: String) {
        context.dataStore.edit { prefs ->
            prefs[KEY_SERVER_URL] = normalizeUrl(url)
        }
    }

    fun normalizeUrl(raw: String): String {
        var url = raw.trim().removeSuffix("/")
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "http://$url"
        }
        return url
    }
}