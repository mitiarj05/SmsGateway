package com.mitia.smsgateway.data.repository

import android.content.Context
import com.mitia.smsgateway.data.local.PreferencesAppareil
import com.mitia.smsgateway.data.remote.ClientApi
import com.mitia.smsgateway.domain.model.QuotaDto
import com.mitia.smsgateway.domain.model.ResultatQuota
import com.mitia.smsgateway.domain.model.ResultatEnregistrement
import com.mitia.smsgateway.domain.repository.DepotAppareils

class DepotAppareilsImpl(private val context: Context) : DepotAppareils {

    override suspend fun obtenirIdentifiants(): Pair<String, String>? =
        PreferencesAppareil.charger(context)

    override suspend fun enregistrerIdentifiants(appareilId: String, jeton: String) =
        PreferencesAppareil.enregistrer(context, appareilId, jeton)

    override suspend fun effacerIdentifiants() =
        PreferencesAppareil.effacer(context)

    override suspend fun obtenirUrlServeur(): String {
        ClientApi.definirUrlBase(PreferencesAppareil.obtenirUrlServeur(context))
        return ClientApi.urlBase
    }

    override suspend fun enregistrerUrlServeur(url: String): String {
        PreferencesAppareil.enregistrerUrlServeur(context, url)
        return obtenirUrlServeur()
    }

    override suspend fun pingerServeur(): Boolean {
        ClientApi.definirUrlBase(PreferencesAppareil.obtenirUrlServeur(context))
        return ClientApi.pingerServeur()
    }

    override suspend fun ping(url: String): Boolean {
        ClientApi.definirUrlBase(url)
        return ClientApi.pingerServeur()
    }

    override suspend fun obtenirNomAppareil(): String =
        PreferencesAppareil.obtenirNomAppareil(context)

    override suspend fun enregistrerNomAppareil(nom: String) =
        PreferencesAppareil.enregistrerNomAppareil(context, nom)

    override suspend fun enregistrer(nomAppareil: String, jetonId: String): ResultatEnregistrement {
        ClientApi.definirUrlBase(PreferencesAppareil.obtenirUrlServeur(context))
        return ClientApi.enregistrerAppareil(nomAppareil, jetonId)
    }

    override suspend fun deconnecter(appareilId: String, jeton: String): Boolean {
        ClientApi.definirUrlBase(PreferencesAppareil.obtenirUrlServeur(context))
        return ClientApi.deconnecter(appareilId, jeton)
    }

    override suspend fun mettreAJourJetonFcm(appareilId: String, jeton: String, jetonFcm: String): Boolean =
        ClientApi.mettreAJourJetonFcm(appareilId, jeton, jetonFcm)

    override suspend fun obtenirQuota(appareilId: String, jeton: String): QuotaDto? =
        when (val r = ClientApi.obtenirQuotaDetaille(appareilId, jeton)) {
            is ResultatQuota.Succes -> r.quota
            ResultatQuota.ErreurReseau -> null
        }

    override suspend fun enregistrerSynchro(horodatage: Long, compteur: Int) =
        PreferencesAppareil.enregistrerSynchro(context, horodatage, compteur)

    override suspend fun chargerSynchro(): Pair<Long, Int> =
        PreferencesAppareil.chargerSynchro(context)

    override suspend fun enregistrerInstantaneQuota(quota: Int, usage: Int) =
        PreferencesAppareil.enregistrerInstantaneQuota(context, quota, usage)

    override suspend fun chargerInstantaneQuota(): Pair<Int, Int> =
        PreferencesAppareil.chargerInstantaneQuota(context)

    override suspend fun estIntegrationTerminee(): Boolean =
        PreferencesAppareil.estIntegrationTerminee(context)

    override suspend fun marquerIntegrationTerminee(terminee: Boolean) =
        PreferencesAppareil.marquerIntegrationTerminee(context, terminee)
}
