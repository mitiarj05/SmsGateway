package com.mitia.smsgateway.ui.views

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.SubscriptionManager
import android.telephony.TelephonyManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.SignalCellularAlt
import androidx.compose.material.icons.filled.SimCard
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.mitia.smsgateway.data.local.DevicePreferences
import com.mitia.smsgateway.data.local.EventLog
import com.mitia.smsgateway.data.remote.ApiClient
import com.mitia.smsgateway.data.sms.SimInfo
import com.mitia.smsgateway.data.sms.SimManager
import com.mitia.smsgateway.data.sms.SmsSender
import com.mitia.smsgateway.ui.theme.AccentBlue
import com.mitia.smsgateway.ui.theme.AccentGreen
import com.mitia.smsgateway.ui.theme.AccentRed
import com.mitia.smsgateway.ui.theme.BorderColor
import com.mitia.smsgateway.ui.theme.CardBg
import com.mitia.smsgateway.ui.theme.DarkBg
import com.mitia.smsgateway.ui.theme.TextMuted
import com.mitia.smsgateway.ui.theme.TextPrimary
import kotlinx.coroutines.launch

/**
 * Diagnostic terrain : test SIM manuel (sans serveur), ping latence,
 * multi-SIM et réseau avancé. Autonome (charge ses propres données).
 */
