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
import com.mitia.smsgateway.ui.theme.AccentBlue
import com.mitia.smsgateway.ui.theme.AccentGreen
import com.mitia.smsgateway.ui.theme.AccentRed
import com.mitia.smsgateway.ui.theme.BorderColor
import com.mitia.smsgateway.ui.theme.CardBg
import com.mitia.smsgateway.ui.theme.DarkBg
import com.mitia.smsgateway.ui.theme.TextMuted
import com.mitia.smsgateway.ui.theme.TextPrimary

/** Écran de chargement (logo + spinner) pendant l'init. */
@Composable
fun SplashScreen(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(DarkBg),
        contentAlignment = Alignment.Center,
    ) {
        // Halos décoratifs
        Box(
            modifier = Modifier
                .size(320.dp)
                .offset(x = 120.dp, y = (-260).dp)
                .background(
                    Brush.radialGradient(
                        colors = listOf(AccentBlue.copy(alpha = 0.28f), Color.Transparent)
                    )
                )
        )
        Box(
            modifier = Modifier
                .size(320.dp)
                .offset(x = (-140).dp, y = 260.dp)
                .background(
                    Brush.radialGradient(
                        colors = listOf(AccentBlue.copy(alpha = 0.18f), Color.Transparent)
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
                color = TextPrimary,
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = "passerelle autohébergée",
                color = TextMuted,
                fontSize = 13.sp,
            )
            Spacer(Modifier.height(24.dp))
            CircularProgressIndicator(color = AccentBlue)
        }
    }
}

/**
 * Assistant de première ouverture : bienvenue → serveur → permissions.
 * À la fin, le service démarre et on ne revoit plus cet écran.
 */
