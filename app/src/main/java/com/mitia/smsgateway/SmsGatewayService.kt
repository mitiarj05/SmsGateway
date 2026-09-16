package com.mitia.smsgateway

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessaging
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

    private val CHANNEL_ID = "sms_gateway_channel"
    private val NOTIFICATION_ID = 1
    private val TAG = "SmsGatewayService"
    private val POLL_INTERVAL_MS = 30_000L

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var pollingJob: Job? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "onStartCommand appelé")
        val notification = buildNotification()
        startForeground(NOTIFICATION_ID, notification)

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
                            val creds = DevicePreferences.load(applicationContext)
                            if (creds != null) {
                                ApiClient.setBaseUrl(DevicePreferences.getServerUrl(applicationContext))
                                ApiClient.disconnect(creds.first, creds.second)
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
     * 1. Charge deviceId + token, sinon register puis stocke.
     * 2. Boucle de polling toutes les 30s :
     *    a. rejoue les confirmations en attente (SMS déjà envoyés, JAMAIS renvoyés),
     *    b. récupère les tasks, claim SENDING, envoie le SMS UNE fois,
     *       confirme SENT/FAILED avec retry, sinon mise en file persistante.
     *
     * Anti-doublon (Piège 3) : le SMS n'est envoyé qu'après un claim SENDING
     * accepté par le serveur, et une seule fois. Si le réseau coupe après
     * l'envoi, seule la confirmation HTTP est rejouée.
     */
    private suspend fun runConnectionTest() {
        // --- 0. URL serveur persistée (change de WiFi = change d'IP, sans recompiler) ---
        ApiClient.setBaseUrl(DevicePreferences.getServerUrl(applicationContext))
        Log.d(TAG, "Serveur : ${ApiClient.baseUrl}")

        // --- 1. Auth : load sinon register ---
        var creds = DevicePreferences.load(applicationContext)
        if (creds == null) {
            val deviceName = DevicePreferences.getDeviceName(applicationContext)
            Log.d(TAG, "Aucun device enregistré, tentative registerDevice(\"$deviceName\")...")
            val registered = ApiClient.registerDevice(deviceName)
            if (registered == null) {
                Log.e(TAG, "Échec registerDevice : vérifie BASE_URL, serveur Next.js démarré, et INTERNET")
                EventLog.log(applicationContext, "échec enregistrement : serveur injoignable")
                return
            }
            DevicePreferences.save(applicationContext, registered.first, registered.second)
            creds = registered
            Log.d(TAG, "Device enregistré et stocké : id=${registered.first}")
            EventLog.log(applicationContext, "appareil enregistré : $deviceName")
        } else {
            Log.d(TAG, "Device déjà enregistré : id=${creds.first}")
        }

        var deviceId = creds.first
        var token = creds.second
        Log.d(TAG, "Device prêt : id=$deviceId token=$token")

        // Récupérer et envoyer le token FCM actuel
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (task.isSuccessful) {
                val fcmToken = task.result
                Log.d(TAG, "Token FCM actuel : $fcmToken")
                serviceScope.launch {
                    ApiClient.updateFcmToken(deviceId, token, fcmToken)
                }
            } else {
                Log.e(TAG, "Impossible de récupérer le token FCM", task.exception)
            }
        }

        // --- 2. Boucle de polling ---
        var wasConnected = false
        var firstSync = true
        var wasQuotaReached = false
        while (currentCoroutineContext().isActive) {
            try {
                // 2a. Rejouer les confirmations en attente (retry réseau pur,
                //     aucun SMS n'est renvoyé ici).
                retryPendingConfirmations(deviceId, token)

                when (val tasksResult = ApiClient.getTasksDetailed(deviceId, token)) {
                    is ApiClient.TasksResult.Success -> {
                        if (!wasConnected) {
                            wasConnected = true
                            EventLog.log(
                                applicationContext,
                                if (firstSync) "connexion au serveur ok" else "connexion rétablie"
                            )
                            firstSync = false
                        }
                        val now = System.currentTimeMillis()
                        DevicePreferences.saveSync(applicationContext, now, tasksResult.tasks.size)
                        TaskHistoryStore.upsertReceived(applicationContext, tasksResult.tasks)

                        // 2b. Quota serveur (transitions loggées une seule fois)
                        when (val quotaResult = ApiClient.getQuotaDetailed(deviceId, token)) {
                            is ApiClient.QuotaResult.Success -> {
                                DevicePreferences.saveQuotaSnapshot(
                                    applicationContext,
                                    quotaResult.quota.quota,
                                    quotaResult.quota.usage
                                )
                                if (quotaResult.quota.quota_reached && !wasQuotaReached) {
                                    wasQuotaReached = true
                                    EventLog.log(
                                        applicationContext,
                                        "quota horaire atteint (${quotaResult.quota.usage}/${quotaResult.quota.quota})"
                                    )
                                } else if (!quotaResult.quota.quota_reached && wasQuotaReached) {
                                    wasQuotaReached = false
                                    EventLog.log(applicationContext, "quota horaire réinitialisé")
                                }
                            }
                            ApiClient.QuotaResult.NetworkError -> {
                                // Le polling a marché : simple raté, on réessaiera au prochain tour.
                            }
                        }

                        if (tasksResult.tasks.isNotEmpty()) {
                            EventLog.log(
                                applicationContext,
                                "sync file d'attente · ${tasksResult.tasks.size} tâche(s)"
                            )
                            processTasks(deviceId, token, tasksResult.tasks)
                        } else {
                            Log.d(TAG, "Polling des tâches... aucune")
                        }
                    }
                    ApiClient.TasksResult.NetworkError -> {
                        if (wasConnected) {
                            wasConnected = false
                            EventLog.log(applicationContext, "réseau perdu · reprise dans 30 s")
                        }
                    }
                }
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                Log.e(TAG, "Erreur inattendue dans la boucle de polling", e)
            }
            delay(POLL_INTERVAL_MS)
        }
    }

    /**
     * Rejoue les confirmations persistées (SENT/FAILED dont l'accusé
     * serveur n'est jamais arrivé). Ne renvoie AUCUN SMS.
     */
    private suspend fun retryPendingConfirmations(deviceId: String, token: String) {
        val pending = PendingConfirmStore.loadAll(applicationContext)
        if (pending.isEmpty()) return
        Log.d(TAG, "${pending.size} confirmation(s) en attente, retry...")
        for (entry in pending) {
            val ok = ApiClient.confirmWithRetry(
                deviceId, token, entry.taskId, entry.statut, entry.errorMessage
            )
            if (ok) {
                PendingConfirmStore.remove(applicationContext, entry.taskId)
                Log.d(TAG, "Confirmation en attente soldée : ${entry.taskId} -> ${entry.statut}")
            } else {
                Log.w(TAG, "Confirmation toujours en échec (gardée en file) : ${entry.taskId}")
            }
        }
    }

    private suspend fun processTasks(
        deviceId: String,
        token: String,
        tasks: List<ApiClient.TaskDto>
    ) {
        if (tasks.isEmpty()) {
            Log.d(TAG, "Aucune tâche en attente")
            updateNotification("En attente de tâches...")
            return
        }
        Log.d(TAG, "${tasks.size} tâche(s) reçue(s) :")

        for (task in tasks) {
            Log.d(TAG, "Traitement de la task ${task.id}")

            val claim = ApiClient.updateTaskStatusDetailed(deviceId, token, task.id, "SENDING")
            val sendingOk = when (claim) {
                is ApiClient.StatusResult.Success, is ApiClient.StatusResult.AlreadyConfirmed -> true
                else -> false
            }
            if (!sendingOk) {
                when (claim) {
                    is ApiClient.StatusResult.AssignedToOther ->
                        Log.w(TAG, "Task ${task.id} déjà prise par ${claim.assignedTo}, on skip (pas de SMS)")
                    is ApiClient.StatusResult.FinalizedConflict ->
                        Log.w(TAG, "Task ${task.id} déjà finalisée (${claim.currentStatus}), on skip (pas de SMS)")
                    is ApiClient.StatusResult.HttpError, is ApiClient.StatusResult.NetworkError ->
                        Log.w(TAG, "Claim SENDING impossible (réseau ?), on skip sans envoyer : ${task.id}")
                    else -> {}
                }
                continue
            }

            val sent = SmsSender.sendSms(
                context = applicationContext,
                numero = task.numero_destinataire,
                message = task.message
            )

            if (sent) {
                Log.d(TAG, "SMS envoyé à ${task.numero_destinataire}")
                TaskHistoryStore.updateStatus(applicationContext, task.id, "SENT")
                EventLog.log(applicationContext, "sms envoyé > ${task.numero_destinataire}")
                val confirmed = ApiClient.confirmWithRetry(deviceId, token, task.id, "SENT")
                if (confirmed) {
                    EventLog.log(applicationContext, "accusé transmis au serveur")
                    updateNotification("SMS envoyé à ${task.numero_destinataire}")
                } else {
                    PendingConfirmStore.add(applicationContext, task.id, "SENT")
                    Log.w(TAG, "SENT non confirmé (réseau ?), mis en file : ${task.id}")
                    updateNotification("SMS envoyé, confirmation en attente...")
                }
            } else {
                Log.e(TAG, "Échec de l'envoi du SMS")
                val errorMessage = "SmsManager a retourné un échec"
                TaskHistoryStore.updateStatus(applicationContext, task.id, "FAILED", errorMessage)
                EventLog.log(applicationContext, "sms échoué > ${task.numero_destinataire}")
                val confirmed = ApiClient.confirmWithRetry(deviceId, token, task.id, "FAILED", errorMessage)
                if (confirmed) {
                    EventLog.log(applicationContext, "rapport d'échec envoyé au serveur")
                    updateNotification("Échec SMS à ${task.numero_destinataire}")
                } else {
                    PendingConfirmStore.add(applicationContext, task.id, "FAILED", errorMessage)
                    Log.w(TAG, "FAILED non confirmé (réseau ?), mis en file : ${task.id}")
                    updateNotification("Échec SMS, confirmation en attente...")
                }
            }
        }
    }

    private suspend fun handleTasks(
        deviceId: String,
        token: String,
        tasks: List<ApiClient.TaskDto>
    ) = processTasks(deviceId, token, tasks)

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "SMS Gateway",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("SMS-GATEWAY actif")
            .setContentText("En attente de tâches...")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setOngoing(true)
            .build()
    }

    private fun updateNotification(text: String) {
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("SMS-GATEWAY actif")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setOngoing(true)
            .build()
        val manager = getSystemService(NotificationManager::class.java)
        manager.notify(NOTIFICATION_ID, notification)
    }
}
