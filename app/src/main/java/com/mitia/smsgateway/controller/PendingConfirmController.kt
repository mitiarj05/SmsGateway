package com.mitia.smsgateway.controller

import android.util.Log
import com.mitia.smsgateway.domain.repository.LogRepository
import com.mitia.smsgateway.domain.repository.TaskRepository

/**
 * Rejoue les confirmations persistées (SMS déjà envoyés dont l'accusé
 * serveur n'est jamais arrivé). Ne renvoie AUCUN SMS, que du HTTP.
 */
class PendingConfirmController(
    private val tasks: TaskRepository,
    private val logs: LogRepository
) {

    private val tag = "PendingConfirmController"

    suspend fun retryPendingConfirmations(deviceId: String, token: String) {
        val pending = tasks.loadPendingConfirms()
        if (pending.isEmpty()) return
        Log.d(tag, "${pending.size} confirmation(s) en attente, retry...")
        for (entry in pending) {
            val ok = tasks.confirmWithRetry(
                deviceId, token, entry.taskId, entry.statut, entry.errorMessage
            )
            if (ok) {
                tasks.removePendingConfirm(entry.taskId)
                Log.d(tag, "Confirmation en attente soldée : ${entry.taskId} -> ${entry.statut}")
            } else {
                Log.w(tag, "Confirmation toujours en échec (gardée en file) : ${entry.taskId}")
            }
        }
    }
}
