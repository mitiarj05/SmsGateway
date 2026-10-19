package com.mitia.smsgateway.data.sms

/**
 * Extraction « au mieux » du montant dans la réponse USSD d'un opérateur.
 *
 * Les réponses sont du texte libre, sans format commun :
 *   « Votre solde est de 5 000 FCFA valable jusqu'au 12/12/2026 »
 *   « Solde: 12,50 EUR » / « Credit: 1500 F »
 *
 * On ne prétend donc pas tout comprendre : on extrait ce qu'on peut et on
 * renvoie `null` sinon. L'appelant conserve TOUJOURS le texte brut à côté
 * (voir SoldeSim.texte), de sorte qu'aucun montant inventé ne soit affiché au
 * client — au pire il lit la réponse de l'opérateur telle quelle.
 */
object AnalyseurSolde {

    /**
     * Montant suivi de sa devise. La devise est exigée : un nombre isolé est
     * trop ambigu (numéro de téléphone, date, code).
     *
     * Alternatives ordonnées du plus long au plus court pour que « FCFA » ne
     * soit pas lu comme « F », et le suffixe `(?!\p{L})` évite d'attraper le
     * début d'un mot (« F » dans « Facture »).
     *
     * L'ariary malgache figure sous ses trois écritures (MGA, ARIARY, Ar) : sans
     * lui, une vraie réponse « Votre solde est de 5 000 Ar » n'était pas reconnue
     * comme un montant AVEC devise, et le relevé restait sans unité.
     */
    private val MOTIF_MONTANT_ET_DEVISE = Regex(
        """(?<![\d/])(\d{1,3}(?:[ .]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)[ ]*""" +
            """(FCFA|CFA|XOF|XAF|GNF|FG|MGA|ARIARY|MAD|DH|DZD|DA|TND|EUR|USD|NGN|GHS|KES|MZN|RWF|CDF|AR|FRANCS|F)(?!\p{L})""",
        RegexOption.IGNORE_CASE
    )

    /**
     * Repli : une réponse qui parle de « solde » sans devise explicite
     * (« Votre solde est 5000 »). On prend le premier nombre qui suit.
     *
     * Le nombre est refusé s'il appartient à une date : sans cette garde, un
     * simple « Votre solde expire le 12/12/2026 » aurait affiché « 12 » comme
     * solde au client. Une date n'est pas un montant, même sans devise.
     */
    private val MOTIF_APRES_SOLDE = Regex(
        """(?:solde|cr[eé]dit|balance)[^0-9]{0,24}(\d[\d .]*)(?![\d/]*/)""",
        RegexOption.IGNORE_CASE
    )

    /** @return (montant, devise) — les deux valent null si rien de sûr n'a été trouvé. */
    fun analyser(texte: String?): Pair<String?, String?> {
        if (texte.isNullOrBlank()) return null to null
        // Espaces insécables (fréquents dans les montants) ramenés à l'espace simple.
        val propre = texte.replace('\u00A0', ' ').replace('\u202F', ' ')

        MOTIF_MONTANT_ET_DEVISE.find(propre)?.let { trouve ->
            val montant = trouve.groupValues[1].trim()
            val devise = trouve.groupValues[2].trim().uppercase()
            if (montant.isNotEmpty()) return montant to devise
        }

        MOTIF_APRES_SOLDE.find(propre)?.let { trouve ->
            val montant = trouve.groupValues[1].trim().trimEnd('.', ',').trim()
            if (montant.isNotEmpty()) return montant to null
        }

        return null to null
    }
}
