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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Message
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.PriorityHigh
import androidx.compose.material.icons.filled.Upload
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mitia.smsgateway.domain.model.ElementEvenement
import com.mitia.smsgateway.ui.components.NiveauJournal
import com.mitia.smsgateway.ui.components.niveauJournalDe
import com.mitia.smsgateway.ui.theme.BleuAccent
import com.mitia.smsgateway.ui.theme.RougeAccent
import com.mitia.smsgateway.ui.theme.VertAccent
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

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp),
    ) {
        // En-tête : Logo bleu + Journal + Bouton Exporter
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
                    text = "Journal",
                    color = MaterialTheme.colorScheme.onBackground,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = "Événements techniques",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 12.sp,
                )
            }

            Surface(
                color = MaterialTheme.colorScheme.surface,
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
            ) {
                IconButton(onClick = aExporter, modifier = Modifier.size(38.dp)) {
                    Icon(
                        imageVector = Icons.Filled.Download,
                        contentDescription = "Exporter",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }

        Spacer(Modifier.height(16.dp))

        // 3 KPI Cards row
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            // Card 1 : Total
            Surface(
                modifier = Modifier.weight(1f),
                color = MaterialTheme.colorScheme.surface,
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(text = "$total", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                    Text(text = "événements", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }

            // Card 2 : À examiner (erreurs)
            Surface(
                modifier = Modifier.weight(1.2f),
                color = RougeAccent.copy(alpha = 0.1f),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(text = "$compteurErreurs", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = RougeAccent)
                    Text(text = "à examiner", fontSize = 11.sp, color = RougeAccent)
                }
            }

            // Card 3 : Dernier
            Surface(
                modifier = Modifier.weight(1f),
                color = MaterialTheme.colorScheme.surface,
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(text = dernierHeure, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                    Text(text = "dernier", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }

        Spacer(Modifier.height(12.dp))

        // Filter Pills
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterChip(
                selected = filtreErreurs == null,
                onClick = { filtreErreurs = null },
                label = { Text("Tous") },
            )
            FilterChip(
                selected = filtreErreurs == false,
                onClick = { filtreErreurs = false },
                label = { Text("Infos") },
            )
            FilterChip(
                selected = filtreErreurs == true,
                onClick = { filtreErreurs = true },
                label = { Text("Erreurs $compteurErreurs") },
            )
        }

        Spacer(Modifier.height(12.dp))

        // Main Event Log Card
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
            color = MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(20.dp),
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Aujourd'hui",
                        color = MaterialTheme.colorScheme.onSurface,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        text = "${evenementsVisibles.size} événements",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 11.sp,
                    )
                }

                Spacer(Modifier.height(12.dp))

                if (evenementsVisibles.isEmpty()) {
                    Text(
                        text = if (filtreErreurs == true) "Aucune erreur enregistrée." else "Journal vide.",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 13.sp,
                        modifier = Modifier.padding(vertical = 16.dp),
                    )
                } else {
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        items(evenementsVisibles, key = { it.horodatage to it.message }) { evenement ->
                            LigneJournalCapture(evenement = evenement)
                            HorizontalDivider(
                                color = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f),
                                thickness = 0.5.dp,
                            )
                        }
                    }
                }
            }
        }

        Spacer(Modifier.height(12.dp))

        // Bottom Action Buttons
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            OutlinedButton(
                onClick = {
                    if (confirmerVidage) {
                        aVider()
                        confirmerVidage = false
                    } else {
                        confirmerVidage = true
                    }
                },
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Filled.Delete, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(6.dp))
                Text(if (confirmerVidage) "confirmer ?" else "Effacer le journal")
            }

            OutlinedButton(
                onClick = aExporter,
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Filled.Upload, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(6.dp))
                Text("Exporter")
            }
        }
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
        Surface(
            color = (if (estErreur) RougeAccent else VertAccent).copy(alpha = 0.12f),
            shape = CircleShape,
            modifier = Modifier.size(32.dp)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = if (estErreur) Icons.Filled.PriorityHigh else Icons.Filled.Check,
                    contentDescription = null,
                    tint = if (estErreur) RougeAccent else VertAccent,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
        Spacer(Modifier.width(10.dp))
        Column(modifier = Modifier.weight(1f)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = UtilitairesTemps.formaterHeure(evenement.horodatage),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = "passerelle",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 10.sp
                )
            }
            Spacer(Modifier.height(2.dp))
            Text(
                text = evenement.message,
                color = if (estErreur) RougeAccent else MaterialTheme.colorScheme.onSurface,
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium
            )
        }
    }
}
