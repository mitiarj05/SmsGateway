package com.mitia.smsgateway.domain.model

/** Tâche reçue par ce device, conservée localement (écran Tâches). */
data class HistoryTask(
    val id: String,
    val numero: String,
    val message: String,
    val statut: String,
    val error: String?,
    val at: Long
)
