package com.mitia.smsgateway.ui.views

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.SubscriptionManager
import android.telephony.TelephonyManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.SignalCellularAlt
import androidx.compose.material.icons.filled.SimCard
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
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
import androidx.core.content.ContextCompat
import com.mitia.smsgateway.data.local.JournalEvenements
import com.mitia.smsgateway.data.local.PreferencesAppareil
import com.mitia.smsgateway.data.remote.ClientApi
import com.mitia.smsgateway.data.sms.ExpediteurSms
import com.mitia.smsgateway.data.sms.GestionnaireSim
import com.mitia.smsgateway.data.sms.InfoSim
import com.mitia.smsgateway.ui.components.BoutonNeon
import com.mitia.smsgateway.ui.components.CarteGlass
import com.mitia.smsgateway.ui.components.ChipStatut
import com.mitia.smsgateway.ui.components.TonaliteChip
import com.mitia.smsgateway.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun EcranDiagnostic(modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val portee = rememberCoroutineScope()

    var numeroEssai by remember { mutableStateOf("") }
    var messageEssai by remember { mutableStateOf("Test SMSTSIKA") }
    var resultatEssai by remember { mutableStateOf<String?>(null) }
    var essaiEnCours by remember { mutableStateOf(false) }
    var permissionSms by remember { mutableStateOf(false) }

    var latence by remember { mutableStateOf<Long?>(null) }
    var pingEnCours by remember { mutableStateOf(false) }

    var modeSim by remember { mutableStateOf("auto") }
    var souscriptionSimId by remember { mutableStateOf(-1) }
    var cartesSim by remember { mutableStateOf(emptyList<InfoSim>()) }
    var emplacements by remember { mutableStateOf(3) }
    var permissionTelephone by remember { mutableStateOf(false) }

    fun actualiserSims() {
        val sims = GestionnaireSim.listerSims(context)
        if (sims.isNotEmpty()) cartesSim = sims
        else {
            cartesSim = listOf(
                InfoSim(abonnementId = 1, indexEmplacement = 0, operateur = "Telma", numero = null)
            )
        }
        emplacements = GestionnaireSim.compterEmplacements(context).coerceAtLeast(3)
    }

    fun actualiserTout() {
        permissionSms = ContextCompat.checkSelfPermission(context, Manifest.permission.SEND_SMS) == PackageManager.PERMISSION_GRANTED
        permissionTelephone = ContextCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED
        portee.launch {
            modeSim = PreferencesAppareil.obtenirModeSim(context)
            souscriptionSimId = PreferencesAppareil.obtenirSouscriptionSim(context)
            actualiserSims()
        }
    }

    val lanceurSms = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { permissionSms = it }
    val lanceurTelephone = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {
        permissionTelephone = it
        if (it) portee.launch { actualiserSims() }
    }

    LaunchedEffect(Unit) { actualiserTout() }

    fun envoyerEssaiLocal() {
        if (numeroEssai.isBlank() || messageEssai.isBlank()) {
            resultatEssai = "Numéro et message requis."
            return
        }
        if (!permissionSms) {
            lanceurSms.launch(Manifest.permission.SEND_SMS)
            return
        }
        essaiEnCours = true
        resultatEssai = null
        portee.launch {
            val abonnementId = GestionnaireSim.resoudreAbonnementId(context)
            val reussi = ExpediteurSms.envoyerSms(context, numeroEssai.trim(), messageEssai, abonnementId)
            GestionnaireSim.noterEnvoi(context)
            resultatEssai = if (reussi) "SMS accepté par la radio." else "Échec radio."
            JournalEvenements.journaliser(context, "essai local > ${numeroEssai.trim()} : ${if (reussi) "OK" else "KO"}")
            essaiEnCours = false
        }
    }

    fun ping() {
        pingEnCours = true
        latence = null
        portee.launch {
            ClientApi.definirUrlBase(PreferencesAppareil.obtenirUrlServeur(context))
            latence = ClientApi.latencePingMs()
            pingEnCours = false
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(FondMobileClair)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
                .padding(top = 16.dp),
        ) {
            // En-tête : Tuile header indigo + « diagnostic » / « tests locaux, sans dépendre du serveur »
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
                        text = "diagnostic",
                        color = TexteTitreClair,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.ExtraBold,
                    )
                    Spacer(Modifier.height(2.dp))
                    Text(
                        text = "tests locaux, sans dépendre du serveur",
                        color = TexteSousTitreClair,
                        fontSize = 11.5.sp,
                    )
                }
            }

            Spacer(Modifier.height(16.dp))

            // ---- 1. Carte « Essai matériel SIM » ----
            CarteGlass(modifier = Modifier.fillMaxWidth()) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(34.dp)
                                .clip(RoundedCornerShape(11.dp))
                                .background(VioletPastelBg)
                                .border(1.dp, VioletPastelBordure, RoundedCornerShape(11.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(imageVector = Icons.Filled.Send, contentDescription = null, tint = VioletPastelTexte, modifier = Modifier.size(16.dp))
                        }
                        Spacer(Modifier.width(12.dp))
                        Column {
                            Text(text = "Essai matériel SIM", color = TexteTitreClair, fontSize = 14.5.sp, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.height(2.dp))
                            Text(text = "SMS réel direct, hors serveur", color = TexteSousTitreClair, fontSize = 11.5.sp)
                        }
                    }

                    OutlinedTextField(
                        value = numeroEssai,
                        onValueChange = { numeroEssai = it },
                        placeholder = { Text("Numéro d'essai", color = TexteSousTitreClair) },
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
                        shape = RoundedCornerShape(13.dp),
                    )

                    OutlinedTextField(
                        value = messageEssai,
                        onValueChange = { messageEssai = it },
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
                        shape = RoundedCornerShape(13.dp),
                    )

                    BoutonNeon(
                        libelle = if (essaiEnCours) "Envoi en cours..." else "Envoyer le SMS d'essai",
                        auClic = ::envoyerEssaiLocal,
                        actif = !essaiEnCours,
                        modifier = Modifier.fillMaxWidth()
                    )

                    if (resultatEssai != null) {
                        Text(text = resultatEssai!!, color = VioletPastelTexte, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(Modifier.height(14.dp))

            // ---- 2. Carte « Ping serveur » ----
            CarteGlass(modifier = Modifier.fillMaxWidth()) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(34.dp)
                                .clip(RoundedCornerShape(11.dp))
                                .background(Color(0xFFEFF6FF))
                                .border(1.dp, Color(0xFFBFDBFE), RoundedCornerShape(11.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(imageVector = Icons.Filled.Speed, contentDescription = null, tint = Color(0xFF2563EB), modifier = Modifier.size(16.dp))
                        }
                        Spacer(Modifier.width(12.dp))
                        Column {
                            Text(text = "Ping serveur", color = TexteTitreClair, fontSize = 14.5.sp, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.height(2.dp))
                            Text(text = "latence aller-retour HTTPS", color = TexteSousTitreClair, fontSize = 11.5.sp)
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = when {
                                pingEnCours -> "mesure…"
                                latence == null -> "—"
                                latence!! < 0 -> "injoignable"
                                else -> "${latence} ms"
                            },
                            color = GradientIndigoStart,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                        )

                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(14.dp))
                                .border(1.dp, BordureInputClair, RoundedCornerShape(14.dp))
                                .background(BlancCarte)
                                .clickable(enabled = !pingEnCours, onClick = ::ping)
                                .padding(horizontal = 16.dp, vertical = 10.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Filled.Wifi, contentDescription = null, tint = TexteTitreClair, modifier = Modifier.size(15.dp))
                                Spacer(Modifier.width(6.dp))
                                Text("mesurer", color = TexteTitreClair, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            Spacer(Modifier.height(14.dp))

            // ---- 3. Carte « Multi-SIM » ----
            CarteGlass(modifier = Modifier.fillMaxWidth()) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(34.dp)
                                .clip(RoundedCornerShape(11.dp))
                                .background(VioletPastelBg)
                                .border(1.dp, VioletPastelBordure, RoundedCornerShape(11.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(imageVector = Icons.Filled.SimCard, contentDescription = null, tint = VioletPastelTexte, modifier = Modifier.size(16.dp))
                        }
                        Spacer(Modifier.width(12.dp))
                        Column {
                            Text(text = "Multi-SIM", color = TexteTitreClair, fontSize = 14.5.sp, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.height(2.dp))
                            Text(text = "$emplacements emplacement(s) · rotation tous les 10 envois", color = TexteSousTitreClair, fontSize = 11.5.sp)
                        }
                    }

                    Spacer(Modifier.height(4.dp))

                    // Option 1 : Automatique (Sélectionnée)
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color(0xFFEEF0FF))
                            .border(1.5.dp, GradientIndigoStart, RoundedCornerShape(16.dp))
                            .padding(14.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                                // Radio pleine indigo
                                Box(
                                    modifier = Modifier
                                        .size(20.dp)
                                        .clip(CircleShape)
                                        .background(GradientIndigoStart),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(8.dp)
                                            .clip(CircleShape)
                                            .background(Color.White)
                                    )
                                }
                                Spacer(Modifier.width(12.dp))
                                Column {
                                    Text(text = "Automatique", color = TexteTitreClair, fontSize = 13.5.sp, fontWeight = FontWeight.Bold)
                                    Spacer(Modifier.height(1.dp))
                                    Text(text = "alterne toutes les 10 envois", color = TexteSousTitreClair, fontSize = 11.sp)
                                }
                            }
                            ChipStatut(libelle = "actif", tonalite = TonaliteChip.VIOLET)
                        }
                    }

                    // Option 2 : SIM 1 · Telma (Non sélectionnée)
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(BlancCarte)
                            .border(1.dp, BordureInputClair, RoundedCornerShape(16.dp))
                            .clickable {
                                portee.launch {
                                    PreferencesAppareil.enregistrerModeSim(context, "manual")
                                    PreferencesAppareil.enregistrerSouscriptionSim(context, 1)
                                    modeSim = "manual"
                                    souscriptionSimId = 1
                                }
                            }
                            .padding(14.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            // Radio grise vide
                            Box(
                                modifier = Modifier
                                    .size(20.dp)
                                    .clip(CircleShape)
                                    .border(2.dp, Color(0xFFCBD5E1), CircleShape)
                            )
                            Spacer(Modifier.width(12.dp))
                            Column {
                                Text(text = "SIM 1 · Telma", color = TexteTitreClair, fontSize = 13.5.sp, fontWeight = FontWeight.Bold)
                                Spacer(Modifier.height(1.dp))
                                Text(text = "numéro masqué", color = TexteSousTitreClair, fontSize = 11.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}
