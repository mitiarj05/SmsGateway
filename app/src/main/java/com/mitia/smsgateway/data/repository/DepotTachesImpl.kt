package com.mitia.smsgateway.data.repository

import android.content.Context
import com.mitia.smsgateway.data.local.MagasinConfirmationsEnAttente
import com.mitia.smsgateway.data.local.MagasinHistoriqueTaches
import com.mitia.smsgateway.data.remote.ClientApi
import com.mitia.smsgateway.domain.model.TacheHistorique
import com.mitia.smsgateway.domain.model.ConfirmationEnAttente
import com.mitia.smsgateway.domain.model.ResultatStatut
import com.mitia.smsgateway.domain.model.TacheDto
import com.mitia.smsgateway.domain.model.ResultatTaches
import com.mitia.smsgateway.domain.repository.DepotTaches
import kotlinx.coroutines.flow.Flow

class DepotTachesImpl(private val context: Context) : DepotTaches {

    override suspend fun recupererTaches(appareilId: String, jeton: String): ResultatTaches =
        ClientApi.obtenirTachesDetaillees(appareilId, jeton)

    override suspend fun mettreAJourStatutDetaille(
        appareilId: String,
        jeton: String,
        tacheId: String,
        statut: String,
        messageErreur: String?
    ): ResultatStatut =
        ClientApi.mettreAJourStatutTacheDetaille(appareilId, jeton, tacheId, statut, messageErreur)

    override suspend fun confirmerAvecReessai(
        appareilId: String,
        jeton: String,
        tacheId: String,
        statut: String,
        messageErreur: String?
    ): Boolean =
        ClientApi.confirmerAvecReessai(appareilId, jeton, tacheId, statut, messageErreur)

    override suspend fun enregistrerRecues(taches: List<TacheDto>) =
        MagasinHistoriqueTaches.insererOuMettreAJourRecues(context, taches)

    override suspend fun enregistrerStatut(tacheId: String, statut: String, erreur: String?) =
        MagasinHistoriqueTaches.mettreAJourStatut(context, tacheId, statut, erreur)

    override fun observerHistorique(): Flow<List<TacheHistorique>> =
        MagasinHistoriqueTaches.observer(context)

    override suspend fun compterEnvoyesAujourdhui(): Int =
        MagasinHistoriqueTaches.compterEnvoyesAujourdhui(context)

    override suspend fun chargerConfirmationsEnAttente(): List<ConfirmationEnAttente> =
        MagasinConfirmationsEnAttente.chargerTout(context).map {
            ConfirmationEnAttente(it.tacheId, it.statut, it.messageErreur)
        }

    override suspend fun ajouterConfirmationEnAttente(tacheId: String, statut: String, messageErreur: String?) =
        MagasinConfirmationsEnAttente.ajouter(context, tacheId, statut, messageErreur)

    override suspend fun retirerConfirmationEnAttente(tacheId: String) =
        MagasinConfirmationsEnAttente.retirer(context, tacheId)
}
