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
import com.mitia.smsgateway.domain.model.EventItem
import com.mitia.smsgateway.ui.components.LogLevel
import com.mitia.smsgateway.ui.components.LogRow
import com.mitia.smsgateway.ui.components.logLevelOf
import com.mitia.smsgateway.util.TimeUtils
import com.mitia.smsgateway.ui.theme.AccentRed
import com.mitia.smsgateway.ui.theme.CardBg
import com.mitia.smsgateway.ui.theme.DarkBg
import com.mitia.smsgateway.ui.theme.TextMuted
import com.mitia.smsgateway.ui.theme.TextPrimary

@Composable
fun LogScreen(
    events: List<EventItem>,
    onExport: () -> Unit,
    onClear: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var errorsOnly by remember { mutableStateOf(false) }
    var confirmClear by remember { mutableStateOf(false) }
    val errorCount = remember(events) {
        events.count { logLevelOf(it.msg) == LogLevel.ERROR }
    }
    val visibleEvents = remember(events, errorsOnly) {
        if (errorsOnly) events.filter { logLevelOf(it.msg) == LogLevel.ERROR }
        else events
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(DarkBg)
            .padding(16.dp),
    ) {
        Text(
            text = "journal",
            color = TextPrimary,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
        )
        Spacer(Modifier.height(4.dp))
        Text(
            text = "derniers événements · conservé sur l'appareil",
            color = TextMuted,
            fontSize = 12.sp,
        )
        Spacer(Modifier.height(12.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            OutlinedButton(onClick = onExport, modifier = Modifier.weight(1f)) {
                Text("exporter le journal")
            }
            OutlinedButton(
                onClick = {
                    if (confirmClear) {
                        onClear()
                        confirmClear = false
                    } else {
                        confirmClear = true
                    }
                },
                modifier = Modifier.weight(1f),
            ) {
                Text(
                    if (confirmClear) "confirmer ?" else "vider",
                    color = if (confirmClear) AccentRed else TextPrimary,
                )
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterChip(
                selected = !errorsOnly,
                onClick = { errorsOnly = false },
                label = { Text("Tous (${events.size})") },
            )
            FilterChip(
                selected = errorsOnly,
                onClick = { errorsOnly = true },
                label = { Text("Erreurs ($errorCount)") },
            )
        }
        Spacer(Modifier.height(12.dp))

        if (visibleEvents.isEmpty()) {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = CardBg,
                shape = RoundedCornerShape(16.dp),
            ) {
                Text(
                    text = if (errorsOnly) "Aucune erreur enregistrée."
                    else "Journal vide — démarre le service pour voir les événements.",
                    color = TextMuted,
                    fontSize = 13.sp,
                    modifier = Modifier.padding(16.dp),
                )
            }
        } else {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = CardBg,
                shape = RoundedCornerShape(16.dp),
            ) {
                LazyColumn(
                    modifier = Modifier.padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    items(visibleEvents, key = { it.t to it.msg }) { event ->
                        LogRow(
                            entry = com.mitia.smsgateway.ui.components.LogEntry(
                                time = TimeUtils.formatTime(event.t),
                                message = event.msg,
                                level = logLevelOf(event.msg),
                            )
                        )
                    }
                }
            }
        }
    }
}
