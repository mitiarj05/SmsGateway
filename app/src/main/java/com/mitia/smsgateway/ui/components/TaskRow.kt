package com.mitia.smsgateway.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mitia.smsgateway.ui.theme.AccentAmber
import com.mitia.smsgateway.ui.theme.AccentBlue
import com.mitia.smsgateway.ui.theme.AccentGreen
import com.mitia.smsgateway.ui.theme.AccentRed
import com.mitia.smsgateway.ui.theme.TextMuted
import com.mitia.smsgateway.ui.theme.TextPrimary
import com.mitia.smsgateway.ui.theme.TextSecondary

enum class TaskStatus(val label: String, val color: Color) {
    SENT("envoyé", AccentGreen),
    PENDING("en attente", AccentAmber),
    SENDING("envoi…", AccentBlue),
    FAILED("échec", AccentRed),
}

fun taskStatusOf(statut: String): TaskStatus = when (statut) {
    "SENT" -> TaskStatus.SENT
    "SENDING" -> TaskStatus.SENDING
    "FAILED" -> TaskStatus.FAILED
    else -> TaskStatus.PENDING
}

@Composable
fun TaskRow(
    numero: String,
    message: String,
    status: TaskStatus,
    modifier: Modifier = Modifier,
    error: String? = null,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // Icône enveloppe
        Box(
            modifier = Modifier
                .size(38.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(Color(0xFF1E2433)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = Icons.Filled.Email,
                contentDescription = null,
                tint = TextSecondary,
                modifier = Modifier.size(18.dp),
            )
        }
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = numero,
                color = TextPrimary,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
            )
            Spacer(Modifier.height(2.dp))
            Text(
                text = message,
                color = TextMuted,
                fontSize = 12.sp,
                maxLines = 1,
            )
            if (status == TaskStatus.FAILED && !error.isNullOrBlank()) {
                Spacer(Modifier.height(2.dp))
                Text(
                    text = error,
                    color = AccentRed,
                    fontSize = 11.sp,
                    maxLines = 1,
                )
            }
        }
        Surface(
            color = status.color.copy(alpha = 0.15f),
            shape = RoundedCornerShape(8.dp),
        ) {
            Text(
                text = status.label,
                color = status.color,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
            )
        }
    }
}
