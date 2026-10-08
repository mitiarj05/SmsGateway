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
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material.icons.filled.Wifi
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
) {
    val context = LocalContext.current
    var copie by remember { mutableStateOf(false) }
    var demarrageAuto by remember { mutableStateOf(true) }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(FondMobileClair)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(18.dp)
                .padding(top = 16.dp),
        ) {
            // En-tête : Tuile header indigo + Paramètres / Configuration SMSTSIKA
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
                        color = TexteTitreClair,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.ExtraBold,
                    )
                    Spacer(Modifier.height(2.dp))
                    Text(
                        text = "Configuration SMSTSIKA",
                        color = TexteSousTitreClair,
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
                            color = TexteSousTitreClair,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.2.sp
                        )
                        ChipStatut(libelle = "HTTPS", tonalite = TonaliteChip.VIOLET)
                    }

                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("URL DU SERVEUR", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TexteSousTitreClair)
                        OutlinedTextField(
                            value = urlServeur.ifBlank { "https://sms-gateway-omega.vercel.app" },
                            onValueChange = auChangementUrlServeur,
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedContainerColor = FondInputClair,
                                unfocusedContainerColor = FondInputClair,
                                focusedBorderColor = GradientIndigoStart,
                                unfocusedBorderColor = BordureInputClair,
                                focusedTextColor = TexteTitreClair,
                                unfocusedTextColor = TexteTitreClair,
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
                                .border(1.dp, BordureInputClair, RoundedCornerShape(14.dp))
                                .background(BlancCarte)
                                .clickable(onClick = aTesterConnexion)
                                .padding(vertical = 12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Filled.Wifi, contentDescription = null, tint = TexteTitreClair, modifier = Modifier.size(15.dp))
                                Spacer(Modifier.width(6.dp))
                                Text("tester", color = TexteTitreClair, fontSize = 13.sp, fontWeight = FontWeight.Bold)
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
                            color = TexteSousTitreClair,
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
                        Text("JETON D'APPAREIL", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TexteSousTitreClair)
                        OutlinedTextField(
                            value = jetonAppareil?.let { it.take(4) + "..." + it.takeLast(4) } ?: "c44c…b8bc",
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
                                disabledContainerColor = FondInputClair,
                                disabledBorderColor = BordureInputClair,
                                disabledTextColor = TexteTitreClair,
                            ),
                            shape = RoundedCornerShape(13.dp)
                        )
                    }

                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("NOM DE L'APPAREIL", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TexteSousTitreClair)
                        OutlinedTextField(
                            value = nomAppareil.ifBlank { "Infinix X689C" },
                            onValueChange = auChangementNomAppareil,
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedContainerColor = FondInputClair,
                                unfocusedContainerColor = FondInputClair,
                                focusedBorderColor = GradientIndigoStart,
                                unfocusedBorderColor = BordureInputClair,
                                focusedTextColor = TexteTitreClair,
                                unfocusedTextColor = TexteTitreClair,
                            ),
                            shape = RoundedCornerShape(13.dp)
                        )
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(14.dp))
                                .border(1.dp, BordureInputClair, RoundedCornerShape(14.dp))
                                .background(BlancCarte)
                                .clickable(onClick = aEnregistrerNom)
                                .padding(vertical = 11.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("enregistrer le nom", color = TexteTitreClair, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }

                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(14.dp))
                                .border(1.dp, RougePastelBordure, RoundedCornerShape(14.dp))
                                .background(BlancCarte)
                                .clickable(onClick = aReinitialiserAppareil)
                                .padding(vertical = 11.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("réinitialiser", color = RougePastelTexte, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            Spacer(Modifier.height(14.dp))

            // Carte 3 : Préférences
            CarteGlass(modifier = Modifier.fillMaxWidth()) {
                Column {
                    Text(
                        text = "PRÉFÉRENCES",
                        color = TexteSousTitreClair,
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
                                    .background(VioletPastelBg)
                                    .border(1.dp, VioletPastelBordure, RoundedCornerShape(11.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Filled.FlashOn, contentDescription = null, tint = VioletPastelTexte, modifier = Modifier.size(16.dp))
                            }
                            Spacer(Modifier.width(12.dp))
                            Column {
                                Text("Démarrage automatique", fontSize = 13.5.sp, fontWeight = FontWeight.Bold, color = TexteTitreClair)
                                Spacer(Modifier.height(1.dp))
                                Text("Lancer le service à l'ouverture", fontSize = 11.sp, color = TexteSousTitreClair)
                            }
                        }

                        Switch(
                            checked = demarrageAuto,
                            onCheckedChange = { demarrageAuto = it },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = Color.White,
                                checkedTrackColor = GradientIndigoStart,
                                uncheckedThumbColor = TexteSousTitreClair,
                                uncheckedTrackColor = BordureInputClair
                            )
                        )
                    }
                }
            }
        }
    }
}
