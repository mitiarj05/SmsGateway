package com.mitia.smsgateway

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.util.Log
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.tooling.preview.Preview
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.google.firebase.auth.FirebaseAuth
import com.mitia.smsgateway.controller.ControleurSoldeSim
import com.mitia.smsgateway.data.local.MagasinUssd
import com.mitia.smsgateway.data.local.PreferencesAppareil
import com.mitia.smsgateway.data.sms.AnnuaireUssd
import com.mitia.smsgateway.data.sms.ExecuteurUssd
import com.mitia.smsgateway.data.sms.GestionnaireSim
import com.mitia.smsgateway.domain.model.CarteUssd
import com.mitia.smsgateway.service.ServicePasserelleSms
import com.mitia.smsgateway.ui.NavigationApp
import com.mitia.smsgateway.ui.views.EcranDemarrage
import com.mitia.smsgateway.ui.views.EcranOnboarding
import com.mitia.smsgateway.ui.views.EcranConnexion
import com.mitia.smsgateway.ui.infosBatterie
import com.mitia.smsgateway.ui.batterieSansRestriction
import com.mitia.smsgateway.ui.serviceEnCoursExecution
import com.mitia.smsgateway.ui.typeReseau
import com.mitia.smsgateway.ui.theme.ThemePasserelleSms
import com.mitia.smsgateway.widget.RenduWidgetPasserelle
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private var compteurPermissions by mutableStateOf(0)
    private var exportEnAttente: String? = null

    private val demandePermissionSms = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { accorde ->
        Log.d("MainActivity", "Permission SEND_SMS accordée=$accorde")
        compteurPermissions++
    }

    private val demandePermissionNotifications = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { accorde ->
        Log.d("MainActivity", "Permission POST_NOTIFICATIONS accordée=$accorde")
        compteurPermissions++
    }

    private val demandePermissionReceptionSms = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { accorde ->
        Log.d("MainActivity", "Permission RECEIVE_SMS accordée=$accorde")
        compteurPermissions++
    }

    /**
     * Permission exigée par TelephonyManager.sendUssdRequest depuis l'API 26
     * (relevé du solde de la SIM). Ce n'est pas un accès aux appels : l'app ne
     * compose jamais de numéro.
     */
    private val demandePermissionTelephone = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { accorde ->
        Log.d("MainActivity", "Permission CALL_PHONE accordée=$accorde")
        compteurPermissions++
    }

    private val lanceurExportDocument = registerForActivityResult(
        ActivityResultContracts.CreateDocument("text/plain")
    ) { uri ->
        if (uri == null) return@registerForActivityResult
        val texte = exportEnAttente ?: return@registerForActivityResult
        try {
            contentResolver.openOutputStream(uri)?.use { it.write(texte.toByteArray()) }
            Toast.makeText(this, "Journal exporté.", Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            Log.w("MainActivity", "Export journal impossible", e)
            Toast.makeText(this, "Export impossible.", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (ContextCompat.checkSelfPermission(
                this, Manifest.permission.SEND_SMS
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            demandePermissionSms.launch(Manifest.permission.SEND_SMS)
        }
        if (ContextCompat.checkSelfPermission(
                this, Manifest.permission.RECEIVE_SMS
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            demandePermissionReceptionSms.launch(Manifest.permission.RECEIVE_SMS)
        }
        enableEdgeToEdge()
        setContent {
            val context = LocalContext.current
            val portee = rememberCoroutineScope()
            var themeSombre by remember { mutableStateOf(false) }

            LaunchedEffect(Unit) {
                themeSombre = PreferencesAppareil.estThemeSombre(context)
            }

            ThemePasserelleSms(themeSombre = themeSombre) {
                EcranPrincipal(
                    compteurPermissions = compteurPermissions,
                    themeSombre = themeSombre,
                    auChangementTheme = {
                        val nouveau = !themeSombre
                        themeSombre = nouveau
                        portee.launch {
                            PreferencesAppareil.enregistrerThemeSombre(context, nouveau)
                        }
                        // Le widget d'accueil suit le thème : sans cela il
                        // garderait l'ancien rendu jusqu'au cycle suivant.
                        RenduWidgetPasserelle.rafraichirEnArrierePlan(context)
                    },
                    aDemanderPermissionSms = {
                        demandePermissionSms.launch(Manifest.permission.SEND_SMS)
                    },
                    aDemanderPermissionNotifications = {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                            demandePermissionNotifications.launch(Manifest.permission.POST_NOTIFICATIONS)
                        }
                    },
                    aDemanderPermissionTelephone = {
                        demandePermissionTelephone.launch(Manifest.permission.CALL_PHONE)
                    },
                    auDemarrageService = { demarrerServicePasserelle() },
                    aArretService = { deconnecterEtArreter() },
                    auRedemarrageService = {
                        stopService(Intent(this, ServicePasserelleSms::class.java))
                        demarrerServicePasserelle()
                    },
                    aExporterJournal = { exporterJournal() }
                )
            }
        }
    }

    private fun demarrerServicePasserelle() {
        val intention = Intent(this, ServicePasserelleSms::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intention)
        } else {
            startService(intention)
        }
    }

    private fun deconnecterEtArreter() {
        lifecycleScope.launch {
            val conteneur = (application as AppPasserelleSms).conteneurApp
            val identifiants = conteneur.depotAppareils.obtenirIdentifiants()
            var signale = false
            if (identifiants != null) {
                signale = conteneur.depotAppareils.deconnecter(identifiants.first, identifiants.second)
                Log.d("MainActivity", "Signalement offline au serveur : $signale")
                conteneur.depotJournaux.journaliser(
                    if (signale) "signalement offline ok"
                    else "signalement offline impossible, sweep 90s"
                )
            } else {
                conteneur.depotJournaux.journaliser("déconnexion sans identifiants (rien à signaler)")
            }
            stopService(Intent(this@MainActivity, ServicePasserelleSms::class.java))
            compteurPermissions++
            Toast.makeText(
                this@MainActivity,
                if (signale) "Déconnecté : serveur prévenu (HORS_LIGNE immédiat)."
                else "Service arrêté : le serveur marquera HORS_LIGNE sous 90 s.",
                Toast.LENGTH_LONG
            ).show()
        }
    }

    private fun exporterJournal() {
        lifecycleScope.launch {
            val journaux = (application as AppPasserelleSms).conteneurApp.depotJournaux
            val evenements = journaux.instantane()
            if (evenements.isEmpty()) {
                Toast.makeText(this@MainActivity, "Journal vide.", Toast.LENGTH_SHORT).show()
                return@launch
            }
            exportEnAttente = journaux.versTexte(evenements)
            lanceurExportDocument.launch("smstsika-journal.txt")
        }
    }
}

@Composable
fun EcranPrincipal(
    modifier: Modifier = Modifier,
    compteurPermissions: Int = 0,
    themeSombre: Boolean = false,
    auChangementTheme: () -> Unit = {},
    aDemanderPermissionSms: () -> Unit = {},
    aDemanderPermissionNotifications: () -> Unit = {},
    aDemanderPermissionTelephone: () -> Unit = {},
    auDemarrageService: () -> Unit = {},
    aArretService: () -> Unit = {},
    auRedemarrageService: () -> Unit = {},
    aExporterJournal: () -> Unit = {},
) {
    val context = LocalContext.current
    val portee = rememberCoroutineScope()
    val conteneur = remember(context) {
        (context.applicationContext as AppPasserelleSms).conteneurApp
    }

    var urlServeur by remember { mutableStateOf("") }
    var nomAppareil by remember { mutableStateOf("") }
    var jetonAppareil by remember { mutableStateOf<String?>(null) }
    var serviceActif by remember { mutableStateOf(false) }
    var permissionSms by remember { mutableStateOf(false) }
    var permissionNotifications by remember { mutableStateOf(false) }
    var batterieOk by remember { mutableStateOf(false) }
    var pourcentageBatterie by remember { mutableStateOf(-1) }
    var batterieEnCharge by remember { mutableStateOf(false) }
    var reseau by remember { mutableStateOf("…") }
    var derniereSynchro by remember { mutableStateOf(0L) }
    var dernierCompteur by remember { mutableStateOf(0) }
    var envoyesAujourdhui by remember { mutableStateOf(0) }
    var quota by remember { mutableStateOf(20) }
    var usageQuota by remember { mutableStateOf(0) }
    var messageParametres by remember { mutableStateOf("") }
    var cadenceEnvoiMs by remember { mutableStateOf(PreferencesAppareil.CADENCE_ENVOI_DEFAUT_MS) }
    var demarrageAuto by remember { mutableStateOf(true) }
    var accuseLivraison by remember { mutableStateOf(true) }
    // Solde de la SIM : tout est PAR CARTE (chaque opérateur a son propre code,
    // donc son propre relevé). L'écran Diagnostic affiche une ligne par carte,
    // chacune portant son code, son relevé et son bouton de vérification.
    var cartesUssd by remember { mutableStateOf<List<CarteUssd>>(emptyList()) }
    var verificationSoldeAuto by remember { mutableStateOf(true) }
    var relevageSoldeEnCours by remember { mutableStateOf<Int?>(null) }
    var messagesSolde by remember { mutableStateOf<Map<Int, String>>(emptyMap()) }
    var permissionTelephone by remember { mutableStateOf(false) }
    var pret by remember { mutableStateOf(false) }

    // États du flux d'accueil
    var onboardingVu by remember { mutableStateOf(false) }
    var connecteSession by remember { mutableStateOf(false) }
    var affichageConnexionForcee by remember { mutableStateOf(false) }

    val historique by conteneur.depotTaches.observerHistorique().collectAsState(initial = emptyList())
    val evenements by conteneur.depotJournaux.observer().collectAsState(initial = emptyList())

    /**
     * Codes et relevés de toutes les cartes, relus depuis le stockage.
     *
     * Déclaré AVANT `actualiser()` : une fonction locale doit être connue avant
     * son premier appel.
     *
     * Le stockage reste la seule vérité : ce que l'écran Diagnostic enregistre
     * pour une carte se retrouve ici au rafraîchissement suivant.
     */
    suspend fun chargerCartesUssd(): List<CarteUssd> {
        val sims = GestionnaireSim.listerSims(context)
        if (sims.isEmpty()) {
            // Sans la permission téléphone, la liste des cartes est vide : les
            // relevés déjà connus restent consultables (tableau de bord).
            return MagasinUssd.obtenirSoldes(context).map { releve ->
                CarteUssd(
                    souscriptionId = releve.souscriptionId,
                    emplacement = 0,
                    operateur = "",
                    numero = null,
                    code = MagasinUssd.obtenirCode(context, releve.souscriptionId) ?: "",
                    solde = releve
                )
            }
        }
        return sims.map { sim ->
            CarteUssd(
                souscriptionId = sim.abonnementId,
                emplacement = sim.indexEmplacement + 1,
                operateur = sim.operateur,
                numero = sim.numero,
                code = MagasinUssd.obtenirCode(context, sim.abonnementId) ?: "",
                solde = MagasinUssd.obtenirSolde(context, sim.abonnementId),
                suggestions = AnnuaireUssd.suggestions(sim.operateur)
            )
        }
    }

    fun actualiser() {
        permissionSms = ContextCompat.checkSelfPermission(
            context, Manifest.permission.SEND_SMS
        ) == PackageManager.PERMISSION_GRANTED
        permissionNotifications = Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            ContextCompat.checkSelfPermission(
                context, Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        permissionTelephone = ExecuteurUssd.permissionTelephoneAccordee(context)
        batterieOk = batterieSansRestriction(context)
        val batterie = infosBatterie(context)
        pourcentageBatterie = batterie.pourcentage
        batterieEnCharge = batterie.enCharge
        reseau = typeReseau(context)
        serviceActif = serviceEnCoursExecution(context)
        portee.launch {
            val (synchro, compteur) = conteneur.depotAppareils.chargerSynchro()
            derniereSynchro = synchro
            dernierCompteur = compteur
            envoyesAujourdhui = conteneur.depotTaches.compterEnvoyesAujourdhui()
            val (quotaLu, usageLu) = conteneur.depotAppareils.chargerInstantaneQuota()
            quota = quotaLu
            usageQuota = usageLu
            // Les relevés peuvent changer sans passer par cet écran (SMS de
            // l'opérateur lu en arrière-plan, vérification quotidienne) : on les
            // relit à chaque rafraîchissement. Le code en cours de saisie n'est
            // jamais écrasé, l'écran Diagnostic gardant son brouillon à part.
            cartesUssd = chargerCartesUssd()
            pret = true
        }
    }

    LaunchedEffect(Unit) {
        portee.launch {
            urlServeur = conteneur.depotAppareils.obtenirUrlServeur()
            nomAppareil = conteneur.depotAppareils.obtenirNomAppareil()
            jetonAppareil = conteneur.depotAppareils.obtenirIdentifiants()?.second
            conteneur.depotAppareils.marquerIntegrationTerminee(true)
            onboardingVu = PreferencesAppareil.estOnboardingVu(context)
            connecteSession = PreferencesAppareil.estConnecteSession(context)
            cadenceEnvoiMs = PreferencesAppareil.obtenirCadenceEnvoiMs(context)
            demarrageAuto = PreferencesAppareil.estDemarrageAuto(context)
            accuseLivraison = PreferencesAppareil.estAccuseLivraisonActif(context)
        }
        verificationSoldeAuto = MagasinUssd.estVerificationAutoActive(context)
        actualiser()
        // Le widget peut dater d'un service disparu : l'ouverture de l'app est
        // l'occasion de le remettre à l'heure sans attendre le cycle suivant.
        RenduWidgetPasserelle.rafraichirEnArrierePlan(context)
    }

    LaunchedEffect(compteurPermissions) { if (compteurPermissions > 0) actualiser() }

    LaunchedEffect(Unit) {
        while (true) {
            kotlinx.coroutines.delay(5000)
            actualiser()
        }
    }

    val connecte = serviceActif && derniereSynchro > 0 &&
        System.currentTimeMillis() - derniereSynchro < 90_000

    if (!pret) {
        EcranDemarrage(modifier = modifier)
    } else if (!onboardingVu) {
        EcranOnboarding(
            aTerminer = {
                portee.launch {
                    PreferencesAppareil.enregistrerOnboardingVu(context, true)
                    onboardingVu = true
                }
            },
            aOuvrirConnexion = {
                portee.launch {
                    PreferencesAppareil.enregistrerOnboardingVu(context, true)
                    onboardingVu = true
                    affichageConnexionForcee = true
                }
            },
            modifier = modifier,
        )
    } else if (!connecteSession || affichageConnexionForcee) {
        EcranConnexion(
            aConnexionReussie = {
                portee.launch {
                    PreferencesAppareil.enregistrerConnecteSession(context, true)
                    connecteSession = true
                    affichageConnexionForcee = false
                    auDemarrageService()
                }
            },
            modifier = modifier,
        )
    } else {
        NavigationApp(
            modifier = modifier,
            themeSombre = themeSombre,
            auChangementTheme = auChangementTheme,
            cadenceEnvoiMs = cadenceEnvoiMs,
            auChangementCadence = { valeur ->
                cadenceEnvoiMs = valeur
                portee.launch {
                    PreferencesAppareil.enregistrerCadenceEnvoiMs(context, valeur)
                }
            },
            demarrageAuto = demarrageAuto,
            auChangementDemarrageAuto = { valeur ->
                demarrageAuto = valeur
                portee.launch {
                    PreferencesAppareil.enregistrerDemarrageAuto(context, valeur)
                }
            },
            accuseLivraison = accuseLivraison,
            auChangementAccuseLivraison = { valeur ->
                accuseLivraison = valeur
                portee.launch {
                    PreferencesAppareil.enregistrerAccuseLivraison(context, valeur)
                }
            },
            cartesUssd = cartesUssd,
            verificationSoldeAuto = verificationSoldeAuto,
            auChangementVerificationSoldeAuto = { actif ->
                verificationSoldeAuto = actif
                portee.launch {
                    MagasinUssd.enregistrerVerificationAutoActive(context, actif)
                }
            },
            relevageSoldeEnCours = relevageSoldeEnCours,
            messagesSolde = messagesSolde,
            permissionUssd = permissionTelephone,
            aDemanderPermissionUssd = aDemanderPermissionTelephone,
            aEnregistrerCodeUssd = { souscriptionId, code ->
                portee.launch {
                    MagasinUssd.enregistrerCode(context, souscriptionId, code)
                    cartesUssd = chargerCartesUssd()
                    messagesSolde = messagesSolde + (souscriptionId to if (code.isBlank()) {
                        "Code effacé : plus aucune vérification pour cette carte."
                    } else {
                        "Code enregistré pour cette carte."
                    })
                }
            },
            aVerifierSolde = { souscriptionId ->
                portee.launch {
                    relevageSoldeEnCours = souscriptionId
                    messagesSolde = messagesSolde - souscriptionId
                    try {
                        val identifiants = conteneur.depotAppareils.obtenirIdentifiants()
                        val resultat = conteneur.controleurSoldeSim.verifierSolde(
                            context,
                            identifiants?.first,
                            identifiants?.second,
                            souscriptionId
                        )
                        messagesSolde = messagesSolde + (souscriptionId to when (resultat) {
                            is ControleurSoldeSim.Resultat.Releve -> "Solde relevé auprès de l'opérateur."
                            is ControleurSoldeSim.Resultat.Echec -> resultat.message
                        })
                    } finally {
                        relevageSoldeEnCours = null
                        cartesUssd = chargerCartesUssd()
                    }
                }
            },
            nomAppareil = nomAppareil,
            estEnLigne = connecte,
            serviceActif = serviceActif,
            smsEnvoyesAujourdhui = envoyesAujourdhui,
            smsEnAttente = dernierCompteur,
            reseau = reseau,
            pourcentageBatterie = pourcentageBatterie,
            batterieEnCharge = batterieEnCharge,
            quotaSmsUtilise = usageQuota,
            quotaSmsTotal = quota,
            auDemarrageService = {
                auDemarrageService()
                portee.launch {
                    kotlinx.coroutines.delay(1000)
                    actualiser()
                }
            },
            aActualiserStatut = { actualiser() },
            aArretService = {
                aArretService()
                actualiser()
            },
            taches = historique,
            derniereSynchro = derniereSynchro,
            aViderTaches = {
                portee.launch { com.mitia.smsgateway.data.local.MagasinHistoriqueTaches.effacer(context) }
            },
            evenements = evenements,
            aExporterJournal = aExporterJournal,
            aViderJournal = {
                portee.launch { conteneur.depotJournaux.effacer() }
            },
            urlServeur = urlServeur,
            auChangementUrlServeur = { urlServeur = it; messageParametres = "" },
            jetonAppareil = jetonAppareil,
            auChangementNomAppareil = { nomAppareil = it; messageParametres = "" },
            messageParametres = messageParametres,
            aEnregistrerServeur = {
                portee.launch {
                    if (urlServeur.isBlank()) {
                        messageParametres = "Renseigne l'adresse du serveur."
                        return@launch
                    }
                    val normalise = conteneur.depotAppareils.enregistrerUrlServeur(urlServeur)
                    messageParametres = "Adresse enregistrée : $normalise"
                    actualiser()
                }
            },
            aTesterConnexion = {
                portee.launch {
                    if (urlServeur.isBlank()) {
                        messageParametres = "Renseigne l'adresse du serveur."
                        return@launch
                    }
                    messageParametres = if (conteneur.depotAppareils.ping(urlServeur)) {
                        "Serveur joignable : $urlServeur"
                    } else {
                        "Serveur injoignable : vérifie l'IP et que « npm run dev » tourne."
                    }
                }
            },
            aEnregistrerNom = {
                portee.launch {
                    val nettoye = nomAppareil.trim()
                    if (nettoye.isEmpty()) {
                        messageParametres = "Donne un nom à l'appareil."
                        return@launch
                    }
                    conteneur.depotAppareils.enregistrerNomAppareil(nettoye)
                    nomAppareil = nettoye
                    messageParametres = "Nom enregistré : $nettoye (appliqué au prochain enregistrement)"
                }
            },
            aReinitialiserAppareil = {
                portee.launch {
                    conteneur.depotAppareils.effacerIdentifiants()
                    jetonAppareil = null
                    messageParametres = "Appareil réinitialisé : redémarre le service pour le ré-enregistrer."
                    actualiser()
                }
            },
            aDeconnecter = {
                // Déconnexion complète du téléphone : serveur prévenu + service
                // arrêté (aArretService) + session Firebase fermée + retour au login.
                aArretService()
                try {
                    FirebaseAuth.getInstance().signOut()
                } catch (_: Exception) {
                }
                portee.launch {
                    PreferencesAppareil.enregistrerConnecteSession(context, false)
                }
                connecteSession = false
                affichageConnexionForcee = false
                messageParametres = "Téléphone déconnecté : service arrêté, session fermée."
            },
            permissionSms = permissionSms,
            permissionNotifications = permissionNotifications,
            batterieOk = batterieOk,
            aDemanderPermissionSms = aDemanderPermissionSms,
            aDemanderPermissionNotifications = aDemanderPermissionNotifications,
            aOuvrirReglagesBatterie = {
                try {
                    context.startActivity(
                        Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
                    )
                } catch (e: Exception) {
                    messageParametres = "Impossible d'ouvrir les réglages batterie."
                }
            },
        )
    }
}

@Preview(showBackground = true)
@Composable
fun ApercuEcranPrincipal() {
    ThemePasserelleSms {
        EcranPrincipal()
    }
}
