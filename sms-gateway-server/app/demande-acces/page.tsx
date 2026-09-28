'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageSquare, Send, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

/**
 * Demande d'accès client (publique, sans compte) : nom + contact + usage.
 * Un administrateur valide (clé générée) ou refuse depuis les Paramètres.
 */
export default function PageDemandeAcces() {
  const [nom, setNom] = useState('')
  const [contact, setContact] = useState('')
  const [usagePrevu, setUsagePrevu] = useState('')
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [resultat, setResultat] = useState<{ reussi: boolean; texte: string } | null>(null)

  async function soumettre(e: React.FormEvent) {
    e.preventDefault()
    setEnvoiEnCours(true)
    setResultat(null)
    try {
      const reponse = await fetch('/api/demandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, contact, usage_prevu: usagePrevu }),
      })
      const donnees = await reponse.json().catch(() => null)
      if (reponse.ok) {
        setResultat({ reussi: true, texte: donnees?.message ?? 'Demande envoyée' })
        setNom('')
        setContact('')
        setUsagePrevu('')
      } else {
        setResultat({ reussi: false, texte: donnees?.error ?? 'Erreur lors de l\u2019envoi' })
      }
    } catch {
      setResultat({ reussi: false, texte: 'Serveur injoignable' })
    } finally {
      setEnvoiEnCours(false)
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
            <h1 className="text-base font-bold text-zinc-900 dark:text-white">Demander l&apos;accès API</h1>
            <p className="text-xs text-zinc-400">Réponse sous 24 h — clé générée après validation</p>
          </div>
        </div>

        {resultat && (
          <p className={`mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ring-1 ${
            resultat.reussi
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20'
              : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20'
          }`}>
            {resultat.reussi ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
            {resultat.texte}
          </p>
        )}

        <form onSubmit={soumettre} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Nom / société
            </label>
            <input type="text" required maxLength={80} value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Pharmacie du Centre"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Contact (e-mail pour recevoir la clé, ou téléphone)
            </label>
            <input type="text" required maxLength={80} value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="+261340000000"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Usage prévu
            </label>
            <textarea required rows={3} maxLength={500} value={usagePrevu}
              onChange={(e) => setUsagePrevu(e.target.value)}
              placeholder="OTP pour mon application, ~500 SMS/mois…"
              className="w-full resize-y rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
          </div>
          <button type="submit" disabled={envoiEnCours}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {envoiEnCours ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {envoiEnCours ? 'Envoi…' : 'Envoyer la demande'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Déjà client ?{' '}
          <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400">Espace administrateur</Link>
        </p>
      </div>
    </div>
  )
}
