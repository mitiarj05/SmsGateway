package com.mitia.smsgateway.controller

import android.content.Context
import android.util.Log
import com.mitia.smsgateway.data.local.MagasinUssd
import com.mitia.smsgateway.data.sms.AnalyseurSolde
import com.mitia.smsgateway.data.sms.ExecuteurUssd
import com.mitia.smsgateway.data.sms.GestionnaireSim
import com.mitia.smsgateway.data.sms.ResultatUssd
import com.mitia.smsgateway.domain.model.SoldeSim
import com.mitia.smsgateway.domain.repository.DepotAppareils
import com.mitia.smsgateway.domain.repository.DepotJournaux
import com.mitia.smsgateway.util.Constantes

/**
 * Relève le solde de la carte SIM par code USSD et le remonte au serveur.
 *
 * Le solde n'est pas une donnée de confort : c'est le seul vrai crédit de la
 * passerelle (le quota serveur peut être illimité). Un relevé dit au client
 * quand recharger avant que ses SMS ne partent plus.
 *
 * Trois sources : le bouton « vérifier le solde » de chaque carte (écran
 * Diagnostic), un passage automatique une fois par jour et par carte depuis la
 * boucle du service — uniquement quand la radio est libre (aucune tâche à
 * envoyer) — et la lecture des SMS que l'opérateur envoie de lui-même (recharge,
 * notification de solde), qui ne demande aucune session USSD.
 */
