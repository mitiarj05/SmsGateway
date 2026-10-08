'use client'

import { useState } from 'react'
import { BookOpen, Key, Send, Copy, Check, ShieldCheck, Zap, Code, Terminal, Sparkles, CheckCircle2, Download, ArrowUpRight } from 'lucide-react'
import CoquilleEspace from '../../../composants/CoquilleEspace'
import { Toast } from '../../../composants/interface'

export default function PageApiEspace() {
  const [onglet, setOnglet] = useState<'sms' | 'avance' | 'boutique'>('sms')
  const [copieCle, setCopieCle] = useState(false)
  const [copieCode, setCopieCode] = useState(false)
  const [notification, setNotification] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  function afficherNotification(type: 'succes' | 'erreur', texte: string) {
    setNotification({ type, texte })
    setTimeout(() => setNotification(null), 4000)
  }

  const cleApiExemple = 'cle_votre_cle_ici'

  function copier(texte: string, setStatut: (b: boolean) => void) {
    navigator.clipboard?.writeText(texte)
    setStatut(true)
    afficherNotification('succes', 'Copié dans le presse-papiers')
    setTimeout(() => setStatut(false), 2000)
  }

  const codeSmsCurl = `curl -X POST https://sms-gateway-omega.vercel.app/api/sms/send \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+261340000000",
    "message": "Votre commande est prête !",
    "cle_api": "${cleApiExemple}"
  }'`

  return (
    <CoquilleEspace>
      {/* En-tête (Exact Screenshot) */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white">Guide d'intégration API</h1>
          <p className="mt-1 text-[13.5px] text-slate-500 dark:text-zinc-400">
            Connectez votre site web ou votre application à SMSTSIKA en moins de 5 minutes.
          </p>
        </div>
        <button
          onClick={() => copier(cleApiExemple, setCopieCle)}
          className="inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-indigo-300/45 hover:bg-[#1D4ED8] transition"
        >
          <Copy className="h-4 w-4" /> Copier ma clé API
        </button>
      </div>

      {/* Main Grid 2 Cols (Exact Screenshot) */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">

        {/* Left Column (2 cols) */}
        <div className="xl:col-span-2 space-y-4">

          {/* Card 1 : Démarrage Rapide (3 Étapes) */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-5">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 text-xs">⚡</span>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Démarrage Rapide (3 Étapes)</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30 space-y-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold text-xs dark:bg-blue-500/10 dark:text-blue-400">1</span>
                <p className="font-bold text-slate-900 dark:text-white">Votre Clé API Privée</p>
                <p className="text-[11px] text-slate-400">Elle vous identifie de façon sécurisée.</p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30 space-y-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold text-xs dark:bg-blue-500/10 dark:text-blue-400">2</span>
                <p className="font-bold text-slate-900 dark:text-white">Choisissez votre besoin</p>
                <p className="text-[11px] text-slate-400">SMS simple, envoi programmé ou Connexion Boutique 1-Clic.</p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30 space-y-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold text-xs dark:bg-blue-500/10 dark:text-blue-400">3</span>
                <p className="font-bold text-slate-900 dark:text-white">Testez en 1 Clic</p>
                <p className="text-[11px] text-slate-400">Copiez le code ou cliquez sur Connecter.</p>
              </div>
            </div>

            {/* Bandeau format de clé */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 text-xs dark:border-zinc-800 dark:bg-zinc-800/50">
              <span className="text-slate-600 dark:text-zinc-300">
                🔑 Format de votre clé : <code className="font-mono font-bold text-slate-900 dark:text-white">{cleApiExemple}</code>
              </span>
              <button
                onClick={() => copier(cleApiExemple, setCopieCle)}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                <Copy className="h-3 w-3" /> Copier
              </button>
            </div>

            <p className="text-[11px] text-slate-400">Utilisez la clé reçue par e-mail à la création de votre compte (affichée une seule fois).</p>
          </div>

          {/* Onglets API */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => setOnglet('sms')}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${onglet === 'sms' ? 'bg-[#2563EB] text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'}`}
            >
              ✉️ Envoyer un SMS
            </button>
            <button
              onClick={() => setOnglet('avance')}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${onglet === 'avance' ? 'bg-[#2563EB] text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'}`}
            >
              Programmé + lien suivi
            </button>
            <button
              onClick={() => setOnglet('boutique')}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${onglet === 'boutique' ? 'bg-[#2563EB] text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'}`}
            >
              ⚡ Connexion Boutique (1-Clic)
            </button>
          </div>

          {/* Bloc Code Sombre (#0f172a) */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-[#0f172a] shadow-card p-6 text-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Envoyer un SMS depuis votre site</h3>
                <p className="text-xs text-slate-400">Envoyez une requête HTTP POST à SMSTSIKA. Le message est transmis immédiatement au téléphone portable.</p>
              </div>
              <button
                onClick={() => copier(codeSmsCurl, setCopieCode)}
                className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
              >
                {copieCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copieCode ? 'Copié' : 'Copier le code'}
              </button>
            </div>

            <div className="rounded-2xl bg-[#090d16] p-4 font-mono text-xs overflow-x-auto border border-white/10 leading-relaxed">
              <span className="text-slate-500"># Envoi simple</span> <span className="text-blue-400">curl</span> -X POST <span className="text-emerald-400">https://sms-gateway-omega.vercel.app/api/sms/send</span> -H <span className="text-amber-300">&quot;Content-Type: application/json&quot;</span> -d <span className="text-amber-300">&apos;&#123;&quot;to&quot;:&quot;+261340000000&quot;,&quot;message&quot;:&quot;Votre commande est prête !&quot;,&quot;cle_api&quot;:&quot;cle_votre_cle_ici&quot;&#125;&apos;</span> <span className="text-slate-500"># Réponse 200 OK &#123;&quot;statut&quot;:&quot;accepte&quot;,&quot;id&quot;:&quot;msg_8f3a...&quot;&#125;</span>
            </div>
          </div>

          {/* Card : Explication simple des champs */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Explication simple des champs :</h3>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-mono">
              <li><strong className="text-slate-900 dark:text-white">• to</strong> : le numéro du destinataire (ou une liste de numéros, 100 max).</li>
              <li><strong className="text-slate-900 dark:text-white">• message</strong> : le texte du SMS à envoyer (160 caractères = 1 segment).</li>
              <li><strong className="text-slate-900 dark:text-white">• lien_suivi</strong> : true pour insérer un lien intelligent <code className="text-blue-600">{'{LIEN}'}</code> mesurable.</li>
              <li><strong className="text-slate-900 dark:text-white">• programmer</strong> : "2026-10-08 09:00" pour un envoi différé.</li>
              <li><strong className="text-slate-900 dark:text-white">• cle_api</strong> : votre clé privée, dans le corps JSON.</li>
            </ul>
          </div>

          {/* Card : Codes de réponse */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Codes de réponse</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-zinc-800">
                    <th className="pb-3 pr-4">CODE</th>
                    <th className="pb-3 pr-4">SIGNIFICATION</th>
                    <th className="pb-3">QUE FAIRE ?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  <tr className="text-slate-700 dark:text-zinc-300">
                    <td className="py-3 pr-4"><span className="rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">200</span></td>
                    <td className="py-3 pr-4 font-medium">SMS accepté et routé</td>
                    <td className="py-3 text-slate-500">Rien — suivez le statut dans « Mes envois »</td>
                  </tr>
                  <tr className="text-slate-700 dark:text-zinc-300">
                    <td className="py-3 pr-4"><span className="rounded-md bg-amber-50 px-2 py-0.5 font-bold text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">401</span></td>
                    <td className="py-3 pr-4 font-medium">Clé API invalide</td>
                    <td className="py-3 text-slate-500">Vérifiez votre clé dans Paramètres</td>
                  </tr>
                  <tr className="text-slate-700 dark:text-zinc-300">
                    <td className="py-3 pr-4"><span className="rounded-md bg-amber-50 px-2 py-0.5 font-bold text-amber-600 dark:text-amber-400">429</span></td>
                    <td className="py-3 pr-4 font-medium">Quota dépassé (20 SMS/h)</td>
                    <td className="py-3 text-slate-500">Réessayez dans l'heure ou ajoutez un téléphone</td>
                  </tr>
                  <tr className="text-slate-700 dark:text-zinc-300">
                    <td className="py-3 pr-4"><span className="rounded-md bg-rose-50 px-2 py-0.5 font-bold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">500</span></td>
                    <td className="py-3 pr-4 font-medium">Erreur passerelle</td>
                    <td className="py-3 text-slate-500">Réessai automatique · alerte support si persistant</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column (3 Cards) */}
        <div className="space-y-4">

          {/* Top Card : Endpoints */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Endpoints</h3>

            <div className="space-y-2.5 text-xs font-mono">
              {[
                { method: 'POST', path: '/api/sms/send' },
                { method: 'POST', path: '/api/sms/scheduled' },
                { method: 'GET', path: '/api/sms/status/:id' },
                { method: 'GET', path: '/api/sms/received' },
                { method: 'POST', path: '/api/links/create' },
              ].map((e, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 dark:bg-zinc-800/60">
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${e.method === 'POST' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'}`}>
                    {e.method}
                  </span>
                  <span className="text-[11px] text-slate-700 dark:text-zinc-200">{e.path}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Middle Card : Exemples prêts à l'emploi */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Exemples prêts à l'emploi</h3>

            <div className="space-y-2 text-xs font-semibold">
              {[
                'PHP / cURL',
                'JavaScript / fetch',
                'Python / requests',
                'WordPress (plugin)',
              ].map((ex, i) => (
                <a key={i} href="#" className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-slate-700 hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-200">
                  <span>{ex}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                </a>
              ))}
            </div>
          </div>

          {/* Bottom Card : Postman / Insomnia (#1F1A52 dark navy) */}
          <div className="rounded-[1.5rem] bg-gradient-to-br from-[#332c75] to-[#1f1a52] p-6 text-white shadow-card space-y-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">POSTMAN / INSOMNIA</p>
            <p className="text-xs text-white/80 leading-relaxed">
              Téléchargez notre collection d'exemples avec environnements pré-remis.
            </p>
            <button
              onClick={() => afficherNotification('succes', 'Collection Postman téléchargée')}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 py-3 text-xs font-bold text-slate-950 shadow-md hover:bg-amber-300 transition"
            >
              <Download className="h-4 w-4" /> Collection API
            </button>
          </div>

        </div>

      </div>

      <Toast notification={notification} />
    </CoquilleEspace>
  )
}
