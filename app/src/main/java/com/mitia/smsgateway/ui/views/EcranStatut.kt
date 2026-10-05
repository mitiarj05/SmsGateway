package com.mitia.smsgateway.ui.views

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Message
import androidx.compose.material.icons.filled.BatteryChargingFull
import androidx.compose.material.icons.filled.BatteryFull
import androidx.compose.material.icons.filled.Inbox
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.filled.WifiOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
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
import com.mitia.smsgateway.ui.components.CarteKpi
import com.mitia.smsgateway.ui.theme.AmbreAccent
import com.mitia.smsgateway.ui.theme.BleuAccent
import com.mitia.smsgateway.ui.theme.RougeAccent
import com.mitia.smsgateway.ui.theme.VertAccent

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
    aActualiser: () -> Unit = {},
    permissionSms: Boolean = false,
    modifier: Modifier = Modifier,
    themeSombre: Boolean = true,
    auChangementTheme: () -> Unit = {},
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
    ) {
        // En-tête : Logo bleu + Statut + Bouton Rafraîchir
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Surface(
                color = BleuAccent,
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.size(44.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.Message,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(22.dp)
                    )
                }
            }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Statut",
                    color = MaterialTheme.colorScheme.onBackground,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = "Supervision de l'appareil",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 12.sp,
                )
            }

            Surface(
                color = MaterialTheme.colorScheme.surface,
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
            ) {
                IconButton(onClick = aActualiser, modifier = Modifier.size(38.dp)) {
                    Icon(
                        imageVector = Icons.Filled.Refresh,
                        contentDescription = "Rafraîchir",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }

        Spacer(Modifier.height(16.dp))

        // Banner Alert Card (Appareil hors ligne / en ligne)
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = if (estEnLigne) VertAccent.copy(alpha = 0.12f) else AmbreAccent.copy(alpha = 0.12f),
            shape = RoundedCornerShape(16.dp),
            border = androidx.compose.foundation.BorderStroke(
                1.dp,
                if (estEnLigne) VertAccent.copy(alpha = 0.3f) else AmbreAccent.copy(alpha = 0.3f)
            )
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(
                    imageVector = if (estEnLigne) Icons.Filled.VerifiedUser else Icons.Filled.Warning,
                    contentDescription = null,
                    tint = if (estEnLigne) VertAccent else AmbreAccent,
                    modifier = Modifier.size(22.dp)
                )
                Spacer(Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = if (estEnLigne) "Appareil en ligne" else "Appareil hors ligne",
                        color = MaterialTheme.colorScheme.onSurface,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        text = if (estEnLigne) "Prêt à envoyer les SMS en arrière-plan." else "Le service reste disponible localement.",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 11.sp,
                    )
                }
                Text(
                    text = if (estEnLigne) "Connecté" else "À vérifier",
                    color = if (estEnLigne) VertAccent else AmbreAccent,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                )
            }
        }

        Spacer(Modifier.height(12.dp))

        // Service Control Card (service d'envoi)
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(18.dp),
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
                        color = MaterialTheme.colorScheme.onSurface,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        text = if (serviceActif) "actif en arrière-plan" else "à l'arrêt — aucun envoi",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 12.sp,
                    )
                }
                if (serviceActif) {
                    OutlinedButton(
                        onClick = aArretService,
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("arrêter")
                    }
                } else {
                    Button(
                        onClick = auDemarrageService,
                        colors = ButtonDefaults.buttonColors(containerColor = BleuAccent),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("démarrer", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        Spacer(Modifier.height(12.dp))

        // 2 KPI Cards
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            CarteKpi(
                valeur = smsEnvoyesAujourdhui.toString(),
                etiquette = "sms envoyés (24h)",
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

        // Santé de l'appareil Card
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(18.dp),
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Santé de l'appareil",
                        color = MaterialTheme.colorScheme.onSurface,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        text = nomAppareil.ifBlank { "mis à jour récemment" },
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 11.sp,
                    )
                }

                Spacer(Modifier.height(14.dp))

                // Row 1 : Réseau
                LigneSante(
                    icone = Icons.Filled.WifiOff,
                    titre = "réseau",
                    valeur = if (reseau == "Hors ligne" || reseau == "Inconnu") "pas de signal" else reseau,
                    estOk = !(reseau == "Hors ligne" || reseau == "Inconnu"),
                )

                Spacer(Modifier.height(12.dp))

                // Row 2 : Batterie
                LigneSante(
                    icone = if (batterieEnCharge) Icons.Filled.BatteryChargingFull else Icons.Filled.BatteryFull,
                    titre = "batterie",
                    valeur = if (batterieEnCharge) "en charge" else "$pourcentageBatterie%",
                    estOk = true,
                )

                Spacer(Modifier.height(12.dp))

                // Row 3 : Permissions SMS
                LigneSante(
                    icone = Icons.Filled.Shield,
                    titre = "permissions SMS",
                    valeur = if (permissionSms) "accordées" else "refusées",
                    estOk = permissionSms,
                )
            }
        }

        Spacer(Modifier.height(12.dp))

        // Carte Quota Horaire
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(18.dp),
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = "Quota SMS / heure",
                        color = MaterialTheme.colorScheme.onSurface,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        text = "$quotaSmsUtilise / $quotaSmsTotal",
                        color = MaterialTheme.colorScheme.onSurface,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
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
                    trackColor = MaterialTheme.colorScheme.surfaceVariant,
                )
            }
        }

        Spacer(Modifier.height(12.dp))

        // Dernière synchronisation Card
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(18.dp),
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "Dernière synchronisation",
                        color = MaterialTheme.colorScheme.onSurface,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        text = texteDerniereSynchro,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 11.sp,
                    )
                }

                Surface(
                    color = VertAccent.copy(alpha = 0.12f),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .clip(CircleShape)
                                .background(VertAccent)
                        )
                        Spacer(Modifier.width(6.dp))
                        Text(
                            text = "terminée",
                            color = VertAccent,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun LigneSante(
    icone: androidx.compose.ui.graphics.vector.ImageVector,
    titre: String,
    valeur: String,
    estOk: Boolean,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Surface(
            color = (if (estOk) VertAccent else RougeAccent).copy(alpha = 0.12f),
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier.size(32.dp)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = icone,
                    contentDescription = null,
                    tint = if (estOk) VertAccent else RougeAccent,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
        Spacer(Modifier.width(12.dp))
        Text(
            text = titre,
            color = MaterialTheme.colorScheme.onSurface,
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.weight(1f)
        )
        Text(
            text = valeur,
            color = if (estOk) VertAccent else RougeAccent,
            fontSize = 12.sp,
            fontWeight = FontWeight.Medium
        )
    }
}
