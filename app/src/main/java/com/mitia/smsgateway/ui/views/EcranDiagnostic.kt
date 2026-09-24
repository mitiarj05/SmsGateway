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
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.SignalCellularAlt
import androidx.compose.material.icons.filled.SimCard
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Surface
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.mitia.smsgateway.data.local.PreferencesAppareil
import com.mitia.smsgateway.data.local.JournalEvenements
import com.mitia.smsgateway.data.remote.ClientApi
import com.mitia.smsgateway.data.sms.InfoSim
import com.mitia.smsgateway.data.sms.GestionnaireSim
import com.mitia.smsgateway.data.sms.ExpediteurSms
import com.mitia.smsgateway.ui.theme.BleuAccent
import com.mitia.smsgateway.ui.theme.VertAccent
import com.mitia.smsgateway.ui.theme.RougeAccent
import com.mitia.smsgateway.ui.theme.CouleurBordure
import com.mitia.smsgateway.ui.theme.FondCarte
import com.mitia.smsgateway.ui.theme.FondSombre
import com.mitia.smsgateway.ui.theme.TexteAttenue
import com.mitia.smsgateway.ui.theme.TextePrincipal
import kotlinx.coroutines.launch

/**
 * Diagnostic terrain : test SIM manuel (sans serveur), ping latence,
 * multi-SIM et réseau avancé. Autonome (charge ses propres données).
 */
