package com.mitia.smsgateway.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.mitia.smsgateway.SmsGatewayApp
import com.mitia.smsgateway.di.AppContainer
import com.mitia.smsgateway.domain.model.TasksResult
import com.mitia.smsgateway.util.Constants
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class SmsGatewayService : Service() {

    private val TAG = "SmsGatewayService"

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var pollingJob: Job? = null

    private fun container(): AppContainer =
        (application as SmsGatewayApp).appContainer

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "onStartCommand appelé")
        val notification = buildNotification()
        startForeground(Constants.FOREGROUND_NOTIFICATION_ID, notification)

        // Évite de lancer 2 boucles si onStartCommand est rappelé
        if (pollingJob?.isActive != true) {
            pollingJob = serviceScope.launch {
                runConnectionTest()
            }
        }
        return START_STICKY
    }

    override fun onDestroy() {
        // Best-effort : prévenir le serveur avant de mourir (bouton Déconnecter
        // ou système). Si ça n'aboutit pas, le sweep OFFLINE serveur (90 s
        // sans polling) prend le relais automatiquement.
        try {
            val t = Thread {
                try {
                    kotlinx.coroutines.runBlocking {
                        kotlinx.coroutines.withTimeout(5000L) {
                            val c = container()
                            val creds = c.deviceRepository.getCredentials()
                            if (creds != null) {
                                c.deviceRepository.disconnect(creds.first, creds.second)
                            }
                        }
                    }
                } catch (_: Exception) {
                }
            }
            t.start()
            t.join(6000L)
        } catch (_: Exception) {
        }
        pollingJob?.cancel()
        serviceScope.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    /**
     * Connexion Android ↔ Serveur :
     * 1. Auth via DeviceController (load sinon register).
     * 2. Boucle de polling toutes les 30s :
     *    a. rejoue les confirmations (PendingConfirmController),
     *    b. récupère les tasks, sync l'état local, vérifie le quota,
     *       traite via TaskController (claim, SMS, confirm).
     */
    private suspend fun runConnectionTest() {
        val c = container()

        // Synchronise l'URL du client HTTP avec la préférence stockée.
        val baseUrl = c.deviceRepository.getServerUrl()
        Log.d(TAG, "Serveur : $baseUrl")

        // --- 1. Auth ---
        val creds = c.deviceController.ensureRegistered() ?: return

        val deviceId = creds.first
        val token = creds.second
        Log.d(TAG, "Device prêt : id=$deviceId token=$token")

        // Récupérer et envoyer le token FCM actuel
        c.deviceController.refreshFcmToken(deviceId, token)

        // --- 2. Boucle de polling ---
        var wasConnected = false
        var firstSync = true
        var wasQuotaReached = false
        while (currentCoroutineContext().isActive) {
            try {
                // 2a. Rejouer les confirmations en attente (voir PendingConfirmController).
                c.pendingConfirmController.retryPendingConfirmations(deviceId, token)

                when (val tasksResult = c.taskRepository.fetchTasks(deviceId, token)) {
                    is TasksResult.Success -> {
                        if (!wasConnected) {
                            wasConnected = true
                            c.logRepository.log(
                                if (firstSync) "connexion au serveur ok" else "connexion rétablie"
                            )
                            firstSync = false
                        }
                        val now = System.currentTimeMillis()
                        c.deviceRepository.saveSync(now, tasksResult.tasks.size)
                        c.taskRepository.recordReceived(tasksResult.tasks)

                        // 2b. Quota serveur (transitions loggées une seule fois)
                        val quotaInfo = c.deviceRepository.getQuota(deviceId, token)
                        if (quotaInfo != null) {
                            c.deviceRepository.saveQuotaSnapshot(quotaInfo.quota, quotaInfo.usage)
                            if (quotaInfo.quota_reached && !wasQuotaReached) {
                                wasQuotaReached = true
                                c.logRepository.log(
                                    "quota horaire atteint (${quotaInfo.usage}/${quotaInfo.quota})"
                                )
                            } else if (!quotaInfo.quota_reached && wasQuotaReached) {
                                wasQuotaReached = false
                                c.logRepository.log("quota horaire réinitialisé")
                            }
                        }

                        if (tasksResult.tasks.isNotEmpty()) {
                            c.logRepository.log(
                                "sync file d'attente · ${tasksResult.tasks.size} tâche(s)"
                            )
                            c.taskController.processTasks(
                                applicationContext,
                                deviceId,
                                token,
                                tasksResult.tasks
                            ) { text -> updateNotification(text) }
                        } else {
                            Log.d(TAG, "Polling des tâches... aucune")
                        }
                    }
                    TasksResult.NetworkError -> {
                        if (wasConnected) {
                            wasConnected = false
                            c.logRepository.log("réseau perdu · reprise dans 30 s")
                        }
                    }
                }
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                Log.e(TAG, "Erreur inattendue dans la boucle de polling", e)
            }
            delay(Constants.POLL_INTERVAL_MS)
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                Constants.FOREGROUND_CHANNEL_ID,
                "SMS Gateway",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        return NotificationCompat.Builder(this, Constants.FOREGROUND_CHANNEL_ID)
            .setContentTitle("SMS-GATEWAY actif")
            .setContentText("En attente de tâches...")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setOngoing(true)
            .build()
    }

    private fun updateNotification(text: String) {
        val notification = NotificationCompat.Builder(this, Constants.FOREGROUND_CHANNEL_ID)
            .setContentTitle("SMS-GATEWAY actif")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setOngoing(true)
            .build()
        val manager = getSystemService(NotificationManager::class.java)
        manager.notify(Constants.FOREGROUND_NOTIFICATION_ID, notification)
    }
}
