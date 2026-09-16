package com.mitia.smsgateway.domain.model

/** Distingue "aucune tâche" de "réseau coupé" (backoff côté service). */
sealed interface TasksResult {
    data class Success(val tasks: List<TaskDto>) : TasksResult
    data object NetworkError : TasksResult
}
