'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Smartphone, Clock, Send, Loader2,
  XCircle, CheckCircle2,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import CoquilleTableauDeBord from '../../composants/CoquilleTableauDeBord'
import {
  STATUTS_TACHES, BadgeStatut, Toast, Modale,
} from '../../composants/interface'
import ModaleEnvoiSms from '../../composants/ModaleEnvoiSms'
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

export default function DashboardPage() {
  const [appareils, setAppareils] = useState<Appareil[]>([])
  const [taches, setTaches] = useState<Tache[]>([])
  const [statistiques, setStatistiques] = useState<Statistiques | null>(null)
  const [parHeure, setParHeure] = useState<PointHoraire[]>([])
  const [chargement, setChargement] = useState(true)
  const [modaleOuverte, setModaleOuverte] = useState(false)
  const [tacheDetaillee, setTacheDetaillee] = useState<Tache | null>(null)
  const [notification, setNotification] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  const { modeSombre: graphiqueSombre } = useTheme()

  const afficherNotification = useCallback((type: 'succes' | 'erreur', texte: string) => {
    setNotification({ type, texte })
    setTimeout(() => setNotification(null), 4000)
  }, [])

  const calculerParHeure = useCallback((liste: Tache[]): PointHoraire[] => {
    const buckets = new Map<string, number>()
    const now = new Date()
    for (let i = 17; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3600_000)
      const label = `${String(d.getHours()).padStart(2, '0')} h`
      buckets.set(label, 0)
    }
    liste.forEach((t) => {
      const d = new Date(t.created_at)
      if (now.getTime() - d.getTime() <= 24 * 3600_000) {
        const k = `${String(d.getHours()).padStart(2, '0')} h`
        if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + 1)
      }
    })
    return Array.from(buckets, ([hour, count]) => ({ hour, count }))
  }, [])

  const chargerDonnees = useCallback(async () => {
    try {
      const [d, t, s] = await Promise.all([
        fetch('/api/devices'), fetch('/api/tasks'), fetch('/api/stats'),
      ])
      const [dd, td, sd] = [await d.json(), await t.json(), await s.json()]
      if (dd.devices) setAppareils(dd.devices)
      const listeTaches: Tache[] = (td.tasks ?? []).map((tache: Tache) => ({
        ...tache, erreur: tache.erreur ?? tache.error_message ?? null,
      }))
      if (td.tasks) setTaches(listeTaches)
      if (sd.stats) setStatistiques(sd.stats)

      try {
        const hr = await fetch('/api/stats/hourly')
        if (hr.ok) {
          const hd = await hr.json()
          if (hd.hourly) {
            setParHeure(hd.hourly)
            return
          }
        }
        setParHeure(calculerParHeure(listeTaches))
      } catch {
        setParHeure(calculerParHeure(listeTaches))
      }
    } catch {
      afficherNotification('erreur', 'Serveur injoignable')
    } finally {
      setChargement(false)
    }
  }, [calculerParHeure, afficherNotification])

  useEffect(() => {
    chargerDonnees()
    const i = setInterval(() => chargerDonnees(), 3000)
    return () => clearInterval(i)
  }, [chargerDonnees])

  if (chargement) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const appareilsEnLigneCount = statistiques?.online_devices ?? appareils.filter(a => a.statut === 'EN_LIGNE').length
  const smsEnvoyesCount = statistiques?.tasks_sent ?? taches.filter(t => t.statut === 'ENVOYE').length
  const fileAttenteCount = statistiques?.tasks_pending ?? taches.filter(t => ['EN_ATTENTE', 'RECLAME'].includes(t.statut)).length
  const echecsCount = statistiques?.tasks_failed ?? taches.filter(t => t.statut === 'ECHOUE').length

  const grilleGraphique = graphiqueSombre ? '#1f2937' : '#f1f5f9'
  const graduationGraphique = graphiqueSombre ? '#6b7280' : '#94a3b8'

  return (
    <CoquilleTableauDeBord>
      {/* En-tête de page */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Tableau de bord</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Vue d'ensemble de l'activité SMSIKA sur les dernières 24 h.
          </p>
        </div>
        <button
          onClick={() => setModaleOuverte(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          <Send className="h-4 w-4" /> Nouveau SMS
        </button>
      </div>

      {/* 4 cartes KPI */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1 */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Appareils en ligne</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{appareilsEnLigneCount}</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">{appareilsEnLigneCount} appareil connecté</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Smartphone className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">SMS envoyés</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{smsEnvoyesCount}</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">Total des SMS envoyés</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <Send className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">En file d'attente</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{fileAttenteCount}</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">En attente d'expédition</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Échecs</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{echecsCount}</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">
                {echecsCount === 0 ? 'Aucune erreur détectée' : `${echecsCount} erreur(s) détectée(s)`}
              </p>
            </div>
            <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Graphique de l'activité */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Activité SMS — dernières 24 h</h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500">Volume des messages traités heure par heure</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-600" /> Envoyés
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Reçus
            </span>
          </div>
        </div>
        <div className="h-52 w-full" suppressHydrationWarning>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={parHeure} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={grilleGraphique} vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: graduationGraphique, fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: graduationGraphique, fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v) => [`${v ?? 0} SMS`, 'Total']} />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2.5} fill="url(#blueGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grille 2 colonnes du bas */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Appareils connectés */}
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800 xl:col-span-2">
          <div className="border-b border-slate-100 px-6 py-4 dark:border-zinc-800/80">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Appareils connectés</h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500">{appareils.length} appareil{appareils.length > 1 ? 's' : ''} enregistré{appareils.length > 1 ? 's' : ''}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-left font-semibold uppercase tracking-wider text-slate-400 dark:border-zinc-800 dark:bg-zinc-800/30">
                  <th className="px-6 py-3">APPAREIL</th>
                  <th className="px-6 py-3">STATUT</th>
                  <th className="px-6 py-3">SMS/H</th>
                  <th className="px-6 py-3">ACTIVITÉ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {appareils.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-xs text-slate-400 dark:text-zinc-500">
                      Aucun appareil enregistré.{' '}
                      <Link href="/devices/add" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
                        Ajouter un téléphone
                      </Link>
                    </td>
                  </tr>
                ) : (
                  appareils.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                            <Smartphone className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-zinc-200">{a.nom}</p>
                            <p className="font-mono text-[11px] text-slate-400">{a.id.substring(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {a.statut === 'EN_LIGNE' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> En ligne
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Hors ligne
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-600 dark:text-zinc-300">{a.sms_last_hour ?? 0}/h</td>
                      <td className="px-6 py-4 font-mono text-slate-500 dark:text-zinc-400">
                        {a.derniere_activite ? new Date(a.derniere_activite).toLocaleTimeString('fr-FR') : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Flux d'activité */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Flux d'activité</h2>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mb-4">Événements récents</p>

          {taches.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-zinc-500">Aucun événement pour le moment.</p>
          ) : (
            <div className="space-y-4">
              {taches.slice(0, 5).map((t) => (
                <button key={t.id} onClick={() => setTacheDetaillee(t)} className="flex w-full items-start gap-3 text-left">
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${t.statut === 'ENVOYE' ? 'bg-emerald-500' : t.statut === 'ECHOUE' ? 'bg-red-500' : 'bg-amber-500'}`} />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-800 dark:text-zinc-200">
                      {STATUTS_TACHES[t.statut]?.label ?? t.statut} — {t.numero_destinataire}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(t.updated_at ?? t.created_at).toLocaleString('fr-FR', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal fiche tâche */}
      <Modale ouvert={!!tacheDetaillee} onFermer={() => setTacheDetaillee(null)} large titre="Détail de la tâche">
        {tacheDetaillee && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-mono text-sm font-bold text-slate-800 dark:text-zinc-200">{tacheDetaillee.numero_destinataire}</p>
              <BadgeStatut statut={tacheDetaillee.statut} config={STATUTS_TACHES} />
            </div>
            <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">{tacheDetaillee.message}</p>
            {(tacheDetaillee.erreur ?? tacheDetaillee.error_message) && (
              <p className="text-xs text-red-500">{tacheDetaillee.erreur ?? tacheDetaillee.error_message}</p>
            )}
            <p className="text-[11px] text-slate-400">
              Créée le {new Date(tacheDetaillee.created_at).toLocaleString('fr-FR')}
            </p>
          </div>
        )}
      </Modale>

      {/* Modal nouveau SMS */}
      <ModaleEnvoiSms
        ouvert={modaleOuverte}
        onFermer={() => setModaleOuverte(false)}
        onSucces={(message) => {
          afficherNotification('succes', message)
          chargerDonnees()
        }}
      />

      <Toast notification={notification} />
    </CoquilleTableauDeBord>
  )
}
