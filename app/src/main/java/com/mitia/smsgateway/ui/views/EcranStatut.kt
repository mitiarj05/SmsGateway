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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Message
import androidx.compose.material.icons.filled.BatteryChargingFull
import androidx.compose.material.icons.filled.BatteryFull
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.SignalCellularAlt
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mitia.smsgateway.domain.model.CarteUssd
import com.mitia.smsgateway.domain.model.SoldeSim
import com.mitia.smsgateway.ui.components.BoutonNeon
import com.mitia.smsgateway.ui.components.CarteGlass
import com.mitia.smsgateway.ui.components.ChipStatut
import com.mitia.smsgateway.ui.components.TonaliteChip
import com.mitia.smsgateway.ui.theme.*
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

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
    cartesUssd: List<CarteUssd> = emptyList(),
    modifier: Modifier = Modifier,
    themeSombre: Boolean = true,
    auChangementTheme: () -> Unit = {},
) {
    val isSombre = MaterialTheme.colorScheme.background.red < 0.2f

    val fondAlerte = when {
        estEnLigne -> if (isSombre) Color(0x2210B981) else VertPastelBg
        else -> if (isSombre) Color(0x22F59E0B) else AmbrePastelBg
    }
    val bordureAlerte = when {
        estEnLigne -> if (isSombre) Color(0x4434D399) else VertPastelBordure
        else -> if (isSombre) Color(0x44FBBF24) else AmbrePastelBordure
    }
    val texteAlerteCouleur = when {
        estEnLigne -> if (isSombre) Color(0xFF34D399) else VertPastelTexte
        else -> if (isSombre) Color(0xFFFBBF24) else AmbrePastelTexte
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(18.dp)
            .padding(top = 16.dp),
    ) {
        // En-tête : Logo bleu + Statut + Bouton Rafraîchir
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(GradientIndigoStart),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.Message,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(20.dp)
                )
            }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Statut",
                    color = MaterialTheme.colorScheme.onSurface,
                    fontSize = 19.sp,
                    fontWeight = FontWeight.ExtraBold,
                )
                Text(
                    text = "Supervision de l'appareil",
                    color = MaterialTheme.colorScheme.secondaryContainer,
                    fontSize = 11.5.sp,
                )
            }

            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(12.dp))
                    .background(MaterialTheme.colorScheme.surface)
            ) {
                IconButton(onClick = aActualiser, modifier = Modifier.size(38.dp)) {
                    Icon(
                        imageVector = Icons.Filled.Refresh,
                        contentDescription = "Rafraîchir",
                        tint = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }

        Spacer(Modifier.height(16.dp))

        // Alerte glass (Appareil hors ligne / en ligne)
        CarteGlass(
            glow = bordureAlerte,
            fond = fondAlerte,
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = if (estEnLigne) "Appareil en ligne" else "Appareil hors ligne",
                        color = texteAlerteCouleur,
                        fontSize = 13.5.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    Spacer(Modifier.height(2.dp))
                    Text(
                        text = if (estEnLigne) "Prêt à envoyer les SMS en arrière-plan." else "Le service reste disponible localement",
                        color = if (isSombre) Color(0xFFCBD5E1) else MaterialTheme.colorScheme.secondaryContainer,
                        fontSize = 11.sp,
                    )
                }
                ChipStatut(
                    libelle = if (estEnLigne) "Connecté" else "À vérifier",
                    tonalite = if (estEnLigne) TonaliteChip.VERT else TonaliteChip.AMBRE,
                    pulse = estEnLigne
                )
            }
        }

        Spacer(Modifier.height(12.dp))

        // Service Control Card (service d'envoi)
        CarteGlass(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "service d'envoi",
                        color = MaterialTheme.colorScheme.onSurface,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    Spacer(Modifier.height(2.dp))
                    Text(
                        text = if (serviceActif) "actif en arrière-plan" else "à l'arrêt — aucun envoi",
                        color = MaterialTheme.colorScheme.secondaryContainer,
                        fontSize = 11.sp,
                    )
                }
                BoutonNeon(
                    libelle = if (serviceActif) "arrêter" else "démarrer",
                    auClic = if (serviceActif) aArretService else auDemarrageService
                )
            }
        }

        Spacer(Modifier.height(12.dp))

        // 2 Tuiles Stats
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            CarteGlass(modifier = Modifier.weight(1f)) {
                Column {
                    Text(
                        text = smsEnvoyesAujourdhui.toString(),
                        fontSize = 28.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = NeonCyan
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = "sms envoyés (24h)",
                        fontSize = 10.5.sp,
                        color = MaterialTheme.colorScheme.secondaryContainer
                    )
                }
            }
            CarteGlass(modifier = Modifier.weight(1f)) {
                Column {
                    Text(
                        text = smsEnAttente.toString(),
                        fontSize = 28.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = NeonViolet
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = "en file d'attente",
                        fontSize = 10.5.sp,
                        color = MaterialTheme.colorScheme.secondaryContainer
                    )
                }
            }
        }

        Spacer(Modifier.height(12.dp))

        // Solde de la SIM : c'est le seul vrai crédit de la passerelle (le quota
        // serveur, lui, peut être illimité). On montre la carte la PLUS BASSE,
        // car c'est elle qui arrêtera les envois la première.
        val soldesAvecMontant = cartesUssd.filter { !it.solde?.montant.isNullOrBlank() }
        val carteCritique = soldesAvecMontant.minByOrNull {
            montantNumerique(it.solde) ?: Double.MAX_VALUE
        }
        val releveSansMontant = cartesUssd.firstOrNull {
            it.solde != null && it.solde.montant.isNullOrBlank()
        }

        CarteGlass(modifier = Modifier.fillMaxWidth()) {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "SOLDE DE LA SIM",
                        color = MaterialTheme.colorScheme.secondaryContainer,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.4.sp
                    )
                    if (cartesUssd.isNotEmpty()) {
                        ChipStatut(
                            libelle = when {
                                carteCritique == null -> "sans montant"
                                cartesUssd.size > 1 -> "la plus basse"
                                else -> "relevé"
                            },
                            tonalite = if (carteCritique != null) TonaliteChip.VERT else TonaliteChip.AMBRE,
                        )
                    }
                }

                Spacer(Modifier.height(10.dp))

                if (carteCritique != null) {
                    Text(
                        text = listOfNotNull(
                            carteCritique.solde?.montant,
                            carteCritique.solde?.devise
                        ).joinToString(" "),
                        fontSize = 26.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = NeonCyan
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = buildList {
                            add(libelleCarte(carteCritique))
                            if (cartesUssd.size > 1) add("la plus basse des ${cartesUssd.size} cartes")
                            carteCritique.solde?.horodatage?.takeIf { it > 0L }?.let {
                                add(
                                    "relevé le " +
                                        SimpleDateFormat("dd/MM 'à' HH:mm", Locale.FRANCE).format(Date(it))
                                )
                            }
                        }.joinToString(" · "),
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.secondaryContainer
                    )
                    // La réponse brute de l'opérateur reste lisible : si le
                    // montant a été mal lu, le client peut s'en apercevoir.
                    val brut = carteCritique.solde?.texte
                    if (!brut.isNullOrBlank()) {
                        Spacer(Modifier.height(6.dp))
                        Text(
                            text = "« $brut »",
                            fontSize = 10.5.sp,
                            color = MaterialTheme.colorScheme.secondaryContainer,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                } else if (releveSansMontant != null) {
                    Text(
                        text = "relevé sans montant",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = "L'opérateur a répondu, mais aucun montant n'a été reconnu. " +
                            "Diagnostic → Multi-SIM pour lire la réponse telle quelle.",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.secondaryContainer
                    )
                } else {
                    Text(
                        text = "aucun relevé",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = "Renseignez le code USSD de chaque carte dans " +
                            "Diagnostic → Multi-SIM. Les SMS de solde de l'opérateur " +
                            "sont lus automatiquement.",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.secondaryContainer
                    )
                }
            }
        }

        Spacer(Modifier.height(12.dp))

        // Santé de l'appareil Card
        CarteGlass(modifier = Modifier.fillMaxWidth()) {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "SANTÉ DE L'APPAREIL",
                        color = MaterialTheme.colorScheme.secondaryContainer,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.4.sp
                    )
                    Text(
                        text = nomAppareil.ifBlank { android.os.Build.MODEL },
                        color = MaterialTheme.colorScheme.secondaryContainer,
                        fontSize = 11.sp,
                    )
                }

                Spacer(Modifier.height(14.dp))

                // Ligne 1 : Réseau
                LigneSante(
                    icone = Icons.Filled.SignalCellularAlt,
                    titre = "réseau",
                    chip = {
                        ChipStatut(
                            libelle = if (reseau == "Hors ligne" || reseau == "Inconnu") "pas de signal" else reseau,
                            tonalite = if (reseau == "Hors ligne" || reseau == "Inconnu") TonaliteChip.ROUGE else TonaliteChip.VERT
                        )
                    }
                )

                Spacer(Modifier.height(12.dp))
                Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(MaterialTheme.colorScheme.outline.copy(alpha = 0.5f)))
                Spacer(Modifier.height(12.dp))

                // Ligne 2 : Batterie
                LigneSante(
                    icone = if (batterieEnCharge) Icons.Filled.BatteryChargingFull else Icons.Filled.BatteryFull,
                    titre = "batterie",
                    chip = {
                        ChipStatut(
                            libelle = if (batterieEnCharge) "en charge" else "$pourcentageBatterie%",
                            tonalite = TonaliteChip.VERT,
                            pulse = batterieEnCharge
                        )
                    }
                )

                Spacer(Modifier.height(12.dp))
                Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(MaterialTheme.colorScheme.outline.copy(alpha = 0.5f)))
                Spacer(Modifier.height(12.dp))

                // Ligne 3 : Permissions SMS
                LigneSante(
                    icone = Icons.Filled.Shield,
                    titre = "permissions SMS",
                    chip = {
                        ChipStatut(
                            libelle = if (permissionSms) "accordées" else "refusées",
                            tonalite = if (permissionSms) TonaliteChip.VERT else TonaliteChip.ROUGE,
                            pulse = permissionSms
                        )
                    }
                )
            }
        }

        Spacer(Modifier.height(12.dp))

        // Quota SMS / Heure
        CarteGlass(modifier = Modifier.fillMaxWidth()) {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = "QUOTA SMS / HEURE",
                        color = MaterialTheme.colorScheme.secondaryContainer,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.4.sp
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
                        if (quotaSmsTotal > 0) quotaSmsUtilise.toFloat() / quotaSmsTotal else 0.04f
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(7.dp)
                        .clip(RoundedCornerShape(99.dp)),
                    color = GradientIndigoStart,
                    trackColor = MaterialTheme.colorScheme.surfaceVariant,
                )
            }
        }

        Spacer(Modifier.height(12.dp))

        // Dernière synchronisation
        CarteGlass(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier.fillMaxWidth(),
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
                    Spacer(Modifier.height(2.dp))
                    Text(
                        text = texteDerniereSynchro.ifBlank { "—" },
                        color = MaterialTheme.colorScheme.secondaryContainer,
                        fontSize = 11.sp,
                    )
                }

                ChipStatut(
                    libelle = "terminée",
                    tonalite = TonaliteChip.VERT,
                    pulse = true
                )
            }
        }
    }
}

