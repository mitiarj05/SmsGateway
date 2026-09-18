package com.mitia.smsgateway.data.local

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.mitia.smsgateway.domain.model.DayStat
import com.mitia.smsgateway.domain.model.HistoryTask
import com.mitia.smsgateway.domain.model.TaskDto
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

private val Context.taskHistoryStore by preferencesDataStore(name = "task_history")

/**
 * Historique local des tâches reçues par ce device (le serveur ne renvoie
 * que les PENDING au polling : le passé n'est visible que si on le stocke).
 */
object TaskHistoryStore {

    private val KEY_TASKS = stringPreferencesKey("tasks")
    private const val MAX_TASKS = 100
    private const val MAX_MESSAGE = 140

    private val gson = Gson()
    private val listType = object : TypeToken<List<HistoryTask>>() {}.type

    private fun read(raw: String?): List<HistoryTask> =
        raw?.let { runCatching { gson.fromJson<List<HistoryTask>>(it, listType) }.getOrNull() }
            ?: emptyList()

    /** Enregistre les tâches vues au polling (sans écraser les statuts connus). */
    suspend fun upsertReceived(context: Context, tasks: List<TaskDto>) {
        if (tasks.isEmpty()) return
        try {
            context.taskHistoryStore.edit { prefs ->
                val now = System.currentTimeMillis()
                val known = read(prefs[KEY_TASKS]).associateBy { it.id }.toMutableMap()
                for (t in tasks) {
                    val prev = known[t.id]
                    known[t.id] = HistoryTask(
                        id = t.id,
                        numero = t.numero_destinataire,
                        message = t.message.take(MAX_MESSAGE),
                        statut = prev?.statut?.takeIf {
                            it == "SENT" || it == "FAILED"
                        } ?: t.statut,
                        error = prev?.error,
                        at = prev?.at ?: now
                    )
                }
                prefs[KEY_TASKS] = gson.toJson(
                    known.values.sortedByDescending { it.at }.take(MAX_TASKS)
                )
            }
        } catch (_: Exception) {
        }
    }

    suspend fun updateStatus(context: Context, id: String, statut: String, error: String? = null) {
        try {
            context.taskHistoryStore.edit { prefs ->
                val updated = read(prefs[KEY_TASKS]).map {
                    if (it.id == id) it.copy(statut = statut, error = error) else it
                }
                prefs[KEY_TASKS] = gson.toJson(updated)
            }
        } catch (_: Exception) {
        }
    }

    fun observe(context: Context): Flow<List<HistoryTask>> =
        context.taskHistoryStore.data.map { prefs ->
            read(prefs[KEY_TASKS]).sortedByDescending { it.at }
        }

    /** SMS confirmés SENT aujourd'hui (00h00 -> maintenant). */
    suspend fun countSentToday(context: Context): Int {
        val startOfDay = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }.timeInMillis
        return observe(context).first().count { it.statut == "SENT" && it.at >= startOfDay }
    }

    /** Volume des 7 derniers jours (envoyés + échecs par jour, du plus ancien au plus récent). */
    suspend fun statsLast7Days(context: Context): List<DayStat> {
        val list = observe(context).first()
        val dayFormat = SimpleDateFormat("EEE", Locale.FRANCE)
        return (6 downTo 0).map { back ->
            val start = Calendar.getInstance().apply {
                add(Calendar.DAY_OF_YEAR, -back)
                set(Calendar.HOUR_OF_DAY, 0)
                set(Calendar.MINUTE, 0)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }.timeInMillis
            val end = start + 86_400_000L
            val day = list.filter { it.at in start until end }
            DayStat(
                label = dayFormat.format(java.util.Date(start)),
                sent = day.count { it.statut == "SENT" },
                failed = day.count { it.statut == "FAILED" }
            )
        }
    }

    /** Taux de réussite sur 7 jours (0..100, -1 si aucun SMS). */
    suspend fun successRate7d(context: Context): Double {
        val stats = statsLast7Days(context)
        val sent = stats.sumOf { it.sent }
        val failed = stats.sumOf { it.failed }
        if (sent + failed == 0) return -1.0
        return sent * 100.0 / (sent + failed)
    }
}
