'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock, Loader2, AlertTriangle } from 'lucide-react'
import { creerSupabaseNavigateur } from '../../lib/supabase-navigateur'

/** Nouveau mot de passe après clic du lien e-mail (session de récupération Supabase). */
export default function PageReinitialiserMotDePasse() {
  const routeur = useRouter()
  const [motDePasse, setMotDePasse] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function valider(e: React.FormEvent) {
    e.preventDefault()
    setErreur(null)
    if (motDePasse.length < 8) {
      setErreur('Mot de passe : 8 caractères minimum')
      return
    }
    if (motDePasse !== confirmation) {
      setErreur('Les deux mots de passe ne correspondent pas')
      return
    }
    setEnvoi(true)
    try {
      const supabase = creerSupabaseNavigateur()
      const { error } = await supabase.auth.updateUser({ password: motDePasse })
      if (error) {
        setErreur('Lien invalide ou expiré — refaites une demande.')
        return
      }
      await supabase.auth.signOut()
      routeur.replace('/login')
    } catch {
      setErreur('Serveur injoignable')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-[#1C1917] font-sans antialiased flex flex-col items-center justify-center p-6 selection:bg-blue-600 selection:text-white dark:bg-[#0B0F19] dark:text-zinc-100">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 sm:p-10 shadow-2xl text-[#1C1917] space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-[#1C1917]">Nouveau mot de passe</h1>
          <p className="text-xs text-stone-600">
            Choisissez le mot de passe de votre compte.
          </p>
        </div>
        {erreur && (
          <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            {erreur}
          </div>
        )}
        <form onSubmit={valider} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="mdp" className="block text-xs font-semibold text-stone-700">
              Nouveau mot de passe*
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
              <input
                id="mdp"
                type="password"
                required
                autoComplete="new-password"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                placeholder="8 caractères minimum"
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-xs text-[#1C1917] placeholder-stone-400 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium transition"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="mdp2" className="block text-xs font-semibold text-stone-700">
              Confirmation*
            </label>
            <input
              id="mdp2"
              type="password"
              required
              autoComplete="new-password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="Répétez le mot de passe"
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-[#1C1917] placeholder-stone-400 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium transition"
            />
          </div>
          <button
            type="submit"
            disabled={envoi}
            className="w-full rounded-xl bg-[#2563EB] py-3.5 text-xs font-bold text-white disabled:opacity-60 transition flex items-center justify-center gap-2"
          >
            {envoi ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enregistrer'}
          </button>
        </form>
        <p className="text-center text-xs text-stone-600">
          <Link href="/login" className="font-bold text-blue-600 hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  )
}
