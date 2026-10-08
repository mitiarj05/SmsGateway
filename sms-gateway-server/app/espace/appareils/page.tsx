'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Smartphone, RefreshCw, Loader2, QrCode, Zap, ArrowUpRight
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
      if (Array.isArray(data.appareils)) {
        setAppareils(data.appareils)
      }
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

  const totalAppareils = appareils.length
  const enLigneCount = appareils.filter((a) => a.statut === 'EN_LIGNE').length
  const horsLigneCount = totalAppareils - enLigneCount
  const debitTotal = appareils.reduce((s, a) => s + (a.sms_last_hour ?? 0), 0)

  function tempsEcouleFr(dateIso: string | null): string {
    if (!dateIso) return '—'
    const s = Math.floor((Date.now() - new Date(dateIso).getTime()) / 1000)
    if (s < 60) return "à l'instant"
    if (s < 3600) return `il y a ${Math.floor(s / 60)} min`
    if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`
    return new Date(dateIso).toLocaleDateString('fr-FR')
  }

  return (
    <CoquilleEspace>
      {/* En-tête (Exact Screenshot 8) */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white">Parc d'envoi</h1>
          <p className="mt-1 text-[13.5px] text-slate-500 dark:text-zinc-400">
            Les téléphones qui expédient vos SMS, avec leur état en temps réel.
          </p>
        </div>
        <button
          onClick={() => setModalAjoutOuverte(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-indigo-300/45 hover:bg-[#1D4ED8] transition"
        >
          <Smartphone className="h-4 w-4" /> Associer un téléphone
        </button>
      </div>

      {/* Hero Card Informative (#1F1A52 - Exact Screenshot 8) */}
      <div className="rounded-[1.5rem] bg-gradient-to-br from-[#332c75] to-[#1f1a52] p-6 text-white shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Votre parc d'envoi mutualisé</h2>
              <p className="text-xs text-white/60">
                Vos SMS partent depuis ces téléphones, répartis automatiquement.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> {enLigneCount} relais connecté
          </span>
        </div>
      </div>

      {/* 3 Metric Cards (Exact Screenshot 8) */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card px-6 py-5 dark:bg-zinc-900 dark:border-zinc-800 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">TÉLÉPHONES ASSOCIÉS</p>
          <p className="text-[30px] font-extrabold leading-none text-slate-900 dark:text-white">{totalAppareils}</p>
          <p className="text-[11px] text-slate-400">{enLigneCount} en ligne · {horsLigneCount} hors ligne</p>
        </div>

        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card px-6 py-5 dark:bg-zinc-900 dark:border-zinc-800 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">CAPACITÉ TOTALE</p>
          <p className="text-[30px] font-extrabold leading-none text-slate-900 dark:text-white">{totalAppareils} <span className="text-sm font-bold text-slate-400">appareil{totalAppareils > 1 ? 's' : ''}</span></p>
          <p className="text-[11px] text-slate-400">Dans votre parc visible</p>
        </div>

        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card px-6 py-5 dark:bg-zinc-900 dark:border-zinc-800 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">DÉBIT ACTUEL</p>
          <p className="text-[30px] font-extrabold leading-none text-emerald-600 dark:text-emerald-400">{debitTotal}</p>
          <p className="text-[11px] text-slate-400">SMS/h sur le parc</p>
        </div>
      </div>

      {/* Main Grid 2 Cols (Exact Screenshot 8) */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">

        {/* Left Column (2 cols) : Téléphones du parc */}
        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-zinc-800">
            <div>
              <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">Téléphones du parc</h2>
              <p className="text-[12px] text-slate-400">{totalAppareils} appareil visible</p>
            </div>
            <button
              onClick={() => chargerDonnees(false)}
              disabled={actualisation}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[12px] font-semibold text-slate-600 shadow-2xs hover:border-slate-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${actualisation ? 'animate-spin' : ''}`} /> Actualiser
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:border-zinc-800">
                  <th className="pb-3 pr-4">TÉLÉPHONE</th>
                  <th className="pb-3 pr-4">STATUT</th>
                  <th className="pb-3 pr-4">DÉBIT (SMS/H)</th>
                  <th className="pb-3 pr-4">DERNIÈRE ACTIVITÉ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {appareils.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-xs text-slate-400 dark:text-zinc-500">
                      Aucun téléphone pour le moment.
                    </td>
                  </tr>
                )}
                {appareils.map((a) => {
                  const enLigne = a.statut === 'EN_LIGNE'
                  return (
                  <tr key={a.id} className="text-slate-800 dark:text-zinc-200">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                          <Smartphone className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold">{a.nom}</p>
                          <p className="font-mono text-[10px] text-slate-400">{a.id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${enLigne ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${enLigne ? 'bg-emerald-500' : 'bg-red-500'}`} /> {enLigne ? 'En ligne' : 'Hors ligne'}
                      </span>
                    </td>
                    <td className="py-4 pr-4 font-semibold">{a.sms_last_hour ?? 0} SMS/h</td>
                    <td className="py-4 pr-4 text-slate-400">{tempsEcouleFr(a.derniere_activite)}</td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center space-y-2 dark:border-zinc-800 dark:bg-zinc-800/30">
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Ajoutez un second téléphone pour doubler votre débit et assurer la reprise sur incident.
            </p>
            <button onClick={() => setModalAjoutOuverte(true)} className="inline-flex items-center gap-1 text-xs font-bold text-[#2563EB] hover:underline dark:text-blue-400">
              + Ajouter un téléphone
            </button>
          </div>
        </div>

        {/* Right Column (2 Cards) */}
        <div className="space-y-4">
          {/* Comment associer un appareil */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Comment associer un appareil ?</h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600 dark:bg-blue-500/20 dark:text-indigo-300">1</span>
                <div>
                  <p className="font-bold text-slate-800 dark:text-zinc-200">Installez l'app SMSTSIKA</p>
                  <p className="text-[11px] text-slate-400">Disponible sur Android (APK / Play Store)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600 dark:bg-blue-500/20 dark:text-indigo-300">2</span>
                <div>
                  <p className="font-bold text-slate-800 dark:text-zinc-200">Scannez le QR de liaison</p>
                  <p className="text-[11px] text-slate-400">Généré automatiquement, valable 10 min</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600 dark:bg-blue-500/20 dark:text-indigo-300">3</span>
                <div>
                  <p className="font-bold text-slate-800 dark:text-zinc-200">Le relais est en ligne</p>
                  <p className="text-[11px] text-slate-400">Vos SMS passent par la carte SIM de l'appareil</p>
                </div>
              </div>
            </div>
          </div>

          {/* QR de liaison Widget Card */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 text-center space-y-3">
            <p className="text-xs font-bold text-slate-900 dark:text-white">QR de liaison</p>
            <div className="flex justify-center p-4">
              <QrCode className="h-24 w-24 text-slate-800 dark:text-white" />
            </div>
            <p className="text-[11px] text-slate-400">Expire dans 09:42</p>
            <button onClick={() => setModalAjoutOuverte(true)} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-200 w-full justify-center">
              <RefreshCw className="h-3.5 w-3.5" /> Régénérer
            </button>
          </div>
        </div>

      </div>

      <ModalAjouterAppareil
        ouvert={modalAjoutOuverte}
        onFermer={() => setModalAjoutOuverte(false)}
      />
    </CoquilleEspace>
  )
}
