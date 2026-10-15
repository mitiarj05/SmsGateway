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
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.text.style.TextAlign
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

    var permissionSms by remember { mutableStateOf(false) }

    var latence by remember { mutableStateOf<Long?>(null) }
    var pingEnCours by remember { mutableStateOf(false) }

    var modeSim by remember { mutableStateOf("auto") }
    var souscriptionSimId by remember { mutableStateOf(-1) }
    var cartesSim by remember { mutableStateOf(emptyList<InfoSim>()) }
    var emplacements by remember { mutableStateOf(3) }
    var permissionTelephone by remember { mutableStateOf(false) }

    val isSombre = MaterialTheme.colorScheme.background.red < 0.2f

    val pingIconBg = if (isSombre) Color(0x222563EB) else Color(0xFFEFF6FF)
    val pingIconBd = if (isSombre) Color(0x443B82F6) else Color(0xFFBFDBFE)
    val pingIconTxt = if (isSombre) Color(0xFF60A5FA) else Color(0xFF2563EB)

    val simIconBg = if (isSombre) Color(0x227C3AED) else VioletPastelBg
    val simIconBd = if (isSombre) Color(0x44A78BFA) else VioletPastelBordure
    val simIconTxt = if (isSombre) Color(0xFFA78BFA) else VioletPastelTexte

    fun actualiserSims() {
        val sims = GestionnaireSim.listerSims(context)
        cartesSim = sims
        emplacements = GestionnaireSim.compterEmplacements(context)
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
            .background(MaterialTheme.colorScheme.background)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
                .padding(top = 16.dp),
        ) {
            // En-tête : Tuile header indigo + diagnostic / tests locaux
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
                        color = MaterialTheme.colorScheme.onSurface,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.ExtraBold,
                    )
                    Spacer(Modifier.height(2.dp))
                    Text(
                        text = "tests locaux, sans dépendre du serveur",
                        color = MaterialTheme.colorScheme.secondaryContainer,
                        fontSize = 11.5.sp,
                    )
                }
            }

            Spacer(Modifier.height(16.dp))

            // ---- 1. Carte Ping serveur ----
            CarteGlass(modifier = Modifier.fillMaxWidth()) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(34.dp)
                                .clip(RoundedCornerShape(11.dp))
                                .background(pingIconBg)
                                .border(1.dp, pingIconBd, RoundedCornerShape(11.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(imageVector = Icons.Filled.Speed, contentDescription = null, tint = pingIconTxt, modifier = Modifier.size(16.dp))
                        }
                        Spacer(Modifier.width(12.dp))
                        Column {
                            Text(text = "Ping serveur", color = MaterialTheme.colorScheme.onSurface, fontSize = 14.5.sp, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.height(2.dp))
                            Text(text = "latence aller-retour HTTPS", color = MaterialTheme.colorScheme.secondaryContainer, fontSize = 11.5.sp)
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
                                .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(14.dp))
                                .background(MaterialTheme.colorScheme.surface)
                                .clickable(enabled = !pingEnCours, onClick = ::ping)
                                .padding(horizontal = 16.dp, vertical = 10.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Filled.Wifi, contentDescription = null, tint = MaterialTheme.colorScheme.onSurface, modifier = Modifier.size(15.dp))
                                Spacer(Modifier.width(6.dp))
                                Text("mesurer", color = MaterialTheme.colorScheme.onSurface, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            Spacer(Modifier.height(14.dp))

            // ---- 2. Carte Multi-SIM ----
            CarteGlass(modifier = Modifier.fillMaxWidth()) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(34.dp)
                                .clip(RoundedCornerShape(11.dp))
                                .background(simIconBg)
                                .border(1.dp, simIconBd, RoundedCornerShape(11.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(imageVector = Icons.Filled.SimCard, contentDescription = null, tint = simIconTxt, modifier = Modifier.size(16.dp))
                        }
                        Spacer(Modifier.width(12.dp))
                        Column {
                            Text(text = "Multi-SIM", color = MaterialTheme.colorScheme.onSurface, fontSize = 14.5.sp, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.height(2.dp))
                            Text(text = "$emplacements emplacement(s) · rotation tous les 10 envois", color = MaterialTheme.colorScheme.secondaryContainer, fontSize = 11.5.sp)
                        }
                    }

                    Spacer(Modifier.height(4.dp))

                    // Option 1 : Automatique
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(GradientIndigoStart.copy(alpha = 0.12f))
                            .border(1.5.dp, GradientIndigoStart, RoundedCornerShape(16.dp))
                            .padding(14.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
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
                                            .background(MaterialTheme.colorScheme.surface)
                                    )
                                }
                                Spacer(Modifier.width(12.dp))
                                Column {
                                    Text(text = "Automatique", color = MaterialTheme.colorScheme.onSurface, fontSize = 13.5.sp, fontWeight = FontWeight.Bold)
                                    Spacer(Modifier.height(1.dp))
                                    Text(text = "alterne toutes les 10 envois", color = MaterialTheme.colorScheme.secondaryContainer, fontSize = 11.sp)
                                }
                            }
                            ChipStatut(libelle = "actif", tonalite = TonaliteChip.VIOLET)
                        }
                    }

                    // Cartes SIM
                    if (cartesSim.isEmpty()) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp))
                                .background(MaterialTheme.colorScheme.surface)
                                .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(16.dp))
                                .padding(14.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = if (!permissionTelephone)
                                    "Accès téléphone requis pour lire vos cartes SIM."
                                else
                                    "Aucune carte SIM détectée sur cet appareil.",
                                color = MaterialTheme.colorScheme.secondaryContainer,
                                fontSize = 12.sp,
                                textAlign = TextAlign.Center
                            )
                            Spacer(Modifier.height(10.dp))
                            BoutonNeon(
                                libelle = if (!permissionTelephone) "Autoriser l'accès téléphone" else "Revérifier",
                                auClic = {
                                    if (!permissionTelephone) {
                                        lanceurTelephone.launch(Manifest.permission.READ_PHONE_STATE)
                                    } else {
                                        actualiserTout()
                                    }
                                },
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }
                    cartesSim.forEach { sim ->
                        val selectionnee = modeSim == "manual" && souscriptionSimId == sim.abonnementId
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp))
                                .background(MaterialTheme.colorScheme.surface)
                                .border(
                                    if (selectionnee) 1.5.dp else 1.dp,
                                    if (selectionnee) GradientIndigoStart else MaterialTheme.colorScheme.outline,
                                    RoundedCornerShape(16.dp)
                                )
                                .clickable {
                                    portee.launch {
                                        PreferencesAppareil.enregistrerModeSim(context, "manual")
                                        PreferencesAppareil.enregistrerSouscriptionSim(context, sim.abonnementId)
                                        modeSim = "manual"
                                        souscriptionSimId = sim.abonnementId
                                    }
                                }
                                .padding(14.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(20.dp)
                                        .clip(CircleShape)
                                        .border(2.dp, if (selectionnee) GradientIndigoStart else MaterialTheme.colorScheme.outline, CircleShape)
                                        .background(if (selectionnee) GradientIndigoStart else Color.Transparent),
                                    contentAlignment = Alignment.Center
                                ) {
                                    if (selectionnee) {
                                        Box(
                                            modifier = Modifier
                                                .size(8.dp)
                                                .clip(CircleShape)
                                                .background(MaterialTheme.colorScheme.surface)
                                        )
                                    }
                                }
                                Spacer(Modifier.width(12.dp))
                                Column {
                                    Text(
                                        text = "SIM ${sim.indexEmplacement + 1} · ${sim.operateur ?: "Opérateur inconnu"}",
                                        color = MaterialTheme.colorScheme.onSurface,
                                        fontSize = 13.5.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(Modifier.height(1.dp))
                                    Text(
                                        text = sim.numero ?: "numéro indisponible",
                                        color = MaterialTheme.colorScheme.secondaryContainer,
                                        fontSize = 11.sp
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
