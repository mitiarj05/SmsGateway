package com.mitia.smsgateway.controller

import android.util.Log
import com.mitia.smsgateway.domain.model.ResultatStatut
import com.mitia.smsgateway.domain.model.Statuts
import com.mitia.smsgateway.domain.repository.DepotJournaux
import com.mitia.smsgateway.domain.repository.DepotTaches

/**
 * Remonte au serveur les accusés de réception RÉSEAU (DLR) reçus de la radio.
 *
 * Appelé à chaque cycle de scrutation, juste après le rejeu des confirmations
 * d'envoi. Le récepteur de broadcast ne fait aucun réseau : il empile, ce
 * contrôleur dépile — l'accusé survit donc à une coupure WiFi comme à un
 * redémarrage du téléphone.
 */
class ControleurLivraisons(
    private val taches: DepotTaches,
    private val journaux: DepotJournaux
) {

    private val etiquette = "ControleurLivraisons"

    suspend fun remonterAccuses(appareilId: String, jeton: String) {
        // Purge d'abord : beaucoup d'opérateurs n'émettent aucun accusé, la file
        // ne doit pas grossir indéfiniment avec des entrées jamais abouties.
        val purges = taches.purgerAccusesExpires()
        if (purges > 0) {
            journaux.journaliser("$purges accusé(s) réseau expiré(s) abandonné(s)")
        }

        val enAttente = taches.chargerAccusesEnAttente()
        if (enAttente.isEmpty()) return

        Log.d(etiquette, "${enAttente.size} accusé(s) réseau à remonter")

        for (accuse in enAttente) {
            val resultat = taches.signalerLivraison(
                appareilId, jeton, accuse.tacheId, accuse.livraison, accuse.code
            )
            when (resultat) {
                is ResultatStatut.Succes, is ResultatStatut.DejaConfirme -> {
                    taches.retirerAccuseEnAttente(accuse.tacheId)
                    taches.enregistrerLivraison(accuse.tacheId, accuse.livraison)
                    journaux.journaliser(
                        if (accuse.livraison == Statuts.LIVRE) {
                            "accusé réseau : livré"
                        } else {
                            "accusé réseau : non livré"
                        }
                    )
                }
                is ResultatStatut.AssigneAUnAutre, is ResultatStatut.ConflitFinalise -> {
                    // Verdict définitif côté serveur : rejouer ne servirait à rien.
                    taches.retirerAccuseEnAttente(accuse.tacheId)
                }
                is ResultatStatut.ErreurHttp -> {
                    if (resultat.code == 404) {
                        // Tâche supprimée côté serveur : l'accusé n'ira nulle part.
                        taches.retirerAccuseEnAttente(accuse.tacheId)
                    } else {
                        Log.w(etiquette, "Accusé ${accuse.tacheId} refusé (HTTP ${resultat.code}), conservé")
                    }
                }
                is ResultatStatut.ErreurReseau -> {
                    // Coupure : on garde en file pour le prochain cycle.
                    Log.w(etiquette, "Coupure réseau : accusé ${accuse.tacheId} reporté")
                }
            }
        }
    }
}
