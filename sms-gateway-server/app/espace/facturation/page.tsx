'use client'

import { useState, useEffect } from 'react'
import { Calendar, ShieldCheck, ArrowUpRight } from 'lucide-react'
import CoquilleEspace from '../../../composants/CoquilleEspace'
import GraphiqueConsommationQuotidienne, { ItemConsommation } from '../../../composants/GraphiqueConsommationQuotidienne'

interface ConsoMensuelle {
  mois: string
  total_facture: number
  sms_envoye: number
  sms_recu: number
  echec: number
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
            sms_envoye: d.sms_envoye ?? 0,
            sms_recu: d.sms_recu ?? 0,
            echec: d.echec ?? 0,
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
  const envoyes = conso?.sms_envoye ?? 0
  const recus = conso?.sms_recu ?? 0
  const echecs = conso?.echec ?? 0
  const [anneeVue, moisVue] = idMois.split('-').map(Number)
  const nbJoursMois = new Date(anneeVue, moisVue, 0).getDate()
  const estMoisCourant = idMois === moisCourantId()
  const maintenantJour = new Date().getDate()
  const finPeriode = new Date(anneeVue, moisVue - 1, estMoisCourant ? maintenantJour : nbJoursMois)

  // La semaine affichée : les 7 derniers jours avec les vraies données de consommation de la BDD
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

  const donneesGraphique: ItemConsommation[] = clesVisibles.map((j) => ({
    cle: j.cle,
    libelle: j.libelle,
    valeur: compteursJours[j.cle] ?? 0,
  }))

  const estimation = (total * 100).toLocaleString('fr-FR')
  const projectionJour = new Date().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit' })

  return (
    <CoquilleEspace>
      {/* En-tête */}
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

      {/* 4 Stat Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[#1C1917]/10 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">SMS ENVOYÉS</p>
          <p className="text-[30px] font-extrabold leading-none text-[#1C1917] dark:text-white">{envoyes}</p>
          <p className="text-[11.5px] text-stone-500">Ce mois-ci</p>
        </div>

        <div className="rounded-2xl border border-[#1C1917]/10 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">SMS REÇUS</p>
          <p className="text-[30px] font-extrabold leading-none text-[#1C1917] dark:text-white">{recus}</p>
          <p className="text-[11.5px] text-stone-500">Transmis au site</p>
        </div>

        <div className="rounded-2xl border border-[#1C1917]/10 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">ÉCHECS</p>
          <p className="text-[30px] font-extrabold leading-none text-rose-600 dark:text-rose-400">{echecs}</p>
          <p className="text-[11.5px] text-stone-500">Non facturés</p>
        </div>

        <div className="rounded-2xl border border-[#1C1917]/10 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">UNITÉS FACTURÉES</p>
          <p className="text-[30px] font-extrabold leading-none text-[#1C1917] dark:text-white">{total}</p>
          <p className="text-[11.5px] text-stone-500">1 unité = 1 SMS créé ce mois</p>
        </div>
      </div>

      {/* Main Grid 2 Cols */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">

        {/* Left Column (2 cols) */}
        <div className="xl:col-span-2 space-y-4">

          {/* Graphique de Consommation Quotidienne (Bâtons bleus identiques à l'image exemple) */}
          <GraphiqueConsommationQuotidienne
            titre="Consommation quotidienne"
            sousTitre={`du ${clesVisibles[0].libelle} au ${clesVisibles[6].libelle}`}
            nomVariable="SMS envoyés"
            donnees={donneesGraphique}
          />

          {/* Card 3 : Historique des relevés (mois courant réel uniquement) */}
          <div className="rounded-2xl border border-[#1C1917]/10 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
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
                        Échecs : <b>{conso?.echec ?? 0}</b> ·
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
          <div className="rounded-2xl bg-gradient-to-br from-[#332c75] to-[#1f1a52] p-6 text-white shadow-card space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/60">ESTIMATION DU MOIS</p>
            <div>
              <p className="text-[40px] font-extrabold leading-none">
                {estimation} <span className="text-[16px] font-bold text-white/60">Ar</span>
              </p>
              <p className="mt-4 border-t border-white/10 pt-3 text-[11.5px] text-white/60">
                Coût moyen : 100 Ar / SMS · projection au {projectionJour}
              </p>
            </div>
            <div className="border-t border-white/10 pt-3">
              <p className="text-[10px] uppercase tracking-wide text-white/45">
                Relevé de {nomMois}
              </p>
              <p className="mt-0.5 text-[13px] font-bold">
                {total} unité{total > 1 ? 's' : ''} consommée{total > 1 ? 's' : ''}
              </p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-white/60">
                Forfait illimité : 1 unité = 1 SMS créé dans le mois. Votre seul crédit est la carte SIM de vos téléphones.
              </p>
            </div>
          </div>

          {/* Card Le mois en un coup d'œil (données journalières réelles) */}
          <div className="rounded-2xl border border-[#1C1917]/10 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-3">
            <p className="text-xs font-bold text-[#1C1917] dark:text-white">Le mois en un coup d'œil</p>
            {(() => {
              const entrees = Object.entries(compteursJours)
              const joursEcoules = estMoisCourant ? maintenantJour : nbJoursMois
              if (entrees.length === 0) {
                return (
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                    Aucune activité enregistrée sur ce mois pour le moment.
                  </p>
                )
              }
              const totalMois = entrees.reduce((s, [, v]) => s + v, 0)
              const meilleure = entrees.reduce((m, [cle, v]) => (v > m.valeur ? { cle, valeur: v } : m), { cle: '', valeur: 0 })
              const meilleureLibelle = meilleure.cle
                ? new Date(`${meilleure.cle}T12:00:00`).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
                : '—'
              const moyenne = joursEcoules > 0 ? totalMois / joursEcoules : 0
              return (
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-stone-600 dark:text-zinc-400">Meilleure journée</span>
                    <span className="shrink-0 font-bold text-[#1C1917] dark:text-zinc-200">
                      {meilleure.valeur.toLocaleString('fr-FR')} msg · {meilleureLibelle}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-stone-600 dark:text-zinc-400">Moyenne par jour écoulé</span>
                    <span className="shrink-0 font-bold text-[#1C1917] dark:text-zinc-200">
                      {moyenne.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} msg
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-stone-600 dark:text-zinc-400">Jours avec activité</span>
                    <span className="shrink-0 font-bold text-[#1C1917] dark:text-zinc-200">
                      {entrees.length} / {joursEcoules}
                    </span>
                  </div>
                  <p className="pt-1 text-[11px] text-stone-500 dark:text-zinc-400">
                    {estMoisCourant
                      ? `Calcul sur les ${joursEcoules} premiers jours du mois.`
                      : 'Mois terminé — calcul sur les jours écoulés.'}
                  </p>
                </div>
              )
            })()}
          </div>

          {/* Green Tip Box (clôture de la colonne) */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300 flex items-start gap-3">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <b>Consommation du mois.</b> Votre forfait est illimité — le relevé suit vos SIM en revenus et en envois.
            </p>
          </div>

        </div>

      </div>
    </CoquilleEspace>
  )
}
