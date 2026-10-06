'use client'

import { useState } from 'react'
import { BookOpen, Key, Send, Copy, Check, ShieldCheck, Zap, Code, Terminal, Sparkles, CheckCircle2 } from 'lucide-react'
import CoquilleEspace from '../../../composants/CoquilleEspace'

export default function PageApiEspace() {
  const [onglet, setOnglet] = useState<'sms' | 'avance' | 'boutique'>('sms')
  const [copieCle, setCopieCle] = useState(false)
  const [copieCode, setCopieCode] = useState(false)

  // Exemple de format — remplacez par la clé reçue à la création de votre compte.
  const cleApiExemple = 'cle_votre_cle_ici'

  function copier(texte: string, setStatut: (b: boolean) => void) {
    navigator.clipboard?.writeText(texte)
    setStatut(true)
    setTimeout(() => setStatut(false), 2000)
  }

  const codeSmsCurl = `curl -X POST https://sms-gateway-omega.vercel.app/api/sms/send \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+261340000000",
    "message": "Votre commande est prête !",
    "cle_api": "${cleApiExemple}"
  }'`

  const codeAvanceCurl = `curl -X POST https://sms-gateway-omega.vercel.app/api/sms/send \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": ["+261340000001", "+261340000002"],
    "message": "Promo : -20 % ce week-end ! Suivi : {LIEN}",
    "cle_api": "${cleApiExemple}",
    "scheduled_at": "2026-12-01T08:00:00Z",
    "lien_intelligent": true
  }'`

  return (
    <CoquilleEspace>
      {/* En-tête simplifié */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Guide d'Intégration API</h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
          Connectez votre site web ou votre application à SMSIKA en moins de 5 minutes.
        </p>
      </div>

      <div className="max-w-4xl space-y-6">

        {/* Bloc 1 : Démarrage Rapide en 3 Étapes */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Démarrage Rapide (3 Étapes)</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 dark:bg-zinc-800/60 dark:border-zinc-700">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs mb-2">1</span>
              <p className="font-bold text-slate-800 dark:text-zinc-200">Votre Clé API Privée</p>
              <p className="mt-1 text-slate-500 dark:text-zinc-400">Elle vous identifie de façon sécurisée.</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 dark:bg-zinc-800/60 dark:border-zinc-700">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs mb-2">2</span>
              <p className="font-bold text-slate-800 dark:text-zinc-200">Choisissez votre besoin</p>
              <p className="mt-1 text-slate-500 dark:text-zinc-400">SMS simple, envoi programmé ou Connexion Boutique 1-Clic.</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 dark:bg-zinc-800/60 dark:border-zinc-700">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs mb-2">3</span>
              <p className="font-bold text-slate-800 dark:text-zinc-200">Testez en 1 Clic</p>
              <p className="mt-1 text-slate-500 dark:text-zinc-400">Copiez le code ou cliquez sur Connecter.</p>
            </div>
          </div>

          {/* Encart Clé API avec bouton Copier */}
          <div className="mt-2 flex items-center justify-between rounded-xl bg-blue-50/70 p-3.5 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 text-xs">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="text-slate-600 dark:text-zinc-400">Format de votre clé :</span>
              <code className="font-mono font-bold text-slate-900 dark:text-white">{cleApiExemple}</code>
            </div>
            <button
              onClick={() => copier(cleApiExemple, setCopieCle)}
              className="inline-flex items-center gap-1 font-bold text-blue-600 hover:underline dark:text-blue-400"
            >
              {copieCle ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copieCle ? 'Copié !' : 'Copier'}
            </button>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500">Utilisez la clé reçue par e-mail à la création de votre compte (affichée une seule fois).</p>
        </div>

        {/* Sélection visuelle des Onglets par besoin */}
        <div className="flex rounded-xl bg-slate-200/70 p-1 dark:bg-zinc-800">
          <button
            type="button"
            onClick={() => setOnglet('sms')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition ${
              onglet === 'sms'
                ? 'bg-white text-blue-600 shadow-sm dark:bg-zinc-900 dark:text-blue-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400'
            }`}
          >
            <Send className="h-4 w-4" /> ✉️ Envoyer un SMS
          </button>

          <button
            type="button"
            onClick={() => setOnglet('avance')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition ${
              onglet === 'avance'
                ? 'bg-white text-blue-600 shadow-sm dark:bg-zinc-900 dark:text-blue-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400'
            }`}
          >
            <ShieldCheck className="h-4 w-4" /> Programmé + lien suivi
          </button>

          <button
            type="button"
            onClick={() => setOnglet('boutique')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition ${
              onglet === 'boutique'
                ? 'bg-white text-blue-600 shadow-sm dark:bg-zinc-900 dark:text-blue-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400'
            }`}
          >
            <Zap className="h-4 w-4" /> ⚡ Connexion Boutique (1-Clic)
          </button>
        </div>

        {/* CONTENU ONGLET 1 : SMS SIMPLE & MASSIF */}
        {onglet === 'sms' && (
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Envoyer un SMS depuis votre site</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Envoyez une requête HTTP POST à SMSIKA. Le message est transmis immédiatement au téléphone portable.
              </p>
            </div>

            <div className="relative rounded-xl bg-slate-900 p-4 font-mono text-xs text-slate-200 overflow-x-auto">
              <button
                onClick={() => copier(codeSmsCurl, setCopieCode)}
                className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-sans font-semibold text-slate-300 hover:bg-white/20"
              >
                {copieCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copieCode ? 'Copié' : 'Copier le code'}
              </button>
              <pre>{codeSmsCurl}</pre>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 dark:bg-zinc-800/50 dark:border-zinc-700 text-xs space-y-1">
              <p className="font-bold text-slate-800 dark:text-zinc-200">Explication simple des champs :</p>
              <p>• <code className="font-bold font-mono">to</code> : le numéro du destinataire (ou une liste de numéros, 100 max).</p>
              <p>• <code className="font-bold font-mono">message</code> : le texte du SMS à envoyer.</p>
              <p>• <code className="font-bold font-mono">cle_api</code> : votre clé privée, dans le corps JSON.</p>
            </div>
          </div>
        )}

        {/* CONTENU ONGLET 2 : ENVOI PROGRAMMÉ + LIEN SUIVI */}
        {onglet === 'avance' && (
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Programmer un envoi groupé avec lien suivi</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                <code className="font-mono">scheduled_at</code> programme l'envoi (date ISO future) et <code className="font-mono">{'{LIEN}'}</code> insère un lien court unique par destinataire, dont les clics sont suivis.
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl bg-slate-900 p-4 font-mono text-xs text-slate-200 overflow-x-auto">
                <pre>{codeAvanceCurl}</pre>
              </div>
            </div>

            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> SMSIKA répond avec les tâches créées et les URLs de suivi !
            </p>
          </div>
        )}

        {/* CONTENU ONGLET 3 : CONNEXION BOUTIQUE 1-CLIC */}
        {onglet === 'boutique' && (
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Lier votre site marchand sans aucun code</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Vous possédez WooCommerce, Shopify ou PrestaShop ? N&apos;écrivez aucun code : utilisez notre assistant 1-Clic.
              </p>
            </div>

            <div className="rounded-xl bg-amber-50/80 p-4 border border-amber-200 text-xs text-amber-900 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300 space-y-2">
              <p className="font-bold text-sm">💡 Méthode simplifiée :</p>
              <p>1. Allez dans l&apos;onglet <b>Notifications / Webhooks</b> de votre espace client.</p>
              <p>2. Entrez l&apos;adresse de votre boutique (ex: <code className="font-mono">https://mon-magasin.com</code>).</p>
              <p>3. Cliquez sur <b>⚡ Connecter en 1 Clic</b>. SMSIKA gère toute l&apos;intégration automatiquement.</p>
            </div>
          </div>
        )}

      </div>
    </CoquilleEspace>
  )
}
