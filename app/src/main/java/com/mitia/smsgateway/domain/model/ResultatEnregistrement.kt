package com.mitia.smsgateway.domain.model

/** Résultat explicite de l'enregistrement (diagnostic au lieu d'un null muet). */
sealed interface ResultatEnregistrement {
    data class Succes(val appareilId: String, val jeton: String) : ResultatEnregistrement
    /** Le serveur a répondu : code HTTP + message éventuel. */
    data class ErreurHttp(val code: Int, val message: String?) : ResultatEnregistrement
    /** Timeout, DNS, serveur éteint… */
    data object ErreurReseau : ResultatEnregistrement
}
