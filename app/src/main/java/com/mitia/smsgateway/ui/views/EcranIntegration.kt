package com.mitia.smsgateway.ui.views

import android.os.Build
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Sms
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import com.mitia.smsgateway.R
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mitia.smsgateway.ui.theme.BleuAccent
import com.mitia.smsgateway.ui.theme.VertAccent
import com.mitia.smsgateway.ui.theme.RougeAccent
import com.mitia.smsgateway.ui.theme.CouleurBordure
import com.mitia.smsgateway.ui.theme.FondCarte
import com.mitia.smsgateway.ui.theme.FondSombre
import com.mitia.smsgateway.ui.theme.TexteAttenue
import com.mitia.smsgateway.ui.theme.TextePrincipal

/** Écran de chargement (logo + spinner) pendant l'init. */
@Composable
fun EcranDemarrage(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(FondSombre),
        contentAlignment = Alignment.Center,
    ) {
        // Halos décoratifs
        Box(
            modifier = Modifier
                .size(320.dp)
                .offset(x = 120.dp, y = (-260).dp)
                .background(
                    Brush.radialGradient(
                        colors = listOf(BleuAccent.copy(alpha = 0.28f), Color.Transparent)
                    )
                )
        )
        Box(
            modifier = Modifier
                .size(320.dp)
                .offset(x = (-140).dp, y = 260.dp)
                .background(
                    Brush.radialGradient(
                        colors = listOf(BleuAccent.copy(alpha = 0.18f), Color.Transparent)
                    )
                )
        )
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Image(
                painter = painterResource(id = R.drawable.smsika),
                contentDescription = "SMSIKA",
                modifier = Modifier.size(96.dp),
            )
            Spacer(Modifier.height(16.dp))
            Text(
                text = "SMSIKA",
                color = TextePrincipal,
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = "passerelle autohébergée",
                color = TexteAttenue,
                fontSize = 13.sp,
            )
            Spacer(Modifier.height(24.dp))
            CircularProgressIndicator(color = BleuAccent)
        }
    }
}

/**
 * Assistant de première ouverture : bienvenue → serveur → permissions.
 * À la fin, le service démarre et on ne revoit plus cet écran.
 */
