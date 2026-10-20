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
import androidx.compose.foundation.text.KeyboardOptions
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.mitia.smsgateway.data.local.JournalEvenements
import com.mitia.smsgateway.data.local.PreferencesAppareil
import com.mitia.smsgateway.data.remote.ClientApi
import com.mitia.smsgateway.data.sms.ExpediteurSms
import com.mitia.smsgateway.data.sms.GestionnaireSim
import com.mitia.smsgateway.data.sms.InfoSim
import com.mitia.smsgateway.domain.model.CarteUssd
import com.mitia.smsgateway.ui.components.BoutonNeon
import com.mitia.smsgateway.ui.components.CarteGlass
import com.mitia.smsgateway.ui.components.ChipStatut
import com.mitia.smsgateway.ui.components.TonaliteChip
import com.mitia.smsgateway.ui.theme.*
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlinx.coroutines.launch

/**
 * Écran Diagnostic : « tests locaux, sans dépendre du serveur ».
 *
 * La consultation du solde a sa place ici : c'est un test de la carte, qui ne
 * dépend d'aucun serveur. Chaque carte SIM porte SON code USSD, SON dernier
 * relevé et SON bouton de vérification — deux SIM peuvent appartenir à deux
 * opérateurs, donc avoir deux codes et deux soldes différents.
 */
