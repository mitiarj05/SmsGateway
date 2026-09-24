package com.mitia.smsgateway.domain.model

/** Volume d'un jour : envoyés + échecs (écran Statistiques). */
data class StatJournaliere(
    val label: String,
    val envoyes: Int,
    val echoues: Int
)
