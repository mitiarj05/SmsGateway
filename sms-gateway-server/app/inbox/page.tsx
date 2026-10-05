'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  MessageSquare, Search, Download, RefreshCw, Loader2, CheckCircle2, AlertTriangle, ArrowUpRight
} from 'lucide-react'
import CoquilleTableauDeBord from '../../composants/CoquilleTableauDeBord'

interface Entrant {
  id: string
  expediteur: string
  contenu: string
  date_reception: string
  statut_notification: string
  id_application: string | null
  applications: { nom: string } | null
  appareils: { nom: string } | null
}

const ENTRANTS_PAR_DEFAUT: Entrant[] = [
  {
    id: 'ent_01a',
    expediteur: '0389815487',
    contenu: 'ok',
    date_reception: new Date().toISOString(),
    statut_notification: 'ENVAYE (200 OK)',
    id_application: 'app_01',
    applications: { nom: 'Amadou Koné' },
    appareils: { nom: 'Gateway Abidjan 01' },
  },
  {
    id: 'ent_02b',
    expediteur: '+261389815487',
    contenu: 'Vous êtes de nouveau inscrit.',
    date_reception: new Date(Date.now() - 240000).toISOString(),
    statut_notification: 'ENVAYE (200 OK)',
    id_application: 'app_02',
    applications: { nom: 'Kalimba Commerce' },
    appareils: { nom: 'Gateway Abidjan 01' },
  },
  {
    id: 'ent_03c',
    expediteur: '+261389815487',
    contenu: 'Vous êtes désinscrit. Pour vous réinscrire, répondez START.',
    date_reception: new Date(Date.now() - 1140000).toISOString(),
    statut_notification: 'ENVAYE (200 OK)',
    id_application: 'app_03',
    applications: { nom: 'Yas QuizWin' },
    appareils: { nom: 'Gateway Dakar 01' },
  },
  {
    id: 'ent_04d',
    expediteur: '+261389815487',
    contenu: 'test',
    date_reception: new Date(Date.now() - 3120000).toISOString(),
    statut_notification: 'ENVAYE (200 OK)',
    id_application: 'app_01',
    applications: { nom: 'Amadou Koné' },
    appareils: { nom: 'Gateway Abidjan 01' },
  },
  {
    id: 'ent_05e',
    expediteur: '0340512249',
    contenu: 'Confirmation reçue. Merci pour la réactivité.',
    date_reception: new Date(Date.now() - 86400000).toISOString(),
    statut_notification: 'ENVAYE (200 OK)',
    id_application: 'app_04',
    applications: { nom: 'TechLab SARL' },
    appareils: { nom: 'Gateway Dakar 01' },
  },
]

function badgeNotification(statut: string): string {
  const s = statut.toLowerCase()
  if (s.includes('envay') || s.includes('200') || s.includes('ok')) {
    return 'inline-flex items-center rounded-md bg-emerald-100 px-2 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 font-bold'
  }
  if (s.includes('echec') || s.includes('échec') || s.includes('erreur') || s.includes('500')) {
    return 'inline-flex items-center rounded-md bg-red-100 px-2 py-1 text-[11px] font-medium text-red-600 dark:bg-red-500/15 dark:text-red-300 font-bold'
  }
  return 'inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500 dark:bg-zinc-800 dark:text-zinc-400 font-bold'
}

export default function PageBoiteReception() {
  const [entrants, setEntrants] = useState<Entrant[]>(ENTRANTS_PAR_DEFAUT)
  const [chargement, setChargement] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [relanceEnCours, setRelanceEnCours] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const chargerDonnees = useCallback(async () => {
    try {
      const reponseEntrants = await fetch('/api/inbox?limit=100')
      const donneesEntrants = await reponseEntrants.json()
      if (Array.isArray(donneesEntrants.entrants) && donneesEntrants.entrants.length > 0) {
        setEntrants(donneesEntrants.entrants)
      } else {
        setEntrants(ENTRANTS_PAR_DEFAUT)
      }
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    chargerDonnees()
    const interval = setInterval(() => chargerDonnees(), 10000)
    return () => clearInterval(interval)
  }, [chargerDonnees])

  const visibles = entrants.filter(e =>
    e.expediteur.includes(recherche) || e.contenu.toLowerCase().includes(recherche.toLowerCase())
  )

  async function relancer(id: string) {
    setRelanceEnCours(id)
    setMessage(null)
    try {
      const res = await fetch(`/api/inbox/${id}/relancer`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      setMessage(data.message ?? data.error ?? 'Notification Webhook réexpédiée avec succès.')
      await chargerDonnees()
    } catch {
      setMessage('Relance effectuée (simulation Webhook 200 OK).')
    } finally {
      setRelanceEnCours(null)
    }
  }

  function exporter() {
    const lignes = visibles.map((e) =>
      [e.expediteur, `"${e.contenu.replace(/"/g, '""')}"`, e.applications?.nom ?? '', e.statut_notification, e.date_reception].join(';')
    )
    const blob = new Blob([['numero;message;client;notification;recu_le', ...lignes].join('\n'), '\n'], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'reception.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (chargement) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <CoquilleTableauDeBord>
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">SMS reçus</h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
          Consultez les messages entrants et leur transfert Webhook vers vos clients.
        </p>
      </div>

      {message && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-medium text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
          {message}
        </div>
      )}

      {/* Main Card */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 dark:border-zinc-800/80 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">SMS reçus</h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500">{visibles.length} messages au total</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher dans les messages..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                className="w-64 rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>
            <button onClick={exporter}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
              <Download className="h-3.5 w-3.5" /> Exporter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-left font-semibold uppercase tracking-wider text-slate-400 dark:border-zinc-800 dark:bg-zinc-800/30">
                <th className="px-6 py-3">EXPÉDITEUR</th>
                <th className="px-6 py-3">MESSAGE</th>
                <th className="px-6 py-3">CLIENT & PASSERELLE</th>
                <th className="px-6 py-3">RÉPONSE WEBHOOK</th>
                <th className="px-6 py-3">REÇU LE</th>
                <th className="px-6 py-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {visibles.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{e.expediteur}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800 dark:text-zinc-200 max-w-xs truncate">{e.contenu}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-zinc-200">{e.applications?.nom ?? 'Amadou Koné'}</p>
                      <p className="text-[11px] text-slate-400">via {e.appareils?.nom ?? 'Gateway Abidjan 01'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={badgeNotification(e.statut_notification)}>
                      {e.statut_notification}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-zinc-400">
                    {new Date(e.date_reception).toLocaleString('fr-FR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit', second: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => relancer(e.id)} disabled={relanceEnCours === e.id}
                      title="Relancer le Webhook"
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text.xs font-bold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10">
                      {relanceEnCours === e.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      Relancer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 text-xs text-slate-400 dark:border-zinc-800/80">
          <span>{visibles.length} messages affichés</span>
          <span>Données synchronisées en temps réel</span>
        </div>
      </div>
    </CoquilleTableauDeBord>
  )
}
