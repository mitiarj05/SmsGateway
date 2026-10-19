package com.mitia.smsgateway.data.local

import android.content.Context
import android.util.Log
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.mitia.smsgateway.domain.model.SoldeSim
import kotlinx.coroutines.flow.first

/**
 * Réglages et relevés liés aux codes USSD (consultation du solde de la SIM).
 *
 * Pourquoi tout est indexé PAR CARTE ? Chaque opérateur a son propre code de
 * consultation du solde, et un téléphone à deux SIM en héberge donc deux
 * différents. Code, dernier relevé et date de la dernière tentative sont
 * mémorisés par identifiant d'abonnement, jamais globalement.
 *
 * Aucun code n'est deviné ici : tant que l'utilisateur n'a rien saisi pour une
 * carte, aucune vérification n'est tentée. Un code USSD erroné peut souscrire
 * à un service payant — la saisie reste donc toujours son fait.
 */
object MagasinUssd {

    private const val ETIQUETTE = "MagasinUssd"

    private val CLE_CODES = stringPreferencesKey("ussd_codes")
    private val CLE_SOLDES = stringPreferencesKey("ussd_soldes")
    private val CLE_TENTATIVES = stringPreferencesKey("ussd_tentatives")
    private val CLE_AUTO = booleanPreferencesKey("ussd_auto_quotidien")

    private val gson = Gson()
    private val typeCodes = object : TypeToken<Map<String, String>>() {}.type
    private val typeSoldes = object : TypeToken<Map<String, SoldeSim>>() {}.type
    private val typeTentatives = object : TypeToken<Map<String, Long>>() {}.type

    /**
     * Clé de stockage d'une carte. L'abonnement par défaut (INVALID = -1) a sa
     * propre clé : un téléphone simple SIM dépourvu de READ_PHONE_STATE doit
     * pouvoir enregistrer son code sans identifiant d'abonnement.
     */
    private fun cle(souscriptionId: Int): String =
        if (souscriptionId < 0) "defaut" else souscriptionId.toString()

    // -------------------- Codes USSD --------------------

    suspend fun obtenirCode(context: Context, souscriptionId: Int): String? =
        obtenirCodes(context)[cle(souscriptionId)]?.takeIf { it.isNotBlank() }

    /** Un code vide ou blanc SUPPRIME l'entrée (retour à « aucune vérification »). */
    suspend fun enregistrerCode(context: Context, souscriptionId: Int, code: String) {
        val propre = code.trim()
        context.magasinPrefsPartage.edit { prefs ->
            val carte = decoderCarte(prefs[CLE_CODES])
            if (propre.isEmpty()) carte.remove(cle(souscriptionId))
            else carte[cle(souscriptionId)] = propre
            prefs[CLE_CODES] = gson.toJson(carte)
        }
        Log.d(ETIQUETTE, "Code USSD ${if (propre.isEmpty()) "effacé" else "enregistré"} pour ${cle(souscriptionId)}")
    }

    suspend fun obtenirCodes(context: Context): Map<String, String> =
        decoderCarte(context.magasinPrefsPartage.data.first()[CLE_CODES])

    // -------------------- Derniers relevés --------------------

    /**
     * Relevé d'une carte, lu PAR SA CLÉ — comme l'écriture.
     *
     * Chercher sur le champ `souscriptionId` de l'objet serait fragile : après
     * une reprise de données (voir reprendreDonneesDefaut), la clé et le champ
     * peuvent différer une fraction de seconde, et le relevé deviendrait
     * invisible. La clé, elle, ne ment jamais.
     */
    suspend fun obtenirSolde(context: Context, souscriptionId: Int): SoldeSim? =
        decoderSoldes(context.magasinPrefsPartage.data.first()[CLE_SOLDES])[cle(souscriptionId)]

    /** Tous les relevés connus (une entrée par carte relevée). */
    suspend fun obtenirSoldes(context: Context): List<SoldeSim> =
        decoderSoldes(context.magasinPrefsPartage.data.first()[CLE_SOLDES]).values.toList()

    suspend fun enregistrerSolde(context: Context, solde: SoldeSim) {
        context.magasinPrefsPartage.edit { prefs ->
            val carte = decoderSoldes(prefs[CLE_SOLDES]).toMutableMap()
            carte[cle(solde.souscriptionId)] = solde
            prefs[CLE_SOLDES] = gson.toJson(carte)
        }
    }

    // -------------------- Tentatives (anti-rafale) --------------------