@Composable
fun EcranIntegration(
    urlServeur: String,
    auChangementUrlServeur: (String) -> Unit,
    message: String,
    aEnregistrerServeur: () -> Unit,
    aTesterConnexion: () -> Unit,
    permissionSms: Boolean,
    permissionNotifications: Boolean,
    batterieOk: Boolean,
    aDemanderPermissionSms: () -> Unit,
    aDemanderPermissionNotifications: () -> Unit,
    aOuvrirReglagesBatterie: () -> Unit,
    aTerminer: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var etape by remember { mutableIntStateOf(0) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(FondSombre)
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
    ) {
        Text(
            text = "Étape ${etape + 1}/3",
            color = TexteAttenue,
            fontSize = 12.sp,
        )
        Spacer(Modifier.height(8.dp))
        LinearProgressIndicator(
            progress = { (etape + 1) / 3f },
            modifier = Modifier.fillMaxWidth(),
            color = BleuAccent,
            trackColor = FondCarte,
        )
        Spacer(Modifier.height(32.dp))

        when (etape) {
            0 -> IntegrationBienvenue()
            1 -> IntegrationServeur(
                urlServeur = urlServeur,
                auChangementUrlServeur = auChangementUrlServeur,
                message = message,
                aEnregistrerServeur = aEnregistrerServeur,
                aTesterConnexion = aTesterConnexion,
            )
            else -> IntegrationPermissions(
                permissionSms = permissionSms,
                permissionNotifications = permissionNotifications,
                batterieOk = batterieOk,
                aDemanderPermissionSms = aDemanderPermissionSms,
                aDemanderPermissionNotifications = aDemanderPermissionNotifications,
                aOuvrirReglagesBatterie = aOuvrirReglagesBatterie,
            )
        }

        Spacer(Modifier.height(32.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (etape > 0) {
                OutlinedButton(onClick = { etape-- }) {
                    Icon(Icons.Filled.ArrowBack, contentDescription = null)
                    Spacer(Modifier.width(8.dp))
                    Text("Retour")
                }
            }
            Spacer(Modifier.weight(1f))
            if (etape < 2) {
                Button(
                    onClick = { etape++ },
                    enabled = etape != 1 || urlServeur.isNotBlank(),
                ) {
                    Text("Continuer")
                    Spacer(Modifier.width(8.dp))
                    Icon(Icons.Filled.ArrowForward, contentDescription = null)
                }
            } else {
                Button(
                    onClick = aTerminer,
                    enabled = permissionSms,
                ) {
                    Text("Terminer et démarrer")
                }
            }
        }
        if (etape == 2 && !permissionSms) {
            Spacer(Modifier.height(8.dp))
            Text(
                text = "La permission SMS est obligatoire pour envoyer.",
                color = RougeAccent,
                fontSize = 12.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}

@Composable
private fun IntegrationBienvenue() {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(28.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Image(
                painter = painterResource(id = R.drawable.smsika),
                contentDescription = "SMSIKA",
                modifier = Modifier.size(88.dp),
            )
        }
        Spacer(Modifier.height(24.dp))
        Text(
            text = "Bienvenue sur SMSIKA",
            color = TextePrincipal,
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(12.dp))
        Text(
            text = "Ce téléphone va devenir un émetteur SMS piloté par votre serveur : " +
                "il reçoit les tâches en push, envoie via sa carte SIM, même écran éteint.",
            color = TexteAttenue,
            fontSize = 14.sp,
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun IntegrationServeur(
    urlServeur: String,
    auChangementUrlServeur: (String) -> Unit,
    message: String,
    aEnregistrerServeur: () -> Unit,
    aTesterConnexion: () -> Unit,
) {
    Column {
        Text(
            text = "Connectez le serveur",
            color = TextePrincipal,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = "Adresse de votre passerelle (pré-remplie en production).",
            color = TexteAttenue,
            fontSize = 13.sp,
        )
        Spacer(Modifier.height(16.dp))
        OutlinedTextField(
            value = urlServeur,
            onValueChange = auChangementUrlServeur,
            label = { Text("Adresse serveur") },
            placeholder = { Text("https://sms-gateway-omega.vercel.app") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = FondCarte,
                unfocusedContainerColor = FondCarte,
                focusedBorderColor = BleuAccent,
                unfocusedBorderColor = CouleurBordure,
                focusedTextColor = TextePrincipal,
                unfocusedTextColor = TextePrincipal,
                cursorColor = BleuAccent,
            ),
            shape = RoundedCornerShape(10.dp),
        )
        Spacer(Modifier.height(12.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedButton(onClick = aTesterConnexion, modifier = Modifier.weight(1f)) {
                Text("Tester")
            }
            Button(onClick = aEnregistrerServeur, modifier = Modifier.weight(1f)) {
                Text("Enregistrer")
            }
        }
        if (message.isNotEmpty()) {
            Spacer(Modifier.height(12.dp))
            Text(text = message, color = BleuAccent, fontSize = 13.sp)
        }
    }
}

@Composable
private fun IntegrationPermissions(
    permissionSms: Boolean,
    permissionNotifications: Boolean,
    batterieOk: Boolean,
    aDemanderPermissionSms: () -> Unit,
    aDemanderPermissionNotifications: () -> Unit,
    aOuvrirReglagesBatterie: () -> Unit,
) {
    Column {
        Text(
            text = "Autorisations requises",
            color = TextePrincipal,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = "Sans elles, l'envoi en arrière-plan ne fonctionnera pas.",
            color = TexteAttenue,
            fontSize = 13.sp,
        )
        Spacer(Modifier.height(16.dp))
        LignePermissionIntegration(
            enRegle = permissionSms,
            etiquette = "Envoi SMS",
            detail = "obligatoire",
            etiquetteAction = "Autoriser",
            afficherAction = !permissionSms,
            aAction = aDemanderPermissionSms,
        )
        LignePermissionIntegration(
            enRegle = permissionNotifications,
            etiquette = "Notifications",
            detail = "service visible permanent",
            etiquetteAction = "Autoriser",
            afficherAction = !permissionNotifications && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU,
            aAction = aDemanderPermissionNotifications,
        )
        LignePermissionIntegration(
            enRegle = batterieOk,
            etiquette = "Batterie sans restriction",
            detail = "sinon Android tue le service",
            etiquetteAction = "Ouvrir réglages",
            afficherAction = !batterieOk,
            aAction = aOuvrirReglagesBatterie,
        )
    }
}

@Composable
private fun LignePermissionIntegration(
    enRegle: Boolean,
    etiquette: String,
    detail: String,
    etiquetteAction: String,
    afficherAction: Boolean,
    aAction: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(
            imageVector = if (enRegle) Icons.Filled.Check else Icons.Filled.Close,
            contentDescription = null,
            tint = if (enRegle) VertAccent else RougeAccent,
        )
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(text = etiquette, color = TextePrincipal, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
            Text(text = detail, color = TexteAttenue, fontSize = 12.sp)
        }
        if (afficherAction) {
            Button(onClick = aAction) {
                Text(etiquetteAction)
            }
        }
    }
}
