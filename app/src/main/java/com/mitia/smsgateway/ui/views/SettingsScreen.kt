package com.mitia.smsgateway.ui.views

import android.content.pm.PackageManager
import android.os.Build
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mitia.smsgateway.ui.theme.AccentBlue
import com.mitia.smsgateway.ui.theme.AccentRed
import com.mitia.smsgateway.ui.theme.BorderColor
import com.mitia.smsgateway.ui.theme.CardBg
import com.mitia.smsgateway.ui.theme.DarkBg
import com.mitia.smsgateway.ui.theme.TextMuted
import com.mitia.smsgateway.ui.theme.TextPrimary
import com.mitia.smsgateway.ui.theme.TextSecondary

@Composable
fun SettingsScreen(
    serverUrl: String,
    onServerUrlChange: (String) -> Unit,
    deviceToken: String?,
    deviceName: String,
    onDeviceNameChange: (String) -> Unit,
    quota: Int,
    quotaUsage: Int,
    hasSmsPerm: Boolean,
    hasNotifPerm: Boolean,
    batteryOk: Boolean,
    message: String,
    onSaveServer: () -> Unit,
    onTestConnection: () -> Unit,
    onSaveName: () -> Unit,
    onResetDevice: () -> Unit,
    onDisconnect: () -> Unit,
    onRequestSmsPermission: () -> Unit,
    onRequestNotifPermission: () -> Unit,
    onOpenBatterySettings: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(DarkBg)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
    ) {
        Text(
            text = "paramètres",
            color = TextPrimary,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
        )
        Spacer(Modifier.height(4.dp))
        Text(
            text = "configuration de l'appareil",
            color = TextMuted,
            fontSize = 12.sp,
        )
        Spacer(Modifier.height(20.dp))

        // Serveur
        FieldLabel("serveur")
        DarkTextField(
            value = serverUrl,
            onValueChange = onServerUrlChange,
            placeholder = "https://sms-gateway-omega.vercel.app",
        )
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = onSaveServer, modifier = Modifier.weight(1f)) {
                Text("enregistrer")
            }
            OutlinedButton(onClick = onTestConnection, modifier = Modifier.weight(1f)) {
                Text("tester la connexion")
            }
        }
        Spacer(Modifier.height(16.dp))

        // Jeton
        FieldLabel("jeton d'appareil")
        DarkTextField(
            value = deviceToken?.let { it.take(4) + "…" + it.takeLast(4) } ?: "non enregistré",
            onValueChange = {},
            enabled = false,
        )
        Spacer(Modifier.height(16.dp))

        // Nom
        FieldLabel("nom de l'appareil")
        DarkTextField(
            value = deviceName,
            onValueChange = onDeviceNameChange,
        )
        Spacer(Modifier.height(8.dp))
        OutlinedButton(onClick = onSaveName, modifier = Modifier.fillMaxWidth()) {
            Text("enregistrer le nom")
        }
        Spacer(Modifier.height(8.dp))
        TextButton(onClick = onResetDevice, modifier = Modifier.fillMaxWidth()) {
            Text("réinitialiser l'appareil", color = TextMuted, fontSize = 13.sp)
        }
        Spacer(Modifier.height(16.dp))

        // Quota
        FieldLabel("quota sms par heure")
        DarkTextField(
            value = quota.toString(),
            onValueChange = {},
            enabled = false,
            suffix = "imposé par le serveur",
        )
        Spacer(Modifier.height(4.dp))
        Text(
            text = "utilisé : $quotaUsage / $quota",
            color = TextMuted,
            fontSize = 11.sp,
        )
        Spacer(Modifier.height(16.dp))

        // Permissions
        FieldLabel("permissions")
        SettingsPermissionRow(
            ok = hasSmsPerm,
            label = "Envoi SMS",
            actionLabel = "autoriser",
            showAction = !hasSmsPerm,
            onAction = onRequestSmsPermission,
        )
        SettingsPermissionRow(
            ok = hasNotifPerm,
            label = "Notifications",
            actionLabel = "autoriser",
            showAction = !hasNotifPerm && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU,
            onAction = onRequestNotifPermission,
        )
        SettingsPermissionRow(
            ok = batteryOk,
            label = "Batterie sans restriction",
            actionLabel = "ouvrir réglages",
            showAction = !batteryOk,
            onAction = onOpenBatterySettings,
        )
        Spacer(Modifier.height(16.dp))

        // Déconnecter
        Button(
            onClick = onDisconnect,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(
                containerColor = AccentRed,
                contentColor = TextPrimary,
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
            color = TextMuted,
            fontSize = 11.sp,
            lineHeight = 16.sp,
        )

        if (message.isNotEmpty()) {
            Spacer(Modifier.height(12.dp))
            Text(
                text = message,
                color = AccentBlue,
                fontSize = 13.sp,
            )
        }

        Spacer(Modifier.height(24.dp))
        Text(
            text = "SMS Gateway ${appVersion()} · passerelle autohébergée",
            color = TextMuted,
            fontSize = 11.sp,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@Composable
private fun appVersion(): String {
    val context = LocalContext.current
    return try {
        val pm = context.packageManager
        val info = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            pm.getPackageInfo(context.packageName, PackageManager.PackageInfoFlags.of(0))
        } else {
            @Suppress("DEPRECATION")
            pm.getPackageInfo(context.packageName, 0)
        }
        info.versionName ?: "?"
    } catch (_: Exception) {
        "?"
    }
}

@Composable
private fun FieldLabel(text: String) {
    Text(
        text = text,
        color = TextMuted,
        fontSize = 12.sp,
        modifier = Modifier.padding(bottom = 6.dp),
    )
}

@Composable
private fun DarkTextField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String = "",
    enabled: Boolean = true,
    suffix: String? = null,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        enabled = enabled,
        placeholder = { Text(placeholder, color = TextMuted, fontSize = 13.sp) },
        modifier = Modifier.fillMaxWidth(),
        colors = OutlinedTextFieldDefaults.colors(
            focusedContainerColor = CardBg,
            unfocusedContainerColor = CardBg,
            disabledContainerColor = CardBg,
            focusedBorderColor = AccentBlue,
            unfocusedBorderColor = BorderColor,
            disabledBorderColor = BorderColor,
            focusedTextColor = TextPrimary,
            unfocusedTextColor = TextPrimary,
            disabledTextColor = TextSecondary,
            cursorColor = AccentBlue,
        ),
        shape = RoundedCornerShape(10.dp),
        trailingIcon = suffix?.let {
            {
                Text(
                    it,
                    color = TextMuted,
                    fontSize = 11.sp,
                    modifier = Modifier.padding(end = 8.dp),
                )
            }
        },
    )
}

@Composable
private fun SettingsPermissionRow(
    ok: Boolean,
    label: String,
    actionLabel: String,
    showAction: Boolean,
    onAction: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(
            imageVector = if (ok) Icons.Filled.Check else Icons.Filled.Close,
            contentDescription = null,
            tint = if (ok) AccentBlue else AccentRed,
        )
        Spacer(Modifier.width(10.dp))
        Text(
            text = label,
            color = TextPrimary,
            fontSize = 13.sp,
            modifier = Modifier.weight(1f),
        )
        if (showAction) {
            TextButton(onClick = onAction) {
                Text(actionLabel, color = AccentBlue, fontSize = 13.sp)
            }
        }
    }
}
