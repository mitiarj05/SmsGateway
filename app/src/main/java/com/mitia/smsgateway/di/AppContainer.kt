package com.mitia.smsgateway.di

import android.content.Context
import com.mitia.smsgateway.controller.DeviceController
import com.mitia.smsgateway.controller.PendingConfirmController
import com.mitia.smsgateway.controller.TaskController
import com.mitia.smsgateway.data.repository.DeviceRepositoryImpl
import com.mitia.smsgateway.data.repository.LogRepositoryImpl
import com.mitia.smsgateway.data.repository.TaskRepositoryImpl
import com.mitia.smsgateway.domain.repository.DeviceRepository
import com.mitia.smsgateway.domain.repository.LogRepository
import com.mitia.smsgateway.domain.repository.TaskRepository

/**
 * Conteneur d'injection manuelle (sans framework : les dépendances sont des
 * singletons explicites, remplaçables par Hilt/Koin plus tard sans toucher
 * aux couches métier).
 *
 * Obtenu via `(application as SmsGatewayApp).appContainer`.
 */
class AppContainer(context: Context) {

    private val appContext = context.applicationContext

    val deviceRepository: DeviceRepository = DeviceRepositoryImpl(appContext)
    val taskRepository: TaskRepository = TaskRepositoryImpl(appContext)
    val logRepository: LogRepository = LogRepositoryImpl(appContext)

    val deviceController = DeviceController(deviceRepository, logRepository)
    val taskController = TaskController(taskRepository, logRepository)
    val pendingConfirmController = PendingConfirmController(taskRepository, logRepository)
}
