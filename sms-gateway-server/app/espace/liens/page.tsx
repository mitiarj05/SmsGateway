'use client'

import { useState, useEffect } from 'react'
import { Link2, MousePointerClick, Search } from 'lucide-react'
import CoquilleEspace from '../../../composants/CoquilleEspace'

interface Lien {
  id: string
  numero_destinataire: string
  statut: string
  date_creation: string
  date_clic: string | null
}

export default function PageLiensEspace() {
  const [liens, setLiens] = useState<Lien[]>([])
  const [recherche, setRecherche] = useState('')

  useEffect(() => {
    fetch('/api/espace/liens?limit=100')
      .then((r) => r.json())
      .then((d) => { if (d.liens) setLiens(d.liens) })
      .catch(() => null)
  }, [])

  const cliques = liens.filter((l) => l.statut === 'CLIQUE').length
  const visibles = liens.filter(l => l.numero_destinataire.includes(recherche))

  return (
    <CoquilleEspace>
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Liens intelligents</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Suivez les ouvertures et le taux de clic sur les liens courts intégrés dans vos SMS.
          </p>
        </div>
      </div>

      {/* 2 Cartes KPI */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{liens.length}</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">Total liens générés</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <Link2 className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{cliques}</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">Liens cliqués</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <MousePointerClick className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-zinc-800/80">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Suivi des ouvertures</h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500">{visibles.length} lien(s) listé(s)</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Numéro..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="w-48 rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            />
          </div>
        </div>

        {visibles.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Link2 className="h-8 w-8 text-slate-300 dark:text-zinc-600" />
            <p className="text-sm font-bold text-slate-900 dark:text-white">Aucun lien généré</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500">Cochez « Lien intelligent » lors d'un envoi pour suivre les clics.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-left font-semibold uppercase tracking-wider text-slate-400 dark:border-zinc-800 dark:bg-zinc-800/30">
                  <th className="px-6 py-3">DESTINATAIRE</th>
                  <th className="px-6 py-3">STATUT</th>
                  <th className="px-6 py-3">CRÉÉ LE</th>
                  <th className="px-6 py-3">CLIQUÉ LE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {visibles.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
                    <td className="px-6 py-4 font-mono font-semibold text-slate-800 dark:text-zinc-200">{l.numero_destinataire}</td>
                    <td className="px-6 py-4">
                      {l.statut === 'CLIQUE' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Cliqué
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> En attente de clic
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{new Date(l.date_creation).toLocaleString('fr-FR')}</td>
                    <td className="px-6 py-4 text-slate-400">{l.date_clic ? new Date(l.date_clic).toLocaleString('fr-FR') : '—'}</td>
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
