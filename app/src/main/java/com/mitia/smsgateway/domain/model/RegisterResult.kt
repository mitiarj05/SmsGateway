package com.mitia.smsgateway.domain.model

/** Résultat explicite de l'enregistrement (diagnostic au lieu d'un null muet). */
sealed interface RegisterResult {
    data class Success(val deviceId: String, val token: String) : RegisterResult
    /** Le serveur a répondu : code HTTP + message éventuel. */
    data class HttpError(val code: Int, val message: String?) : RegisterResult
    /** Timeout, DNS, serveur éteint… */
    data object NetworkError : RegisterResult
}