    /**
     * Date de la dernière TENTATIVE de relevé pour une carte.
     * On note la tentative, pas le succès : un opérateur muet ne doit pas être
     * réinterrogé toutes les 30 s par la boucle de scrutation.
     */
    suspend fun derniereTentative(context: Context, souscriptionId: Int): Long =
        decoderTentatives(context.magasinPrefsPartage.data.first()[CLE_TENTATIVES])[cle(souscriptionId)] ?: 0L

    suspend fun noterTentative(
        context: Context,
        souscriptionId: Int,
        horodatage: Long = System.currentTimeMillis()
    ) {
        context.magasinPrefsPartage.edit { prefs ->
            val carte = decoderTentatives(prefs[CLE_TENTATIVES]).toMutableMap()
            carte[cle(souscriptionId)] = horodatage
            prefs[CLE_TENTATIVES] = gson.toJson(carte)
        }
    }

    // -------------------- Vérification automatique --------------------

    /** Vérification quotidienne automatique : activée par défaut. */
    suspend fun estVerificationAutoActive(context: Context): Boolean =
        context.magasinPrefsPartage.data.first()[CLE_AUTO] ?: true

    suspend fun enregistrerVerificationAutoActive(context: Context, actif: Boolean) {
        context.magasinPrefsPartage.edit { prefs -> prefs[CLE_AUTO] = actif }
    }

    // -------------------- Décodage défensif --------------------

    private fun decoderCarte(brut: String?): MutableMap<String, String> =
        runCatching {
            brut?.let { gson.fromJson<Map<String, String>>(it, typeCodes).toMutableMap() } ?: mutableMapOf()
        }.getOrElse { mutableMapOf() }

    private fun decoderTentatives(brut: String?): Map<String, Long> =
        runCatching {
            brut?.let { gson.fromJson<Map<String, Long>>(it, typeTentatives) } ?: emptyMap()
        }.getOrElse { emptyMap() }

    private fun decoderSoldes(brut: String?): Map<String, SoldeSim> =
        runCatching {
            brut?.let { gson.fromJson<Map<String, SoldeSim>>(it, typeSoldes) } ?: emptyMap()
        }.getOrElse {
            Log.w(ETIQUETTE, "Relevés illisibles, ignorés", it)
            emptyMap()
        }

    // -------------------- Reprise des données « defaut » --------------------

    /**
     * Fait rejoindre à une VRAIE carte les données enregistrées sous la clé « defaut ».
     *
     * La clé « defaut » sert quand l'appareil ne sait pas encore nommer sa carte
     * (permission « Téléphone » non accordée) : code, relevé et date de tentative
     * s'y retrouvent, sans lien avec un identifiant d'abonnement. Dès que la
     * carte devient identifiable, ces données doivent la suivre — sinon
     * l'utilisateur verrait un champ vide alors que son code est bien enregistré.
     *
     * Trois garde-fous : rien n'est repris sans identifiant valide, rien n'est
     * repris si la carte visée a DÉJÀ une valeur (on n'écrase jamais un réglage
     * fait exprès pour cette carte), et l'entrée « defaut » n'est retirée
     * qu'après recopie.
     *
     * @return vrai si quelque chose a été repris.
     */
    suspend fun reprendreDonneesDefaut(context: Context, souscriptionId: Int): Boolean {
        if (souscriptionId < 0) return false
        val source = cle(-1)
        val cible = cle(souscriptionId)
        if (source == cible) return false

        var repris = false
        context.magasinPrefsPartage.edit { prefs ->
            val codes = decoderCarte(prefs[CLE_CODES])
            codes[source]?.let { ancien ->
                if (codes[cible] == null) {
                    codes[cible] = ancien
                    codes.remove(source)
                    prefs[CLE_CODES] = gson.toJson(codes)
                    repris = true
                }
            }

            val soldes = decoderSoldes(prefs[CLE_SOLDES]).toMutableMap()
            soldes[source]?.let { ancien ->
                if (soldes[cible] == null) {
                    soldes[cible] = ancien.copy(souscriptionId = souscriptionId)
                    soldes.remove(source)
                    prefs[CLE_SOLDES] = gson.toJson(soldes)
                    repris = true
                }
            }

            val tentatives = decoderTentatives(prefs[CLE_TENTATIVES]).toMutableMap()
            tentatives[source]?.let { ancienne ->
                if (tentatives[cible] == null) {
                    tentatives[cible] = ancienne
                    tentatives.remove(source)
                    prefs[CLE_TENTATIVES] = gson.toJson(tentatives)
                    repris = true
                }
            }
        }
        if (repris) Log.d(ETIQUETTE, "Données « defaut » reprises pour la carte $souscriptionId")
        return repris
    }
}
