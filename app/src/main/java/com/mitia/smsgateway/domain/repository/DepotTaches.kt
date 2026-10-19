package com.mitia.smsgateway.domain.repository

import com.mitia.smsgateway.domain.model.TacheHistorique
import com.mitia.smsgateway.domain.model.AccuseLivraisonEnAttente
import com.mitia.smsgateway.domain.model.ConfirmationEnAttente
import com.mitia.smsgateway.domain.model.ResultatStatut
import com.mitia.smsgateway.domain.model.TacheDto
import com.mitia.smsgateway.domain.model.ResultatTaches
import kotlinx.coroutines.flow.Flow

/**
 * Tâches SMS : protocole serveur + historique local + file de confirmations.
 */
interface DepotTaches {
    // Protocole
    suspend fun recupererTaches(appareilId: String, jeton: String): ResultatTaches
    suspend fun mettreAJourStatutDetaille(
        appareilId: String,
        jeton: String,
        tacheId: String,
        statut: String,
        messageErreur: String? = null
    ): ResultatStatut
    suspend fun confirmerAvecReessai(
        appareilId: String,
        jeton: String,
        tacheId: String,
        statut: String,
        messageErreur: String? = null
    ): Boolean

    // Historique local (écran Tâches, compteur du jour)
    suspend fun enregistrerRecues(taches: List<TacheDto>)
    suspend fun enregistrerStatut(tacheId: String, statut: String, erreur: String? = null)
    fun observerHistorique(): Flow<List<TacheHistorique>>
    suspend fun compterEnvoyesAujourdhui(): Int

    // Accusés de réception RÉSEAU (DLR) — information distincte du statut d'envoi
    suspend fun signalerLivraison(
        appareilId: String,
        jeton: String,
        tacheId: String,
        livraison: String,
        code: Int? = null
    ): ResultatStatut
    suspend fun chargerAccusesEnAttente(): List<AccuseLivraisonEnAttente>
    suspend fun ajouterAccuseEnAttente(tacheId: String, livraison: String, code: Int? = null)
    suspend fun retirerAccuseEnAttente(tacheId: String)

    /** Abandonne les accusés trop vieux (opérateurs sans DLR) et renvoie le compte. */
    suspend fun purgerAccusesExpires(): Int
    suspend fun enregistrerLivraison(tacheId: String, livraison: String)

    // File de confirmations persistante (anti-doublon)
    suspend fun chargerConfirmationsEnAttente(): List<ConfirmationEnAttente>
    suspend fun ajouterConfirmationEnAttente(tacheId: String, statut: String, messageErreur: String? = null)
    suspend fun retirerConfirmationEnAttente(tacheId: String)
}
