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
import kotlinx.coroutines.delay
import java.util.Locale
import kotlin.random.Random

/**
 * Réclamation + envoi SMS + confirmation.
 *
 * Anti-doublon (Piège 3) : le SMS n'est envoyé qu'après une réclamation RECLAME
 * acceptée par le serveur, et une seule fois. Si le réseau coupe après
 * l'envoi, seule la confirmation HTTP est rejouée.
 *
 * Temporisation (anti-ban) : entre deux SMS consécutifs d'un même lot, un délai
 * proche de @param cadenceEnvoiMs est respecté, avec une variation aléatoire de
 * ±25 %. Le but est de ne pas envoyer en rafale mécanique, ce que les filtres
 * anti-spam opérateur repèrent (et qui peut couper la carte SIM).
 *
 * @param cadenceEnvoiMs délai visé entre deux SMS (0 = aucune temporisation).
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
        cadenceEnvoiMs: Int = 0,
        auTexteStatut: (String) -> Unit
    ) {
        if (listeTaches.isEmpty()) {
            Log.d(etiquette, "Aucune tâche en attente")
            auTexteStatut("En attente de tâches...")
            return
        }
        Log.d(etiquette, "${listeTaches.size} tâche(s) reçue(s) :")
        if (cadenceEnvoiMs > 0 && listeTaches.size > 1) {
            Log.d(etiquette, "Temporisation active : ${cadenceEnvoiMs} ms (±25 %) entre deux SMS")
        }

        for ((index, tache) in listeTaches.withIndex()) {
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

            // --- Temporisation anti-ban : espace les SMS d'un même lot ---
            // Inutile après le dernier SMS (l'appareil va retourner en scrutation).
            if (index < listeTaches.lastIndex && cadenceEnvoiMs > 0) {
                val pause = pauseAvecVariation(cadenceEnvoiMs)
                val secondes = String.format(Locale.FRANCE, "%.1f", pause / 1000.0)
                journaux.journaliser("temporisation $secondes s avant le SMS suivant")
                auTexteStatut("Temporisation $secondes s avant le prochain SMS…")
                delay(pause)
            }
        }
    }

    /**
     * Délai réellement appliqué : ±25 % autour de la cadence choisie.
     *
     * Une cadence parfaitement régulière (ex. 3,00 s, 3,00 s, 3,00 s…) est un
     * motif typique de passerelle automatisée ; la variation le casse sans
     * allonger sensiblement le traitement du lot.
     */
    private fun pauseAvecVariation(cadenceEnvoiMs: Int): Long {
        val minimum = (cadenceEnvoiMs * 0.75).toLong().coerceAtLeast(1L)
        val maximum = (cadenceEnvoiMs * 1.25).toLong().coerceAtLeast(minimum)
        return if (maximum == minimum) minimum else Random.nextLong(minimum, maximum + 1)
    }
}
