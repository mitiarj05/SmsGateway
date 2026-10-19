package com.mitia.smsgateway.domain.model

/**
 * Accusé de réception réseau pas encore remonté au serveur.
 *
 * @param livraison Statuts.LIVRE ou Statuts.ECHEC_LIVRAISON.
 * @param code code brut renvoyé par la radio (null si aucun) — utile au diagnostic.
 * @param horodatage moment de la réception de l'accusé (purge après 48 h).
 */
data class AccuseLivraisonEnAttente(
    val tacheId: String,
    val livraison: String,
    val code: Int? = null,
    val horodatage: Long = 0L
)
