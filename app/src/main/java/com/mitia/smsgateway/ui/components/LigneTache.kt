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
import com.mitia.smsgateway.ui.theme.AmbreAccent
import com.mitia.smsgateway.domain.model.Statuts
import com.mitia.smsgateway.ui.theme.BleuAccent
import com.mitia.smsgateway.ui.theme.VertAccent
import com.mitia.smsgateway.ui.theme.RougeAccent
import com.mitia.smsgateway.ui.theme.TexteAttenue
import com.mitia.smsgateway.ui.theme.TextePrincipal
import com.mitia.smsgateway.ui.theme.TexteSecondaire

enum class StatutTache(val label: String, val couleur: Color) {
    ENVOYE("envoyé", VertAccent),
    EN_ATTENTE("en attente", AmbreAccent),
    EN_COURS("envoi…", BleuAccent),
    ECHOUE("échec", RougeAccent),
}

fun statutTacheDe(statut: String): StatutTache = when (statut) {
    Statuts.ENVOYE -> StatutTache.ENVOYE
    Statuts.RECLAME -> StatutTache.EN_COURS
    Statuts.ECHOUE -> StatutTache.ECHOUE
    else -> StatutTache.EN_ATTENTE
}

@Composable
fun LigneTache(
    numero: String,
    message: String,
    statut: StatutTache,
    modifier: Modifier = Modifier,
    erreur: String? = null,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // Icône enveloppe teintée par statut
        Box(
            modifier = Modifier
                .size(38.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(statut.couleur.copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = Icons.Filled.Email,
                contentDescription = null,
                tint = statut.couleur,
                modifier = Modifier.size(18.dp),
            )
        }
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = numero,
                color = TextePrincipal,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
            )
            Spacer(Modifier.height(2.dp))
            Text(
                text = message,
                color = TexteAttenue,
                fontSize = 12.sp,
                maxLines = 1,
            )
            if (statut == StatutTache.ECHOUE && !erreur.isNullOrBlank()) {
                Spacer(Modifier.height(2.dp))
                Text(
                    text = erreur,
                    color = RougeAccent,
                    fontSize = 11.sp,
                    maxLines = 1,
                )
            }
        }
        Surface(
            color = statut.couleur.copy(alpha = 0.15f),
            shape = RoundedCornerShape(8.dp),
        ) {
            Text(
                text = statut.label,
                color = statut.couleur,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
            )
        }
    }
}
