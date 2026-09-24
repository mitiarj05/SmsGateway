package com.mitia.smsgateway.di

import android.content.Context
import com.mitia.smsgateway.controller.ControleurAppareils
import com.mitia.smsgateway.controller.ControleurConfirmationsEnAttente
import com.mitia.smsgateway.controller.ControleurTaches
import com.mitia.smsgateway.data.repository.DepotAppareilsImpl
import com.mitia.smsgateway.data.repository.DepotJournauxImpl
import com.mitia.smsgateway.data.repository.DepotTachesImpl
import com.mitia.smsgateway.domain.repository.DepotAppareils
import com.mitia.smsgateway.domain.repository.DepotJournaux
import com.mitia.smsgateway.domain.repository.DepotTaches

/**
 * Conteneur d'injection manuelle (sans framework : les dépendances sont des
 * singletons explicites, remplaçables par Hilt/Koin plus tard sans toucher
 * aux couches métier).
 *
 * Obtenu via `(application as AppPasserelleSms).conteneurApp`.
 */
class ConteneurApp(context: Context) {

    private val contexteApp = context.applicationContext

    val depotAppareils: DepotAppareils = DepotAppareilsImpl(contexteApp)
    val depotTaches: DepotTaches = DepotTachesImpl(contexteApp)
    val depotJournaux: DepotJournaux = DepotJournauxImpl(contexteApp)

    val controleurAppareils = ControleurAppareils(depotAppareils, depotJournaux)
    val controleurTaches = ControleurTaches(depotTaches, depotJournaux)
    val controleurConfirmationsEnAttente = ControleurConfirmationsEnAttente(depotTaches)
}