@Composable
private fun LigneSante(
    icone: androidx.compose.ui.graphics.vector.ImageVector,
    titre: String,
    chip: @Composable () -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier
                .size(34.dp)
                .clip(RoundedCornerShape(11.dp))
                .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.06f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icone,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.secondaryContainer,
                modifier = Modifier.size(18.dp)
            )
        }
        Spacer(Modifier.width(12.dp))
        Text(
            text = titre,
            color = MaterialTheme.colorScheme.onSurface,
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.weight(1f)
        )
        chip()
    }
}

/**
 * « 5 000 » → 5000.0 ; null si le montant n'est pas un nombre lisible.
 *
 * Sert uniquement à classer les cartes pour afficher la plus basse : jamais à
 * réécrire ce que l'opérateur a envoyé (le montant affiché reste sa chaîne).
 */
private fun montantNumerique(solde: SoldeSim?): Double? =
    solde?.montant
        ?.replace("\u00A0", "")
        ?.replace("\u202F", "")
        ?.replace(" ", "")
        ?.replace(",", ".")
        ?.toDoubleOrNull()

private fun libelleCarte(carte: CarteUssd): String = buildList {
    if (carte.emplacement > 0) add("SIM ${carte.emplacement}")
    if (carte.operateur.isNotBlank()) add(carte.operateur)
    if (isEmpty()) add("carte SIM")
}.joinToString(" · ")
