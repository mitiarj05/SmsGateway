package com.mitia.smsgateway.ui.views

import android.content.ClipData
import android.content.ClipboardManager
import android.content.pm.PackageManager
import android.os.Build
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mitia.smsgateway.ui.components.EtiquetteSection
import com.mitia.smsgateway.ui.theme.BleuAccent
import com.mitia.smsgateway.ui.theme.VertAccent
import com.mitia.smsgateway.ui.theme.RougeAccent
import com.mitia.smsgateway.ui.theme.CouleurBordure
import com.mitia.smsgateway.ui.theme.FondCarte
import com.mitia.smsgateway.ui.theme.FondSombre
import com.mitia.smsgateway.ui.theme.TexteAttenue
import com.mitia.smsgateway.ui.theme.TextePrincipal
import com.mitia.smsgateway.ui.theme.TexteSecondaire

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
) {
    val context = LocalContext.current
    var copie by remember { mutableStateOf(false) }
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(FondSombre)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
    ) {
        Text(
            text = "paramètres",
            color = TextePrincipal,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
        )
        Spacer(Modifier.height(4.dp))
        Text(
            text = "configuration de l'appareil",
            color = TexteAttenue,
            fontSize = 12.sp,
        )
        Spacer(Modifier.height(20.dp))

        // Serveur
        EtiquetteSection("Connexion")
        EtiquetteChamp("serveur")
        ChampTexteSombre(
            valeur = urlServeur,
            auChangementValeur = auChangementUrlServeur,
            texteIndicatif = "https://sms-gateway-omega.vercel.app",
        )
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = aEnregistrerServeur, modifier = Modifier.weight(1f)) {
                Text("enregistrer")
            }
            OutlinedButton(onClick = aTesterConnexion, modifier = Modifier.weight(1f)) {
                Text("tester")
            }
        }
        Spacer(Modifier.height(16.dp))

        // Jeton
        EtiquetteSection("Appareil")
        EtiquetteChamp("jeton d'appareil (toucher l'icône pour copier)")
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(modifier = Modifier.weight(1f)) {
                ChampTexteSombre(
                    valeur = jetonAppareil?.let { it.take(4) + "…" + it.takeLast(4) } ?: "non enregistré",
                    auChangementValeur = {},
                    active = false,
                )
            }
            IconButton(
                onClick = {
                    val jeton = jetonAppareil
                    if (!jeton.isNullOrBlank()) {
                        val pressePapiers = context.getSystemService(ClipboardManager::class.java)
                        pressePapiers?.setPrimaryClip(ClipData.newPlainText("jeton", jeton))
                        copie = true
                    }
                },
                enabled = !jetonAppareil.isNullOrBlank(),
            ) {
                Icon(
                    imageVector = Icons.Filled.ContentCopy,
                    contentDescription = "Copier le jeton",
                    tint = if (copie) VertAccent else TexteAttenue,
                )
            }
        }
        if (copie) {
            Text(text = "copié !", color = VertAccent, fontSize = 11.sp)
        }
        Spacer(Modifier.height(16.dp))

        // Nom
        EtiquetteChamp("nom de l'appareil")
        ChampTexteSombre(
            valeur = nomAppareil,
            auChangementValeur = auChangementNomAppareil,
        )
        Spacer(Modifier.height(8.dp))
        OutlinedButton(onClick = aEnregistrerNom, modifier = Modifier.fillMaxWidth()) {
            Text("enregistrer le nom")
        }
        Spacer(Modifier.height(8.dp))
        TextButton(onClick = aReinitialiserAppareil, modifier = Modifier.fillMaxWidth()) {
            Text("réinitialiser l'appareil", color = TexteAttenue, fontSize = 13.sp)
        }
        Spacer(Modifier.height(16.dp))

        // Quota
        EtiquetteSection("Limites")
        EtiquetteChamp("quota sms par heure")
        ChampTexteSombre(
            valeur = quota.toString(),
            auChangementValeur = {},
            active = false,
            suffixe = "imposé par le serveur",
        )
        Spacer(Modifier.height(4.dp))
        Text(
            text = "utilisé : $usageQuota / $quota",
            color = TexteAttenue,
            fontSize = 11.sp,
        )
        Spacer(Modifier.height(16.dp))

        // Permissions
        EtiquetteSection("Permissions")
        LignePermissionParametres(
            enRegle = permissionSms,
            etiquette = "Envoi SMS",
            etiquetteAction = "autoriser",
            afficherAction = !permissionSms,
            aAction = aDemanderPermissionSms,
        )
        LignePermissionParametres(
            enRegle = permissionNotifications,
            etiquette = "Notifications",
            etiquetteAction = "autoriser",
            afficherAction = !permissionNotifications && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU,
            aAction = aDemanderPermissionNotifications,
        )
        LignePermissionParametres(
            enRegle = batterieOk,
            etiquette = "Batterie sans restriction",
            etiquetteAction = "ouvrir réglages",
            afficherAction = !batterieOk,
            aAction = aOuvrirReglagesBatterie,
        )
        Spacer(Modifier.height(16.dp))

        // Déconnecter
        EtiquetteSection("Session")
        Button(
            onClick = aDeconnecter,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(
                containerColor = RougeAccent,
                contentColor = TextePrincipal,
            ),
        ) {
            Text(
                "déconnecter l'appareil",
                fontSize = 15.sp,
                fontWeight = FontWeight.Medium,
            )
        }
        Spacer(Modifier.height(12.dp))
        Text(
            text = "la désactivation coupe le foreground service :\n" +
                "l'appareil n'envoie plus de sms.",
            color = TexteAttenue,
            fontSize = 11.sp,
            lineHeight = 16.sp,
        )

        if (message.isNotEmpty()) {
            Spacer(Modifier.height(12.dp))
            Text(
                text = message,
                color = BleuAccent,
                fontSize = 13.sp,
            )
        }

        Spacer(Modifier.height(24.dp))
        Text(
            text = "SMSIKA ${versionApp()} · passerelle autohébergée",
            color = TexteAttenue,
            fontSize = 11.sp,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@Composable
private fun versionApp(): String {
    val context = LocalContext.current
    return try {
        val gestionnairePaquets = context.packageManager
        val infos = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            gestionnairePaquets.getPackageInfo(context.packageName, PackageManager.PackageInfoFlags.of(0))
        } else {
            @Suppress("DEPRECATION")
            gestionnairePaquets.getPackageInfo(context.packageName, 0)
        }
        infos.versionName ?: "?"
    } catch (_: Exception) {
        "?"
    }
}

