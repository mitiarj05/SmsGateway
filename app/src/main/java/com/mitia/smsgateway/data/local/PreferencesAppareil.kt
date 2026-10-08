package com.mitia.smsgateway.data.local

import android.content.Context
import android.os.Build
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first

/**
 * Stockage local de l'identifiant d'appareil, du jeton d'authentification et des préférences UI.
 * Utilise DataStore Preferences (recommandé par Android depuis 2020).
 */
private val Context.magasinDonnees by preferencesDataStore(name = "sms_gateway_prefs")

/** Instance partagée (même fichier) pour les autres magasins du package. */
internal val Context.magasinPrefsPartage
    get() = magasinDonnees

object PreferencesAppareil {

    private val CLE_APPAREIL_ID = stringPreferencesKey("device_id")
    private val CLE_JETON = stringPreferencesKey("device_token")
    private val CLE_SERVEUR_HOTE = stringPreferencesKey("server_host")
    private val CLE_SERVEUR_PORT = stringPreferencesKey("server_port")
    private val CLE_SERVEUR_URL = stringPreferencesKey("server_url")
    private val CLE_NOM_APPAREIL = stringPreferencesKey("device_name")
    private val CLE_DERNIERE_SYNCHRO = longPreferencesKey("last_sync")
    private val CLE_DERNIER_COMPTEUR = intPreferencesKey("last_task_count")
    private val CLE_QUOTA = intPreferencesKey("quota")
    private val CLE_QUOTA_USAGE = intPreferencesKey("quota_usage")
    private val CLE_INTEGRATION_TERMINEE = booleanPreferencesKey("onboarding_done")
    private val CLE_ONBOARDING_VU = booleanPreferencesKey("onboarding_seen")
    private val CLE_CONNECTE_SESSION = booleanPreferencesKey("logged_in_session")
    private val CLE_SIM_MODE = stringPreferencesKey("sim_mode")
    private val CLE_SIM_SOUSCRIPTION = intPreferencesKey("sim_sub_id")
    private val CLE_SIM_COMPTEUR = intPreferencesKey("sim_counter")
    private val CLE_THEME_SOMBRE = booleanPreferencesKey("dark_theme")
    private val CLE_DEMARRAGE_AUTO = booleanPreferencesKey("demarrage_auto")

    const val DEFAUT_SERVEUR_HOTE = "192.168.4.147"
    const val DEFAUT_SERVEUR_PORT = "3000"

    /** Serveur de production : aucune saisie nécessaire par défaut. */
    const val DEFAUT_SERVEUR_URL = "https://sms-gateway-omega.vercel.app"

    /** Preference Onboarding Vu */
    suspend fun estOnboardingVu(context: Context): Boolean {
        return context.magasinDonnees.data.first()[CLE_ONBOARDING_VU] ?: false
    }

    suspend fun enregistrerOnboardingVu(context: Context, vu: Boolean) {
        context.magasinDonnees.edit { prefs -> prefs[CLE_ONBOARDING_VU] = vu }
    }

    /** Preference Session Connectée */
    suspend fun estConnecteSession(context: Context): Boolean {
        return context.magasinDonnees.data.first()[CLE_CONNECTE_SESSION] ?: false
    }

    suspend fun enregistrerConnecteSession(context: Context, connecte: Boolean) {
        context.magasinDonnees.edit { prefs -> prefs[CLE_CONNECTE_SESSION] = connecte }
    }

    /**
     * Preference thème UI : mode sombre par défaut (false pour thème clair).
     */
    suspend fun estThemeSombre(context: Context): Boolean {
        return context.magasinDonnees.data.first()[CLE_THEME_SOMBRE] ?: false
    }

    suspend fun enregistrerThemeSombre(context: Context, sombre: Boolean) {
        context.magasinDonnees.edit { prefs -> prefs[CLE_THEME_SOMBRE] = sombre }
    }

    /**
     * Démarrage automatique du service au boot (vrai interrupteur
     * de l'écran Paramètres, lu par RecepteurDemarrage).
     */
    suspend fun estDemarrageAuto(context: Context): Boolean {
        return context.magasinDonnees.data.first()[CLE_DEMARRAGE_AUTO] ?: true
    }

    suspend fun enregistrerDemarrageAuto(context: Context, actif: Boolean) {
        context.magasinDonnees.edit { prefs -> prefs[CLE_DEMARRAGE_AUTO] = actif }
    }

    /**
     * URL complète du serveur, exactement telle que saisie
     * (ex. https://sms-gateway-omega.vercel.app ou http://192.168.1.10:3000).
     */
    suspend fun obtenirUrlServeur(context: Context): String {
        val prefs = context.magasinDonnees.data.first()
        prefs[CLE_SERVEUR_URL]?.takeIf { it.isNotBlank() }?.let { return it }
        val hote = prefs[CLE_SERVEUR_HOTE]
        val port = prefs[CLE_SERVEUR_PORT]
        if (hote == null && port == null) return DEFAUT_SERVEUR_URL
        return "http://${hote ?: DEFAUT_SERVEUR_HOTE}:${port ?: DEFAUT_SERVEUR_PORT}"
    }

    suspend fun enregistrerUrlServeur(context: Context, url: String) {
        context.magasinDonnees.edit { prefs ->
            prefs[CLE_SERVEUR_URL] = normaliserUrl(url)
        }
    }

