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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mitia.smsgateway.ui.theme.AmbreAccent
import com.mitia.smsgateway.ui.theme.VertAccent
import com.mitia.smsgateway.ui.theme.RougeAccent
import com.mitia.smsgateway.ui.theme.FondCarte
import com.mitia.smsgateway.ui.theme.TexteAttenue
import com.mitia.smsgateway.ui.theme.TexteSecondaire

data class EntreeJournal(
    val heure: String,
    val message: String,
    val niveau: NiveauJournal = NiveauJournal.INFO,
)

enum class NiveauJournal(val couleur: Color) {
    INFO(TexteSecondaire),
    SUCCES(VertAccent),
    AVERTISSEMENT(AmbreAccent),
    ERREUR(RougeAccent),
}

/** Niveau déduit du contenu (mêmes libellés que le service Android). */
fun niveauJournalDe(message: String): NiveauJournal = when {
    message.contains("échoué") || message.contains("échec") || message.contains("impossible") -> NiveauJournal.ERREUR
    message.contains("enregistré") && message.contains("échec") -> NiveauJournal.ERREUR
    message.contains("ok") || message.contains("transmis") || message.contains("rétablie")
        || message.contains("réinitialisé") || message.contains("envoyé") -> NiveauJournal.SUCCES
    message.contains("perdu") || message.contains("atteint") -> NiveauJournal.AVERTISSEMENT
    else -> NiveauJournal.INFO
}

@Composable
fun LigneJournal(entree: EntreeJournal, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        color = FondCarte,
        shape = RoundedCornerShape(10.dp),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
        ) {
            Text(
                text = entree.heure,
                color = TexteAttenue,
                fontSize = 11.sp,
                fontFamily = FontFamily.Monospace,
            )
            Spacer(Modifier.height(4.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(entree.niveau.couleur),
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    text = entree.message,
                    color = entree.niveau.couleur,
                    fontSize = 13.sp,
                    fontFamily = FontFamily.Monospace,
                    lineHeight = 18.sp,
                )
            }
        }
    }
}
