package com.mitia.smsgateway.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.telephony.SubscriptionManager
import android.util.Log
import com.mitia.smsgateway.AppPasserelleSms
import com.mitia.smsgateway.data.local.JournalEvenements
import com.mitia.smsgateway.data.local.PreferencesAppareil
import com.mitia.smsgateway.data.remote.ClientApi
import com.mitia.smsgateway.data.sms.DetecteurSoldeSms
import com.mitia.smsgateway.data.sms.GestionnaireSim
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Réception SMS : chaque message arrivé sur la SIM est transféré tel quel
 * au serveur (expéditeur + contenu + date). Le routage vers le client
 * (corrélation, SIM dédiée) se fait côté serveur — le téléphone ne décide rien.
 *
 * Une lecture locale s'ajoute, sans changer ce transfert : quand l'opérateur
 * annonce lui-même le solde de la carte (notification de recharge, réponse à
 * une demande), ce texte est retenu comme relevé de solde. C'est le seul moyen
 * de connaître un solde sans ouvrir de session USSD — donc sans risquer un menu
 * resté ouvert qui bloquerait les demandes suivantes.
 */
class RecepteurSms : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
        val messages = try {
            Telephony.Sms.Intents.getMessagesFromIntent(intent)
        } catch (e: Exception) {
            Log.w("RecepteurSms", "PDU illisible", e)
            return
        }
        if (messages.isNullOrEmpty()) return
        val expediteur = messages[0].originatingAddress?.takeIf { it.isNotBlank() } ?: return
        val contenu = messages.mapNotNull { it.messageBody }.joinToString("")
        if (contenu.isBlank()) return
        val dateReception = messages[0].timestampMillis
        val souscriptionAnnoncee = abonnementAnnonce(context, intent)

        val attente = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val contexte = context.applicationContext

                // 1) Le solde d'abord : c'est une lecture locale, elle doit
                //    survivre à une coupure réseau qui empêcherait le transfert.
                releverSoldeEventuel(contexte, expediteur, contenu, souscriptionAnnoncee)

                // 2) Transfert du message au serveur, inchangé.
                val identifiants = PreferencesAppareil.charger(contexte)
                if (identifiants == null) {
                    Log.w("RecepteurSms", "Appareil non enregistré, entrant ignoré")
                    return@launch
                }
                val (appareilId, jeton) = identifiants
                val envoye = ClientApi.envoyerEntrant(contexte, appareilId, jeton, expediteur, contenu, dateReception)
                JournalEvenements.journaliser(
                    contexte,
                    "sms reçu > $expediteur : ${if (envoye) "transmis au serveur" else "échec transfert"}"
                )
            } catch (e: Exception) {
                Log.e("RecepteurSms", "Transfert entrant impossible", e)
            } finally {
                attente.finish()
            }
        }
    }

    /**
     * Carte qui a reçu le message, quand l'appareil veut bien le dire.
     *
     * `SmsMessage` n'expose pas l'abonnement dans l'API publique : certains
     * appareils ajoutent l'information au broadcast, d'autres non. On la lit
     * donc défensivement, et l'appelant retombe sinon sur la carte d'envoi
     * résolue — seule autre information disponible.
     */
    private fun abonnementAnnonce(context: Context, intent: Intent): Int {
        val direct = runCatching {
            val parAbonnement = intent.getIntExtra("subscription", -1)
            if (parAbonnement >= 0) parAbonnement else intent.getIntExtra("subId", -1)
        }.getOrDefault(-1)
        if (direct >= 0) return direct

        val emplacement = runCatching { intent.getIntExtra("slot", -1) }.getOrDefault(-1)
        if (emplacement < 0) return SubscriptionManager.INVALID_SUBSCRIPTION_ID
        return runCatching {
            @Suppress("MissingPermission")
            context.getSystemService(SubscriptionManager::class.java)
                ?.getActiveSubscriptionInfoForSimSlotIndex(emplacement)
                ?.subscriptionId
        }.getOrNull() ?: SubscriptionManager.INVALID_SUBSCRIPTION_ID
    }

    /**
     * Lit le solde si — et seulement si — le message en annonce un (voir
     * DetecteurSoldeSms : expéditeur de service + mot « solde » + montant avec
     * devise juste après). Un SMS de client ne devient donc jamais un solde.
     */
    private suspend fun releverSoldeEventuel(
        context: Context,
        expediteur: String,
        contenu: String,
        souscriptionAnnoncee: Int
    ) {
        val (montant, devise) = DetecteurSoldeSms.extraireSolde(expediteur, contenu) ?: return
        val conteneur = (context.applicationContext as? AppPasserelleSms)?.conteneurApp ?: return
        // `SmsMessage.subscriptionId` n'est pas toujours renseigné (et vaut -1
        // quand il l'est mal) : on retombe alors sur la carte d'envoi résolue,
        // seule autre information disponible.
        val souscriptionId = if (souscriptionAnnoncee >= 0) {
            souscriptionAnnoncee
        } else {
            GestionnaireSim.resoudreAbonnementId(context)
        }
        val identifiants = PreferencesAppareil.charger(context)
        runCatching {
            conteneur.controleurSoldeSim.enregistrerSoldeDepuisSms(
                context,
                identifiants?.first,
                identifiants?.second,
                souscriptionId,
                contenu,
                montant,
                devise
            )
        }.onFailure { Log.w("RecepteurSms", "Solde lu dans un SMS non enregistré ($montant)", it) }
    }
}
