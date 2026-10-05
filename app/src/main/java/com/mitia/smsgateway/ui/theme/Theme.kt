package com.mitia.smsgateway.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val SchemeCouleursSombres = darkColorScheme(
    primary = BleuAccent,
    secondary = VertAccent,
    tertiary = AmbreAccent,
    background = FondSombre,
    surface = FondCarte,
    surfaceVariant = FondCarteClair,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = TextePrincipal,
    onSurface = TextePrincipal,
    onSurfaceVariant = TexteAttenue,
    outline = CouleurBordure,
)

private val SchemeCouleursClaires = lightColorScheme(
    primary = BleuAccent,
    secondary = VertAccent,
    tertiary = AmbreAccent,
    background = FondClair,
    surface = FondCarteClairMode,
    surfaceVariant = Color(0xFFF1F5F9),
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = TextePrincipalClair,
    onSurface = TextePrincipalClair,
    onSurfaceVariant = TexteAttenueClair,
    outline = CouleurBordureClair,
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
