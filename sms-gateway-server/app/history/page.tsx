'use client'

import { useState, useEffect } from 'react'
import { History as HistoryIcon, Search, Send, Download, RotateCcw, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react'
import DashboardShell from '../../components/DashboardShell'
import { Device, Task, TASK_STATUS, StatusBadge, formatTime } from '../../components/ui'

type DateFilter = 'today' | '7d' | '30d' | 'all'

export default function HistoryPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [testNumber, setTestNumber] = useState('')
  const [testMessage, setTestMessage] = useState('')
  const [testApiKey, setTestApiKey] = useState('')
  const [sending, setSending] = useState(false)

  function showToast(type: 'success' | 'error', text: string) {
    setToast({ type, text })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchData = async (silent = false) => {
    if (!silent) setRefreshing(true)
    try {
      const [devRes, taskRes] = await Promise.all([
        fetch('/api/devices'),
        fetch('/api/tasks'),
      ])
      const devData = await devRes.json()
      const taskData = await taskRes.json()
      if (devData.devices) setDevices(devData.devices)
      if (taskData.tasks) setTasks((taskData.tasks as Task[]).filter((t) => ['SENT', 'FAILED'].includes(t.statut)))
      setLastRefresh(new Date())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    const savedKey = localStorage.getItem('sms-gateway-api-key')
    if (savedKey) setTestApiKey(savedKey)
    fetchData(true)
    const interval = setInterval(() => fetchData(true), 10000)
    return () => clearInterval(interval)
  }, [])

  async function sendTestSMS(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
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
        showToast('error', data?.error ?? 'Erreur lors de l’envoi')
      }
    } catch {
      showToast('error', 'Erreur réseau')
    } finally {
      setSending(false)
    }
  }

  async function retryTask(id: string) {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        showToast('success', 'SMS relancé')
        fetchData(true)
      } else {
        showToast('error', data.error ?? 'Impossible de relancer')
      }
    } catch {
      showToast('error', 'Erreur réseau')
    }
  }

  function exportCSV() {
    // Export serveur : historique complet (pas limité aux 50 lignes chargées),
    // mêmes filtres que l'écran. Le cookie de session admin suit automatiquement.
    const params = new URLSearchParams()
    params.set('statut', 'SENT,FAILED')
    if (search.trim()) params.set('q', search.trim())
    if (dateFilter === 'today') {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      params.set('from', d.toISOString())
    } else if (dateFilter === '7d' || dateFilter === '30d') {
      const days = dateFilter === '7d' ? 7 : 30
      params.set('from', new Date(Date.now() - days * 86400_000).toISOString())
    }
    window.location.href = `/api/tasks/export?${params.toString()}`
  }

  const filteredTasks = tasks.filter((t) => {
    const matchSearch =
      t.numero_destinataire.includes(search) || t.message.toLowerCase().includes(search.toLowerCase())
    if (!matchSearch) return false
    if (dateFilter === 'all') return true
    const days = dateFilter === 'today' ? 1 : dateFilter === '7d' ? 7 : 30
    return Date.now() - new Date(t.created_at).getTime() <= days * 86400_000
  })

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-950"><p className="text-sm text-zinc-500">Chargement…</p></div>
  }

  return (
    <DashboardShell
      title="Historique"
      subtitle={`${filteredTasks.length} tâche(s) · actualisé à ${lastRefresh.toLocaleTimeString('fr-FR')}`}
      actions={
        <>
          <button onClick={() => fetchData()}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-600 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Actualiser
          </button>
          <button onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
            <Send className="h-4 w-4" /> Nouveau SMS
          </button>
        </>
      }
    >
      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
        <div className="flex flex-col gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <HistoryIcon className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Historique SMS</h2>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {filteredTasks.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <input type="text" placeholder="Rechercher…" value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-40 rounded-lg border border-zinc-200 bg-white py-1.5 pl-9 pr-3 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>
            <div className="flex gap-1">
              {(['all', 'today', '7d', '30d'] as DateFilter[]).map((f) => (
                <button key={f} onClick={() => setDateFilter(f)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                    dateFilter === f
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                      : 'text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                  }`}>
                  {f === 'all' ? 'Tout' : f === 'today' ? "Auj." : f === '7d' ? '7 j' : '30 j'}
                </button>
              ))}
            </div>
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800">
                <th className="px-5 py-3">Destinataire</th>
                <th className="px-5 py-3">Message</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3">Erreur</th>
                <th className="px-5 py-3">Envoyé le</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
              {filteredTasks.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                  <td className="px-5 py-3.5"><span className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">{t.numero_destinataire}</span></td>
                  <td className="max-w-xs px-5 py-3.5"><p className="truncate text-xs text-zinc-500 dark:text-zinc-400" title={t.message}>{t.message}</p></td>
                  <td className="px-5 py-3.5"><StatusBadge status={t.statut} config={TASK_STATUS} /></td>
                  <td className="max-w-[200px] px-5 py-3.5"><p className="truncate text-xs text-red-500" title={t.error_message ?? ''}>{t.error_message ?? '—'}</p></td>
                  <td className="px-5 py-3.5 text-xs text-zinc-400">{formatTime(t.created_at)}</td>
                  <td className="px-5 py-3.5 text-right">
                    {t.statut === 'FAILED' && (
                      <button onClick={() => retryTask(t.id)} title="Relancer ce SMS"
                        className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 hover:bg-blue-50 hover:text-blue-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-blue-500/10">
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

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
              <input type="password" required value={testApiKey}
                onChange={(e) => setTestApiKey(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
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

      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.text}
        </div>
      )}
    </DashboardShell>
  )
}
