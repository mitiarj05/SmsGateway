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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.mitia.smsgateway.ui.components.EtiquetteSection
import com.mitia.smsgateway.ui.theme.BleuAccent
import com.mitia.smsgateway.ui.theme.CouleurBordure
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mitia.smsgateway.domain.model.TacheHistorique
import com.mitia.smsgateway.domain.model.Statuts
import com.mitia.smsgateway.ui.components.LigneTache
import com.mitia.smsgateway.ui.components.statutTacheDe
import com.mitia.smsgateway.ui.theme.FondCarte
import com.mitia.smsgateway.ui.theme.FondSombre
import com.mitia.smsgateway.ui.theme.TexteAttenue
import com.mitia.smsgateway.ui.theme.TextePrincipal

@Composable
fun EcranTaches(
    taches: List<TacheHistorique>,
    texteDerniereSynchro: String,
    modifier: Modifier = Modifier,
) {
    var filtre by remember { mutableStateOf<String?>(null) }
    var recherche by remember { mutableStateOf("") }
    val tachesVisibles = remember(taches, filtre, recherche) {
        val q = recherche.trim().lowercase()
        taches.filter { t ->
            val correspondFiltre = when (filtre) {
                Statuts.ENVOYE -> t.statut == Statuts.ENVOYE
                Statuts.EN_ATTENTE -> t.statut == Statuts.EN_ATTENTE || t.statut == Statuts.RECLAME
                Statuts.ECHOUE -> t.statut == Statuts.ECHOUE
                else -> true
            }
            correspondFiltre && (q.isEmpty()
                || t.numeroDestinataire.contains(q, ignoreCase = true)
                || t.message.lowercase().contains(q))
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(FondSombre)
            .padding(16.dp),
    ) {
        Text(
            text = "tâches reçues",
            color = TextePrincipal,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
        )
        Spacer(Modifier.height(4.dp))
        Text(
            text = "synchronisées avec le serveur · $texteDerniereSynchro",
            color = TexteAttenue,
            fontSize = 12.sp,
        )
        Spacer(Modifier.height(12.dp))

        // Filtres par statut
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {            FilterChip(
                selected = filtre == null,
                onClick = { filtre = null },
                label = { Text("Tous (${taches.size})") },
            )
            FilterChip(
                selected = filtre == Statuts.ENVOYE,
                onClick = { filtre = Statuts.ENVOYE },
                label = { Text("Envoyés") },
            )
            FilterChip(
                selected = filtre == Statuts.EN_ATTENTE,
                onClick = { filtre = Statuts.EN_ATTENTE },
                label = { Text("En attente") },
            )
            FilterChip(
                selected = filtre == Statuts.ECHOUE,
                onClick = { filtre = Statuts.ECHOUE },
                label = { Text("Échecs") },
            )
        }
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            value = recherche,
            onValueChange = { recherche = it },
            placeholder = { Text("Rechercher numéro ou message…") },
            leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null) },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = FondCarte,
                unfocusedContainerColor = FondCarte,
                focusedBorderColor = BleuAccent,
                unfocusedBorderColor = CouleurBordure,
                focusedTextColor = TextePrincipal,
                unfocusedTextColor = TextePrincipal,
                cursorColor = BleuAccent,
            ),
            shape = RoundedCornerShape(12.dp),
        )
        Spacer(Modifier.height(12.dp))

        EtiquetteSection(texte = "Résultats (${tachesVisibles.size})")

        if (tachesVisibles.isEmpty()) {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = FondCarte,
                shape = RoundedCornerShape(16.dp),
            ) {
                Text(
                    text = if (filtre == null) "Aucune tâche reçue pour le moment."
                    else "Aucune tâche dans ce filtre.",
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
                LazyColumn {
                    items(tachesVisibles, key = { it.id }) { tache ->
                        LigneTache(
                            numero = tache.numeroDestinataire,
                            message = tache.message,
                            statut = statutTacheDe(tache.statut),
                            erreur = tache.erreur,
                        )
                        HorizontalDivider(
                            color = CouleurBordure,
                            thickness = 0.5.dp,
                        )
                    }
                }
            }
        }

        Spacer(Modifier.height(12.dp))
        Text(
            text = "les tâches arrivent par notification push, même écran éteint",
            color = TexteAttenue,
            fontSize = 11.sp,
        )
    }
}
