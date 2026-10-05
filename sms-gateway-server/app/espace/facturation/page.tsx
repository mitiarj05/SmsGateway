'use client'

import { useState, useEffect } from 'react'
import { Receipt, ChevronDown } from 'lucide-react'
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
        afficherNotification('succes', 'Demande transmise à l’administrateur')
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
    <CoquilleEspace>
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Facturation</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Consultez le relevé détaillé de votre consommation mensuelle.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Période</span>
          <div className="relative">
            <input
              type="month"
              value={mois}
              onChange={(e) => e.target.value && setMois(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-700 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            />
          </div>
        </div>
      </div>

      {!ligne ? (
        <p className="text-xs text-slate-400 dark:text-zinc-500">Chargement des données...</p>
      ) : (
        <>
          {/* 4 Cartes statistiques */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['SMS envoyés', ligne.sms_envoyes],
              ['SMS reçus', ligne.sms_recus],
              ['Clics liens', ligne.clics],
              ['Échecs', ligne.echecs],
            ].map(([etiquette, valeur]) => (
              <div key={etiquette as string} className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
                <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">{etiquette}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{valeur}</p>
              </div>
            ))}
          </div>

          {/* Carte principale consommations & quotas */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-600" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Relevé de {ligne.mois}</h2>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">{ligne.total_facture} unité(s) consommée(s)</p>
                </div>
              </div>
              {ligne.depassement && (
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
                  QUOTA ATTEINT
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2">
                <span>Quota de votre compte</span>
                <span>{ligne.total_facture} / {ligne.quota_mensuel ?? '∞'} SMS</span>
              </div>
              {ligne.quota_mensuel !== null && (
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                  <div
                    className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-600'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-xs text-slate-400 dark:text-zinc-500">
                1 unité correspond à 1 SMS créé dans le mois. La facturation finale est calculée en fin de mois.
              </p>
              {!demandeEnvoyee ? (
                <button
                  onClick={demanderQuota}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-200 shrink-0"
                >
                  Demander plus de quota
                </button>
              ) : (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Demande d'augmentation envoyée
                </span>
              )}
            </div>
          </div>
        </>
      )}

      <Toast notification={notification} />
    </CoquilleEspace>
  )
}
