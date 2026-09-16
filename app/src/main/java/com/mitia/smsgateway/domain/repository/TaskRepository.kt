package com.mitia.smsgateway.domain.repository

import com.mitia.smsgateway.domain.model.HistoryTask
import com.mitia.smsgateway.domain.model.PendingConfirmation
import com.mitia.smsgateway.domain.model.StatusResult
import com.mitia.smsgateway.domain.model.TaskDto
import com.mitia.smsgateway.domain.model.TasksResult
import kotlinx.coroutines.flow.Flow

/**
 * Tâches SMS : protocole serveur + historique local + file de confirmations.
 */
interface TaskRepository {
    // Protocole
    suspend fun fetchTasks(deviceId: String, token: String): TasksResult
    suspend fun updateStatusDetailed(
        deviceId: String,
        token: String,
        taskId: String,
        statut: String,
        errorMessage: String? = null
    ): StatusResult
    suspend fun confirmWithRetry(
        deviceId: String,
        token: String,
        taskId: String,
        statut: String,
        errorMessage: String? = null
    ): Boolean

    // Historique local (écran Tâches, compteur du jour)
    suspend fun recordReceived(tasks: List<TaskDto>)
    suspend fun recordStatus(taskId: String, statut: String, error: String? = null)
    fun observeHistory(): Flow<List<HistoryTask>>
    suspend fun countSentToday(): Int

    // File de confirmations persistante (anti-doublon)
    suspend fun loadPendingConfirms(): List<PendingConfirmation>
    suspend fun addPendingConfirm(taskId: String, statut: String, errorMessage: String? = null)
    suspend fun removePendingConfirm(taskId: String)
}
