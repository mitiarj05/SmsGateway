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
import com.mitia.smsgateway.ui.components.LigneInfo
import com.mitia.smsgateway.ui.components.CarteKpi
import com.mitia.smsgateway.ui.components.CarteStatut
import com.mitia.smsgateway.ui.theme.BleuAccent
import com.mitia.smsgateway.ui.theme.VertAccent
import com.mitia.smsgateway.ui.theme.FondCarte
import com.mitia.smsgateway.ui.theme.FondSombre
import com.mitia.smsgateway.ui.theme.TexteAttenue
import com.mitia.smsgateway.ui.theme.TextePrincipal

@Composable
fun EcranStatut(
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
    texteDerniereSynchro: String,
    auDemarrageService: () -> Unit,
    aArretService: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(FondSombre)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
    ) {
        // En-tête : appareil + état
        Row(verticalAlignment = Alignment.CenterVertically) {
            Surface(
                color = BleuAccent.copy(alpha = 0.15f),
                shape = RoundedCornerShape(14.dp),
            ) {
                Icon(
                    imageVector = Icons.Filled.Smartphone,
                    contentDescription = null,
                    tint = BleuAccent,
                    modifier = Modifier
                        .padding(10.dp)
                        .size(22.dp),
                )
            }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = nomAppareil.ifBlank { "sms gateway" },
                    color = TextePrincipal,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = if (estEnLigne) "connecté au serveur" else "hors ligne",
                    color = TexteAttenue,
                    fontSize = 12.sp,
                )
            }
            Surface(
                color = (if (estEnLigne) VertAccent else TexteAttenue).copy(alpha = 0.15f),
                shape = RoundedCornerShape(8.dp),
            ) {
                Text(
                    text = if (estEnLigne) "en ligne" else "hors ligne",
                    color = if (estEnLigne) VertAccent else TexteAttenue,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                )
            }
        }
        Spacer(Modifier.height(4.dp))
        Text(
            text = "dernière sync · $texteDerniereSynchro",
            color = TexteAttenue,
            fontSize = 11.sp,
        )
        Spacer(Modifier.height(16.dp))

        // Carte statut + service
        CarteStatut(
            estEnLigne = estEnLigne,
            sousTitre = if (serviceActif) "service actif en arrière-plan" else "service arrêté",
        )
        Spacer(Modifier.height(12.dp))

        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = FondCarte,
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
                        color = TextePrincipal,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Text(
                        text = if (serviceActif) "scrutation toutes les 30 s" else "à l'arrêt — aucun envoi",
                        color = TexteAttenue,
                        fontSize = 12.sp,
                    )
                }
                if (serviceActif) {
                    OutlinedButton(onClick = aArretService) {
                        Text("arrêter")
                    }
                } else {
                    Button(onClick = auDemarrageService) {
                        Text("démarrer")
                    }
                }
            }
        }
        Spacer(Modifier.height(12.dp))

        // Grille 2x2
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            CarteKpi(
                valeur = smsEnvoyesAujourdhui.toString(),
                etiquette = "sms envoyés aujourd'hui",
                icone = Icons.Filled.Send,
                modifier = Modifier.weight(1f),
            )
            CarteKpi(
                valeur = smsEnAttente.toString(),
                etiquette = "en file d'attente",
                icone = Icons.Filled.Inbox,
                modifier = Modifier.weight(1f),
            )
        }
        Spacer(Modifier.height(12.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            CarteKpi(
                valeur = reseau.lowercase(),
                etiquette = "réseau · " + if (reseau == "Hors ligne" || reseau == "Inconnu") "pas de signal" else "signal fort",
                icone = when (reseau) {
                    "WiFi" -> Icons.Filled.Wifi
                    "Données mobiles" -> Icons.Filled.SignalCellularAlt
                    else -> Icons.Filled.CloudOff
                },
                modifier = Modifier.weight(1f),
            )
            CarteKpi(
                valeur = if (pourcentageBatterie >= 0) "$pourcentageBatterie%" else "—",
                etiquette = "batterie · " + if (batterieEnCharge) "en charge" else "sur batterie",
                icone = when {
                    pourcentageBatterie < 0 -> Icons.Filled.BatteryUnknown
                    batterieEnCharge -> Icons.Filled.BatteryChargingFull
                    pourcentageBatterie <= 15 -> Icons.Filled.BatteryAlert
                    else -> Icons.Filled.BatteryFull
                },
                modifier = Modifier.weight(1f),
            )
        }
        Spacer(Modifier.height(12.dp))

        // Carte quota
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = FondCarte,
            shape = RoundedCornerShape(16.dp),
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Text("quota sms (heure)", color = TexteAttenue, fontSize = 12.sp)
                    Text(
                        "$quotaSmsUtilise / $quotaSmsTotal",
                        color = TextePrincipal,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                    )
                }
                Spacer(Modifier.height(10.dp))
                LinearProgressIndicator(
                    progress = {
                        if (quotaSmsTotal > 0) quotaSmsUtilise.toFloat() / quotaSmsTotal else 0f
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(6.dp)
                        .clip(RoundedCornerShape(3.dp)),
                    color = BleuAccent,
                    trackColor = Color(0xFF1E2433),
                )
                Spacer(Modifier.height(10.dp))
                Text(
                    "la file ralentit automatiquement au-delà du quota",
                    color = TexteAttenue,
                    fontSize = 11.sp,
                )
            }
        }
        Spacer(Modifier.height(12.dp))

        // Carte notification
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = FondCarte,
            shape = RoundedCornerShape(16.dp),
        ) {
            LigneInfo(
                icone = if (serviceActif) Icons.Filled.PlayArrow else Icons.Filled.Stop,
                texte = "notification permanente activée — le système ne peut pas tuer l'app",
                modifier = Modifier.padding(16.dp),
            )
        }
    }
}
