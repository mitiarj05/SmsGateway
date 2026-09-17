package com.mitia.smsgateway.data.repository

import android.content.Context
import com.mitia.smsgateway.data.local.DevicePreferences
import com.mitia.smsgateway.data.remote.ApiClient
import com.mitia.smsgateway.domain.model.QuotaDto
import com.mitia.smsgateway.domain.model.QuotaResult
import com.mitia.smsgateway.domain.model.RegisterResult
import com.mitia.smsgateway.domain.repository.DeviceRepository

class DeviceRepositoryImpl(private val context: Context) : DeviceRepository {

    override suspend fun getCredentials(): Pair<String, String>? =
        DevicePreferences.load(context)

    override suspend fun saveCredentials(deviceId: String, token: String) =
        DevicePreferences.save(context, deviceId, token)

    override suspend fun clearCredentials() =
        DevicePreferences.clear(context)

    override suspend fun getServerUrl(): String {
        ApiClient.setBaseUrl(DevicePreferences.getServerUrl(context))
        return ApiClient.baseUrl
    }

    override suspend fun saveServerUrl(url: String): String {
        DevicePreferences.saveServerUrl(context, url)
        return getServerUrl()
    }

    override suspend fun pingServer(): Boolean {
        ApiClient.setBaseUrl(DevicePreferences.getServerUrl(context))
        return ApiClient.pingServer()
    }

    override suspend fun ping(url: String): Boolean {
        ApiClient.setBaseUrl(url)
        return ApiClient.pingServer()
    }

    override suspend fun getDeviceName(): String =
        DevicePreferences.getDeviceName(context)

    override suspend fun saveDeviceName(name: String) =
        DevicePreferences.saveDeviceName(context, name)

    override suspend fun register(deviceName: String, idToken: String): RegisterResult {
        ApiClient.setBaseUrl(DevicePreferences.getServerUrl(context))
        return ApiClient.registerDevice(deviceName, idToken)
    }

    override suspend fun disconnect(deviceId: String, token: String): Boolean {
        ApiClient.setBaseUrl(DevicePreferences.getServerUrl(context))
        return ApiClient.disconnect(deviceId, token)
    }

    override suspend fun updateFcmToken(deviceId: String, token: String, fcmToken: String): Boolean =
        ApiClient.updateFcmToken(deviceId, token, fcmToken)

    override suspend fun getQuota(deviceId: String, token: String): QuotaDto? =
        when (val r = ApiClient.getQuotaDetailed(deviceId, token)) {
            is QuotaResult.Success -> r.quota
            QuotaResult.NetworkError -> null
        }

    override suspend fun saveSync(at: Long, count: Int) =
        DevicePreferences.saveSync(context, at, count)

    override suspend fun loadSync(): Pair<Long, Int> =
        DevicePreferences.loadSync(context)

    override suspend fun saveQuotaSnapshot(quota: Int, usage: Int) =
        DevicePreferences.saveQuotaSnapshot(context, quota, usage)

    override suspend fun loadQuotaSnapshot(): Pair<Int, Int> =
        DevicePreferences.loadQuotaSnapshot(context)
}
