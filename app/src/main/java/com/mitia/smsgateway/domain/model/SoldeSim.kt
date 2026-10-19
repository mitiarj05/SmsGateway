package com.mitia.smsgateway.domain.model

/**
 * Dernier solde connu d'une carte SIM, relevé sur le téléphone par code USSD.
 *
 * @param souscriptionId carte concernée (chaque SIM a son opérateur, donc son code).
 * @param montant montant TEL QUEL lu dans la réponse (« 5 000 », « 12,50 »).
 *        C'est une chaîne : les opérateurs écrivent les montants de façons très
 *        variées (espaces, virgules) et on ne veut pas réinterpréter leur format.
 * @param devise FCFA, €, DH… tel qu'écrit par l'opérateur (null si absent).
 * @param texte réponse brute de l'opérateur, conservée telle quelle : c'est la
 *        source du montant, et elle reste lisible même quand l'extraction échoue.
 * @param horodatage date du relevé (millisecondes).
 * @param transmis vrai si le serveur a accusé réception du relevé.
 * @param tentativesTransmission nombre d'échecs de transmission déjà essuyés.
 *
 * Tous les champs de référence sont nullables : l'objet est relu depuis un
 * stockage JSON, et une entrée abîmée ne doit jamais faire planter l'écran.
 */
data class SoldeSim(
    val souscriptionId: Int = -1,
    val montant: String? = null,
    val devise: String? = null,
    val texte: String? = null,
    val horodatage: Long = 0L,
    val transmis: Boolean = false,
    val tentativesTransmission: Int = 0,
) {
    /** Vrai si le relevé porte une information affichable (opérateur bavard). */
    val exploitable: Boolean
        get() = !montant.isNullOrBlank() || !texte.isNullOrBlank()
}
