package com.mitia.smsgateway.data.local

import android.content.Context
import android.util.Log
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringSetPreferencesKey
import com.mitia.smsgateway.domain.model.AccuseLivraisonEnAttente
import com.mitia.smsgateway.domain.model.Statuts
import com.mitia.smsgateway.util.Constantes
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

/**
 * File persistante des accusés de réception RÉSEAU (DLR) pas encore remontés
 * au serveur.
 *
 * Pourquoi une file ? Le DLR arrive dans un broadcast, parfois des minutes
 * après l'envoi, parfois quand l'app est en arrière-plan ou vient d'être tuée.
 * Le récepteur ne fait donc AUCUN appel réseau : il écrit ici, puis réveille le
 * service, qui remonte l'accusé au serveur au cycle suivant (et réessaie en cas
 * de coupure). Le même mécanisme que la file de confirmations (Piège 3).
 *
 * Entrée encodée : tacheId|LIVRE|code|horodatage
 */
object MagasinAccusesLivraison {

    private const val ETIQUETTE = "MagasinAccusesLivraison"
    private val CLE_EN_ATTENTE = stringSetPreferencesKey("pending_deliveries")

    private fun encoder(tacheId: String, livraison: String, code: Int?, horodatage: Long): String =
        "$tacheId|$livraison|${code ?: ""}|$horodatage"

    private fun decoder(brut: String): AccuseLivraisonEnAttente? {
        val parties = brut.split('|')
        if (parties.size < 4 || parties[0].isBlank()) return null
        val livraison = parties[1]
        if (livraison != Statuts.LIVRE && livraison != Statuts.ECHEC_LIVRAISON) return null
        return AccuseLivraisonEnAttente(
            tacheId = parties[0],
            livraison = livraison,
            code = parties[2].toIntOrNull(),
            horodatage = parties[3].toLongOrNull() ?: 0L
        )
    }

    /**
     * Met en file un accusé. Un seul enregistrement par tâche, et un LIVRE déjà
     * en file n'est jamais dégradé (même règle que côté serveur).
     */
    suspend fun ajouter(
        context: Context,
        tacheId: String,
        livraison: String,
        code: Int? = null,
        horodatage: Long = System.currentTimeMillis()
    ) {
        require(livraison == Statuts.LIVRE || livraison == Statuts.ECHEC_LIVRAISON) {
            "Accusé invalide : $livraison"
        }
        context.magasinPrefsPartage.edit { prefs ->
            val actuels = prefs[CLE_EN_ATTENTE].orEmpty().toMutableSet()
            val ancien = actuels.firstOrNull { it.startsWith("$tacheId|") }?.let(::decoder)
            if (ancien?.livraison == Statuts.LIVRE && livraison == Statuts.ECHEC_LIVRAISON) {
                Log.d(ETIQUETTE, "Accusé négatif ignoré, $tacheId est déjà LIVRE")
                return@edit
            }
            actuels.removeAll { it.startsWith("$tacheId|") }
            actuels.add(encoder(tacheId, livraison, code, horodatage))
            prefs[CLE_EN_ATTENTE] = actuels
        }
        Log.d(ETIQUETTE, "Accusé mis en file : $tacheId -> $livraison (code=${code ?: "?"})")
    }

    suspend fun retirer(context: Context, tacheId: String) {
        context.magasinPrefsPartage.edit { prefs ->
            val actuels = prefs[CLE_EN_ATTENTE].orEmpty().toMutableSet()
            if (actuels.removeAll { it.startsWith("$tacheId|") }) {
                prefs[CLE_EN_ATTENTE] = actuels
            }
        }
    }

    suspend fun chargerTout(context: Context): List<AccuseLivraisonEnAttente> {
        val brut = context.magasinPrefsPartage.data.map { it[CLE_EN_ATTENTE].orEmpty() }.first()
        return brut.mapNotNull { entree ->
            decoder(entree).also {
                if (it == null) Log.w(ETIQUETTE, "Entrée corrompue ignorée : $entree")
            }
        }
    }

    /**
     * Abandonne les accusés trop vieux.
     *
     * Beaucoup d'opérateurs n'émettent aucun DLR : sans purge, un accusé jamais
     * remonté resterait en file et serait rejoué indéfiniment.
     *
     * @return le nombre d'entrées abandonnées.
     */
    suspend fun purgerExpires(
        context: Context,
        ageMaxMs: Long = Constantes.EXPIRATION_ACCUSE_LIVRAISON_MS
    ): Int {
        val limite = System.currentTimeMillis() - ageMaxMs
        var purges = 0
        context.magasinPrefsPartage.edit { prefs ->
            val actuels = prefs[CLE_EN_ATTENTE].orEmpty().toMutableSet()
            val expires = actuels.filter { entree ->
                val horodatage = decoder(entree)?.horodatage ?: 0L
                horodatage in 1 until limite
            }
            if (expires.isNotEmpty()) {
                actuels.removeAll(expires.toSet())
                prefs[CLE_EN_ATTENTE] = actuels
                purges = expires.size
            }
        }
        if (purges > 0) Log.d(ETIQUETTE, "$purges accusé(s) expiré(s) abandonné(s)")
        return purges
    }

    suspend fun compter(context: Context): Int =
        context.magasinPrefsPartage.data.map { it[CLE_EN_ATTENTE]?.size ?: 0 }.first()
}
