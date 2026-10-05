'use client'

import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Modale } from './interface'

/**
 * Modale d'envoi SMS partagée (fonctionnalité complète) :
 * - un ou plusieurs destinataires (un par ligne, virgules/points-virgules acceptés)
 * - message 160 caractères avec compteur
 * - envoi programmé optionnel (scheduled_at)
 * - clé API pré-remplie depuis le navigateur
 */
export default function ModaleEnvoiSms({
  ouvert,
  onFermer,
  onSucces,
}: {
  ouvert: boolean
  onFermer: () => void
  onSucces: (message: string) => void
}) {
  const [to, setTo] = useState('')
  const [message, setMessage] = useState('')
  const [cleApi, setCleApi] = useState(() =>
    typeof window === 'undefined' ? '' : (localStorage.getItem('smsika-cle-api') ?? '')
  )
  const [programme, setProgramme] = useState('')
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  function fermer() {
    if (!envoiEnCours) {
      setErreur(null)
      onFermer()
    }
  }

  async function envoyerSms(e: React.FormEvent) {
    e.preventDefault()
    setEnvoiEnCours(true)
    setErreur(null)
    // Un numéro par ligne (virgules et points-virgules acceptés aussi).
    const destinataires = to.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean)
    const programmeA = programme ? new Date(programme).toISOString() : undefined
    try {
      const reponse = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: destinataires.length > 1 ? destinataires : destinataires[0] ?? '',
          message,
          cle_api: cleApi.trim(),
          ...(programmeA ? { scheduled_at: programmeA } : {}),
        }),
      })
      const donnees = await reponse.json().catch(() => null)
      if (reponse.ok) {
        const confirmation = programmeA
          ? (donnees?.message ?? 'SMS programmé')
          : destinataires.length > 1
            ? `${destinataires.length} SMS mis en file`
            : `SMS mis en file → ${to.trim()}`
        setTo('')
        setMessage('')
        setProgramme('')
        onFermer()
        onSucces(confirmation)
      } else {
        setErreur(donnees?.error ?? 'Erreur lors de l’envoi')
      }
    } catch {
      setErreur('Erreur réseau')
    } finally {
      setEnvoiEnCours(false)
    }
  }

  return (
    <Modale ouvert={ouvert} onFermer={fermer}
      titre="Envoyer un SMS" sousTitre="La tâche sera ajoutée à la file d'attente">
      <form onSubmit={envoyerSms} className="space-y-4">
        <textarea required rows={3} placeholder="+261328725411&#10;+261331298765 (un par ligne)"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
        <div>
          <textarea required rows={3} maxLength={160} placeholder="Votre message…" value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
          <p className="mt-1 text-right text-[11px] text-slate-400">{message.length}/160</p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-zinc-400">
            Programmer l&apos;envoi (optionnel)
          </label>
          <input type="datetime-local" value={programme}
            onChange={(e) => setProgramme(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
        </div>
        <input type="password" required placeholder="Clé API" value={cleApi}
          onChange={(e) => setCleApi(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
        {erreur && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">
            {erreur}
          </p>
        )}
        <button type="submit" disabled={envoiEnCours}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
          {envoiEnCours ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {envoiEnCours ? 'Envoi…' : 'Envoyer'}
        </button>
      </form>
    </Modale>
  )
}
