package com.mitia.smsgateway.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mitia.smsgateway.ui.theme.BleuAccent

enum class OngletTableauDeBord(val label: String, val icone: ImageVector) {
    STATUT("Statut", Icons.Filled.GridView),
    TACHES("Tâches", Icons.Filled.Inbox),
    JOURNAL("Journal", Icons.Filled.FormatListNumbered),
    DIAGNOSTIC("Diagnostic", Icons.Filled.LocalHospital),
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
    Surface(
        modifier = modifier.fillMaxWidth(),
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 8.dp,
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp, horizontal = 2.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            OngletTableauDeBord.entries.forEach { onglet ->
                ElementNavigation(
                    onglet = onglet,
                    selectionne = onglet == selectionne,
                    compteurPastille = pastilles[onglet] ?: 0,
                    auClic = { auChoix(onglet) },
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
) {
    val teinte = if (selectionne) BleuAccent else MaterialTheme.colorScheme.onSurfaceVariant

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clickable(onClick = auClic)
            .padding(horizontal = 4.dp, vertical = 2.dp),
    ) {
        BadgedBox(
            badge = {
                if (compteurPastille > 0) {
                    Badge { Text(if (compteurPastille > 99) "99+" else "$compteurPastille") }
                }
            }
        ) {
            if (selectionne) {
                Surface(
                    color = BleuAccent.copy(alpha = 0.12f),
                    shape = CircleShape,
                ) {
                    Icon(
                        imageVector = onglet.icone,
                        contentDescription = onglet.label,
                        tint = BleuAccent,
                        modifier = Modifier
                            .padding(6.dp)
                            .size(20.dp),
                    )
                }
            } else {
                Icon(
                    imageVector = onglet.icone,
                    contentDescription = onglet.label,
                    tint = teinte,
                    modifier = Modifier.size(20.dp),
                )
            }
        }
        Spacer(Modifier.height(4.dp))
        Text(
            text = onglet.label,
            color = teinte,
            fontSize = 10.sp,
            fontWeight = if (selectionne) FontWeight.Bold else FontWeight.Medium,
        )
    }
}
