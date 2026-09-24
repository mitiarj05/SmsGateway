package com.mitia.smsgateway.ui.views

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mitia.smsgateway.data.local.MagasinHistoriqueTaches
import com.mitia.smsgateway.domain.model.StatJournaliere
import com.mitia.smsgateway.ui.components.CarteKpi
import com.mitia.smsgateway.ui.theme.VertAccent
import com.mitia.smsgateway.ui.theme.RougeAccent
import com.mitia.smsgateway.ui.theme.FondCarte
import com.mitia.smsgateway.ui.theme.FondSombre
import com.mitia.smsgateway.ui.theme.TexteAttenue
import com.mitia.smsgateway.ui.theme.TextePrincipal
import java.util.Locale

/**
 * Performances locales : volume 7 jours + taux de réussite.
 * 100 % local (MagasinHistoriqueTaches), idéal en démo sans réseau.
 */
@Composable
fun EcranStats(modifier: Modifier = Modifier) {
    val context = LocalContext.current
    var statistiques by remember { mutableStateOf(emptyList<StatJournaliere>()) }
    var taux by remember { mutableStateOf(-1.0) }

    LaunchedEffect(Unit) {
        statistiques = MagasinHistoriqueTaches.stats7DerniersJours(context)
        taux = MagasinHistoriqueTaches.tauxReussite7j(context)
    }

    val totalEnvoyes = statistiques.sumOf { it.envoyes }
    val totalEchoues = statistiques.sumOf { it.echoues }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(FondSombre)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
    ) {
        Text(
            text = "performances",
            color = TextePrincipal,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
        )
        Text(
            text = "7 derniers jours · calculé sur l'appareil",
            color = TexteAttenue,
            fontSize = 12.sp,
        )
        Spacer(Modifier.height(16.dp))

        // Taux de réussite
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = FondCarte,
            shape = RoundedCornerShape(16.dp),
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(text = "taux de réussite", color = TexteAttenue, fontSize = 12.sp)
                Text(
                    text = if (taux < 0) "—"
                    else String.format(Locale.FRANCE, "%.1f %%", taux),
                    color = if (taux < 0 || taux >= 90) VertAccent else RougeAccent,
                    fontSize = 34.sp,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = "$totalEnvoyes envoyé(s) · $totalEchoues échec(s)",
                    color = TexteAttenue,
                    fontSize = 12.sp,
                )
            }
        }
        Spacer(Modifier.height(12.dp))

        // Graphique en barres empilées (vert = envoyés, rouge = échecs)
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = FondCarte,
            shape = RoundedCornerShape(16.dp),
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(text = "volume par jour", color = TexteAttenue, fontSize = 12.sp)
                Spacer(Modifier.height(12.dp))
                val maximum = (statistiques.maxOfOrNull { it.envoyes + it.echoues } ?: 0).coerceAtLeast(1)
                Canvas(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(170.dp)
                ) {
                    val emplacement = size.width / statistiques.size.coerceAtLeast(1)
                    val largeurBarre = emplacement * 0.5f
                    statistiques.forEachIndexed { i, jour ->
                        val total = jour.envoyes + jour.echoues
                        val hauteurTotale = if (total == 0) 6f else total / maximum.toFloat() * size.height
                        val hauteurEnvoyes = if (total == 0) 0f else jour.envoyes / maximum.toFloat() * size.height
                        val x = i * emplacement + (emplacement - largeurBarre) / 2f
                        val alpha = if (total == 0) 0.25f else 1f
                        drawRoundRect(
                            color = RougeAccent.copy(alpha = alpha),
                            topLeft = Offset(x, size.height - hauteurTotale),
                            size = Size(largeurBarre, hauteurTotale),
                            cornerRadius = CornerRadius(6f, 6f),
                        )
                        drawRoundRect(
                            color = VertAccent.copy(alpha = alpha),
                            topLeft = Offset(x, size.height - hauteurEnvoyes),
                            size = Size(largeurBarre, hauteurEnvoyes),
                            cornerRadius = CornerRadius(6f, 6f),
                        )
                    }
                }
                Spacer(Modifier.height(8.dp))
                Row(modifier = Modifier.fillMaxWidth()) {
                    statistiques.forEach { jour ->
                        Text(
                            text = jour.label,
                            color = TexteAttenue,
                            fontSize = 10.sp,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.weight(1f),
                        )
                    }
                }
            }
        }
        Spacer(Modifier.height(12.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            CarteKpi(
                valeur = "$totalEnvoyes",
                etiquette = "sms envoyés (7 j)",
                modifier = Modifier.weight(1f),
            )
            CarteKpi(
                valeur = "$totalEchoues",
                etiquette = "échecs (7 j)",
                modifier = Modifier.weight(1f),
            )
        }
        Spacer(Modifier.height(12.dp))
        Text(
            text = "vert = envoyés · rouge = échecs",
            color = TexteAttenue,
            fontSize = 11.sp,
        )
    }
}
