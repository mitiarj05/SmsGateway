package com.mitia.smsgateway.ui.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.mitia.smsgateway.ui.theme.FondCarte
import com.mitia.smsgateway.ui.theme.TexteAttenue
import com.mitia.smsgateway.ui.theme.TextePrincipal

@Composable
fun CarteKpi(
    valeur: String,
    etiquette: String,
    modifier: Modifier = Modifier,
    icone: ImageVector? = null,
) {
    Surface(
        modifier = modifier,
        color = FondCarte,
        shape = RoundedCornerShape(16.dp),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
        ) {
            if (icone != null) {
                Icon(
                    imageVector = icone,
                    contentDescription = null,
                    tint = TexteAttenue,
                    modifier = Modifier.size(18.dp),
                )
                Spacer(Modifier.height(8.dp))
            }
            Text(
                text = valeur,
                color = TextePrincipal,
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text = etiquette,
                color = TexteAttenue,
                fontSize = 12.sp,
                lineHeight = 16.sp,
            )
        }
    }
}

/** Ligne icône + libellé (statut, réseau, batterie…). */
@Composable
fun LigneInfo(
    icone: ImageVector,
    texte: String,
    teinte: androidx.compose.ui.graphics.Color = TexteAttenue,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(
            imageVector = icone,
            contentDescription = null,
            tint = teinte,
            modifier = Modifier.size(18.dp),
        )
        Spacer(Modifier.width(10.dp))
        Text(
            text = texte,
            color = TextePrincipal,
            fontSize = 13.sp,
        )
    }
}
