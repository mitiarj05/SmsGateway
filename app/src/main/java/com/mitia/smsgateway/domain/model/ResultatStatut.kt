package com.mitia.smsgateway.domain.model

/**
 * Résultat précis d'un mettreAJourStatutTache.
 *
 * Pourquoi pas un simple Boolean ? Piège 3 :
 * - le téléphone rejoue une confirmation ENVOYE après une coupure WiFi ;
 *   si le serveur répond 409 "déjà ENVOYE", c'est un SUCCÈS idempotent,
 *   pas un échec (le SMS est bien parti, inutile de le renvoyer).
 * - si la tâche est assignée à un AUTRE appareil (409), il ne faut PAS
 *   envoyer le SMS : on passe.
 */
sealed interface ResultatStatut {
    data object Succes : ResultatStatut
    /** 409 mais current_status == statut demandé → le rejeu a déjà abouti. */
    data object DejaConfirme : ResultatStatut
    /** Tâche réclamée par un autre appareil → ne pas envoyer le SMS. */
    data class AssigneAUnAutre(val assigneA: String?) : ResultatStatut
    /** Tâche finalisée (ENVOYE/ECHOUE) avec un statut différent → ne pas toucher. */
    data class ConflitFinalise(val statutActuel: String?) : ResultatStatut
    data class ErreurHttp(val code: Int) : ResultatStatut
    /** Timeout, DNS, WiFi coupé... → à rejouer plus tard, JAMAIS renvoyer le SMS. */
    data object ErreurReseau : ResultatStatut
}
