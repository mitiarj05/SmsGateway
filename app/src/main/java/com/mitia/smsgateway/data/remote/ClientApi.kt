package com.mitia.smsgateway.data.remote

import android.content.Context
import android.util.Log
import com.google.gson.Gson
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import com.mitia.smsgateway.data.local.PreferencesAppareil
import com.mitia.smsgateway.domain.model.ReponseTaches
import com.mitia.smsgateway.domain.model.QuotaDto
import com.mitia.smsgateway.domain.model.ResultatQuota
import com.mitia.smsgateway.domain.model.ReponseEnregistrement
import com.mitia.smsgateway.domain.model.ResultatEnregistrement
import com.mitia.smsgateway.domain.model.Statuts
import com.mitia.smsgateway.domain.model.ResultatStatut
import com.mitia.smsgateway.domain.model.TacheDto
import com.mitia.smsgateway.domain.model.ResultatTaches
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
object ClientApi {

    private const val ETIQUETTE = "ClientApi"

    /**
     * URL du serveur, modifiable sans recompiler :
     * [definirUrlBase] au démarrage (service / écran d'accueil).
     * En émulateur : http://10.0.2.2:3000 — sur téléphone : http://IP_DU_PC:3000
     */
    @Volatile
    var urlBase: String = PreferencesAppareil.DEFAUT_SERVEUR_URL
        private set

    fun definirUrlBase(url: String) {
        urlBase = PreferencesAppareil.normaliserUrl(url)
        Log.d(ETIQUETTE, "URL de base : $urlBase")
    }

