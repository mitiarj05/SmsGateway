'use client'

import { useState, useEffect } from 'react'
import { Smartphone, Signal, Send, Bell, Power, CheckCircle2, AlertTriangle, X, RefreshCw, Trash2 } from 'lucide-react'
import DashboardShell from '../../components/DashboardShell'
import { Device, DEVICE_STATUS, StatusBadge, timeAgo, SMS_QUOTA_PER_HOUR, ConfirmDialog } from '../../components/ui'

interface DeviceDetails {
  id: string
  nom: string
  statut: string
  fcm_token: string | null
  fcm_present: boolean
  sms_last_hour: number
  derniere_activite: string | null
  created_at: string
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [detailDevice, setDetailDevice] = useState<DeviceDetails | null>(null)
  const [pinging, setPinging] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Device | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [testNumber, setTestNumber] = useState('')
  const [testMessage, setTestMessage] = useState('')
  const [testApiKey, setTestApiKey] = useState('')
  const [sending, setSending] = useState(false)
  const [quota, setQuota] = useState(SMS_QUOTA_PER_HOUR)

  function showToast(type: 'success' | 'error', text: string) {
    setToast({ type, text })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchData = async (silent = false) => {
    if (!silent) setRefreshing(true)
    try {
      const [res, setRes] = await Promise.all([
        fetch('/api/devices'),
        fetch('/api/settings'),
      ])
      const data = await res.json()
      if (data.devices) setDevices(data.devices)
      if (setRes.ok) {
        const setData = await setRes.json()
        if (typeof setData.settings?.sms_quota_per_hour === 'number') {
          setQuota(setData.settings.sms_quota_per_hour)
        }
      }
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
    const interval = setInterval(() => fetchData(true), 3000)
    return () => clearInterval(interval)
  }, [])

  async function openDetails(id: string) {
    try {
      const res = await fetch(`/api/devices/${id}`)
      const data = await res.json()
      if (data.device) setDetailDevice(data.device)
    } catch {
      showToast('error', 'Impossible de charger les détails')
    }
  }

  async function toggleDevice(id: string, current: string) {
    const next = current === 'DISABLED' ? 'OFFLINE' : 'DISABLED'
    try {
      const res = await fetch(`/api/devices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: next }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast('success', next === 'DISABLED' ? 'Device désactivé' : 'Device réactivé')
        setDetailDevice(null)
        fetchData(true)
      } else {
        showToast('error', data.error ?? 'Erreur')
      }
    } catch {
      showToast('error', 'Erreur réseau')
    }
  }

  async function deleteDevice() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/devices/${deleteTarget.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (res.ok) {
        showToast('success', `« ${deleteTarget.nom} » supprimé`)
        setDeleteTarget(null)
        setDetailDevice(null)
        fetchData(true)
      } else {
        showToast('error', data?.error ?? 'Suppression impossible')
      }
    } catch {
      showToast('error', 'Erreur réseau')
    } finally {
      setDeleting(false)
    }
  }

  async function pingDevice(id: string) {    setPinging(id)
    try {
      const res = await fetch(`/api/devices/${id}/ping`, { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.ping_sent) {
        showToast('success', `Ping FCM envoyé à ${data.device?.nom ?? id}`)
      } else {
        showToast('error', data.error ?? 'Ping échoué')
      }
    } catch {
      showToast('error', 'Erreur réseau')
    } finally {
      setPinging(null)
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500">Chargement des appareils…</p>
      </div>
    )
  }

  return (
    <DashboardShell
      title="Appareils"
      subtitle={`${devices.length} enregistré(s) · actualisé à ${lastRefresh.toLocaleTimeString('fr-FR')}`}
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
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Signal className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Appareils connectés</h2>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {devices.length}
            </span>
          </div>
        </div>

        {devices.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Smartphone className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Aucun appareil enregistré</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800">
                  <th className="px-5 py-3">Appareil</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3">Push</th>
                  <th className="px-5 py-3 w-64">Utilisation (SMS/h, quota {quota})</th>
                  <th className="px-5 py-3">Dernière activité</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
                {devices.map((d) => {
                  const pct = Math.min(100, Math.round(((d.sms_last_hour ?? 0) / quota) * 100))
                  const barColor = pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-amber-500' : 'bg-blue-500'
                  return (
                    <tr key={d.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                      <td className="px-5 py-3.5">
                        <button onClick={() => openDetails(d.id)} className="flex items-center gap-3 text-left">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                            <Smartphone className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                          </div>
                          <span className="font-medium text-zinc-800 underline-offset-2 hover:underline dark:text-zinc-200">{d.nom}</span>
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={d.statut} config={DEVICE_STATUS} />
                      </td>
                      <td className="px-5 py-3.5">
                        {d.fcm_token
                          ? <span title="Token FCM présent" className="text-emerald-500">✅</span>
                          : <span title="Aucun token FCM" className="text-zinc-400">❌</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-10 text-right text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                            {d.sms_last_hour ?? 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-zinc-400">{timeAgo(d.derniere_activite)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => pingDevice(d.id)} disabled={pinging === d.id || !d.fcm_token}
                            title="Envoyer un push test"
                            className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800">
                            <Bell className={`h-4 w-4 ${pinging === d.id ? 'animate-pulse' : ''}`} />
                          </button>
                          <button onClick={() => toggleDevice(d.id, d.statut)}
                            title={d.statut === 'DISABLED' ? 'Réactiver' : 'Désactiver'}
                            className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800">
                            <Power className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeleteTarget(d)}
                            title="Supprimer l'appareil"
                            className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-red-500/10 dark:hover:text-red-400">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modale détails */}
      {detailDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-sm" onClick={() => setDetailDevice(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 dark:ring-1 dark:ring-zinc-800" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">{detailDevice.nom}</h3>
              <button onClick={() => setDetailDevice(null)} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="h-4 w-4" />
              </button>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-zinc-500">ID</dt><dd className="font-mono text-xs text-zinc-800 dark:text-zinc-200">{detailDevice.id}</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-500">Statut</dt><dd><StatusBadge status={detailDevice.statut} config={DEVICE_STATUS} /></dd></div>
              <div className="flex justify-between"><dt className="text-zinc-500">Token FCM</dt><dd className="font-mono text-xs text-zinc-800 dark:text-zinc-200">{detailDevice.fcm_token ?? 'absent'}</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-500">SMS dernière heure</dt><dd className="font-semibold text-zinc-800 dark:text-zinc-200">{detailDevice.sms_last_hour ?? 0}</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-500">Dernière activité</dt><dd className="text-zinc-800 dark:text-zinc-200">{timeAgo(detailDevice.derniere_activite)}</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-500">Enregistré le</dt><dd className="text-zinc-800 dark:text-zinc-200">{new Date(detailDevice.created_at).toLocaleString('fr-FR')}</dd></div>
            </dl>
            <div className="mt-5 flex gap-2">
              <button onClick={() => pingDevice(detailDevice.id)}
                className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm dark:border-zinc-700 dark:text-zinc-300">
                Ping FCM
              </button>
              <button onClick={() => toggleDevice(detailDevice.id, detailDevice.statut)}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold text-white ${detailDevice.statut === 'DISABLED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {detailDevice.statut === 'DISABLED' ? 'Réactiver' : 'Désactiver'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={deleteDevice}
        loading={deleting}
        title="Supprimer cet appareil ?"
        message={`« ${deleteTarget?.nom ?? ''} » ne pourra plus envoyer de SMS. Ses tâches en cours seront libérées et son historique conservé sans attribution. Le téléphone devra être réinitialisé côté app.`}
        confirmLabel="Supprimer"
      />

      {/* Modale nouveau SMS */}
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
