package com.mitia.smsgateway.data.sms

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.os.Handler
import android.os.Looper
import android.telephony.TelephonyManager
import android.util.Log
import androidx.core.content.ContextCompat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeoutOrNull
import kotlin.coroutines.resume

/** Issue d'une demande USSD. */
sealed interface ResultatUssd {
    /** L'opérateur a répondu : texte brut, tel qu'il l'a envoyé. */
    data class Reponse(val texte: String) : ResultatUssd

    /** Rien d'exploitable (permission, radio indisponible, délai, refus). */
    data class Echec(val message: String) : ResultatUssd
}

/**
 * Exécute un code USSD sur une carte SIM et rend la réponse brute.
 *
 * Android n'expose aucune API de « lecture de solde » : le seul moyen est
 * d'envoyer le code de l'opérateur (ex. #123#) et de lire ce qu'il répond. Ce
 * code dépend de l'opérateur ; il n'est jamais choisi ici, il vient du réglage
 * de l'utilisateur (voir MagasinUssd).
 *
 * Contrainte plateforme : depuis l'API 26, TelephonyManager.sendUssdRequest()
 * exige la permission CALL_PHONE (vérifiée en amont). Certains appareils
 * refusent malgré tout l'appel — on le signale clairement plutôt que d'échouer
 * en silence. La session USSD ouverte par l'opérateur (menu à choix) n'est pas
 * fermée par cette API : la réponse affichée est celle reçue, un point c'est tout.
 */
object ExecuteurUssd {

    private const val ETIQUETTE = "ExecuteurUssd"

    /** Au-delà, l'opérateur ne répondra plus : inutile de bloquer la boucle. */
    private const val DELAI_MAX_MS = 30_000L

    fun permissionTelephoneAccordee(context: Context): Boolean =
        ContextCompat.checkSelfPermission(context, Manifest.permission.CALL_PHONE) ==
            PackageManager.PERMISSION_GRANTED

    suspend fun executer(context: Context, code: String, souscriptionId: Int): ResultatUssd {
        val demande = code.trim()
        if (demande.isEmpty()) {
            return ResultatUssd.Echec("Aucun code USSD enregistré pour cette carte")
        }
        if (!permissionTelephoneAccordee(context)) {
            return ResultatUssd.Echec("Permission « Téléphone » non accordée")
        }

        val gestionnaire = try {
            val base = context.getSystemService(TelephonyManager::class.java)
            // createForSubscriptionId est une méthode d'INSTANCE : on part du
            // gestionnaire système puis on l'épingle sur la carte voulue.
            when {
                base == null -> null
                souscriptionId >= 0 -> base.createForSubscriptionId(souscriptionId)
                else -> base
            }
        } catch (e: Exception) {
            Log.w(ETIQUETTE, "Téléphonie indisponible pour l'abonnement $souscriptionId", e)
            null
        } ?: return ResultatUssd.Echec("Téléphonie indisponible sur cet appareil")

        if (gestionnaire.simState != TelephonyManager.SIM_STATE_READY) {
            return ResultatUssd.Echec("Carte SIM non prête (état ${gestionnaire.simState})")
        }

        val resultat = withTimeoutOrNull(DELAI_MAX_MS) {
            // L'appel est fait sur le thread principal et le rappel est livré par
            // le Handler principal : c'est le chemin attendu par la téléphonie.
            withContext(Dispatchers.Main.immediate) {
                suspendCancellableCoroutine<ResultatUssd> { suite ->
                    val rappel = object : TelephonyManager.UssdResponseCallback() {
                        override fun onReceiveUssdResponse(
                            telephone: TelephonyManager?,
                            requete: String?,
                            texte: CharSequence?
                        ) {
                            if (suite.isActive) {
                                suite.resume(ResultatUssd.Reponse(texte?.toString().orEmpty()))
                            }
                        }

                        override fun onReceiveUssdResponseFailed(
                            telephone: TelephonyManager?,
                            requete: String?,
                            codeEchec: Int
                        ) {
                            if (suite.isActive) {
                                suite.resume(
                                    ResultatUssd.Echec("L'opérateur a refusé la demande (code $codeEchec)")
                                )
                            }
                        }
                    }
                    try {
                        envoyerDemande(gestionnaire, demande, rappel)
                    } catch (e: Exception) {
                        Log.e(ETIQUETTE, "Envoi USSD refusé : $demande", e)
                        if (suite.isActive) {
                            suite.resume(
                                ResultatUssd.Echec("Android a refusé l'envoi du code (${e.javaClass.simpleName})")
                            )
                        }
                    }
                }
            }
        }

        return resultat
            ?: ResultatUssd.Echec("Pas de réponse de l'opérateur après ${DELAI_MAX_MS / 1000} s")
    }

    @SuppressLint("MissingPermission")
    private fun envoyerDemande(
        gestionnaire: TelephonyManager,
        code: String,
        rappel: TelephonyManager.UssdResponseCallback
    ) {
        // Permission vérifiée par permissionTelephoneAccordee() avant l'appel.
        gestionnaire.sendUssdRequest(code, rappel, Handler(Looper.getMainLooper()))
    }
}