    private val clientHttp = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .writeTimeout(15, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()
    private val TYPE_JSON = "application/json; charset=utf-8".toMediaType()

    // -------------------- Méthodes --------------------

    /**
     * Teste la joignabilité du serveur (GET racine, attendue 200).
     * Utilisé par l'écran d'accueil, avant d'enregistrer l'adresse.
     */
    suspend fun pingerServeur(): Boolean = latencePingMs() >= 0

    /**
     * Latence aller-retour vers le serveur en millisecondes (-1 si injoignable).
     * Utilisé par l'écran Diagnostic.
     */
    suspend fun latencePingMs(): Long = withContext(Dispatchers.IO) {
        try {
            val debut = android.os.SystemClock.elapsedRealtime()
            val requete = Request.Builder()
                .url(urlBase)
                .get()
                .build()

            clientHttp.newCall(requete).execute().use { reponse ->
                if (!reponse.isSuccessful) return@withContext -1L
                return@withContext android.os.SystemClock.elapsedRealtime() - debut
            }
        } catch (e: Exception) {
            Log.e(ETIQUETTE, "pingerServeur échoué ($urlBase)", e)
            return@withContext -1L
        }
    }

    /**
     * Enregistre un nouvel appareil auprès du serveur.
     * Exige le jeton ID Firebase Auth (connexion anonyme) : le serveur
     * refuse tout enregistrement non authentifié (401).
     */
    suspend fun enregistrerAppareil(nom: String, jetonId: String): ResultatEnregistrement = withContext(Dispatchers.IO) {
        try {
            val corps = gson.toJson(mapOf("nom" to nom))
                .toRequestBody(TYPE_JSON)

            val requete = Request.Builder()
                .url("$urlBase/api/devices/register")
                .header("Authorization", "Bearer $jetonId")
                .post(corps)
                .build()

            clientHttp.newCall(requete).execute().use { reponse ->
                if (!reponse.isSuccessful) {
                    val brut = try { reponse.body?.string() } catch (_: Exception) { null }
                    val messageServeur = try {
                        brut?.let { gson.fromJson(it, Map::class.java)["error"] as? String }
                    } catch (_: Exception) { null }
                    Log.e(ETIQUETTE, "Enregistrement échoué : ${reponse.code} $messageServeur")
                    return@withContext ResultatEnregistrement.ErreurHttp(reponse.code, messageServeur)
                }

                val corpsReponse = reponse.body?.string()
                    ?: return@withContext ResultatEnregistrement.ErreurHttp(reponse.code, "réponse vide")
                val donneesParsees = gson.fromJson(corpsReponse, ReponseEnregistrement::class.java)
                Log.d(ETIQUETTE, "Appareil enregistré : ${donneesParsees.device.id}")
                return@withContext ResultatEnregistrement.Succes(donneesParsees.device.id, donneesParsees.device.token)
            }
        } catch (e: Exception) {
            Log.e(ETIQUETTE, "Erreur enregistrerAppareil", e)
            return@withContext ResultatEnregistrement.ErreurReseau
        }
    }

    /**
     * Récupère les tâches en attente pour cet appareil.
     */
    suspend fun obtenirTaches(appareilId: String, jeton: String): List<TacheDto> = withContext(Dispatchers.IO) {
        when (val resultat = obtenirTachesDetaillees(appareilId, jeton)) {
            is ResultatTaches.Succes -> resultat.taches
            ResultatTaches.ErreurReseau -> emptyList()
        }
    }

    /**
     * Variante qui distingue "aucune tâche" de "réseau coupé"
     * (pour le backoff exponentiel côté service).
     */
    suspend fun obtenirTachesDetaillees(appareilId: String, jeton: String): ResultatTaches = withContext(Dispatchers.IO) {
        try {
            val requete = Request.Builder()
                .url("$urlBase/api/devices/$appareilId/tasks")
                .header("Authorization", "Bearer $jeton")
                .get()
                .build()

            clientHttp.newCall(requete).execute().use { reponse ->
                if (!reponse.isSuccessful) {
                    Log.e(ETIQUETTE, "obtenirTaches échoué : ${reponse.code} ${reponse.message}")
                    // 401/404 = problème d'auth, pas forcément réseau, mais on
                    // backoff quand même : inutile de spammer le serveur.
                    return@withContext ResultatTaches.ErreurReseau
                }

                val corpsReponse = reponse.body?.string()
                    ?: return@withContext ResultatTaches.Succes(emptyList())
                val donneesParsees = gson.fromJson(corpsReponse, ReponseTaches::class.java)
                Log.d(ETIQUETTE, "obtenirTaches : ${donneesParsees.count} tâche(s)")
                return@withContext ResultatTaches.Succes(donneesParsees.tasks)
            }
        } catch (e: Exception) {
            Log.e(ETIQUETTE, "Erreur obtenirTaches (réseau coupé ?)", e)
            return@withContext ResultatTaches.ErreurReseau
        }
    }

    /**
     * Confirme au serveur le statut d'une tâche.
     * @param statut "RECLAME", "ENVOYE" ou "ECHOUE"
     *
     * Compat : true si confirmé OU déjà confirmé (idempotent).
     */
    suspend fun mettreAJourStatutTache(
        appareilId: String,
        jeton: String,
        tacheId: String,
        statut: String,
        messageErreur: String? = null
    ): Boolean {
        return when (mettreAJourStatutTacheDetaille(appareilId, jeton, tacheId, statut, messageErreur)) {
            ResultatStatut.Succes, ResultatStatut.DejaConfirme -> true
            else -> false
        }
    }

    /**
     * Version détaillée : distingue succès / conflit / réseau.
     * INDISPENSABLE pour l'anti-doublon (voir [ResultatStatut]).
     */
    suspend fun mettreAJourStatutTacheDetaille(
        appareilId: String,
        jeton: String,
        tacheId: String,
        statut: String,
        messageErreur: String? = null
    ): ResultatStatut = withContext(Dispatchers.IO) {
        try {
            val charge = JsonObject().apply {
                addProperty("statut", statut)
                if (messageErreur != null) addProperty("error_message", messageErreur)
            }
            val corps = gson.toJson(charge).toRequestBody(TYPE_JSON)

            val requete = Request.Builder()
                .url("$urlBase/api/devices/$appareilId/tasks/$tacheId/status")
                .header("Authorization", "Bearer $jeton")
                .post(corps)
                .build()

            clientHttp.newCall(requete).execute().use { reponse ->
                if (reponse.isSuccessful) {
                    Log.d(ETIQUETTE, "Statut mis à jour : $statut pour tâche $tacheId")
                    return@withContext ResultatStatut.Succes
                }
                if (reponse.code == 409) {
                    // Le serveur refuse : tâche déjà prise ou déjà finalisée.
                    // On parse le body pour savoir si c'est un succès idempotent.
                    val brut = try { reponse.body?.string() } catch (_: Exception) { null }
                    var statutActuel: String? = null
                    var assigneA: String? = null
                    try {
                        val json = brut?.let { JsonParser.parseString(it)?.asJsonObject }
                        statutActuel = json?.get("current_status")?.takeIf { !it.isJsonNull }?.asString
                        assigneA = json?.get("assigned_to")?.takeIf { !it.isJsonNull }?.asString
                    } catch (_: Exception) { }
                    if (statutActuel != null && statutActuel == statut) {
                        Log.d(ETIQUETTE, "Tâche $tacheId déjà confirmée $statut (idempotent, 409) → succès")
                        return@withContext ResultatStatut.DejaConfirme
                    }
                    if (statutActuel == Statuts.ENVOYE || statutActuel == Statuts.ECHOUE) {
                        Log.w(ETIQUETTE, "Tâche $tacheId déjà finalisée ($statutActuel), on ne touche pas")
                        return@withContext ResultatStatut.ConflitFinalise(statutActuel)
                    }
                    Log.w(ETIQUETTE, "Tâche $tacheId assignée à un autre appareil ($assigneA), on passe l'envoi")
                    return@withContext ResultatStatut.AssigneAUnAutre(assigneA)
                }
                Log.e(ETIQUETTE, "mettreAJourStatutTache échoué : ${reponse.code} ${reponse.message}")
                return@withContext ResultatStatut.ErreurHttp(reponse.code)
            }
        } catch (e: Exception) {
            Log.e(ETIQUETTE, "Erreur mettreAJourStatutTache (réseau coupé ?), tâche=$tacheId statut=$statut", e)
            return@withContext ResultatStatut.ErreurReseau
        }
    }

    /**
     * Envoie le jeton FCM au serveur.
     */
    suspend fun mettreAJourJetonFcm(
        appareilId: String,
        jeton: String,
        jetonFcm: String
    ): Boolean = withContext(Dispatchers.IO) {
        try {
            val corps = gson.toJson(mapOf("fcm_token" to jetonFcm))
                .toRequestBody(TYPE_JSON)

            val requete = Request.Builder()
                .url("$urlBase/api/devices/$appareilId/fcm-token")
                .header("Authorization", "Bearer $jeton")
                .post(corps)
                .build()

            clientHttp.newCall(requete).execute().use { reponse ->
                if (!reponse.isSuccessful) {
                    Log.e(ETIQUETTE, "mettreAJourJetonFcm échoué : ${reponse.code}")
                    return@withContext false
                }
                Log.d(ETIQUETTE, "Jeton FCM envoyé au serveur")
                return@withContext true
            }
        } catch (e: Exception) {
            Log.e(ETIQUETTE, "Erreur mettreAJourJetonFcm", e)
            return@withContext false
        }
    }

    /**
     * Signale l'arrêt de l'appareil (bouton Déconnecter, service tué).
     * Le serveur passe le statut à HORS_LIGNE (jamais DESACTIVE, réservé admin).
     */
    suspend fun deconnecter(appareilId: String, jeton: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val requete = Request.Builder()
                .url("$urlBase/api/devices/$appareilId/offline")
                .header("Authorization", "Bearer $jeton")
                .post(ByteArray(0).toRequestBody(null))
                .build()

            clientHttp.newCall(requete).execute().use { reponse ->
                return@withContext reponse.isSuccessful
            }
        } catch (e: Exception) {
            Log.e(ETIQUETTE, "Erreur deconnecter (réseau coupé ?)", e)
            return@withContext false
        }
    }

