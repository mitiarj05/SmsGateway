package com.mitia.smsgateway.domain.model

/**
 * Résultat précis d'un updateTaskStatus.
 *
 * Pourquoi pas un simple Boolean ? Piège 3 :
 * - le téléphone retry une confirmation SENT après une coupure WiFi ;
 *   si le serveur répond 409 "déjà SENT", c'est un SUCCÈS idempotent,
 *   pas un échec (le SMS est bien parti, inutile de le renvoyer).
 * - si la task est assignée à un AUTRE device (409), il ne faut PAS
 *   envoyer le SMS : on skip.
 */
sealed interface StatusResult {
    data object Success : StatusResult
    /** 409 mais current_status == statut demandé → le retry a déjà abouti. */
    data object AlreadyConfirmed : StatusResult
    /** Task claimée par un autre device → ne pas envoyer le SMS. */
    data class AssignedToOther(val assignedTo: String?) : StatusResult
    /** Task finalisée (SENT/FAILED) avec un statut différent → ne pas toucher. */
    data class FinalizedConflict(val currentStatus: String?) : StatusResult
    data class HttpError(val code: Int) : StatusResult
    /** Timeout, DNS, WiFi coupé... → à retry plus tard, JAMAIS renvoyer le SMS. */
    data object NetworkError : StatusResult
}
