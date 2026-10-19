package com.mitia.smsgateway.domain.model

/**
 * Vue « par carte SIM » du réglage de consultation du solde.
 *
 * C'est la carte qui est l'unité qui compte : chaque opérateur a son propre code
 * de consultation, et un téléphone à deux SIM en héberge donc deux. Présenter ce
 * réglage globalement obligerait à deviner « de quelle carte parle-t-on ? ».
 *
 * @param souscriptionId identifiant d'abonnement Android (clé de stockage).
 * @param emplacement numéro d'emplacement affiché (1 pour la première carte).
 * @param operateur nom annoncé par la carte (« Yas », « TELMA »…).
 * @param numero numéro de la carte s'il est lisible (souvent null sans opérateur).
 * @param code code USSD saisi par l'utilisateur pour CETTE carte (vide si aucun).
 * @param solde dernier relevé connu (issu d'un code USSD ou d'un SMS opérateur).
 * @param suggestions codes proposés pour la famille d'opérateur, à vérifier.
 */
data class CarteUssd(
    val souscriptionId: Int,
    val emplacement: Int,
    val operateur: String,
    val numero: String?,
    val code: String,
    val solde: SoldeSim?,
    val suggestions: List<String> = emptyList(),
)