@Composable
fun EcranDiagnostic(
    cartesUssd: List<CarteUssd> = emptyList(),
    permissionUssd: Boolean = false,
    relevageSoldeEnCours: Int? = null,
    messagesSolde: Map<Int, String> = emptyMap(),
    aDemanderPermissionUssd: () -> Unit = {},
    aEnregistrerCodeUssd: (Int, String) -> Unit = { _, _ -> },
    aVerifierSolde: (Int) -> Unit = {},
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val portee = rememberCoroutineScope()

    // Brouillon du code par carte : le champ ne suit pas les rafraîchissements
    // périodiques de MainActivity, sinon une saisie en cours serait effacée.
    var codesSaisis by remember { mutableStateOf(emptyMap<Int, String>()) }

    // Numéro tapé par carte : si l'opérateur ne fournit pas son numéro
    // (« numéro indisponible ») ou si l'utilisateur le corrige.
    var numerosSaisis by remember { mutableStateOf(emptyMap<Int, String>()) }

    var permissionSms by remember { mutableStateOf(false) }

    var latence by remember { mutableStateOf<Long?>(null) }
    var pingEnCours by remember { mutableStateOf(false) }

    var modeSim by remember { mutableStateOf("auto") }
    var souscriptionSimId by remember { mutableStateOf(-1) }
    var cartesSim by remember { mutableStateOf(emptyList<InfoSim>()) }
    var emplacements by remember { mutableStateOf(3) }

    /** READ_PHONE_STATE : lire la liste des cartes (distinct de `permissionUssd`). */
    var permissionTelephone by remember { mutableStateOf(false) }

    // Un relevé arrivé par SMS, ou par la vérification quotidienne, ne doit pas
    // écraser ce que l'utilisateur est en train de taper : le brouillon n'est
    // semé qu'une fois par carte.
    LaunchedEffect(cartesUssd) {
        cartesUssd.forEach { carte ->
            if (!codesSaisis.containsKey(carte.souscriptionId)) {
                codesSaisis = codesSaisis + (carte.souscriptionId to carte.code)
            }
            // Le numéro tapé la fois précédente revient, mais ne reprend JAMAIS
            // un brouillon en cours de frappe.
            if (!numerosSaisis.containsKey(carte.souscriptionId)) {
                val stocke = PreferencesAppareil.obtenirNumeroSim(context, carte.souscriptionId)
                if (!stocke.isNullOrBlank()) {
                    numerosSaisis = numerosSaisis + (carte.souscriptionId to stocke)
                }
            }
        }
    }

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
                        val carte = cartesUssd.firstOrNull { it.souscriptionId == sim.abonnementId }
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
                            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
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
                                        // Le numéro affiché : celui d'Android, sinon
                                        // celui tapé une fois par l'utilisateur.
                                        val numeroAffiche = sim.numero
                                            ?: numerosSaisis[sim.abonnementId]?.takeIf { it.isNotBlank() }
                                        if (numeroAffiche != null) {
                                            Text(
                                                text = numeroAffiche,
                                                color = MaterialTheme.colorScheme.secondaryContainer,
                                                fontSize = 11.sp
                                            )
                                        } else {
                                            // Les opérateurs ne provisionnent pas toujours
                                            // leur numéro dans la carte : on l'écrit une
                                            // fois, il reste en mémoire et s'affiche ensuite.
                                            OutlinedTextField(
                                                value = numerosSaisis[sim.abonnementId].orEmpty(),
                                                onValueChange = { presente ->
                                                    numerosSaisis = numerosSaisis + (sim.abonnementId to presente)
                                                    portee.launch {
                                                        PreferencesAppareil.enregistrerNumeroSim(
                                                            context, sim.abonnementId, presente
                                                        )
                                                    }
                                                },
                                                placeholder = {
                                                    Text(
                                                        text = "Saisir le numéro de la SIM…",
                                                        fontSize = 10.sp
                                                    )
                                                },
                                                singleLine = true,
                                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                                                textStyle = androidx.compose.ui.text.TextStyle(
                                                    fontSize = 11.sp,
                                                    fontWeight = FontWeight.SemiBold
                                                ),
                                                modifier = Modifier.fillMaxWidth(0.75f)
                                            )
                                        }
                                    }
                                }

                                BlocSoldeCarte(
                                    carte = carte,
                                    codeSaisi = codesSaisis[sim.abonnementId]
                                        ?: carte?.code.orEmpty(),
                                    auChangementCode = { valeur ->
                                        codesSaisis = codesSaisis + (sim.abonnementId to valeur)
                                    },
                                    aEnregistrerCode = {
                                        aEnregistrerCodeUssd(
                                            sim.abonnementId,
                                            codesSaisis[sim.abonnementId] ?: carte?.code.orEmpty()
                                        )
                                    },
                                    aVerifier = { aVerifierSolde(sim.abonnementId) },
                                    verificationEnCours = relevageSoldeEnCours == sim.abonnementId,
                                    message = messagesSolde[sim.abonnementId].orEmpty(),
                                    permissionUssd = permissionUssd,
                                    aDemanderPermissionUssd = aDemanderPermissionUssd,
                                )
                            }
                        }
                    }

                    // Cartes connues du stockage mais que la liste matérielle ne
                    // montre pas : sans la permission « Téléphone », Android ne
                    // révèle AUCUNE carte. Le relevé déjà obtenu doit pourtant
                    // rester consultable — et son code modifiable.
                    cartesUssd
                        .filter { connue -> cartesSim.none { it.abonnementId == connue.souscriptionId } }
                        .forEach { carte ->
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(MaterialTheme.colorScheme.surface)
                                    .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(16.dp))
                                    .padding(14.dp)
                            ) {
                                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        verticalAlignment = Alignment.CenterVertically,
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(34.dp)
                                                .clip(RoundedCornerShape(11.dp))
                                                .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.06f)),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(
                                                Icons.Filled.SimCard,
                                                contentDescription = null,
                                                tint = MaterialTheme.colorScheme.secondaryContainer,
                                                modifier = Modifier.size(18.dp)
                                            )
                                        }
                                        Spacer(Modifier.width(12.dp))
                                        Column {
                                            Text(
                                                text = if (carte.operateur.isNotBlank()) {
                                                    "Carte ${carte.operateur}"
                                                } else {
                                                    "Carte SIM de cet appareil"
                                                },
                                                color = MaterialTheme.colorScheme.onSurface,
                                                fontSize = 13.5.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                            Spacer(Modifier.height(1.dp))
                                            Text(
                                                text = "emplacement illisible sans la permission « Téléphone »",
                                                color = MaterialTheme.colorScheme.secondaryContainer,
                                                fontSize = 11.sp
                                            )
                                        }
                                    }

                                    BlocSoldeCarte(
                                        carte = carte,
                                        codeSaisi = codesSaisis[carte.souscriptionId] ?: carte.code,
                                        auChangementCode = { valeur ->
                                            codesSaisis = codesSaisis + (carte.souscriptionId to valeur)
                                        },
                                        aEnregistrerCode = {
                                            aEnregistrerCodeUssd(
                                                carte.souscriptionId,
                                                codesSaisis[carte.souscriptionId] ?: carte.code
                                            )
                                        },
                                        aVerifier = { aVerifierSolde(carte.souscriptionId) },
                                        verificationEnCours = relevageSoldeEnCours == carte.souscriptionId,
                                        message = messagesSolde[carte.souscriptionId].orEmpty(),
                                        permissionUssd = permissionUssd,
                                        aDemanderPermissionUssd = aDemanderPermissionUssd,
                                    )
                                }
                            }
                        }
                }
            }
        }
    }
}

