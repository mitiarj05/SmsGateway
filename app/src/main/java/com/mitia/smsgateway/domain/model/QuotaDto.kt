package com.mitia.smsgateway.domain.model

/** Réponse de GET /api/devices/[id]/quota (quota imposé par le serveur). */
data class QuotaDto(
    val quota: Int,
    val usage: Int,
    val remaining: Int,
    val quota_reached: Boolean,
    val retry_after_seconds: Int
)
