'use client'

import { BookOpen, Key, Terminal, Send, CheckCircle2 } from 'lucide-react'
import CoquilleEspace from '../../../composants/CoquilleEspace'

function BlocApi({ titre, methode, chemin, children }: {
  titre: string; methode: string; chemin: string; children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800 space-y-3">
      <div className="flex items-center gap-3">
        <span className={`rounded-lg px-2.5 py-1 text-xs font-bold font-mono ${
          methode === 'GET'
            ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
        }`}>
          {methode}
        </span>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">{titre}</h2>
        <code className="ml-auto font-mono text-xs text-slate-500 dark:text-zinc-400">{chemin}</code>
      </div>
      <div className="text-xs leading-relaxed text-slate-600 dark:text-zinc-400">{children}</div>
    </div>
  )
}

export default function PageApiEspace() {
  return (
    <CoquilleEspace>
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Documentation API</h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
          Guide d'intégration HTTP pour automatiser l'envoi de SMS depuis vos applications.
        </p>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Authentification */}
        <div className="rounded-2xl bg-blue-50/60 p-6 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20">
          <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-bold text-sm mb-1">
            <Key className="h-4 w-4" /> Authentification API
          </div>
          <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
            Passez votre clé d'API client dans chaque requête via le corps JSON (<code className="font-mono font-bold">cle_api</code>) ou en en-tête <code className="font-mono font-bold">Authorization: Bearer VOTRE_CLE</code>.
          </p>
        </div>

        {/* Endpoint 1 : Send */}
        <BlocApi titre="Envoyer un SMS" methode="POST" chemin="/api/sms/send">
          <p className="mb-2">Paramètres JSON du body :</p>
          <ul className="list-disc pl-5 space-y-1 mb-3 text-slate-700 dark:text-zinc-300">
            <li><code className="font-mono font-bold">to</code> : Numéro unique ou tableau de numéros E.164.</li>
            <li><code className="font-mono font-bold">message</code> : Contenu texte du SMS (jusqu'à 160 caractères).</li>
            <li><code className="font-mono font-bold">cle_api</code> : Votre clé d'API personnelle.</li>
            <li><code className="font-mono font-bold">lien_intelligent</code> : <code className="font-mono">true</code> pour inclure un lien court de suivi.</li>
          </ul>
          <div className="rounded-xl bg-slate-900 p-4 text-xs font-mono text-slate-200 overflow-x-auto">
            {`curl -X POST https://api.smsika.app/api/sms/send \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+261340000000",
    "message": "Votre code de confirmation : 4819",
    "cle_api": "VOTRE_CLE_API"
  }'`}
          </div>
        </BlocApi>

        {/* Endpoint 2 : Status */}
        <BlocApi titre="Suivre l'état d'un envoi" methode="GET" chemin="/api/sms/status">
          <p className="mb-2">Passez le paramètre <code className="font-mono font-bold">cle_api</code> dans la Query URL.</p>
          <div className="rounded-xl bg-slate-900 p-4 text-xs font-mono text-slate-200 overflow-x-auto">
            {`curl -X GET "https://api.smsika.app/api/sms/status?cle_api=VOTRE_CLE_API&limit=50"`}
          </div>
        </BlocApi>

        {/* Webhooks */}
        <BlocApi titre="Recevoir les Webhooks" methode="POST" chemin="https://votre-domaine.com/webhook">
          <p>
            Chaque notification est signée en en-tête <code className="font-mono font-bold">X-Smsika-Signature: sha256=...</code> avec le secret disponible dans l'onglet Notifications.
          </p>
        </BlocApi>
      </div>
    </CoquilleEspace>
  )
}
