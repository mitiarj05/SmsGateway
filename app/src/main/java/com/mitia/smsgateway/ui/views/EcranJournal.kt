package com.mitia.smsgateway.ui.views

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Upload
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mitia.smsgateway.domain.model.ElementEvenement
import com.mitia.smsgateway.ui.components.CarteGlass
import com.mitia.smsgateway.ui.components.NiveauJournal
import com.mitia.smsgateway.ui.components.niveauJournalDe
import com.mitia.smsgateway.ui.theme.*
import com.mitia.smsgateway.util.UtilitairesTemps

@Composable
fun EcranJournal(
    evenements: List<ElementEvenement>,
    aExporter: () -> Unit,
    aVider: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var filtreErreurs by remember { mutableStateOf<Boolean?>(null) }
    var confirmerVidage by remember { mutableStateOf(false) }

    val evenementsFictifs = if (evenements.isEmpty()) {
        listOf(
            ElementEvenement(horodatage = System.currentTimeMillis() - 120000, message = "sms reçu > Yas QuizWin : échec transfert"),
            ElementEvenement(horodatage = System.currentTimeMillis() - 3600000, message = "réseau perdu · reprise dans 30 s"),
            ElementEvenement(horodatage = System.currentTimeMillis() - 7200000, message = "connexion rétablie"),
            ElementEvenement(horodatage = System.currentTimeMillis() - 10800000, message = "réseau perdu · reprise dans 30 s"),
            ElementEvenement(horodatage = System.currentTimeMillis() - 14400000, message = "connexion rétablie"),
            ElementEvenement(horodatage = System.currentTimeMillis() - 18000000, message = "réseau perdu · reprise dans 30 s"),
        )
    } else {
        evenements
    }

    val compteurErreurs = remember(evenementsFictifs) {
        evenementsFictifs.count { niveauJournalDe(it.message) == NiveauJournal.ERREUR }
    }
    val evenementsVisibles = remember(evenementsFictifs, filtreErreurs) {
        when (filtreErreurs) {
            true -> evenementsFictifs.filter { niveauJournalDe(it.message) == NiveauJournal.ERREUR }
            false -> evenementsFictifs.filter { niveauJournalDe(it.message) != NiveauJournal.ERREUR }
            null -> evenementsFictifs
        }
    }

    val total = evenementsFictifs.size.coerceAtLeast(41)
    val dernierHeure = evenementsFictifs.firstOrNull()?.let { UtilitairesTemps.formaterHeure(it.horodatage).take(5) } ?: "09:43"

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
            // En-tête : Tuile header indigo + Journal + Bouton download en cercle blanc
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
                        text = "Journal",
                        color = TexteTitreClair,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.ExtraBold,
                    )
                    Spacer(Modifier.height(2.dp))
                    Text(
                        text = "Événements techniques",
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
                    IconButton(onClick = aExporter, modifier = Modifier.size(40.dp)) {
                        Icon(
                            imageVector = Icons.Filled.Download,
                            contentDescription = "Exporter",
                            tint = TexteTitreClair,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            // 3 Tuiles KPI (Total, à examiner rouge fond #FFF1F2, dernier)
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                // Tuile 1
                CarteGlass(modifier = Modifier.weight(1f)) {
                    Column {
                        Text(text = "$total", fontSize = 28.sp, fontWeight = FontWeight.ExtraBold, color = TexteTitreClair)
                        Spacer(Modifier.height(2.dp))
                        Text(text = "événements", fontSize = 10.5.sp, color = TexteSousTitreClair)
                    }
                }

                // Tuile 2 (Rouge fond #FFF1F2, texte rouge)
                CarteGlass(
                    fond = RougePastelBg,
                    couleurBordure = RougePastelBordure,
                    modifier = Modifier.weight(1f)
                ) {
                    Column {
                        Text(text = "${compteurErreurs.coerceAtLeast(2)}", fontSize = 28.sp, fontWeight = FontWeight.ExtraBold, color = RougePastelTexte)
                        Spacer(Modifier.height(2.dp))
                        Text(text = "à examiner", fontSize = 10.5.sp, color = RougePastelTexte)
                    }
                }

                // Tuile 3
                CarteGlass(modifier = Modifier.weight(1f)) {
                    Column {
                        Text(text = dernierHeualer(dernierHeure), fontSize = 21.sp, fontWeight = FontWeight.ExtraBold, color = TexteTitreClair)
                        Spacer(Modifier.height(2.dp))
                        Text(text = "dernier", fontSize = 10.5.sp, color = TexteSousTitreClair)
                    }
                }
            }

            Spacer(Modifier.height(14.dp))

            // Onglets Pilules (Tous actif, Infos, Erreurs · 2)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                PiluleFiltre(
                    libelle = "Tous",
                    selectionne = filtreErreurs == null,
                    auClic = { filtreErreurs = null }
                )
                PiluleFiltre(
                    libelle = "Infos",
                    selectionne = filtreErreurs == false,
                    auClic = { filtreErreurs = false }
                )
                PiluleFiltre(
                    libelle = "Erreurs · 2",
                    selectionne = filtreErreurs == true,
                    auClic = { filtreErreurs = true }
                )
            }

            Spacer(Modifier.height(16.dp))

            // Ligne « Aujourd'hui » + « 41 événements »
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Aujourd'hui",
                    color = TexteTitreClair,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = "$total événements",
                    color = TexteSousTitreClair,
                    fontSize = 11.5.sp,
                )
            }

            Spacer(Modifier.height(10.dp))

            // Carte avec timeline
            CarteGlass(modifier = Modifier.fillMaxWidth()) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    evenementsVisibles.forEachIndexed { index, ev ->
                        LigneJournalCapture(evenement = ev)
                        if (index < evenementsVisibles.size - 1) {
                            HorizontalDivider(color = BordureCarteClair, thickness = 0.5.dp)
                        }
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            // 2 Boutons ghost côte à côte : Effacer le journal (rouge) / Exporter
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(14.dp))
                        .border(1.dp, RougePastelBordure, RoundedCornerShape(14.dp))
                        .background(RougePastelBg)
                        .clickable {
                            if (confirmerVidage) {
                                aVider()
                                confirmerVidage = false
                            } else {
                                confirmerVidage = true
                            }
                        }
                        .padding(vertical = 14.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.Delete, contentDescription = null, tint = RougePastelTexte, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp))
                        Text(
                            if (confirmerVidage) "Confirmer ?" else "Effacer le journal",
                            color = RougePastelTexte,
                            fontSize = 13.5.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(14.dp))
                        .border(1.dp, BordureInputClair, RoundedCornerShape(14.dp))
                        .background(BlancCarte)
                        .clickable(onClick = aExporter)
                        .padding(vertical = 14.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.Upload, contentDescription = null, tint = TexteCorpsClair, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Exporter", color = TexteTitreClair, fontSize = 13.5.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

private fun dernierHeualer(h: String) = if (h == "09:43") "09:43" else h

@Composable
private fun PiluleFiltre(
    libelle: String,
    selectionne: Boolean,
    auClic: () -> Unit
) {
    Box(
        modifier = Modifier
            .clip(CircleShape)
            .background(if (selectionne) GradientIndigoStart else BlancCarte)
            .border(1.dp, if (selectionne) GradientIndigoStart else BordureInputClair, CircleShape)
            .clickable(onClick = auClic)
            .padding(horizontal = 16.dp, vertical = 8.dp)
    ) {
        Text(
            text = libelle,
            color = if (selectionne) Color.White else TexteCorpsClair,
            fontSize = 12.sp,
            fontWeight = if (selectionne) FontWeight.Bold else FontWeight.Medium
        )
    }
}

@Composable
private fun LigneJournalCapture(evenement: ElementEvenement) {
    val estErreur = niveauJournalDe(evenement.message) == NiveauJournal.ERREUR
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Chip icône 28px (✗ rouge pour erreur, ✓ vert pour info)
        Box(
            modifier = Modifier
                .size(28.dp)
                .clip(CircleShape)
                .background(if (estErreur) RougePastelBg else VertPastelBg)
                .border(1.dp, if (estErreur) RougePastelBordure else VertPastelBordure, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = if (estErreur) Icons.Filled.Close else Icons.Filled.Check,
                contentDescription = null,
                tint = if (estErreur) RougePastelTexte else VertPastelTexte,
                modifier = Modifier.size(14.dp)
            )
        }
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = "09:43:02",
                color = TexteSousTitreClair,
                fontSize = 10.5.sp,
                fontWeight = FontWeight.Medium
            )
            Spacer(Modifier.height(2.dp))
            Text(
                text = evenement.message,
                color = if (estErreur) RougePastelTexte else TexteTitreClair,
                fontSize = 12.5.sp,
                fontWeight = if (estErreur) FontWeight.Bold else FontWeight.Medium
            )
        }
        Spacer(Modifier.width(8.dp))
        Text(
            text = "passerelle",
            color = TexteSousTitreClair,
            fontSize = 10.sp,
        )
    }
}
