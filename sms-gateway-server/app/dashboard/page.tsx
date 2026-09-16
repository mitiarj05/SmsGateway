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
import DashboardShell from '../../components/DashboardShell'
import {
  DEVICE_STATUS, TASK_STATUS, StatusBadge, Toast, Modal, EmptyState, Progress,
} from '../../components/ui'

interface Device {
  id: string; nom: string; statut: string; sms_last_hour: number
  derniere_activite: string | null
}
interface Task {
  id: string; numero_destinataire: string; message: string; statut: string
  device_id: string | null; created_at: string; updated_at: string
  error_message?: string | null; erreur?: string | null
}
interface Stats {
  online_devices: number; tasks_sent: number; tasks_pending: number; tasks_failed: number
}
interface HourlyPoint { hour: string; count: number }

const FEED_ICONS: Record<string, React.ReactNode> = {
  SENT: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
  FAILED: <XCircle className="h-3.5 w-3.5 text-red-500" />,
  SENDING: <Clock className="h-3.5 w-3.5 text-blue-500" />,
  PENDING: <Clock className="h-3.5 w-3.5 text-amber-500" />,
}

export default function DashboardPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [hourly, setHourly] = useState<HourlyPoint[]>([])
  const [quota, setQuota] = useState(50)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [detailTask, setDetailTask] = useState<Task | null>(null)
  const [form, setForm] = useState({ to: '', message: '', cle_api: '' })
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [darkMode] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  )

  const showToast = useCallback((type: 'success' | 'error', text: string) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const computeHourly = useCallback((list: Task[]): HourlyPoint[] => {
    const buckets = new Map<string, number>()
    const now = new Date()
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3600_000)
      buckets.set(`${d.getHours()}h`, 0)
    }
    list.forEach((t) => {
      const d = new Date(t.created_at)
      if (now.getTime() - d.getTime() <= 24 * 3600_000) {
        const k = `${d.getHours()}h`
        if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + 1)
      }
    })
    return Array.from(buckets, ([hour, count]) => ({ hour, count }))
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const [d, t, s, q] = await Promise.all([
        fetch('/api/devices'), fetch('/api/tasks'), fetch('/api/stats'), fetch('/api/settings'),
      ])
      const [dd, td, sd] = [await d.json(), await t.json(), await s.json()]
      if (dd.devices) setDevices(dd.devices)
      // Le serveur renvoie error_message : on l'expose aussi en `erreur`.
      const taskList: Task[] = (td.tasks ?? []).map((task: Task) => ({
        ...task, erreur: task.erreur ?? task.error_message ?? null,
      }))
      if (td.tasks) setTasks(taskList)
      if (sd.stats) setStats(sd.stats)
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
            setHourly(hd.hourly)
            setLastRefresh(new Date())
            return
          }
        }
        setHourly(computeHourly(taskList))
      } catch {
        setHourly(computeHourly(taskList))
      }
      setLastRefresh(new Date())
    } catch {
      showToast('error', 'Serveur injoignable')
    } finally {
      setLoading(false)
    }
  }, [computeHourly, showToast])

  useEffect(() => {
    const savedKey = localStorage.getItem('sms-gateway-api-key')
    if (savedKey) setForm((f) => ({ ...f, cle_api: savedKey }))
    fetchData()
    const i = setInterval(() => fetchData(), 3000)
    return () => clearInterval(i)
  }, [fetchData])

  async function sendSMS(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: form.to, message: form.message, cle_api: form.cle_api.trim() }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok) {
        showToast('success', `SMS mis en file → ${form.to}`)
        setModalOpen(false)
        setForm({ to: '', message: '', cle_api: form.cle_api })
        fetchData()
      } else {
        showToast('error', data?.error ?? 'Erreur lors de l’envoi')
      }
    } catch {
      showToast('error', 'Erreur réseau')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const recentTasks = [...tasks].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 8)
  const feed = recentTasks.slice(0, 6)
  const detailDevice = detailTask?.device_id ? devices.find((d) => d.id === detailTask.device_id) : null
  const chartGrid = darkMode ? '#3f3f46' : '#e4e4e7'
  const chartTick = darkMode ? '#a1a1aa' : '#71717a'

  return (
    <DashboardShell
      title="Tableau de bord"
      subtitle={`Actualisé à ${lastRefresh.toLocaleTimeString('fr-FR')} · auto 3 s`}
      actions={
        <>
          <button onClick={() => fetchData()}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-600 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
            <RefreshCw className="h-4 w-4" /> Actualiser
          </button>
          <button onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
            <Send className="h-4 w-4" /> Nouveau SMS
          </button>
        </>
      }
    >
      {/* KPI */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: <Smartphone className="h-5 w-5 text-emerald-600" />, label: 'Appareils en ligne', value: stats?.online_devices ?? 0, sub: `sur ${devices.length} enregistré(s)`, accent: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { icon: <CheckCircle2 className="h-5 w-5 text-blue-600" />, label: 'SMS envoyés', value: stats?.tasks_sent ?? 0, sub: 'toutes périodes', accent: 'bg-blue-50 dark:bg-blue-500/10' },
          { icon: <Clock className="h-5 w-5 text-amber-600" />, label: 'En file d’attente', value: stats?.tasks_pending ?? 0, sub: 'en attente d’assignation', accent: 'bg-amber-50 dark:bg-amber-500/10' },
          { icon: <XCircle className="h-5 w-5 text-red-600" />, label: 'Échecs', value: stats?.tasks_failed ?? 0, sub: 'à traiter', accent: 'bg-red-50 dark:bg-red-500/10' },
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
            {hourly.reduce((a, p) => a + p.count, 0)} SMS
          </span>
        </div>
        <div className="h-56 w-full" suppressHydrationWarning>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourly} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: chartTick, fontSize: 11 }} tickLine={false} axisLine={{ stroke: chartGrid }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} tick={{ fill: chartTick, fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v) => [`${v ?? 0} SMS`, 'Envoyés']} />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#g)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Devices + Activité */}
      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800 xl:col-span-2">
          <div className="flex items-center gap-2 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
            <Signal className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Appareils connectés</h2>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{devices.length}</span>
          </div>
          {devices.length === 0 ? (
            <EmptyState icon={<Smartphone className="h-9 w-9" />} title="Aucun appareil" hint="Installez l'app Android et associez-la au serveur." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800">
                  <th className="px-5 py-3">Appareil</th><th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3 w-52">SMS/h</th><th className="px-5 py-3">Activité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
                {devices.map((d) => (
                  <tr key={d.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                          <Smartphone className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                        </div>
                        <p className="font-medium text-zinc-800 dark:text-zinc-200">{d.nom}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={d.statut} config={DEVICE_STATUS} /></td>
                    <td className="px-5 py-3.5">
                      <Progress value={d.sms_last_hour} max={quota} showValue />
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
            {feed.length === 0 ? (
              <EmptyState icon={<Inbox className="h-8 w-8" />} title="Aucune activité" />
            ) : feed.map((t) => (
              <button key={t.id} onClick={() => setDetailTask(t)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                {FEED_ICONS[t.statut] ?? <Clock className="h-3.5 w-3.5 text-zinc-400" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-200">{t.numero_destinataire}</p>
                  <p className="truncate text-[11px] text-zinc-400">{TASK_STATUS[t.statut]?.label ?? t.statut}</p>
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
          {recentTasks.map((t) => (
            <button key={t.id} onClick={() => setDetailTask(t)}
              className="flex w-full items-center gap-4 px-5 py-3 text-left hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
              <span className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">{t.numero_destinataire}</span>
              <span className="min-w-0 flex-1 truncate text-xs text-zinc-500 dark:text-zinc-400">{t.message}</span>
              {t.erreur && (
                <span className="hidden max-w-40 truncate text-[11px] text-red-500 md:inline" title={t.erreur}>{t.erreur}</span>
              )}
              <StatusBadge status={t.statut} config={TASK_STATUS} />
              <span className="text-xs text-zinc-400">{new Date(t.created_at).toLocaleTimeString('fr-FR')}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ===== MODALE : fiche tâche (inspection) ===== */}
      <Modal open={!!detailTask} onClose={() => setDetailTask(null)} wide
        title="Détail de la tâche" subtitle="Traçabilité complète pour l'audit et le debug anti-doublon">
        {detailTask && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <StatusBadge status={detailTask.statut} config={TASK_STATUS} />
              {detailTask.erreur && (
                <span className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
                  {detailTask.erreur}
                </span>
              )}
            </div>
            <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/60">
              <p className="text-lg font-bold text-zinc-900 dark:text-white">{detailTask.numero_destinataire}</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{detailTask.message}</p>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-xs">
              {[
                ['Créée le', new Date(detailTask.created_at).toLocaleString('fr-FR')],
                ['Mise à jour', new Date(detailTask.updated_at).toLocaleString('fr-FR')],
                ['Appareil assigné', detailDevice?.nom ?? (detailTask.device_id ? 'inconnu' : '—')],
                ['Statut serveur', detailTask.statut],
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
              <code className="flex-1 truncate font-mono text-[11px] text-zinc-600 dark:text-zinc-300">{detailTask.id}</code>
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-400">
              Cet identifiant garantit qu&apos;une re-délivrance (coupure réseau, redémarrage) ne provoque
              jamais un double envoi : le serveur rejette les accusés portant un ID déjà traité.
            </p>
          </div>
        )}
      </Modal>

      {/* ===== MODALE : envoi ===== */}
      <Modal open={modalOpen} onClose={() => !sending && setModalOpen(false)}
        title="Envoyer un SMS" subtitle="La tâche sera ajoutée à la file d'attente">
        <form onSubmit={sendSMS} className="space-y-4">
          <input type="tel" required placeholder="+261328725411" value={form.to}
            onChange={(e) => setForm({ ...form, to: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
          <div>
            <textarea required rows={3} maxLength={160} placeholder="Votre message…" value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
            <p className="mt-1 text-right text-[11px] text-zinc-400">{form.message.length}/160</p>
          </div>
          <input type="password" required value={form.cle_api}
            onChange={(e) => setForm({ ...form, cle_api: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
          <button type="submit" disabled={sending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? 'Envoi…' : 'Envoyer'}
          </button>
        </form>
      </Modal>

      <Toast toast={toast} />
    </DashboardShell>
  )
}
