'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Download, Search, RefreshCw, ChevronDown, Package, Loader2,
} from 'lucide-react'
import CoquilleTableauDeBord from '../../composants/CoquilleTableauDeBord'
import { Appareil, Tache, BadgeStatut, STATUTS_TACHES } from '../../composants/interface'

export default function PageHistorique() {
  const [taches, setTaches] = useState<Tache[]>([])
  const [appareils, setAppareils] = useState<Appareil[]>([])
  const [chargement, setChargement] = useState(true)
  const [actualisationEnCours, setActualisationEnCours] = useState(false)
  const [recherche, setRecherche] = useState('')
  const [filtreEtat, setFiltreEtat] = useState('ALL')

  const chargerDonnees = useCallback(async (silencieux = false) => {
    if (!silencieux) setActualisationEnCours(true)
    try {
      const [reponseTaches, reponseAppareils] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/devices'),
      ])
      const donneesTaches = await reponseTaches.json()
      const donneesAppareils = await reponseAppareils.json()
      if (Array.isArray(donneesTaches.tasks)) {
        setTaches((donneesTaches.tasks as Tache[]).filter((t) => ['ENVOYE', 'ECHOUE'].includes(t.statut)))
      }
      if (Array.isArray(donneesAppareils.devices)) setAppareils(donneesAppareils.devices)
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

  function nomAppareil(deviceId: string | null): string {
    if (!deviceId) return '—'
    return appareils.find((d) => d.id === deviceId)?.nom ?? deviceId.substring(0, 8)
  }

  const demandeFiltrees = taches.filter((t) => {
    const correspondEtat = filtreEtat === 'ALL' || t.statut === filtreEtat
    const correspondRecherche =
      t.numero_destinataire.includes(recherche) || t.message.toLowerCase().includes(recherche.toLowerCase())
    return correspondEtat && correspondRecherche
  })

  function exporter() {
    const parametres = new URLSearchParams()
    parametres.set('statut', 'ENVOYE,ECHOUE')
    if (recherche.trim()) parametres.set('q', recherche.trim())
    window.location.href = `/api/tasks/export?${parametres.toString()}`
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Historique</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Retrouvez toutes les demandes d'envoi traitées par SMSIKA.
          </p>
        </div>
        <button
          onClick={exporter}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
        >
          <Download className="h-4 w-4" /> Exporter
        </button>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 dark:border-zinc-800/80 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Historique des demandes</h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500">Journal complet des traitements, succès et erreurs</p>
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
            <div className="relative">
              <select
                value={filtreEtat}
                onChange={(e) => setFiltreEtat(e.target.value)}
                className="appearance-none rounded-xl border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-xs font-semibold text-slate-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                <option value="ALL">Tous les états</option>
                <option value="ENVOYE">Envoyé</option>
                <option value="ECHOUE">Échoué</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
            <button
              onClick={() => chargerDonnees()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${actualisationEnCours ? 'animate-spin' : ''}`} /> Actualiser
            </button>
          </div>
        </div>

        {demandeFiltrees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 dark:bg-zinc-800">
              <Package className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-bold text-slate-900 dark:text-white">File vide</p>
            <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500 max-w-xs">
              Les nouvelles demandes apparaîtront ici avec leur statut, leur client et leur date de traitement.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-left font-semibold uppercase tracking-wider text-slate-400 dark:border-zinc-800 dark:bg-zinc-800/30">
                  <th className="px-6 py-3">DEMANDE</th>
                  <th className="px-6 py-3">CLIENT</th>
                  <th className="px-6 py-3">DESTINATAIRE</th>
                  <th className="px-6 py-3">MESSAGE</th>
                  <th className="px-6 py-3">ÉTAT</th>
                  <th className="px-6 py-3">CRÉÉE LE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {demandeFiltrees.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
                    <td className="px-6 py-4 font-mono text-slate-500 dark:text-zinc-400">{t.id.substring(0, 8)}</td>
                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-zinc-300">{nomAppareil(t.device_id)}</td>
                    <td className="px-6 py-4 font-mono font-semibold text-slate-800 dark:text-zinc-200">{t.numero_destinataire}</td>
                    <td className="px-6 py-4 max-w-xs truncate text-slate-600 dark:text-zinc-300" title={t.message}>{t.message}</td>
                    <td className="px-6 py-4"><BadgeStatut statut={t.statut} config={STATUTS_TACHES} /></td>
                    <td className="px-6 py-4 text-slate-500 dark:text-zinc-400">
                      {new Date(t.created_at).toLocaleString('fr-FR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-3 text-xs text-slate-400 dark:border-zinc-800/80">
          {demandeFiltrees.length} demande{demandeFiltrees.length > 1 ? 's' : ''}
        </div>
      </div>
    </CoquilleTableauDeBord>
  )
}
