package com.mitia.smsgateway.data.repository

import android.content.Context
import com.mitia.smsgateway.data.local.PendingConfirmStore
import com.mitia.smsgateway.data.local.TaskHistoryStore
import com.mitia.smsgateway.data.remote.ApiClient
import com.mitia.smsgateway.domain.model.HistoryTask
import com.mitia.smsgateway.domain.model.PendingConfirmation
import com.mitia.smsgateway.domain.model.StatusResult
import com.mitia.smsgateway.domain.model.TaskDto
import com.mitia.smsgateway.domain.model.TasksResult
import com.mitia.smsgateway.domain.repository.TaskRepository
import kotlinx.coroutines.flow.Flow

class TaskRepositoryImpl(private val context: Context) : TaskRepository {

    override suspend fun fetchTasks(deviceId: String, token: String): TasksResult =
        ApiClient.getTasksDetailed(deviceId, token)

    override suspend fun updateStatusDetailed(
        deviceId: String,
        token: String,
        taskId: String,
        statut: String,
        errorMessage: String?
    ): StatusResult =
        ApiClient.updateTaskStatusDetailed(deviceId, token, taskId, statut, errorMessage)

    override suspend fun confirmWithRetry(
        deviceId: String,
        token: String,
        taskId: String,
        statut: String,
        errorMessage: String?
    ): Boolean =
        ApiClient.confirmWithRetry(deviceId, token, taskId, statut, errorMessage)

    override suspend fun recordReceived(tasks: List<TaskDto>) =
        TaskHistoryStore.upsertReceived(context, tasks)

    override suspend fun recordStatus(taskId: String, statut: String, error: String?) =
        TaskHistoryStore.updateStatus(context, taskId, statut, error)

    override fun observeHistory(): Flow<List<HistoryTask>> =
        TaskHistoryStore.observe(context)

    override suspend fun countSentToday(): Int =
        TaskHistoryStore.countSentToday(context)

    override suspend fun loadPendingConfirms(): List<PendingConfirmation> =
        PendingConfirmStore.loadAll(context).map {
            PendingConfirmation(it.taskId, it.statut, it.errorMessage)
        }

    override suspend fun addPendingConfirm(taskId: String, statut: String, errorMessage: String?) =
        PendingConfirmStore.add(context, taskId, statut, errorMessage)

    override suspend fun removePendingConfirm(taskId: String) =
        PendingConfirmStore.remove(context, taskId)
}
