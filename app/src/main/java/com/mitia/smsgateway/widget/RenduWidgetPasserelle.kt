package com.mitia.smsgateway.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import android.widget.RemoteViews
import com.mitia.smsgateway.AppPasserelleSms
import com.mitia.smsgateway.R
import com.mitia.smsgateway.data.local.JournalEvenements
import com.mitia.smsgateway.data.local.PreferencesAppareil
import com.mitia.smsgateway.service.ServicePasserelleSms
import com.mitia.smsgateway.ui.serviceEnCoursExecution
import com.mitia.smsgateway.ui.texteTempsEcoule
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Rendu et commandes du widget d'écran d'accueil.
 *
 * Le widget ne fait que MIROITER l'état réel de l'appareil (dernière synchro,
 * envois du jour, service en cours) : il ne tient aucun état à lui, et ne ment
 * donc jamais volontairement. Seule limite : sans service en marche, rien ne
 * vient le redessiner — d'où le rafraîchissement au toucher et le rendez-vous
 * système de 30 min (voir widget_passerelle_info.xml).
 */
object RenduWidgetPasserelle {

    const val ACTION_RAFRAICHIR = "com.mitia.smsgateway.widget.RAFRAICHIR"
    const val ACTION_DEMARRER_SERVICE = "com.mitia.smsgateway.widget.DEMARRER_SERVICE"
    const val ACTION_ARRETER_SERVICE = "com.mitia.smsgateway.widget.ARRETER_SERVICE"

    private const val ETIQUETTE = "RenduWidgetPasserelle"

    /** Même règle que l'écran Statut : 90 s sans synchro = plus en ligne. */
    private const val FRAICHEUR_SYNCHRO_MS = 90_000L

    /** Portée propre : le rendu doit survivre à la fin du service qui l'appelle. */
    private val portee = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    // -------------------- Rafraîchissement --------------------

    /** Redessine toutes les instances posées sur l'écran d'accueil. */
    suspend fun rafraichir(context: Context) {
        try {
            val gestionnaire = AppWidgetManager.getInstance(context) ?: return
            val ids = gestionnaire.getAppWidgetIds(
                ComponentName(context.packageName, WidgetPasserelle::class.java.name)
            )
            if (ids.isEmpty()) return
            val vues = construireVues(context)
            ids.forEach { gestionnaire.updateAppWidget(it, vues) }
        } catch (e: Exception) {
            Log.w(ETIQUETTE, "Mise à jour du widget impossible", e)
        }
    }

    /**
     * Variante pour les appelants non suspend (service, récepteur, activité).
     *
     * @param delaiMs différer le rendu : après un arrêt du service, il faut
     *        laisser au système le temps de retirer le service de sa liste,
     *        sinon le widget se redessinerait avec l'ancien état.
     * @param apres appelé une fois le rendu terminé (fin d'un goAsync()).
     */
    fun rafraichirEnArrierePlan(
        context: Context,
        delaiMs: Long = 0L,
        apres: (() -> Unit)? = null
    ) {
        val application = context.applicationContext
        portee.launch {
            try {
                if (delaiMs > 0) delay(delaiMs)
                rafraichir(application)
            } finally {
                apres?.invoke()
            }
        }
    }

    // -------------------- Commandes du service --------------------