class ControleurSoldeSim(
    private val appareils: DepotAppareils,
    private val journaux: DepotJournaux
) {

    private val etiquette = "ControleurSoldeSim"

    sealed interface Resultat {
        data class Releve(val solde: SoldeSim) : Resultat
        data class Echec(val message: String) : Resultat
    }

    /**
     * Interroge l'opérateur pour UNE carte.
     *
     * Enregistre systématiquement le relevé localement (même sans montant
     * reconnu) pour qu'il reste consultable, et tente de le transmettre.
     */
    suspend fun verifierSolde(
        context: Context,
        appareilId: String?,
        jeton: String?,
        souscriptionId: Int
    ): Resultat {
        val code = MagasinUssd.obtenirCode(context, souscriptionId)
        if (code.isNullOrBlank()) {
            return Resultat.Echec("Aucun code USSD enregistré pour cette carte")
        }

        // Tentative notée AVANT l'exécution : un opérateur muet ne doit pas être
        // réinterrogé à chaque cycle de scrutation (30 s).
        MagasinUssd.noterTentative(context, souscriptionId)
        journaux.journaliser("relevé du solde SIM (code USSD)")

        return when (val resultat = ExecuteurUssd.executer(context, code, souscriptionId)) {
            is ResultatUssd.Reponse -> enregistrerReleve(
                context, appareilId, jeton, souscriptionId, resultat.texte
            )

            is ResultatUssd.Echec -> {
                Log.w(etiquette, "Solde SIM non relevé : ${resultat.message}")
                journaux.journaliser("solde SIM non relevé : ${resultat.message}")
                Resultat.Echec(resultat.message)
            }
        }
    }

    /**
     * Enregistre un solde trouvé dans un SMS de l'opérateur.
     *
     * C'est le canal le plus confortable : le message est déjà là, il n'y a rien
     * à demander et aucune session USSD à ouvrir — donc aucun menu qui reste
     * ouvert et bloque les demandes suivantes. Le message doit avoir été
     * reconnu comme une notification de solde (voir DetecteurSoldeSms) : un SMS
     * de client ne devient jamais un solde.
     *
     * @param texteBrut message tel que reçu, conservé pour vérification à l'œil.
     * @param montant montant lu dans la phrase de solde (jamais réinventé ici).
     * @param devise devise annoncée à côté du montant (null si l'opérateur tait).
     */
    suspend fun enregistrerSoldeDepuisSms(
        context: Context,
        appareilId: String?,
        jeton: String?,
        souscriptionId: Int,
        texteBrut: String,
        montant: String,
        devise: String?
    ): Resultat {
        journaux.journaliser("solde SIM lu dans un SMS de l'opérateur")
        // Le montant provient de la fenêtre reconnue autour du mot « solde » : on
        // ne réanalyse pas le message entier, qui peut citer un autre montant
        // ailleurs (publicité, frais, offre).
        return enregistrerReleve(
            context, appareilId, jeton, souscriptionId, texteBrut, montant to devise
        )
    }

    /**
     * À appeler à chaque cycle de scrutation, radio libre.
     *
     * @return le nombre de cartes effectivement interrogées (0 le plus souvent).
     */
    suspend fun verifierSiNecessaire(
        context: Context,
        appareilId: String?,
        jeton: String?
    ): Int {
        // Les relevés obtenus hors ligne doivent finir par arriver : sinon la
        // console afficherait un solde que le client ne voit jamais.
        if (appareilId != null && jeton != null) {
            transmettreRelevesEnAttente(context, appareilId, jeton)
        }

        if (!MagasinUssd.estVerificationAutoActive(context)) return 0

        var interrogees = 0
        for (sim in GestionnaireSim.listerSims(context)) {
            val code = MagasinUssd.obtenirCode(context, sim.abonnementId)
            if (code.isNullOrBlank()) continue
            val ecoule = System.currentTimeMillis() -
                MagasinUssd.derniereTentative(context, sim.abonnementId)
            if (ecoule < Constantes.INTERVALLE_RELEVE_SOLDE_MS) continue

            verifierSolde(context, appareilId, jeton, sim.abonnementId)
            interrogees++
        }
        if (interrogees > 0) Log.d(etiquette, "Relevé automatique : $interrogees carte(s)")
        return interrogees
    }

    private suspend fun enregistrerReleve(
        context: Context,
        appareilId: String?,
        jeton: String?,
        souscriptionId: Int,
        texteBrut: String,
        mesure: Pair<String?, String?>? = null
    ): Resultat {
        // `mesure` est fournie quand la lecture a déjà été faite (SMS de
        // l'opérateur) ; sinon on analyse la réponse USSD brute.
        val (montant, devise) = mesure ?: AnalyseurSolde.analyser(texteBrut)
        val solde = SoldeSim(
            souscriptionId = souscriptionId,
            montant = montant,
            devise = devise,
            // 500 = même plafond que côté serveur : ce qui est stocké ici doit
            // pouvoir être transmis tel quel.
            texte = texteBrut.trim().take(500).takeIf { it.isNotEmpty() },
            horodatage = System.currentTimeMillis(),
            transmis = false,
            tentativesTransmission = 0
        )

        if (!solde.exploitable) {
            journaux.journaliser("solde SIM : réponse de l'opérateur vide")
            return Resultat.Echec("L'opérateur n'a rien répondu")
        }

        MagasinUssd.enregistrerSolde(context, solde)
        journaux.journaliser(
            if (montant != null) "solde SIM : $montant${devise?.let { " $it" } ?: ""}"
            else "solde SIM relevé (montant non reconnu, réponse conservée)"
        )

        if (appareilId != null && jeton != null && transmettre(appareilId, jeton, solde)) {
            MagasinUssd.enregistrerSolde(context, solde.copy(transmis = true))
        }

        return Resultat.Releve(solde)
    }

    /** Réessaie les relevés jamais transmis (coupure réseau, serveur en retard). */
    private suspend fun transmettreRelevesEnAttente(
        context: Context,
        appareilId: String,
        jeton: String
    ) {
        for (solde in MagasinUssd.obtenirSoldes(context)) {
            if (solde.transmis || !solde.exploitable) continue
            if (solde.tentativesTransmission >= Constantes.MAX_TRANSMISSIONS_SOLDE) continue

            if (transmettre(appareilId, jeton, solde)) {
                MagasinUssd.enregistrerSolde(context, solde.copy(transmis = true))
            } else {
                MagasinUssd.enregistrerSolde(
                    context,
                    solde.copy(tentativesTransmission = solde.tentativesTransmission + 1)
                )
            }
        }
    }

    private suspend fun transmettre(appareilId: String, jeton: String, solde: SoldeSim): Boolean =
        appareils.signalerSoldeSim(
            appareilId,
            jeton,
            solde.montant,
            solde.devise,
            solde.texte,
            solde.horodatage
        )
}
