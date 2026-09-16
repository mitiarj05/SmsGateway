package com.mitia.smsgateway.domain.repository

import com.mitia.smsgateway.domain.model.EventItem
import kotlinx.coroutines.flow.Flow

/** Journal embarqué (écran Journal, export). */
interface LogRepository {
    suspend fun log(msg: String)
    fun observe(): Flow<List<EventItem>>
    suspend fun snapshot(): List<EventItem>
    suspend fun clear()
    fun toText(events: List<EventItem>): String
}
