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
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Smartphone
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Icon
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
import com.mitia.smsgateway.ui.theme.FondCarte
import com.mitia.smsgateway.ui.theme.TexteAttenue
import com.mitia.smsgateway.ui.theme.TextePrincipal

enum class OngletTableauDeBord(val label: String, val icone: ImageVector) {
    STATUT("statut", Icons.Filled.Smartphone),
    TACHES("tâches", Icons.Filled.List),
    JOURNAL("journal", Icons.Filled.History),
    DIAGNOSTIC("diag", Icons.Filled.Info),
    STATS("stats", Icons.Filled.BarChart),
    REGLAGES("réglages", Icons.Filled.Settings),
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
        color = FondCarte,
        tonalElevation = 4.dp,
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp),
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
    val teinte = if (selectionne) BleuAccent else TexteAttenue

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clickable(onClick = auClic)
            .padding(horizontal = 8.dp),
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
                    color = BleuAccent.copy(alpha = 0.18f),
                    shape = CircleShape,
                ) {
                    Icon(
                        imageVector = onglet.icone,
                        contentDescription = onglet.label,
                        tint = teinte,
                        modifier = Modifier
                            .padding(7.dp)
                            .size(20.dp),
                    )
                }
            } else {
                Icon(
                    imageVector = onglet.icone,
                    contentDescription = onglet.label,
                    tint = teinte,
                    modifier = Modifier.size(22.dp),
                )
            }
        }
        Spacer(Modifier.height(4.dp))
        Text(
            text = onglet.label,
            color = teinte,
            fontSize = 11.sp,
            fontWeight = if (selectionne) FontWeight.SemiBold else FontWeight.Normal,
        )
    }
}
