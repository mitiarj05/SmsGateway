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
    private val MAX_POLL_INTERVAL_MS = 300_000L // 5 min max en cas de coupure réseau

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
            Log.d(TAG, "Aucun device enregistré, tentative registerDevice(\"Mon telephone\")...")
            val registered = ApiClient.registerDevice("Mon telephone")
            if (registered == null) {
                Log.e(TAG, "Échec registerDevice : vérifie BASE_URL, serveur Next.js démarré, et INTERNET")
                return
            }
            DevicePreferences.save(applicationContext, registered.first, registered.second)
            creds = registered
            Log.d(TAG, "Device enregistré et stocké : id=${registered.first}")
        } else {
            Log.d(TAG, "Device déjà enregistré : id=${creds.first}")
        }

        var deviceId = creds.first
        var token = creds.second
        // Log complet pour le test (permet de rejouer en PowerShell avec le même token).
        // En prod : ne logger que les 8 premiers caractères.
        Log.d(TAG, "Device prêt : id=$deviceId token=$token")

        // --- 2. Boucle de polling ---
        var consecutiveNetworkFailures = 0
        while (currentCoroutineContext().isActive) {
            try {
                // 2a. Rejouer les confirmations en attente (retry réseau pur,
                //     aucun SMS n'est renvoyé ici).
                retryPendingConfirmations(deviceId, token)

                Log.d(TAG, "Polling des tâches...")
                when (val result = ApiClient.getTasksDetailed(deviceId, token)) {
                    is ApiClient.TasksResult.NetworkError -> {
                        consecutiveNetworkFailures++
                        val backoff = (POLL_INTERVAL_MS * (1 shl consecutiveNetworkFailures.coerceAtMost(4)))
                            .coerceAtMost(MAX_POLL_INTERVAL_MS)
                        Log.w(TAG, "Réseau indisponible, prochain essai dans ${backoff}ms (échec n°$consecutiveNetworkFailures)")
                        updateNotification("Hors ligne, nouvel essai bientôt...")
                        delay(backoff)
                        continue
                    }
                    is ApiClient.TasksResult.Success -> {
                        consecutiveNetworkFailures = 0
                        handleTasks(deviceId, token, result.tasks)
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

    private suspend fun handleTasks(
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

            // 1. Claim SENDING en UNE seule tentative. Si le serveur dit
            //    que la task appartient déjà à un autre device (ou qu'elle
            //    est finalisée), on SKIP SANS envoyer le SMS (anti-doublon).
            when (val claim = ApiClient.updateTaskStatusDetailed(
                deviceId, token, task.id, "SENDING"
            )) {
                is ApiClient.StatusResult.Success,
                is ApiClient.StatusResult.AlreadyConfirmed -> {
                    // Claim accepté (ou déjà à nous) → on peut envoyer.
                }
                is ApiClient.StatusResult.AssignedToOther -> {
                    Log.w(TAG, "Task ${task.id} déjà prise par ${claim.assignedTo}, on skip (pas de SMS)")
                    continue
                }
                is ApiClient.StatusResult.FinalizedConflict -> {
                    Log.w(TAG, "Task ${task.id} déjà finalisée (${claim.currentStatus}), on skip (pas de SMS)")
                    continue
                }
                is ApiClient.StatusResult.HttpError,
                is ApiClient.StatusResult.NetworkError -> {
                    Log.w(TAG, "Claim SENDING impossible (réseau ?), on skip sans envoyer : ${task.id}")
                    continue
                }
            }

            // 2. Envoyer le SMS UNE SEULE FOIS.
            val sent = SmsSender.sendSms(
                context = applicationContext,
                numero = task.numero_destinataire,
                message = task.message
            )

            // 3. Confirmer au serveur avec retry (jamais de 2e envoi SMS).
            //    En cas d'échec persistant (WiFi coupé), on persiste en file :
            //    le SMS est déjà parti, la confirmation sera rejouée aux
            //    prochains cycles jusqu'au 200 (ou 409 idempotent).
            if (sent) {
                Log.d(TAG, "SMS envoyé à ${task.numero_destinataire}")
                val confirmed = ApiClient.confirmWithRetry(deviceId, token, task.id, "SENT")
                if (confirmed) {
                    updateNotification("SMS envoyé à ${task.numero_destinataire}")
                } else {
                    PendingConfirmStore.add(applicationContext, task.id, "SENT")
                    Log.w(TAG, "SENT non confirmé (réseau ?), mis en file : ${task.id}")
                    updateNotification("SMS envoyé, confirmation en attente...")
                }
            } else {
                Log.e(TAG, "Échec de l'envoi du SMS")
                val errorMessage = "SmsManager a retourné un échec"
                val confirmed = ApiClient.confirmWithRetry(
                    deviceId, token, task.id, "FAILED", errorMessage
                )
                if (confirmed) {
                    updateNotification("Échec SMS à ${task.numero_destinataire}")
                } else {
                    PendingConfirmStore.add(applicationContext, task.id, "FAILED", errorMessage)
                    Log.w(TAG, "FAILED non confirmé (réseau ?), mis en file : ${task.id}")
                    updateNotification("Échec SMS, confirmation en attente...")
                }
            }
        }
    }

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
