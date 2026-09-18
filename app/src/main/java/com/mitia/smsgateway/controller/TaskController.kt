package com.mitia.smsgateway.controller

import android.content.Context
import android.util.Log
import com.mitia.smsgateway.data.sms.SimManager
import com.mitia.smsgateway.data.sms.SmsSender
import com.mitia.smsgateway.domain.model.StatusResult
import com.mitia.smsgateway.domain.model.TaskDto
import com.mitia.smsgateway.domain.repository.LogRepository
import com.mitia.smsgateway.domain.repository.TaskRepository

/**
 * Claim + envoi SMS + confirmation.
 *
 * Anti-doublon (Piège 3) : le SMS n'est envoyé qu'après un claim SENDING
 * accepté par le serveur, et une seule fois. Si le réseau coupe après
 * l'envoi, seule la confirmation HTTP est rejouée.
 *
 * @param onStatusText met à jour la notification foreground (côté service).
 */
class TaskController(
    private val tasks: TaskRepository,
    private val logs: LogRepository
) {

    private val tag = "TaskController"

    suspend fun processTasks(
        context: Context,
        deviceId: String,
        token: String,
        taskList: List<TaskDto>,
        onStatusText: (String) -> Unit
    ) {
        if (taskList.isEmpty()) {
            Log.d(tag, "Aucune tâche en attente")
            onStatusText("En attente de tâches...")
            return
        }
        Log.d(tag, "${taskList.size} tâche(s) reçue(s) :")

        for (task in taskList) {
            Log.d(tag, "Traitement de la task ${task.id}")

            val claim = tasks.updateStatusDetailed(deviceId, token, task.id, "SENDING")
            val sendingOk = when (claim) {
                is StatusResult.Success, is StatusResult.AlreadyConfirmed -> true
                else -> false
            }
            if (!sendingOk) {
                when (claim) {
                    is StatusResult.AssignedToOther ->
                        Log.w(tag, "Task ${task.id} déjà prise par ${claim.assignedTo}, on skip (pas de SMS)")
                    is StatusResult.FinalizedConflict ->
                        Log.w(tag, "Task ${task.id} déjà finalisée (${claim.currentStatus}), on skip (pas de SMS)")
                    is StatusResult.HttpError, is StatusResult.NetworkError ->
                        Log.w(tag, "Claim SENDING impossible (réseau ?), on skip sans envoyer : ${task.id}")
                    else -> {}
                }
                continue
            }

            val subId = SimManager.resolveSubscriptionId(context)
            val sent = SmsSender.sendSms(
                context = context,
                numero = task.numero_destinataire,
                message = task.message,
                subscriptionId = subId
            )
            SimManager.noteSend(context)

            if (sent) {
                Log.d(tag, "SMS envoyé à ${task.numero_destinataire}")
                tasks.recordStatus(task.id, "SENT")
                logs.log("sms envoyé > ${task.numero_destinataire}")
                val confirmed = tasks.confirmWithRetry(deviceId, token, task.id, "SENT")
                if (confirmed) {
                    logs.log("accusé transmis au serveur")
                    onStatusText("SMS envoyé à ${task.numero_destinataire}")
                } else {
                    tasks.addPendingConfirm(task.id, "SENT")
                    Log.w(tag, "SENT non confirmé (réseau ?), mis en file : ${task.id}")
                    onStatusText("SMS envoyé, confirmation en attente...")
                }
            } else {
                Log.e(tag, "Échec de l'envoi du SMS")
                val errorMessage = "SmsManager a retourné un échec"
                tasks.recordStatus(task.id, "FAILED", errorMessage)
                logs.log("sms échoué > ${task.numero_destinataire}")
                val confirmed = tasks.confirmWithRetry(deviceId, token, task.id, "FAILED", errorMessage)
                if (confirmed) {
                    logs.log("rapport d'échec envoyé au serveur")
                    onStatusText("Échec SMS à ${task.numero_destinataire}")
                } else {
                    tasks.addPendingConfirm(task.id, "FAILED", errorMessage)
                    Log.w(tag, "FAILED non confirmé (réseau ?), mis en file : ${task.id}")
                    onStatusText("Échec SMS, confirmation en attente...")
                }
            }
        }
    }
}
