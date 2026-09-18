package com.mitia.smsgateway.domain.model

/** Volume d'un jour : envoyés + échecs (écran Statistiques). */
data class DayStat(
    val label: String,
    val sent: Int,
    val failed: Int
)
