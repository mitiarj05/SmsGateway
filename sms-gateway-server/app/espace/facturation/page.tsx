'use client'

import { useState, useEffect } from 'react'
import { Receipt } from 'lucide-react'
import CoquilleEspace from '../../../composants/CoquilleEspace'
import { Toast } from '../../../composants/interface'

interface Ligne {
  mois: string
  nom: string
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
  const [demandeEnvoyee, setDemandeEnvoyee] = useState(false)
  const [notification, setNotification] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  function afficherNotification(type: 'succes' | 'erreur', texte: string) {
    setNotification({ type, texte })
    setTimeout(() => setNotification(null), 4000)
  }

  useEffect(() => {
    fetch(`/api/espace/facturation?mois=${mois}`)
      .then((r) => r.json())
      .then((d) => { if (typeof d.total_facture === 'number') setLigne(d) })
      .catch(() => null)
  }, [mois])

  async function demanderQuota() {
    if (!ligne) return
    try {
      const reponse = await fetch('/api/demandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: ligne.nom,
          contact: 'via espace client (demande de quota)',
          usage_prevu: `Demande d'augmentation du quota mensuel (conso ${ligne.mois} : ${ligne.total_facture}, quota actuel : ${ligne.quota_mensuel ?? 'illimité'}).`,
        }),
      })
      if (reponse.ok) {
        setDemandeEnvoyee(true)
        afficherNotification('succes', 'Demande transmise à l\u2019administrateur')
      } else {
        afficherNotification('erreur', 'Envoi impossible')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    }
  }

  const pct = ligne?.quota_mensuel
    ? Math.min(100, Math.round((ligne.total_facture / ligne.quota_mensuel) * 100))
    : 0

  return (
    <CoquilleEspace titre="Facturation" sousTitre="Votre consommation mensuelle">
      <div className="mb-2 max-w-5xl">
        <input type="month" value={mois} onChange={(e) => e.target.value && setMois(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200" />
      </div>
      {!ligne ? (
        <p className="text-sm text-zinc-400">Chargement…</p>
      ) : (
        <>
        <div className="mb-4 grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ['SMS envoyés', ligne.sms_envoyes],
            ['SMS reçus', ligne.sms_recus],
            ['Clics', ligne.clics],
            ['Échecs', ligne.echecs],
          ].map(([etiquette, valeur]) => (
            <div key={etiquette as string} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{etiquette}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-white">{valeur}</p>
            </div>
          ))}
        </div>
        <section className="max-w-5xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
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
          {!demandeEnvoyee ? (
            <button onClick={demanderQuota}
              className="mt-3 rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
              Demander une augmentation de quota
            </button>
          ) : (
            <p className="mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Demande transmise — votre administrateur reviendra vers vous.
            </p>
          )}
        </section>
        </>
      )}
      <Toast notification={notification} />
    </CoquilleEspace>
  )
}
