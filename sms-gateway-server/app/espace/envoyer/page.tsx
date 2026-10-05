'use client'

import { useState } from 'react'
import { Send, Loader2, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import CoquilleEspace from '../../../composants/CoquilleEspace'
import { Toast } from '../../../composants/interface'

export default function PageEnvoyerEspace() {
  const [numeros, setNumeros] = useState('')
  const [message, setMessage] = useState('')
  const [lienIntelligent, setLienIntelligent] = useState(false)
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [resultat, setResultat] = useState<{
    reussi: boolean; texte: string; liens?: { numero_destinataire: string; url: string }[]; bloques?: string[]
  } | null>(null)
  const [notification, setNotification] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  function afficherNotification(type: 'succes' | 'erreur', texte: string) {
    setNotification({ type, texte })
    setTimeout(() => setNotification(null), 4000)
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault()
    setEnvoiEnCours(true)
    setResultat(null)
    const destinataires = numeros.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean)
    try {
      const reponse = await fetch('/api/espace/envoyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: destinataires.length > 1 ? destinataires : destinataires[0] ?? '',
          message,
          ...(lienIntelligent ? { lien_intelligent: true } : {}),
        }),
      })
      const donnees = await reponse.json().catch(() => null)
      if (reponse.ok) {
        setResultat({
          reussi: true,
          texte: donnees?.message ?? 'SMS mis en file d’attente',
          ...(Array.isArray(donnees?.liens) && donnees.liens.length > 0 ? { liens: donnees.liens } : {}),
          ...(Array.isArray(donnees?.bloques) && donnees.bloques.length > 0 ? { bloques: donnees.bloques } : {}),
        })
        setNumeros('')
        setMessage('')
      } else {
        afficherNotification('erreur', donnees?.error ?? 'Erreur lors de l’envoi')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    } finally {
      setEnvoiEnCours(false)
    }
  }

  return (
    <CoquilleEspace>
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Envoyer un SMS</h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
          Programmez ou expédiez directement des SMS via votre forfait client.
        </p>
      </div>

      {resultat && (
        <div className={`rounded-2xl p-4 text-xs font-medium border ${
          resultat.reussi
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300'
            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300'
        }`}>
          <p className="flex items-center gap-2 font-bold text-sm">
            {resultat.reussi ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />}
            {resultat.texte}
          </p>
          {resultat.bloques && resultat.bloques.length > 0 && (
            <p className="mt-1.5">Destinataires désinscrits ignorés : {resultat.bloques.join(', ')}</p>
          )}
          {resultat.liens && resultat.liens.length > 0 && (
            <ul className="mt-3 space-y-2">
              {resultat.liens.map((l) => (
                <li key={l.url} className="rounded-xl bg-white/80 p-2.5 dark:bg-zinc-800">
                  <p className="font-mono text-xs font-bold">{l.numero_destinataire}</p>
                  <code className="block truncate font-mono text-xs text-blue-600 dark:text-blue-400 mt-0.5">{l.url}</code>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Formulaire principal */}
        <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800 xl:col-span-2">
          <form onSubmit={soumettre} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Destinataires (un par ligne ou séparés par virgules)
              </label>
              <textarea
                required
                rows={4}
                value={numeros}
                onChange={(e) => setNumeros(e.target.value)}
                placeholder="+261340000000&#10;+261330000000"
                className="w-full resize-y rounded-xl border border-slate-200 p-3 font-mono text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Message SMS
              </label>
              <textarea
                required
                rows={4}
                maxLength={160}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Rédigez votre message ici..."
                className="w-full resize-none rounded-xl border border-slate-200 p-3 text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <p className="mt-1 text-right text-[11px] text-slate-400 dark:text-zinc-500">{message.length}/160 caractères</p>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 dark:bg-zinc-800/60 dark:border-zinc-700">
              <input
                type="checkbox"
                checked={lienIntelligent}
                onChange={(e) => setLienIntelligent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
              />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">Générer des liens intelligents</p>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                  Insère une URL courte de suivi unique par destinataire.
                  Insérez <code className="font-mono font-semibold">{'{LIEN}'}</code> dans le texte pour définir son emplacement.
                </p>
              </div>
            </label>

            <button
              type="submit"
              disabled={envoiEnCours}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {envoiEnCours ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {envoiEnCours ? 'Expédition en cours...' : 'Envoyer les messages'}
            </button>
          </form>
        </section>

        {/* Panneau latéral conseils */}
        <aside className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800 h-fit space-y-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Info className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-bold">Règles d'envoi</h2>
          </div>
          <ul className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-zinc-400">
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
              <span><strong className="text-slate-800 dark:text-zinc-200">Limite de destinataires</strong> : jusqu'à 100 numéros par lot.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
              <span><strong className="text-slate-800 dark:text-zinc-200">Format international</strong> : préférez la forme E.164 (ex. +261...).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
              <span><strong className="text-slate-800 dark:text-zinc-200">Désinscriptions (STOP)</strong> : les numéros désinscrits sont automatiquement filtrés.</span>
            </li>
          </ul>
        </aside>
      </div>

      <Toast notification={notification} />
    </CoquilleEspace>
  )
}