@Composable
fun DiagScreen(modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    // Test SIM manuel
    var testNumero by remember { mutableStateOf("") }
    var testMessage by remember { mutableStateOf("Test SMSIKA") }
    var testResult by remember { mutableStateOf<String?>(null) }
    var testing by remember { mutableStateOf(false) }
    var hasSmsPerm by remember { mutableStateOf(false) }

    // Ping
    var latency by remember { mutableStateOf<Long?>(null) }
    var pinging by remember { mutableStateOf(false) }

    // SIM
    var simMode by remember { mutableStateOf("auto") }
    var simSubId by remember { mutableStateOf(-1) }
    var sims by remember { mutableStateOf(emptyList<SimInfo>()) }
    var slots by remember { mutableStateOf(1) }
    var hasPhonePerm by remember { mutableStateOf(false) }

    // Réseau avancé
    var netDetail by remember { mutableStateOf("—") }
    var mccMnc by remember { mutableStateOf("—") }
    var dbm by remember { mutableStateOf<Int?>(null) }
    var operatorName by remember { mutableStateOf("—") }

    fun refreshSims() {
        sims = SimManager.listSims(context)
        slots = SimManager.slotCount(context)
    }

    fun refreshNetwork() {
        try {
            val tm = context.getSystemService(TelephonyManager::class.java)
            if (tm == null) {
                netDetail = "—"; mccMnc = "—"; dbm = null; operatorName = "—"
                return
            }
            netDetail = networkDetailText(tm)
            dbm = signalDbm(tm)
            val (op, code) = operatorAndMccMnc(context, tm)
            operatorName = op
            mccMnc = code
        } catch (_: Exception) {
            netDetail = "—"; mccMnc = "—"; dbm = null; operatorName = "—"
        }
    }

    fun refreshAll() {
        hasSmsPerm = ContextCompat.checkSelfPermission(
            context, Manifest.permission.SEND_SMS
        ) == PackageManager.PERMISSION_GRANTED
        hasPhonePerm = ContextCompat.checkSelfPermission(
            context, Manifest.permission.READ_PHONE_STATE
        ) == PackageManager.PERMISSION_GRANTED
        scope.launch {
            simMode = DevicePreferences.getSimMode(context)
            simSubId = DevicePreferences.getSimSubId(context)
            refreshSims()
            refreshNetwork()
        }
    }

    val smsLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        hasSmsPerm = granted
    }
    val phoneLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        hasPhonePerm = granted
        if (granted) {
            scope.launch {
                refreshSims()
                refreshNetwork()
            }
        }
    }

    LaunchedEffect(Unit) { refreshAll() }

    fun sendLocalTest() {
        if (testNumero.isBlank() || testMessage.isBlank()) {
            testResult = "Numéro et message requis."
            return
        }
        if (!hasSmsPerm) {
            smsLauncher.launch(Manifest.permission.SEND_SMS)
            testResult = "Permission SMS demandée, réessaie."
            return
        }
        testing = true
        testResult = null
        scope.launch {
            val subId = SimManager.resolveSubscriptionId(context)
            val ok = SmsSender.sendSms(context, testNumero.trim(), testMessage, subId)
            SimManager.noteSend(context)
            testResult = if (ok) "SMS accepté par la radio." else "Échec radio (crédit ? réseau ? SIM ?)."
            EventLog.log(context, "test local > ${testNumero.trim()} : ${if (ok) "OK" else "KO"}")
            testing = false
        }
    }

    fun ping() {
        pinging = true
        latency = null
        scope.launch {
            ApiClient.setBaseUrl(DevicePreferences.getServerUrl(context))
            latency = ApiClient.pingLatencyMs()
            pinging = false
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(DarkBg)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
    ) {
        Text(
            text = "diagnostic",
            color = TextPrimary,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
        )
        Text(
            text = "tests locaux, sans dépendre du serveur",
            color = TextMuted,
            fontSize = 12.sp,
        )
        Spacer(Modifier.height(16.dp))

        // ---- 1. Test SIM manuel ----
        DiagCard(
            title = "Test matériel SIM",
            icon = Icons.Filled.Send,
            subtitle = "SMS réel direct, hors serveur",
        ) {
            OutlinedTextField(
                value = testNumero,
                onValueChange = { testNumero = it },
                label = { Text("Numéro de test") },
                placeholder = { Text("+261…") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                colors = diagFieldColors(),
                shape = RoundedCornerShape(10.dp),
            )
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(
                value = testMessage,
                onValueChange = { testMessage = it },
                label = { Text("Message") },
                modifier = Modifier.fillMaxWidth(),
                colors = diagFieldColors(),
                shape = RoundedCornerShape(10.dp),
            )
            Spacer(Modifier.height(8.dp))
            Button(onClick = ::sendLocalTest, enabled = !testing, modifier = Modifier.fillMaxWidth()) {
                if (testing) CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                else Text("Envoyer le SMS de test")
            }
            if (testResult != null) {
                Spacer(Modifier.height(8.dp))
                Text(text = testResult!!, color = TextPrimary, fontSize = 13.sp)
            }
        }
        Spacer(Modifier.height(12.dp))

        // ---- 2. Ping serveur ----
        DiagCard(
            title = "Ping serveur",
            icon = Icons.Filled.Speed,
            subtitle = "latence aller-retour HTTPS",
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = when {
                        pinging -> "mesure…"
                        latency == null -> "—"
                        latency!! < 0 -> "injoignable"
                        else -> "${latency} ms"
                    },
                    color = TextPrimary,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.weight(1f),
                )
                OutlinedButton(onClick = ::ping, enabled = !pinging) {
                    Text("mesurer")
                }
            }
        }
        Spacer(Modifier.height(12.dp))

        // ---- 3. Multi-SIM ----
        DiagCard(
            title = "Multi-SIM",
            icon = Icons.Filled.SimCard,
            subtitle = "$slots emplacement(s) · rotation tous les ${SimManager.ROTATION_BATCH} envois",
        ) {
            if (!hasPhonePerm) {
                Text(
                    text = "Autorise l'accès aux SIM pour voir et choisir les cartes.",
                    color = TextMuted,
                    fontSize = 12.sp,
                )
                Spacer(Modifier.height(8.dp))
                OutlinedButton(
                    onClick = { phoneLauncher.launch(Manifest.permission.READ_PHONE_STATE) },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("Autoriser l'accès SIM")
                }
            } else {
                if (sims.isEmpty()) {
                    Text(
                        text = "Aucune SIM active détectée.",
                        color = TextMuted,
                        fontSize = 13.sp,
                    )
                } else {
                    SimModeRow(
                        selected = simMode == "auto",
                        title = "Automatique",
                        subtitle = "alterne toutes les ${SimManager.ROTATION_BATCH} envois",
                        onClick = {
                            scope.launch {
                                DevicePreferences.saveSimMode(context, "auto")
                                simMode = "auto"
                            }
                        },
                    )
                    sims.forEach { sim ->
                        SimModeRow(
                            selected = simMode == "manual" && simSubId == sim.subscriptionId,
                            title = "SIM ${sim.slotIndex + 1} · ${sim.carrier}",
                            subtitle = sim.number ?: "numéro masqué",
                            onClick = {
                                scope.launch {
                                    DevicePreferences.saveSimMode(context, "manual")
                                    DevicePreferences.saveSimSubId(context, sim.subscriptionId)
                                    simMode = "manual"
                                    simSubId = sim.subscriptionId
                                }
                            },
                        )
                    }
                }
            }
        }
        Spacer(Modifier.height(12.dp))

        // ---- 4. Réseau avancé ----
        DiagCard(
            title = "Réseau avancé",
            icon = Icons.Filled.SignalCellularAlt,
            subtitle = "données techniques de maintenance",
        ) {
            NetRow(label = "Technologie", value = netDetail)
            NetRow(label = "Opérateur", value = operatorName)
            NetRow(label = "MCC / MNC", value = mccMnc)
            NetRow(label = "Signal", value = dbm?.let { "$it dBm" } ?: "—")
            Spacer(Modifier.height(8.dp))
            OutlinedButton(
                onClick = { refreshSims(); refreshNetwork() },
                modifier = Modifier.fillMaxWidth(),
            ) {
                Icon(Icons.Filled.Refresh, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text("Actualiser")
            }
        }
    }
}

