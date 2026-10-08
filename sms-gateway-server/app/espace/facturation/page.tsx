'use client'

import { useState, useEffect } from 'react'
import { Receipt, Calendar, CreditCard, ShieldCheck, ArrowUpRight } from 'lucide-react'
import CoquilleEspace from '../../../composants/CoquilleEspace'
import { Toast } from '../../../composants/interface'

interface ConsoMensuelle {
  mois: string
  total_facture: number
  sms_envoyes: number
  sms_recus: number
  clics: number
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
  const [demandeEnvoyee, setDemandeEnvoyee] = useState(false)
  const [notification, setNotification] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)
  const [conso, setConso] = useState<ConsoMensuelle | null>(null)
  const [quotidien, setQuotidien] = useState<number[]>([0, 0, 0, 0, 0, 0, 0])
  const [nomClient, setNomClient] = useState('')
  const [mois, setMois] = useState(moisCourantId())
  const [detailOuvert, setDetailOuvert] = useState(false)

  const idMois = mois
  const nomMois = libelleMois(idMois)
  const nomMoisCourt = new Date(
    Number(idMois.split('-')[0]), Number(idMois.split('-')[1]) - 1, 1
  ).toLocaleString('fr-FR', { month: 'long' })

  function afficherNotification(type: 'succes' | 'erreur', texte: string) {
    setNotification({ type, texte })
    setTimeout(() => setNotification(null), 4000)
  }

  useEffect(() => {
    fetch('/api/espace/moi')
      .then((r) => r.json())
      .then((d) => { if (d?.nom) setNomClient(d.nom) })
      .catch(() => null)
  }, [])

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
            clics: d.clics ?? 0,
            echecs: d.echecs ?? 0,
            quota_mensuel: typeof d.quota_mensuel === 'number' ? d.quota_mensuel : null,
          })
        } else {
          setConso(null)
        }
      })
      .catch(() => null)
    fetch('/api/espace/envois?limit=200')
      .then((r) => r.json())
      .then((d) => {
        if (!Array.isArray(d.taches)) return
        const compteurs = [0, 0, 0, 0, 0, 0, 0]
        for (const t of d.taches as { date_creation?: string }[]) {
          if (typeof t.date_creation === 'string' && t.date_creation.startsWith(idMois)) {
            const jour = Number(t.date_creation.slice(8, 10))
            if (jour >= 1 && jour <= 7) compteurs[jour - 1] += 1
          }
        }
        setQuotidien(compteurs)
      })
      .catch(() => null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idMois])

  async function demanderQuota() {
    try {
      const reponse = await fetch('/api/demandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: nomClient || 'Client espace',
          contact: 'via espace client',
          usage_prevu: `Demande d'augmentation du quota mensuel (conso ${idMois} : ${conso?.total_facture ?? 0}, quota actuel : ${conso?.quota_mensuel ?? 'illimité'}).`,
        }),
      })
      const donnees = await reponse.json().catch(() => ({}))
      if (reponse.ok) {
        setDemandeEnvoyee(true)
        afficherNotification('succes', 'Demande d’augmentation transmise à l’administrateur')
      } else {
        afficherNotification('erreur', donnees?.error ?? 'Demande impossible')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    }
  }

  const total = conso?.total_facture ?? 0
  const envoyes = conso?.sms_envoyes ?? 0
  const recus = conso?.sms_recus ?? 0
  const clics = conso?.clics ?? 0
  const echecs = conso?.echecs ?? 0
  const quota = conso?.quota_mensuel ?? null
  const pctQuota = quota && quota > 0 ? Math.min(100, Math.round((total / quota) * 100)) : 0
  const maxQuotidien = Math.max(1, ...quotidien)
  const estimation = (total * 100).toLocaleString('fr-FR')
  const projectionJour = new Date().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit' })

  return (
    <CoquilleEspace>
      {/* En-tête (Exact Screenshot) */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white">Facturation</h1>
          <p className="mt-1 text-[13.5px] text-slate-500 dark:text-zinc-400">
            Consultez le relevé détaillé de votre consommation mensuelle.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">PÉRIODE</span>
          <input
            type="month"
            value={mois}
            max={moisCourantId()}
            onChange={(e) => { if (e.target.value) setMois(e.target.value) }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          />
        </div>
      </div>

      {/* 4 Stat Cards Row (Exact Screenshot) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">SMS ENVOYÉS</p>
          <p className="text-[30px] font-extrabold leading-none text-slate-900 dark:text-white">{envoyes}</p>
          <p className="text-[11.5px] text-slate-400">Ce mois-ci</p>
        </div>

        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">SMS REÇUS</p>
          <p className="text-[30px] font-extrabold leading-none text-slate-900 dark:text-white">{recus}</p>
          <p className="text-[11.5px] text-slate-400">Transmis au webhook</p>
        </div>

        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">CLICS LIEN</p>
          <p className="text-[30px] font-extrabold leading-none text-slate-900 dark:text-white">{clics}</p>
          <p className="text-[11.5px] text-slate-400">Suivi intelligent</p>
        </div>

        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">ÉCHECS</p>
          <p className="text-[30px] font-extrabold leading-none text-rose-600 dark:text-rose-400">{echecs}</p>
          <p className="text-[11.5px] text-slate-400">Non facturés</p>
        </div>
      </div>

      {/* Main Grid 2 Cols (Exact Screenshot) */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">

        {/* Left Column (2 cols) */}
        <div className="xl:col-span-2 space-y-4">

          {/* Card 1 : Relevé du mois courant réel */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-indigo-400">
                  <Receipt className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Relevé de {idMois}</h2>
                  <p className="text-xs text-slate-400">{total} unité(s) consommée(s)</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-zinc-200">Quota de votre compte</span>
                <span className="font-bold text-slate-800 dark:text-zinc-200">{total} / {quota ?? '∞'} SMS</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${pctQuota}%` }} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-slate-100 dark:border-zinc-800 gap-3">
              <p className="text-[11.5px] text-slate-400">
                1 unité correspond à 1 SMS créé dans le mois. La facturation finale est calculée en fin de mois.
              </p>
              <button
                onClick={demanderQuota}
                disabled={demandeEnvoyee}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 shrink-0 disabled:opacity-50"
              >
                {demandeEnvoyee ? 'Demande envoyée' : 'Demander plus de quota'}
              </button>
            </div>
          </div>

          {/* Card 2 : Consommation quotidienne — mois courant réel */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Consommation quotidienne — {nomMoisCourt}</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
                7 premiers jours
              </span>
            </div>

            <div className="pt-6 pb-2 flex items-end justify-between h-36 px-6">
              {quotidien.map((nombre, i) => (
                <div key={i} className="flex flex-col items-center gap-2 h-full justify-end flex-1">
                  <div className="w-7 rounded-lg bg-[#2563EB]" style={{ height: `${nombre > 0 ? Math.max(8, Math.round((nombre / maxQuotidien) * 100)) : 0}%` }} />
                  <span className="text-[10px] text-slate-400 font-semibold">{i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3 : Historique des relevés (mois courant réel uniquement) */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Historique des relevés</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:border-zinc-800">
                    <th className="pb-3 pr-4">MOIS</th>
                    <th className="pb-3 pr-4">ENVOYÉS</th>
                    <th className="pb-3 pr-4">REÇUS</th>
                    <th className="pb-3 pr-4">COÛT ESTIMÉ</th>
                    <th className="pb-3 pr-4">STATUT</th>
                    <th className="pb-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  <tr className="text-slate-700 dark:text-zinc-300">
                    <td className="py-3.5 pr-4 font-bold text-slate-900 dark:text-white">{nomMois}</td>
                    <td className="py-3.5 pr-4 font-mono">{envoyes.toLocaleString('fr-FR')}</td>
                    <td className="py-3.5 pr-4 font-mono">{recus}</td>
                    <td className="py-3.5 pr-4 font-semibold">— en cours</td>
                    <td className="py-3.5 pr-4">
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10.5px] font-bold text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">En cours</span>
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => setDetailOuvert((v) => !v)}
                        className="rounded-full border border-slate-200 px-3.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300"
                      >
                        {detailOuvert ? 'Masquer' : 'Détails'}
                      </button>
                    </td>
                  </tr>
                  {detailOuvert && (
                    <tr className="bg-slate-50/60 dark:bg-zinc-800/40">
                      <td colSpan={6} className="px-4 py-3 text-[11px] text-slate-500 dark:text-zinc-400">
                        Clics sur liens : <b>{conso?.clics ?? 0}</b> · Échecs : <b>{conso?.echecs ?? 0}</b> ·
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

          {/* Middle Card : Moyen de paiement */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Moyen de paiement</h3>

            <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300">
                <CreditCard className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">Non renseigné</p>
                <p className="text-[10.5px] text-slate-400">Ajoutez un moyen de paiement</p>
              </div>
            </div>

            <button
              onClick={() => afficherNotification('succes', 'Pour ajouter un moyen de paiement, contactez votre administrateur.')}
              className="w-full rounded-full border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              Modifier
            </button>
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

      <Toast notification={notification} />
    </CoquilleEspace>
  )
}
