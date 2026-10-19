package com.mitia.smsgateway.ui.views

import android.content.ClipData
import android.content.ClipboardManager
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Message
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.TextButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mitia.smsgateway.ui.components.BoutonNeon
import com.mitia.smsgateway.ui.components.CarteGlass
import com.mitia.smsgateway.ui.components.ChipStatut
import com.mitia.smsgateway.ui.components.TonaliteChip
import com.mitia.smsgateway.ui.theme.*

@Composable
fun EcranParametres(
    urlServeur: String,
    auChangementUrlServeur: (String) -> Unit,
    jetonAppareil: String?,
    nomAppareil: String,
    auChangementNomAppareil: (String) -> Unit,
    quota: Int,
    usageQuota: Int,
    permissionSms: Boolean,
    permissionNotifications: Boolean,
    batterieOk: Boolean,
    message: String,
    aEnregistrerServeur: () -> Unit,
    aTesterConnexion: () -> Unit,
    aEnregistrerNom: () -> Unit,
    aReinitialiserAppareil: () -> Unit,
    aDeconnecter: () -> Unit,
    aDemanderPermissionSms: () -> Unit,
    aDemanderPermissionNotifications: () -> Unit,
    aOuvrirReglagesBatterie: () -> Unit,
    modifier: Modifier = Modifier,
    themeSombre: Boolean = true,
    auChangementTheme: () -> Unit = {},
    cadenceEnvoiMs: Int = 0,
    auChangementCadence: (Int) -> Unit = {},
) {
    val context = LocalContext.current
    var copie by remember { mutableStateOf(false) }
    var demarrageAuto by remember { mutableStateOf(true) }
    var confirmerDeconnexion by remember { mutableStateOf(false) }

    val isSombre = MaterialTheme.colorScheme.background.red < 0.2f

    val fondRougeBtn = if (isSombre) Color(0x22EF4444) else RougePastelBg
    val bordureRougeBtn = if (isSombre) Color(0x44EF4444) else RougePastelBordure
    val texteRougeBtn = if (isSombre) Color(0xFFF87171) else RougePastelTexte

    val prefIconBg = if (isSombre) Color(0x227C3AED) else VioletPastelBg
    val prefIconBd = if (isSombre) Color(0x44A78BFA) else VioletPastelBordure
    val prefIconTxt = if (isSombre) Color(0xFFA78BFA) else VioletPastelTexte

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(18.dp)
                .padding(top = 16.dp),
        ) {
            // En-tête : Tuile header indigo + Paramètres / Configuration SMSIKA
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .shadow(8.dp, RoundedCornerShape(15.dp), spotColor = NeonShadowColor)
                        .clip(RoundedCornerShape(15.dp))
                        .background(
                            Brush.linearGradient(
                                colors = listOf(GradientIndigoStart, GradientIndigoEnd),
                                start = androidx.compose.ui.geometry.Offset(0f, 0f),
                                end = androidx.compose.ui.geometry.Offset(100f, 100f)
                            )
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.Message,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                }
                Spacer(Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Paramètres",
                        color = MaterialTheme.colorScheme.onSurface,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.ExtraBold,
                    )
                    Spacer(Modifier.height(2.dp))
                    Text(
                        text = "Configuration SMSIKA",
                        color = MaterialTheme.colorScheme.secondaryContainer,
                        fontSize = 11.5.sp,
                    )
                }
            }

            Spacer(Modifier.height(16.dp))

            // Carte 1 : Connexion au serveur
            CarteGlass(modifier = Modifier.fillMaxWidth()) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "CONNEXION AU SERVEUR",
                            color = MaterialTheme.colorScheme.secondaryContainer,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.2.sp
                        )
                        ChipStatut(libelle = "HTTPS", tonalite = TonaliteChip.VIOLET)
                    }

                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("URL DU SERVEUR", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondaryContainer)
                        OutlinedTextField(
                            value = urlServeur.ifBlank { "https://sms-gateway-omega.vercel.app" },
                            onValueChange = auChangementUrlServeur,
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                                unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                                focusedBorderColor = GradientIndigoStart,
                                unfocusedBorderColor = MaterialTheme.colorScheme.outline,
                                focusedTextColor = MaterialTheme.colorScheme.onSurface,
                                unfocusedTextColor = MaterialTheme.colorScheme.onSurface,
                            ),
                            shape = RoundedCornerShape(13.dp)
                        )
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        BoutonNeon(
                            libelle = "enregistrer",
                            auClic = aEnregistrerServeur,
                            modifier = Modifier.weight(1f)
                        )

                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(14.dp))
                                .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(14.dp))
                                .background(MaterialTheme.colorScheme.surface)
                                .clickable(onClick = aTesterConnexion)
                                .padding(vertical = 12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Filled.Wifi, contentDescription = null, tint = MaterialTheme.colorScheme.onSurface, modifier = Modifier.size(15.dp))
                                Spacer(Modifier.width(6.dp))
                                Text("tester", color = MaterialTheme.colorScheme.onSurface, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    if (message.isNotEmpty()) {
                        Text(text = message, color = GradientIndigoStart, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                    }
                }
            }

            Spacer(Modifier.height(14.dp))

            // Carte 2 : Appareil
            CarteGlass(modifier = Modifier.fillMaxWidth()) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "APPAREIL",
                            color = MaterialTheme.colorScheme.secondaryContainer,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.2.sp
                        )

                        ChipStatut(
                            libelle = "✓ Identifié",
                            tonalite = TonaliteChip.VERT,
                        )
                    }

                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("JETON D'APPAREIL", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondaryContainer)
                        OutlinedTextField(
                            value = jetonAppareil?.let { it.take(4) + "..." + it.takeLast(4) } ?: "—",
                            onValueChange = {},
                            enabled = false,
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            trailingIcon = {
                                IconButton(onClick = {
                                    val jeton = jetonAppareil
                                    if (!jeton.isNullOrBlank()) {
                                        val pressePapiers = context.getSystemService(ClipboardManager::class.java)
                                        pressePapiers?.setPrimaryClip(ClipData.newPlainText("jeton", jeton))
                                        copie = true
                                    }
                                }) {
                                    Icon(Icons.Filled.ContentCopy, contentDescription = null, tint = GradientIndigoStart, modifier = Modifier.size(18.dp))
                                }
                            },
                            colors = OutlinedTextFieldDefaults.colors(
                                disabledContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                                disabledBorderColor = MaterialTheme.colorScheme.outline,
                                disabledTextColor = MaterialTheme.colorScheme.onSurface,
                            ),
                            shape = RoundedCornerShape(13.dp)
                        )
                    }

                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("NOM DE L'APPAREIL", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondaryContainer)
                        OutlinedTextField(
                            value = nomAppareil.ifBlank { android.os.Build.MODEL },
                            onValueChange = auChangementNomAppareil,
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                                unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                                focusedBorderColor = GradientIndigoStart,
                                unfocusedBorderColor = MaterialTheme.colorScheme.outline,
                                focusedTextColor = MaterialTheme.colorScheme.onSurface,
                                unfocusedTextColor = MaterialTheme.colorScheme.onSurface,
                            ),
                            shape = RoundedCornerShape(13.dp)
                        )
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(14.dp))
                                .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(14.dp))
                                .background(MaterialTheme.colorScheme.surface)
                                .clickable(onClick = aEnregistrerNom)
                                .padding(vertical = 11.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("enregistrer le nom", color = MaterialTheme.colorScheme.onSurface, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }

                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(14.dp))
                                .border(1.dp, bordureRougeBtn, RoundedCornerShape(14.dp))
                                .background(fondRougeBtn)
                                .clickable(onClick = aReinitialiserAppareil)
                                .padding(vertical = 11.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("réinitialiser", color = texteRougeBtn, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            Spacer(Modifier.height(14.dp))

            // Carte 3 : Cadence d'envoi (temporisation anti-ban)
            CarteGlass(modifier = Modifier.fillMaxWidth()) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "CADENCE D'ENVOI",
                            color = MaterialTheme.colorScheme.secondaryContainer,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.2.sp
                        )

                        ChipStatut(
                            libelle = if (cadenceEnvoiMs > 0) "ESPACÉ" else "AU PLUS VITE",
                            tonalite = if (cadenceEnvoiMs > 0) TonaliteChip.VERT else TonaliteChip.AMBRE,
                        )
                    }

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(34.dp)
                                .clip(RoundedCornerShape(11.dp))
                                .background(prefIconBg)
                                .border(1.dp, prefIconBd, RoundedCornerShape(11.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Filled.Timer, contentDescription = null, tint = prefIconTxt, modifier = Modifier.size(16.dp))
                        }
                        Spacer(Modifier.width(12.dp))
                        Column {
                            Text(
                                text = if (cadenceEnvoiMs > 0) "≈ ${cadenceEnvoiMs / 1000f} s entre deux SMS"
                                else "Aucune pause entre les SMS",
                                fontSize = 13.5.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(Modifier.height(1.dp))
                            Text(
                                text = "Variation aléatoire ±25 % incluse",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.secondaryContainer
                            )
                        }
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        ChoixCadence("Aucune", 0, cadenceEnvoiMs, auChangementCadence, Modifier.weight(1f))
                        ChoixCadence("1 s", 1_000, cadenceEnvoiMs, auChangementCadence, Modifier.weight(1f))
                        ChoixCadence("3 s", 3_000, cadenceEnvoiMs, auChangementCadence, Modifier.weight(1f))
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        ChoixCadence("8 s", 8_000, cadenceEnvoiMs, auChangementCadence, Modifier.weight(1f))
                        ChoixCadence("15 s", 15_000, cadenceEnvoiMs, auChangementCadence, Modifier.weight(1f))
                        ChoixCadence("30 s", 30_000, cadenceEnvoiMs, auChangementCadence, Modifier.weight(1f))
                    }

                    Text(
                        text = "Espace les envois d'un même lot pour imiter un usage humain et éviter le blocage de la carte SIM par l'opérateur. Sans effet si une seule tâche arrive.",
                        color = MaterialTheme.colorScheme.secondaryContainer,
                        fontSize = 11.sp
                    )
                }
            }

            Spacer(Modifier.height(14.dp))

            // Carte 4 : Préférences
            CarteGlass(modifier = Modifier.fillMaxWidth()) {
                Column {
                    Text(
                        text = "PRÉFÉRENCES",
                        color = MaterialTheme.colorScheme.secondaryContainer,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.2.sp
                    )

                    Spacer(Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                            Box(
                                modifier = Modifier
                                    .size(34.dp)
                                    .clip(RoundedCornerShape(11.dp))
                                    .background(prefIconBg)
                                    .border(1.dp, prefIconBd, RoundedCornerShape(11.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Filled.FlashOn, contentDescription = null, tint = prefIconTxt, modifier = Modifier.size(16.dp))
                            }
                            Spacer(Modifier.width(12.dp))
                            Column {
                                Text("Démarrage automatique", fontSize = 13.5.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                                Spacer(Modifier.height(1.dp))
                                Text("Lancer le service à l'ouverture", fontSize = 11.sp, color = MaterialTheme.colorScheme.secondaryContainer)
                            }
                        }

                        Switch(
                            checked = demarrageAuto,
                            onCheckedChange = { demarrageAuto = it },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = Color.White,
                                checkedTrackColor = GradientIndigoStart,
                                uncheckedThumbColor = MaterialTheme.colorScheme.secondaryContainer,
                                uncheckedTrackColor = MaterialTheme.colorScheme.outline
                            )
                        )
                    }

                    Spacer(Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                            Box(
                                modifier = Modifier
                                    .size(34.dp)
                                    .clip(RoundedCornerShape(11.dp))
                                    .background(prefIconBg)
                                    .border(1.dp, prefIconBd, RoundedCornerShape(11.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Filled.DarkMode, contentDescription = null, tint = prefIconTxt, modifier = Modifier.size(16.dp))
                            }
                            Spacer(Modifier.width(12.dp))
                            Column {
                                Text("Mode sombre", fontSize = 13.5.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                                Spacer(Modifier.height(1.dp))
                                Text(if (themeSombre) "Thème nuit activé" else "Thème jour activé", fontSize = 11.sp, color = MaterialTheme.colorScheme.secondaryContainer)
                            }
                        }

                        Switch(
                            checked = themeSombre,
                            onCheckedChange = { auChangementTheme() },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = Color.White,
                                checkedTrackColor = GradientIndigoStart,
                                uncheckedThumbColor = MaterialTheme.colorScheme.secondaryContainer,
                                uncheckedTrackColor = MaterialTheme.colorScheme.outline
                            )
                        )
                    }
                }
            }

            Spacer(Modifier.height(14.dp))

            // Carte 5 : Compte — déconnexion
            CarteGlass(modifier = Modifier.fillMaxWidth()) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "COMPTE",
                        color = MaterialTheme.colorScheme.secondaryContainer,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.2.sp
                    )
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .border(1.dp, bordureRougeBtn, RoundedCornerShape(14.dp))
                            .background(fondRougeBtn)
                            .clickable { confirmerDeconnexion = true }
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                Icons.AutoMirrored.Filled.Logout,
                                contentDescription = null,
                                tint = texteRougeBtn,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(Modifier.width(8.dp))
                            Text("Se déconnecter", color = texteRougeBtn, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                    Text(
                        text = "Arrête le service, prévient le serveur et ferme la session sur ce téléphone.",
                        color = MaterialTheme.colorScheme.secondaryContainer,
                        fontSize = 11.sp
                    )
                }
            }

            if (confirmerDeconnexion) {
                AlertDialog(
                    onDismissRequest = { confirmerDeconnexion = false },
                    title = { Text("Se déconnecter ?", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface) },
                    text = { Text("Le service s'arrête et ce téléphone n'enverra plus de SMS.", color = MaterialTheme.colorScheme.secondaryContainer) },
                    confirmButton = {
                        TextButton(onClick = { confirmerDeconnexion = false; aDeconnecter() }) {
                            Text("Déconnecter", color = texteRougeBtn, fontWeight = FontWeight.Bold)
                        }
                    },
                    dismissButton = {
                        TextButton(onClick = { confirmerDeconnexion = false }) {
                            Text("Annuler", color = MaterialTheme.colorScheme.secondaryContainer)
                        }
                    }
                )
            }
        }
    }
}

/**
 * Case de choix d'une cadence d'envoi (préréglage en millisecondes).
 * L'option active est peinte en dégradé indigo, les autres en surface neutre.
 */
@Composable
private fun ChoixCadence(
    libelle: String,
    valeurMs: Int,
    valeurActiveMs: Int,
    auChoix: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    val actif = valeurActiveMs == valeurMs
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(if (actif) GradientIndigoStart else MaterialTheme.colorScheme.surface)
            .border(
                1.dp,
                if (actif) GradientIndigoStart else MaterialTheme.colorScheme.outline,
                RoundedCornerShape(12.dp)
            )
            .clickable { auChoix(valeurMs) }
            .padding(vertical = 10.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = libelle,
            color = if (actif) Color.White else MaterialTheme.colorScheme.onSurface,
            fontSize = 11.5.sp,
            fontWeight = FontWeight.Bold
        )
    }
}
