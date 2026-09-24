package com.mitia.smsgateway.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.mitia.smsgateway.AppPasserelleSms
import com.mitia.smsgateway.di.ConteneurApp
import com.mitia.smsgateway.domain.model.ResultatTaches
import com.mitia.smsgateway.util.Constantes
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeoutOrNull

class ServicePasserelleSms : Service() {

    private val ETIQUETTE = "ServicePasserelleSms"

    private val porteeService = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var tacheScrutation: Job? = null

    /**
     * Signal de réveil : un push FCM (nouvelle tâche) interrompt l'attente
     * des 30 s pour scruter immédiatement. CONFLATED : les réveils en rafale
     * fusionnent en un seul (pas d'accumulation).
     */
    private val reveil = Channel<Unit>(Channel.CONFLATED)

    private fun conteneur(): ConteneurApp =
        (application as AppPasserelleSms).conteneurApp

    override fun onCreate() {
        super.onCreate()
        creerCanalNotification()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(ETIQUETTE, "onStartCommand appelé (action=${intent?.action})")
        val notification = construireNotification()
        startForeground(Constantes.ID_NOTIFICATION_PREMIER_PLAN, notification)

        // Push FCM "nouvelle tâche" : réveille la boucle immédiatement
        // au lieu d'attendre la fin des 30 s.
        if (intent?.action == "ACTION_POLL_NOW") {
            reveil.trySend(Unit)
        }

        // Évite de lancer 2 boucles si onStartCommand est rappelé
        if (tacheScrutation?.isActive != true) {
            tacheScrutation = porteeService.launch {
                executerConnexion()
            }
        }
        return START_STICKY
    }

