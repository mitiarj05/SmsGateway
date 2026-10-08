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
  quota: number | null
  recus: number
  pct: number
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

export default function PageFacturation() {
  const [lignes, setLignes] = useState<LigneQuota[]>([])
  const [chargement, setChargement] = useState(true)
  const [editionQuotas, setEditionQuotas] = useState(false)
  const [quotasEdit, setQuotasEdit] = useState<Record<string, string>>({})
  const [sauvegardeQuota, setSauvegardeQuota] = useState(false)

  async function charger() {
    try {
      const r = await fetch(`/api/facturation?mois=${moisCourant()}`)
      const data = await r.json().catch(() => ({}))
      if (Array.isArray(data.lignes)) {
        setLignes(data.lignes.map((l: any) => ({
          id: l.id_application,
          nom: l.nom,
          utilises: l.sms_envoyes ?? 0,
          quota: l.quota_mensuel ?? null,
          recus: l.sms_recus ?? 0,
          pct: l.quota_mensuel ? Math.min(100, Math.round(((l.sms_envoyes ?? 0) / l.quota_mensuel) * 100)) : 0,
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
  const lignesAvecQuota = lignes.filter((l) => l.quota !== null) as (LigneQuota & { quota: number })[]
  const capaciteTotale = lignesAvecQuota.reduce((acc, l) => acc + l.quota, 0)
  const capaciteConnue = lignesAvecQuota.length > 0
  const resteSMS = capaciteConnue ? Math.max(0, capaciteTotale - totalConsomme) : null
  const estimationCout = totalConsomme * TARIF_SMS_AR
  const C = 2 * Math.PI * 52

  async function enregistrerQuotas() {
    setSauvegardeQuota(true)
    try {
      for (const [id, brut] of Object.entries(quotasEdit)) {
        const quota = Number(brut)
        if (!Number.isInteger(quota) || quota < 1) continue
        await fetch(`/api/api-clients/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quota_mensuel: quota }),
        })
      }
      setQuotasEdit({})
      setEditionQuotas(false)
      await charger()
    } finally {
      setSauvegardeQuota(false)
    }
  }

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
        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card survol-lift p-6 dark:bg-zinc-900 dark:border-zinc-800 xl:col-span-2 space-y-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            {libelleMois()}
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
                  stroke="#2563EB"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${capaciteConnue && capaciteTotale > 0 ? (C * Math.min(totalConsomme, capaciteTotale)) / capaciteTotale : 0} ${C}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[30px] font-extrabold text-slate-900 dark:text-white">
                  {chargement ? '…' : totalConsomme}
                </span>
                <span className="text-[10px] text-slate-400">
                  {capaciteConnue ? `sur ${capaciteTotale} SMS` : 'consommés'}
                </span>
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-[19px] font-extrabold text-slate-900 dark:text-white">
                {chargement ? '…' : `${totalConsomme} SMS consommés`}
              </h2>
              <p className="mt-1 text-[12px] text-slate-400">
                {capaciteConnue
                  ? `Sur une capacité mensuelle de ${capaciteTotale} messages.`
                  : 'Aucun quota mensuel défini.'}
              </p>
              <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 dark:bg-zinc-800">
                <div
                  className="h-1.5 rounded-full bg-[#2563EB]"
                  style={{ width: `${capaciteConnue && capaciteTotale > 0 ? Math.min(100, (totalConsomme / capaciteTotale) * 100) : 0}%` }}
                ></div>
              </div>
              <p className="mt-2.5 text-[12.5px] font-semibold text-slate-700 dark:text-zinc-200">
                {resteSMS === null ? 'Capacité illimitée' : `Il reste ${resteSMS} SMS`}
              </p>
              <p className="mt-0.5 text-[11.5px] text-slate-400">
                Renouvellement le {premierJourMoisSuivant()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-10 border-t border-slate-100 pt-4 text-[12.5px] text-slate-600 dark:border-zinc-800 dark:text-zinc-300">
            <span className="flex items-center gap-2">
              <Send className="h-4 w-4 text-slate-400" /> {totalConsomme} SMS envoyés ce mois.
            </span>
            <span className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-slate-400" /> {totalRecus} SMS reçus ce mois.
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
          <button
            onClick={() => {
              if (editionQuotas) {
                enregistrerQuotas()
              } else {
                setQuotasEdit(Object.fromEntries(lignes.filter((l) => l.quota !== null).map((l) => [l.id, String(l.quota)])))
                setEditionQuotas(true)
              }
            }}
            disabled={sauvegardeQuota}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[#2563EB] hover:underline disabled:opacity-50 dark:text-blue-400"
          >
            <SlidersHorizontal size={14} /> {editionQuotas ? (sauvegardeQuota ? 'Enregistrement…' : 'Enregistrer les quotas') : 'Modifier les quotas'}
          </button>
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
                          className="h-1.5 rounded-full bg-[#2563EB]"
                          style={{ width: `${l.pct}%` }}
                        ></div>
                      </div>
                      <span className="w-16 text-right text-[11.5px] text-slate-400">
                        {l.utilises} utilisé
                      </span>
                    </div>
                  </td>
                  <td className="py-4 pr-4 text-[13px] font-bold text-slate-800 dark:text-zinc-200">
                    {editionQuotas ? (
                      <input
                        type="number" min={1}
                        value={quotasEdit[l.id] ?? ''}
                        placeholder="Illimité"
                        onChange={(e) => setQuotasEdit((p) => ({ ...p, [l.id]: e.target.value }))}
                        className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                    ) : (
                      <>{l.quota === null ? 'Illimité' : `${l.quota} SMS`}</>
                    )}
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
