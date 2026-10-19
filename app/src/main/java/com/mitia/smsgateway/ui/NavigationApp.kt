package com.mitia.smsgateway.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.mitia.smsgateway.domain.model.ElementEvenement
import com.mitia.smsgateway.domain.model.SoldeSim
import com.mitia.smsgateway.domain.model.TacheHistorique
import com.mitia.smsgateway.domain.model.Statuts
import com.mitia.smsgateway.ui.components.BarreNavigationBasse
import com.mitia.smsgateway.ui.components.OngletTableauDeBord
import com.mitia.smsgateway.ui.components.NiveauJournal
import com.mitia.smsgateway.ui.components.niveauJournalDe
import com.mitia.smsgateway.ui.views.EcranDiagnostic
import com.mitia.smsgateway.ui.views.EcranJournal
import com.mitia.smsgateway.ui.views.EcranParametres
import com.mitia.smsgateway.ui.views.EcranStats
import com.mitia.smsgateway.ui.views.EcranStatut
import com.mitia.smsgateway.ui.views.EcranTaches

/**
 * Conteneur des 6 écrans avec navigation basse.
 * Toute la donnée vient de MainActivity (temps réel) : aucun mock ici.
 */
@Composable
fun NavigationApp(
    // Statut
    nomAppareil: String,
    estEnLigne: Boolean,
    serviceActif: Boolean,
    smsEnvoyesAujourdhui: Int,
    smsEnAttente: Int,
    reseau: String,
    pourcentageBatterie: Int,
    batterieEnCharge: Boolean,
    quotaSmsUtilise: Int,
    quotaSmsTotal: Int,
    auDemarrageService: () -> Unit,
    aArretService: () -> Unit,
    aActualiserStatut: () -> Unit = {},
    // Tâches
    taches: List<TacheHistorique>,
    derniereSynchro: Long,
    aViderTaches: () -> Unit,
    // Journal
    evenements: List<ElementEvenement>,
    aExporterJournal: () -> Unit,
    aViderJournal: () -> Unit,
    // Réglages
    urlServeur: String,
    auChangementUrlServeur: (String) -> Unit,
    jetonAppareil: String?,
    auChangementNomAppareil: (String) -> Unit,
    messageParametres: String,
    aEnregistrerServeur: () -> Unit,
    aTesterConnexion: () -> Unit,
    aEnregistrerNom: () -> Unit,
    aReinitialiserAppareil: () -> Unit,
    aDeconnecter: () -> Unit,
    permissionSms: Boolean,
    permissionNotifications: Boolean,
    batterieOk: Boolean,
    aDemanderPermissionSms: () -> Unit,
    aDemanderPermissionNotifications: () -> Unit,
    aOuvrirReglagesBatterie: () -> Unit,
    themeSombre: Boolean = true,
    auChangementTheme: () -> Unit = {},
    cadenceEnvoiMs: Int = 0,
    auChangementCadence: (Int) -> Unit = {},
    demarrageAuto: Boolean = true,
    auChangementDemarrageAuto: (Boolean) -> Unit = {},
    accuseLivraison: Boolean = true,
    auChangementAccuseLivraison: (Boolean) -> Unit = {},
    // Solde de la SIM (réglages + dernier relevé)
    codeUssdSolde: String = "",
    auChangementCodeUssdSolde: (String) -> Unit = {},
    aEnregistrerCodeUssdSolde: () -> Unit = {},
    aVerifierSolde: () -> Unit = {},
    relevageSoldeEnCours: Boolean = false,
    messageSolde: String = "",
    soldeSim: SoldeSim? = null,
    operateurSim: String = "",
    suggestionsUssd: List<String> = emptyList(),
    verificationSoldeAuto: Boolean = true,
    auChangementVerificationSoldeAuto: (Boolean) -> Unit = {},
    permissionTelephone: Boolean = false,
    aDemanderPermissionTelephone: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    var onglet by remember { mutableStateOf(OngletTableauDeBord.STATUT) }

    val compteurEnAttente = taches.count { it.statut == Statuts.EN_ATTENTE || it.statut == Statuts.RECLAME }
    val compteurErreurs = evenements.count { niveauJournalDe(it.message) == NiveauJournal.ERREUR }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            BarreNavigationBasse(
                selectionne = onglet,
                auChoix = { onglet = it },
                pastilles = mapOf(
                    OngletTableauDeBord.TACHES to compteurEnAttente,
                    OngletTableauDeBord.JOURNAL to compteurErreurs,
                ),
            )
        },
    ) { innerPadding ->
        Box(
            modifier = modifier
                .fillMaxSize()
                .padding(innerPadding),
        ) {
            when (onglet) {
                OngletTableauDeBord.STATUT -> EcranStatut(
                    nomAppareil = nomAppareil,
                    estEnLigne = estEnLigne,
                    serviceActif = serviceActif,
                    smsEnvoyesAujourdhui = smsEnvoyesAujourdhui,
                    smsEnAttente = smsEnAttente,
                    reseau = reseau,
                    pourcentageBatterie = pourcentageBatterie,
                    batterieEnCharge = batterieEnCharge,
                    quotaSmsUtilise = quotaSmsUtilise,
                    quotaSmsTotal = quotaSmsTotal,
                    texteDerniereSynchro = texteTempsEcoule(derniereSynchro),
                    auDemarrageService = auDemarrageService,
                    aArretService = aArretService,
                    aActualiser = aActualiserStatut,
                    permissionSms = permissionSms,
                    themeSombre = themeSombre,
                    auChangementTheme = auChangementTheme,
                )
                OngletTableauDeBord.TACHES -> EcranTaches(
                    taches = taches,
                    texteDerniereSynchro = texteTempsEcoule(derniereSynchro),
                    aVider = aViderTaches,
                )
                OngletTableauDeBord.JOURNAL -> EcranJournal(
                    evenements = evenements,
                    aExporter = aExporterJournal,
                    aVider = aViderJournal,
                )
                OngletTableauDeBord.DIAGNOSTIC -> EcranDiagnostic()
                OngletTableauDeBord.STATS -> EcranStats()
                OngletTableauDeBord.REGLAGES -> EcranParametres(
                    urlServeur = urlServeur,
                    auChangementUrlServeur = auChangementUrlServeur,
                    jetonAppareil = jetonAppareil,
                    nomAppareil = nomAppareil,
                    auChangementNomAppareil = auChangementNomAppareil,
                    quota = quotaSmsTotal,
                    usageQuota = quotaSmsUtilise,
                    permissionSms = permissionSms,
                    permissionNotifications = permissionNotifications,
                    batterieOk = batterieOk,
                    message = messageParametres,
                    aEnregistrerServeur = aEnregistrerServeur,
                    aTesterConnexion = aTesterConnexion,
                    aEnregistrerNom = aEnregistrerNom,
                    aReinitialiserAppareil = aReinitialiserAppareil,
                    aDeconnecter = aDeconnecter,
                    aDemanderPermissionSms = aDemanderPermissionSms,
                    aDemanderPermissionNotifications = aDemanderPermissionNotifications,
                    aOuvrirReglagesBatterie = aOuvrirReglagesBatterie,
                    themeSombre = themeSombre,
                    auChangementTheme = auChangementTheme,
                    cadenceEnvoiMs = cadenceEnvoiMs,
                    auChangementCadence = auChangementCadence,
                    demarrageAuto = demarrageAuto,
                    auChangementDemarrageAuto = auChangementDemarrageAuto,
                    accuseLivraison = accuseLivraison,
                    auChangementAccuseLivraison = auChangementAccuseLivraison,
                    codeUssdSolde = codeUssdSolde,
                    auChangementCodeUssdSolde = auChangementCodeUssdSolde,
                    aEnregistrerCodeUssdSolde = aEnregistrerCodeUssdSolde,
                    aVerifierSolde = aVerifierSolde,
                    relevageSoldeEnCours = relevageSoldeEnCours,
                    messageSolde = messageSolde,
                    soldeSim = soldeSim,
                    operateurSim = operateurSim,
                    suggestionsUssd = suggestionsUssd,
                    verificationSoldeAuto = verificationSoldeAuto,
                    auChangementVerificationSoldeAuto = auChangementVerificationSoldeAuto,
                    permissionTelephone = permissionTelephone,
                    aDemanderPermissionTelephone = aDemanderPermissionTelephone,
                )
            }
        }
    }
}
