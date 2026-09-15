package com.mitia.smsgateway

import android.content.Context
import android.util.Log
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringSetPreferencesKey
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

/**
 * File persistante des confirmations (SENT / FAILED) non encore
 * accusées par le serveur.
 *
 * Piège 3 — anti-doublon :
 * quand le SMS est parti mais que le WiFi coupe avant la confirmation,
 * on ne doit JAMAIS renvoyer le SMS. On persiste (taskId, statut) en
 * DataStore et on ne rejoue QUE la requête HTTP, à chaque cycle de
 * polling, jusqu'à ce que le serveur réponde 200 (ou 409 idempotent).
 *
 * Survivable au kill du process et au reboot (via BootReceiver).
 */
object PendingConfirmStore {

    private const val TAG = "PendingConfirmStore"
    private val KEY_PENDING = stringSetPreferencesKey("pending_confirmations")

    data class PendingConfirmation(
        val taskId: String,
        val statut: String,
        val errorMessage: String? = null
    )

    /** taskId|STATUT|error (error assaini : sans '|' ni saut de ligne, 200 car. max) */
    private fun encode(taskId: String, statut: String, errorMessage: String?): String {
        val safeError = errorMessage
            ?.replace('|', ' ')
            ?.replace('\n', ' ')
            ?.replace('\r', ' ')
            ?.trim()
            ?.take(200)
            .orEmpty()
        return "$taskId|$statut|$safeError"
    }

    private fun decode(raw: String): PendingConfirmation? {
        val parts = raw.split('|', limit = 3)
        if (parts.size < 2 || parts[0].isBlank()) return null
        val statut = parts[1]
        if (statut != "SENT" && statut != "FAILED") return null
        val error = parts.getOrNull(2)?.takeIf { it.isNotBlank() }
        return PendingConfirmation(parts[0], statut, error)
    }

    suspend fun add(context: Context, taskId: String, statut: String, errorMessage: String? = null) {
        require(statut == "SENT" || statut == "FAILED") { "Seuls SENT/FAILED sont mis en file (pas $statut)" }
        context.sharedPrefsDataStore.edit { prefs ->
            val current = prefs[KEY_PENDING].orEmpty().toMutableSet()
            // Un seul enregistrement par task : on remplace l'ancien.
            current.removeAll { it.startsWith("$taskId|") }
            current.add(encode(taskId, statut, errorMessage))
            prefs[KEY_PENDING] = current
        }
        Log.d(TAG, "Confirmation mise en file : $taskId -> $statut")
    }

    suspend fun remove(context: Context, taskId: String) {
        context.sharedPrefsDataStore.edit { prefs ->
            val current = prefs[KEY_PENDING].orEmpty().toMutableSet()
            if (current.removeAll { it.startsWith("$taskId|") }) {
                prefs[KEY_PENDING] = current
            }
        }
    }

    suspend fun loadAll(context: Context): List<PendingConfirmation> {
        val raw = context.sharedPrefsDataStore.data.map { it[KEY_PENDING].orEmpty() }.first()
        return raw.mapNotNull { entry ->
            decode(entry).also {
                if (it == null) Log.w(TAG, "Entrée corrompue ignorée : $entry")
            }
        }
    }

    suspend fun count(context: Context): Int =
        context.sharedPrefsDataStore.data.map { it[KEY_PENDING]?.size ?: 0 }.first()
}