@Composable
private fun DiagCard(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    subtitle: String,
    content: @Composable () -> Unit,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = CardBg,
        shape = RoundedCornerShape(16.dp),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(imageVector = icon, contentDescription = null, tint = AccentBlue)
                Spacer(Modifier.width(8.dp))
                Column {
                    Text(text = title, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    Text(text = subtitle, color = TextMuted, fontSize = 11.sp)
                }
            }
            Spacer(Modifier.height(12.dp))
            content()
        }
    }
}

@Composable
private fun SimModeRow(
    selected: Boolean,
    title: String,
    subtitle: String,
    onClick: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .selectable(selected = selected, role = Role.RadioButton, onClick = onClick)
            .padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        RadioButton(selected = selected, onClick = null)
        Spacer(Modifier.width(8.dp))
        Column {
            Text(text = title, color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
            Text(text = subtitle, color = TextMuted, fontSize = 11.sp)
        }
    }
}

@Composable
private fun NetRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(text = label, color = TextMuted, fontSize = 12.sp)
        Text(text = value, color = TextPrimary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
private fun diagFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedContainerColor = CardBg,
    unfocusedContainerColor = CardBg,
    focusedBorderColor = AccentBlue,
    unfocusedBorderColor = BorderColor,
    focusedTextColor = TextPrimary,
    unfocusedTextColor = TextPrimary,
    cursorColor = AccentBlue,
)

private fun networkDetailText(tm: TelephonyManager): String {
    return try {
        when (tm.dataNetworkType) {
            TelephonyManager.NETWORK_TYPE_NR -> "5G (NR)"
            TelephonyManager.NETWORK_TYPE_LTE -> "LTE (4G)"
            TelephonyManager.NETWORK_TYPE_HSPAP, TelephonyManager.NETWORK_TYPE_HSPA -> "HSPA+ (3G+)"
            TelephonyManager.NETWORK_TYPE_UMTS -> "UMTS (3G)"
            TelephonyManager.NETWORK_TYPE_EDGE, TelephonyManager.NETWORK_TYPE_GPRS -> "2G"
            TelephonyManager.NETWORK_TYPE_UNKNOWN -> "Inconnu"
            else -> "type ${tm.dataNetworkType}"
        }
    } catch (_: Exception) {
        "—"
    }
}

private fun operatorAndMccMnc(context: Context, tm: TelephonyManager): Pair<String, String> {
    return try {
        val sm = context.getSystemService(SubscriptionManager::class.java)
        @Suppress("MissingPermission")
        val info = sm?.activeSubscriptionInfoList?.firstOrNull()
        if (info != null) {
            val op = info.carrierName?.toString()?.takeIf { it.isNotBlank() } ?: "—"
            val code = "${info.mccString ?: "?"} / ${info.mncString ?: "?"}"
            return op to code
        }
        val raw = tm.networkOperator ?: return "—" to "—"
        if (raw.length >= 5) {
            val op = tm.networkOperatorName?.takeIf { it.isNotBlank() } ?: "—"
            op to "${raw.substring(0, 3)} / ${raw.substring(3)}"
        } else {
            "—" to "—"
        }
    } catch (_: Exception) {
        "—" to "—"
    }
}

private fun signalDbm(tm: TelephonyManager): Int? {
    return try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            tm.signalStrength?.cellSignalStrengths?.firstOrNull()?.dbm
        } else {
            null
        }
    } catch (_: Exception) {
        null
    }
}
