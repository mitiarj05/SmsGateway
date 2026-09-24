package com.mitia.smsgateway.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log
import com.mitia.smsgateway.data.local.JournalEvenements
import com.mitia.smsgateway.data.local.PreferencesAppareil
import com.mitia.smsgateway.data.remote.ClientApi
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Réception SMS : chaque message arrivé sur la SIM est transféré tel quel
 * au serveur (expéditeur + contenu + date). Le routage vers le client
 * (corrélation, SIM dédiée) se fait côté serveur — le téléphone ne décide rien.
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

        val attente = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val contexte = context.applicationContext
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
}