@Composable
fun OnboardingScreen(
    serverUrl: String,
    onServerUrlChange: (String) -> Unit,
    message: String,
    onSaveServer: () -> Unit,
    onTestConnection: () -> Unit,
    hasSmsPerm: Boolean,
    hasNotifPerm: Boolean,
    batteryOk: Boolean,
    onRequestSmsPermission: () -> Unit,
    onRequestNotifPermission: () -> Unit,
    onOpenBatterySettings: () -> Unit,
    onFinish: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var step by remember { mutableIntStateOf(0) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(DarkBg)
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
    ) {
        Text(
            text = "Étape ${step + 1}/3",
            color = TextMuted,
            fontSize = 12.sp,
        )
        Spacer(Modifier.height(8.dp))
        LinearProgressIndicator(
            progress = { (step + 1) / 3f },
            modifier = Modifier.fillMaxWidth(),
            color = AccentBlue,
            trackColor = CardBg,
        )
        Spacer(Modifier.height(32.dp))

        when (step) {
            0 -> OnboardingWelcome()
            1 -> OnboardingServer(
                serverUrl = serverUrl,
                onServerUrlChange = onServerUrlChange,
                message = message,
                onSaveServer = onSaveServer,
                onTestConnection = onTestConnection,
            )
            else -> OnboardingPermissions(
                hasSmsPerm = hasSmsPerm,
                hasNotifPerm = hasNotifPerm,
                batteryOk = batteryOk,
                onRequestSmsPermission = onRequestSmsPermission,
                onRequestNotifPermission = onRequestNotifPermission,
                onOpenBatterySettings = onOpenBatterySettings,
            )
        }

        Spacer(Modifier.height(32.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (step > 0) {
                OutlinedButton(onClick = { step-- }) {
                    Icon(Icons.Filled.ArrowBack, contentDescription = null)
                    Spacer(Modifier.width(8.dp))
                    Text("Retour")
                }
            }
            Spacer(Modifier.weight(1f))
            if (step < 2) {
                Button(
                    onClick = { step++ },
                    enabled = step != 1 || serverUrl.isNotBlank(),
                ) {
                    Text("Continuer")
                    Spacer(Modifier.width(8.dp))
                    Icon(Icons.Filled.ArrowForward, contentDescription = null)
                }
            } else {
                Button(
                    onClick = onFinish,
                    enabled = hasSmsPerm,
                ) {
                    Text("Terminer et démarrer")
                }
            }
        }
        if (step == 2 && !hasSmsPerm) {
            Spacer(Modifier.height(8.dp))
            Text(
                text = "La permission SMS est obligatoire pour envoyer.",
                color = AccentRed,
                fontSize = 12.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}

@Composable
private fun OnboardingWelcome() {
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
            color = TextPrimary,
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(12.dp))
        Text(
            text = "Ce téléphone va devenir un émetteur SMS piloté par votre serveur : " +
                "il reçoit les tâches en push, envoie via sa carte SIM, même écran éteint.",
            color = TextMuted,
            fontSize = 14.sp,
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun OnboardingServer(
    serverUrl: String,
    onServerUrlChange: (String) -> Unit,
    message: String,
    onSaveServer: () -> Unit,
    onTestConnection: () -> Unit,
) {
    Column {
        Text(
            text = "Connectez le serveur",
            color = TextPrimary,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = "Adresse de votre passerelle (pré-remplie en production).",
            color = TextMuted,
            fontSize = 13.sp,
        )
        Spacer(Modifier.height(16.dp))
        OutlinedTextField(
            value = serverUrl,
            onValueChange = onServerUrlChange,
            label = { Text("Adresse serveur") },
            placeholder = { Text("https://sms-gateway-omega.vercel.app") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = CardBg,
                unfocusedContainerColor = CardBg,
                focusedBorderColor = AccentBlue,
                unfocusedBorderColor = BorderColor,
                focusedTextColor = TextPrimary,
                unfocusedTextColor = TextPrimary,
                cursorColor = AccentBlue,
            ),
            shape = RoundedCornerShape(10.dp),
        )
        Spacer(Modifier.height(12.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedButton(onClick = onTestConnection, modifier = Modifier.weight(1f)) {
                Text("Tester")
            }
            Button(onClick = onSaveServer, modifier = Modifier.weight(1f)) {
                Text("Enregistrer")
            }
        }
        if (message.isNotEmpty()) {
            Spacer(Modifier.height(12.dp))
            Text(text = message, color = AccentBlue, fontSize = 13.sp)
        }
    }
}

@Composable
private fun OnboardingPermissions(
    hasSmsPerm: Boolean,
    hasNotifPerm: Boolean,
    batteryOk: Boolean,
    onRequestSmsPermission: () -> Unit,
    onRequestNotifPermission: () -> Unit,
    onOpenBatterySettings: () -> Unit,
) {
    Column {
        Text(
            text = "Autorisations requises",
            color = TextPrimary,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = "Sans elles, l'envoi en arrière-plan ne fonctionnera pas.",
            color = TextMuted,
            fontSize = 13.sp,
        )
        Spacer(Modifier.height(16.dp))
        OnboardingPermRow(
            ok = hasSmsPerm,
            label = "Envoi SMS",
            detail = "obligatoire",
            actionLabel = "Autoriser",
            showAction = !hasSmsPerm,
            onAction = onRequestSmsPermission,
        )
        OnboardingPermRow(
            ok = hasNotifPerm,
            label = "Notifications",
            detail = "service visible permanent",
            actionLabel = "Autoriser",
            showAction = !hasNotifPerm && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU,
            onAction = onRequestNotifPermission,
        )
        OnboardingPermRow(
            ok = batteryOk,
            label = "Batterie sans restriction",
            detail = "sinon Android tue le service",
            actionLabel = "Ouvrir réglages",
            showAction = !batteryOk,
            onAction = onOpenBatterySettings,
        )
    }
}

@Composable
private fun OnboardingPermRow(
    ok: Boolean,
    label: String,
    detail: String,
    actionLabel: String,
    showAction: Boolean,
    onAction: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(
            imageVector = if (ok) Icons.Filled.Check else Icons.Filled.Close,
            contentDescription = null,
            tint = if (ok) AccentGreen else AccentRed,
        )
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(text = label, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
            Text(text = detail, color = TextMuted, fontSize = 12.sp)
        }
        if (showAction) {
            Button(onClick = onAction) {
                Text(actionLabel)
            }
        }
    }
}
