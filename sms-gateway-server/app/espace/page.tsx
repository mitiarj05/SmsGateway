'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Clock, Inbox } from 'lucide-react'
import CoquilleEspace from '../../composants/CoquilleEspace'

interface Moi {
  nom: string
  mois: string
  quota_mensuel: number | null
  utilise_mois: number
  depassement: boolean
  stats: { envoyes: number; attente: number; echoue: number; recus: number }
}

export default function PageEspace() {
  const [moi, setMoi] = useState<Moi | null>(null)

  useEffect(() => {
    fetch('/api/espace/moi')
      .then((r) => r.json())
      .then((d) => { if (d.nom) setMoi(d) })
      .catch(() => null)
  }, [])

  if (!moi) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500">Chargement…</p>
      </div>
    )
  }

  const pct = moi.quota_mensuel
    ? Math.min(100, Math.round((moi.utilise_mois / moi.quota_mensuel) * 100))
    : 0
  const cartes = [
    { icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />, etiquette: 'SMS envoyés', valeur: moi.stats.envoyes },
    { icon: <Clock className="h-5 w-5 text-amber-600" />, etiquette: "En file d'attente", valeur: moi.stats.attente },
    { icon: <XCircle className="h-5 w-5 text-red-600" />, etiquette: 'Échecs', valeur: moi.stats.echoue },
    { icon: <Inbox className="h-5 w-5 text-blue-600" />, etiquette: 'SMS reçus', valeur: moi.stats.recus },
  ]

  return (
    <CoquilleEspace titre={`Bonjour, ${moi.nom}`} sousTitre={`Consommation de ${moi.mois}`}>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cartes.map((c) => (
          <div key={c.etiquette} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{c.etiquette}</p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-zinc-900 dark:text-white">{c.valeur}</p>
              </div>
              <div className="rounded-xl bg-white/60 p-2.5 dark:bg-white/5">{c.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Quota mensuel</h2>
          <p className="text-sm font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">
            {moi.utilise_mois} / {moi.quota_mensuel ?? '∞'}
          </p>
        </div>
        {moi.quota_mensuel !== null ? (
          <>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div className={`h-full rounded-full ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
            </div>
            {moi.depassement && (
              <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">
                Quota atteint : vos envois sont refusés (429) jusqu&apos;au mois prochain. Contactez votre administrateur.
              </p>
            )}
          </>
        ) : (
          <p className="mt-2 text-xs text-zinc-400">Aucune limite configurée.</p>
        )}
      </section>
    </CoquilleEspace>
  )
}
