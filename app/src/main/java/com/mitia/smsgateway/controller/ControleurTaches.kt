package com.mitia.smsgateway.controller

import android.content.Context
import android.util.Log
import com.mitia.smsgateway.data.sms.GestionnaireSim
import com.mitia.smsgateway.data.sms.ExpediteurSms
import com.mitia.smsgateway.domain.model.ResultatStatut
import com.mitia.smsgateway.domain.model.Statuts
import com.mitia.smsgateway.domain.model.TacheDto
import com.mitia.smsgateway.domain.repository.DepotJournaux
import com.mitia.smsgateway.domain.repository.DepotTaches

/**
 * Réclamation + envoi SMS + confirmation.
 *
 * Anti-doublon (Piège 3) : le SMS n'est envoyé qu'après une réclamation RECLAME
 * acceptée par le serveur, et une seule fois. Si le réseau coupe après
 * l'envoi, seule la confirmation HTTP est rejouée.
 *
 * @param auTexteStatut met à jour la notification foreground (côté service).
 */
class ControleurTaches(
    private val taches: DepotTaches,
    private val journaux: DepotJournaux
) {

    private val etiquette = "ControleurTaches"

    suspend fun traiterTaches(
        context: Context,
        appareilId: String,
        jeton: String,
        listeTaches: List<TacheDto>,
        auTexteStatut: (String) -> Unit
    ) {
        if (listeTaches.isEmpty()) {
            Log.d(etiquette, "Aucune tâche en attente")
            auTexteStatut("En attente de tâches...")
            return
        }
        Log.d(etiquette, "${listeTaches.size} tâche(s) reçue(s) :")

        for (tache in listeTaches) {
            Log.d(etiquette, "Traitement de la tâche ${tache.id}")

            val reclamation = taches.mettreAJourStatutDetaille(appareilId, jeton, tache.id, Statuts.RECLAME)
            val envoiOk = when (reclamation) {
                is ResultatStatut.Succes, is ResultatStatut.DejaConfirme -> true
                else -> false
            }
            if (!envoiOk) {
                when (reclamation) {
                    is ResultatStatut.AssigneAUnAutre ->
                        Log.w(etiquette, "Tâche ${tache.id} déjà prise par ${reclamation.assigneA}, on passe (pas de SMS)")
                    is ResultatStatut.ConflitFinalise ->
                        Log.w(etiquette, "Tâche ${tache.id} déjà finalisée (${reclamation.statutActuel}), on passe (pas de SMS)")
                    is ResultatStatut.ErreurHttp, is ResultatStatut.ErreurReseau ->
                        Log.w(etiquette, "Réclamation RECLAME impossible (réseau ?), on passe sans envoyer : ${tache.id}")
                    else -> {}
                }
                continue
            }

            val abonnementId = GestionnaireSim.resoudreAbonnementId(context)
            val envoye = ExpediteurSms.envoyerSms(
                context = context,
                numero = tache.numero_destinataire,
                message = tache.message,
                abonnementId = abonnementId
            )
            GestionnaireSim.noterEnvoi(context)

            if (envoye) {
                Log.d(etiquette, "SMS envoyé à ${tache.numero_destinataire}")
                taches.enregistrerStatut(tache.id, Statuts.ENVOYE)
                journaux.journaliser("sms envoyé > ${tache.numero_destinataire}")
                val confirme = taches.confirmerAvecReessai(appareilId, jeton, tache.id, Statuts.ENVOYE)
                if (confirme) {
                    journaux.journaliser("accusé transmis au serveur")
                    auTexteStatut("SMS envoyé à ${tache.numero_destinataire}")
                } else {
                    taches.ajouterConfirmationEnAttente(tache.id, Statuts.ENVOYE)
                    Log.w(etiquette, "ENVOYE non confirmé (réseau ?), mis en file : ${tache.id}")
                    auTexteStatut("SMS envoyé, confirmation en attente...")
                }
            } else {
                Log.e(etiquette, "Échec de l'envoi du SMS")
                val messageErreur = "SmsManager a retourné un échec"
                taches.enregistrerStatut(tache.id, Statuts.ECHOUE, messageErreur)
                journaux.journaliser("sms échoué > ${tache.numero_destinataire}")
                val confirme = taches.confirmerAvecReessai(appareilId, jeton, tache.id, Statuts.ECHOUE, messageErreur)
                if (confirme) {
                    journaux.journaliser("rapport d'échec envoyé au serveur")
                    auTexteStatut("Échec SMS à ${tache.numero_destinataire}")
                } else {
                    taches.ajouterConfirmationEnAttente(tache.id, Statuts.ECHOUE, messageErreur)
                    Log.w(etiquette, "ECHOUE non confirmé (réseau ?), mis en file : ${tache.id}")
                    auTexteStatut("Échec SMS, confirmation en attente...")
                }
            }
        }
    }
}
