'use client'

import { useState, useEffect } from 'react'
import { Receipt } from 'lucide-react'
import CoquilleEspace from '../../../composants/CoquilleEspace'

interface Ligne {
  mois: string
  total_facture: number
  sms_envoyes: number
  sms_recus: number
  clics: number
  echecs: number
  quota_mensuel: number | null
  depassement: boolean
}

function moisCourant(): string {
  const maintenant = new Date()
  return `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}`
}

export default function PageFacturationEspace() {
  const [ligne, setLigne] = useState<Ligne | null>(null)
  const [mois, setMois] = useState(moisCourant())

  useEffect(() => {
    fetch(`/api/espace/facturation?mois=${mois}`)
      .then((r) => r.json())
      .then((d) => { if (typeof d.total_facture === 'number') setLigne(d) })
      .catch(() => null)
  }, [mois])

  const pct = ligne?.quota_mensuel
    ? Math.min(100, Math.round((ligne.total_facture / ligne.quota_mensuel) * 100))
    : 0

  return (
    <CoquilleEspace titre="Facturation" sousTitre="Votre consommation mensuelle">
      <div className="mb-2 max-w-3xl">
        <input type="month" value={mois} onChange={(e) => e.target.value && setMois(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200" />
      </div>
      {!ligne ? (
        <p className="text-sm text-zinc-400">Chargement…</p>
      ) : (
        <section className="max-w-3xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
          <div className="mb-4 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
              {ligne.mois} — {ligne.total_facture} unité(s)
            </h2>
            {ligne.depassement && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-500/15 dark:text-red-400">
                QUOTA DÉPASSÉ
              </span>
            )}
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {[
              ['SMS envoyés', ligne.sms_envoyes],
              ['SMS reçus', ligne.sms_recus],
              ['Clics', ligne.clics],
              ['Échecs', ligne.echecs],
            ].map(([etiquette, valeur]) => (
              <div key={etiquette as string} className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/60">
                <dt className="text-xs text-zinc-400">{etiquette}</dt>
                <dd className="mt-0.5 text-xl font-bold tabular-nums text-zinc-900 dark:text-white">{valeur}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>Quota mensuel</span>
              <span className="font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">
                {ligne.total_facture} / {ligne.quota_mensuel ?? '∞'}
              </span>
            </div>
            {ligne.quota_mensuel !== null && (
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div className={`h-full rounded-full ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
              </div>
            )}
          </div>
          <p className="mt-4 text-xs text-zinc-400">
            1 unité = 1 SMS créé dans le mois. Facturation établie par votre administrateur.
          </p>
        </section>
      )}
    </CoquilleEspace>
  )
}
