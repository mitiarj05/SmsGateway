'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Download, Send, Inbox, Key, Euro, Receipt, ChevronDown,
} from 'lucide-react'
import CoquilleTableauDeBord from '../../composants/CoquilleTableauDeBord'

const TARIF_SMS = 0.08

interface Ligne {
  id_application: string
  nom: string
  mois: string
  total_facture: number
  sms_envoyes: number
  sms_recus: number
  clics: number
  echecs: number
  quota_mensuel: number | null
  depassement: boolean
}

interface Totaux {
  total_facture: number
  sms_envoyes: number
  sms_recus: number
  clics: number
  echecs: number
}

/** 6 derniers mois au format AAAA-MM (plus récent d'abord). */
function derniersMois(): string[] {
  const liste: string[] = []
  const d = new Date()
  for (let i = 0; i < 6; i++) {
    liste.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    d.setMonth(d.getMonth() - 1)
  }
  return liste
}

function libelleMois(mois: string): string {
  const [a, m] = mois.split('-').map(Number)
  return new Date(a, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

export default function PageFacturation() {
  const options = derniersMois()
  const [periode, setPeriode] = useState(options[0])
  const [lignes, setLignes] = useState<Ligne[]>([])
  const [totaux, setTotaux] = useState<Totaux>({ total_facture: 0, sms_envoyes: 0, sms_recus: 0, clics: 0, echecs: 0 })
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)

  const charger = useCallback(async (mois: string) => {
    setChargement(true)
    try {
      const res = await fetch(`/api/facturation?mois=${mois}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErreur(data.error ?? 'Chargement impossible.')
        setLignes([])
        return
      }
      setLignes(Array.isArray(data.lignes) ? data.lignes : [])
      setTotaux(data.totaux ?? { total_facture: 0, sms_envoyes: 0, sms_recus: 0, clics: 0, echecs: 0 })
      setErreur(null)
    } catch {
      setErreur('Chargement impossible. Réessayez.')
      setLignes([])
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    charger(periode)
  }, [periode, charger])

  function exporterCsv() {
    const entete = 'client;facture_eur;envoyes;recus;clics;echecs;quota;depassement'
    const corps = lignes.map((l) =>
      [l.nom, (l.total_facture * TARIF_SMS).toFixed(2), l.sms_envoyes, l.sms_recus, l.clics, l.echecs, l.quota_mensuel ?? '', l.depassement ? 'oui' : 'non'].join(';')
    )
    const blob = new Blob([[entete, ...corps].join('\n'), '\n'], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `facturation-${periode}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const montantTotal = (totaux.total_facture * TARIF_SMS).toFixed(2).replace('.', ',')

  return (
    <CoquilleTableauDeBord>
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Facturation</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Analysez la consommation SMS et la facturation par client.
          </p>
        </div>
        <button
          onClick={exporterCsv}
          disabled={lignes.length === 0}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
        >
          <Download className="h-4 w-4" /> Exporter la période
        </button>
      </div>

      {erreur && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {erreur}
        </div>
      )}

      {/* Titre section & Select période */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Facturation par client</h2>
          <p className="text-xs text-slate-400 dark:text-zinc-500">Données consolidées pour la période sélectionnée</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Période</span>
          <div className="relative">
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-semibold text-slate-700 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              {options.map((m) => (
                <option key={m} value={m}>{libelleMois(m)}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1 */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Facturé</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{chargement ? '…' : `${montantTotal} €`}</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">Total de la période</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <Euro className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Envoyés</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{chargement ? '…' : totaux.sms_envoyes}</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">SMS sortants</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Send className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Reçus</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{chargement ? '…' : totaux.sms_recus}</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">SMS entrants</p>
            </div>
            <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
              <Inbox className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Clients suivis</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{chargement ? '…' : lignes.length}</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">Clients facturables</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <Key className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-zinc-800/80">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Détail par client</h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500">Tarification appliquée à l'usage réel</p>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            {TARIF_SMS.toFixed(2).replace('.', ',')} € / SMS envoyé
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-left font-semibold uppercase tracking-wider text-slate-400 dark:border-zinc-800 dark:bg-zinc-800/30">
                <th className="px-6 py-3">CLIENT</th>
                <th className="px-6 py-3">FACTURÉ</th>
                <th className="px-6 py-3">ENVOYÉS</th>
                <th className="px-6 py-3">REÇUS</th>
                <th className="px-6 py-3">QUOTA</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) => (
                <tr key={l.id_application} className="border-b border-slate-50 last:border-0 dark:border-zinc-800/50">
                  <td className="px-6 py-3 font-semibold text-slate-800 dark:text-zinc-100">
                    {l.nom}
                    {l.depassement && (
                      <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-500/15 dark:text-red-300">
                        Quota dépassé
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 font-bold text-slate-800 dark:text-zinc-100">
                    {(l.total_facture * TARIF_SMS).toFixed(2).replace('.', ',')} €
                  </td>
                  <td className="px-6 py-3 text-slate-600 dark:text-zinc-300">{l.sms_envoyes}</td>
                  <td className="px-6 py-3 text-slate-600 dark:text-zinc-300">{l.sms_recus}</td>
                  <td className="px-6 py-3 text-slate-600 dark:text-zinc-300">
                    {l.quota_mensuel ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!chargement && lignes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 dark:bg-zinc-800">
              <Receipt className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-bold text-slate-900 dark:text-white">Aucune donnée de facturation</p>
            <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500 max-w-sm">
              L'utilisation facturable apparaîtra ici dès qu'un client aura envoyé ou reçu des SMS sur la période.
            </p>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 dark:text-zinc-500 pt-2">
        L'utilisation est calculée en temps réel. Les montants définitifs sont arrêtés en fin de mois.
      </p>
    </CoquilleTableauDeBord>
  )
}
