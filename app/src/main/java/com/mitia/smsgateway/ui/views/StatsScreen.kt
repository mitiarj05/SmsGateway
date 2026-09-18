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
import com.mitia.smsgateway.data.local.TaskHistoryStore
import com.mitia.smsgateway.domain.model.DayStat
import com.mitia.smsgateway.ui.components.KpiCard
import com.mitia.smsgateway.ui.theme.AccentGreen
import com.mitia.smsgateway.ui.theme.AccentRed
import com.mitia.smsgateway.ui.theme.CardBg
import com.mitia.smsgateway.ui.theme.DarkBg
import com.mitia.smsgateway.ui.theme.TextMuted
import com.mitia.smsgateway.ui.theme.TextPrimary
import java.util.Locale

/**
 * Performances locales : volume 7 jours + taux de réussite.
 * 100 % local (TaskHistoryStore), idéal en démo sans réseau.
 */
@Composable
fun StatsScreen(modifier: Modifier = Modifier) {
    val context = LocalContext.current
    var stats by remember { mutableStateOf(emptyList<DayStat>()) }
    var rate by remember { mutableStateOf(-1.0) }

    LaunchedEffect(Unit) {
        stats = TaskHistoryStore.statsLast7Days(context)
        rate = TaskHistoryStore.successRate7d(context)
    }

    val sentTotal = stats.sumOf { it.sent }
    val failedTotal = stats.sumOf { it.failed }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(DarkBg)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
    ) {
        Text(
            text = "performances",
            color = TextPrimary,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
        )
        Text(
            text = "7 derniers jours · calculé sur l'appareil",
            color = TextMuted,
            fontSize = 12.sp,
        )
        Spacer(Modifier.height(16.dp))

        // Taux de réussite
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = CardBg,
            shape = RoundedCornerShape(16.dp),
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(text = "taux de réussite", color = TextMuted, fontSize = 12.sp)
                Text(
                    text = if (rate < 0) "—"
                    else String.format(Locale.FRANCE, "%.1f %%", rate),
                    color = if (rate < 0 || rate >= 90) AccentGreen else AccentRed,
                    fontSize = 34.sp,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = "$sentTotal envoyé(s) · $failedTotal échec(s)",
                    color = TextMuted,
                    fontSize = 12.sp,
                )
            }
        }
        Spacer(Modifier.height(12.dp))

        // Graphique en barres empilées (vert = envoyés, rouge = échecs)
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = CardBg,
            shape = RoundedCornerShape(16.dp),
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(text = "volume par jour", color = TextMuted, fontSize = 12.sp)
                Spacer(Modifier.height(12.dp))
                val max = (stats.maxOfOrNull { it.sent + it.failed } ?: 0).coerceAtLeast(1)
                Canvas(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(170.dp)
                ) {
                    val slot = size.width / stats.size.coerceAtLeast(1)
                    val barW = slot * 0.5f
                    stats.forEachIndexed { i, d ->
                        val total = d.sent + d.failed
                        val totalH = if (total == 0) 6f else total / max.toFloat() * size.height
                        val sentH = if (total == 0) 0f else d.sent / max.toFloat() * size.height
                        val x = i * slot + (slot - barW) / 2f
                        val alpha = if (total == 0) 0.25f else 1f
                        drawRoundRect(
                            color = AccentRed.copy(alpha = alpha),
                            topLeft = Offset(x, size.height - totalH),
                            size = Size(barW, totalH),
                            cornerRadius = CornerRadius(6f, 6f),
                        )
                        drawRoundRect(
                            color = AccentGreen.copy(alpha = alpha),
                            topLeft = Offset(x, size.height - sentH),
                            size = Size(barW, sentH),
                            cornerRadius = CornerRadius(6f, 6f),
                        )
                    }
                }
                Spacer(Modifier.height(8.dp))
                Row(modifier = Modifier.fillMaxWidth()) {
                    stats.forEach { d ->
                        Text(
                            text = d.label,
                            color = TextMuted,
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
            KpiCard(
                value = "$sentTotal",
                label = "sms envoyés (7 j)",
                modifier = Modifier.weight(1f),
            )
            KpiCard(
                value = "$failedTotal",
                label = "échecs (7 j)",
                modifier = Modifier.weight(1f),
            )
        }
        Spacer(Modifier.height(12.dp))
        Text(
            text = "vert = envoyés · rouge = échecs",
            color = TextMuted,
            fontSize = 11.sp,
        )
    }
}
