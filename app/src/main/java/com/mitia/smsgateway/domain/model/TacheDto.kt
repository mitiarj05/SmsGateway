package com.mitia.smsgateway.domain.model

data class TacheDto(
    val id: String,
    val numero_destinataire: String,
    val message: String,
    val statut: String,
    val created_at: String
)

data class ReponseTaches(
    val device: AppareilSimpleDto,
    val tasks: List<TacheDto>,
    val count: Int
)

data class ReponseStatut(
    val message: String,
    val task: TacheDto
)
