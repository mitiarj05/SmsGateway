'use client'

import { useState } from 'react'
import { Send, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
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
          texte: donnees?.message ?? 'SMS mis en file d\u2019attente',
          ...(Array.isArray(donnees?.liens) && donnees.liens.length > 0 ? { liens: donnees.liens } : {}),
          ...(Array.isArray(donnees?.bloques) && donnees.bloques.length > 0 ? { bloques: donnees.bloques } : {}),
        })
        setNumeros('')
        setMessage('')
        chargerQuota()
      } else {
        afficherNotification('erreur', donnees?.error ?? 'Erreur lors de l\u2019envoi')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    } finally {
      setEnvoiEnCours(false)
    }
  }

  const [quotaTexte, setQuotaTexte] = useState('')
  async function chargerQuota() {
    try {
      const reponse = await fetch('/api/espace/moi')
      const donnees = await reponse.json()
      if (typeof donnees?.utilise_mois === 'number') {
        setQuotaTexte(`${donnees.utilise_mois} / ${donnees.quota_mensuel ?? '∞'} ce mois-ci`)
      }
    } catch { /* silencieux */ }
  }

  return (
    <CoquilleEspace titre="Envoyer un SMS" sousTitre={quotaTexte || 'Envoi via votre quota'}>
      {resultat && (
        <div className={`rounded-2xl px-4 py-3 text-sm font-medium ring-1 ${
          resultat.reussi
            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20'
            : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20'
        }`}>
          <p className="flex items-center gap-2">
            {resultat.reussi ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
            {resultat.texte}
          </p>
          {resultat.bloques && resultat.bloques.length > 0 && (
            <p className="mt-1 text-xs">Désinscrits ignorés : {resultat.bloques.join(', ')}</p>
          )}
          {resultat.liens && resultat.liens.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {resultat.liens.map((l) => (
                <li key={l.url}>
                  <p className="font-mono text-[11px] font-semibold">{l.numero_destinataire}</p>
                  <code className="block truncate font-mono text-[11px]">{l.url}</code>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200/60 xl:col-span-2 dark:bg-zinc-900 dark:ring-zinc-800">
        <form onSubmit={soumettre} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Destinataires (un par ligne)
            </label>
            <textarea required rows={4} value={numeros}
              onChange={(e) => setNumeros(e.target.value)}
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
          <label className="flex cursor-pointer items-start gap-2.5">
            <input type="checkbox" checked={lienIntelligent}
              onChange={(e) => setLienIntelligent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500/20" />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Lien intelligent : URL courte de suivi par destinataire
              (placez <code className="font-mono">{'{LIEN}'}</code> pour choisir sa position).
            </span>
          </label>
          <button type="submit" disabled={envoiEnCours}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {envoiEnCours ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {envoiEnCours ? 'Envoi…' : 'Envoyer'}
          </button>
        </form>
      </section>

      <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Bon à savoir</h2>
        <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          <li><b className="text-zinc-700 dark:text-zinc-200">100 destinataires max</b> par envoi (un par ligne).</li>
          <li><b className="text-zinc-700 dark:text-zinc-200">Quota mensuel</b> affiché en haut : au-delà, envois refusés jusqu&apos;au mois prochain.</li>
          <li><b className="text-zinc-700 dark:text-zinc-200">STOP respecté</b> : les numéros désinscrits sont ignorés et listés dans le résultat.</li>
          <li><b className="text-zinc-700 dark:text-zinc-200">Au-delà de 160 caractères</b>, le message part en plusieurs segments.</li>
        </ul>
      </aside>
      </div>

      <Toast notification={notification} />
    </CoquilleEspace>
  )
}