@Composable
fun EcranDiagnostic(modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val portee = rememberCoroutineScope()

    // Essai SIM manuel
    var numeroEssai by remember { mutableStateOf("") }
    var messageEssai by remember { mutableStateOf("Test SMSIKA") }
    var resultatEssai by remember { mutableStateOf<String?>(null) }
    var essaiEnCours by remember { mutableStateOf(false) }
    var permissionSms by remember { mutableStateOf(false) }

    // Ping
    var latence by remember { mutableStateOf<Long?>(null) }
    var pingEnCours by remember { mutableStateOf(false) }

    // SIM
    var modeSim by remember { mutableStateOf("auto") }
    var souscriptionSimId by remember { mutableStateOf(-1) }
    var cartesSim by remember { mutableStateOf(emptyList<InfoSim>()) }
    var emplacements by remember { mutableStateOf(1) }
    var permissionTelephone by remember { mutableStateOf(false) }

    // Réseau avancé
    var detailReseau by remember { mutableStateOf("—") }
    var mccMnc by remember { mutableStateOf("—") }
    var dbm by remember { mutableStateOf<Int?>(null) }
    var nomOperateur by remember { mutableStateOf("—") }

    fun actualiserSims() {
        cartesSim = GestionnaireSim.listerSims(context)
        emplacements = GestionnaireSim.compterEmplacements(context)
    }

    fun actualiserReseau() {
        try {
            val gestionnaireTelephonie = context.getSystemService(TelephonyManager::class.java)
            if (gestionnaireTelephonie == null) {
                detailReseau = "—"; mccMnc = "—"; dbm = null; nomOperateur = "—"
                return
            }
            detailReseau = texteDetailReseau(gestionnaireTelephonie)
            dbm = puissanceSignalDbm(gestionnaireTelephonie)
            val (operateur, code) = operateurEtMccMnc(context, gestionnaireTelephonie)
            nomOperateur = operateur
            mccMnc = code
        } catch (_: Exception) {
            detailReseau = "—"; mccMnc = "—"; dbm = null; nomOperateur = "—"
        }
    }

    fun actualiserTout() {
        permissionSms = ContextCompat.checkSelfPermission(
            context, Manifest.permission.SEND_SMS
        ) == PackageManager.PERMISSION_GRANTED
        permissionTelephone = ContextCompat.checkSelfPermission(
            context, Manifest.permission.READ_PHONE_STATE
        ) == PackageManager.PERMISSION_GRANTED
        portee.launch {
            modeSim = PreferencesAppareil.obtenirModeSim(context)
            souscriptionSimId = PreferencesAppareil.obtenirSouscriptionSim(context)
            actualiserSims()
            actualiserReseau()
        }
    }

    val lanceurSms = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { accorde ->
        permissionSms = accorde
    }
    val lanceurTelephone = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { accorde ->
        permissionTelephone = accorde
        if (accorde) {
            portee.launch {
                actualiserSims()
                actualiserReseau()
            }
        }
    }

    LaunchedEffect(Unit) { actualiserTout() }

    fun envoyerEssaiLocal() {
        if (numeroEssai.isBlank() || messageEssai.isBlank()) {
            resultatEssai = "Numéro et message requis."
            return
        }
        if (!permissionSms) {
            lanceurSms.launch(Manifest.permission.SEND_SMS)
            resultatEssai = "Permission SMS demandée, réessaie."
            return
        }
        essaiEnCours = true
        resultatEssai = null
        portee.launch {
            val abonnementId = GestionnaireSim.resoudreAbonnementId(context)
            val reussi = ExpediteurSms.envoyerSms(context, numeroEssai.trim(), messageEssai, abonnementId)
            GestionnaireSim.noterEnvoi(context)
            resultatEssai = if (reussi) "SMS accepté par la radio." else "Échec radio (crédit ? réseau ? SIM ?)."
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

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(FondSombre)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
    ) {
        Text(
            text = "diagnostic",
            color = TextePrincipal,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
        )
        Text(
            text = "tests locaux, sans dépendre du serveur",
            color = TexteAttenue,
            fontSize = 12.sp,
        )
        Spacer(Modifier.height(16.dp))

        // ---- 1. Essai SIM manuel ----
        CarteDiagnostic(
            titre = "Essai matériel SIM",
            icone = Icons.Filled.Send,
            sousTitre = "SMS réel direct, hors serveur",
        ) {
            OutlinedTextField(
                value = numeroEssai,
                onValueChange = { numeroEssai = it },
                label = { Text("Numéro d'essai") },
                placeholder = { Text("+261…") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                colors = couleursChampDiagnostic(),
                shape = RoundedCornerShape(10.dp),
            )
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(
                value = messageEssai,
                onValueChange = { messageEssai = it },
                label = { Text("Message") },
                modifier = Modifier.fillMaxWidth(),
                colors = couleursChampDiagnostic(),
                shape = RoundedCornerShape(10.dp),
            )
            Spacer(Modifier.height(8.dp))
            Button(onClick = ::envoyerEssaiLocal, enabled = !essaiEnCours, modifier = Modifier.fillMaxWidth()) {
                if (essaiEnCours) CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                else Text("Envoyer le SMS d'essai")
            }
            if (resultatEssai != null) {
                Spacer(Modifier.height(8.dp))
                Text(text = resultatEssai!!, color = TextePrincipal, fontSize = 13.sp)
            }
        }
        Spacer(Modifier.height(12.dp))

        // ---- 2. Ping serveur ----
        CarteDiagnostic(
            titre = "Ping serveur",
            icone = Icons.Filled.Speed,
            sousTitre = "latence aller-retour HTTPS",
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = when {
                        pingEnCours -> "mesure…"
                        latence == null -> "—"
                        latence!! < 0 -> "injoignable"
                        else -> "${latence} ms"
                    },
                    color = TextePrincipal,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.weight(1f),
                )
                OutlinedButton(onClick = ::ping, enabled = !pingEnCours) {
                    Text("mesurer")
                }
            }
        }
        Spacer(Modifier.height(12.dp))

        // ---- 3. Multi-SIM ----
        CarteDiagnostic(
            titre = "Multi-SIM",
            icone = Icons.Filled.SimCard,
            sousTitre = "$emplacements emplacement(s) · rotation tous les ${GestionnaireSim.LOT_ROTATION} envois",
        ) {
            if (!permissionTelephone) {
                Text(
                    text = "Autorise l'accès aux SIM pour voir et choisir les cartes.",
                    color = TexteAttenue,
                    fontSize = 12.sp,
                )
                Spacer(Modifier.height(8.dp))
                OutlinedButton(
                    onClick = { lanceurTelephone.launch(Manifest.permission.READ_PHONE_STATE) },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("Autoriser l'accès SIM")
                }
            } else {
                if (cartesSim.isEmpty()) {
                    Text(
                        text = "Aucune SIM active détectée.",
                        color = TexteAttenue,
                        fontSize = 13.sp,
                    )
                } else {
                    LigneModeSim(
                        selectionne = modeSim == "auto",
                        titre = "Automatique",
                        sousTitre = "alterne toutes les ${GestionnaireSim.LOT_ROTATION} envois",
                        auClic = {
                            portee.launch {
                                PreferencesAppareil.enregistrerModeSim(context, "auto")
                                modeSim = "auto"
                            }
                        },
                    )
                    cartesSim.forEach { carte ->
                        LigneModeSim(
                            selectionne = modeSim == "manual" && souscriptionSimId == carte.abonnementId,
                            titre = "SIM ${carte.indexEmplacement + 1} · ${carte.operateur}",
                            sousTitre = carte.numero ?: "numéro masqué",
                            auClic = {
                                portee.launch {
                                    PreferencesAppareil.enregistrerModeSim(context, "manual")
                                    PreferencesAppareil.enregistrerSouscriptionSim(context, carte.abonnementId)
                                    modeSim = "manual"
                                    souscriptionSimId = carte.abonnementId
                                }
                            },
                        )
                    }
                }
            }
        }
        Spacer(Modifier.height(12.dp))

        // ---- 4. Réseau avancé ----
        CarteDiagnostic(
            titre = "Réseau avancé",
            icone = Icons.Filled.SignalCellularAlt,
            sousTitre = "données techniques de maintenance",
        ) {
            LigneReseau(etiquette = "Technologie", valeur = detailReseau)
            LigneReseau(etiquette = "Opérateur", valeur = nomOperateur)
            LigneReseau(etiquette = "MCC / MNC", valeur = mccMnc)
            LigneReseau(etiquette = "Signal", valeur = dbm?.let { "$it dBm" } ?: "—")
            Spacer(Modifier.height(8.dp))
            OutlinedButton(
                onClick = { actualiserSims(); actualiserReseau() },
                modifier = Modifier.fillMaxWidth(),
            ) {
                Icon(Icons.Filled.Refresh, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text("Actualiser")
            }
        }
    }
}

@Composable
private fun CarteDiagnostic(
    titre: String,
    icone: androidx.compose.ui.graphics.vector.ImageVector,
    sousTitre: String,
    contenu: @Composable () -> Unit,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = FondCarte,
        shape = RoundedCornerShape(16.dp),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(imageVector = icone, contentDescription = null, tint = BleuAccent)
                Spacer(Modifier.width(8.dp))
                Column {
                    Text(text = titre, color = TextePrincipal, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    Text(text = sousTitre, color = TexteAttenue, fontSize = 11.sp)
                }
            }
            Spacer(Modifier.height(12.dp))
            contenu()
        }
    }
}

