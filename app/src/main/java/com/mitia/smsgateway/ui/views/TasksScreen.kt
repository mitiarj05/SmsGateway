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
import com.mitia.smsgateway.ui.components.SectionLabel
import com.mitia.smsgateway.ui.theme.AccentBlue
import com.mitia.smsgateway.ui.theme.BorderColor
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mitia.smsgateway.domain.model.HistoryTask
import com.mitia.smsgateway.ui.components.TaskRow
import com.mitia.smsgateway.ui.components.taskStatusOf
import com.mitia.smsgateway.ui.theme.BorderColor
import com.mitia.smsgateway.ui.theme.CardBg
import com.mitia.smsgateway.ui.theme.DarkBg
import com.mitia.smsgateway.ui.theme.TextMuted
import com.mitia.smsgateway.ui.theme.TextPrimary

@Composable
fun TasksScreen(
    tasks: List<HistoryTask>,
    lastSyncText: String,
    modifier: Modifier = Modifier,
) {
    var filter by remember { mutableStateOf<String?>(null) }
    var query by remember { mutableStateOf("") }
    val visibleTasks = remember(tasks, filter, query) {
        val q = query.trim().lowercase()
        tasks.filter { t ->
            val matchFilter = when (filter) {
                "SENT" -> t.statut == "SENT"
                "PENDING" -> t.statut == "PENDING" || t.statut == "SENDING"
                "FAILED" -> t.statut == "FAILED"
                else -> true
            }
            matchFilter && (q.isEmpty()
                || t.numero.contains(q, ignoreCase = true)
                || t.message.lowercase().contains(q))
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(DarkBg)
            .padding(16.dp),
    ) {
        Text(
            text = "tâches reçues",
            color = TextPrimary,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
        )
        Spacer(Modifier.height(4.dp))
        Text(
            text = "synchronisées avec le serveur · $lastSyncText",
            color = TextMuted,
            fontSize = 12.sp,
        )
        Spacer(Modifier.height(12.dp))

        // Filtres par statut
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {            FilterChip(
                selected = filter == null,
                onClick = { filter = null },
                label = { Text("Tous (${tasks.size})") },
            )
            FilterChip(
                selected = filter == "SENT",
                onClick = { filter = "SENT" },
                label = { Text("Envoyés") },
            )
            FilterChip(
                selected = filter == "PENDING",
                onClick = { filter = "PENDING" },
                label = { Text("En attente") },
            )
            FilterChip(
                selected = filter == "FAILED",
                onClick = { filter = "FAILED" },
                label = { Text("Échecs") },
            )
        }
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            value = query,
            onValueChange = { query = it },
            placeholder = { Text("Rechercher numéro ou message…") },
            leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null) },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = CardBg,
                unfocusedContainerColor = CardBg,
                focusedBorderColor = AccentBlue,
                unfocusedBorderColor = BorderColor,
                focusedTextColor = TextPrimary,
                unfocusedTextColor = TextPrimary,
                cursorColor = AccentBlue,
            ),
            shape = RoundedCornerShape(12.dp),
        )
        Spacer(Modifier.height(12.dp))

        SectionLabel(text = "Résultats (${visibleTasks.size})")

        if (visibleTasks.isEmpty()) {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = CardBg,
                shape = RoundedCornerShape(16.dp),
            ) {
                Text(
                    text = if (filter == null) "Aucune tâche reçue pour le moment."
                    else "Aucune tâche dans ce filtre.",
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
                LazyColumn {
                    items(visibleTasks, key = { it.id }) { task ->
                        TaskRow(
                            numero = task.numero,
                            message = task.message,
                            status = taskStatusOf(task.statut),
                            error = task.error,
                        )
                        HorizontalDivider(
                            color = BorderColor,
                            thickness = 0.5.dp,
                        )
                    }
                }
            }
        }

        Spacer(Modifier.height(12.dp))
        Text(
            text = "les tâches arrivent par notification push, même écran éteint",
            color = TextMuted,
            fontSize = 11.sp,
        )
    }
}
