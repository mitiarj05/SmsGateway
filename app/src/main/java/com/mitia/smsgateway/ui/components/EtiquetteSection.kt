package com.mitia.smsgateway.ui.components

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mitia.smsgateway.ui.theme.TexteAttenue

/**
 * Micro-label de section (style overline) : petites capitales espacées,
 * comme l'esthétique du tableau de bord web.
 */
@Composable
fun EtiquetteSection(
    texte: String,
    modifier: Modifier = Modifier,
) {
    Text(
        text = texte.uppercase(),
        color = TexteAttenue,
        fontSize = 11.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = 1.5.sp,
        textAlign = TextAlign.Start,
        modifier = modifier.padding(bottom = 8.dp),
    )
}
