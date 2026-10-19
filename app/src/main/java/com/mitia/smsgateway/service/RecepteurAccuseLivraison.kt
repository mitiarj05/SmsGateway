package com.mitia.smsgateway.service

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.telephony.SmsMessage
import android.util.Log
import com.mitia.smsgateway.data.local.JournalEvenements
import com.mitia.smsgateway.data.local.MagasinAccusesLivraison
import com.mitia.smsgateway.domain.model.Statuts
import com.mitia.smsgateway.util.Constantes
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Accusé de réception RÉSEAU (DLR) : l'opérateur confirme (ou refuse) la remise
 * du SMS au téléphone du destinataire.
 *
 * Déclenché par la téléphonie sur l'intention de remise fournie à
 * SmsManager.sendTextMessage — parfois quelques secondes après l'envoi, parfois
 * plusieurs minutes, et parfois jamais (tous les opérateurs n'émettent pas de
 * DLR). Il peut donc arriver quand l'application vient d'être tuée : le
 * récepteur est déclaré au manifeste, il n'a besoin d'aucun processus vivant.
 *
 * Il ne fait AUCUN appel réseau ici : il écrit l'accusé dans une file
 * persistante, puis réveille le service, qui le remonte au serveur au cycle
 * suivant et réessaie en cas de coupure. Même logique que la file de
 * confirmations d'envoi (Piège 3).
 */
class RecepteurAccuseLivraison : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Constantes.ACTION_SMS_LIVRE) return

        val tacheId = intent.getStringExtra(Constantes.EXTRA_TACHE_ID)
        if (tacheId.isNullOrBlank()) {
            Log.w(ETIQUETTE, "Accusé sans identifiant de tâche, ignoré")
            return
        }

        val codeResultat = resultCode
        val livre = codeResultat == Activity.RESULT_OK
        val livraison = if (livre) Statuts.LIVRE else Statuts.ECHEC_LIVRAISON
        val code = lireCodeStatut(intent)

        Log.d(
            ETIQUETTE,
            "Accusé reçu pour $tacheId : $livraison (resultCode=$codeResultat, status=${code ?: "?"})"
        )

        val attente = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val contexte = context.applicationContext
                MagasinAccusesLivraison.ajouter(contexte, tacheId, livraison, code)
                JournalEvenements.journaliser(
                    contexte,
                    "accusé réseau > $tacheId : ${if (livre) "livré" else "non livré"}"
                )
                reveillerService(contexte)
            } catch (e: Exception) {
                Log.e(ETIQUETTE, "Enregistrement de l'accusé impossible", e)
            } finally {
                attente.finish()
            }
        }
    }

    /**
     * Code de statut brut de l'accusé (0 = remis). Sert au diagnostic
     * uniquement : le booléen livré/non livré vient du resultCode du broadcast.
     */
    private fun lireCodeStatut(intent: Intent): Int? {
        // Extra posé par la téléphonie sur certains appareils.
        val direct = intent.getIntExtra("status", -1)
        if (direct != -1) return direct

        // Sinon : lecture du rapport de remise dans le PDU.
        return try {
            val pdus = intent.extras?.get("pdu") as? Array<*>
            val premier = pdus?.firstOrNull() as? ByteArray
            @Suppress("DEPRECATION")
            premier?.let { SmsMessage.createFromPdu(it)?.status }
        } catch (e: Exception) {
            Log.d(ETIQUETTE, "Code de statut illisible depuis le PDU", e)
            null
        }
    }

    /** Réveille la boucle de scrutation pour remonter l'accusé sans attendre. */
    private fun reveillerService(contexte: Context) {
        try {
            val intention = Intent(contexte, ServicePasserelleSms::class.java)
                .setAction("ACTION_POLL_NOW")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                contexte.startForegroundService(intention)
            } else {
                contexte.startService(intention)
            }
        } catch (e: Exception) {
            // Sans importance : la scrutation périodique (30 s) prendra le relais.
            Log.w(ETIQUETTE, "Réveil du service refusé, l'accusé partira au prochain cycle", e)
        }
    }

    private companion object {
        const val ETIQUETTE = "RecepteurAccuseLivraison"
    }
}
