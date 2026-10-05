'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Smartphone, Wifi, WifiOff, Plus, RefreshCw, SlidersHorizontal,
  Check, MoreHorizontal, Loader2,
} from 'lucide-react'
import CoquilleTableauDeBord from '../../composants/CoquilleTableauDeBord'
import { Appareil, Toast, DialogueConfirmation, QUOTA_SMS_PAR_HEURE } from '../../composants/interface'

interface TacheFile {
  id: string
  statut: string
  device_id: string | null
}

export default function AppareilsPage() {
  const [appareils, setAppareils] = useState<Appareil[]>([])
  const [quota, setQuota] = useState(QUOTA_SMS_PAR_HEURE)
  const [fileParAppareil, setFileParAppareil] = useState<Record<string, number>>({})
  const [chargement, setChargement] = useState(true)
  const [actualisationEnCours, setActualisationEnCours] = useState(false)
  const [filtreHorsLigne, setFiltreHorsLigne] = useState(false)
  const [notification, setNotification] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)
  const [cibleSuppression, setCibleSuppression] = useState<Appareil | null>(null)
  const [suppressionEnCours, setSuppressionEnCours] = useState(false)

  function afficherNotification(type: 'succes' | 'erreur', texte: string) {
    setNotification({ type, texte })
    setTimeout(() => setNotification(null), 4000)
  }

  const chargerDonnees = async (silencieux = false) => {
    if (!silencieux) setActualisationEnCours(true)
    try {
      const [reponse, reponseParams, reponseTaches] = await Promise.all([
        fetch('/api/devices'),
        fetch('/api/settings'),
        fetch('/api/tasks'),
      ])
      const donnees = await reponse.json()
      if (donnees.devices) setAppareils(donnees.devices)
      if (reponseParams.ok) {
        const donneesParams = await reponseParams.json().catch(() => ({}))
        if (typeof donneesParams.settings?.sms_quota_per_hour === 'number') {
          setQuota(donneesParams.settings.sms_quota_per_hour)
        }
      }
      const donneesTaches = await reponseTaches.json().catch(() => ({}))
      if (Array.isArray(donneesTaches.tasks)) {
        const compte: Record<string, number> = {}
        for (const t of donneesTaches.tasks as TacheFile[]) {
          if (t.device_id && ['EN_ATTENTE', 'RECLAME', 'PROGRAMME'].includes(t.statut)) {
            compte[t.device_id] = (compte[t.device_id] ?? 0) + 1
          }
        }
        setFileParAppareil(compte)
      }
    } finally {
      setChargement(false)
      setActualisationEnCours(false)
    }
  }

  useEffect(() => {
    chargerDonnees(true)
    const interval = setInterval(() => chargerDonnees(true), 5000)
    return () => clearInterval(interval)
  }, [])

  async function supprimerAppareil() {
    if (!cibleSuppression) return
    setSuppressionEnCours(true)
    try {
      const reponse = await fetch(`/api/devices/${cibleSuppression.id}`, { method: 'DELETE' })
      if (reponse.ok) {
        afficherNotification('succes', `« ${cibleSuppression.nom} » supprimé`)
        setCibleSuppression(null)
        chargerDonnees(true)
      } else {
        afficherNotification('erreur', 'Suppression impossible')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    } finally {
      setSuppressionEnCours(false)
    }
  }

  if (chargement) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const totalAppareils = appareils.length
  const enLigneCount = appareils.filter((a) => a.statut === 'EN_LIGNE').length
  const horsLigneCount = totalAppareils - enLigneCount
  const appareilsVisibles = filtreHorsLigne ? appareils.filter((a) => a.statut !== 'EN_LIGNE') : appareils

  return (
    <CoquilleTableauDeBord>
      {/* En-tête de page */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Appareils</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Gérez les téléphones Android connectés à votre passerelle SMS.
          </p>
        </div>
        <Link
          href="/devices/add"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" /> Ajouter un téléphone
        </Link>
      </div>

      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* Card 1 */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{totalAppareils}</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">Appareils enregistrés</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <Smartphone className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{enLigneCount}</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">En ligne</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Wifi className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{horsLigneCount}</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">Hors ligne</p>
            </div>
            <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <WifiOff className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 dark:border-zinc-800/80 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Appareils connectés</h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500">{totalAppareils} téléphone enregistré</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => chargerDonnees()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${actualisationEnCours ? 'animate-spin' : ''}`} /> Actualiser
            </button>
            <button
              onClick={() => setFiltreHorsLigne((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-sm dark:text-zinc-300 ${
                filtreHorsLigne
                  ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-300'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-zinc-700 dark:hover:bg-zinc-800'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> {filtreHorsLigne ? 'Hors ligne ✓' : 'Filtres'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-left font-semibold uppercase tracking-wider text-slate-400 dark:border-zinc-800 dark:bg-zinc-800/30">
                <th className="px-6 py-3">APPAREIL</th>
                <th className="px-6 py-3">STATUT</th>
                <th className="px-6 py-3">PUSH</th>
                <th className="px-6 py-3">UTILISATION (SMS/H)</th>
                <th className="px-6 py-3">FILE</th>
                <th className="px-6 py-3">DERNIÈRE ACTIVITÉ</th>
                <th className="px-6 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {appareilsVisibles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 dark:bg-zinc-800">
                        <Smartphone className="h-6 w-6" />
                      </div>
                      <p className="mt-4 text-sm font-bold text-slate-900 dark:text-white">Aucun appareil enregistré</p>
                      <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500 max-w-xs">
                        Ajoutez un téléphone pour commencer à envoyer des SMS.
                      </p>
                      <Link href="/devices/add"
                        className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700">
                        <Plus className="h-3.5 w-3.5" /> Ajouter un téléphone
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                appareilsVisibles.map((a) => {
                  const utilises = a.sms_last_hour ?? 0
                  const pct = quota > 0 ? Math.min(100, Math.round((utilises / quota) * 100)) : 0
                  const couleurBarre = pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-amber-500' : 'bg-blue-600'
                  return (
                  <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                          <Smartphone className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-zinc-200">{a.nom}</p>
                          <p className="font-mono text-[11px] text-slate-400">{a.id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {a.statut === 'EN_LIGNE' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> En ligne
                        </span>
                      ) : a.statut === 'DESACTIVE' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-500 dark:bg-zinc-500/10 dark:text-zinc-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" /> Désactivé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Hors ligne
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {a.fcm_token ? (
                        <span title="Notifications push configurées" className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </span>
                      ) : (
                        <span title="Aucun jeton push — réveillez via scrutation uniquement" className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                          <Check className="h-3 w-3 stroke-[3] opacity-30" />
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3" title={`${utilises} SMS / ${quota} par heure`}>
                        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                          <div className={`h-full rounded-full ${couleurBarre}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-zinc-400">{utilises}/{quota} SMS/h</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700 dark:text-zinc-300">{fileParAppareil[a.id] ?? 0}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-zinc-400">
                      {a.derniere_activite ? new Date(a.derniere_activite).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => setCibleSuppression(a)} title="Supprimer" className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 text-xs text-slate-400 dark:border-zinc-800/80">
          <span>{totalAppareils} appareil{totalAppareils > 1 ? 's' : ''} sur {totalAppareils}</span>
          <span>Les appareils hors ligne ne peuvent pas envoyer de SMS.</span>
        </div>
      </div>

      <DialogueConfirmation
        ouvert={!!cibleSuppression}
        onFermer={() => setCibleSuppression(null)}
        onConfirmer={supprimerAppareil}
        chargement={suppressionEnCours}
        titre="Supprimer cet appareil ?"
        message={`« ${cibleSuppression?.nom ?? ''} » sera retiré.`}
        etiquetteConfirmer="Supprimer"
      />

      <Toast notification={notification} />
    </CoquilleTableauDeBord>
  )
}
