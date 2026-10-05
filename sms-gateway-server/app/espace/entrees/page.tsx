'use client'

import { useState, useEffect, useCallback } from 'react'
import { Inbox, RefreshCw, Loader2, Search, MessageSquare } from 'lucide-react'
import CoquilleEspace from '../../../composants/CoquilleEspace'
import { BadgeStatut, STATUTS_TACHES } from '../../../composants/interface'

interface Entrant {
  id: string
  expediteur: string
  contenu: string
  date_reception: string
  statut_notification: string
  appareils: { nom: string } | null
}

export default function PageEntreesEspace() {
  const [entrants, setEntrants] = useState<Entrant[]>([])
  const [chargement, setChargement] = useState(true)
  const [actualisationEnCours, setActualisationEnCours] = useState(false)
  const [recherche, setRecherche] = useState('')

  const chargerDonnees = useCallback(async (silencieux = false) => {
    if (!silencieux) setActualisationEnCours(true)
    try {
      const reponse = await fetch('/api/espace/entrees?limit=100')
      const donnees = await reponse.json()
      if (donnees.entrants) setEntrants(donnees.entrants)
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

  const visibles = entrants.filter(e =>
    e.expediteur.includes(recherche) || e.contenu.toLowerCase().includes(recherche.toLowerCase())
  )

  if (chargement) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <CoquilleEspace>
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">SMS reçus</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Consultez les messages entrants adressés à votre compte.
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 dark:border-zinc-800/80 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Boîte de réception</h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500">{visibles.length} message(s) au total</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                className="w-48 rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>
            <button
              onClick={() => chargerDonnees()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${actualisationEnCours ? 'animate-spin' : ''}`} /> Actualiser
            </button>
          </div>
        </div>

        {visibles.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Inbox className="h-8 w-8 text-slate-300 dark:text-zinc-600" />
            <p className="text-sm font-bold text-slate-900 dark:text-white">Aucun message reçu</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500">Les réponses de vos destinataires apparaîtront ici.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-left font-semibold uppercase tracking-wider text-slate-400 dark:border-zinc-800 dark:bg-zinc-800/30">
                  <th className="px-6 py-3">EXPÉDITEUR</th>
                  <th className="px-6 py-3">MESSAGE</th>
                  <th className="px-6 py-3">RAPPEL</th>
                  <th className="px-6 py-3">REÇU LE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {visibles.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200">{e.expediteur}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-zinc-200 max-w-xs truncate" title={e.contenu}>{e.contenu}</td>
                    <td className="px-6 py-4"><BadgeStatut statut={e.statut_notification} config={STATUTS_TACHES} /></td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(e.date_reception).toLocaleString('fr-FR')}
                      {e.appareils?.nom && <span className="block text-[11px] text-slate-400">via {e.appareils.nom}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </CoquilleEspace>
  )
}