    override fun onDestroy() {
        // Best-effort : prévenir le serveur avant de mourir (bouton Déconnecter
        // ou système). Si ça n'aboutit pas, le sweep HORS_LIGNE serveur (90 s
        // sans scrutation) prend le relais automatiquement.
        try {
            val t = Thread {
                try {
                    kotlinx.coroutines.runBlocking {
                        kotlinx.coroutines.withTimeout(5000L) {
                            val cont = conteneur()
                            val identifiants = cont.depotAppareils.obtenirIdentifiants()
                            if (identifiants != null) {
                                cont.depotAppareils.deconnecter(identifiants.first, identifiants.second)
                            }
                        }
                    }
                } catch (_: Exception) {
                }
            }
            t.start()
            t.join(6000L)
        } catch (_: Exception) {
        }
        tacheScrutation?.cancel()
        porteeService.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    /**
     * Connexion Android ↔ Serveur :
     * 1. Auth via ControleurAppareils (charger sinon enregistrer).
     * 2. Boucle de scrutation toutes les 30s :
     *    a. rejoue les confirmations (ControleurConfirmationsEnAttente),
     *    b. récupère les tâches, sync l'état local, vérifie le quota,
     *       traite via ControleurTaches (réclamation, SMS, confirmation).
     */
    private suspend fun executerConnexion() {
        val cont = conteneur()

        // Synchronise l'URL du client HTTP avec la préférence stockée.
        val urlBase = cont.depotAppareils.obtenirUrlServeur()
        Log.d(ETIQUETTE, "Serveur : $urlBase")

        // --- 1. Auth ---
        val identifiants = cont.controleurAppareils.assurerEnregistrement() ?: return

        val appareilId = identifiants.first
        val jeton = identifiants.second
        Log.d(ETIQUETTE, "Appareil prêt : id=$appareilId jeton=$jeton")

        // Récupérer et envoyer le jeton FCM actuel
        cont.controleurAppareils.actualiserJetonFcm(appareilId, jeton)

        // --- 2. Boucle de scrutation ---
        var etaitConnecte = false
        var premiereSynchro = true
        var quotaEtaitAtteint = false
        while (currentCoroutineContext().isActive) {
            try {
                // 2a. Rejouer les confirmations en attente (voir ControleurConfirmationsEnAttente).
                cont.controleurConfirmationsEnAttente.rejouerConfirmationsEnAttente(appareilId, jeton)

                when (val resultatTaches = cont.depotTaches.recupererTaches(appareilId, jeton)) {
                    is ResultatTaches.Succes -> {
                        if (!etaitConnecte) {
                            etaitConnecte = true
                            cont.depotJournaux.journaliser(
                                if (premiereSynchro) "connexion au serveur ok" else "connexion rétablie"
                            )
                            premiereSynchro = false
                        }
                        val maintenant = System.currentTimeMillis()
                        cont.depotAppareils.enregistrerSynchro(maintenant, resultatTaches.taches.size)
                        cont.depotTaches.enregistrerRecues(resultatTaches.taches)

                        // 2b. Quota serveur (transitions loggées une seule fois)
                        val infosQuota = cont.depotAppareils.obtenirQuota(appareilId, jeton)
                        if (infosQuota != null) {
                            cont.depotAppareils.enregistrerInstantaneQuota(infosQuota.quota, infosQuota.usage)
                            if (infosQuota.quota_reached && !quotaEtaitAtteint) {
                                quotaEtaitAtteint = true
                                cont.depotJournaux.journaliser(
                                    "quota horaire atteint (${infosQuota.usage}/${infosQuota.quota})"
                                )
                            } else if (!infosQuota.quota_reached && quotaEtaitAtteint) {
                                quotaEtaitAtteint = false
                                cont.depotJournaux.journaliser("quota horaire réinitialisé")
                            }
                        }

                        if (resultatTaches.taches.isNotEmpty()) {
                            cont.depotJournaux.journaliser(
                                "sync file d'attente · ${resultatTaches.taches.size} tâche(s)"
                            )
                            cont.controleurTaches.traiterTaches(
                                applicationContext,
                                appareilId,
                                jeton,
                                resultatTaches.taches
                            ) { texte -> mettreAJourNotification(texte) }
                        } else {
                            Log.d(ETIQUETTE, "Scrutation des tâches... aucune")
                        }
                    }
                    ResultatTaches.ErreurReseau -> {
                        if (etaitConnecte) {
                            etaitConnecte = false
                            cont.depotJournaux.journaliser("réseau perdu · reprise dans 30 s")
                        }
                    }
                }
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                Log.e(ETIQUETTE, "Erreur inattendue dans la boucle de scrutation", e)
            }
            // Attente 30 s max, interrompue aussitôt qu'un push FCM signale
            // une nouvelle tâche (réveil immédiat, cible ~5 s de bout en bout).
            withTimeoutOrNull(Constantes.INTERVALLE_SCRUTATION_MS) {
                reveil.receive()
            }
        }
    }

    private fun creerCanalNotification() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val canal = NotificationChannel(
                Constantes.CANAL_PREMIER_PLAN_ID,
                "SMSIKA",
                NotificationManager.IMPORTANCE_LOW
            )
            val gestionnaire = getSystemService(NotificationManager::class.java)
            gestionnaire.createNotificationChannel(canal)
        }
    }

    private fun construireNotification(): Notification {
        return NotificationCompat.Builder(this, Constantes.CANAL_PREMIER_PLAN_ID)
            .setContentTitle("SMSIKA actif")
            .setContentText("En attente de tâches...")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setOngoing(true)
            .build()
    }

    private fun mettreAJourNotification(texte: String) {
        val notification = NotificationCompat.Builder(this, Constantes.CANAL_PREMIER_PLAN_ID)
            .setContentTitle("SMSIKA actif")
            .setContentText(texte)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setOngoing(true)
            .build()
        val gestionnaire = getSystemService(NotificationManager::class.java)
        gestionnaire.notify(Constantes.ID_NOTIFICATION_PREMIER_PLAN, notification)
    }
}
