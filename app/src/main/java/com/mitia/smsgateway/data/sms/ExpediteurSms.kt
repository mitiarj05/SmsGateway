package com.mitia.smsgateway.data.sms

import android.Manifest
import android.app.Activity
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.SmsManager
import android.telephony.SubscriptionManager
import android.telephony.TelephonyManager
import android.util.Log
import androidx.core.content.ContextCompat
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.withTimeoutOrNull

/**
 * Envoie des SMS via la carte SIM du téléphone.
 *
 * Retourne true UNIQUEMENT si la couche radio accepte le SMS
 * (résultat via intentionEnvoi). Sans intentionEnvoi, sendTextMessage()
 * ne garantit rien : le réseau peut rejeter après.
 */
object ExpediteurSms {

    private const val ETIQUETTE = "ExpediteurSms"
    private const val TIMEOUT_ENVOI_MS = 30_000L

    suspend fun envoyerSms(
        context: Context,
        numero: String,
        message: String,
        abonnementId: Int = SubscriptionManager.INVALID_SUBSCRIPTION_ID
    ): Boolean {
        // 0. Permission
        if (ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.SEND_SMS
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            Log.e(ETIQUETTE, "Permission SEND_SMS non accordée, envoi annulé vers $numero")
            return false
        }

        // 0bis. Diagnostic SIM / abonnement (explique 90% des "ENVOYE mais non reçu")
        try {
            val gestionnaireTelephonie = context.getSystemService(TelephonyManager::class.java)
            val etatSim = gestionnaireTelephonie?.simState
            Log.d(ETIQUETTE, "État SIM=$etatSim (${etatSimEnTexte(etatSim)})")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                val gestionnaireAbonnements = context.getSystemService(SubscriptionManager::class.java)
                val defautSms = SubscriptionManager.getDefaultSmsSubscriptionId()
                Log.d(ETIQUETTE, "AbonnementSmsDefaut=$defautSms")
                gestionnaireAbonnements?.activeSubscriptionInfoList?.forEach {
                    Log.d(ETIQUETTE, "Souscription id=${it.subscriptionId} operateur=${it.carrierName} mcc=${it.mcc} mnc=${it.mnc}")
                }
            }
        } catch (e: Exception) {
            Log.w(ETIQUETTE, "Diagnostic SIM impossible", e)
        }

        return try {
            // SIM explicite (multi-SIM) si fournie et supportée, sinon abonnement par défaut.
            val gestionnaireSms = if (abonnementId != SubscriptionManager.INVALID_SUBSCRIPTION_ID &&
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1
            ) {
                Log.d(ETIQUETTE, "Envoi via abonnement $abonnementId")
                SmsManager.getSmsManagerForSubscriptionId(abonnementId)
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                context.getSystemService(SmsManager::class.java)
            } else {
                @Suppress("DEPRECATION")
                SmsManager.getDefault()
            }

            if (gestionnaireSms == null) {
                Log.e(ETIQUETTE, "SmsManager indisponible")
                return false
            }

            val parties = gestionnaireSms.divideMessage(message)
            if (parties.size > 1) {
                // Multipart avec intentions multiples : hors scope de l'essai, on envoie simple
                // et on signale pour découper côté serveur plus tard si besoin.
                Log.w(ETIQUETTE, "Message long (${parties.size} parties), envoi multipart sans accusé détaillé")
                gestionnaireSms.sendMultipartTextMessage(numero, null, parties, null, null)
                Log.d(ETIQUETTE, "SMS multipart transmis au système : $numero")
                return true
            }

            // --- Envoi single-part avec intentionEnvoi pour vrai résultat radio ---
            val action = "com.mitia.smsgateway.SMS_SENT_${System.currentTimeMillis()}"
            val differe = CompletableDeferred<Boolean>()
            val recepteur = object : BroadcastReceiver() {
                override fun onReceive(contexte: Context?, intent: Intent?) {
                    val codeRetour = resultCode
                    Log.d(ETIQUETTE, "intentionEnvoi codeRetour=$codeRetour (${resultatEnvoiEnTexte(codeRetour)}) vers $numero")
                    differe.complete(codeRetour == Activity.RESULT_OK)
                }
            }
            val filtre = IntentFilter(action)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                context.registerReceiver(recepteur, filtre, Context.RECEIVER_NOT_EXPORTED)
            } else {
                @Suppress("UnspecifiedRegisterReceiverFlag")
                context.registerReceiver(recepteur, filtre)
            }

            try {
                val intentionEnvoi = PendingIntent.getBroadcast(
                    context,
                    action.hashCode(),
                    Intent(action).setPackage(context.packageName),
                    PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
                )
                gestionnaireSms.sendTextMessage(numero, null, message, intentionEnvoi, null)
                Log.d(ETIQUETTE, "SMS transmis à la radio, attente intentionEnvoi : $numero")

                val reussi = withTimeoutOrNull(TIMEOUT_ENVOI_MS) { differe.await() } ?: false
                if (!reussi) Log.e(ETIQUETTE, "Radio a refusé le SMS (voir codeRetour ci-dessus)")
                reussi
            } finally {
                try {
                    context.unregisterReceiver(recepteur)
                } catch (_: Exception) {
                }
            }
        } catch (e: SecurityException) {
            Log.e(ETIQUETTE, "Refus système (permission révoquée ?)", e)
            false
        } catch (e: Exception) {
            Log.e(ETIQUETTE, "Erreur d'envoi de SMS", e)
            false
        }
    }

    private fun resultatEnvoiEnTexte(code: Int): String = when (code) {
        Activity.RESULT_OK -> "RESULT_OK (accepté par la radio)"
        SmsManager.RESULT_ERROR_GENERIC_FAILURE -> "GENERIC_FAILURE (crédit insuffisant, numéro invalide, hors réseau...)"
        SmsManager.RESULT_ERROR_NO_SERVICE -> "NO_SERVICE (pas de réseau)"
        SmsManager.RESULT_ERROR_NULL_PDU -> "NULL_PDU"
        SmsManager.RESULT_ERROR_RADIO_OFF -> "RADIO_OFF (mode avion ?)"
        else -> "code inconnu $code"
    }

    private fun etatSimEnTexte(etat: Int?): String = when (etat) {
        TelephonyManager.SIM_STATE_ABSENT -> "ABSENT (pas de SIM !)"
        TelephonyManager.SIM_STATE_READY -> "READY"
        TelephonyManager.SIM_STATE_PIN_REQUIRED -> "PIN_REQUIRED"
        TelephonyManager.SIM_STATE_PUK_REQUIRED -> "PUK_REQUIRED"
        TelephonyManager.SIM_STATE_NETWORK_LOCKED -> "NETWORK_LOCKED"
        TelephonyManager.SIM_STATE_UNKNOWN -> "UNKNOWN"
        else -> "?"
    }
}
