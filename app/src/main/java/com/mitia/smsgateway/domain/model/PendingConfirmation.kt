package com.mitia.smsgateway.domain.model

/** Confirmation en file persistante (SMS parti, accusé serveur manquant). */
data class PendingConfirmation(
    val taskId: String,
    val statut: String,
    val errorMessage: String? = null
)
