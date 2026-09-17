package com.mitia.smsgateway.ui.views

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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BatteryAlert
import androidx.compose.material.icons.filled.BatteryChargingFull
import androidx.compose.material.icons.filled.BatteryFull
import androidx.compose.material.icons.filled.BatteryUnknown
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.Inbox
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.SignalCellularAlt
import androidx.compose.material.icons.filled.Smartphone
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material.icons.filled.WifiOff
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mitia.smsgateway.ui.components.InfoLine
import com.mitia.smsgateway.ui.components.KpiCard
import com.mitia.smsgateway.ui.components.StatusCard
import com.mitia.smsgateway.ui.theme.AccentBlue
import com.mitia.smsgateway.ui.theme.AccentGreen
import com.mitia.smsgateway.ui.theme.CardBg
import com.mitia.smsgateway.ui.theme.DarkBg
import com.mitia.smsgateway.ui.theme.TextMuted
import com.mitia.smsgateway.ui.theme.TextPrimary

@Composable
fun StatusScreen(
    deviceName: String,
    isOnline: Boolean,
    serviceRunning: Boolean,
    smsSentToday: Int,
    smsPending: Int,
    network: String,
    batteryPercent: Int,
    batteryCharging: Boolean,
    smsQuotaUsed: Int,
    smsQuotaTotal: Int,
    lastSyncText: String,
    onStartService: () -> Unit,
    onStopService: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(DarkBg)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
    ) {
        // En-tête : appareil + état
        Row(verticalAlignment = Alignment.CenterVertically) {
            Surface(
                color = AccentBlue.copy(alpha = 0.15f),
                shape = RoundedCornerShape(14.dp),
            ) {
                Icon(
                    imageVector = Icons.Filled.Smartphone,
                    contentDescription = null,
                    tint = AccentBlue,
                    modifier = Modifier
                        .padding(10.dp)
                        .size(22.dp),
                )
            }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = deviceName.ifBlank { "sms gateway" },
                    color = TextPrimary,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = if (isOnline) "connecté au serveur" else "hors ligne",
                    color = TextMuted,
                    fontSize = 12.sp,
                )
            }
            Surface(
                color = (if (isOnline) AccentGreen else TextMuted).copy(alpha = 0.15f),
                shape = RoundedCornerShape(8.dp),
            ) {
                Text(
                    text = if (isOnline) "en ligne" else "hors ligne",
                    color = if (isOnline) AccentGreen else TextMuted,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                )
            }
        }
        Spacer(Modifier.height(4.dp))
        Text(
            text = "dernière sync · $lastSyncText",
            color = TextMuted,
            fontSize = 11.sp,
        )
        Spacer(Modifier.height(16.dp))

        // Carte statut + service
        StatusCard(
            isOnline = isOnline,
            subtitle = if (serviceRunning) "service actif en arrière-plan" else "service arrêté",
        )
        Spacer(Modifier.height(12.dp))

        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = CardBg,
            shape = RoundedCornerShape(16.dp),
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "service d'envoi",
                        color = TextPrimary,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Text(
                        text = if (serviceRunning) "polling toutes les 30 s" else "à l'arrêt — aucun envoi",
                        color = TextMuted,
                        fontSize = 12.sp,
                    )
                }
                if (serviceRunning) {
                    OutlinedButton(onClick = onStopService) {
                        Text("arrêter")
                    }
                } else {
                    Button(onClick = onStartService) {
                        Text("démarrer")
                    }
                }
            }
        }
        Spacer(Modifier.height(12.dp))

        // Grille 2x2
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            KpiCard(
                value = smsSentToday.toString(),
                label = "sms envoyés aujourd'hui",
                icon = Icons.Filled.Send,
                modifier = Modifier.weight(1f),
            )
            KpiCard(
                value = smsPending.toString(),
                label = "en file d'attente",
                icon = Icons.Filled.Inbox,
                modifier = Modifier.weight(1f),
            )
        }
        Spacer(Modifier.height(12.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            KpiCard(
                value = network.lowercase(),
                label = "réseau · " + if (network == "Hors ligne" || network == "Inconnu") "pas de signal" else "signal fort",
                icon = when (network) {
                    "WiFi" -> Icons.Filled.Wifi
                    "Données mobiles" -> Icons.Filled.SignalCellularAlt
                    else -> Icons.Filled.CloudOff
                },
                modifier = Modifier.weight(1f),
            )
            KpiCard(
                value = if (batteryPercent >= 0) "$batteryPercent%" else "—",
                label = "batterie · " + if (batteryCharging) "en charge" else "sur batterie",
                icon = when {
                    batteryPercent < 0 -> Icons.Filled.BatteryUnknown
                    batteryCharging -> Icons.Filled.BatteryChargingFull
                    batteryPercent <= 15 -> Icons.Filled.BatteryAlert
                    else -> Icons.Filled.BatteryFull
                },
                modifier = Modifier.weight(1f),
            )
        }
        Spacer(Modifier.height(12.dp))

        // Carte quota
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = CardBg,
            shape = RoundedCornerShape(16.dp),
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Text("quota sms (heure)", color = TextMuted, fontSize = 12.sp)
                    Text(
                        "$smsQuotaUsed / $smsQuotaTotal",
                        color = TextPrimary,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                    )
                }
                Spacer(Modifier.height(10.dp))
                LinearProgressIndicator(
                    progress = {
                        if (smsQuotaTotal > 0) smsQuotaUsed.toFloat() / smsQuotaTotal else 0f
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(6.dp)
                        .clip(RoundedCornerShape(3.dp)),
                    color = AccentBlue,
                    trackColor = Color(0xFF1E2433),
                )
                Spacer(Modifier.height(10.dp))
                Text(
                    "la file ralentit automatiquement au-delà du quota",
                    color = TextMuted,
                    fontSize = 11.sp,
                )
            }
        }
        Spacer(Modifier.height(12.dp))

        // Carte notification
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = CardBg,
            shape = RoundedCornerShape(16.dp),
        ) {
            InfoLine(
                icon = if (serviceRunning) Icons.Filled.PlayArrow else Icons.Filled.Stop,
                text = "notification permanente activée — le système ne peut pas tuer l'app",
                modifier = Modifier.padding(16.dp),
            )
        }
    }
}
