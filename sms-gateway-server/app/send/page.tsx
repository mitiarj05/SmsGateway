'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageSquare, Send, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

/**
 * Page d'envoi publique pour les partenaires sans intégration API :
 * même moteur que POST /api/sms/send, la clé API fait foi.
 * Pas de session admin requise (le proxy ne protège pas /send).
 */
export default function ExternalSendPage() {
  const [cleApi, setCleApi] = useState('')
  const [numbers, setNumbers] = useState('')
  const [message, setMessage] = useState('')
  const [scheduled, setScheduled] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setResult(null)
    const recipients = numbers.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean)
    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipients.length > 1 ? recipients : recipients[0] ?? '',
          message,
          cle_api: cleApi.trim(),
          ...(scheduled ? { scheduled_at: new Date(scheduled).toISOString() } : {}),
        }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok) {
        setResult({ ok: true, text: data?.message ?? 'SMS mis en file d\u2019attente' })
        setNumbers('')
        setMessage('')
      } else {
        setResult({ ok: false, text: data?.error ?? 'Erreur lors de l\u2019envoi' })
      }
    } catch {
      setResult({ ok: false, text: 'Serveur injoignable' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-4 dark:bg-zinc-950">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
        <div className="mb-1 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-zinc-900 dark:text-white">Envoyer des SMS</h1>
            <p className="text-xs text-zinc-400">Formulaire partenaire — clé API requise</p>
          </div>
        </div>

        {result && (
          <p className={`mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ring-1 ${
            result.ok
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20'
              : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20'
          }`}>
            {result.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
            {result.text}
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Clé API (fournie par l&apos;administrateur)
            </label>
            <input type="password" required value={cleApi}
              onChange={(e) => setCleApi(e.target.value)}
              placeholder="cle_…"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Destinataires (un par ligne)
            </label>
            <textarea required rows={4} value={numbers}
              onChange={(e) => setNumbers(e.target.value)}
              placeholder="+261340512345&#10;+261331298765"
              className="w-full resize-y rounded-lg border border-zinc-200 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
          </div>
          <div>
            <textarea required rows={3} maxLength={160} value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Votre message…"
              className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
            <p className="mt-1 text-right text-[11px] text-zinc-400">{message.length}/160</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Programmer l&apos;envoi (optionnel)
            </label>
            <input type="datetime-local" value={scheduled}
              onChange={(e) => setScheduled(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
          </div>
          <button type="submit" disabled={sending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? 'Envoi…' : 'Envoyer'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Une clé API ? Demandez-la à l&apos;administrateur. Consultez ensuite vos envois via{' '}
          <code className="font-mono">GET /api/sms/status?cle_api=…</code>
        </p>
        <p className="mt-2 text-center text-xs text-zinc-400">
          <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400">Espace administrateur</Link>
        </p>
      </div>
    </div>
  )
}
