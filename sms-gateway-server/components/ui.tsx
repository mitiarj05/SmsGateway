'use client'

import React from 'react'

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

export const SMS_QUOTA_PER_HOUR = 50

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
