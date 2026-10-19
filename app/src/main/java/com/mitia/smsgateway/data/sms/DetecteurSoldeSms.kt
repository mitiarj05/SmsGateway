package com.mitia.smsgateway.data.sms

/**
 * Reconnaît, dans un SMS entrant, une notification de solde d'un opérateur.
 *
 * Pourquoi tant de prudence ? L'appareil reçoit TOUS les SMS : les réponses de
 * vrais clients, mais aussi les campagnes marketing de l'opérateur lui-même. Un
 * SMS Yas réellement reçu disait « Rechargez 200 Ar et bénéficiez de 20 Mo de
 * data gratuits » : sans garde-fou, « 200 Ar » deviendrait le solde affiché au
 * client. Un faux solde est pire qu'aucun solde.
 *
 * Trois conditions indépendantes sont donc exigées :
 *
 *  1. l'expéditeur ressemble à un service (nom d'opérateur ou code court) — un
 *     numéro de mobile complet est un client qui répond, pas l'opérateur ;
 *  2. le texte parle explicitement de solde (solde, crédit, balance, reste…) ;
 *  3. un montant SUIVI DE SA DEVISE est extractible juste après ce mot. La
 *     devise est exigée ici (contrairement au relevé USSD) : sans elle, une
 *     phrase anodine comme « votre solde expire le 12/12/2026 » ferait passer
 *     une date pour un montant.
 *
 * Ce qui n'est pas reconnu n'est pas inventé : le message reste dans la
 * messagerie du client, simplement il ne devient pas un solde.
 */
object DetecteurSoldeSms {

    /** Mots qui désignent un solde. */
    private val MOTS_SOLDE = Regex(
        """\b(solde|cr[eé]dit|balance|reste|restant)\b""",
        RegexOption.IGNORE_CASE
    )

    /**
     * Longueur de la fenêtre examinée après le mot de solde. Assez large pour
     * « Votre solde est de 5 000 Ar », assez courte pour ne pas attraper un
     * montant cité plus loin dans un message publicitaire.
     */
    private const val FENETRE_APRES_MOT = 60

    /** Un code court opérateur : de 3 à 8 chiffres, éventuellement précédé de +. */
    private val CODE_COURT = Regex("""^\+?\d{3,8}$""")

    /**
     * Vrai si l'expéditeur peut être un service : nom alphabétique (« Yas »,
     * « TELMA », « YasQuizWin ») ou code court (« 355 »). Un numéro de mobile
     * complet (douze chiffres) est exclu : c'est un client qui répond.
     */
    fun expediteurDeService(expediteur: String): Boolean {
        val propre = expediteur.trim().replace(" ", "").replace("-", "")
        if (propre.isEmpty()) return false
        // Un nom d'expéditeur : au moins une lettre, et jamais un long numéro.
        if (propre.any { it.isLetter() }) return propre.count { it.isDigit() } <= 6
        return CODE_COURT.matches(propre)
    }

    /** Vrai si le texte parle de solde. */
    fun evoqueUnSolde(contenu: String): Boolean = MOTS_SOLDE.containsMatchIn(contenu)

    /**
     * @return (montant, devise) si le message est bien une notification de
     *         solde, `null` sinon.
     */
    fun extraireSolde(expediteur: String, contenu: String): Pair<String, String>? {
        if (!expediteurDeService(expediteur)) return null
        return extraireSolde(contenu)
    }

    /** Variante sans contrôle d'expéditeur (le message a déjà été qualifié). */
    fun extraireSolde(contenu: String): Pair<String, String>? {
        // Espaces insécables fréquents dans les montants, ramenés à l'espace simple.
        val propre = contenu.replace('\u00A0', ' ').replace('\u202F', ' ')
        for (mot in MOTS_SOLDE.findAll(propre)) {
            val fin = minOf(propre.length, mot.range.first + FENETRE_APRES_MOT)
            val fenetre = propre.substring(mot.range.first, fin)
            val (montant, devise) = AnalyseurSolde.analyser(fenetre)
            if (!montant.isNullOrBlank() && !devise.isNullOrBlank()) return montant to devise
        }
        return null
    }
}
