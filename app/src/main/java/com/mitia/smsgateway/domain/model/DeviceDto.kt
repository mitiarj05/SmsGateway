package com.mitia.smsgateway.domain.model

/** Réponse de POST /api/devices/register. */
data class RegisterResponse(
    val message: String,
    val device: DeviceDto
)

data class DeviceDto(
    val id: String,
    val nom: String,
    val token: String,
    val statut: String,
    val created_at: String
)

data class DeviceSimpleDto(
    val id: String,
    val nom: String
)
