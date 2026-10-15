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
import androidx.compose.material3.MaterialTheme
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

    val isSombre = MaterialTheme.colorScheme.background.red < 0.2f
    val fondRougeButton = if (isSombre) Color(0x22EF4444) else RougePastelBg
    val bordureRougeButton = if (isSombre) Color(0x44EF4444) else RougePastelBordure
    val texteRougeButton = if (isSombre) Color(0xFFF87171) else RougePastelTexte

    val compteurErreurs = remember(evenements) {
        evenements.count { niveauJournalDe(it.message) == NiveauJournal.ERREUR }
    }
    val evenementsVisibles = remember(evenements, filtreErreurs) {
        when (filtreErreurs) {
            true -> evenements.filter { niveauJournalDe(it.message) == NiveauJournal.ERREUR }
            false -> evenements.filter { niveauJournalDe(it.message) != NiveauJournal.ERREUR }
            null -> evenements
        }
    }

    val total = evenements.size
    val dernierHeure = evenements.firstOrNull()?.let { UtilitairesTemps.formaterHeure(it.horodatage).take(5) } ?: "—"

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
                .padding(top = 16.dp),
        ) {
            // En-tête : Tuile header indigo + Journal + Bouton download
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
                        color = MaterialTheme.colorScheme.onSurface,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.ExtraBold,
                    )
                    Spacer(Modifier.height(2.dp))
                    Text(
                        text = "Événements techniques",
                        color = MaterialTheme.colorScheme.secondaryContainer,
                        fontSize = 11.5.sp,
                    )
                }

                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .shadow(4.dp, CircleShape, ambientColor = Color.Black.copy(alpha = 0.05f))
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.surface)
                        .border(1.dp, MaterialTheme.colorScheme.outline, CircleShape)
                ) {
                    IconButton(onClick = aExporter, modifier = Modifier.size(40.dp)) {
                        Icon(
                            imageVector = Icons.Filled.Download,
                            contentDescription = "Exporter",
                            tint = MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            // 3 Tuiles KPI (Total, à examiner rouge, dernier)
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                // Tuile 1
                CarteGlass(modifier = Modifier.weight(1f)) {
                    Column {
                        Text(text = "$total", fontSize = 28.sp, fontWeight = FontWeight.ExtraBold, color = MaterialTheme.colorScheme.onSurface)
                        Spacer(Modifier.height(2.dp))
                        Text(text = "événements", fontSize = 10.5.sp, color = MaterialTheme.colorScheme.secondaryContainer)
                    }
                }

                // Tuile 2 (Rouge adaptatif)
                CarteGlass(
                    fond = fondRougeButton,
                    couleurBordure = bordureRougeButton,
                    modifier = Modifier.weight(1f)
                ) {
                    Column {
                        Text(text = "$compteurErreurs", fontSize = 28.sp, fontWeight = FontWeight.ExtraBold, color = texteRougeButton)
                        Spacer(Modifier.height(2.dp))
                        Text(text = "à examiner", fontSize = 10.5.sp, color = texteRougeButton)
                    }
                }

                // Tuile 3
                CarteGlass(modifier = Modifier.weight(1f)) {
                    Column {
                        Text(text = dernierHeure, fontSize = 21.sp, fontWeight = FontWeight.ExtraBold, color = MaterialTheme.colorScheme.onSurface)
                        Spacer(Modifier.height(2.dp))
                        Text(text = "dernier", fontSize = 10.5.sp, color = MaterialTheme.colorScheme.secondaryContainer)
                    }
                }
            }

            Spacer(Modifier.height(14.dp))

            // Onglets Pilules (Tous actif, Infos, Erreurs)
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
                    libelle = "Erreurs · $compteurErreurs",
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
                    color = MaterialTheme.colorScheme.onSurface,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = "$total événements",
                    color = MaterialTheme.colorScheme.secondaryContainer,
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
                            HorizontalDivider(color = MaterialTheme.colorScheme.outline, thickness = 0.5.dp)
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
                        .border(1.dp, bordureRougeButton, RoundedCornerShape(14.dp))
                        .background(fondRougeButton)
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
                        Icon(Icons.Filled.Delete, contentDescription = null, tint = texteRougeButton, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp))
                        Text(
                            if (confirmerVidage) "Confirmer ?" else "Effacer le journal",
                            color = texteRougeButton,
                            fontSize = 13.5.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(14.dp))
                        .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(14.dp))
                        .background(MaterialTheme.colorScheme.surface)
                        .clickable(onClick = aExporter)
                        .padding(vertical = 14.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.Upload, contentDescription = null, tint = MaterialTheme.colorScheme.secondaryContainer, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Exporter", color = MaterialTheme.colorScheme.onSurface, fontSize = 13.5.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun PiluleFiltre(
    libelle: String,
    selectionne: Boolean,
    auClic: () -> Unit
) {
    Box(
        modifier = Modifier
            .clip(CircleShape)
            .background(if (selectionne) GradientIndigoStart else MaterialTheme.colorScheme.surface)
            .border(1.dp, if (selectionne) GradientIndigoStart else MaterialTheme.colorScheme.outline, CircleShape)
            .clickable(onClick = auClic)
            .padding(horizontal = 16.dp, vertical = 8.dp)
    ) {
        Text(
            text = libelle,
            color = if (selectionne) Color.White else MaterialTheme.colorScheme.secondaryContainer,
            fontSize = 12.sp,
            fontWeight = if (selectionne) FontWeight.Bold else FontWeight.Medium
        )
    }
}

@Composable
private fun LigneJournalCapture(evenement: ElementEvenement) {
    val isSombre = MaterialTheme.colorScheme.background.red < 0.2f
    val estErreur = niveauJournalDe(evenement.message) == NiveauJournal.ERREUR

    val chipBg = if (estErreur) (if (isSombre) Color(0x22EF4444) else RougePastelBg) else (if (isSombre) Color(0x2210B981) else VertPastelBg)
    val chipBd = if (estErreur) (if (isSombre) Color(0x44EF4444) else RougePastelBordure) else (if (isSombre) Color(0x4434D399) else VertPastelBordure)
    val chipTxt = if (estErreur) (if (isSombre) Color(0xFFF87171) else RougePastelTexte) else (if (isSombre) Color(0xFF34D399) else VertPastelTexte)

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Chip icône 28px
        Box(
            modifier = Modifier
                .size(28.dp)
                .clip(CircleShape)
                .background(chipBg)
                .border(1.dp, chipBd, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = if (estErreur) Icons.Filled.Close else Icons.Filled.Check,
                contentDescription = null,
                tint = chipTxt,
                modifier = Modifier.size(14.dp)
            )
        }
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = UtilitairesTemps.formaterHeure(evenement.horodatage),
                color = MaterialTheme.colorScheme.secondaryContainer,
                fontSize = 10.5.sp,
                fontWeight = FontWeight.Medium
            )
            Spacer(Modifier.height(2.dp))
            Text(
                text = evenement.message,
                color = if (estErreur) chipTxt else MaterialTheme.colorScheme.onSurface,
                fontSize = 12.5.sp,
                fontWeight = if (estErreur) FontWeight.Bold else FontWeight.Medium
            )
        }
        Spacer(Modifier.width(8.dp))
        Text(
            text = "passerelle",
            color = MaterialTheme.colorScheme.secondaryContainer,
            fontSize = 10.sp,
        )
    }
}
