'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Smartphone, CheckCircle2, Clock, XCircle, Send, Loader2, RefreshCw,
  Activity, Signal, BarChart3, Inbox, ChevronRight, Hash,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import CoquilleTableauDeBord from '../../composants/CoquilleTableauDeBord'
import {
  STATUTS_APPAREILS, STATUTS_TACHES, BadgeStatut, Toast, Modale, EtatVide, Progression,
} from '../../composants/interface'
import { useTheme } from '../../lib/use-theme'

interface Appareil {
  id: string; nom: string; statut: string; sms_last_hour: number
  derniere_activite: string | null
}
interface Tache {
  id: string; numero_destinataire: string; message: string; statut: string
  device_id: string | null; created_at: string; updated_at: string
  error_message?: string | null; erreur?: string | null
}
interface Statistiques {
  online_devices: number; tasks_sent: number; tasks_pending: number; tasks_failed: number
}
interface PointHoraire { hour: string; count: number }

const ICONES_FIL: Record<string, React.ReactNode> = {
  ENVOYE: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
  ECHOUE: <XCircle className="h-3.5 w-3.5 text-red-500" />,
  RECLAME: <Clock className="h-3.5 w-3.5 text-blue-500" />,
  EN_ATTENTE: <Clock className="h-3.5 w-3.5 text-amber-500" />,
}

