'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Smartphone, RefreshCw, Loader2, QrCode, Zap
} from 'lucide-react'
import CoquilleEspace from '../../../composants/CoquilleEspace'
import ModalAjouterAppareil from '../../../composants/ModalAjouterAppareil'

interface AppareilParc {
  id: string
  nom: string
  statut: string
  sms_last_hour: number
  derniere_activite: string | null
}

function tempsEcouleFr(dateIso: string | null): string {
  if (!dateIso) return '—'
  const s = Math.floor((Date.now() - new Date(dateIso).getTime()) / 1000)
  if (s < 60) return "à l'instant"
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`
  return new Date(dateIso).toLocaleDateString('fr-FR')
}

export default function PageAppareilsClient() {
  const [appareils, setAppareils] = useState<AppareilParc[]>([])
  const [chargement, setChargement] = useState(true)
  const [actualisation, setActualisation] = useState(false)
  const [modalAjoutOuverte, setModalAjoutOuverte] = useState(false)

  const chargerDonnees = useCallback(async (silencieux = false) => {
    if (!silencieux) setActualisation(true)
    try {
      const res = await fetch('/api/espace/appareils')
      const data = await res.json().catch(() => ({}))
      if (Array.isArray(data.appareils)) setAppareils(data.appareils)
    } finally {
      setChargement(false)
      setActualisation(false)
    }
  }, [])

  useEffect(() => {
    chargerDonnees(true)
    const i = setInterval(() => chargerDonnees(true), 10000)
    return () => clearInterval(i)
  }, [chargerDonnees])

  if (chargement) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const appareilsActifs = appareils.filter((a) => a.statut === 'EN_LIGNE').length

  return (
    <CoquilleEspace>
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Parc d'envoi</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Les téléphones qui expédient vos SMS, avec leur état en temps réel.
          </p>
        </div>
        <button
          onClick={() => setModalAjoutOuverte(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          <QrCode className="h-4 w-4" /> Associer un téléphone (QR Code)
        </button>
      </div>

      {/* Hero Card Informative */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-6 text-white shadow-md border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Votre parc d'envoi mutualisé</h2>
              <p className="text-xs text-slate-400">
                Vos SMS partent depuis ces téléphones, répartis automatiquement.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> {appareilsActifs} relais connecté{appareilsActifs > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-zinc-800/80">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Téléphones du parc</h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500">{appareils.length} appareil{appareils.length > 1 ? 's' : ''} visible{appareils.length > 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => chargerDonnees(false)}
            disabled={actualisation}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${actualisation ? 'animate-spin' : ''}`} /> Actualiser
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-left font-semibold uppercase tracking-wider text-slate-400 dark:border-zinc-800 dark:bg-zinc-800/30">
                <th className="px-6 py-3">TÉLÉPHONE</th>
                <th className="px-6 py-3">STATUT</th>
                <th className="px-6 py-3">DÉBIT (SMS/H)</th>
                <th className="px-6 py-3">ACTIVITÉ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {appareils.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-xs text-slate-400 dark:text-zinc-500">
                    Aucun téléphone pour le moment.
                  </td>
                </tr>
              )}
              {appareils.map((a) => {
                const enLigne = a.statut === 'EN_LIGNE'
                return (
                <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                        <Smartphone className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{a.nom}</p>
                        <p className="font-mono text-[11px] text-slate-400">{a.id.substring(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${enLigne ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${enLigne ? 'bg-emerald-500' : 'bg-red-500'}`} /> {enLigne ? 'En ligne' : 'Hors ligne'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-600 dark:text-zinc-300">
                    {a.sms_last_hour ?? 0} SMS/h
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-600 dark:text-zinc-300">
                    {tempsEcouleFr(a.derniere_activite)}
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ModalAjouterAppareil
        ouvert={modalAjoutOuverte}
        onFermer={() => setModalAjoutOuverte(false)}
      />
    </CoquilleEspace>
  )
}
