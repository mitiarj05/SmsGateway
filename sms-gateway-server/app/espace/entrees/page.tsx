'use client'

import { useState, useEffect, useCallback } from 'react'
import { Inbox, RefreshCw } from 'lucide-react'
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
  const [derniereActualisation, setDerniereActualisation] = useState(new Date())

  const chargerDonnees = useCallback(async (silencieux = false) => {
    if (!silencieux) setActualisationEnCours(true)
    try {
      const reponse = await fetch('/api/espace/entrees?limit=100')
      const donnees = await reponse.json()
      if (donnees.entrants) setEntrants(donnees.entrants)
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

  if (chargement) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500">Chargement…</p>
      </div>
    )
  }

  return (
    <CoquilleEspace
      titre="SMS reçus"
      sousTitre={`${entrants.length} message(s) · actualisé à ${derniereActualisation.toLocaleTimeString('fr-FR')}`}
    >
      <div className="mb-2 flex justify-end">
        <button onClick={() => chargerDonnees()}
          className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-600 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
          <RefreshCw className={`h-4 w-4 ${actualisationEnCours ? 'animate-spin' : ''}`} /> Actualiser
        </button>
      </div>
      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
        {entrants.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Inbox className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Aucun message reçu</p>
            <p className="text-xs text-zinc-400">Les réponses à vos envois apparaîtront ici.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800">
                  <th className="px-5 py-3">Expéditeur</th>
                  <th className="px-5 py-3">Message</th>
                  <th className="px-5 py-3">Rappel</th>
                  <th className="px-5 py-3">Reçu le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
                {entrants.map((e) => (
                  <tr key={e.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                    <td className="px-5 py-3.5"><span className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">{e.expediteur}</span></td>
                    <td className="max-w-xs px-5 py-3.5"><p className="truncate text-xs text-zinc-500 dark:text-zinc-400" title={e.contenu}>{e.contenu}</p></td>
                    <td className="px-5 py-3.5"><BadgeStatut statut={e.statut_notification} config={STATUTS_TACHES} /></td>
                    <td className="px-5 py-3.5 text-xs text-zinc-400">
                      {new Date(e.date_reception).toLocaleString('fr-FR')}
                      {e.appareils?.nom && <span className="block text-[11px]">via {e.appareils.nom}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </CoquilleEspace>
  )
}
