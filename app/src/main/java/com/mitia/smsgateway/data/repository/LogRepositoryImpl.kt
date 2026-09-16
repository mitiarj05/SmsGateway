package com.mitia.smsgateway.data.repository

import android.content.Context
import com.mitia.smsgateway.data.local.EventLog
import com.mitia.smsgateway.domain.model.EventItem
import com.mitia.smsgateway.domain.repository.LogRepository
import com.mitia.smsgateway.util.TimeUtils
import kotlinx.coroutines.flow.Flow

class LogRepositoryImpl(private val context: Context) : LogRepository {

    override suspend fun log(msg: String) =
        EventLog.log(context, msg)

    override fun observe(): Flow<List<EventItem>> =
        EventLog.observe(context)

    override suspend fun snapshot(): List<EventItem> =
        EventLog.snapshot(context)

    override suspend fun clear() =
        EventLog.clear(context)

    override fun toText(events: List<EventItem>): String = buildString {
        for (e in events.sortedBy { it.t }) {
            append(TimeUtils.formatTime(e.t)).append(' ').append(e.msg).append('\n')
        }
    }
}