/**
 * Relevé du solde d'UNE carte : code de consultation, dernier solde connu et
 * demande.
 *
 * Le code n'est jamais deviné : tant que l'utilisateur n'a rien saisi, aucune
 * demande n'est possible. Un code erroné peut souscrire à un service payant.
 */
@Composable
private fun BlocSoldeCarte(
    carte: CarteUssd?,
    codeSaisi: String,
    auChangementCode: (String) -> Unit,
    aEnregistrerCode: () -> Unit,
    aVerifier: () -> Unit,
    verificationEnCours: Boolean,
    message: String,
    permissionUssd: Boolean,
    aDemanderPermissionUssd: () -> Unit,
) {
    val isSombre = MaterialTheme.colorScheme.background.red < 0.2f
    val fondAmbre = if (isSombre) Color(0x22F59E0B) else AmbrePastelBg
    val bordureAmbre = if (isSombre) Color(0x44F59E0B) else AmbrePastelBordure
    val texteAmbre = if (isSombre) Color(0xFFFBBF24) else AmbrePastelTexte

    val solde = carte?.solde
    val dateSolde = solde?.horodatage
        ?.takeIf { it > 0L }
        ?.let { SimpleDateFormat("dd/MM 'à' HH:mm", Locale.FRANCE).format(Date(it)) }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(13.dp))
            .background(MaterialTheme.colorScheme.background.copy(alpha = 0.55f))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = "SOLDE",
                fontSize = 9.5.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.2.sp,
                color = MaterialTheme.colorScheme.secondaryContainer,
            )
            ChipStatut(
                libelle = when {
                    solde?.montant != null -> "RELEVÉ"
                    solde != null -> "SANS MONTANT"
                    else -> "JAMAIS RELEVÉ"
                },
                tonalite = if (solde?.montant != null) TonaliteChip.VERT else TonaliteChip.AMBRE,
            )
        }

        Text(
            text = when {
                solde?.montant != null -> libelleSolde(solde)
                !solde?.texte.isNullOrBlank() -> solde!!.texte!!
                else -> "Aucun relevé pour cette carte"
            },
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
        )
        Text(
            text = dateSolde?.let { "relevé le $it" } ?: "jamais interrogée",
            fontSize = 10.5.sp,
            color = MaterialTheme.colorScheme.secondaryContainer,
        )
        // La réponse brute reste visible : si le montant n'a pas pu être extrait,
        // mieux vaut montrer ce que l'opérateur a dit qu'un chiffre inventé.
        val brut = solde?.texte
        if (solde?.montant != null && !brut.isNullOrBlank()) {
            Text(
                text = "« $brut »",
                fontSize = 10.sp,
                color = MaterialTheme.colorScheme.secondaryContainer,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
        }

        OutlinedTextField(
            value = codeSaisi,
            onValueChange = auChangementCode,
            singleLine = true,
            placeholder = {
                Text(
                    text = "code de consultation, ex. #357#",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.secondaryContainer,
                )
            },
            // Clavier téléphonique : il donne # et * sans passer par les symboles.
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                focusedBorderColor = GradientIndigoStart,
                unfocusedBorderColor = MaterialTheme.colorScheme.outline,
                focusedTextColor = MaterialTheme.colorScheme.onSurface,
                unfocusedTextColor = MaterialTheme.colorScheme.onSurface,
            ),
            shape = RoundedCornerShape(12.dp),
        )

        val suggestions = carte?.suggestions.orEmpty().filter { it != codeSaisi }
        if (suggestions.isNotEmpty()) {
            Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
                Text(
                    text = "PROPOSÉ POUR ${carte?.operateur.orEmpty().uppercase()} — À VÉRIFIER",
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.secondaryContainer,
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    suggestions.forEach { suggestion ->
                        PuceCodeUssd(libelle = suggestion, auClic = { auChangementCode(suggestion) })
                    }
                }
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(13.dp))
                    .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(13.dp))
                    .background(MaterialTheme.colorScheme.surface)
                    .clickable(onClick = aEnregistrerCode)
                    .padding(vertical = 10.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = "enregistrer le code",
                    color = MaterialTheme.colorScheme.onSurface,
                    fontSize = 11.5.sp,
                    fontWeight = FontWeight.Bold,
                )
            }

            if (!permissionUssd) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(13.dp))
                        .background(fondAmbre)
                        .border(1.dp, bordureAmbre, RoundedCornerShape(13.dp))
                        .clickable(onClick = aDemanderPermissionUssd)
                        .padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        text = "autoriser le téléphone",
                        color = texteAmbre,
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.Bold,
                    )
                }
            } else {
                // Actif seulement si un code est déjà enregistré : le contrôleur
                // lit le stockage, pas le brouillon en cours de saisie.
                val codeEnregistre = !carte?.code.isNullOrBlank()
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(13.dp))
                        .background(if (verificationEnCours) MaterialTheme.colorScheme.surface else GradientIndigoStart)
                        .border(
                            1.dp,
                            if (verificationEnCours) MaterialTheme.colorScheme.outline else GradientIndigoStart,
                            RoundedCornerShape(13.dp)
                        )
                        .clickable(enabled = !verificationEnCours && codeEnregistre, onClick = aVerifier)
                        .padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Filled.Refresh,
                            contentDescription = null,
                            tint = if (verificationEnCours) MaterialTheme.colorScheme.secondaryContainer else Color.White,
                            modifier = Modifier.size(14.dp),
                        )
                        Spacer(Modifier.width(6.dp))
                        Text(
                            text = if (verificationEnCours) "interrogation…" else "vérifier le solde",
                            color = if (verificationEnCours) MaterialTheme.colorScheme.secondaryContainer else Color.White,
                            fontSize = 11.5.sp,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                }
            }
        }

        if (message.isNotEmpty()) {
            Text(
                text = message,
                color = if (solde?.montant != null) GradientIndigoStart else texteAmbre,
                fontSize = 11.5.sp,
                fontWeight = FontWeight.Medium,
            )
        }
    }
}

/**
 * Puce d'un code USSD proposé pour l'opérateur détecté.
 *
 * Un appui remplit le champ de saisie, et c'est tout : la suggestion n'est
 * jamais appliquée d'elle-même. Un code erroné peut souscrire à un service
 * payant — le geste de l'utilisateur doit rester explicite.
 */
@Composable
private fun PuceCodeUssd(
    libelle: String,
    auClic: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .background(MaterialTheme.colorScheme.surfaceVariant)
            .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(10.dp))
            .clickable(onClick = auClic)
            .padding(horizontal = 12.dp, vertical = 7.dp),
    ) {
        Text(
            text = libelle,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface,
        )
    }
}
