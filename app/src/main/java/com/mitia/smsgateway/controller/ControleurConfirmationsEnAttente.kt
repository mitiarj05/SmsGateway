package com.mitia.smsgateway.controller

import android.util.Log
import com.mitia.smsgateway.domain.repository.DepotTaches

/**
 * Rejoue les confirmations persistées (file anti-doublon).
 * Appelé à chaque cycle de scrutation, avant de traiter les nouvelles tâches.
 */
class ControleurConfirmationsEnAttente(
    private val taches: DepotTaches
) {

    private val etiquette = "ControleurConfirmationsEnAttente"

    suspend fun rejouerConfirmationsEnAttente(appareilId: String, jeton: String) {
        val enAttente = taches.chargerConfirmationsEnAttente()

        Log.d(etiquette, "${enAttente.size} confirmation(s) en attente, rejeu...")
        for (entree in enAttente) {
            val confirme = taches.confirmerAvecReessai(
                appareilId, jeton, entree.tacheId, entree.statut, entree.messageErreur
            )
            if (confirme) {
                taches.retirerConfirmationEnAttente(entree.tacheId)
            }
        }
    }
}
