'use client'

import React, { useEffect } from 'react'
import { X, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react'

/* ============================ TYPES ============================ */

export interface Appareil {
  id: string
  nom: string
  statut: string
  fcm_token: string | null
  sms_last_hour: number
  derniere_activite: string | null
  created_at: string
}

export interface Tache {
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

export interface PointHoraire {
  hour: string
  count: number
}

/* ============================ CONFIG ============================ */

// Repli d'affichage — la vraie valeur vient de /api/settings (défaut serveur : 20)
export const QUOTA_SMS_PAR_HEURE = 20

export const STATUTS_APPAREILS: Record<string, { label: string; badge: string; point: string }> = {
  EN_LIGNE:  { label: 'En ligne',   badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20',  point: 'bg-emerald-500' },
  HORS_LIGNE:{ label: 'Hors ligne', badge: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20',                        point: 'bg-red-500' },
  DESACTIVE: { label: 'Désactivé',  badge: 'bg-zinc-100 text-zinc-500 ring-zinc-500/20 dark:bg-zinc-500/10 dark:text-zinc-400 dark:ring-zinc-400/20',              point: 'bg-zinc-400' },
}

export const STATUTS_TACHES: Record<string, { label: string; badge: string }> = {
  EN_ATTENTE: { label: 'En attente', badge: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20' },
  ASSIGNE:   { label: 'Assigné',    badge: 'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-400/20' },
  RECLAME:   { label: 'Réclamé',    badge: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-400/20' },
  PROGRAMME: { label: 'Programmé',  badge: 'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-400/20' },
  ENVOYE:    { label: 'Envoyé',     badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20' },
  ECHOUE:    { label: 'Échoué',     badge: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20' },
}

/* ============================ HELPERS ============================ */

export function tempsEcoule(date: string | null): string {
  if (!date) return '—'
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return 'à l’instant'
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`
  return new Date(date).toLocaleDateString('fr-FR')
}

export function formaterHeure(date: string): string {
  return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

/* ============================ SOUS-COMPOSANTS ============================ */

export function BadgeStatut({ statut, config }: { statut: string; config: Record<string, { label: string; badge: string; point?: string }> }) {
  const c = config[statut] ?? { label: statut, badge: 'bg-zinc-100 text-zinc-600 ring-zinc-500/20', point: 'bg-zinc-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${c.badge}`}>
      {c.point && <span className={`h-1.5 w-1.5 rounded-full ${c.point}`} />}
      {c.label}
    </span>
  )
}

export function CarteKpi({ icone, etiquette, valeur, sousTitre, accent, sombre }: {
  icone: React.ReactNode; etiquette: string; valeur: number; sousTitre: string; accent: string; sombre: string
}) {
  return (
    <div className={`rounded-2xl p-5 shadow-sm ring-1 transition-colors ${accent} ${sombre}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{etiquette}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">{valeur}</p>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{sousTitre}</p>
        </div>
        <div className="rounded-xl bg-white/60 p-2.5 dark:bg-white/5">{icone}</div>
      </div>
    </div>
  )
}

/* ============================ MODALE ============================ */

export function Modale({ ouvert, onFermer, titre, sousTitre, children, large }: {
  ouvert: boolean; onFermer: () => void; titre: string; sousTitre?: string
  children: React.ReactNode; large?: boolean
}) {
  useEffect(() => {
    if (!ouvert) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onFermer()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ouvert, onFermer])

  if (!ouvert) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-sm"
      onClick={onFermer}>
      <div onClick={(e) => e.stopPropagation()}
        className={`w-full ${large ? 'max-w-2xl' : 'max-w-md'} max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 dark:ring-1 dark:ring-zinc-800`}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">{titre}</h3>
            {sousTitre && <p className="text-xs text-zinc-400">{sousTitre}</p>}
          </div>
          <button onClick={onFermer} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ---------- Confirmation destructive ---------- */
export function DialogueConfirmation({ ouvert, onFermer, onConfirmer, titre, message, etiquetteConfirmer = 'Confirmer', chargement }: {
  ouvert: boolean; onFermer: () => void; onConfirmer: () => void
  titre: string; message: string; etiquetteConfirmer?: string; chargement?: boolean
}) {
  return (
    <Modale ouvert={ouvert} onFermer={onFermer} titre={titre}>
      <div className="mb-5 flex items-start gap-3">
        <span className="rounded-xl bg-red-50 p-2 dark:bg-red-500/10">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
        </span>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{message}</p>
      </div>
      <div className="flex gap-2">
        <button onClick={onFermer} className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
          Annuler
        </button>
        <button onClick={onConfirmer} disabled={chargement}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
          {chargement && <Loader2 className="h-4 w-4 animate-spin" />}
          {etiquetteConfirmer}
        </button>
      </div>
    </Modale>
  )
}

/* ---------- Toast flottant ---------- */
export function Toast({ notification }: {
  notification: { type: 'succes' | 'erreur'; texte: string } | null
}) {
  if (!notification) return null
  const reussi = notification.type === 'succes'
  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${reussi ? 'bg-emerald-600' : 'bg-red-600'}`}>
      {reussi ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
      {notification.texte}
    </div>
  )
}

/* ---------- Empty state ---------- */
export function EtatVide({ icone, titre, indice }: { icone: React.ReactNode; titre: string; indice?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <div className="text-zinc-300 dark:text-zinc-600">{icone}</div>
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{titre}</p>
      {indice && <p className="text-xs text-zinc-400">{indice}</p>}
    </div>
  )
}

/* ---------- Barre de progression ---------- */
export function Progression({ valeur, max, afficherValeur }: { valeur: number; max: number; afficherValeur?: boolean }) {
  const maxSur = max > 0 ? max : 1
  const pct = Math.min(100, Math.round((valeur / maxSur) * 100))
  const couleur = pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-amber-500' : 'bg-blue-500'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div className={`h-full rounded-full transition-all ${couleur}`} style={{ width: `${pct}%` }} />
      </div>
      {afficherValeur && <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 tabular-nums">{valeur}</span>}
    </div>
  )
}
