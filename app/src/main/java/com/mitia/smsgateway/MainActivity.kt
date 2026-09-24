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
import com.mitia.smsgateway.service.ServicePasserelleSms
import com.mitia.smsgateway.ui.NavigationApp
import com.mitia.smsgateway.ui.views.EcranIntegration
import com.mitia.smsgateway.ui.views.EcranDemarrage
import com.mitia.smsgateway.ui.infosBatterie
import com.mitia.smsgateway.ui.batterieSansRestriction
import com.mitia.smsgateway.ui.serviceEnCoursExecution
import com.mitia.smsgateway.ui.typeReseau
import com.mitia.smsgateway.ui.theme.ThemePasserelleSms
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    /** Incrémenté à chaque retour de demande de permission → rafraîchit l'écran. */
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
            ThemePasserelleSms {
                EcranPrincipal(
                    compteurPermissions = compteurPermissions,
                    aDemanderPermissionSms = {
                        demandePermissionSms.launch(Manifest.permission.SEND_SMS)
                    },
                    aDemanderPermissionNotifications = {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                            demandePermissionNotifications.launch(Manifest.permission.POST_NOTIFICATIONS)
                        }
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

    private fun demarrerServicePasserelle() {        val intention = Intent(this, ServicePasserelleSms::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intention)
        } else {
            startService(intention)
        }
    }

    /**
     * Déconnexion propre : prévient le serveur (statut HORS_LIGNE immédiat),
     * puis coupe le foreground service. Les identifiants sont conservés :
     * redémarrer réutilise le même appareil.
     */
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
            lanceurExportDocument.launch("smsika-journal.txt")
        }
    }
}

@Composable
fun EcranPrincipal(
    modifier: Modifier = Modifier,
    compteurPermissions: Int = 0,
    aDemanderPermissionSms: () -> Unit = {},
    aDemanderPermissionNotifications: () -> Unit = {},
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
    var pret by remember { mutableStateOf(false) }
    var integrationTerminee by remember { mutableStateOf(true) }

    val historique by conteneur.depotTaches.observerHistorique().collectAsState(initial = emptyList())
    val evenements by conteneur.depotJournaux.observer().collectAsState(initial = emptyList())

    fun actualiser() {
        permissionSms = ContextCompat.checkSelfPermission(
            context, Manifest.permission.SEND_SMS
        ) == PackageManager.PERMISSION_GRANTED
        permissionNotifications = Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            ContextCompat.checkSelfPermission(
                context, Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
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
            pret = true
        }
    }

    LaunchedEffect(Unit) {
        // Chargement initial uniquement : ensuite les champs gardent la frappe.
        portee.launch {
            urlServeur = conteneur.depotAppareils.obtenirUrlServeur()
            nomAppareil = conteneur.depotAppareils.obtenirNomAppareil()
            jetonAppareil = conteneur.depotAppareils.obtenirIdentifiants()?.second
            integrationTerminee = conteneur.depotAppareils.estIntegrationTerminee()
        }
        actualiser()
    }
    LaunchedEffect(compteurPermissions) { if (compteurPermissions > 0) actualiser() }
    // Rafraîchit en continu tant que l'app est ouverte : l'écran Statut
    // passe en ligne tout seul après démarrage (sans rouvrir l'app).
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
    } else if (!integrationTerminee) {
        EcranIntegration(
            urlServeur = urlServeur,
            auChangementUrlServeur = { urlServeur = it; messageParametres = "" },
            message = messageParametres,
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
            aTerminer = {
                portee.launch {
                    conteneur.depotAppareils.marquerIntegrationTerminee(true)
                    integrationTerminee = true
                    auDemarrageService()
                }
            },
            modifier = modifier,
        )
    } else {
    NavigationApp(
        modifier = modifier,
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
        aArretService = {
            aArretService()
            actualiser()
        },
        taches = historique,
        derniereSynchro = derniereSynchro,
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
                // On ne réécrit pas le champ : il garde la frappe, le message
                // affiche la forme normalisée réellement enregistrée.
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
            aArretService()
            messageParametres = "Service arrêté : l'appareil n'envoie plus de SMS."
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
