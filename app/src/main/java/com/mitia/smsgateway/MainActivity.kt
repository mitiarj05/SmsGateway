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
import com.mitia.smsgateway.service.SmsGatewayService
import com.mitia.smsgateway.ui.AppNavigation
import com.mitia.smsgateway.ui.batteryInfo
import com.mitia.smsgateway.ui.isBatteryUnrestricted
import com.mitia.smsgateway.ui.isServiceRunning
import com.mitia.smsgateway.ui.networkType
import com.mitia.smsgateway.ui.theme.SmsGatewayTheme
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    /** Incrémenté à chaque retour de demande de permission → rafraîchit l'écran. */
    private var permissionTick by mutableStateOf(0)

    private var pendingExport: String? = null

    private val requestSendSmsPermission = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        Log.d("MainActivity", "Permission SEND_SMS accordée=$granted")
        permissionTick++
    }

    private val requestNotifPermission = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        Log.d("MainActivity", "Permission POST_NOTIFICATIONS accordée=$granted")
        permissionTick++
    }

    private val exportDocLauncher = registerForActivityResult(
        ActivityResultContracts.CreateDocument("text/plain")
    ) { uri ->
        if (uri == null) return@registerForActivityResult
        val text = pendingExport ?: return@registerForActivityResult
        try {
            contentResolver.openOutputStream(uri)?.use { it.write(text.toByteArray()) }
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
            requestSendSmsPermission.launch(Manifest.permission.SEND_SMS)
        }
        enableEdgeToEdge()
        setContent {
            SmsGatewayTheme {
                MainScreen(
                    permissionTick = permissionTick,
                    onRequestSmsPermission = {
                        requestSendSmsPermission.launch(Manifest.permission.SEND_SMS)
                    },
                    onRequestNotifPermission = {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                            requestNotifPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
                        }
                    },
                    onStartServiceClick = { startSmsGatewayService() },
                    onStopServiceClick = { disconnectAndStop() },
                    onExportJournal = { exportJournal() }
                )
            }
        }
    }

    private fun startSmsGatewayService() {
        val intent = Intent(this, SmsGatewayService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
    }

    /**
     * Déconnexion propre : prévient le serveur (statut OFFLINE immédiat),
     * puis coupe le foreground service. Les identifiants sont conservés :
     * redémarrer réutilise le même device.
     */
    private fun disconnectAndStop() {
        lifecycleScope.launch {
            val container = (application as SmsGatewayApp).appContainer
            val creds = container.deviceRepository.getCredentials()
            var signaled = false
            if (creds != null) {
                signaled = container.deviceRepository.disconnect(creds.first, creds.second)
                Log.d("MainActivity", "Signalement offline au serveur : $signaled")
                container.logRepository.log(
                    if (signaled) "signalement offline ok"
                    else "signalement offline impossible, sweep 90s"
                )
            } else {
                container.logRepository.log("déconnexion sans identifiants (rien à signaler)")
            }
            stopService(Intent(this@MainActivity, SmsGatewayService::class.java))
            permissionTick++
            Toast.makeText(
                this@MainActivity,
                if (signaled) "Déconnecté : serveur prévenu (OFFLINE immédiat)."
                else "Service arrêté : le serveur marquera OFFLINE sous 90 s.",
                Toast.LENGTH_LONG
            ).show()
        }
    }

    private fun exportJournal() {
        lifecycleScope.launch {
            val logs = (application as SmsGatewayApp).appContainer.logRepository
            val events = logs.snapshot()
            if (events.isEmpty()) {
                Toast.makeText(this@MainActivity, "Journal vide.", Toast.LENGTH_SHORT).show()
                return@launch
            }
            pendingExport = logs.toText(events)
            exportDocLauncher.launch("smsgateway-journal.txt")
        }
    }
}