export default function DashboardPage() {
  const [appareils, setAppareils] = useState<Appareil[]>([])
  const [taches, setTaches] = useState<Tache[]>([])
  const [statistiques, setStatistiques] = useState<Statistiques | null>(null)
  const [parHeure, setParHeure] = useState<PointHoraire[]>([])
  const [quota, setQuota] = useState(50)
  const [chargement, setChargement] = useState(true)
  const [derniereActualisation, setDerniereActualisation] = useState(new Date())
  const [modaleOuverte, setModaleOuverte] = useState(false)
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [tacheDetaillee, setTacheDetaillee] = useState<Tache | null>(null)
  const [formulaire, setFormulaire] = useState({ to: '', message: '', cle_api: '', programme: '' })
  const [notification, setNotification] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)
  // Couleurs du graphique : suivent le toggle en direct via le hook partagé.
  const { modeSombre: graphiqueSombre } = useTheme()

  const afficherNotification = useCallback((type: 'succes' | 'erreur', texte: string) => {
    setNotification({ type, texte })
    setTimeout(() => setNotification(null), 4000)
  }, [])

  const calculerParHeure = useCallback((liste: Tache[]): PointHoraire[] => {
    const buckets = new Map<string, number>()
    const now = new Date()
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3600_000)
      buckets.set(`${d.getHours()}h`, 0)
    }
    liste.forEach((t) => {
      const d = new Date(t.created_at)
      if (now.getTime() - d.getTime() <= 24 * 3600_000) {
        const k = `${d.getHours()}h`
        if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + 1)
      }
    })
    return Array.from(buckets, ([hour, count]) => ({ hour, count }))
  }, [])

  const chargerDonnees = useCallback(async () => {
    try {
      const [d, t, s, q] = await Promise.all([
        fetch('/api/devices'), fetch('/api/tasks'), fetch('/api/stats'), fetch('/api/settings'),
      ])
      const [dd, td, sd] = [await d.json(), await t.json(), await s.json()]
      if (dd.devices) setAppareils(dd.devices)
      // Le serveur renvoie error_message : on l'expose aussi en `erreur`.
      const listeTaches: Tache[] = (td.tasks ?? []).map((tache: Tache) => ({
        ...tache, erreur: tache.erreur ?? tache.error_message ?? null,
      }))
      if (td.tasks) setTaches(listeTaches)
      if (sd.stats) setStatistiques(sd.stats)
      if (q.ok) {
        const qd = await q.json()
        if (typeof qd.settings?.sms_quota_per_hour === 'number') {
          setQuota(qd.settings.sms_quota_per_hour)
        }
      }
      try {
        const hr = await fetch('/api/stats/hourly')
        if (hr.ok) {
          const hd = await hr.json()
          if (hd.hourly) {
            setParHeure(hd.hourly)
            setDerniereActualisation(new Date())
            return
          }
        }
        setParHeure(calculerParHeure(listeTaches))
      } catch {
        setParHeure(calculerParHeure(listeTaches))
      }
      setDerniereActualisation(new Date())
    } catch {
      afficherNotification('erreur', 'Serveur injoignable')
    } finally {
      setChargement(false)
    }
  }, [calculerParHeure, afficherNotification])

  useEffect(() => {
    const savedKey = localStorage.getItem('smsika-cle-api')
    if (savedKey) setFormulaire((f) => ({ ...f, cle_api: savedKey }))
    chargerDonnees()
    const i = setInterval(() => chargerDonnees(), 3000)
    return () => clearInterval(i)
  }, [chargerDonnees])

  async function envoyerSms(e: React.FormEvent) {
    e.preventDefault()
    setEnvoiEnCours(true)
    // Un numéro par ligne (virgules et points-virgules acceptés aussi).
    const destinataires = formulaire.to.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean)
    const programmeA = formulaire.programme ? new Date(formulaire.programme).toISOString() : undefined
    try {
      const reponse = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: destinataires.length > 1 ? destinataires : destinataires[0] ?? '',
          message: formulaire.message,
          cle_api: formulaire.cle_api.trim(),
          ...(programmeA ? { scheduled_at: programmeA } : {}),
        }),
      })
      const donnees = await reponse.json().catch(() => null)
      if (reponse.ok) {
        afficherNotification(
          'succes',
          programmeA
            ? (donnees?.message ?? 'SMS programmé')
            : destinataires.length > 1 ? `${destinataires.length} SMS mis en file` : `SMS mis en file → ${formulaire.to.trim()}`
        )
        setModaleOuverte(false)
        setFormulaire({ to: '', message: '', cle_api: formulaire.cle_api, programme: '' })
        chargerDonnees()
      } else {
        afficherNotification('erreur', donnees?.error ?? 'Erreur lors de l’envoi')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    } finally {
      setEnvoiEnCours(false)
    }
  }

  if (chargement) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const tachesRecentes = [...taches].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 8)
  const fil = tachesRecentes.slice(0, 6)
  const appareilDetaille = tacheDetaillee?.device_id ? appareils.find((d) => d.id === tacheDetaillee.device_id) : null
  const grilleGraphique = graphiqueSombre ? '#3f3f46' : '#e4e4e7'
  const graduationGraphique = graphiqueSombre ? '#a1a1aa' : '#71717a'

  return (
    <CoquilleTableauDeBord
      titre="Tableau de bord"
      sousTitre={`Actualisé à ${derniereActualisation.toLocaleTimeString('fr-FR')} · auto 3 s`}
      actions={
        <>
          <button onClick={() => chargerDonnees()}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-600 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
            <RefreshCw className="h-4 w-4" /> Actualiser
          </button>
          <button onClick={() => setModaleOuverte(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
            <Send className="h-4 w-4" /> Nouveau SMS
          </button>
        </>
      }
    >
      {/* KPI */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: <Smartphone className="h-5 w-5 text-emerald-600" />, label: 'Appareils en ligne', value: statistiques?.online_devices ?? 0, sub: `sur ${appareils.length} enregistré(s)`, accent: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { icon: <CheckCircle2 className="h-5 w-5 text-blue-600" />, label: 'SMS envoyés', value: statistiques?.tasks_sent ?? 0, sub: 'toutes périodes', accent: 'bg-blue-50 dark:bg-blue-500/10' },
          { icon: <Clock className="h-5 w-5 text-amber-600" />, label: 'En file d’attente', value: statistiques?.tasks_pending ?? 0, sub: 'en attente d’assignation', accent: 'bg-amber-50 dark:bg-amber-500/10' },
          { icon: <XCircle className="h-5 w-5 text-red-600" />, label: 'Échecs', value: statistiques?.tasks_failed ?? 0, sub: 'à traiter', accent: 'bg-red-50 dark:bg-red-500/10' },
        ].map((k) => (
          <div key={k.label} className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800 ${k.accent}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{k.label}</p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-zinc-900 dark:text-white">{k.value}</p>
                <p className="mt-1 text-xs text-zinc-400">{k.sub}</p>
              </div>
              <div className="rounded-xl bg-white/60 p-2.5 dark:bg-white/5">{k.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white">
            <BarChart3 className="h-4 w-4 text-zinc-400" /> Activité SMS — dernières 24 h
          </h2>
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            {parHeure.reduce((a, p) => a + p.count, 0)} SMS
          </span>
        </div>
        <div className="h-56 w-full" suppressHydrationWarning>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={parHeure} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={grilleGraphique} vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: graduationGraphique, fontSize: 11 }} tickLine={false} axisLine={{ stroke: grilleGraphique }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} tick={{ fill: graduationGraphique, fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v) => [`${v ?? 0} SMS`, 'Envoyés']} />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#g)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Appareils + Activité */}
      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800 xl:col-span-2">
          <div className="flex items-center gap-2 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
            <Signal className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Appareils connectés</h2>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{appareils.length}</span>
          </div>
          {appareils.length === 0 ? (
            <EtatVide icone={<Smartphone className="h-9 w-9" />} titre="Aucun appareil" indice="Installez l'app Android et associez-la au serveur." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800">
                  <th className="px-5 py-3">Appareil</th><th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3 w-52">SMS/h</th><th className="px-5 py-3">Activité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
                {appareils.map((d) => (
                  <tr key={d.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                          <Smartphone className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                        </div>
                        <p className="font-medium text-zinc-800 dark:text-zinc-200">{d.nom}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><BadgeStatut statut={d.statut} config={STATUTS_APPAREILS} /></td>
                    <td className="px-5 py-3.5">
                      <Progression valeur={d.sms_last_hour} max={quota} afficherValeur />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-400">
                      {d.derniere_activite ? new Date(d.derniere_activite).toLocaleTimeString('fr-FR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Flux d'activité */}
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
          <div className="flex items-center gap-2 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
            <Activity className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Flux d&apos;activité</h2>
          </div>
          <div className="p-3">
            {fil.length === 0 ? (
              <EtatVide icone={<Inbox className="h-8 w-8" />} titre="Aucune activité" />
            ) : fil.map((t) => (
              <button key={t.id} onClick={() => setTacheDetaillee(t)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                {ICONES_FIL[t.statut] ?? <Clock className="h-3.5 w-3.5 text-zinc-400" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-200">{t.numero_destinataire}</p>
                  <p className="truncate text-[11px] text-zinc-400">{STATUTS_TACHES[t.statut]?.label ?? t.statut}</p>
                </div>
                <span className="text-[11px] text-zinc-400">{new Date(t.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Dernières tâches — cliquables */}
      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
        <div className="flex items-center gap-2 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <Activity className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Dernières tâches</h2>
          <Link href="/history" className="ml-auto flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
            Tout voir <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
          {tachesRecentes.map((t) => (
            <button key={t.id} onClick={() => setTacheDetaillee(t)}
              className="flex w-full items-center gap-4 px-5 py-3 text-left hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
              <span className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">{t.numero_destinataire}</span>
              <span className="min-w-0 flex-1 truncate text-xs text-zinc-500 dark:text-zinc-400">{t.message}</span>
              {t.erreur && (
                <span className="hidden max-w-40 truncate text-[11px] text-red-500 md:inline" title={t.erreur}>{t.erreur}</span>
              )}
              <BadgeStatut statut={t.statut} config={STATUTS_TACHES} />
              <span className="text-xs text-zinc-400">{new Date(t.created_at).toLocaleTimeString('fr-FR')}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ===== MODALE : fiche tâche (inspection) ===== */}
      <Modale ouvert={!!tacheDetaillee} onFermer={() => setTacheDetaillee(null)} large
        titre="Détail de la tâche" sousTitre="Traçabilité complète pour l'audit et le debug anti-doublon">
        {tacheDetaillee && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <BadgeStatut statut={tacheDetaillee.statut} config={STATUTS_TACHES} />
              {tacheDetaillee.erreur && (
                <span className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
                  {tacheDetaillee.erreur}
                </span>
              )}
            </div>
            <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/60">
              <p className="text-lg font-bold text-zinc-900 dark:text-white">{tacheDetaillee.numero_destinataire}</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{tacheDetaillee.message}</p>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-xs">
              {[
                ['Créée le', new Date(tacheDetaillee.created_at).toLocaleString('fr-FR')],
                ['Mise à jour', new Date(tacheDetaillee.updated_at).toLocaleString('fr-FR')],
                ['Appareil assigné', appareilDetaille?.nom ?? (tacheDetaillee.device_id ? 'inconnu' : '—')],
                ['Statut serveur', tacheDetaillee.statut],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/60">
                  <dt className="text-zinc-400">{k}</dt>
                  <dd className="mt-0.5 font-semibold text-zinc-800 dark:text-zinc-200">{v}</dd>
                </div>
              ))}
            </dl>
            {/* Idempotence : preuve piège n°3 */}
            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700">
              <Hash className="h-3.5 w-3.5 text-zinc-400" />
              <span className="text-[11px] text-zinc-400">ID unique (idempotence) :</span>
              <code className="flex-1 truncate font-mono text-[11px] text-zinc-600 dark:text-zinc-300">{tacheDetaillee.id}</code>
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-400">
              Cet identifiant garantit qu&apos;une re-délivrance (coupure réseau, redémarrage) ne provoque
              jamais un double envoi : le serveur rejette les accusés portant un ID déjà traité.
            </p>
          </div>
        )}
      </Modale>

      {/* ===== MODALE : envoi ===== */}
      <Modale ouvert={modaleOuverte} onFermer={() => !envoiEnCours && setModaleOuverte(false)}
        titre="Envoyer un SMS" sousTitre="La tâche sera ajoutée à la file d'attente">
        <form onSubmit={envoyerSms} className="space-y-4">
          <textarea required rows={3} placeholder="+261328725411&#10;+261331298765 (un par ligne)" value={formulaire.to}
            onChange={(e) => setFormulaire({ ...formulaire, to: e.target.value })}
            className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
          <div>
            <textarea required rows={3} maxLength={160} placeholder="Votre message…" value={formulaire.message}
              onChange={(e) => setFormulaire({ ...formulaire, message: e.target.value })}
              className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
            <p className="mt-1 text-right text-[11px] text-zinc-400">{formulaire.message.length}/160</p>
          </div>
          <input type="password" required value={formulaire.cle_api}
            onChange={(e) => setFormulaire({ ...formulaire, cle_api: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Programmer l&apos;envoi (optionnel)
            </label>
            <input type="datetime-local" value={formulaire.programme}
              onChange={(e) => setFormulaire({ ...formulaire, programme: e.target.value })}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
          </div>
          <button type="submit" disabled={envoiEnCours}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {envoiEnCours ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {envoiEnCours ? 'Envoi…' : 'Envoyer'}
          </button>
        </form>
      </Modale>

      <Toast notification={notification} />
    </CoquilleTableauDeBord>
  )
}