    suspend fun obtenirHoteServeur(context: Context): String {
        val prefs = context.magasinDonnees.data.first()
        return prefs[CLE_SERVEUR_HOTE] ?: DEFAUT_SERVEUR_HOTE
    }

    suspend fun obtenirPortServeur(context: Context): String {
        val prefs = context.magasinDonnees.data.first()
        return prefs[CLE_SERVEUR_PORT] ?: DEFAUT_SERVEUR_PORT
    }

    suspend fun enregistrerHoteServeur(context: Context, hote: String) {
        context.magasinDonnees.edit { prefs ->
            prefs[CLE_SERVEUR_HOTE] = hote
        }
    }

    fun normaliserUrl(brut: String): String {
        var url = brut.trim().removeSuffix("/")
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            val hote = url.substringBefore(":").substringBefore("/").lowercase()
            url = if (estHoteLocal(hote)) "http://$url" else "https://$url"
        }
        return url
    }

    private fun estHoteLocal(hote: String): Boolean {
        if (hote == "localhost" || hote == "127.0.0.1" || hote == "10.0.2.2") return true
        if (hote.startsWith("192.168.") || hote.startsWith("10.")) return true
        if (hote.startsWith("172.")) {
            val second = hote.split(".").getOrNull(1)?.toIntOrNull()
            if (second != null && second in 16..31) return true
        }
        if (hote.matches(Regex("\\d+\\.\\d+\\.\\d+\\.\\d+"))) return true
        return false
    }

    suspend fun obtenirNomAppareil(context: Context): String {
        val prefs = context.magasinDonnees.data.first()
        return prefs[CLE_NOM_APPAREIL]?.takeIf { it.isNotBlank() } ?: Build.MODEL
    }

    suspend fun enregistrerNomAppareil(context: Context, nom: String) {
        context.magasinDonnees.edit { prefs ->
            prefs[CLE_NOM_APPAREIL] = nom.trim()
        }
    }

    suspend fun enregistrer(context: Context, appareilId: String, jeton: String) {
        context.magasinDonnees.edit { prefs ->
            prefs[CLE_APPAREIL_ID] = appareilId
            prefs[CLE_JETON] = jeton
        }
    }

    suspend fun charger(context: Context): Pair<String, String>? {
        val prefs = context.magasinDonnees.data.first()
        val appareilId = prefs[CLE_APPAREIL_ID]
        val jeton = prefs[CLE_JETON]
        return if (appareilId != null && jeton != null) {
            appareilId to jeton
        } else {
            null
        }
    }

    suspend fun enregistrerSynchro(context: Context, horodatage: Long, compteur: Int) {
        context.magasinDonnees.edit { prefs ->
            prefs[CLE_DERNIERE_SYNCHRO] = horodatage
            prefs[CLE_DERNIER_COMPTEUR] = compteur
        }
    }

    suspend fun chargerSynchro(context: Context): Pair<Long, Int> {
        val prefs = context.magasinDonnees.data.first()
        return (prefs[CLE_DERNIERE_SYNCHRO] ?: 0L) to (prefs[CLE_DERNIER_COMPTEUR] ?: 0)
    }

    suspend fun enregistrerInstantaneQuota(context: Context, quota: Int, usage: Int) {
        context.magasinDonnees.edit { prefs ->
            prefs[CLE_QUOTA] = quota
            prefs[CLE_QUOTA_USAGE] = usage
        }
    }

    suspend fun chargerInstantaneQuota(context: Context): Pair<Int, Int> {
        val prefs = context.magasinDonnees.data.first()
        return (prefs[CLE_QUOTA] ?: 20) to (prefs[CLE_QUOTA_USAGE] ?: 0)
    }

    suspend fun estIntegrationTerminee(context: Context): Boolean {
        return context.magasinDonnees.data.first()[CLE_INTEGRATION_TERMINEE] ?: false
    }

    suspend fun marquerIntegrationTerminee(context: Context, terminee: Boolean) {
        context.magasinDonnees.edit { prefs -> prefs[CLE_INTEGRATION_TERMINEE] = terminee }
    }

    suspend fun obtenirModeSim(context: Context): String {
        return context.magasinDonnees.data.first()[CLE_SIM_MODE] ?: "auto"
    }

    suspend fun enregistrerModeSim(context: Context, mode: String) {
        context.magasinDonnees.edit { prefs -> prefs[CLE_SIM_MODE] = mode }
    }

    suspend fun obtenirSouscriptionSim(context: Context): Int {
        return context.magasinDonnees.data.first()[CLE_SIM_SOUSCRIPTION] ?: -1
    }

    suspend fun enregistrerSouscriptionSim(context: Context, souscriptionId: Int) {
        context.magasinDonnees.edit { prefs -> prefs[CLE_SIM_SOUSCRIPTION] = souscriptionId }
    }

    suspend fun obtenirEtIncrementerCompteurSim(context: Context): Int {
        var suivant = 0
        context.magasinDonnees.edit { prefs ->
            suivant = (prefs[CLE_SIM_COMPTEUR] ?: 0) + 1
            prefs[CLE_SIM_COMPTEUR] = suivant
        }
        return suivant
    }

    suspend fun obtenirCompteurSim(context: Context): Int {
        return context.magasinDonnees.data.first()[CLE_SIM_COMPTEUR] ?: 0
    }

    suspend fun effacer(context: Context) {
        context.magasinDonnees.edit { prefs ->
            prefs.remove(CLE_APPAREIL_ID)
            prefs.remove(CLE_JETON)
        }
    }
}
