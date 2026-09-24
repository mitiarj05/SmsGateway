package com.mitia.smsgateway.domain.model

/** Réponse de POST /api/devices/register. */
data class ReponseEnregistrement(
    val message: String,
    val device: AppareilDto
)

data class AppareilDto(
    val id: String,
    val nom: String,
    val token: String,
    val statut: String,
    val created_at: String
)

data class AppareilSimpleDto(
    val id: String,
    val nom: String
)
