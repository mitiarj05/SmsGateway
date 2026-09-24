package com.mitia.smsgateway.domain.repository

import com.mitia.smsgateway.domain.model.QuotaDto
import com.mitia.smsgateway.domain.model.ResultatEnregistrement

/**
 * Appareil, serveur et état de synchronisation.
 * Façade au-dessus de ClientApi (remote) + PreferencesAppareil (local).
 */
interface DepotAppareils {
    // Identifiants
    suspend fun obtenirIdentifiants(): Pair<String, String>?
    suspend fun enregistrerIdentifiants(appareilId: String, jeton: String)
    suspend fun effacerIdentifiants()

    // Serveur
    suspend fun obtenirUrlServeur(): String
    suspend fun enregistrerUrlServeur(url: String): String
    suspend fun pingerServeur(): Boolean
    /** Teste une adresse saisie (sans l'enregistrer). */
    suspend fun ping(url: String): Boolean

    // Appareil
    suspend fun obtenirNomAppareil(): String
    suspend fun enregistrerNomAppareil(nom: String)
    suspend fun enregistrer(nomAppareil: String, jetonId: String): ResultatEnregistrement
    suspend fun deconnecter(appareilId: String, jeton: String): Boolean
    suspend fun mettreAJourJetonFcm(appareilId: String, jeton: String, jetonFcm: String): Boolean

    // Quota serveur
    suspend fun obtenirQuota(appareilId: String, jeton: String): QuotaDto?

    // Instantanés d'état (écrans)
    suspend fun enregistrerSynchro(horodatage: Long, compteur: Int)
    suspend fun chargerSynchro(): Pair<Long, Int>
    suspend fun enregistrerInstantaneQuota(quota: Int, usage: Int)
    suspend fun chargerInstantaneQuota(): Pair<Int, Int>

    // Intégration première ouverture
    suspend fun estIntegrationTerminee(): Boolean
    suspend fun marquerIntegrationTerminee(terminee: Boolean)
}
