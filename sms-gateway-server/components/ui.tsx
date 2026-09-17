'use client'

import React, { useEffect } from 'react'
import { X, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react'

/* ============================ TYPES ============================ */

export interface Device {
  id: string
  nom: string
  statut: string
  fcm_token: string | null
  sms_last_hour: number
  derniere_activite: string | null
  created_at: string
}

export interface Task {
  id: string
  numero_destinataire: string
  message: string
  statut: string
  device_id: string | null
  error_message?: string | null
  scheduled_at?: string | null
  created_at: string
  updated_at: string
}

export interface Stats {
  stats: {
    online_devices: number
    tasks_sent: number
    tasks_pending: number
    tasks_failed: number
  }
}

export interface HourlyPoint {
  hour: string
  count: number
}

/* ============================ CONFIG ============================ */

// Repli d'affichage — la vraie valeur vient de /api/settings (défaut serveur : 20)
export const SMS_QUOTA_PER_HOUR = 20

export const DEVICE_STATUS: Record<string, { label: string; badge: string; dot: string }> = {
  ONLINE:   { label: 'En ligne',   badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20',  dot: 'bg-emerald-500' },
  BUSY:     { label: 'Occupé',     badge: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-400/20',                    dot: 'bg-blue-500 animate-pulse' },
  OFFLINE:  { label: 'Hors ligne', badge: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20',                        dot: 'bg-red-500' },
  DISABLED: { label: 'Désactivé',  badge: 'bg-zinc-100 text-zinc-500 ring-zinc-500/20 dark:bg-zinc-500/10 dark:text-zinc-400 dark:ring-zinc-400/20',              dot: 'bg-zinc-400' },
}

export const TASK_STATUS: Record<string, { label: string; badge: string }> = {
  PENDING:  { label: 'En attente', badge: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20' },
  ASSIGNED: { label: 'Assigné',    badge: 'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-400/20' },
  SENDING:  { label: 'Envoi…',     badge: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-400/20' },
  SCHEDULED: { label: 'Programmé',  badge: 'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-400/20' },
  SENT:     { label: 'Envoyé',     badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20' },
  FAILED:   { label: 'Échoué',     badge: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20' },
}

/* ============================ HELPERS ============================ */

export function timeAgo(date: string | null): string {
  if (!date) return '—'
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return 'à l’instant'
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`
  return new Date(date).toLocaleDateString('fr-FR')
}

export function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

/* ============================ SOUS-COMPOSANTS ============================ */

export function StatusBadge({ status, config }: { status: string; config: Record<string, { label: string; badge: string; dot?: string }> }) {
  const c = config[status] ?? { label: status, badge: 'bg-zinc-100 text-zinc-600 ring-zinc-500/20', dot: 'bg-zinc-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${c.badge}`}>
      {c.dot && <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />}
      {c.label}
    </span>
  )
}

export function KpiCard({ icon, label, value, sub, accent, dark }: {
  icon: React.ReactNode; label: string; value: number; sub: string; accent: string; dark: string
}) {
  return (
    <div className={`rounded-2xl p-5 shadow-sm ring-1 transition-colors ${accent} ${dark}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">{value}</p>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{sub}</p>
        </div>
        <div className="rounded-xl bg-white/60 p-2.5 dark:bg-white/5">{icon}</div>
      </div>
    </div>
  )
}

/* ============================ MODALE ============================ */

export function Modal({ open, onClose, title, subtitle, children, wide }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string
  children: React.ReactNode; wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className={`w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 dark:ring-1 dark:ring-zinc-800`}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">{title}</h3>
            {subtitle && <p className="text-xs text-zinc-400">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ---------- Confirmation destructive ---------- */
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirmer', loading }: {
  open: boolean; onClose: () => void; onConfirm: () => void
  title: string; message: string; confirmLabel?: string; loading?: boolean
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="mb-5 flex items-start gap-3">
        <span className="rounded-xl bg-red-50 p-2 dark:bg-red-500/10">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
        </span>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{message}</p>
      </div>
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
          Annuler
        </button>
        <button onClick={onConfirm} disabled={loading}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

/* ---------- Toast flottant ---------- */
export function Toast({ toast }: {
  toast: { type: 'success' | 'error'; text: string } | null
}) {
  if (!toast) return null
  const ok = toast.type === 'success'
  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${ok ? 'bg-emerald-600' : 'bg-red-600'}`}>
      {ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
      {toast.text}
    </div>
  )
}

/* ---------- Empty state ---------- */
export function EmptyState({ icon, title, hint }: { icon: React.ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <div className="text-zinc-300 dark:text-zinc-600">{icon}</div>
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{title}</p>
      {hint && <p className="text-xs text-zinc-400">{hint}</p>}
    </div>
  )
}

/* ---------- Barre de progression ---------- */
export function Progress({ value, max, showValue }: { value: number; max: number; showValue?: boolean }) {
  const safeMax = max > 0 ? max : 1
  const pct = Math.min(100, Math.round((value / safeMax) * 100))
  const color = pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-amber-500' : 'bg-blue-500'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {showValue && <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 tabular-nums">{value}</span>}
    </div>
  )
}
