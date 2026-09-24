package com.mitia.smsgateway.data.local

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.mitia.smsgateway.domain.model.StatJournaliere
import com.mitia.smsgateway.domain.model.TacheHistorique
import com.mitia.smsgateway.domain.model.Statuts
import com.mitia.smsgateway.domain.model.TacheDto
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

private val Context.magasinHistoriqueTaches by preferencesDataStore(name = "task_history")

/**
 * Historique local des tâches reçues par cet appareil (le serveur ne renvoie
 * que les EN_ATTENTE à la scrutation : le passé n'est visible que si on le stocke).
 */
object MagasinHistoriqueTaches {

    private val CLE_TACHES = stringPreferencesKey("tasks")
    private const val MAX_TACHES = 100
    private const val MAX_MESSAGE = 140

    private val gson = Gson()
    private val typeListe = object : TypeToken<List<TacheHistorique>>() {}.type

    private fun lire(brut: String?): List<TacheHistorique> =
        brut?.let { runCatching { gson.fromJson<List<TacheHistorique>>(it, typeListe) }.getOrNull() }
            ?: emptyList()

    /** Enregistre les tâches vues à la scrutation (sans écraser les statuts connus). */
    suspend fun insererOuMettreAJourRecues(context: Context, taches: List<TacheDto>) {
        if (taches.isEmpty()) return
        try {
            context.magasinHistoriqueTaches.edit { prefs ->
                val maintenant = System.currentTimeMillis()
                val connues = lire(prefs[CLE_TACHES]).associateBy { it.id }.toMutableMap()
                for (t in taches) {
                    val precedente = connues[t.id]
                    connues[t.id] = TacheHistorique(
                        id = t.id,
                        numeroDestinataire = t.numero_destinataire,
                        message = t.message.take(MAX_MESSAGE),
                        statut = precedente?.statut?.takeIf {
                            it == Statuts.ENVOYE || it == Statuts.ECHOUE
                        } ?: t.statut,
                        erreur = precedente?.erreur,
                        horodatage = precedente?.horodatage ?: maintenant
                    )
                }
                prefs[CLE_TACHES] = gson.toJson(
                    connues.values.sortedByDescending { it.horodatage }.take(MAX_TACHES)
                )
            }
        } catch (_: Exception) {
        }
    }

    suspend fun mettreAJourStatut(context: Context, id: String, statut: String, erreur: String? = null) {
        try {
            context.magasinHistoriqueTaches.edit { prefs ->
                val misesAJour = lire(prefs[CLE_TACHES]).map {
                    if (it.id == id) it.copy(statut = statut, erreur = erreur) else it
                }
                prefs[CLE_TACHES] = gson.toJson(misesAJour)
            }
        } catch (_: Exception) {
        }
    }

    fun observer(context: Context): Flow<List<TacheHistorique>> =
        context.magasinHistoriqueTaches.data.map { prefs ->
            lire(prefs[CLE_TACHES]).sortedByDescending { it.horodatage }
        }

    /** SMS confirmés ENVOYE aujourd'hui (00h00 -> maintenant). */
    suspend fun compterEnvoyesAujourdhui(context: Context): Int {
        val debutJournee = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }.timeInMillis
        return observer(context).first().count { it.statut == Statuts.ENVOYE && it.horodatage >= debutJournee }
    }

    /** Volume des 7 derniers jours (envoyés + échecs par jour, du plus ancien au plus récent). */
    suspend fun stats7DerniersJours(context: Context): List<StatJournaliere> {
        val liste = observer(context).first()
        val formatJour = SimpleDateFormat("EEE", Locale.FRANCE)
        return (6 downTo 0).map { joursAvant ->
            val debut = Calendar.getInstance().apply {
                add(Calendar.DAY_OF_YEAR, -joursAvant)
                set(Calendar.HOUR_OF_DAY, 0)
                set(Calendar.MINUTE, 0)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }.timeInMillis
            val fin = debut + 86_400_000L
            val jour = liste.filter { it.horodatage in debut until fin }
            StatJournaliere(
                label = formatJour.format(java.util.Date(debut)),
                envoyes = jour.count { it.statut == Statuts.ENVOYE },
                echoues = jour.count { it.statut == Statuts.ECHOUE }
            )
        }
    }

    /** Taux de réussite sur 7 jours (0..100, -1 si aucun SMS). */
    suspend fun tauxReussite7j(context: Context): Double {
        val stats = stats7DerniersJours(context)
        val envoyes = stats.sumOf { it.envoyes }
        val echoues = stats.sumOf { it.echoues }
        if (envoyes + echoues == 0) return -1.0
        return envoyes * 100.0 / (envoyes + echoues)
    }
}
