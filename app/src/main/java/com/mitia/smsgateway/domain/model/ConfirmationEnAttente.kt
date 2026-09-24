package com.mitia.smsgateway.domain.model

/** Confirmation en file persistante (SMS parti, accusé serveur manquant). */
data class ConfirmationEnAttente(
    val tacheId: String,
    val statut: String,
    val messageErreur: String? = null
)
