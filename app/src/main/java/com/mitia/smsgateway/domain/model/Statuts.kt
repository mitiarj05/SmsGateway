package com.mitia.smsgateway.domain.model

/**
 * Statuts centralisés — miroir des enums Supabase (+ API + UI).
 * Confirmés en base : EN_LIGNE, HORS_LIGNE, DESACTIVE, EN_ATTENTE,
 * RECLAME, ENVOYE, ECHOUE. OCCUPE retiré (absent de l'enum réel).
 * PROGRAMME : migration SQL requise côté base (INSERT échouerait sinon).
 */
object Statuts {
    // Appareils
    const val EN_LIGNE = "EN_LIGNE"
    const val HORS_LIGNE = "HORS_LIGNE"
    const val DESACTIVE = "DESACTIVE"

    // Messages
    const val EN_ATTENTE = "EN_ATTENTE"
    const val RECLAME = "RECLAME"
    const val ENVOYE = "ENVOYE"
    const val ECHOUE = "ECHOUE"
    const val PROGRAMME = "PROGRAMME"
    const val ASSIGNE = "ASSIGNE"
}
