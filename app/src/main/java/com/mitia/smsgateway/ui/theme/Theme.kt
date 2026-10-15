package com.mitia.smsgateway.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val SchemeCouleursSombres = darkColorScheme(
    primary = GradientIndigoStart,
    secondary = VertPastelTexte,
    tertiary = AmbrePastelTexte,
    background = FondSombre, // #0B0F19
    surface = FondCarte, // #131926
    surfaceVariant = FondSaisie, // #0F172A
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = Color.White,
    onSurface = Color.White,
    onSurfaceVariant = TexteSousTitreClair,
    secondaryContainer = TexteSousTitreClair,
    outline = CouleurBordure, // #1E293B
)

private val SchemeCouleursClaires = lightColorScheme(
    primary = GradientIndigoStart,
    secondary = VertPastelTexte,
    tertiary = AmbrePastelTexte,
    background = FondMobileClair, // #EDF1F9
    surface = BlancCarte, // #FFFFFF
    surfaceVariant = FondInputClair, // #F8FAFC
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = TexteTitreClair,
    onSurface = TexteTitreClair,
    onSurfaceVariant = TexteSousTitreClair,
    secondaryContainer = TexteSousTitreClair,
    outline = BordureCarteClair, // #F1F5F9
)

@Composable
fun ThemePasserelleSms(
    themeSombre: Boolean = true,
    contenu: @Composable () -> Unit
) {
    val scheme = if (themeSombre) SchemeCouleursSombres else SchemeCouleursClaires
    MaterialTheme(
        colorScheme = scheme,
        typography = Typography,
        content = contenu
    )
}
