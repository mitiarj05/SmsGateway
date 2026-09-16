package com.mitia.smsgateway.domain.model

data class TaskDto(
    val id: String,
    val numero_destinataire: String,
    val message: String,
    val statut: String,
    val created_at: String
)

data class GetTasksResponse(
    val device: DeviceSimpleDto,
    val tasks: List<TaskDto>,
    val count: Int
)

data class StatusResponse(
    val message: String,
    val task: TaskDto
)
