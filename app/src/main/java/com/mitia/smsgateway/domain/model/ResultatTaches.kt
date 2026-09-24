package com.mitia.smsgateway.domain.model

/** Distingue "aucune tâche" de "réseau coupé" (backoff côté service). */
sealed interface ResultatTaches {
    data class Succes(val taches: List<TacheDto>) : ResultatTaches
    data object ErreurReseau : ResultatTaches
}
