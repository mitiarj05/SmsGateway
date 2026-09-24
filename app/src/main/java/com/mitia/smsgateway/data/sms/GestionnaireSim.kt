package com.mitia.smsgateway.data.sms

import android.content.Context
import android.telephony.SubscriptionInfo
import android.telephony.SubscriptionManager
import android.telephony.TelephonyManager
import android.util.Log
import com.mitia.smsgateway.data.local.PreferencesAppareil

data class InfoSim(
    val abonnementId: Int,
    val indexEmplacement: Int,
    val operateur: String,
    val numero: String?
)

/**
 * Gestion multi-SIM : détection, choix manuel ou rotation automatique
 * (tous les LOT_ROTATION envois) pour répartir la charge opérateur.
 */
object GestionnaireSim {

    const val LOT_ROTATION = 10
    private const val ETIQUETTE = "GestionnaireSim"

    /** SIM actives (nécessite READ_PHONE_STATE sur versions récentes, sinon liste vide). */
    fun listerSims(context: Context): List<InfoSim> {
        return try {
            val gestionnaireAbonnements = context.getSystemService(SubscriptionManager::class.java)
                ?: return emptyList()
            @Suppress("MissingPermission")
            val infos: List<SubscriptionInfo> =
                gestionnaireAbonnements.activeSubscriptionInfoList ?: return emptyList()
            infos.map {
                InfoSim(
                    abonnementId = it.subscriptionId,
                    indexEmplacement = it.simSlotIndex,
                    operateur = it.carrierName?.toString()?.takeIf { n -> n.isNotBlank() } ?: "Opérateur inconnu",
                    numero = it.number?.takeIf { n -> n.isNotBlank() }
                )
            }.sortedBy { it.indexEmplacement }
        } catch (e: Exception) {
            Log.w(ETIQUETTE, "Liste SIM illisible (permission ?)", e)
            emptyList()
        }
    }

    /** Nombre d'emplacements physiques (sans permission). */
    fun compterEmplacements(context: Context): Int {
        return try {
            context.getSystemService(TelephonyManager::class.java)?.phoneCount ?: 1
        } catch (e: Exception) {
            Log.w(ETIQUETTE, "phoneCount illisible", e)
            1
        }
    }

    /**
     * Abonnement à utiliser pour le prochain envoi :
     * - manuel : celui choisi s'il est présent, sinon l'abonnement par défaut ;
     * - auto : rotation tous les LOT_ROTATION envois (compteur persistant).
     * Retourne INVALID_SUBSCRIPTION_ID si indéterminé (= défaut système).
     */
    suspend fun resoudreAbonnementId(context: Context): Int {
        val cartes = listerSims(context)
        if (cartes.isEmpty()) return SubscriptionManager.INVALID_SUBSCRIPTION_ID
        if (PreferencesAppareil.obtenirModeSim(context) == "manual") {
            val voulu = PreferencesAppareil.obtenirSouscriptionSim(context)
            cartes.firstOrNull { it.abonnementId == voulu }?.let { return it.abonnementId }
            return SubscriptionManager.INVALID_SUBSCRIPTION_ID
        }
        val compteur = PreferencesAppareil.obtenirCompteurSim(context)
        val index = ((compteur / LOT_ROTATION) % cartes.size + cartes.size) % cartes.size
        return cartes[index].abonnementId
    }

    /** À appeler après chaque tentative d'envoi (succès ou échec). */
    suspend fun noterEnvoi(context: Context) {
        PreferencesAppareil.obtenirEtIncrementerCompteurSim(context)
    }
}
