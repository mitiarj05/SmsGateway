'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Send, Loader2, CheckCircle2, AlertTriangle, ArrowLeft, Moon, Sun } from 'lucide-react'
import { useTheme } from '../../lib/use-theme'

export default function PageDemandeAcces() {
  const { modeSombre, monte, basculerTheme } = useTheme()
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
        setResultat({ reussi: true, texte: donnees?.message ?? 'Demande transmise avec succès' })
        setNom('')
        setContact('')
        setUsagePrevu('')
      } else {
        setResultat({ reussi: false, texte: donnees?.error ?? 'Erreur lors de l’envoi' })
      }
    } catch {
      setResultat({ reussi: false, texte: 'Serveur injoignable' })
    } finally {
      setEnvoiEnCours(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-800 dark:bg-[#0B0F19] dark:text-zinc-100 p-6 font-sans antialiased transition-colors relative">
      {/* Toggle thème en haut à droite */}
      <button
        type="button"
        onClick={basculerTheme}
        title={!monte ? 'Thème' : modeSombre ? 'Mode clair' : 'Mode sombre'}
        className="absolute top-6 right-6 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 shadow-sm hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
      >
        {!monte || !modeSombre ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </button>

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-200/80 dark:bg-[#131926] dark:border-zinc-800/80 space-y-6">
        <div className="flex items-center gap-3">
          <Image src="/smsika.png" alt="SMSIKA" width={40} height={40} className="rounded-xl shrink-0" />
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Demander l'accès API</h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Réponse sous 24 h — clé d'accès générée après validation</p>
          </div>
        </div>

        {resultat && (
          <div className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-xs font-medium ${
            resultat.reussi
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400'
          }`}>
            {resultat.reussi ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" /> : <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />}
            {resultat.texte}
          </div>
        )}

        <form onSubmit={soumettre} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-400 mb-1.5">
              Nom / Société
            </label>
            <input
              type="text"
              required
              maxLength={80}
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex. Pharmacie du Centre"
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-[#0B0F19] dark:text-white dark:placeholder-zinc-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-400 mb-1.5">
              Contact (e-mail ou téléphone)
            </label>
            <input
              type="text"
              required
              maxLength={80}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="votre-email@exemple.com ou +261..."
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-[#0B0F19] dark:text-white dark:placeholder-zinc-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-400 mb-1.5">
              Usage prévu
            </label>
            <textarea
              required
              rows={3}
              maxLength={500}
              value={usagePrevu}
              onChange={(e) => setUsagePrevu(e.target.value)}
              placeholder="OTP d'authentification pour mon application mobile, environ 500 SMS/mois..."
              className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-[#0B0F19] dark:text-white dark:placeholder-zinc-500"
            />
          </div>

          <button
            type="submit"
            disabled={envoiEnCours}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 transition"
          >
            {envoiEnCours ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {envoiEnCours ? 'Transmission en cours...' : 'Envoyer la demande'}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80 text-center">
          <Link href="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition">
            <ArrowLeft className="h-3.5 w-3.5" /> Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  )
}
