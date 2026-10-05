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
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Mail
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mitia.smsgateway.domain.model.Statuts
import com.mitia.smsgateway.domain.model.TacheHistorique
import com.mitia.smsgateway.ui.components.statutTacheDe
import com.mitia.smsgateway.ui.theme.BleuAccent
import com.mitia.smsgateway.ui.theme.FondCarte
import com.mitia.smsgateway.ui.theme.RougeAccent
import com.mitia.smsgateway.ui.theme.VertAccent
import com.mitia.smsgateway.util.UtilitairesTemps
import java.util.Calendar

@Composable
fun EcranTaches(
    taches: List<TacheHistorique>,
    texteDerniereSynchro: String,
    aVider: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var filtre by remember { mutableStateOf<String?>(null) }
    var recherche by remember { mutableStateOf("") }
    var rechercheVisible by remember { mutableStateOf(false) }
    var confirmerVidage by remember { mutableStateOf(false) }

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

    val debutJournee = remember {
        Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }.timeInMillis
    }

    val totalAujourdhui = taches.count { it.horodatage >= debutJournee }
    val enAttenteCount = taches.count { it.statut == Statuts.EN_ATTENTE || it.statut == Statuts.RECLAME }
    val echecsCount = taches.count { it.statut == Statuts.ECHOUE }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp),
    ) {
        // En-tête : Logo bleu + Tâches reçues + Bouton Recherche
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
                        tint = androidx.compose.ui.graphics.Color.White,
                        modifier = Modifier.size(22.dp)
                    )
                }
            }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Tâches reçues",
                    color = MaterialTheme.colorScheme.onBackground,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = "Messages traités par l'appareil · $texteDerniereSynchro",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 12.sp,
                )
            }

            Surface(
                color = MaterialTheme.colorScheme.surface,
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
            ) {
                IconButton(onClick = { rechercheVisible = !rechercheVisible }, modifier = Modifier.size(38.dp)) {
                    Icon(
                        imageVector = Icons.Filled.Search,
                        contentDescription = "Rechercher",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }

        Spacer(Modifier.height(16.dp))

        // Dark Navy Summary Card
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = FondCarte,
            shape = RoundedCornerShape(20.dp),
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(18.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "$totalAujourdhui",
                        color = androidx.compose.ui.graphics.Color.White,
                        fontSize = 32.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        text = "tâches reçues aujourd'hui",
                        color = androidx.compose.ui.graphics.Color.White.copy(alpha = 0.6f),
                        fontSize = 12.sp,
                    )
                }

                Surface(
                    color = VertAccent.copy(alpha = 0.15f),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Filled.CheckCircle,
                            contentDescription = null,
                            tint = VertAccent,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(Modifier.width(6.dp))
                        Text(
                            text = if (enAttenteCount == 0) "tout est traité" else "$enAttenteCount en attente",
                            color = VertAccent,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        Spacer(Modifier.height(14.dp))

        // Filtres
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterChip(
                selected = filtre == null,
                onClick = { filtre = null },
                label = { Text("Toutes $totalAujourdhui") },
            )
            FilterChip(
                selected = filtre == Statuts.EN_ATTENTE,
                onClick = { filtre = Statuts.EN_ATTENTE },
                label = { Text("En attente $enAttenteCount") },
            )
            FilterChip(
                selected = filtre == Statuts.ECHOUE,
                onClick = { filtre = Statuts.ECHOUE },
                label = { Text("Échecs $echecsCount") },
            )
        }

        if (rechercheVisible) {
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(
                value = recherche,
                onValueChange = { recherche = it },
                placeholder = { Text("Rechercher numéro ou message…") },
                leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = MaterialTheme.colorScheme.surface,
                    unfocusedContainerColor = MaterialTheme.colorScheme.surface,
                    focusedBorderColor = BleuAccent,
                    unfocusedBorderColor = MaterialTheme.colorScheme.outline,
                    focusedTextColor = MaterialTheme.colorScheme.onSurface,
                    unfocusedTextColor = MaterialTheme.colorScheme.onSurface,
                    cursorColor = BleuAccent,
                ),
                shape = RoundedCornerShape(12.dp),
            )
        }

        Spacer(Modifier.height(14.dp))

        // Main Activity Card
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
                        text = "Activité récente",
                        color = MaterialTheme.colorScheme.onSurface,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        text = "plus récentes",
                        color = BleuAccent,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                Spacer(Modifier.height(12.dp))

                if (tachesVisibles.isEmpty()) {
                    Text(
                        text = "Aucune tâche reçue pour le moment.",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 13.sp,
                        modifier = Modifier.padding(vertical = 16.dp),
                    )
                } else {
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        items(tachesVisibles, key = { it.id }) { tache ->
                            LigneTacheCapture(tache = tache)
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

        // Bouton effacer l'historique des tâches
        OutlinedButton(
            onClick = {
                if (confirmerVidage) {
                    aVider()
                    confirmerVidage = false
                } else {
                    confirmerVidage = true
                }
            },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
        ) {
            Icon(Icons.Filled.Delete, contentDescription = null, modifier = Modifier.size(16.dp))
            Spacer(Modifier.width(6.dp))
            Text(
                if (confirmerVidage) "Confirmer la suppression ?" else "Effacer l'historique des tâches",
                color = if (confirmerVidage) RougeAccent else MaterialTheme.colorScheme.onSurface,
            )
        }
    }
}

@Composable
private fun LigneTacheCapture(tache: TacheHistorique) {
    val statut = statutTacheDe(tache.statut)
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Surface(
            color = statut.couleur.copy(alpha = 0.12f),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.size(38.dp)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = Icons.Filled.Mail,
                    contentDescription = null,
                    tint = statut.couleur,
                    modifier = Modifier.size(18.dp)
                )
            }
        }
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = tache.numeroDestinataire,
                color = MaterialTheme.colorScheme.onSurface,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
            )
            Spacer(Modifier.height(2.dp))
            Text(
                text = tache.message,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 11.sp,
                maxLines = 1,
            )
            if (!tache.erreur.isNullOrBlank()) {
                Text(
                    text = tache.erreur,
                    color = MaterialTheme.colorScheme.error,
                    fontSize = 10.sp,
                    maxLines = 1,
                )
            }
        }
        Spacer(Modifier.width(8.dp))
        Column(horizontalAlignment = Alignment.End) {
            Text(
                text = UtilitairesTemps.formaterHeure(tache.horodatage).take(5),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 10.sp,
            )
            Spacer(Modifier.height(4.dp))
            Surface(
                color = statut.couleur.copy(alpha = 0.12f),
                shape = CircleShape
            ) {
                Text(
                    text = statut.label,
                    color = statut.couleur,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                )
            }
        }
    }
}
