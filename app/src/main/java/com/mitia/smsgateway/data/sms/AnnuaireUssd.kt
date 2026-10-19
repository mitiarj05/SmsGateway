package com.mitia.smsgateway.data.sms

/**
 * Propositions de codes USSD de consultation du solde, par famille d'opérateur.
 *
 * AVERTISSEMENT — ces codes ne sont PAS fournis par l'opérateur à l'application,
 * et un même opérateur change de code selon le pays et le forfait. Ils ne sont
 * donc JAMAIS appliqués automatiquement : l'écran Paramètres les affiche comme
 * suggestions à saisir d'un geste, et l'utilisateur reste seul décideur. Un code
 * erroné peut souscrire à un service payant.
 *
 * Si l'opérateur n'est pas reconnu (ou l'est mal), la liste reste vide : mieux
 * vaut aucune suggestion qu'une suggestion fausse.
 */
object AnnuaireUssd {

    /** Nom d'opérateur (fragment, en minuscules) → codes proposés. */
    private val PROPOSITIONS: List<Pair<String, List<String>>> = listOf(
        // Madagascar : Yas et Telma (même réseau) consultent le crédit par #357#.
        // #359# et #111# circulent mais ne donnent PAS le solde : #359# est faux,
        // #111# ouvre un menu à choix (une session qui reste ouverte et bloque la
        // demande suivante).
        "yas" to listOf("#357#"),
        "telma" to listOf("#357#"),
        "orange" to listOf("#123#"),
        "mtn" to listOf("*133#"),
        "moov" to listOf("*155#"),
        "airtel" to listOf("*123#"),
        "maroc telecom" to listOf("*555#"),
        "vodacom" to listOf("*100#"),
        "safaricom" to listOf("*144#"),
    )

    /**
     * Codes suggérés pour un nom d'opérateur tel que la carte SIM l'annonce
     * (« Orange SN », « MTN CI », « Moov Africa »…).
     */
    fun suggestions(operateur: String?): List<String> {
        if (operateur.isNullOrBlank()) return emptyList()
        val minuscule = operateur.lowercase()
        return PROPOSITIONS
            .filter { (famille, _) -> minuscule.contains(famille) }
            .flatMap { (_, codes) -> codes }
            .distinct()
    }
}
