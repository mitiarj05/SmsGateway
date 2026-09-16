package com.mitia.smsgateway.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.mitia.smsgateway.EventItem
import com.mitia.smsgateway.HistoryTask
import com.mitia.smsgateway.ui.components.BottomNav
import com.mitia.smsgateway.ui.components.DashboardTab
import com.mitia.smsgateway.ui.screens.LogScreen
import com.mitia.smsgateway.ui.screens.SettingsScreen
import com.mitia.smsgateway.ui.screens.StatusScreen
import com.mitia.smsgateway.ui.screens.TasksScreen
import com.mitia.smsgateway.ui.theme.DarkBg
import com.mitia.smsgateway.ui.timeAgoText

/**
 * Conteneur des 4 écrans avec navigation basse.
 * Toute la donnée vient de MainActivity (temps réel) : aucun mock ici.
 */
@Composable
fun AppNavigation(
    // Statut
    deviceName: String,
    isOnline: Boolean,
    serviceRunning: Boolean,
    smsSentToday: Int,
    smsPending: Int,
    network: String,
    batteryPercent: Int,
    batteryCharging: Boolean,
    smsQuotaUsed: Int,
    smsQuotaTotal: Int,
    onStartService: () -> Unit,
    // Tâches
    tasks: List<HistoryTask>,
    lastSync: Long,
    // Journal
    events: List<EventItem>,
    onExportLog: () -> Unit,
    onClearLog: () -> Unit,
    // Réglages
    serverUrl: String,
    onServerUrlChange: (String) -> Unit,
    deviceToken: String?,
    onDeviceNameChange: (String) -> Unit,
    settingsMessage: String,
    onSaveServer: () -> Unit,
    onTestConnection: () -> Unit,
    onSaveName: () -> Unit,
    onResetDevice: () -> Unit,
    onDisconnect: () -> Unit,
    hasSmsPerm: Boolean,
    hasNotifPerm: Boolean,
    batteryOk: Boolean,
    onRequestSmsPermission: () -> Unit,
    onRequestNotifPermission: () -> Unit,
    onOpenBatterySettings: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var tab by remember { mutableStateOf(DashboardTab.STATUS) }

    Scaffold(
        containerColor = DarkBg,
        bottomBar = {
            BottomNav(
                selected = tab,
                onSelect = { tab = it },
            )
        },
    ) { innerPadding ->
        Box(
            modifier = modifier
                .fillMaxSize()
                .padding(innerPadding),
        ) {
            when (tab) {
                DashboardTab.STATUS -> StatusScreen(
                    deviceName = deviceName,
                    isOnline = isOnline,
                    serviceRunning = serviceRunning,
                    smsSentToday = smsSentToday,
                    smsPending = smsPending,
                    network = network,
                    batteryPercent = batteryPercent,
                    batteryCharging = batteryCharging,
                    smsQuotaUsed = smsQuotaUsed,
                    smsQuotaTotal = smsQuotaTotal,
                    onStartService = onStartService,
                )
                DashboardTab.TASKS -> TasksScreen(
                    tasks = tasks,
                    lastSyncText = timeAgoText(lastSync),
                )
                DashboardTab.LOG -> LogScreen(
                    events = events,
                    onExport = onExportLog,
                    onClear = onClearLog,
                )
                DashboardTab.SETTINGS -> SettingsScreen(
                    serverUrl = serverUrl,
                    onServerUrlChange = onServerUrlChange,
                    deviceToken = deviceToken,
                    deviceName = deviceName,
                    onDeviceNameChange = onDeviceNameChange,
                    quota = smsQuotaTotal,
                    quotaUsage = smsQuotaUsed,
                    hasSmsPerm = hasSmsPerm,
                    hasNotifPerm = hasNotifPerm,
                    batteryOk = batteryOk,
                    message = settingsMessage,
                    onSaveServer = onSaveServer,
                    onTestConnection = onTestConnection,
                    onSaveName = onSaveName,
                    onResetDevice = onResetDevice,
                    onDisconnect = onDisconnect,
                    onRequestSmsPermission = onRequestSmsPermission,
                    onRequestNotifPermission = onRequestNotifPermission,
                    onOpenBatterySettings = onOpenBatterySettings,
                )
            }
        }
    }
}
