'use client'

import { useState, useEffect } from 'react'
import { Link2 } from 'lucide-react'
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

  useEffect(() => {
    fetch('/api/espace/liens?limit=100')
      .then((r) => r.json())
      .then((d) => { if (d.liens) setLiens(d.liens) })
      .catch(() => null)
  }, [])

  const cliques = liens.filter((l) => l.statut === 'CLIQUE').length

  return (
    <CoquilleEspace
      titre="Mes liens"
      sousTitre={`${liens.length} lien(s) · ${cliques} cliqué(s)`}
    >
      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
        {liens.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Link2 className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Aucun lien</p>
            <p className="text-xs text-zinc-400">Cochez « Lien intelligent » lors d&apos;un envoi.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800">
                  <th className="px-5 py-3">Destinataire</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3">Créé le</th>
                  <th className="px-5 py-3">Cliqué le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
                {liens.map((l) => (
                  <tr key={l.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                    <td className="px-5 py-3.5"><span className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">{l.numero_destinataire}</span></td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${l.statut === 'CLIQUE' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                        {l.statut === 'CLIQUE' ? 'Cliqué' : 'En attente de clic'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-400">{new Date(l.date_creation).toLocaleString('fr-FR')}</td>
                    <td className="px-5 py-3.5 text-xs text-zinc-400">{l.date_clic ? new Date(l.date_clic).toLocaleString('fr-FR') : '—'}</td>
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
