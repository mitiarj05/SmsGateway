'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Key, Copy, Check, Terminal, CheckCircle2, Loader2, Download } from 'lucide-react'
import CoquilleEspace from '../../../composants/CoquilleEspace'
import { Toast } from '../../../composants/interface'

interface Profil {
  cle_api?: string
  nom?: string
}

export default function PageApiEspace() {
  const [cleApi, setCleApi] = useState<string | null>(null)
  const [cleChargee, setCleChargee] = useState(false)
  const [copieCle, setCopieCle] = useState(false)
  const [copieCode, setCopieCode] = useState(false)
  const [notification, setNotification] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  useEffect(() => {
    let vivant = true
    fetch('/api/espace/moi')
      .then((r) => (r.ok ? r.json() : null))
      .then((profil: Profil | null) => {
        if (vivant) {
          setCleApi(profil?.cle_api ?? null)
          setCleChargee(true)
        }
      })
      .catch(() => { if (vivant) setCleChargee(true) })
    return () => { vivant = false }
  }, [])

  function afficherNotification(type: 'succes' | 'erreur', texte: string) {
    setNotification({ type, texte })
    setTimeout(() => setNotification(null), 4000)
  }

  function copier(texte: string, setStatut: (b: boolean) => void) {
    navigator.clipboard?.writeText(texte)
    setStatut(true)
    afficherNotification('succes', 'Copié dans le presse-papiers')
    setTimeout(() => setStatut(false), 2000)
  }

  const cle = cleApi ?? 'VOTRE_CLE_API'
  const codeSmsCurl = `curl -X POST https://smstsika.vercel.app/api/sms/send \\
  -H "Content-Type: application/json" \\
  -d '{
    "cle_api": "${cle}",
    "to": "+261340000000",
    "message": "Votre commande est prête !"
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
          onClick={() => cleApi && copier(cleApi, setCopieCle)}
          disabled={!cleApi}
          className="inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg hover:bg-[#1D4ED8] transition disabled:opacity-60"
        >
          {cleApi
            ? <><Copy className="h-4 w-4" /> {copieCle ? 'Clé copiée !' : 'Copier ma clé API'}</>
            : <><Loader2 className="h-4 w-4 animate-spin" /> Chargement de la clé…</>}
        </button>
      </div>

      <div className="max-w-3xl space-y-6">

        {/* Bloc 1 : Votre Clé API (la vraie, servie de votre fiche) */}
        <div className="rounded-[1.5rem] border border-[#1C1917]/10 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-3">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-[#1C1917] dark:text-white">Votre Clé d&apos;API Privée</h2>
          </div>
          <p className="text-xs text-stone-600 dark:text-zinc-400">
            Cette clé authentifie vos requêtes — c&apos;est la vôtre, celle de votre espace. Gardez-la en
            secret et ne l&apos;exposez jamais côté visiteur (navigateur) : le copier-coller la place dans
            votre serveur.
          </p>
          <div className="flex items-center justify-between rounded-xl bg-stone-100 p-3.5 border border-[#1C1917]/10 dark:bg-zinc-800/60 dark:border-zinc-700 text-xs font-mono">
            {cleChargee && cleApi ? (
              <>
                <span className="text-[#1C1917] dark:text-white font-bold">{cleApi}</span>
                <button
                  onClick={() => copier(cleApi, setCopieCle)}
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  {copieCle ? 'Copié' : 'Copier'}
                </button>
              </>
            ) : (
              <span className="text-stone-500 dark:text-zinc-400">
                {cleChargee ? 'Clé indisponible — rechargement de la page attendu.' : 'Chargement…'}
              </span>
            )}
          </div>
        </div>

        {/* Bloc 2 : Exemple d'envoi de SMS */}
        <div className="rounded-[1.5rem] border border-[#1C1917]/10 bg-[#0f172a] shadow-card p-6 text-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Requête d&apos;envoi (cURL)</h3>
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
              <span className="font-bold text-[#1C1917] dark:text-white">cle_api</span> : votre clé d&apos;API — celle du bloc ci-dessus, passée dans le corps de l&apos;appel.
            </div>
            <div className="rounded-xl bg-stone-100 p-3 border border-[#1C1917]/10 dark:bg-zinc-800/50 dark:border-zinc-700">
              <span className="font-bold text-[#1C1917] dark:text-white">to</span> : le destinataire au format international (ex: <code className="text-blue-600">+261340000000</code>). Une liste de numéros est acceptée pour un envoi groupé.
            </div>
            <div className="rounded-xl bg-stone-100 p-3 border border-[#1C1917]/10 dark:bg-zinc-800/50 dark:border-zinc-700">
              <span className="font-bold text-[#1C1917] dark:text-white">message</span> : texte du SMS — 160 caractères par segment, plusieurs segments automatiques au-delà.
            </div>
          </div>
        </div>

        {/* Réponse du serveur (la forme réelle : une tâche, un appareil) */}
        <div className="rounded-[1.5rem] border border-[#1C1917]/10 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-3">
          <h3 className="text-sm font-bold text-[#1C1917] dark:text-white">Réponse du serveur (Succès 201 Created)</h3>
          <p className="text-xs text-stone-600 dark:text-zinc-400">
            La requête crée une <strong>tâche</strong> : un téléphone lui-même la réclame, émet le SMS, puis
            rend son verdict. Ce verdict, vous le suivez dans votre espace&nbsp;→&nbsp;Envois.
          </p>
          <div className="rounded-xl bg-slate-900 p-3.5 font-mono text-xs text-emerald-400 overflow-x-auto">
            {`{\n  "message": "SMS mis en file d'attente",\n  "task": { "id": "…", "statut": "EN_ATTENTE", "numero_destinataire": "+261340000000" },\n  "push_sent": true,\n  "device_selected": { "id": "…", "nom": "RJ Mitia" },\n  "client": { "id": "…", "nom": "Votre boutique" }\n}`}
          </div>
        </div>

        {/* Bloc 4 : Recevoir — la moitié qui donne vie au site */}
        <div className="rounded-[1.5rem] border border-[#1C1917]/10 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-3">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-sm font-bold text-[#1C1917] dark:text-white">Et pour recevoir&nbsp;? (webhook)</h2>
          </div>
          <p className="text-xs text-stone-600 dark:text-zinc-400">
            Quand un payeur répond « PAYE CMD-1234 » ou qu&apos;un client répond à vos messages, la
            passerelle appelle <strong>votre site</strong> — chaque appel est signé, les intrus sont
            écartés. Le fichier
            récepteur est déjà réglé pour vous&nbsp;: téléchargez-le, déposez-le sur votre hébergement,
            copiez son adresse dans Notifications — votre secret vit dedans, il n&apos;a jamais de copie
            à tenir à jour à la main.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/espace/notifications"
              className="inline-flex items-center gap-2 rounded-full bg-[#1C1917] px-4 py-2 text-xs font-semibold text-white hover:bg-stone-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 transition"
            >
              <Download className="h-3.5 w-3.5" /> Télécharger le récepteur
            </Link>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-zinc-400">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Guide d&apos;intégration complet&nbsp;:
              <Link href="/comment-ca-marche" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">Brancher votre site</Link>
            </span>
          </div>
        </div>
      </div>

      <Toast notification={notification} />
    </CoquilleEspace>
  )
}