@Composable
fun MainScreen(
    modifier: Modifier = Modifier,
    permissionTick: Int = 0,
    onRequestSmsPermission: () -> Unit = {},
    onRequestNotifPermission: () -> Unit = {},
    onStartServiceClick: () -> Unit = {},
    onStopServiceClick: () -> Unit = {},
    onExportJournal: () -> Unit = {},
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val container = remember(context) {
        (context.applicationContext as SmsGatewayApp).appContainer
    }

    var serverUrl by remember { mutableStateOf("") }
    var deviceName by remember { mutableStateOf("") }
    var deviceToken by remember { mutableStateOf<String?>(null) }
    var serviceRunning by remember { mutableStateOf(false) }
    var hasSmsPerm by remember { mutableStateOf(false) }
    var hasNotifPerm by remember { mutableStateOf(false) }
    var batteryOk by remember { mutableStateOf(false) }
    var batteryPercent by remember { mutableStateOf(-1) }
    var batteryCharging by remember { mutableStateOf(false) }
    var netType by remember { mutableStateOf("…") }
    var lastSync by remember { mutableStateOf(0L) }
    var lastCount by remember { mutableStateOf(0) }
    var sentToday by remember { mutableStateOf(0) }
    var quota by remember { mutableStateOf(20) }
    var quotaUsage by remember { mutableStateOf(0) }
    var settingsMessage by remember { mutableStateOf("") }

    val history by container.taskRepository.observeHistory().collectAsState(initial = emptyList())
    val events by container.logRepository.observe().collectAsState(initial = emptyList())

    fun refresh() {
        hasSmsPerm = ContextCompat.checkSelfPermission(
            context, Manifest.permission.SEND_SMS
        ) == PackageManager.PERMISSION_GRANTED
        hasNotifPerm = Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            ContextCompat.checkSelfPermission(
                context, Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        batteryOk = isBatteryUnrestricted(context)
        val batt = batteryInfo(context)
        batteryPercent = batt.percent
        batteryCharging = batt.charging
        netType = networkType(context)
        serviceRunning = isServiceRunning(context)
        scope.launch {
            val (sync, count) = container.deviceRepository.loadSync()
            lastSync = sync
            lastCount = count
            sentToday = container.taskRepository.countSentToday()
            val (q, u) = container.deviceRepository.loadQuotaSnapshot()
            quota = q
            quotaUsage = u
        }
    }

    LaunchedEffect(Unit) {
        // Chargement initial uniquement : ensuite les champs gardent la frappe.
        scope.launch {
            serverUrl = container.deviceRepository.getServerUrl()
            deviceName = container.deviceRepository.getDeviceName()
            deviceToken = container.deviceRepository.getCredentials()?.second
        }
        refresh()
    }
    LaunchedEffect(permissionTick) { if (permissionTick > 0) refresh() }
    // Rafraîchit en continu tant que l'app est ouverte : l'écran Statut
    // passe en ligne tout seul après démarrage (sans rouvrir l'app).
    LaunchedEffect(Unit) {
        while (true) {
            kotlinx.coroutines.delay(5000)
            refresh()
        }
    }

    val connected = serviceRunning && lastSync > 0 &&
        System.currentTimeMillis() - lastSync < 90_000

    AppNavigation(
        modifier = modifier,
        deviceName = deviceName,
        isOnline = connected,
        serviceRunning = serviceRunning,
        smsSentToday = sentToday,
        smsPending = lastCount,
        network = netType,
        batteryPercent = batteryPercent,
        batteryCharging = batteryCharging,
        smsQuotaUsed = quotaUsage,
        smsQuotaTotal = quota,
        onStartService = {
            onStartServiceClick()
            scope.launch {
                kotlinx.coroutines.delay(1000)
                refresh()
            }
        },
        tasks = history,
        lastSync = lastSync,
        events = events,
        onExportLog = onExportJournal,
        onClearLog = {
            scope.launch { container.logRepository.clear() }
        },
        serverUrl = serverUrl,
        onServerUrlChange = { serverUrl = it; settingsMessage = "" },
        deviceToken = deviceToken,
        onDeviceNameChange = { deviceName = it; settingsMessage = "" },
        settingsMessage = settingsMessage,
        onSaveServer = {
            scope.launch {
                if (serverUrl.isBlank()) {
                    settingsMessage = "Renseigne l'adresse du serveur."
                    return@launch
                }
                // On ne réécrit pas le champ : il garde la frappe, le message
                // affiche la forme normalisée réellement enregistrée.
                val normalized = container.deviceRepository.saveServerUrl(serverUrl)
                settingsMessage = "Adresse enregistrée : $normalized"
                refresh()
            }
        },
        onTestConnection = {
            scope.launch {
                if (serverUrl.isBlank()) {
                    settingsMessage = "Renseigne l'adresse du serveur."
                    return@launch
                }
                settingsMessage = if (container.deviceRepository.ping(serverUrl)) {
                    "Serveur joignable : $serverUrl"
                } else {
                    "Serveur injoignable : vérifie l'IP et que « npm run dev » tourne."
                }
            }
        },
        onSaveName = {
            scope.launch {
                val clean = deviceName.trim()
                if (clean.isEmpty()) {
                    settingsMessage = "Donne un nom à l'appareil."
                    return@launch
                }
                container.deviceRepository.saveDeviceName(clean)
                deviceName = clean
                settingsMessage = "Nom enregistré : $clean (appliqué au prochain enregistrement)"
            }
        },
        onResetDevice = {
            scope.launch {
                container.deviceRepository.clearCredentials()
                deviceToken = null
                settingsMessage = "Appareil réinitialisé : redémarre le service pour le ré-enregistrer."
                refresh()
            }
        },
        onDisconnect = {
            onStopServiceClick()
            settingsMessage = "Service arrêté : l'appareil n'envoie plus de SMS."
        },
        hasSmsPerm = hasSmsPerm,
        hasNotifPerm = hasNotifPerm,
        batteryOk = batteryOk,
        onRequestSmsPermission = onRequestSmsPermission,
        onRequestNotifPermission = onRequestNotifPermission,
        onOpenBatterySettings = {
            try {
                context.startActivity(
                    Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
                )
            } catch (e: Exception) {
                settingsMessage = "Impossible d'ouvrir les réglages batterie."
            }
        },
    )
}

@Preview(showBackground = true)
@Composable
fun MainScreenPreview() {
    SmsGatewayTheme {
        MainScreen()
    }
}
