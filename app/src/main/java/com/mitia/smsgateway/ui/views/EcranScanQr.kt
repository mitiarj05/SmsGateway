package com.mitia.smsgateway.ui.views

import android.Manifest
import android.content.pm.PackageManager
import android.provider.Settings
import android.util.Log
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.google.firebase.auth.FirebaseAuth
import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanOptions
import com.mitia.smsgateway.data.local.PreferencesAppareil
import com.mitia.smsgateway.data.remote.ClientApi
import com.mitia.smsgateway.domain.model.ResultatEnregistrement
import com.mitia.smsgateway.ui.theme.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

/**
 * Scan d'un QR de liaison « /lier/<code> » affiché dans l'espace client.
 * Chaîne complète : permission caméra → scan → URL serveur mémorisée →
 * Firebase anonyme → consommation du code → identifiants mémorisés.
 */
@Composable
fun EcranScanQr(
    aLiaisonReussie: (appareilId: String, jeton: String) -> Unit = { _, _ -> },
    aFermer: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    val contexte = LocalContext.current
    val portee = rememberCoroutineScope()
    var etape by remember { mutableStateOf("attente") } // attente | permission | scan | liaison | erreur
    var messageErreur by remember { mutableStateOf<String?>(null) }

    fun androidId(): String? = try {
        Settings.Secure.getString(contexte.contentResolver, Settings.Secure.ANDROID_ID)
    } catch (_: Exception) {
        null
    }

    suspend fun traiterContenu(contenu: String) {
        // Format attendu : <origine>/lier/<code>
        val match = Regex("^(https?://[^/]+)/lier/([A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+)\\s*$").find(contenu.trim())
        if (match == null) {
            etape = "erreur"
            messageErreur = "QR non reconnu — flashez le QR « Associer un téléphone » de votre espace."
            return
        }
        val origine = match.groupValues[1]
        val code = match.groupValues[2]
        etape = "liaison"
        try {
            ClientApi.definirUrlBase(origine)
            val auth = FirebaseAuth.getInstance()
            if (auth.currentUser == null) {
                auth.signInAnonymously().await()
            }
            val jetonId = auth.currentUser?.getIdToken(false)?.await()?.token
            if (jetonId.isNullOrBlank()) {
                etape = "erreur"
                messageErreur = "Authentification impossible — vérifiez la connexion."
                return
            }
            val identifiantMateriel = androidId()
            if (identifiantMateriel.isNullOrBlank()) {
                etape = "erreur"
                messageErreur = "Identifiant de l'appareil indisponible."
                return
            }
            when (
                val resultat = ClientApi.lierParCode(
                    urlServeur = origine,
                    code = code,
                    nom = android.os.Build.MODEL ?: "Téléphone Android",
                    androidId = identifiantMateriel,
                    jetonId = jetonId,
                )
            ) {
                is ResultatEnregistrement.Succes -> {
                    PreferencesAppareil.enregistrerUrlServeur(contexte, origine)
                    PreferencesAppareil.enregistrer(contexte, resultat.appareilId, resultat.jeton)
                    aLiaisonReussie(resultat.appareilId, resultat.jeton)
                }
                is ResultatEnregistrement.ErreurHttp -> {
                    etape = "erreur"
                    messageErreur = resultat.message ?: "Liaison refusée (${resultat.code})."
                }
                ResultatEnregistrement.ErreurReseau -> {
                    etape = "erreur"
                    messageErreur = "Serveur injoignable — vérifiez l'URL et la connexion."
                }
            }
        } catch (e: Exception) {
            Log.e("EcranScanQr", "Échec liaison", e)
            etape = "erreur"
            messageErreur = "Liaison impossible — réessayez."
        }
    }

    val lanceurScan = rememberLauncherForActivityResult(ScanContract()) { resultat ->
        if (resultat.contents.isNullOrBlank()) {
            aFermer()
            return@rememberLauncherForActivityResult
        }
        portee.launch { traiterContenu(resultat.contents) }
    }

    val lanceurCamera = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { accordee ->
        if (accordee) {
            etape = "scan"
            lanceurScan.launch(
                ScanOptions()
                    .setPrompt("Scannez le QR « Associer un téléphone »")
                    .setBeepEnabled(true)
                    .setOrientationLocked(true)
            )
        } else {
            etape = "erreur"
            messageErreur = "Caméra refusée — autorisez-la pour scanner le QR."
        }
    }

    LaunchedEffect(Unit) {
        if (ContextCompat.checkSelfPermission(contexte, Manifest.permission.CAMERA) ==
            PackageManager.PERMISSION_GRANTED
        ) {
            etape = "scan"
            lanceurScan.launch(
                ScanOptions()
                    .setPrompt("Scannez le QR « Associer un téléphone »")
                    .setBeepEnabled(true)
                    .setOrientationLocked(true)
            )
        } else {
            etape = "permission"
            lanceurCamera.launch(Manifest.permission.CAMERA)
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(14.dp),
            modifier = Modifier.padding(32.dp)
        ) {
            when (etape) {
                "liaison" -> {
                    CircularProgressIndicator(color = GradientIndigoStart)
                    Text(
                        text = "Liaison en cours…",
                        color = MaterialTheme.colorScheme.onSurface,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                "erreur" -> {
                    Icon(
                        imageVector = Icons.Filled.QrCodeScanner,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.secondaryContainer,
                        modifier = Modifier.size(48.dp)
                    )
                    Text(
                        text = messageErreur ?: "Échec du scan.",
                        color = MaterialTheme.colorScheme.onSurface,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center
                    )
                    TextButton(onClick = {
                        etape = "scan"
                        lanceurScan.launch(
                            ScanOptions()
                                .setPrompt("Scannez le QR « Associer un téléphone »")
                                .setBeepEnabled(true)
                                .setOrientationLocked(true)
                        )
                    }) {
                        Text("Recommencer", color = GradientIndigoStart, fontWeight = FontWeight.Bold)
                    }
                    TextButton(onClick = aFermer) {
                        Text("Fermer", color = MaterialTheme.colorScheme.secondaryContainer)
                    }
                }
                else -> {
                    CircularProgressIndicator(color = GradientIndigoStart)
                    Text(
                        text = "Ouverture de la caméra…",
                        color = MaterialTheme.colorScheme.secondaryContainer,
                        fontSize = 13.sp
                    )
                    TextButton(onClick = aFermer) {
                        Text("Annuler", color = MaterialTheme.colorScheme.secondaryContainer)
                    }
                }
            }
        }
    }
}