@Composable
private fun EtiquetteChamp(texte: String) {
    Text(
        text = texte,
        color = TexteAttenue,
        fontSize = 12.sp,
        modifier = Modifier.padding(bottom = 6.dp),
    )
}

@Composable
private fun ChampTexteSombre(
    valeur: String,
    auChangementValeur: (String) -> Unit,
    texteIndicatif: String = "",
    active: Boolean = true,
    suffixe: String? = null,
) {
    OutlinedTextField(
        value = valeur,
        onValueChange = auChangementValeur,
        enabled = active,
        placeholder = { Text(texteIndicatif, color = TexteAttenue, fontSize = 13.sp) },
        modifier = Modifier.fillMaxWidth(),
        colors = OutlinedTextFieldDefaults.colors(
            focusedContainerColor = FondCarte,
            unfocusedContainerColor = FondCarte,
            disabledContainerColor = FondCarte,
            focusedBorderColor = BleuAccent,
            unfocusedBorderColor = CouleurBordure,
            disabledBorderColor = CouleurBordure,
            focusedTextColor = TextePrincipal,
            unfocusedTextColor = TextePrincipal,
            disabledTextColor = TexteSecondaire,
            cursorColor = BleuAccent,
        ),
        shape = RoundedCornerShape(10.dp),
        trailingIcon = suffixe?.let {
            {
                Text(
                    it,
                    color = TexteAttenue,
                    fontSize = 11.sp,
                    modifier = Modifier.padding(end = 8.dp),
                )
            }
        },
    )
}

@Composable
private fun LignePermissionParametres(
    enRegle: Boolean,
    etiquette: String,
    etiquetteAction: String,
    afficherAction: Boolean,
    aAction: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(
            imageVector = if (enRegle) Icons.Filled.Check else Icons.Filled.Close,
            contentDescription = null,
            tint = if (enRegle) BleuAccent else RougeAccent,
        )
        Spacer(Modifier.width(10.dp))
        Text(
            text = etiquette,
            color = TextePrincipal,
            fontSize = 13.sp,
            modifier = Modifier.weight(1f),
        )
        if (afficherAction) {
            TextButton(onClick = aAction) {
                Text(etiquetteAction, color = BleuAccent, fontSize = 13.sp)
            }
        }
    }
}
