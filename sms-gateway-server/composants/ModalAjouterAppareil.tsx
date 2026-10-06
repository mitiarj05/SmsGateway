'use client'

import { useState, useEffect } from 'react'
import { X, Link2, Copy, Check, Smartphone, ShieldCheck, AlertTriangle } from 'lucide-react'
import QrCodeSvg from './QrCodeSvg'

interface PropsModalAjout {
  ouvert: boolean
  onFermer: () => void
}

export default function ModalAjouterAppareil({ ouvert, onFermer }: PropsModalAjout) {
  const [urlServeur, setUrlServeur] = useState('')
  const [copie, setCopie] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrlServeur(window.location.origin)
    }
  }, [])

  if (!ouvert) return null

  function copier(texte: String) {
    navigator.clipboard?.writeText(texte.toString())
    setCopie(true)
    setTimeout(() => setCopie(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800 space-y-6 max-h-[90vh] overflow-y-auto">

        {/* En-tête de la Modale */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Ajouter un téléphone SMSIKA</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Scannez le QR Code pour installer et lier le téléphone.</p>
            </div>
          </div>
          <button
            onClick={onFermer}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenu principal QR Code */}
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-200/80 dark:bg-zinc-800/50 dark:border-zinc-700/80 text-center space-y-4">
          <QrCodeSvg valeur={urlServeur} taille={180} etiquette="Scannez depuis l'application SMSIKA" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
              Appairage automatique du serveur
            </p>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 max-w-sm">
              Ouvrez l'application SMSIKA sur le téléphone, appuyez sur « Scanner QR » puis pointez la caméra sur ce code pour enregistrer le serveur en 1 seconde.
            </p>
          </div>
        </div>

        {/* Bloc d'URL manuelle de secours */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
            URL du serveur (Saisie manuelle si besoin) :
          </label>
          <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-3 border border-slate-200 dark:bg-zinc-800 dark:border-zinc-700">
            <Link2 className="h-4 w-4 text-slate-400 shrink-0" />
            <code className="flex-1 truncate font-mono text-xs font-bold text-slate-800 dark:text-zinc-200">
              {urlServeur || 'https://sms-gateway-omega.vercel.app'}
            </code>
            <button
              onClick={() => copier(urlServeur || 'https://sms-gateway-omega.vercel.app')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              {copie ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Banner Avertissement */}
        <div className="rounded-xl bg-amber-50 p-3 border border-amber-200 text-xs text-amber-900 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>N'oubliez pas d'accorder les permissions SMS et Batterie sans restriction.</span>
        </div>

        {/* Pied de Modale */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800">
          <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-zinc-500">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Sécurité chiffrée
          </span>
          <button
            onClick={onFermer}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  )
}
