'use client'

import { useState } from 'react'
import { Key, Copy, Check, Send, Terminal, CheckCircle2 } from 'lucide-react'
import CoquilleEspace from '../../../composants/CoquilleEspace'
import { Toast } from '../../../composants/interface'

export default function PageApiEspace() {
  const [copieCle, setCopieCle] = useState(false)
  const [copieCode, setCopieCode] = useState(false)
  const [notification, setNotification] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  function afficherNotification(type: 'succes' | 'erreur', texte: string) {
    setNotification({ type, texte })
    setTimeout(() => setNotification(null), 4000)
  }

  const cleApiExemple = 'cle_live_9f83a2b7c6d5e4'

  function copier(texte: string, setStatut: (b: boolean) => void) {
    navigator.clipboard?.writeText(texte)
    setStatut(true)
    afficherNotification('succes', 'Copié dans le presse-papiers')
    setTimeout(() => setStatut(false), 2000)
  }

  const codeSmsCurl = `curl -X POST https://smstsika.vercel.app/api/sms/send \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+261340000000",
    "message": "Votre commande est prête !",
    "cle_api": "${cleApiExemple}"
  }'`

  return (
    <CoquilleEspace>
      {/* En-tête simple et pro */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#1C1917] dark:text-white">Documentation API</h1>
          <p className="mt-1 text-[13.5px] text-stone-600 dark:text-zinc-400">
            Envoyez des SMS depuis votre application ou votre site web en une seule requête HTTP.
          </p>
        </div>
        <button
          onClick={() => copier(cleApiExemple, setCopieCle)}
          className="inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg hover:bg-[#1D4ED8] transition"
        >
          <Copy className="h-4 w-4" /> {copieCle ? 'Clé copiée !' : 'Copier ma clé API'}
        </button>
      </div>

      <div className="max-w-3xl space-y-6">

        {/* Bloc 1 : Votre Clé API */}
        <div className="rounded-[1.5rem] border border-[#1C1917]/10 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-3">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-[#1C1917] dark:text-white">Votre Clé d'API Privée</h2>
          </div>
          <p className="text-xs text-stone-600 dark:text-zinc-400">
            Cette clé authentifie vos requêtes. Gardez-la secrète et ne l'exposez jamais côté client (navigateur).
          </p>
          <div className="flex items-center justify-between rounded-xl bg-stone-100 p-3.5 border border-[#1C1917]/10 dark:bg-zinc-800/60 dark:border-zinc-700 text-xs font-mono">
            <span className="text-[#1C1917] dark:text-white font-bold">{cleApiExemple}</span>
            <button
              onClick={() => copier(cleApiExemple, setCopieCle)}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              {copieCle ? 'Copié' : 'Copier'}
            </button>
          </div>
        </div>

        {/* Bloc 2 : Exemple d'envoi de SMS */}
        <div className="rounded-[1.5rem] border border-[#1C1917]/10 bg-[#0f172a] shadow-card p-6 text-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Requête d'envoi (cURL)</h3>
            </div>
            <button
              onClick={() => copier(codeSmsCurl, setCopieCode)}
              className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition"
            >
              {copieCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copieCode ? 'Copié' : 'Copier le code'}
            </button>
          </div>

          <div className="rounded-2xl bg-[#090d16] p-4 font-mono text-xs overflow-x-auto border border-white/10 leading-relaxed text-stone-400">
            <pre>{codeSmsCurl}</pre>
          </div>
        </div>

        {/* Bloc 3 : Paramètres de la requête */}
        <div className="rounded-[1.5rem] border border-[#1C1917]/10 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-3">
          <h3 className="text-sm font-bold text-[#1C1917] dark:text-white">Paramètres requis (JSON)</h3>
          <div className="space-y-2 text-xs font-mono text-stone-600 dark:text-zinc-400">
            <div className="rounded-xl bg-stone-100 p-3 border border-[#1C1917]/10 dark:bg-zinc-800/50 dark:border-zinc-700">
              <span className="font-bold text-[#1C1917] dark:text-white">to</span> : Numéro de téléphone du destinataire au format international (ex: <code className="text-blue-600">+261340000000</code>).
            </div>
            <div className="rounded-xl bg-stone-100 p-3 border border-[#1C1917]/10 dark:bg-zinc-800/50 dark:border-zinc-700">
              <span className="font-bold text-[#1C1917] dark:text-white">message</span> : Texte du SMS (160 caractères max par segment).
            </div>
            <div className="rounded-xl bg-stone-100 p-3 border border-[#1C1917]/10 dark:bg-zinc-800/50 dark:border-zinc-700">
              <span className="font-bold text-[#1C1917] dark:text-white">cle_api</span> : Votre clé d'API secrète.
            </div>
          </div>
        </div>

        {/* Réponse du serveur */}
        <div className="rounded-[1.5rem] border border-[#1C1917]/10 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-3">
          <h3 className="text-sm font-bold text-[#1C1917] dark:text-white">Réponse du serveur (Succès 200 OK)</h3>
          <div className="rounded-xl bg-slate-900 p-3.5 font-mono text-xs text-emerald-400 overflow-x-auto">
            {`{\n  "statut": "accepte",\n  "id": "msg_8f3a291b"\n}`}
          </div>
        </div>

      </div>

      <Toast notification={notification} />
    </CoquilleEspace>
  )
}
