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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.FilterChip
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mitia.smsgateway.domain.model.ElementEvenement
import com.mitia.smsgateway.ui.components.NiveauJournal
import com.mitia.smsgateway.ui.components.LigneJournal
import com.mitia.smsgateway.ui.components.niveauJournalDe
import com.mitia.smsgateway.util.UtilitairesTemps
import com.mitia.smsgateway.ui.theme.RougeAccent
import com.mitia.smsgateway.ui.theme.FondCarte
import com.mitia.smsgateway.ui.theme.FondSombre
import com.mitia.smsgateway.ui.theme.TexteAttenue
import com.mitia.smsgateway.ui.theme.TextePrincipal

@Composable
fun EcranJournal(
    evenements: List<ElementEvenement>,
    aExporter: () -> Unit,
    aVider: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var erreursSeulement by remember { mutableStateOf(false) }
    var confirmerVidage by remember { mutableStateOf(false) }
    val compteurErreurs = remember(evenements) {
        evenements.count { niveauJournalDe(it.message) == NiveauJournal.ERREUR }
    }
    val evenementsVisibles = remember(evenements, erreursSeulement) {
        if (erreursSeulement) evenements.filter { niveauJournalDe(it.message) == NiveauJournal.ERREUR }
        else evenements
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(FondSombre)
            .padding(16.dp),
    ) {
        Text(
            text = "journal",
            color = TextePrincipal,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
        )
        Spacer(Modifier.height(4.dp))
        Text(
            text = "derniers événements · conservé sur l'appareil",
            color = TexteAttenue,
            fontSize = 12.sp,
        )
        Spacer(Modifier.height(12.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            OutlinedButton(onClick = aExporter, modifier = Modifier.weight(1f)) {
                Text("exporter le journal")
            }
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
            ) {
                Text(
                    if (confirmerVidage) "confirmer ?" else "vider",
                    color = if (confirmerVidage) RougeAccent else TextePrincipal,
                )
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterChip(
                selected = !erreursSeulement,
                onClick = { erreursSeulement = false },
                label = { Text("Tous (${evenements.size})") },
            )
            FilterChip(
                selected = erreursSeulement,
                onClick = { erreursSeulement = true },
                label = { Text("Erreurs ($compteurErreurs)") },
            )
        }
        Spacer(Modifier.height(12.dp))

        if (evenementsVisibles.isEmpty()) {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = FondCarte,
                shape = RoundedCornerShape(16.dp),
            ) {
                Text(
                    text = if (erreursSeulement) "Aucune erreur enregistrée."
                    else "Journal vide — démarre le service pour voir les événements.",
                    color = TexteAttenue,
                    fontSize = 13.sp,
                    modifier = Modifier.padding(16.dp),
                )
            }
        } else {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = FondCarte,
                shape = RoundedCornerShape(16.dp),
            ) {
                LazyColumn(
                    modifier = Modifier.padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    items(evenementsVisibles, key = { it.horodatage to it.message }) { evenement ->
                        LigneJournal(
                            entree = com.mitia.smsgateway.ui.components.EntreeJournal(
                                heure = UtilitairesTemps.formaterHeure(evenement.horodatage),
                                message = evenement.message,
                                niveau = niveauJournalDe(evenement.message),
                            )
                        )
                    }
                }
            }
        }
    }
}
