'use client'

import { useState, useEffect } from 'react'
import {
  Download, Send, Inbox, ArrowUpRight
} from 'lucide-react'
import CoquilleTableauDeBord from '../../composants/CoquilleTableauDeBord'

const TARIF_SMS_AR = 100 // 100 Ariary par SMS

interface LigneQuota {
  id: string
  nom: string
  utilises: number
  recus: number
}

function moisCourant(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function libelleMois(): string {
  return new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

function premierJourMoisSuivant(): string {
  const d = new Date()
  const suivant = new Date(d.getFullYear(), d.getMonth() + 1, 1)
  return suivant.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

/** Part du mois écoulée (0 à 1) : l'anneau du héros suit le calendrier. */
function progressionDuMois(): number {
  const d = new Date()
  const debut = new Date(d.getFullYear(), d.getMonth(), 1).getTime()
  const fin = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime()
  return Math.min(1, Math.max(0, (d.getTime() - debut) / (fin - debut)))
}

export default function PageFacturation() {
  const [lignes, setLignes] = useState<LigneQuota[]>([])
  const [chargement, setChargement] = useState(true)

  async function charger() {
    try {
      const r = await fetch(`/api/facturation?mois=${moisCourant()}`)
      const data = await r.json().catch(() => ({}))
      if (Array.isArray(data.lignes)) {
        setLignes(data.lignes.map((l: any) => ({
          id: l.id_application,
          nom: l.nom,
          utilises: l.sms_envoyes ?? 0,
          recus: l.sms_recus ?? 0,
        })))
      }
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    charger()
  }, [])

  const totalConsomme = lignes.reduce((acc, l) => acc + l.utilises, 0)
  const totalRecus = lignes.reduce((acc, l) => acc + l.recus, 0)
  const estimationCout = totalConsomme * TARIF_SMS_AR
  const C = 2 * Math.PI * 52
  const progressionMois = progressionDuMois()

  function exporterCsv() {
    const entete = 'client;sms_utilises;sms_recus'
    const corps = lignes.map((l) => [l.nom, l.utilises, l.recus].join(';'))
    const blob = new Blob([[entete, ...corps].join('\n'), '\n'], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'facturation.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <CoquilleTableauDeBord>
      {/* En-tête (Exact Screenshot) */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#1C1917] dark:text-white">
            Facturation
          </h1>
          <p className="mt-1 text-[13.5px] text-stone-600 dark:text-zinc-400">
            La consommation du mois, répartie entre vos clients.
          </p>
        </div>
        <button
          onClick={exporterCsv}
          className="inline-flex items-center gap-2 rounded-full border border-[#1C1917]/10 bg-white px-4 py-2 text-[12.5px] font-semibold text-stone-600 shadow-sm hover:border-slate-300 hover:text-[#1C1917] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
        >
          <Download className="h-4 w-4" /> Exporter le relevé
        </button>
      </div>

      {/* Top Hero Grid (Exact Screenshot) */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Left Hero Card (2 cols) */}
        <div className="rounded-[1.5rem] border border-[#1C1917]/10 bg-white shadow-card survol-lift p-6 dark:bg-zinc-900 dark:border-zinc-800 xl:col-span-2 space-y-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
            {libelleMois()}
          </p>

          <div className="flex items-center gap-10">
            {/* Anneau du mois : proportion d'avancement vers la fin du mois */}
            <div className="relative h-32 w-32 shrink-0">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle
                  cx="60" cy="60" r="52"
                  fill="none" stroke="#eef0f8" strokeWidth="10"
                />
                <circle
                  cx="60" cy="60" r="52"
                  fill="none" stroke="#2563EB" strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${C * progressionMois} ${C}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[30px] font-extrabold text-[#1C1917] dark:text-white">
                  {chargement ? '…' : `${Math.round(progressionMois * 100)} %`}
                </span>
                <span className="text-[10px] text-stone-500">du mois écoulé</span>
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-[19px] font-extrabold text-[#1C1917] dark:text-white">
                {chargement ? '…' : `${totalConsomme} SMS consommés`}
              </h2>
              <p className="mt-1 text-[12px] text-stone-500">
                Du total de vos clients, tous appareils confondus.
              </p>
              <p className="mt-2.5 text-[12.5px] font-semibold text-stone-700 dark:text-zinc-200">
                Forfait illimité — le seul vrai crédit est la SIM du téléphone.
              </p>
              <p className="mt-0.5 text-[11.5px] text-stone-500">
                Compteurs remis à zéro le {premierJourMoisSuivant()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-10 border-t border-[#1C1917]/10 pt-4 text-[12.5px] text-stone-600 dark:border-zinc-800 dark:text-zinc-300">
            <span className="flex items-center gap-2">
              <Send className="h-4 w-4 text-stone-500" /> {totalConsomme} SMS envoyés ce mois.
            </span>
            <span className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-stone-500" /> {totalRecus} SMS reçus ce mois.
            </span>
          </div>
        </div>

        {/* Right Estimation Card (1 col) */}
        <div className="rounded-[1.5rem] bg-gradient-to-br from-[#332c75] to-[#1f1a52] p-6 text-white shadow-card survol-lift flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/60">
              Estimation du mois
            </p>
            <Download className="h-4 w-4 text-white/50" />
          </div>
          <div>
            <p className="text-[42px] font-extrabold leading-none">
              {estimationCout.toLocaleString('fr-FR')} <span className="text-[16px] font-bold text-white/60">Ar</span>
            </p>
            <p className="mt-4 border-t border-white/10 pt-3 text-[11.5px] text-white/55">
              Coût moyen : {TARIF_SMS_AR} Ar / SMS
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-white/45">
              Période de consommation
            </p>
            <p className="mt-0.5 text-[13px] font-bold capitalize">{libelleMois()}</p>          </div>
        </div>
      </div>

      {/* Répartition par client */}
      <div className="mt-4 rounded-[1.5rem] border border-[#1C1917]/10 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-[#1C1917] dark:text-white">
              Par client
            </h2>
            <p className="mt-0.5 text-[12px] text-stone-500">
              La consommation du mois, client par client
            </p>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1C1917]/10 text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:border-zinc-800">
                <th className="pb-2.5 pr-4">Client</th>
                <th className="w-1/3 pb-2.5 pr-4">SMS ce mois</th>
                <th className="pb-2.5 text-right">Réception</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1917]/10 dark:divide-zinc-800/60">
              {lignes.map((l) => (
                <tr key={l.id}>
                  <td className="py-4 pr-4">
                    <p className="text-[13.5px] font-bold text-[#1C1917] dark:text-zinc-200">
                      {l.nom}
                    </p>
                  </td>
                  <td className="py-4 pr-4 text-[13px] font-bold text-[#1C1917] dark:text-zinc-200">
                    {l.utilises.toLocaleString('fr-FR')} SMS
                  </td>
                  <td className="py-4 text-right text-[12px] text-stone-600 dark:text-zinc-400">
                    {l.recus} reçu
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </CoquilleTableauDeBord>
  )
}
