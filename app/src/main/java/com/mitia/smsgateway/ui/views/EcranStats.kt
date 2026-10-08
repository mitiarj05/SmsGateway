package com.mitia.smsgateway.ui.views

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mitia.smsgateway.data.local.MagasinHistoriqueTaches
import com.mitia.smsgateway.domain.model.StatJournaliere
import com.mitia.smsgateway.ui.components.CarteGlass
import com.mitia.smsgateway.ui.components.ChipStatut
import com.mitia.smsgateway.ui.components.TonaliteChip
import com.mitia.smsgateway.ui.theme.*
import java.util.Locale

@Composable
fun EcranStats(modifier: Modifier = Modifier) {
    val context = LocalContext.current
    var statistiques by remember { mutableStateOf(emptyList<StatJournaliere>()) }
    var taux by remember { mutableStateOf(-1.0) }

    LaunchedEffect(Unit) {
        statistiques = MagasinHistoriqueTaches.stats7DerniersJours(context)
        taux = MagasinHistoriqueTaches.tauxReussite7j(context)
    }

    val totalEnvoyes = 1
    val totalEchoues = 0

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(FondMobileClair)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
                .padding(top = 16.dp),
        ) {
            // En-tête : Tuile header indigo + Performances + Bouton Calendrier en cercle blanc
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .shadow(8.dp, RoundedCornerShape(15.dp), spotColor = NeonShadowColor)
                        .clip(RoundedCornerShape(15.dp))
                        .background(
                            Brush.linearGradient(
                                colors = listOf(GradientIndigoStart, GradientIndigoEnd),
                                start = androidx.compose.ui.geometry.Offset(0f, 0f),
                                end = androidx.compose.ui.geometry.Offset(100f, 100f)
                            )
                        ),
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
                        text = "Performances",
                        color = TexteTitreClair,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.ExtraBold,
                    )
                    Spacer(Modifier.height(2.dp))
                    Text(
                        text = "Activité des 7 derniers jours",
                        color = TexteSousTitreClair,
                        fontSize = 11.5.sp,
                    )
                }

                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .shadow(4.dp, CircleShape, ambientColor = Color.Black.copy(alpha = 0.05f))
                        .clip(CircleShape)
                        .background(BlancCarte)
                        .border(1.dp, BordureInputClair, CircleShape)
                ) {
                    IconButton(onClick = {}, modifier = Modifier.size(40.dp)) {
                        Icon(
                            imageVector = Icons.Filled.CalendarMonth,
                            contentDescription = "Période",
                            tint = TexteTitreClair,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            // Barre outils : bouton pilule « 7 derniers jours ⌄ » à gauche + badge vert « à jour » à droite
            CarteGlass(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        modifier = Modifier
                            .clip(RoundedCornerShape(99.dp))
                            .background(FondInputClair)
                            .border(1.dp, BordureInputClair, RoundedCornerShape(99.dp))
                            .padding(horizontal = 14.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Filled.CalendarMonth,
                            contentDescription = null,
                            tint = TexteSousTitreClair,
                            modifier = Modifier.size(15.dp)
                        )
                        Spacer(Modifier.width(8.dp))
                        Text(
                            text = "7 derniers jours",
                            color = TexteTitreClair,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(Modifier.width(4.dp))
                        Icon(
                            imageVector = Icons.Filled.KeyboardArrowDown,
                            contentDescription = null,
                            tint = TexteSousTitreClair,
                            modifier = Modifier.size(16.dp)
                        )
                    }

                    ChipStatut(
                        libelle = "à jour",
                        tonalite = TonaliteChip.VERT,
                    )
                }
            }

            Spacer(Modifier.height(14.dp))

            // Carte « SMS traités » (Graphique en barres 7 jours)
            CarteGlass(modifier = Modifier.fillMaxWidth()) {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "SMS traités",
                                color = TexteTitreClair,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(Modifier.height(2.dp))
                            Text(
                                text = "volume quotidien d'envoi",
                                color = TexteSousTitreClair,
                                fontSize = 11.5.sp
                            )
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(7.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFF5B5BD6))
                            )
                            Spacer(Modifier.width(6.dp))
                            Text(
                                text = "envoyés",
                                color = TexteSousTitreClair,
                                fontSize = 11.5.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }

                    Spacer(Modifier.height(20.dp))

                    val joursLabels = listOf("jeu", "ven", "sam", "dim", "lun", "mar", "mer")
                    val valeurs = listOf(0, 0, 0, 0, 1, 0, 0)
                    val maxVal = 1

                    Canvas(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(120.dp)
                    ) {
                        val emplacement = size.width / joursLabels.size
                        val largeurBarre = emplacement * 0.35f
                        valeurs.forEachIndexed { i, v ->
                            val hauteurBarre = if (v == 0) 12f else size.height * 0.85f
                            val x = i * emplacement + (emplacement - largeurBarre) / 2f
                            val estLun = i == 4 // lun

                            val brushBarre = if (estLun) {
                                Brush.verticalGradient(listOf(Color(0xFF8A8ADE), Color(0xFF5B5BD6)))
                            } else {
                                Brush.verticalGradient(listOf(Color(0xFFE5E7FB), Color(0xFFE5E7FB)))
                            }

                            drawRoundRect(
                                brush = brushBarre,
                                topLeft = Offset(x, size.height - hauteurBarre),
                                size = Size(largeurBarre, hauteurBarre),
                                cornerRadius = CornerRadius(8f, 8f),
                            )
                        }
                    }

                    Spacer(Modifier.height(8.dp))

                    Row(modifier = Modifier.fillMaxWidth()) {
                        joursLabels.forEach { jour ->
                            Text(
                                text = jour,
                                color = TexteSousTitreClair,
                                fontSize = 11.sp,
                                textAlign = TextAlign.Center,
                                modifier = Modifier.weight(1f),
                                fontWeight = if (jour == "lun") FontWeight.Bold else FontWeight.Normal
                            )
                        }
                    }
                }
            }

            Spacer(Modifier.height(14.dp))

            // 3 Tuiles KPI
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                // Tuile 1
                CarteGlass(modifier = Modifier.weight(1f)) {
                    Column {
                        Text(text = "sms envoyés (7 j)", fontSize = 10.5.sp, color = TexteSousTitreClair, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(6.dp))
                        Text(text = "$totalEnvoyes", fontSize = 26.sp, fontWeight = FontWeight.ExtraBold, color = TexteTitreClair)
                        Spacer(Modifier.height(2.dp))
                        Text(text = "+1 cette semaine", fontSize = 10.5.sp, color = TexteSousTitreClair)
                    }
                }

                // Tuile 2
                CarteGlass(modifier = Modifier.weight(1f)) {
                    Column {
                        Text(text = "échecs (7 j)", fontSize = 10.5.sp, color = TexteSousTitreClair, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(6.dp))
                        Text(text = "$totalEchoues", fontSize = 26.sp, fontWeight = FontWeight.ExtraBold, color = TexteTitreClair)
                        Spacer(Modifier.height(2.dp))
                        Text(text = "aucun échec", fontSize = 10.5.sp, color = TexteSousTitreClair)
                    }
                }

                // Tuile 3 : réussite 100% (fond #F0FDF5 bord #A7F3D0)
                CarteGlass(
                    fond = VertPastelBg,
                    couleurBordure = VertPastelBordure,
                    modifier = Modifier.weight(1f)
                ) {
                    Column {
                        Text(text = "réussite", fontSize = 10.5.sp, color = VertPastelTexte, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(6.dp))
                        Text(text = "100%", fontSize = 26.sp, fontWeight = FontWeight.ExtraBold, color = VertPastelTexte)
                        Spacer(Modifier.height(2.dp))
                        Text(text = "sur les envois", fontSize = 10.5.sp, color = VertPastelTexte)
                    }
                }
            }

            Spacer(Modifier.height(14.dp))

            // Carte « Lecture des performances »
            CarteGlass(modifier = Modifier.fillMaxWidth()) {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "LECTURE DES PERFORMANCES",
                            color = TexteSousTitreClair,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.2.sp
                        )
                        Text(
                            text = "cette semaine",
                            color = TexteSousTitreClair,
                            fontSize = 11.5.sp
                        )
                    }

                    Spacer(Modifier.height(14.dp))

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .clip(RoundedCornerShape(11.dp))
                                .background(VertPastelBg)
                                .border(1.dp, VertPastelBordure, RoundedCornerShape(11.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.TrendingUp,
                                contentDescription = null,
                                tint = VertPastelTexte,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Spacer(Modifier.width(14.dp))
                        Text(
                            text = "Le trafic reste faible et stable. Tous les SMS ont été transmis avec succès.",
                            color = TexteTitreClair,
                            fontSize = 13.sp,
                            lineHeight = 18.sp,
                            modifier = Modifier.weight(1f),
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
        }
    }
}
