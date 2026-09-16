package com.mitia.smsgateway

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private val Context.eventLogStore by preferencesDataStore(name = "event_log")

data class EventItem(val t: Long, val msg: String)

/**
 * Journal embarqué des événements (conservé sur l'appareil).
 * Écrit par le service / FCM, lu par l'écran Journal.
 */
object EventLog {

    private val KEY_EVENTS = stringPreferencesKey("events")
    private const val MAX_EVENTS = 200

    private val gson = Gson()
    private val listType = object : TypeToken<List<EventItem>>() {}.type

    private fun timeFormat(): SimpleDateFormat =
        SimpleDateFormat("HH:mm:ss", Locale.FRANCE)

    fun formatTime(t: Long): String = timeFormat().format(Date(t))

    suspend fun log(context: Context, msg: String) {
        try {
            context.eventLogStore.edit { prefs ->
                val current: List<EventItem> = prefs[KEY_EVENTS]
                    ?.let { runCatching { gson.fromJson<List<EventItem>>(it, listType) }.getOrNull() }
                    ?: emptyList()
                val updated = (current + EventItem(System.currentTimeMillis(), msg))
                    .takeLast(MAX_EVENTS)
                prefs[KEY_EVENTS] = gson.toJson(updated)
            }
        } catch (_: Exception) {
        }
    }

    fun observe(context: Context): Flow<List<EventItem>> =
        context.eventLogStore.data.map { prefs ->
            val list: List<EventItem> = prefs[KEY_EVENTS]
                ?.let { runCatching { gson.fromJson<List<EventItem>>(it, listType) }.getOrNull() }
                ?: emptyList()
            list.sortedByDescending { it.t }
        }

    suspend fun snapshot(context: Context): List<EventItem> =
        context.eventLogStore.data.first().let { prefs ->
            prefs[KEY_EVENTS]
                ?.let { runCatching { gson.fromJson<List<EventItem>>(it, listType) }.getOrNull() }
                ?: emptyList()
        }.sortedByDescending { it.t }

    suspend fun clear(context: Context) {
        context.eventLogStore.edit { prefs -> prefs.remove(KEY_EVENTS) }
    }

    fun toText(events: List<EventItem>): String = buildString {
        for (e in events.sortedBy { it.t }) {
            append(formatTime(e.t)).append(' ').append(e.msg).append('\n')
        }
    }
}
