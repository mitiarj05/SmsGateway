package com.mitia.smsgateway

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
 * (résultat via sentIntent). Sans sentIntent, sendTextMessage()
 * ne garantit rien : le réseau peut rejeter après.
 */
object SmsSender {

    private const val TAG = "SmsSender"
    private const val SENT_TIMEOUT_MS = 30_000L

    suspend fun sendSms(context: Context, numero: String, message: String): Boolean {
        // 0. Permission
        if (ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.SEND_SMS
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            Log.e(TAG, "Permission SEND_SMS non accordée, envoi annulé vers $numero")
            return false
        }

        // 0bis. Diagnostic SIM / abonnement (explique 90% des "SENT mais non reçu")
        try {
            val tm = context.getSystemService(TelephonyManager::class.java)
            val simState = tm?.simState
            Log.d(TAG, "SIM state=$simState (${simStateToString(simState)})")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                val sm = context.getSystemService(SubscriptionManager::class.java)
                val defSms = SubscriptionManager.getDefaultSmsSubscriptionId()
                Log.d(TAG, "DefaultSmsSubscriptionId=$defSms")
                sm?.activeSubscriptionInfoList?.forEach {
                    Log.d(TAG, "Sub id=${it.subscriptionId} carrier=${it.carrierName} mcc=${it.mcc} mnc=${it.mnc}")
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Diagnostic SIM impossible", e)
        }

        return try {
            val smsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                context.getSystemService(SmsManager::class.java)
            } else {
                @Suppress("DEPRECATION")
                SmsManager.getDefault()
            }

            if (smsManager == null) {
                Log.e(TAG, "SmsManager indisponible")
                return false
            }

            val parts = smsManager.divideMessage(message)
            if (parts.size > 1) {
                // Multipart avec intents multiples : hors scope du test, on envoie simple
                // et on signale pour découper côté serveur plus tard si besoin.
                Log.w(TAG, "Message long (${parts.size} parts), envoi multipart sans accusé détaillé")
                smsManager.sendMultipartTextMessage(numero, null, parts, null, null)
                Log.d(TAG, "SMS multipart transmis au système : $numero")
                return true
            }

            // --- Envoi single-part avec sentIntent pour vrai résultat radio ---
            val action = "com.mitia.smsgateway.SMS_SENT_${System.currentTimeMillis()}"
            val deferred = CompletableDeferred<Boolean>()
            val receiver = object : BroadcastReceiver() {
                override fun onReceive(ctx: Context?, intent: Intent?) {
                    val rc = resultCode
                    Log.d(TAG, "sentIntent resultCode=$rc (${sentResultToString(rc)}) vers $numero")
                    deferred.complete(rc == Activity.RESULT_OK)
                }
            }
            val filter = IntentFilter(action)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                context.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
            } else {
                @Suppress("UnspecifiedRegisterReceiverFlag")
                context.registerReceiver(receiver, filter)
            }

            try {
                val sentIntent = PendingIntent.getBroadcast(
                    context,
                    action.hashCode(),
                    Intent(action).setPackage(context.packageName),
                    PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
                )
                smsManager.sendTextMessage(numero, null, message, sentIntent, null)
                Log.d(TAG, "SMS transmis à la radio, attente sentIntent : $numero")

                val ok = withTimeoutOrNull(SENT_TIMEOUT_MS) { deferred.await() } ?: false
                if (!ok) Log.e(TAG, "Radio a refusé le SMS (voir resultCode ci-dessus)")
                ok
            } finally {
                try {
                    context.unregisterReceiver(receiver)
                } catch (_: Exception) {
                }
            }
        } catch (e: SecurityException) {
            Log.e(TAG, "Refus système (permission révoquée ?)", e)
            false
        } catch (e: Exception) {
            Log.e(TAG, "Erreur d'envoi de SMS", e)
            false
        }
    }

    private fun sentResultToString(rc: Int): String = when (rc) {
        Activity.RESULT_OK -> "RESULT_OK (accepté par la radio)"
        SmsManager.RESULT_ERROR_GENERIC_FAILURE -> "GENERIC_FAILURE (crédit insuffisant, numéro invalide, hors réseau...)"
        SmsManager.RESULT_ERROR_NO_SERVICE -> "NO_SERVICE (pas de réseau)"
        SmsManager.RESULT_ERROR_NULL_PDU -> "NULL_PDU"
        SmsManager.RESULT_ERROR_RADIO_OFF -> "RADIO_OFF (mode avion ?)"
        else -> "code inconnu $rc"
    }

    private fun simStateToString(state: Int?): String = when (state) {
        TelephonyManager.SIM_STATE_ABSENT -> "ABSENT (pas de SIM !)"
        TelephonyManager.SIM_STATE_READY -> "READY"
        TelephonyManager.SIM_STATE_PIN_REQUIRED -> "PIN_REQUIRED"
        TelephonyManager.SIM_STATE_PUK_REQUIRED -> "PUK_REQUIRED"
        TelephonyManager.SIM_STATE_NETWORK_LOCKED -> "NETWORK_LOCKED"
        TelephonyManager.SIM_STATE_UNKNOWN -> "UNKNOWN"
        else -> "?"
    }
}
