'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Smartphone, Loader2,
  XCircle, CheckCircle2, ChevronRight, WifiOff, Radio, ArrowUpRight, Plus, Clock,
} from 'lucide-react'
import CoquilleTableauDeBord from '../../composants/CoquilleTableauDeBord'
import {
  STATUTS_TACHES, BadgeStatut, Toast, Modale,
} from '../../composants/interface'
import ModaleEnvoiSms from '../../composants/ModaleEnvoiSms'

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

/** « il y a X min / h » en français depuis une date ISO. */
function tempsEcouleFr(dateIso: string | null): string {
  if (!dateIso) return '—'
  const s = Math.floor((Date.now() - new Date(dateIso).getTime()) / 1000)
  if (s < 60) return "à l'instant"
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`
  return new Date(dateIso).toLocaleDateString('fr-FR')
}

export default function DashboardPage() {
  const [appareils, setAppareils] = useState<Appareil[]>([])
  const [taches, setTaches] = useState<Tache[]>([])
  const [statistiques, setStatistiques] = useState<Statistiques>({
    online_devices: 0,
    tasks_sent: 0,
    tasks_pending: 0,
    tasks_failed: 0,
  })
  const [parHeure, setParHeure] = useState<PointHoraire[]>([])
  const [chargement, setChargement] = useState(true)
  const [modaleOuverte, setModaleOuverte] = useState(false)
  const [tacheDetaillee, setTacheDetaillee] = useState<Tache | null>(null)
  const [notification, setNotification] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  const dateAujourdhui = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  const afficherNotification = useCallback((type: 'succes' | 'erreur', texte: string) => {
    setNotification({ type, texte })
    setTimeout(() => setNotification(null), 4000)
  }, [])

  const chargerDonnees = useCallback(async () => {
    try {
      const [d, t, s, h] = await Promise.all([
        fetch('/api/devices'), fetch('/api/tasks'), fetch('/api/stats'), fetch('/api/stats/hourly'),
      ])
      const [dd, td, sd, hd] = [
        await d.json().catch(() => ({})),
        await t.json().catch(() => ({})),
        await s.json().catch(() => ({})),
        await h.json().catch(() => ({})),
      ]

      if (Array.isArray(dd.devices)) setAppareils(dd.devices)
      if (Array.isArray(td.tasks)) setTaches(td.tasks)
      if (sd.stats) {
        setStatistiques({
          online_devices: sd.stats.online_devices ?? 0,
          tasks_sent: sd.stats.tasks_sent ?? 0,
          tasks_pending: sd.stats.tasks_pending ?? 0,
          tasks_failed: sd.stats.tasks_failed ?? 0,
        })
      }
      if (Array.isArray(hd.hourly)) setParHeure(hd.hourly)
    } catch {
      /* conservé */
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    chargerDonnees()
    const i = setInterval(() => chargerDonnees(), 5000)
    return () => clearInterval(i)
  }, [chargerDonnees])

  if (chargement) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const enLigneCount = statistiques.online_devices
  const totalCount = appareils.length
  const horsLigneCount = totalCount - appareils.filter((a) => a.statut === 'EN_LIGNE').length
  const totalTraites = statistiques.tasks_sent + statistiques.tasks_failed
  const tauxEchec = totalTraites > 0
    ? `${(statistiques.tasks_failed / totalTraites * 100).toFixed(1).replace('.', ',')} %`
    : '—'
  const volume24h = parHeure.reduce((s, p) => s + p.count, 0)
  const maxVolume = Math.max(0, ...parHeure.map((p) => p.count))
  const pic = parHeure.reduce<PointHoraire | null>((m, p) => (!m || p.count > m.count ? p : m), null)
  // Courbe SVG depuis les vraies données (0 → ligne plate).
  const courbe = (() => {
    if (parHeure.length === 0 || maxVolume === 0) return null
    const n = parHeure.length
    const pts = parHeure.map((p, i) => {
      const x = n === 1 ? 300 : (i / (n - 1)) * 600
      const y = 112 - (p.count / maxVolume) * 100
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    const ligne = pts.join(' ')
    return { ligne, aire: `${ligne} L600,120 L0,120 Z` }
  })()
  const derniereActivite = appareils
    .map((a) => a.derniere_activite)
    .filter((x): x is string => !!x && !Number.isNaN(new Date(x).getTime()))
    .sort()
    .pop() ?? null
  const premierAppareil = appareils[0] ?? null

  return (
    <CoquilleTableauDeBord>
      {/* En-tête (Exact Screenshot) */}
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white">Bonjour.</h1>
          <p className="mt-1 text-[13.5px] text-slate-500 dark:text-zinc-400">Votre infrastructure SMS, en un regard.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Dernière synchronisation · {derniereActivite
                ? new Date(derniereActivite).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                : '—'}
            </p>
            <p className="mt-0.5 text-[13px] font-bold text-slate-800 dark:text-white capitalize">
              {dateAujourdhui}
            </p>
          </div>
          <button
            onClick={() => setModaleOuverte(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Nouveau SMS
          </button>
        </div>
      </div>

      {/* Banner Alerte Crème/Jaune (Exact Screenshot) */}
      {horsLigneCount > 0 ? (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[#f3d9a4] bg-[#fff4e0] px-5 py-3.5 dark:bg-amber-500/10 dark:border-amber-500/20">
          <WifiOff size={17} className="shrink-0 text-amber-600" />
          <p className="flex-1 text-[13.5px] font-medium text-amber-900 dark:text-amber-300">
            {horsLigneCount} appareil{horsLigneCount > 1 ? 's' : ''} hors ligne à vérifier.
          </p>
          <a
            href="/devices"
            className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#5b5bd6] hover:underline dark:text-blue-400"
          >
            Vérifier {horsLigneCount > 1 ? 'les appareils' : "l'appareil"} <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      ) : (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 dark:bg-emerald-500/10 dark:border-emerald-500/20">
          <CheckCircle2 size={17} className="shrink-0 text-emerald-600" />
          <p className="flex-1 text-[13.5px] font-medium text-emerald-900 dark:text-emerald-300">
            {totalCount === 0 ? 'Aucun appareil enregistré pour le moment.' : 'Tous les appareils sont en ligne.'}
          </p>
          {totalCount === 0 && (
            <a href="/devices/add" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#5b5bd6] hover:underline dark:text-blue-400">
              Ajouter un téléphone <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
        </div>
      )}

      {/* 4 SEPARATE KPI CARDS (Exact Screenshot) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1 */}
        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Appareils en ligne</p>
          <p className="text-[30px] font-extrabold leading-none tracking-tight text-rose-600 dark:text-rose-400">{enLigneCount}/{totalCount}</p>
          <p className="text-[11.5px] text-slate-400">
            {totalCount === 0 ? 'Aucun appareil' : horsLigneCount === 0 ? 'Tous opérationnels' : `${horsLigneCount} hors ligne`}
          </p>
        </div>

        {/* Card 2 */}
        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">SMS envoyés - 24 h</p>
          <p className="text-[30px] font-extrabold leading-none tracking-tight text-slate-900 dark:text-white">{statistiques.tasks_sent}</p>
          <p className="text-[11.5px] text-slate-400">Total des SMS envoyés</p>
        </div>

        {/* Card 3 */}
        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">En file d'attente</p>
          <p className="text-[30px] font-extrabold leading-none tracking-tight text-slate-900 dark:text-white">{statistiques.tasks_pending}</p>
          {statistiques.tasks_pending === 0 ? (
            <p className="flex items-center gap-1.5 text-[11.5px] text-emerald-600">
              <CheckCircle2 size={13} className="text-emerald-500" /> File vide
            </p>
          ) : (
            <p className="text-[11.5px] text-amber-600">À traiter</p>
          )}
        </div>

        {/* Card 4 */}
        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Taux d'échec</p>
          <p className="text-[30px] font-extrabold leading-none tracking-tight text-slate-900 dark:text-white">{tauxEchec}</p>
          <p className="text-[11.5px] text-slate-400">{statistiques.tasks_failed} échec{statistiques.tasks_failed > 1 ? 's' : ''} au total</p>
        </div>
      </div>

      {/* Middle Grid (Exact Screenshot Layout: Chart left 2 cols, Passerelles right 1 col) */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">

        {/* Rythme d'envoi (Chart Card - 2 cols) */}
        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 xl:col-span-2 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">Rythme d'envoi</h2>
              <p className="mt-0.5 text-[12px] text-slate-400">{volume24h.toLocaleString('fr-FR')} message{volume24h > 1 ? 's' : ''} traité{volume24h > 1 ? 's' : ''} sur 24 h</p>
            </div>
            <button className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[12px] font-semibold text-slate-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 shadow-sm">
              24 dernières heures <ChevronRight className="h-3.5 w-3.5 rotate-90" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            {pic && maxVolume > 0 ? (
              <span className="rounded-full bg-[#eef0ff] px-3 py-1 text-[11px] font-bold text-[#5b5bd6] dark:bg-blue-500/10 dark:text-blue-400">
                Pic à {pic.hour} - {pic.count} SMS
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">Aucun pic sur la période</span>
            )}
            <span className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="h-2 w-2 rounded-full bg-[#8a8ade]" /> SMS envoyés
            </span>
          </div>

          {/* Graphique avec ligne et aire (données réelles, ligne plate si vide) */}
          <div className="relative mt-2 h-44">
            {volume24h === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-[15px] font-bold text-slate-600 dark:text-zinc-300">Aucun envoi sur la période</p>
                <p className="mt-1 text-[12px] text-slate-400">L'activité apparaîtra ici après traitement.</p>
              </div>
            )}
            <svg
              className="absolute inset-x-0 bottom-6 h-32 w-full"
              preserveAspectRatio="none"
              viewBox="0 0 600 120"
            >
              <defs>
                <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8a8ade" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#8a8ade" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[30, 60, 90].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="600"
                  y2={y}
                  stroke="#eef0f8"
                  strokeWidth="1"
                />
              ))}
              <path
                d={courbe ? courbe.aire : 'M0,112 L600,112 L600,120 L0,120 Z'}
                fill="url(#area)"
              />
              <path
                d={courbe ? courbe.ligne : 'M0,112 L600,112'}
                fill="none"
                stroke="#b9bbe8"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-x-0 bottom-0 flex justify-between text-[10px] font-medium text-slate-400">
              <span>00:00</span>
              <span>04:00</span>
              <span>08:00</span>
              <span>12:00</span>
              <span>16:00</span>
              <span>20:00</span>
            </div>
          </div>
        </div>

        {/* Les passerelles, en ce moment (Dark Card 1 col) */}
        <div className="flex flex-col rounded-[1.5rem] bg-gradient-to-br from-[#332c75] to-[#1f1a52] p-6 text-white shadow-card justify-between space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/60">
              Les passerelles, en ce moment
            </p>
            <Radio className="h-4 w-4 text-white/50" />
          </div>

          <div className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white/80">
              <Smartphone size={20} />
            </div>
            <div className="flex-1">
              <p className="text-[14.5px] font-bold">{premierAppareil?.nom ?? 'Aucun appareil'}</p>
              {premierAppareil && (
                premierAppareil.statut === 'EN_LIGNE' ? (
                  <span className="mt-1 inline-block rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-200">
                    En ligne
                  </span>
                ) : (
                  <span className="mt-1 inline-block rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-bold text-rose-200">
                    Hors ligne
                  </span>
                )
              )}
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 flex items-end justify-between">
            <p className="text-[12px] text-white/55">
              {premierAppareil ? `Dernier signal ${tempsEcouleFr(premierAppareil.derniere_activite)}` : 'En attente de connexion'}
            </p>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wide text-white/45">Débit actuel</p>
              <p className="text-[22px] font-extrabold leading-tight">{premierAppareil?.sms_last_hour ?? 0} SMS/h</p>
            </div>
          </div>

          <Link href="/devices" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-white hover:underline pt-1">
            Gérer la flotte <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

      </div>

      {/* Journal du jour (Full Width Card at bottom) */}
      <div className="mt-4 rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">
              Journal du jour
            </h2>
            <p className="mt-0.5 text-[12px] text-slate-400">
              Les événements qui méritent votre attention
            </p>
          </div>
          <span className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            En direct
          </span>
        </div>

        <div className="mt-4 space-y-1 divide-y divide-slate-100 dark:divide-zinc-800">
          {taches.length === 0 && (
            <p className="px-1 py-6 text-center text-xs text-slate-400 dark:text-zinc-500">
              Aucun événement pour le moment.
            </p>
          )}
          {taches.slice(0, 3).map((t) => {
            const envoye = t.statut === 'ENVOYE'
            const echoue = t.statut === 'ECHOUE'
            return (
            <button key={t.id} onClick={() => setTacheDetaillee(t)} className="flex w-full items-center gap-3.5 border-t border-slate-100 pt-4 first:border-0 first:pt-0 text-left dark:border-zinc-800">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${envoye ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400' : echoue ? 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400'}`}>
                {envoye ? <CheckCircle2 size={17} /> : echoue ? <XCircle size={17} /> : <Clock size={17} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-bold text-slate-800 dark:text-zinc-200">
                  {STATUTS_TACHES[t.statut]?.label ?? t.statut} → {t.numero_destinataire}
                </p>
                <p className="mt-0.5 truncate text-[12px] text-slate-500 dark:text-zinc-400">
                  {t.message}
                </p>
              </div>
              <span className="shrink-0 text-[12px] text-slate-400">
                {new Date(t.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
            </button>
            )
          })}
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
