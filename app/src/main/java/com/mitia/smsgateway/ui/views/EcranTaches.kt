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
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Inbox
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
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
import java.util.Calendar
import com.mitia.smsgateway.domain.model.Statuts
import com.mitia.smsgateway.domain.model.TacheHistorique
import com.mitia.smsgateway.ui.components.CarteGlass
import com.mitia.smsgateway.ui.components.ChipStatut
import com.mitia.smsgateway.ui.components.TonaliteChip
import com.mitia.smsgateway.ui.theme.*

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
            // En-tête : Tuile header indigo + Tâches reçues + Bouton Recherche en cercle blanc
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
                        text = "Tâches reçues",
                        color = TexteTitreClair,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.ExtraBold,
                    )
                    Spacer(Modifier.height(2.dp))
                    Text(
                        text = "Messages traités par l'appareil · $texteDerniereSynchro",
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
                    IconButton(onClick = { rechercheVisible = !rechercheVisible }, modifier = Modifier.size(40.dp)) {
                        Icon(
                            imageVector = Icons.Filled.Search,
                            contentDescription = "Rechercher",
                            tint = TexteTitreClair,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            // Carte sombre dégradé navy (cohérent serveur web : indigo-950 → #110C2E)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(8.dp, RoundedCornerShape(20.dp), spotColor = FondDarkCardEnd.copy(alpha = 0.3f))
                    .clip(RoundedCornerShape(20.dp))
                    .background(
                        Brush.linearGradient(
                            colors = listOf(FondDarkCardStart, FondDarkCardEnd),
                            start = androidx.compose.ui.geometry.Offset(0f, 0f),
                            end = androidx.compose.ui.geometry.Offset(1000f, 1000f)
                        )
                    )
                    .border(1.dp, Color(0x33FFFFFF), RoundedCornerShape(20.dp))
                    .padding(20.dp)
            ) {
                // Ligne de lumière supérieure
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(1.dp)
                        .background(
                            Brush.horizontalGradient(
                                colors = listOf(Color.Transparent, Color.White.copy(alpha = 0.9f), Color.Transparent)
                            )
                        )
                        .align(Alignment.TopCenter)
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(
                            text = "$totalAujourdhui",
                            color = Color.White,
                            fontSize = 32.sp,
                            fontWeight = FontWeight.ExtraBold,
                        )
                        Spacer(Modifier.height(2.dp))
                        Text(
                            text = "tâches reçues aujourd'hui",
                            color = Color.White.copy(alpha = 0.7f),
                            fontSize = 11.5.sp,
                        )
                    }

                    ChipStatut(
                        libelle = "✓ tout est traité",
                        tonalite = TonaliteChip.VERT,
                    )
                }
            }

            Spacer(Modifier.height(14.dp))

            // 3 Onglets pilules (Toutes · 0 actif / En attente · 0 / Échecs · 0)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                PiluleFiltre(
                    libelle = "Toutes · $totalAujourdhui",
                    selectionne = filtre == null,
                    auClic = { filtre = null }
                )
                PiluleFiltre(
                    libelle = "En attente · $enAttenteCount",
                    selectionne = filtre == Statuts.EN_ATTENTE,
                    auClic = { filtre = Statuts.EN_ATTENTE }
                )
                PiluleFiltre(
                    libelle = "Échecs · $echecsCount",
                    selectionne = filtre == Statuts.ECHOUE,
                    auClic = { filtre = Statuts.ECHOUE }
                )
            }

            if (rechercheVisible) {
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = recherche,
                    onValueChange = { recherche = it },
                    placeholder = { Text("Rechercher numéro ou message…", color = TexteSousTitreClair) },
                    leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null, tint = TexteSousTitreClair) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = FondInputClair,
                        unfocusedContainerColor = FondInputClair,
                        focusedBorderColor = GradientIndigoStart,
                        unfocusedBorderColor = BordureInputClair,
                        focusedTextColor = TexteTitreClair,
                        unfocusedTextColor = TexteTitreClair,
                        cursorColor = GradientIndigoStart,
                    ),
                    shape = RoundedCornerShape(13.dp),
                )
            }

            Spacer(Modifier.height(16.dp))

            // Section Activité récente + lien "plus récentes"
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Activité récente",
                    color = TexteTitreClair,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = "plus récentes",
                    color = GradientIndigoStart,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.clickable {}
                )
            }

            Spacer(Modifier.height(10.dp))

            // Carte liste avec exemple récent + État vide « Tout est à jour »
            CarteGlass(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(vertical = 4.dp)) {
                    // Ligne d'exemple récente (comme sur la capture : 0345726237 + commande reçu)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(VertPastelBg)
                                .border(1.dp, VertPastelBordure, RoundedCornerShape(12.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Inbox,
                                contentDescription = null,
                                tint = VertPastelTexte,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Spacer(Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "0345726237",
                                color = TexteTitreClair,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                            )
                            Spacer(Modifier.height(2.dp))
                            Text(
                                text = "commande reçu",
                                color = TexteSousTitreClair,
                                fontSize = 12.sp,
                            )
                        }
                        Spacer(Modifier.width(8.dp))
                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                text = "08:56",
                                color = TexteSousTitreClair,
                                fontSize = 11.sp,
                            )
                            Spacer(Modifier.height(4.dp))
                            ChipStatut(libelle = "envoyé", tonalite = TonaliteChip.VERT)
                        }
                    }

                    Spacer(Modifier.height(14.dp))
                    HorizontalDivider(color = BordureCarteClair, thickness = 1.dp)
                    Spacer(Modifier.height(18.dp))

                    // État vide : cercle gris avec icône avion, "Tout est à jour" + sous-titre
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Box(
                            modifier = Modifier
                                .size(50.dp)
                                .clip(CircleShape)
                                .background(Color(0xFFF1F5F9)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.Send,
                                contentDescription = null,
                                tint = TexteSousTitreClair,
                                modifier = Modifier.size(22.dp)
                            )
                        }
                        Spacer(Modifier.height(12.dp))
                        Text(
                            text = "Tout est à jour",
                            color = TexteTitreClair,
                            fontSize = 14.5.sp,
                            fontWeight = FontWeight.Bold,
                        )
                        Spacer(Modifier.height(2.dp))
                        Text(
                            text = "Les prochaines tâches apparaîtront ici automatiquement",
                            color = TexteSousTitreClair,
                            fontSize = 11.5.sp,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                        )
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            // Bouton ghost rouge « Effacer l'historique des tâches »
            Box(
                modifier = Modifier
                    .fillMaxWidth()
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
                    Icon(
                        imageVector = Icons.Filled.Delete,
                        contentDescription = null,
                        tint = RougePastelTexte,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(
                        if (confirmerVidage) "Confirmer la suppression ?" else "Effacer l'historique des tâches",
                        color = RougePastelTexte,
                        fontSize = 13.5.sp,
                        fontWeight = FontWeight.Bold
                    )
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
