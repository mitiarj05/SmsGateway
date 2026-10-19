package com.mitia.smsgateway.domain.model

/** Tâche reçue par cet appareil, conservée localement (écran Tâches). */
data class TacheHistorique(
    val id: String,
    val numeroDestinataire: String,
    val message: String,
    val statut: String,
    val erreur: String?,
    val horodatage: Long,
    /** Accusé de réception réseau : Statuts.LIVRE | ECHEC_LIVRAISON | null. */
    val livraison: String? = null
)
