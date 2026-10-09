package com.mitia.smsgateway.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.FormatListNumbered
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.Inbox
import androidx.compose.material.icons.filled.LocalHospital
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mitia.smsgateway.ui.theme.*

enum class OngletTableauDeBord(val label: String, val icone: ImageVector) {
    STATUT("Statut", Icons.Filled.GridView),
    TACHES("Tâches", Icons.Filled.Inbox),
    JOURNAL("Journal", Icons.Filled.FormatListNumbered),
    DIAGNOSTIC("Diag.", Icons.Filled.LocalHospital),
    STATS("Perf.", Icons.Filled.BarChart),
    REGLAGES("Param.", Icons.Filled.Settings),
}

@Composable
fun BarreNavigationBasse(
    selectionne: OngletTableauDeBord,
    auChoix: (OngletTableauDeBord) -> Unit,
    pastilles: Map<OngletTableauDeBord, Int> = emptyMap(),
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 10.dp)
            .clip(RoundedCornerShape(32.dp))
            .background(MaterialTheme.colorScheme.surface)
            .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(32.dp))
            .padding(vertical = 6.dp, horizontal = 4.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            OngletTableauDeBord.entries.forEach { onglet ->
                ElementNavigation(
                    onglet = onglet,
                    selectionne = onglet == selectionne,
                    compteurPastille = pastilles[onglet] ?: 0,
                    auClic = { auChoix(onglet) },
                    modifier = Modifier.weight(1f),
                )
            }
        }
    }
}

@Composable
private fun ElementNavigation(
    onglet: OngletTableauDeBord,
    selectionne: Boolean,
    compteurPastille: Int,
    auClic: () -> Unit,
    modifier: Modifier = Modifier,
) {
    // Actif en accent (lisible clair + sombre), inactif atténué.
    val teinte = if (selectionne) BleuAccent else MaterialTheme.colorScheme.onSurfaceVariant
    val indicateurGradient = Brush.horizontalGradient(listOf(BleuAccentFonce, GradientIndigoStart))

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = modifier
            .selectable(
                selected = selectionne,
                onClick = auClic,
                role = Role.Tab,
            )
            .padding(horizontal = 2.dp, vertical = 2.dp),
    ) {
        // Barre néon supérieure au-dessus de l'onglet actif
        if (selectionne) {
            Box(
                modifier = Modifier
                    .width(28.dp)
                    .height(3.dp)
                    .clip(CircleShape)
                    .background(indicateurGradient)
            )
            Spacer(Modifier.height(4.dp))
        } else {
            Spacer(Modifier.height(7.dp))
        }

        BadgedBox(
            badge = {
                if (compteurPastille > 0) {
                    Badge(
                        containerColor = NeonRed,
                        contentColor = Color.White,
                    ) {
                        Text(
                            if (compteurPastille > 99) "99+" else "$compteurPastille",
                            fontWeight = FontWeight.Bold,
                            fontSize = 10.sp
                        )
                    }
                }
            }
        ) {
            Icon(
                imageVector = onglet.icone,
                contentDescription = onglet.label,
                tint = teinte,
                modifier = Modifier.size(20.dp),
            )
        }
        Spacer(Modifier.height(4.dp))
        Text(
            text = onglet.label,
            color = teinte,
            fontSize = 10.sp,
            fontWeight = if (selectionne) FontWeight.Bold else FontWeight.Normal,
            maxLines = 1,
        )
    }
}