    /**
     * Quota et usage horaire de l'appareil (endpoint imposé par le serveur).
     * Utilisé par l'app pour l'écran Statut et les réglages.
     */
    suspend fun obtenirQuotaDetaille(appareilId: String, jeton: String): ResultatQuota = withContext(Dispatchers.IO) {
        try {
            val requete = Request.Builder()
                .url("$urlBase/api/devices/$appareilId/quota")
                .header("Authorization", "Bearer $jeton")
                .get()
                .build()

            clientHttp.newCall(requete).execute().use { reponse ->
                if (!reponse.isSuccessful) {
                    Log.e(ETIQUETTE, "obtenirQuota échoué : ${reponse.code} ${reponse.message}")
                    return@withContext ResultatQuota.ErreurReseau
                }
                val corpsReponse = reponse.body?.string()
                    ?: return@withContext ResultatQuota.ErreurReseau
                val donneesParsees = gson.fromJson(corpsReponse, QuotaDto::class.java)
                return@withContext ResultatQuota.Succes(donneesParsees)
            }
        } catch (e: Exception) {
            Log.e(ETIQUETTE, "Erreur obtenirQuota (réseau coupé ?)", e)
            return@withContext ResultatQuota.ErreurReseau
        }
    }

    /**
     * Rejeu réseau avec backoff exponentiel pour les confirmations.
     *
     * Utilisé APRÈS l'envoi du SMS : le SMS n'est envoyé QU'UNE fois,
     * seule la confirmation HTTP est rejouée (jamais de 2e envoi SMS).
     *
     * @return true si le serveur a confirmé (ou avait déjà confirmé).
     */
    /**
     * Transfère un SMS reçu sur la SIM (voir RecepteurSms).
     * Le serveur enregistre + route vers le client (corrélation, SIM dédiée).
     */
    suspend fun envoyerEntrant(
        context: Context,
        appareilId: String,
        jeton: String,
        expediteur: String,
        contenu: String,
        dateReception: Long
    ): Boolean = withContext(Dispatchers.IO) {
        try {
            definirUrlBase(PreferencesAppareil.obtenirUrlServeur(context))
            val formatIso = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US).apply {
                timeZone = java.util.TimeZone.getTimeZone("UTC")
            }
            val corps = gson.toJson(
                mapOf(
                    "expediteur" to expediteur,
                    "contenu" to contenu,
                    "date_reception" to formatIso.format(java.util.Date(dateReception))
                )
            ).toRequestBody(TYPE_JSON)

            val requete = Request.Builder()
                .url("$urlBase/api/devices/$appareilId/inbox")
                .header("Authorization", "Bearer $jeton")
                .post(corps)
                .build()

            clientHttp.newCall(requete).execute().use { reponse ->
                if (!reponse.isSuccessful) {
                    Log.e(ETIQUETTE, "envoyerEntrant échoué : ${reponse.code}")
                    return@withContext false
                }
                Log.d(ETIQUETTE, "Entrant transféré : $expediteur")
                return@withContext true
            }
        } catch (e: Exception) {
            Log.e(ETIQUETTE, "Erreur envoyerEntrant (réseau coupé ?)", e)
            return@withContext false
        }
    }

    suspend fun confirmerAvecReessai(
        appareilId: String,
        jeton: String,
        tacheId: String,
        statut: String,
        messageErreur: String? = null,
        tentativesMax: Int = 4
    ): Boolean {
        var attenteMs = 1_000L
        repeat(tentativesMax) { tentative ->
            when (val resultat = mettreAJourStatutTacheDetaille(appareilId, jeton, tacheId, statut, messageErreur)) {
                ResultatStatut.Succes, ResultatStatut.DejaConfirme -> return true
                // Conflit métier définitif : rejeu inutile → on purge la file
                // (le serveur fait foi ; le SMS a déjà été envoyé une seule fois).
                is ResultatStatut.AssigneAUnAutre -> {
                    Log.w(ETIQUETTE, "Confirmation $tacheId ($statut) rejetée : assignée à ${resultat.assigneA}, purge")
                    return true
                }
                is ResultatStatut.ConflitFinalise -> {
                    Log.w(ETIQUETTE, "Confirmation $tacheId ($statut) rejetée : déjà ${resultat.statutActuel}, purge")
                    return true
                }
                is ResultatStatut.ErreurHttp, ResultatStatut.ErreurReseau -> {
                    if (tentative == tentativesMax - 1) return false
                    Log.d(ETIQUETTE, "Nouvelle tentative confirmation $tacheId ($statut) ${tentative + 1}/$tentativesMax dans ${attenteMs}ms")
                    delay(attenteMs)
                    attenteMs = (attenteMs * 2).coerceAtMost(8_000L)
                }
            }
        }
        return false
    }
}
