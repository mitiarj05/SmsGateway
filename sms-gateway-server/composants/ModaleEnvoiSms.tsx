'use client'

import { useState, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Modale } from './interface'

/**
 * Modale d'envoi SMS du dashboard (session admin, sans clé API) :
 * - choix de l'espace d'envoi (liste des clients)
 * - un ou plusieurs destinataires (un par ligne, virgules/points-virgules acceptés)
 * - message 160 caractères avec compteur
 * - envoi programmé optionnel (scheduled_at)
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
  const [espaces, setEspaces] = useState<{ id: string; nom: string }[]>([])
  const [espaceId, setEspaceId] = useState('')
  const [programme, setProgramme] = useState('')
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    if (ouvert) chargerEspaces()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ouvert])

  function fermer() {
    if (!envoiEnCours) {
      setErreur(null)
      onFermer()
    }
  }

  async function chargerEspaces() {
    try {
      const reponse = await fetch('/api/api-clients')
      const donnees = await reponse.json().catch(() => null)
      const liste = Array.isArray(donnees?.clients) ? donnees.clients : []
      setEspaces(liste.map((c: any) => ({ id: c.id, nom: c.nom })))
      if (liste.length > 0 && !espaceId) setEspaceId(liste[0].id)
    } catch {
      /* la validation affichera l'erreur */
    }
  }

  async function envoyerSms(e: React.FormEvent) {
    e.preventDefault()
    setEnvoiEnCours(true)
    setErreur(null)
    if (!espaceId) {
      await chargerEspaces()
      setErreur('Choisissez l\u2019espace d\u2019envoi')
      setEnvoiEnCours(false)
      return
    }
    e.preventDefault()
    setEnvoiEnCours(true)
    setErreur(null)
    // Un numéro par ligne (virgules et points-virgules acceptés aussi).
    const destinataires = to.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean)
    const programmeA = programme ? new Date(programme).toISOString() : undefined
    try {
      const reponse = await fetch('/api/sms/envoyer-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: destinataires.length > 1 ? destinataires : destinataires[0] ?? '',
          message,
          id_application: espaceId,
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
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-zinc-400">
            Espace d'envoi
          </label>
          <select
            value={espaceId}
            onChange={(e) => setEspaceId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">— Choisir un espace —</option>
            {espaces.map((e) => (
              <option key={e.id} value={e.id}>{e.nom}</option>
            ))}
          </select>
        </div>
        {erreur && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">
            {erreur}
          </p>
        )}
        <button type="submit" disabled={envoiEnCours}
          className="survol-brillance flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
          {envoiEnCours ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {envoiEnCours ? 'Envoi…' : 'Envoyer'}
        </button>
      </form>
    </Modale>
  )
}
