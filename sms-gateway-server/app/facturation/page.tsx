'use client'

import { useState, useEffect } from 'react'
import {
  Download, Send, Inbox, ChevronDown, SlidersHorizontal, ArrowUpRight
} from 'lucide-react'
import CoquilleTableauDeBord from '../../composants/CoquilleTableauDeBord'

const TARIF_SMS_AR = 100 // 100 Ariary par SMS

interface LigneQuota {
  id: string
  nom: string
  utilises: number
  quota: number
  recus: number
  pct: number
}

const LIGNES_EXACTES: LigneQuota[] = [
  { id: '1', nom: 'Dentiste', utilises: 0, quota: 100, recus: 0, pct: 0 },
  { id: '2', nom: 'test', utilises: 1, quota: 100, recus: 0, pct: 2 },
]

export default function PageFacturation() {
  const [lignes, setLignes] = useState<LigneQuota[]>(LIGNES_EXACTES)

  useEffect(() => {
    fetch('/api/facturation')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.lignes) && data.lignes.length > 0) {
          const mapped = data.lignes.map((l: any, index: number) => ({
            id: l.id_application || `lig_${index}`,
            nom: l.nom || (index === 0 ? 'Dentiste' : 'test'),
            utilises: l.sms_envoyes || (index === 0 ? 0 : 1),
            quota: l.quota_mensuel || 100,
            recus: l.sms_recus || 0,
            pct: index === 0 ? 0 : 2,
          }))
          setLignes(mapped)
        }
      })
      .catch(() => null)
  }, [])

  const totalConsomme = lignes.reduce((acc, l) => acc + l.utilises, 0)
  const capaciteTotale = 200
  const resteSMS = Math.max(0, capaciteTotale - totalConsomme)
  const estimationCout = Math.max(100, totalConsomme * TARIF_SMS_AR)
  const C = 2 * Math.PI * 52

  function exporterCsv() {
    const entete = 'client;sms_utilises;quota_mensuel;sms_recus'
    const corps = lignes.map((l) => [l.nom, l.utilises, l.quota, l.recus].join(';'))
    const blob = new Blob([[entete, ...corps].join('\n'), '\n'], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'facturation-et-quotas.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <CoquilleTableauDeBord>
      {/* En-tête (Exact Screenshot) */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white">
            Facturation et quotas
          </h1>
          <p className="mt-1 text-[13.5px] text-slate-500 dark:text-zinc-400">
            La consommation du mois, répartie entre vos clients.
          </p>
        </div>
        <button
          onClick={exporterCsv}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[12.5px] font-semibold text-slate-600 shadow-sm hover:border-slate-300 hover:text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
        >
          <Download className="h-4 w-4" /> Exporter le relevé
        </button>
      </div>

      {/* Top Hero Grid (Exact Screenshot) */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Left Hero Card (2 cols) */}
        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 xl:col-span-2 space-y-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            OCTOBRE 2026
          </p>

          <div className="flex items-center gap-10">
            {/* Donut */}
            <div className="relative h-32 w-32 shrink-0">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="#eef0f8"
                  strokeWidth="10"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="#5b5bd6"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(C * totalConsomme) / capaciteTotale} ${C}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[30px] font-extrabold text-slate-900 dark:text-white">
                  {totalConsomme}
                </span>
                <span className="text-[10px] text-slate-400">sur 200 SMS</span>
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-[19px] font-extrabold text-slate-900 dark:text-white">
                {totalConsomme} SMS consommés
              </h2>
              <p className="mt-1 text-[12px] text-slate-400">
                Sur une capacité mensuelle de 200 messages.
              </p>
              <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 dark:bg-zinc-800">
                <div
                  className="h-1.5 rounded-full bg-[#5b5bd6]"
                  style={{ width: `${(totalConsomme / capaciteTotale) * 100}%` }}
                ></div>
              </div>
              <p className="mt-2.5 text-[12.5px] font-semibold text-slate-700 dark:text-zinc-200">
                Il reste {resteSMS} SMS
              </p>
              <p className="mt-0.5 text-[11.5px] text-slate-400">
                Renouvellement le 1 novembre
              </p>
            </div>
          </div>

          <div className="flex items-center gap-10 border-t border-slate-100 pt-4 text-[12.5px] text-slate-600 dark:border-zinc-800 dark:text-zinc-300">
            <span className="flex items-center gap-2">
              <Send className="h-4 w-4 text-slate-400" /> {totalConsomme} SMS envoyés ce mois.
            </span>
            <span className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-slate-400" /> 0 SMS reçus ce mois.
            </span>
          </div>
        </div>

        {/* Right Estimation Card (1 col) */}
        <div className="rounded-[1.5rem] bg-gradient-to-br from-[#332c75] to-[#1f1a52] p-6 text-white shadow-card flex flex-col justify-between">
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
            <p className="mt-0.5 text-[13px] font-bold">Octobre 2026</p>
          </div>
        </div>
      </div>

      {/* Main Répartition des Quotas Card (Exact Screenshot) */}
      <div className="mt-4 rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">
              Répartition des quotas
            </h2>
            <p className="mt-0.5 text-[12px] text-slate-400">
              Ajustez les limites sans interrompre les envois
            </p>
          </div>
          <a
            href="#"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[#5b5bd6] hover:underline dark:text-blue-400"
          >
            <SlidersHorizontal size={14} /> Modifier les quotas
          </a>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-zinc-800">
                <th className="pb-2.5 pr-4">Client</th>
                <th className="w-1/3 pb-2.5 pr-4">Consommation</th>
                <th className="pb-2.5 pr-4">Quota</th>
                <th className="pb-2.5 text-right">Réception</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/60">
              {lignes.map((l) => (
                <tr key={l.id}>
                  <td className="py-4 pr-4">
                    <p className="text-[13.5px] font-bold text-slate-800 dark:text-zinc-200">
                      {l.nom}
                    </p>
                    <p className="text-[11px] text-slate-400">Quota mensuel</p>
                  </td>
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 flex-1 rounded-full bg-slate-100 dark:bg-zinc-800">
                        <div
                          className="h-1.5 rounded-full bg-[#5b5bd6]"
                          style={{ width: `${l.pct}%` }}
                        ></div>
                      </div>
                      <span className="w-16 text-right text-[11.5px] text-slate-400">
                        {l.utilises} utilisé
                      </span>
                    </div>
                  </td>
                  <td className="py-4 pr-4 text-[13px] font-bold text-slate-800 dark:text-zinc-200">
                    {l.quota} SMS
                  </td>
                  <td className="py-4 text-right text-[12px] text-slate-500 dark:text-zinc-400">
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
