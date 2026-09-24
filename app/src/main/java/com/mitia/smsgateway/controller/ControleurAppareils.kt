package com.mitia.smsgateway.controller

import android.util.Log
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.messaging.FirebaseMessaging
import com.mitia.smsgateway.domain.model.ResultatEnregistrement
import com.mitia.smsgateway.domain.repository.DepotAppareils
import com.mitia.smsgateway.domain.repository.DepotJournaux
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
/**
 * Authentification et enregistrement de l'appareil.
 * Utilisé au démarrage du service (et au boot).
 */
class ControleurAppareils(
    private val appareils: DepotAppareils,
    private val journaux: DepotJournaux
) {

    private val etiquette = "ControleurAppareils"

    /**
     * Charge (appareilId, jeton), sinon connecte anonymement via Firebase Auth
     * puis enregistre avec le nom configuré. Retourne null si impossible
     * (serveur injoignable ou auth Firebase échouée).
     */
    suspend fun assurerEnregistrement(): Pair<String, String>? {
        val existants = appareils.obtenirIdentifiants()
        if (existants != null) {
            Log.d(etiquette, "Appareil déjà enregistré : id=${existants.first}")
            return existants
        }
        // 1. Identité Firebase (anonyme) — exigée par /api/devices/register.
        val jetonId = connecterAnonymement()
        if (jetonId == null) {
            Log.e(etiquette, "Échec connexion anonyme Firebase Auth")
            journaux.journaliser("échec auth Firebase : vérifie la connexion et le projet gateway")
            return null
        }
        val nomAppareil = appareils.obtenirNomAppareil()
        Log.d(etiquette, "Aucun appareil enregistré, tentative enregistrerAppareil(\"$nomAppareil\")...")
        when (val enregistre = appareils.enregistrer(nomAppareil, jetonId)) {
            is ResultatEnregistrement.Succes -> {
                appareils.enregistrerIdentifiants(enregistre.appareilId, enregistre.jeton)
                Log.d(etiquette, "Appareil enregistré et stocké : id=${enregistre.appareilId}")
                journaux.journaliser("appareil enregistré : $nomAppareil")
                return enregistre.appareilId to enregistre.jeton
            }
            is ResultatEnregistrement.ErreurHttp -> {
                Log.e(etiquette, "Échec enregistrerAppareil : ${enregistre.code} ${enregistre.message}")
                journaux.journaliser("enregistrement rejeté (${enregistre.code}) : ${enregistre.message ?: "voir journaux serveur"}")
                return null
            }
            ResultatEnregistrement.ErreurReseau -> {
                Log.e(etiquette, "Échec enregistrerAppareil : serveur injoignable (réseau ?)")
                journaux.journaliser("échec enregistrement : serveur injoignable")
                return null
            }
        }
    }

    /**
     * Connexion anonyme Firebase + jeton ID frais (exigé à l'enregistrement).
     * Retourne null si la connexion échoue (méthode Anonyme à activer
     * dans Firebase Console → Authentication → Sign-in method).
     */
    private suspend fun connecterAnonymement(): String? {
        return try {
            val authentification = FirebaseAuth.getInstance()
            if (authentification.currentUser == null) {
                authentification.signInAnonymously().await()
            }
            val utilisateur = authentification.currentUser ?: return null
            utilisateur.getIdToken(true).await().token
        } catch (e: CancellationException) {
            // Arrêt du service en cours de connexion : propagation normale,
            // pas une erreur d'auth (ne rien journaliser ni mettre en file).
            throw e
        } catch (e: Exception) {
            Log.e(etiquette, "connecterAnonymement impossible", e)
            journaux.journaliser("échec auth Firebase : ${e.message}")
            null
        }
    }

    /** Envoie le jeton FCM actuel au serveur (best-effort, arrière-plan). */
    fun actualiserJetonFcm(appareilId: String, jeton: String) {
        FirebaseMessaging.getInstance().token.addOnCompleteListener { resultat ->
            if (resultat.isSuccessful) {
                Log.d(etiquette, "Jeton FCM actuel : ${resultat.result}")
                CoroutineScope(Dispatchers.IO).launch {
                    appareils.mettreAJourJetonFcm(appareilId, jeton, resultat.result)
                }
            } else {
                Log.e(etiquette, "Impossible de récupérer le jeton FCM", resultat.exception)
            }
        }
    }
}
