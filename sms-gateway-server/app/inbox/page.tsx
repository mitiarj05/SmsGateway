'use client'

import { useState, useEffect, useCallback } from 'react'
import { Inbox, RefreshCw, RotateCcw, Send } from 'lucide-react'
import CoquilleTableauDeBord from '../../composants/CoquilleTableauDeBord'
import { BadgeStatut, STATUTS_TACHES, Toast } from '../../composants/interface'

interface Entrant {
  id: string
  expediteur: string
  contenu: string
  date_reception: string
  statut_notification: string
  tentatives_notification: number
  id_application: string | null
  id_appareil: string | null
  applications: { nom: string } | null
  appareils: { nom: string } | null
}

interface ClientApi {
  id: string
  nom: string
}

const STATUT_NOTIFICATION_CONFIG = {
  ENVOYE: { label: 'Envoyé', badge: '' },
  EN_ATTENTE: { label: 'En attente', badge: '' },
  ECHOUE: { label: 'Échoué', badge: '' },
  DESACTIVE: { label: 'Coupé', badge: '' },
} as unknown as Record<string, { label: string; badge: string }>

export default function PageBoiteReception() {
  const [entrants, setEntrants] = useState<Entrant[]>([])
  const [clients, setClients] = useState<ClientApi[]>([])
  const [derniereActualisation, setDerniereActualisation] = useState<Date>(new Date())
  const [actualisationEnCours, setActualisationEnCours] = useState(false)
  const [chargement, setChargement] = useState(true)
  const [filtreClient, setFiltreClient] = useState<string>('TOUS')
  const [notification, setNotification] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  function afficherNotification(type: 'succes' | 'erreur', texte: string) {
    setNotification({ type, texte })
    setTimeout(() => setNotification(null), 4000)
  }

  const chargerDonnees = useCallback(async (silencieux = false) => {
    if (!silencieux) setActualisationEnCours(true)
    try {
      const [reponseEntrants, reponseClients] = await Promise.all([
        fetch('/api/inbox?limit=100'),
        fetch('/api/api-clients'),
      ])
      const donneesEntrants = await reponseEntrants.json()
      const donneesClients = await reponseClients.json()
      if (donneesEntrants.entrants) setEntrants(donneesEntrants.entrants)
      if (donneesClients.clients) setClients(donneesClients.clients)
      setDerniereActualisation(new Date())
    } finally {
      setChargement(false)
      setActualisationEnCours(false)
    }
  }, [])

  useEffect(() => {
    chargerDonnees(true)
    const interval = setInterval(() => chargerDonnees(true), 10000)
    return () => clearInterval(interval)
  }, [chargerDonnees])

  async function relancerNotification(id: string) {
    try {
      const reponse = await fetch(`/api/inbox/${id}/relancer`, { method: 'POST' })
      const donnees = await reponse.json()
      if (reponse.ok) {
        afficherNotification('succes', donnees.message ?? 'Notification remise en file')
        chargerDonnees(true)
      } else {
        afficherNotification('erreur', donnees.error ?? 'Relance impossible')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    }
  }

  const visibles = filtreClient === 'TOUS'
    ? entrants
    : entrants.filter((e) => e.id_application === filtreClient)

  if (chargement) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500">Chargement…</p>
      </div>
    )
  }

  return (
    <CoquilleTableauDeBord
      titre="Boîte de réception"
      sousTitre={`${visibles.length} message(s) · actualisé à ${derniereActualisation.toLocaleTimeString('fr-FR')}`}
      actions={
        <button onClick={() => chargerDonnees()}
          className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-600 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
          <RefreshCw className={`h-4 w-4 ${actualisationEnCours ? 'animate-spin' : ''}`} /> Actualiser
        </button>
      }
    >
      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
        <div className="flex flex-col gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">SMS reçus</h2>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {visibles.length}
            </span>
          </div>
          <select value={filtreClient} onChange={(e) => setFiltreClient(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            <option value="TOUS">Tous les clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>
        </div>

        {visibles.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Inbox className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Aucun message reçu</p>
            <p className="text-xs text-zinc-400">Les SMS reçus par vos téléphones apparaîtront ici.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800">
                  <th className="px-5 py-3">Expéditeur</th>
                  <th className="px-5 py-3">Message</th>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Notification</th>
                  <th className="px-5 py-3">Reçu le</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
                {visibles.map((e) => (
                  <tr key={e.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                    <td className="px-5 py-3.5"><span className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">{e.expediteur}</span></td>
                    <td className="max-w-xs px-5 py-3.5"><p className="truncate text-xs text-zinc-500 dark:text-zinc-400" title={e.contenu}>{e.contenu}</p></td>
                    <td className="px-5 py-3.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {e.applications?.nom ?? <span className="italic text-zinc-400">sans client</span>}
                      {e.appareils?.nom && <span className="block text-[11px] text-zinc-400">via {e.appareils.nom}</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      {e.id_application
                        ? <BadgeStatut statut={e.statut_notification} config={{ ...STATUTS_TACHES, ...STATUT_NOTIFICATION_CONFIG }} />
                        : <span className="text-xs text-zinc-400">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-400">{new Date(e.date_reception).toLocaleString('fr-FR')}</td>
                    <td className="px-5 py-3.5 text-right">
                      {e.id_application && (
                        <button onClick={() => relancerNotification(e.id)} title="Relancer la notification"
                          className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 hover:bg-blue-50 hover:text-blue-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-blue-500/10">
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="flex items-center gap-1.5 text-xs text-zinc-400">
        <Send className="h-3.5 w-3.5" />
        Routage : réponse à un envoi récent → SIM dédiée → sinon visible ici sans notification.
      </p>

      <Toast notification={notification} />
    </CoquilleTableauDeBord>
  )
}
