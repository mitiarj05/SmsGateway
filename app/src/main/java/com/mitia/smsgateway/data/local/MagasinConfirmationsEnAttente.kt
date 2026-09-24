package com.mitia.smsgateway.data.local

import android.content.Context
import android.util.Log
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringSetPreferencesKey
import com.mitia.smsgateway.domain.model.ConfirmationEnAttente
import com.mitia.smsgateway.domain.model.Statuts
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

/**
 * File persistante des confirmations (ENVOYE / ECHOUE) non encore
 * accusées par le serveur.
 *
 * Piège 3 — anti-doublon :
 * quand le SMS est parti mais que le WiFi coupe avant la confirmation,
 * on ne doit JAMAIS renvoyer le SMS. On persiste (tacheId, statut) en
 * DataStore et on ne rejoue QUE la requête HTTP, à chaque cycle de
 * scrutation, jusqu'à ce que le serveur réponde 200 (ou 409 idempotent).
 *
 * Survivable au kill du process et au reboot (via RecepteurDemarrage).
 */
object MagasinConfirmationsEnAttente {

    private const val ETIQUETTE = "MagasinConfirmationsEnAttente"
    private val CLE_EN_ATTENTE = stringSetPreferencesKey("pending_confirmations")

    /** tacheId|STATUT|erreur (erreur assainie : sans '|' ni saut de ligne, 200 car. max) */
    private fun encoder(tacheId: String, statut: String, messageErreur: String?): String {
        val erreurSure = messageErreur
            ?.replace('|', ' ')
            ?.replace('\n', ' ')
            ?.replace('\r', ' ')
            ?.trim()
            ?.take(200)
            .orEmpty()
        return "$tacheId|$statut|$erreurSure"
    }

    private fun decoder(brut: String): ConfirmationEnAttente? {
        val parties = brut.split('|', limit = 3)
        if (parties.size < 2 || parties[0].isBlank()) return null
        val statut = parties[1]
        if (statut != Statuts.ENVOYE && statut != Statuts.ECHOUE) return null
        val erreur = parties.getOrNull(2)?.takeIf { it.isNotBlank() }
        return ConfirmationEnAttente(parties[0], statut, erreur)
    }

    suspend fun ajouter(context: Context, tacheId: String, statut: String, messageErreur: String? = null) {
        require(statut == Statuts.ENVOYE || statut == Statuts.ECHOUE) { "Seuls ENVOYE/ECHOUE sont mis en file (pas $statut)" }
        context.magasinPrefsPartage.edit { prefs ->
            val actuelles = prefs[CLE_EN_ATTENTE].orEmpty().toMutableSet()
            // Un seul enregistrement par tâche : on remplace l'ancien.
            actuelles.removeAll { it.startsWith("$tacheId|") }
            actuelles.add(encoder(tacheId, statut, messageErreur))
            prefs[CLE_EN_ATTENTE] = actuelles
        }
        Log.d(ETIQUETTE, "Confirmation mise en file : $tacheId -> $statut")
    }

    suspend fun retirer(context: Context, tacheId: String) {
        context.magasinPrefsPartage.edit { prefs ->
            val actuelles = prefs[CLE_EN_ATTENTE].orEmpty().toMutableSet()
            if (actuelles.removeAll { it.startsWith("$tacheId|") }) {
                prefs[CLE_EN_ATTENTE] = actuelles
            }
        }
    }

    suspend fun chargerTout(context: Context): List<ConfirmationEnAttente> {
        val brut = context.magasinPrefsPartage.data.map { it[CLE_EN_ATTENTE].orEmpty() }.first()
        return brut.mapNotNull { entree ->
            decoder(entree).also {
                if (it == null) Log.w(ETIQUETTE, "Entrée corrompue ignorée : $entree")
            }
        }
    }

    suspend fun compter(context: Context): Int =
        context.magasinPrefsPartage.data.map { it[CLE_EN_ATTENTE]?.size ?: 0 }.first()
}
