package com.mitia.smsgateway.ui.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mitia.smsgateway.ui.theme.AccentAmber
import com.mitia.smsgateway.ui.theme.AccentGreen
import com.mitia.smsgateway.ui.theme.AccentRed
import com.mitia.smsgateway.ui.theme.CardBg
import com.mitia.smsgateway.ui.theme.TextMuted
import com.mitia.smsgateway.ui.theme.TextSecondary

data class LogEntry(
    val time: String,
    val message: String,
    val level: LogLevel = LogLevel.INFO,
)

enum class LogLevel(val color: Color) {
    INFO(TextSecondary),
    SUCCESS(AccentGreen),
    WARNING(AccentAmber),
    ERROR(AccentRed),
}

/** Niveau déduit du contenu (mêmes libellés que le service Android). */
fun logLevelOf(message: String): LogLevel = when {
    message.contains("échoué") || message.contains("échec") || message.contains("impossible") -> LogLevel.ERROR
    message.contains("enregistré") && message.contains("échec") -> LogLevel.ERROR
    message.contains("ok") || message.contains("transmis") || message.contains("rétablie")
        || message.contains("réinitialisé") || message.contains("envoyé") -> LogLevel.SUCCESS
    message.contains("perdu") || message.contains("atteint") -> LogLevel.WARNING
    else -> LogLevel.INFO
}

@Composable
fun LogRow(entry: LogEntry, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        color = CardBg,
        shape = RoundedCornerShape(10.dp),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
        ) {
            Text(
                text = entry.time,
                color = TextMuted,
                fontSize = 11.sp,
                fontFamily = FontFamily.Monospace,
            )
            Spacer(Modifier.height(4.dp))
            Text(
                text = entry.message,
                color = entry.level.color,
                fontSize = 13.sp,
                fontFamily = FontFamily.Monospace,
                lineHeight = 18.sp,
            )
        }
    }
}
