package com.mitia.smsgateway.data.sms

import android.content.Context
import android.telephony.SubscriptionInfo
import android.telephony.SubscriptionManager
import android.telephony.TelephonyManager
import android.util.Log
import com.mitia.smsgateway.data.local.DevicePreferences

data class SimInfo(
    val subscriptionId: Int,
    val slotIndex: Int,
    val carrier: String,
    val number: String?
)

/**
 * Gestion multi-SIM : détection, choix manuel ou rotation automatique
 * (tous les ROTATION_BATCH envois) pour répartir la charge opérateur.
 */
object SimManager {

    const val ROTATION_BATCH = 10
    private const val TAG = "SimManager"

    /** SIM actives (nécessite READ_PHONE_STATE sur versions récentes, sinon liste vide). */
    fun listSims(context: Context): List<SimInfo> {
        return try {
            val sm = context.getSystemService(SubscriptionManager::class.java)
                ?: return emptyList()
            @Suppress("MissingPermission")
            val infos: List<SubscriptionInfo> =
                sm.activeSubscriptionInfoList ?: return emptyList()
            infos.map {
                SimInfo(
                    subscriptionId = it.subscriptionId,
                    slotIndex = it.simSlotIndex,
                    carrier = it.carrierName?.toString()?.takeIf { n -> n.isNotBlank() } ?: "Opérateur inconnu",
                    number = it.number?.takeIf { n -> n.isNotBlank() }
                )
            }.sortedBy { it.slotIndex }
        } catch (e: Exception) {
            Log.w(TAG, "Liste SIM illisible (permission ?)", e)
            emptyList()
        }
    }

    /** Nombre d'emplacements physiques (sans permission). */
    fun slotCount(context: Context): Int {
        return try {
            context.getSystemService(TelephonyManager::class.java)?.phoneCount ?: 1
        } catch (e: Exception) {
            Log.w(TAG, "phoneCount illisible", e)
            1
        }
    }

    /**
     * Abonnement à utiliser pour le prochain envoi :
     * - manuel : celui choisi s'il est présent, sinon l'abonnement par défaut ;
     * - auto : rotation tous les ROTATION_BATCH envois (compteur persistant).
     * Retourne INVALID_SUBSCRIPTION_ID si indéterminé (= défaut système).
     */
    suspend fun resolveSubscriptionId(context: Context): Int {
        val sims = listSims(context)
        if (sims.isEmpty()) return SubscriptionManager.INVALID_SUBSCRIPTION_ID
        if (DevicePreferences.getSimMode(context) == "manual") {
            val wanted = DevicePreferences.getSimSubId(context)
            sims.firstOrNull { it.subscriptionId == wanted }?.let { return it.subscriptionId }
            return SubscriptionManager.INVALID_SUBSCRIPTION_ID
        }
        val counter = DevicePreferences.getSimCounter(context)
        val idx = ((counter / ROTATION_BATCH) % sims.size + sims.size) % sims.size
        return sims[idx].subscriptionId
    }

    /** À appeler après chaque tentative d'envoi (succès ou échec). */
    suspend fun noteSend(context: Context) {
        DevicePreferences.getAndIncrementSimCounter(context)
    }
}
