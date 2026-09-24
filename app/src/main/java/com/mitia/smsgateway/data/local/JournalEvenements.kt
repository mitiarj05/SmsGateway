package com.mitia.smsgateway.data.local

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.mitia.smsgateway.domain.model.ElementEvenement
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.magasinJournal by preferencesDataStore(name = "event_log")

/**
 * Journal embarqué des événements (conservé sur l'appareil).
 * Écrit par le service / FCM, lu par l'écran Journal.
 */
object JournalEvenements {

    private val CLE_EVENEMENTS = stringPreferencesKey("events")
    private const val MAX_EVENEMENTS = 200

    private val gson = Gson()
    private val typeListe = object : TypeToken<List<ElementEvenement>>() {}.type

    suspend fun journaliser(context: Context, message: String) {
        try {
            context.magasinJournal.edit { prefs ->
                val actuels: List<ElementEvenement> = prefs[CLE_EVENEMENTS]
                    ?.let { runCatching { gson.fromJson<List<ElementEvenement>>(it, typeListe) }.getOrNull() }
                    ?: emptyList()
                val misAJour = (actuels + ElementEvenement(System.currentTimeMillis(), message))
                    .takeLast(MAX_EVENEMENTS)
                prefs[CLE_EVENEMENTS] = gson.toJson(misAJour)
            }
        } catch (_: Exception) {
        }
    }

    fun observer(context: Context): Flow<List<ElementEvenement>> =
        context.magasinJournal.data.map { prefs ->
            val liste: List<ElementEvenement> = prefs[CLE_EVENEMENTS]
                ?.let { runCatching { gson.fromJson<List<ElementEvenement>>(it, typeListe) }.getOrNull() }
                ?: emptyList()
            liste.sortedByDescending { it.horodatage }
        }

    suspend fun instantane(context: Context): List<ElementEvenement> =
        context.magasinJournal.data.first().let { prefs ->
            prefs[CLE_EVENEMENTS]
                ?.let { runCatching { gson.fromJson<List<ElementEvenement>>(it, typeListe) }.getOrNull() }
                ?: emptyList()
        }.sortedByDescending { it.horodatage }

    suspend fun effacer(context: Context) {
        context.magasinJournal.edit { prefs -> prefs.remove(CLE_EVENEMENTS) }
    }
}