    /**
     * Démarre le service depuis le widget.
     *
     * Un appui sur un widget est une exemption explicitement reconnue aux
     * restrictions de démarrage en arrière-plan (Android 12+) — l'app est en
     * plus exemptée d'optimisation batterie. Si un constructeur refuse malgré
     * tout, on le journalise au lieu de planter : l'utilisateur retrouve la
     * raison dans l'écran Journal.
     */
    fun demarrerService(context: Context) {
        val application = context.applicationContext
        val intention = Intent(application, ServicePasserelleSms::class.java)
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                application.startForegroundService(intention)
            } else {
                application.startService(intention)
            }
            // L'état ne basculera qu'à la première synchro : on redemande un
            // rendu dans quelques secondes plutôt que de laisser le widget
            // afficher « Hors ligne » juste après un démarrage réussi.
            rafraichirEnArrierePlan(application, delaiMs = 4_000)
        } catch (e: Exception) {
            Log.e(ETIQUETTE, "Démarrage du service refusé par le système", e)
            portee.launch {
                JournalEvenements.journaliser(
                    application,
                    "démarrage depuis le widget refusé par le système"
                )
            }
        }
    }

    /**
     * Arrête le service. Arrêt simple : la session et les identifiants restent
     * en place, contrairement à « Se déconnecter » de l'écran Paramètres. Le
     * service prévient lui-même le serveur en mourant (onDestroy), et à défaut
     * le balayage serveur de 90 s marquera l'appareil hors ligne.
     */
    fun arreterService(context: Context) {
        val application = context.applicationContext
        application.stopService(Intent(application, ServicePasserelleSms::class.java))
    }

    // -------------------- Construction de l'affichage --------------------

    private suspend fun construireVues(context: Context): RemoteViews {
        val conteneur = (context.applicationContext as? AppPasserelleSms)?.conteneurApp
        val derniereSynchro = try {
            conteneur?.depotAppareils?.chargerSynchro()?.first ?: 0L
        } catch (e: Exception) {
            Log.w(ETIQUETTE, "Dernière synchro illisible", e)
            0L
        }
        val envoyes = try {
            conteneur?.depotTaches?.compterEnvoyesAujourdhui() ?: 0
        } catch (e: Exception) {
            Log.w(ETIQUETTE, "Compteur du jour illisible", e)
            0
        }

        val serviceActif = serviceEnCoursExecution(context)
        val enLigne = serviceActif && derniereSynchro > 0L &&
            System.currentTimeMillis() - derniereSynchro < FRAICHEUR_SYNCHRO_MS
        val sombre = try {
            PreferencesAppareil.estThemeSombre(context)
        } catch (e: Exception) {
            false
        }

        val vues = RemoteViews(context.packageName, R.layout.widget_passerelle)
        vues.setInt(
            R.id.widget_racine,
            "setBackgroundResource",
            if (sombre) R.drawable.fond_widget_sombre else R.drawable.fond_widget
        )

        // Le widget suit le thème choisi dans l'app (papier ou encre).
        val couleurPrincipale = if (sombre) 0xFFFAFAF9.toInt() else 0xFF1C1917.toInt()
        val couleurSecondaire = if (sombre) 0xFFA8A29E.toInt() else 0xFF78716C.toInt()
        val couleurTertiaire = if (sombre) 0xFF78716C.toInt() else 0xFFA8A29E.toInt()

        vues.setImageViewResource(
            R.id.widget_pastille,
            if (enLigne) R.drawable.pastille_en_ligne else R.drawable.pastille_hors_ligne
        )
        vues.setTextViewText(R.id.widget_statut, if (enLigne) "En ligne" else "Hors ligne")
        vues.setTextColor(R.id.widget_statut, couleurPrincipale)
        vues.setTextColor(R.id.widget_compteur, couleurPrincipale)
        vues.setTextColor(R.id.widget_marque, couleurTertiaire)
        vues.setTextColor(R.id.widget_libelle_compteur, couleurSecondaire)
        vues.setTextColor(R.id.widget_detail, couleurTertiaire)

        vues.setTextViewText(R.id.widget_compteur, envoyes.toString())
        vues.setTextViewText(
            R.id.widget_libelle_compteur,
            if (envoyes > 1) "SMS envoyés aujourd'hui" else "SMS envoyé aujourd'hui"
        )
        vues.setTextViewText(R.id.widget_detail, detailEtat(serviceActif, derniereSynchro))

        vues.setTextViewText(R.id.widget_bouton, if (serviceActif) "Arrêt" else "Marche")
        vues.setInt(
            R.id.widget_bouton,
            "setBackgroundResource",
            if (serviceActif) R.drawable.fond_bouton_arret_widget else R.drawable.fond_bouton_widget
        )

        // Toute la carte rafraîchit ; le bouton, lui, commande le service.
        vues.setOnClickPendingIntent(R.id.widget_racine, intention(context, ACTION_RAFRAICHIR, 1))
        vues.setOnClickPendingIntent(
            R.id.widget_bouton,
            intention(
                context,
                if (serviceActif) ACTION_ARRETER_SERVICE else ACTION_DEMARRER_SERVICE,
                2
            )
        )
        return vues
    }

    private fun detailEtat(serviceActif: Boolean, derniereSynchro: Long): String = when {
        !serviceActif -> "service arrêté"
        derniereSynchro <= 0L -> "jamais synchronisé"
        else -> "sync ${texteTempsEcoule(derniereSynchro)}"
    }

    private fun intention(context: Context, action: String, requete: Int): PendingIntent {
        // Intention EXPLICITE (classe du récepteur) : le récepteur peut rester
        // non exporté, personne d'autre ne peut déclencher ces commandes.
        val intention = Intent(context, WidgetPasserelle::class.java).setAction(action)
        return PendingIntent.getBroadcast(
            context,
            requete,
            intention,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }
}
