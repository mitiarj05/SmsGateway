package com.mitia.smsgateway.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mitia.smsgateway.ui.theme.*

/**
 * Carte Design System Clair : Fond Blanc, Bordure 1px #F1F5F9, Rayon 20px, Ombre Douce + Ligne de lumière supérieure
 */
@Composable
fun CarteGlass(
    modifier: Modifier = Modifier,
    glow: Color? = null,
    couleurBordure: Color = BordureCarteClair,
    fond: Color = BlancCarte,
    coins: Dp = 20.dp,
    contenu: @Composable () -> Unit
) {
    val bordureEffective = glow ?: couleurBordure

    Box(
        modifier = modifier
            .shadow(
                elevation = 8.dp,
                shape = RoundedCornerShape(coins),
                ambientColor = Color(0xFF23204D).copy(alpha = 0.08f),
                spotColor = Color(0xFF23204D).copy(alpha = 0.08f)
            )
            .clip(RoundedCornerShape(coins))
            .background(fond)
            .border(1.dp, bordureEffective, RoundedCornerShape(coins))
            .padding(16.dp)
    ) {
        // Ligne de lumière supérieure (transparent -> blanc 0.9 -> transparent)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(1.dp)
                .background(
                    Brush.horizontalGradient(
                        colors = listOf(Color.Transparent, Color.White.copy(alpha = 0.9f), Color.Transparent)
                    )
                )
                .align(Alignment.TopCenter)
        )
        contenu()
    }
}

// Alias pour rétrocompatibilité
@Composable
fun CarteSombre(modifier: Modifier = Modifier, glow: Color? = null, contenu: @Composable () -> Unit) =
    CarteGlass(modifier = modifier, glow = glow, contenu = contenu)

/**
 * Chip de Statut Pastel (Vert / Ambre / Rouge / Violet) avec point 5px
 */
enum class TonaliteChip { VERT, AMBRE, ROUGE, VIOLET }

@Composable
fun ChipStatut(
    libelle: String,
    tonalite: TonaliteChip,
    modifier: Modifier = Modifier,
    pulse: Boolean = false,
) {
    val (couleurTexte, couleurFond, couleurBordure) = when (tonalite) {
        TonaliteChip.VERT -> Triple(VertPastelTexte, VertPastelBg, VertPastelBordure)
        TonaliteChip.AMBRE -> Triple(AmbrePastelTexte, AmbrePastelBg, AmbrePastelBordure)
        TonaliteChip.ROUGE -> Triple(RougePastelTexte, RougePastelBg, RougePastelBordure)
        TonaliteChip.VIOLET -> Triple(VioletPastelTexte, VioletPastelBg, VioletPastelBordure)
    }

    Box(
        modifier = modifier
            .clip(CircleShape)
            .background(couleurFond)
            .border(1.dp, couleurBordure, CircleShape)
            .padding(horizontal = 11.dp, vertical = 5.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(5.dp)
                    .clip(CircleShape)
                    .background(couleurTexte)
            )
            Spacer(Modifier.width(6.dp))
            Text(
                text = libelle,
                color = couleurTexte,
                fontSize = 10.5.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

/**
 * Bouton Principal Dégradé 135° #6A6AE0 → #4C4CC9
 */
@Composable
fun BoutonNeon(
    libelle: String,
    auClic: () -> Unit,
    modifier: Modifier = Modifier,
    actif: Boolean = true,
) {
    val gradient = Brush.linearGradient(
        colors = listOf(GradientIndigoStart, GradientIndigoEnd),
        start = androidx.compose.ui.geometry.Offset(0f, 0f),
        end = androidx.compose.ui.geometry.Offset(1000f, 1000f)
    )

    Box(
        modifier = modifier
            .shadow(16.dp, RoundedCornerShape(14.dp), spotColor = NeonShadowColor)
            .clip(RoundedCornerShape(14.dp))
            .background(gradient)
            .clickable(enabled = actif, onClick = auClic)
            .padding(vertical = 12.dp, horizontal = 20.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = libelle,
            color = Color.White,
            fontWeight = FontWeight.Bold,
            fontSize = 13.5.sp
        )
    }
}
