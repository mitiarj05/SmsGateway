'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  RefreshCw, Check, ChevronRight, Loader2, Code, List, Smartphone, Clock, SlidersHorizontal, TriangleAlert, ArrowUpRight
} from 'lucide-react'
import CoquilleTableauDeBord from '../../composants/CoquilleTableauDeBord'

interface Passage {
  id: string
  destinataire: string
  type: string
  passerelle: string
  dureeMs: number | null
  statut: string
}

function masquerNumero(numero: string): string {
  if (!numero) return '—'
  if (numero.length <= 4) return numero
  return numero.substring(0, 7) + ' ••• ' + numero.slice(-2)
}

function formaterDuree(ms: number | null): string {
  if (ms === null || ms < 0) return '—'
  return `${(ms / 1000).toFixed(1).replace('.', ',')} s`
}

export default function PageFileAttente() {
  const [actualisation, setActualisation] = useState(false)
  const [passages, setPassages] = useState<Passage[]>([])
  const [enAttente, setEnAttente] = useState(0)
  const [enReprise, setEnReprise] = useState(0)
  const [tempsMoyenMs, setTempsMoyenMs] = useState<number | null>(null)
  const [quotaHeure, setQuotaHeure] = useState<number | null>(null)
  const [expirationHeures, setExpirationHeures] = useState<number | null>(null)
  const [premierAppareil, setPremierAppareil] = useState<{ nom: string; statut: string } | null>(null)
  const [nbAppareils, setNbAppareils] = useState(0)
  const [derniereMaj, setDerniereMaj] = useState<Date | null>(null)

  const charger = useCallback(async () => {
    setActualisation(true)
    try {
      const [resTaches, resAppareils, resStats, resParams] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/devices'),
        fetch('/api/stats'),
        fetch('/api/settings'),
      ])
      const [dTaches, dAppareils, dStats, dParams]: any[] = await Promise.all([
        resTaches.json().catch(() => ({})),
        resAppareils.json().catch(() => ({})),
        resStats.json().catch(() => ({})),
        resParams.ok ? resParams.json().catch(() => ({})) : {},
      ])
      const taches: any[] = Array.isArray(dTaches.tasks) ? dTaches.tasks : []
      const appareils: any[] = Array.isArray(dAppareils.devices) ? dAppareils.devices : []
      const nomsAppareils = new Map<string, string>(appareils.map((d) => [d.id, d.nom]))
      setNbAppareils(appareils.length)
      setPremierAppareil(appareils.length > 0 ? { nom: appareils[0].nom, statut: appareils[0].statut } : null)
      setEnAttente(dStats.stats?.tasks_pending ?? taches.filter((t) => t.statut === 'EN_ATTENTE').length)
      setEnReprise(taches.filter((t) => t.statut === 'RECLAME').length)

      const durees = taches
        .filter((t) => t.statut === 'ENVOYE' && t.created_at && t.updated_at)
        .map((t) => new Date(t.updated_at).getTime() - new Date(t.created_at).getTime())
        .filter((d) => d >= 0)
      setTempsMoyenMs(durees.length > 0 ? Math.round(durees.reduce((s, d) => s + d, 0) / durees.length) : null)

      setPassages(
        taches.slice(0, 10).map((t: any) => {
          const msg = typeof t.message === 'string' ? t.message : ''
          const duree = t.created_at && t.updated_at
            ? new Date(t.updated_at).getTime() - new Date(t.created_at).getTime()
            : null
          return {
            id: t.id,
            destinataire: masquerNumero(t.numero_destinataire ?? ''),
            type: /otp|code/i.test(msg) ? 'Code OTP' : 'Notification',
            passerelle: (t.device_id && nomsAppareils.get(t.device_id)) || 'Automatique',
            dureeMs: duree !== null && duree >= 0 ? duree : null,
            statut: t.statut,
          }
        })
      )
      if (typeof dParams.settings?.sms_quota_per_hour === 'number') setQuotaHeure(dParams.settings.sms_quota_per_hour)
      if (typeof dParams.settings?.max_pending_hours === 'number') setExpirationHeures(dParams.settings.max_pending_hours)
      setDerniereMaj(new Date())
    } finally {
      setActualisation(false)
    }
  }, [])

  useEffect(() => {
    charger()
    const i = setInterval(() => charger(), 10000)
    return () => clearInterval(i)
  }, [charger])

  const fileAJour = enAttente === 0 && enReprise === 0
  const appareilEnLigne = premierAppareil?.statut === 'EN_LIGNE'

  const steps = [
    {
      icon: Code,
      title: 'API',
      sub: "Point d'entrée des messages",
    },
    {
      icon: List,
      title: 'File de traitement',
      sub: fileAJour ? 'Aucun message en attente' : `${enAttente + enReprise} message${enAttente + enReprise > 1 ? 's' : ''} en cours`,
    },
    {
      icon: Smartphone,
      title: premierAppareil?.nom ?? 'Aucun appareil',
      sub: premierAppareil ? (appareilEnLigne ? 'Passerelle configurée' : 'Passerelle hors ligne') : 'Ajoutez un téléphone',
      offline: premierAppareil ? !appareilEnLigne : false,
    },
  ]

  const rules = [
    {
      icon: Clock,
      title: 'Quota horaire',
      sub: quotaHeure === null ? 'Limite par appareil' : `Limite à ${quotaHeure} SMS par heure et par appareil`,
    },
    {
      icon: SlidersHorizontal,
      title: 'Répartition automatique',
      sub: nbAppareils === 0 ? 'Aucun appareil disponible' : `Sur ${nbAppareils} appareil${nbAppareils > 1 ? 's' : ''}`,
    },
    {
      icon: TriangleAlert,
      title: 'Expiration',
      sub: expirationHeures === null ? 'Abandon après délai' : `Abandon après ${expirationHeures} h sans prise en charge`,
    },
  ]

  return (
    <CoquilleTableauDeBord>
      {/* En-tête (Exact Screenshot) */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white">
            File d'attente
          </h1>
          <p className="mt-1 text-[13.5px] text-slate-500 dark:text-zinc-400">
            Suivez le passage de chaque message, de l'API jusqu'au téléphone.
          </p>
        </div>
        <button
          onClick={charger}
          disabled={actualisation}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[12.5px] font-semibold text-slate-600 shadow-sm hover:border-slate-300 hover:text-slate-900 transition disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${actualisation ? 'animate-spin' : ''}`} /> Rafraîchir
        </button>
      </div>

      {/* Bandeau état (Dark Navy Gradient Card #332c75 to #1f1a52 - Exact Screenshot) */}
      <div className="rounded-[1.5rem] bg-gradient-to-br from-[#332c75] to-[#1f1a52] p-6 text-white shadow-card survol-lift">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-emerald-400/40 bg-emerald-400/10 text-emerald-300">
              {actualisation ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            </div>
            <div>
              <h2 className="text-[19px] font-extrabold">{fileAJour ? 'La file est à jour' : 'File en cours de traitement'}</h2>
              <p className="mt-0.5 text-[12.5px] text-white/55">
                {tempsMoyenMs === null
                  ? 'Aucun message traité récemment.'
                  : `Messages traités en ${formaterDuree(tempsMoyenMs)} en moyenne.`}
              </p>
            </div>
          </div>
          <span className="text-[11px] text-white/45">
            {derniereMaj ? `À ${derniereMaj.toLocaleTimeString('fr-FR')}` : '—'}
          </span>
        </div>

        {/* Flux workflow (Exact Screenshot) */}
        <div className="mt-6 flex items-stretch gap-3">
          {steps.map((s, i) => (
            <div key={s.title} className="flex flex-1 items-center gap-3">
              <div className="flex flex-1 items-center gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/80">
                  <s.icon size={18} />
                </div>
                <div>
                  <p className="text-[13.5px] font-bold">{s.title}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/50">
                    {s.sub}
                    {s.offline && (
                      <span className="rounded-full bg-rose-500/20 px-2 py-px text-[9.5px] font-bold text-rose-200">
                        Hors ligne
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {i < steps.length - 1 && (
                <ChevronRight size={18} className="shrink-0 text-white/30" />
              )}
            </div>
          ))}
        </div>

        {/* Chiffres (Exact Screenshot) */}
        <div className="mt-6 flex items-center gap-16 border-t border-white/10 pt-5">
          <div>
            <p className="text-[30px] font-extrabold leading-none">{enAttente}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-white/50">
              en attente
            </p>
          </div>
          <div>
            <p className="text-[30px] font-extrabold leading-none">{enReprise}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-white/50">
              en reprise
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[30px] font-extrabold leading-none text-emerald-300">
              {tempsMoyenMs === null ? '—' : formaterDuree(tempsMoyenMs)}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-white/50">
              temps moyen
            </p>
          </div>
        </div>
      </div>

      {/* Règles d'acheminement Card (Exact Screenshot) */}
      <div className="mt-4 survol-lift rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">
              Règles d'acheminement
            </h2>
            <p className="mt-0.5 text-[12px] text-slate-400">
              Appliquées automatiquement
            </p>
          </div>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[#2563EB] hover:underline dark:text-blue-400"
          >
            <SlidersHorizontal size={14} /> Modifier
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {rules.map((r, i) => (
            <div key={r.title} className="relative flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB] dark:bg-blue-500/10 dark:text-blue-400">
                <r.icon size={17} />
              </div>
              <div>
                <p className="text-[13.5px] font-bold text-slate-800 dark:text-zinc-200">{r.title}</p>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-400">
                  {r.sub}
                </p>
              </div>
              {i < rules.length - 1 && (
                <span className="absolute -right-3 top-1/2 hidden h-1 w-1 -translate-y-1/2 rounded-full bg-slate-200 lg:block"></span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Derniers passages Card (Exact Screenshot) */}
      <div className="mt-4 survol-lift rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">
              Derniers passages
            </h2>
            <p className="mt-0.5 text-[12px] text-slate-400">
              {passages.length === 0 ? 'Aucun message' : `${passages.length} message${passages.length > 1 ? 's' : ''} traité${passages.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <Link
            href="/history"
            className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[#2563EB] hover:underline dark:text-blue-400"
          >
            Voir le journal complet <ArrowUpRight size={13} />
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-zinc-800">
                <th className="pb-2.5 pr-4">Destinataire</th>
                <th className="pb-2.5 pr-4">Type</th>
                <th className="pb-2.5 pr-4">Passerelle</th>
                <th className="pb-2.5 pr-4">Durée</th>
                <th className="pb-2.5 text-right">Résultat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/60">
              {passages.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
                    Aucun message dans la file.
                  </td>
                </tr>
              )}
              {passages.map((p) => (
                <tr key={p.id} className="text-[13px] text-slate-700 dark:text-zinc-300">
                  <td className="py-3.5 pr-4 font-mono text-[12.5px] font-bold">
                    {p.destinataire}
                  </td>
                  <td className="py-3.5 pr-4 font-medium">{p.type}</td>
                  <td className="py-3.5 pr-4 text-slate-500 dark:text-zinc-400">{p.passerelle}</td>
                  <td className="py-3.5 pr-4 font-mono">{formaterDuree(p.dureeMs)}</td>
                  <td className="py-3.5 text-right">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${p.statut === 'ENVOYE' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : p.statut === 'ECHOUE' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${p.statut === 'ENVOYE' ? 'bg-emerald-500' : p.statut === 'ECHOUE' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                      {p.statut === 'ENVOYE' ? 'Remis' : p.statut === 'ECHOUE' ? 'Échec' : 'En cours'}
                    </span>
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
