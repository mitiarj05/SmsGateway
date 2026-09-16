'use client'

import { useState, useEffect, useCallback } from 'react'
import { Smartphone, CheckCircle2, Clock, XCircle, BarChart3, Send, Loader2, AlertTriangle, History as HistoryIcon } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import DashboardShell from '../../components/DashboardShell'
import { Device, Task, Stats, HourlyPoint, KpiCard, TASK_STATUS, StatusBadge, formatTime, timeAgo } from '../../components/ui'

export default function DashboardOverviewPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<Stats['stats'] | null>(null)
  const [hourly, setHourly] = useState<HourlyPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [darkMode, setDarkMode] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [testNumber, setTestNumber] = useState('')
  const [testMessage, setTestMessage] = useState('')
  const [testApiKey, setTestApiKey] = useState('')
  const [sending, setSending] = useState(false)
  const [queueThreshold, setQueueThreshold] = useState(10)
  const [sendError, setSendError] = useState<string | null>(null)

  useEffect(() => {
    setDarkMode(document.documentElement.classList.contains('dark'))
  }, [])

  useEffect(() => {
    const savedKey = localStorage.getItem('sms-gateway-api-key')
    if (savedKey) setTestApiKey(savedKey)
  }, [])

  const computeHourly = useCallback((taskList: Task[]): HourlyPoint[] => {
    const buckets = new Map<string, number>()
    const now = new Date()
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3600_000)
      buckets.set(`${d.getHours()}h`, 0)
    }
    taskList.forEach((t) => {
      const d = new Date(t.created_at)
      if (now.getTime() - d.getTime() <= 24 * 3600_000) {
        const key = `${d.getHours()}h`
        if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1)
      }
    })
    return Array.from(buckets, ([hour, count]) => ({ hour, count }))
  }, [])

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true)
    try {
      const [devRes, taskRes, statRes] = await Promise.all([
        fetch('/api/devices'),
        fetch('/api/tasks'),
        fetch('/api/stats'),
      ])
      const devData = await devRes.json()
      const taskData = await taskRes.json()
      const statData = await statRes.json()
      const taskList: Task[] = taskData.tasks ?? []
      if (devData.devices) setDevices(devData.devices)
      if (taskList.length) setTasks(taskList)
      if (statData.stats) setStats(statData.stats)

      try {
        const setRes = await fetch('/api/settings')
        if (setRes.ok) {
          const setData = await setRes.json()
          if (typeof setData.settings?.queue_alert_threshold === 'number') {
            setQueueThreshold(setData.settings.queue_alert_threshold)
          }
        }
      } catch {
        /* repli : seuil par défaut */
      }

      try {
        const actRes = await fetch('/api/stats/hourly')
        if (actRes.ok) {
          const actData = await actRes.json()
          if (actData.hourly) setHourly(actData.hourly)
        } else {
          setHourly(computeHourly(taskList))
        }
      } catch {
        setHourly(computeHourly(taskList))
      }

      setLastRefresh(new Date())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [computeHourly])

  useEffect(() => {
    fetchData(true)
    const interval = setInterval(() => fetchData(true), 3000)
    return () => clearInterval(interval)
  }, [fetchData])

  async function sendTestSMS(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setSendError(null)
    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testNumber, message: testMessage, cle_api: testApiKey.trim() }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok) {
        setModalOpen(false)
        setTestMessage('')
        fetchData(true)
      } else {
        setSendError(data?.error ?? 'Erreur lors de l’envoi')
      }
    } catch {
      setSendError('Serveur injoignable')
    } finally {
      setSending(false)
    }
  }

  const total24h = hourly.reduce((acc, p) => acc + p.count, 0)
  const chartGrid = darkMode ? '#3f3f46' : '#e4e4e7'
  const chartTick = darkMode ? '#a1a1aa' : '#71717a'
  const tooltipStyle = darkMode
    ? { backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, color: '#fafafa', fontSize: 12 }
    : { backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 12, fontSize: 12 }

  /* ---------- Alertes ---------- */
  const OFFLINE_ALERT_MIN = 10
  const staleDevices = devices.filter((d) => {
    if (!d.derniere_activite) return true
    return Date.now() - new Date(d.derniere_activite).getTime() > OFFLINE_ALERT_MIN * 60_000
  })
  const queueCount = stats?.tasks_pending ?? 0
  const showQueueAlert = queueCount >= queueThreshold

  /* ---------- Camembert statuts ---------- */
  const lastTasks = tasks.slice(0, 5)

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <DashboardShell
      devices={devices} lastRefresh={lastRefresh} refreshing={refreshing}
      onRefresh={() => fetchData()} onNewSMS={() => setModalOpen(true)}
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<Smartphone className="h-5 w-5 text-emerald-600" />}
          label="Appareils en ligne" value={stats?.online_devices ?? 0}
          sub={`sur ${devices.length} enregistré(s)`}
          accent="bg-emerald-50 dark:bg-emerald-500/10"
          dark="bg-white ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800"
        />
        <KpiCard
          icon={<CheckCircle2 className="h-5 w-5 text-blue-600" />}
          label="SMS envoyés" value={stats?.tasks_sent ?? 0}
          sub="toutes périodes confondues"
          accent="bg-blue-50 dark:bg-blue-500/10"
          dark="bg-white ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800"
        />
        <KpiCard
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          label="En file d'attente" value={stats?.tasks_pending ?? 0}
          sub="en attente d'assignation"
          accent="bg-amber-50 dark:bg-amber-500/10"
          dark="bg-white ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800"
        />
        <KpiCard
          icon={<XCircle className="h-5 w-5 text-red-600" />}
          label="Échecs" value={stats?.tasks_failed ?? 0}
          sub="à traiter manuellement"
          accent="bg-red-50 dark:bg-red-500/10"
          dark="bg-white ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800"
        />
      </div>

      {/* Graphique 24h */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Activité SMS — dernières 24 h</h2>
          </div>
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            {total24h} SMS
          </span>
        </div>

        {hourly.length === 0 ? (
          <div className="flex h-56 items-center justify-center">
            <p className="text-sm text-zinc-400">Pas encore de données sur les 24 dernières heures.</p>
          </div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourly} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="smsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                <XAxis dataKey="hour" tick={{ fill: chartTick, fontSize: 11 }} tickLine={false} axisLine={{ stroke: chartGrid }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fill: chartTick, fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ fontWeight: 600 }} formatter={(value) => [`${value ?? 0} SMS`, 'Envoyés']} />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#smsGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* ================= ALERTES ================= */}
      {(showQueueAlert || staleDevices.length > 0) && (
        <div className="space-y-2">
          {showQueueAlert && (
            <div className="flex items-center gap-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-600/20 dark:bg-amber-500/10 dark:ring-amber-400/20">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                File d'attente élevée : {queueCount} tâche(s) en attente (seuil : {queueThreshold})
              </p>
            </div>
          )}
          {staleDevices.map((d) => (
            <div key={d.id} className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 ring-1 ring-red-600/20 dark:bg-red-500/10 dark:ring-red-400/20">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                {d.nom} : inactif depuis {timeAgo(d.derniere_activite)} (&gt; {OFFLINE_ALERT_MIN} min)
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ================= DERNIÈRES TÂCHES ================= */}
      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
          <div className="flex items-center gap-2 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
            <HistoryIcon className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Dernières tâches</h2>
          </div>
          {lastTasks.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-400">Aucune tâche pour le moment.</p>
          ) : (
            <ul className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
              {lastTasks.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">{t.numero_destinataire}</p>
                    <p className="truncate text-xs text-zinc-400" title={t.message}>{t.message}</p>
                  </div>
                  <StatusBadge status={t.statut} config={TASK_STATUS} />
                </li>
              ))}
            </ul>
          )}
        </section>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-sm" onClick={() => !sending && setModalOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 dark:ring-1 dark:ring-zinc-800" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Envoyer un SMS</h3>
            <form onSubmit={sendTestSMS} className="mt-4 space-y-4">
              <input type="tel" required placeholder="+261328725411" value={testNumber}
                onChange={(e) => setTestNumber(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
              <textarea required rows={3} maxLength={160} value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
              <p className="text-right text-[11px] text-zinc-400">{testMessage.length}/160</p>
              <input type="password" required value={testApiKey}
                onChange={(e) => setTestApiKey(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
              {sendError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 ring-1 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20">
                  {sendError}
                </p>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={() => !sending && setModalOpen(false)}
                  className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm dark:border-zinc-700 dark:text-zinc-300">Annuler</button>
                <button type="submit" disabled={sending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white disabled:opacity-60">
                  <Send className="h-4 w-4" /> {sending ? 'Envoi…' : 'Envoyer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
