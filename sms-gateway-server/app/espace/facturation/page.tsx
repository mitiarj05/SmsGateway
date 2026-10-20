'use client'

import { useState, useEffect } from 'react'
import { Receipt, Calendar, ShieldCheck, ArrowUpRight } from 'lucide-react'
import CoquilleEspace from '../../../composants/CoquilleEspace'

interface ConsoMensuelle {
  mois: string
  total_facture: number
  sms_envoyes: number
  sms_recus: number
  echecs: number
  quota_mensuel: number | null
}

function moisCourantId(): string {
  const maintenant = new Date()
  return `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}`
}

function libelleMois(id: string): string {
  const [annee, mois] = id.split('-').map(Number)
  const date = new Date(annee, mois - 1, 1)
  const brut = date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })
  return brut.charAt(0).toUpperCase() + brut.slice(1)
}

export default function PageFacturationEspace() {
  const [conso, setConso] = useState<ConsoMensuelle | null>(null)
  const [compteursJours, setCompteursJours] = useState<Record<string, number>>({})
  const [mois, setMois] = useState(moisCourantId())
  const [detailOuvert, setDetailOuvert] = useState(false)

  const idMois = mois
  const nomMois = libelleMois(idMois)

  useEffect(() => {
    fetch(`/api/espace/facturation?mois=${idMois}`)
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.total_facture === 'number') {
          setConso({
            mois: typeof d.mois === 'string' ? d.mois : idMois,
            total_facture: d.total_facture ?? 0,
            sms_envoyes: d.sms_envoyes ?? 0,
            sms_recus: d.sms_recus ?? 0,
            echecs: d.echecs ?? 0,
            quota_mensuel: typeof d.quota_mensuel === 'number' ? d.quota_mensuel : null,
          })
        } else {
          setConso(null)
        }
      })
      .catch(() => null)
    fetch('/api/espace/envois?limit=1000')
      .then((r) => r.json())
      .then((d) => {
        if (!Array.isArray(d.taches)) return
        const compteurs: Record<string, number> = {}
        for (const t of d.taches as { date_creation?: string }[]) {
          if (typeof t.date_creation === 'string' && t.date_creation.length >= 10) {
            const cle = t.date_creation.slice(0, 10)
            compteurs[cle] = (compteurs[cle] ?? 0) + 1
          }
        }
        setCompteursJours(compteurs)
      })
      .catch(() => null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idMois])

  const total = conso?.total_facture ?? 0
  const envoyes = conso?.sms_envoyes ?? 0
  const recus = conso?.sms_recus ?? 0
  const echecs = conso?.echecs ?? 0
  const quota = conso?.quota_mensuel ?? null
  const pctQuota = quota && quota > 0 ? Math.min(100, Math.round((total / quota) * 100)) : 0
  const [anneeVue, moisVue] = idMois.split('-').map(Number)
  const nbJoursMois = new Date(anneeVue, moisVue, 0).getDate()
  const estMoisCourant = idMois === moisCourantId()
  const maintenantJour = new Date().getDate()
  const finPeriode = new Date(anneeVue, moisVue - 1, estMoisCourant ? maintenantJour : nbJoursMois)
  // La semaine affichée : les 7 derniers jours (lundi d'avant → aujourd'hui).
  const clesVisibles = Array.from({ length: 7 }, (_, k) => {
    const d = new Date(finPeriode)
    d.setDate(finPeriode.getDate() - (6 - k))
    const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return {
      cle,
      numero: d.getDate(),
      libelle: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      jour: d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''),
    }
  })
  const valeurs = clesVisibles.map((j) => compteursJours[j.cle] ?? 0)
  const maxQuotidien = Math.max(1, ...valeurs)
  const estimation = (total * 100).toLocaleString('fr-FR')
  const projectionJour = new Date().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit' })

  return (
    <CoquilleEspace>
      {/* En-tête (Exact Screenshot) */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#1C1917] dark:text-white">Facturation</h1>
          <p className="mt-1 text-[13.5px] text-stone-600 dark:text-zinc-400">
            Consultez le relevé détaillé de votre consommation mensuelle.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">PÉRIODE</span>
          <input
            type="month"
            value={mois}
            max={moisCourantId()}
            onChange={(e) => { if (e.target.value) setMois(e.target.value) }}
            className="rounded-xl border border-[#1C1917]/10 bg-white px-3 py-2 text-[13px] font-semibold text-stone-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          />
        </div>
      </div>

      {/* 4 Stat Cards Row (Exact Screenshot) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.5rem] border border-[#1C1917]/10 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">SMS ENVOYÉS</p>
          <p className="text-[30px] font-extrabold leading-none text-[#1C1917] dark:text-white">{envoyes}</p>
          <p className="text-[11.5px] text-stone-500">Ce mois-ci</p>
        </div>

        <div className="rounded-[1.5rem] border border-[#1C1917]/10 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">SMS REÇUS</p>
          <p className="text-[30px] font-extrabold leading-none text-[#1C1917] dark:text-white">{recus}</p>
          <p className="text-[11.5px] text-stone-500">Transmis au webhook</p>
        </div>

        <div className="rounded-[1.5rem] border border-[#1C1917]/10 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">ÉCHECS</p>
          <p className="text-[30px] font-extrabold leading-none text-rose-600 dark:text-rose-400">{echecs}</p>
          <p className="text-[11.5px] text-stone-500">Non facturés</p>
        </div>
      </div>

      {/* Main Grid 2 Cols (Exact Screenshot) */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">

        {/* Left Column (2 cols) */}
        <div className="xl:col-span-2 space-y-4">

          {/* Card 1 : Relevé du mois courant réel */}
          <div className="rounded-[1.5rem] border border-[#1C1917]/10 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-indigo-400">
                  <Receipt className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1C1917] dark:text-white">Relevé de {idMois}</h2>
                  <p className="text-xs text-stone-500">{total} unité(s) consommée(s)</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#1C1917] dark:text-zinc-200">Quota de votre compte</span>
                <span className="font-bold text-[#1C1917] dark:text-zinc-200">{total} / {quota ?? '∞'} SMS</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#1C1917]/[0.04] dark:bg-zinc-800">
                <div className="h-full rounded-full" style={{ width: `${pctQuota}%` }} />
              </div>
            </div>

            <div className="pt-2 border-t border-[#1C1917]/10 dark:border-zinc-800">
              <p className="text-[11.5px] text-stone-500">
                1 unité correspond à 1 SMS créé dans le mois. Votre crédit : la carte SIM de vos téléphones.
              </p>
            </div>
          </div>

          {/* Card 2 : Consommation ponctuelle — la semaine, en bâtonnets */}
          <div className="rounded-[1.5rem] border border-[#1C1917]/10 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-[#1C1917] dark:text-white">Consommation de la semaine</h2>
              <p className="mt-0.5 text-[11px] text-stone-500">
                du {clesVisibles[0].libelle} au {clesVisibles[6].libelle} — le jour est écrit dans la barre
              </p>
            </div>

            <div className="flex items-stretch gap-2 sm:gap-3">
              {valeurs.map((nombre, i) => {
                const pct = Math.min(100, Math.round((nombre / maxQuotidien) * 100))
                return (
                  <div key={clesVisibles[i].cle} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                    <span className="h-4 text-[11px] font-bold text-[#1C1917] dark:text-zinc-200">
                      {nombre > 0 ? nombre : ''}
                    </span>
                    <div className="relative h-44 w-full max-w-9 overflow-hidden rounded-full bg-[#1C1917]/[0.05] dark:bg-zinc-800">
                      <div
                        title={`${nombre} SMS le ${clesVisibles[i].libelle}`}
                        className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1D4ED8] to-[#60A5FA] transition-all"
                        style={{ height: `${pct}%` }}
                      />
                      <span
                        className={`absolute bottom-2 inset-x-0 z-10 flex justify-center text-[10px] font-bold tracking-wide [writing-mode:vertical-rl] rotate-180 ${
                          pct >= 18 ? 'text-white/90' : 'text-stone-500 dark:text-zinc-400'
                        }`}
                      >
                        {clesVisibles[i].jour}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Card 3 : Historique des relevés (mois courant réel uniquement) */}
          <div className="rounded-[1.5rem] border border-[#1C1917]/10 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
            <h2 className="text-sm font-bold text-[#1C1917] dark:text-white">Historique des relevés</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1C1917]/10 text-[11px] font-semibold uppercase tracking-wide text-stone-500 dark:border-zinc-800">
                    <th className="pb-3 pr-4">MOIS</th>
                    <th className="pb-3 pr-4">ENVOYÉS</th>
                    <th className="pb-3 pr-4">REÇUS</th>
                    <th className="pb-3 pr-4">COÛT ESTIMÉ</th>
                    <th className="pb-3 pr-4">STATUT</th>
                    <th className="pb-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C1917]/10 dark:divide-zinc-800">
                  <tr className="text-stone-700 dark:text-zinc-300">
                    <td className="py-3.5 pr-4 font-bold text-[#1C1917] dark:text-white">{nomMois}</td>
                    <td className="py-3.5 pr-4 font-mono">{envoyes.toLocaleString('fr-FR')}</td>
                    <td className="py-3.5 pr-4 font-mono">{recus}</td>
                    <td className="py-3.5 pr-4 font-semibold">— en cours</td>
                    <td className="py-3.5 pr-4">
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10.5px] font-bold text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">En cours</span>
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => setDetailOuvert((v) => !v)}
                        className="rounded-full border border-[#1C1917]/10 px-3.5 py-1 text-[11px] font-semibold text-stone-600 hover:bg-stone-100 dark:border-zinc-700 dark:text-zinc-300"
                      >
                        {detailOuvert ? 'Masquer' : 'Détails'}
                      </button>
                    </td>
                  </tr>
                  {detailOuvert && (
                    <tr className="bg-stone-100 dark:bg-zinc-800/40">
                      <td colSpan={6} className="px-4 py-3 text-[11px] text-stone-600 dark:text-zinc-400">
                        Échecs : <b>{conso?.echecs ?? 0}</b> ·
                        Unités facturées : <b>{conso?.total_facture ?? 0}</b>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column (3 Cards) */}
        <div className="space-y-4">

          {/* Top Card : Estimation du mois (calculée depuis la vraie conso) */}
          <div className="rounded-[1.5rem] bg-gradient-to-br from-[#332c75] to-[#1f1a52] p-6 text-white shadow-card space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/60">ESTIMATION DU MOIS</p>
            <div>
              <p className="text-[40px] font-extrabold leading-none">
                {estimation} <span className="text-[16px] font-bold text-white/60">Ar</span>
              </p>
              <p className="mt-4 border-t border-white/10 pt-3 text-[11.5px] text-white/55">
                Coût moyen : 100 Ar / SMS · projection au {projectionJour}
              </p>
            </div>
          </div>

          {/* Bottom Green Tip Box */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300 flex items-start gap-3">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {quota && quota > 0 ? (
                <><b>Quota sous contrôle.</b> Vous avez consommé {pctQuota} % de votre forfait mensuel.</>
              ) : (
                <><b>Consommation du mois.</b> Votre consommation du mois en un coup d'œil.</>
              )}
            </p>
          </div>

        </div>

      </div>
    </CoquilleEspace>
  )
}