@Composable
private fun LigneModeSim(
    selectionne: Boolean,
    titre: String,
    sousTitre: String,
    auClic: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .selectable(selected = selectionne, role = Role.RadioButton, onClick = auClic)
            .padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        RadioButton(selected = selectionne, onClick = null)
        Spacer(Modifier.width(8.dp))
        Column {
            Text(text = titre, color = TextePrincipal, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
            Text(text = sousTitre, color = TexteAttenue, fontSize = 11.sp)
        }
    }
}

@Composable
private fun LigneReseau(etiquette: String, valeur: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(text = etiquette, color = TexteAttenue, fontSize = 12.sp)
        Text(text = valeur, color = TextePrincipal, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
private fun couleursChampDiagnostic() = OutlinedTextFieldDefaults.colors(
    focusedContainerColor = FondCarte,
    unfocusedContainerColor = FondCarte,
    focusedBorderColor = BleuAccent,
    unfocusedBorderColor = CouleurBordure,
    focusedTextColor = TextePrincipal,
    unfocusedTextColor = TextePrincipal,
    cursorColor = BleuAccent,
)

private fun texteDetailReseau(gestionnaireTelephonie: TelephonyManager): String {
    return try {
        when (gestionnaireTelephonie.dataNetworkType) {
            TelephonyManager.NETWORK_TYPE_NR -> "5G (NR)"
            TelephonyManager.NETWORK_TYPE_LTE -> "LTE (4G)"
            TelephonyManager.NETWORK_TYPE_HSPAP, TelephonyManager.NETWORK_TYPE_HSPA -> "HSPA+ (3G+)"
            TelephonyManager.NETWORK_TYPE_UMTS -> "UMTS (3G)"
            TelephonyManager.NETWORK_TYPE_EDGE, TelephonyManager.NETWORK_TYPE_GPRS -> "2G"
            TelephonyManager.NETWORK_TYPE_UNKNOWN -> "Inconnu"
            else -> "type ${gestionnaireTelephonie.dataNetworkType}"
        }
    } catch (_: Exception) {
        "—"
    }
}

private fun operateurEtMccMnc(context: Context, gestionnaireTelephonie: TelephonyManager): Pair<String, String> {
    return try {
        val gestionnaireAbonnements = context.getSystemService(SubscriptionManager::class.java)
        @Suppress("MissingPermission")
        val infos = gestionnaireAbonnements?.activeSubscriptionInfoList?.firstOrNull()
        if (infos != null) {
            val operateur = infos.carrierName?.toString()?.takeIf { it.isNotBlank() } ?: "—"
            val code = "${infos.mccString ?: "?"} / ${infos.mncString ?: "?"}"
            return operateur to code
        }
        val brut = gestionnaireTelephonie.networkOperator ?: return "—" to "—"
        if (brut.length >= 5) {
            val operateur = gestionnaireTelephonie.networkOperatorName?.takeIf { it.isNotBlank() } ?: "—"
            operateur to "${brut.substring(0, 3)} / ${brut.substring(3)}"
        } else {
            "—" to "—"
        }
    } catch (_: Exception) {
        "—" to "—"
    }
}

private fun puissanceSignalDbm(gestionnaireTelephonie: TelephonyManager): Int? {
    return try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            gestionnaireTelephonie.signalStrength?.cellSignalStrengths?.firstOrNull()?.dbm
        } else {
            null
        }
    } catch (_: Exception) {
        null
    }
}
