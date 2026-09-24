package com.mitia.smsgateway.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val SchemeCouleursSombres = darkColorScheme(
    primary = BleuAccent,
    secondary = VertAccent,
    tertiary = AmbreAccent,
    background = FondSombre,
    surface = FondCarte,
    onPrimary = TextePrincipal,
    onSecondary = TextePrincipal,
    onBackground = TextePrincipal,
    onSurface = TextePrincipal,
)

@Composable
fun ThemePasserelleSms(
    themeSombre: Boolean = true, // interface forcée en sombre (tableau de bord)
    contenu: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = SchemeCouleursSombres,
        typography = Typography,
        content = contenu
    )
}
