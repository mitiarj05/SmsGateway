'use client'

import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Send, CheckCircle2, AlertTriangle, Loader2, X, KeyRound, Trash2, Bell, Clock, RefreshCw } from 'lucide-react'
import DashboardShell from '../../components/DashboardShell'
import { Device } from '../../components/ui'

interface ApiClient {
  id: string
  nom: string
  cle_api: string
  created_at: string
}

export default function SettingsPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [refreshing, setRefreshing] = useState(false)

  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [quota, setQuota] = useState('10')
  const [alertThreshold, setAlertThreshold] = useState('10')
  const [expireHours, setExpireHours] = useState('24')
  const [savingQuota, setSavingQuota] = useState(false)
  const [savingAlert, setSavingAlert] = useState(false)
  const [savingExpire, setSavingExpire] = useState(false)

  const [clients, setClients] = useState<ApiClient[]>([])
  const [newClientName, setNewClientName] = useState('')
  const [creating, setCreating] = useState(false)
  const [newlyCreated, setNewlyCreated] = useState<string | null>(null)
  const [health, setHealth] = useState<{
    status: string; version: string; uptime_seconds: number
    checks: {
      supabase: { ok: boolean; latency_ms: number; error?: string }
      settings_table: boolean; fcm_configured: boolean
    }
  } | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [testNumber, setTestNumber] = useState('')
  const [testMessage, setTestMessage] = useState('')
  const [testApiKey, setTestApiKey] = useState('')
  const [sending, setSending] = useState(false)

  const fetchData = async () => {
    setRefreshing(true)
    try {
      const [devRes, cliRes, setRes] = await Promise.all([
        fetch('/api/devices'),
        fetch('/api/api-clients'),
        fetch('/api/settings'),
      ])
      const devData = await devRes.json()
      const cliData = await cliRes.json()
      if (devData.devices) setDevices(devData.devices)
      if (cliData.clients) setClients(cliData.clients)
      if (setRes.ok) {
        const setData = await setRes.json()
        if (typeof setData.settings?.sms_quota_per_hour === 'number') {
          setQuota(String(setData.settings.sms_quota_per_hour))
        }
        if (typeof setData.settings?.queue_alert_threshold === 'number') {
          setAlertThreshold(String(setData.settings.queue_alert_threshold))
        }
        if (typeof setData.settings?.max_pending_hours === 'number') {
          setExpireHours(String(setData.settings.max_pending_hours))
        }
      }
      try {
        const hRes = await fetch('/api/health')
        const hData = await hRes.json()
        if (hData?.status) setHealth(hData)
      } catch {
        setHealth(null)
      }
      setLastRefresh(new Date())
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
    const savedKey = localStorage.getItem('sms-gateway-api-key')
    if (savedKey) { setApiKey(savedKey); setTestApiKey(savedKey) }
  }, [])

  function showToast(type: 'success' | 'error', text: string) {
    setToast({ type, text })
    setTimeout(() => setToast(null), 4000)
  }

  function saveApiKey(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const trimmed = apiKey.trim()
    setApiKey(trimmed)
    localStorage.setItem('sms-gateway-api-key', trimmed)
    setTestApiKey(trimmed)
    setSaving(false)
    showToast('success', 'Clé API enregistrée localement')
  }

  async function saveQuota(e: React.FormEvent) {
    e.preventDefault()
    setSavingQuota(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cle: 'sms_quota_per_hour', valeur: Number(quota) }),
      })
      const data = await res.json()
      if (res.ok) {
        setQuota(String(data.settings.sms_quota_per_hour))
        showToast('success', `Quota SMS/heure : ${data.settings.sms_quota_per_hour}`)
      } else {
        showToast('error', data.error ?? 'Erreur enregistrement')
      }
    } catch {
      showToast('error', 'Erreur réseau')
    } finally {
      setSavingQuota(false)
    }
  }

  async function saveAlert(e: React.FormEvent) {
    e.preventDefault()
    setSavingAlert(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cle: 'queue_alert_threshold', valeur: Number(alertThreshold) }),
      })
      const data = await res.json()
      if (res.ok) {
        setAlertThreshold(String(data.settings.queue_alert_threshold))
        showToast('success', `Seuil d'alerte : ${data.settings.queue_alert_threshold} tâches`)
      } else {
        showToast('error', data.error ?? 'Erreur enregistrement')
      }
    } catch {
      showToast('error', 'Erreur réseau')
    } finally {
      setSavingAlert(false)
    }
  }

  async function saveExpire(e: React.FormEvent) {
    e.preventDefault()
    setSavingExpire(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cle: 'max_pending_hours', valeur: Number(expireHours) }),
      })
      const data = await res.json()
      if (res.ok) {
        setExpireHours(String(data.settings.max_pending_hours))
        showToast('success', `Expiration : ${data.settings.max_pending_hours} h`)
      } else {
        showToast('error', data.error ?? 'Erreur enregistrement')
      }
    } catch {
      showToast('error', 'Erreur réseau')
    } finally {
      setSavingExpire(false)
    }
  }

  async function createClient(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setNewlyCreated(null)
    try {
      const res = await fetch('/api/api-clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: newClientName }),
      })
      const data = await res.json()
      if (res.ok) {
        setNewlyCreated(data.client.cle_api)
        setNewClientName('')
        fetchData()
        showToast('success', 'Clé créée — copiez-la maintenant')
      } else {
        showToast('error', data.error ?? 'Erreur création')
      }
    } catch {
      showToast('error', 'Erreur réseau')
    } finally {
      setCreating(false)
    }
  }

  async function revokeClient(id: string, nom: string) {
    if (!confirm(`Révoquer la clé « ${nom} » ?`)) return
    try {
      const res = await fetch(`/api/api-clients/${id}`, { method: 'DELETE' })
      if (res.ok) {
        showToast('success', 'Clé révoquée')
        fetchData()
      } else {
        showToast('error', 'Erreur révocation')
      }
    } catch {
      showToast('error', 'Erreur réseau')
    }
  }

  async function sendTestSMS(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testNumber, message: testMessage, cle_api: testApiKey.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast('success', `SMS mis en file d'attente → ${testNumber}`)
        setModalOpen(false)
        setTestMessage('')
      } else {
        showToast('error', data.error ?? 'Erreur lors de l’envoi')
      }
    } catch {
      showToast('error', 'Erreur réseau')
    } finally {
      setSending(false)
    }
  }

  return (
    <DashboardShell
      title="Paramètres"
      subtitle={`actualisé à ${lastRefresh.toLocaleTimeString('fr-FR')}`}
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
      <div className="grid max-w-4xl grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Clé API locale */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
          <div className="mb-4 flex items-center gap-2">
            <SettingsIcon className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Clé API (envoi SMS)</h2>
          </div>
          <form onSubmit={saveApiKey} className="space-y-4">
            <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
            <p className="-mt-2 text-xs text-zinc-400">Stockée uniquement dans le navigateur.</p>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Enregistrer
            </button>
          </form>
        </section>

        {/* Quota SMS */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
          <h2 className="mb-1 text-sm font-bold text-zinc-900 dark:text-white">Quota SMS / heure / device</h2>
          <p className="mb-4 text-xs text-zinc-400">Limite stricte : au-delà, l&apos;envoi répond 429 et les téléphones ne prennent plus de tâches pendant 1 h.</p>
          <form onSubmit={saveQuota} className="flex gap-2">
            <input type="number" min={1} max={1000} value={quota} onChange={(e) => setQuota(e.target.value)}
              className="w-28 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
            <button type="submit" disabled={savingQuota}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {savingQuota ? '…' : 'Enregistrer'}
            </button>
          </form>
        </section>

        {/* Seuil alerte */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
          <div className="mb-1 flex items-center gap-2">
            <Bell className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Seuil d'alerte file d'attente</h2>
          </div>
          <p className="mb-4 text-xs text-zinc-400">Le dashboard affiche une alerte au-delà de ce nombre de tâches en attente.</p>
          <form onSubmit={saveAlert} className="flex gap-2">
            <input type="number" min={1} max={1000} value={alertThreshold} onChange={(e) => setAlertThreshold(e.target.value)}
              className="w-28 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
            <button type="submit" disabled={savingAlert}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {savingAlert ? '…' : 'Enregistrer'}
            </button>
          </form>
        </section>

        {/* Expiration PENDING */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
          <div className="mb-1 flex items-center gap-2">
            <Clock className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Expiration des tâches en attente</h2>
          </div>
          <p className="mb-4 text-xs text-zinc-400">Une tâche PENDING non prise par un device sous ce délai passe en Échoué.</p>
          <form onSubmit={saveExpire} className="flex gap-2">
            <input type="number" min={1} max={1000} value={expireHours} onChange={(e) => setExpireHours(e.target.value)}
              className="w-28 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
            <span className="self-center text-xs text-zinc-400">heures</span>
            <button type="submit" disabled={savingExpire}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {savingExpire ? '…' : 'Enregistrer'}
            </button>
          </form>
        </section>

        {/* Santé du système */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
          <div className="mb-4 flex items-center gap-2">
            <span className={`relative flex h-2.5 w-2.5`}>
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 ${health?.status === 'ok' ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${health?.status === 'ok' ? 'bg-emerald-500' : 'bg-red-500'}`} />
            </span>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Santé du système</h2>
            {health && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                v{health.version}
              </span>
            )}
          </div>
          {!health ? (
            <p className="text-xs text-zinc-400">Chargement…</p>
          ) : (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Supabase</dt>
                <dd className={`font-semibold ${health.checks.supabase.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {health.checks.supabase.ok ? `OK · ${health.checks.supabase.latency_ms} ms` : `KO${health.checks.supabase.error ? ` · ${health.checks.supabase.error}` : ''}`}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Table settings</dt>
                <dd className="font-semibold text-zinc-800 dark:text-zinc-200">{health.checks.settings_table ? 'présente' : 'absente'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Push FCM</dt>
                <dd className="font-semibold text-zinc-800 dark:text-zinc-200">{health.checks.fcm_configured ? 'configuré' : 'non configuré'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Uptime serveur</dt>
                <dd className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {Math.floor(health.uptime_seconds / 3600)} h {Math.floor((health.uptime_seconds % 3600) / 60)} min
                </dd>
              </div>
            </dl>
          )}
        </section>

        {/* Clés API serveur */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Clés API serveur</h2>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{clients.length}</span>
          </div>
          <form onSubmit={createClient} className="mb-4 flex gap-2">
            <input type="text" required placeholder="Nom du client…" value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
            <button type="submit" disabled={creating}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
              {creating ? '…' : 'Créer'}
            </button>
          </form>
          {newlyCreated && (
            <div className="mb-4 rounded-lg bg-amber-50 p-3 ring-1 ring-amber-600/20 dark:bg-amber-500/10">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Copiez cette clé maintenant (affichée une seule fois) :</p>
              <code className="mt-1 block break-all font-mono text-xs text-amber-900 dark:text-amber-200">{newlyCreated}</code>
            </div>
          )}
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {clients.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{c.nom}</p>
                  <p className="font-mono text-xs text-zinc-400">{c.cle_api}</p>
                </div>
                <button onClick={() => revokeClient(c.id, c.nom)} title="Révoquer"
                  className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:border-zinc-700 dark:text-zinc-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
            {clients.length === 0 && <p className="py-4 text-center text-xs text-zinc-400">Aucune clé API.</p>}
          </ul>
        </section>
      </div>

      {/* Modal nouveau SMS */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-sm" onClick={() => !sending && setModalOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 dark:ring-1 dark:ring-zinc-800" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Envoyer un SMS</h3>
              <button onClick={() => !sending && setModalOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={sendTestSMS} className="space-y-4">
              <input type="tel" required placeholder="+261328725411" value={testNumber}
                onChange={(e) => setTestNumber(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
              <textarea required rows={3} maxLength={160} placeholder="Votre message…" value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
              <p className="text-right text-[11px] text-zinc-400">{testMessage.length}/160</p>
              <input type="password" required value={testApiKey}
                onChange={(e) => setTestApiKey(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
              <div className="flex gap-2">
                <button type="button" onClick={() => !sending && setModalOpen(false)}
                  className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm dark:border-zinc-700 dark:text-zinc-300">Annuler</button>
                <button type="submit" disabled={sending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white disabled:opacity-60">
                  {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi…</> : <><Send className="h-4 w-4" /> Envoyer</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.text}
        </div>
      )}
    </DashboardShell>
  )
}
