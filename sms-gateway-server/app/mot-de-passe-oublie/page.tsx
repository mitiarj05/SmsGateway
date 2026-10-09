'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { creerSupabaseNavigateur } from '../../lib/supabase-navigateur'

/** Demande de lien de réinitialisation (e-mail Supabase Auth). */
export default function PageMotDePasseOublie() {
  const [email, setEmail] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null)

  async function demander(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setEnvoi(true)
    try {
      const supabase = creerSupabaseNavigateur()
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
      })
      if (error) {
        setMessage({ ok: false, texte: 'Envoi impossible — vérifiez l\u2019adresse e-mail.' })
        return
      }
      setMessage({ ok: true, texte: 'E-mail envoyé — cliquez le lien pour choisir un nouveau mot de passe.' })
    } catch {
      setMessage({ ok: false, texte: 'Serveur injoignable' })
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-800 font-sans antialiased flex flex-col items-center justify-center p-6 selection:bg-blue-600 selection:text-white dark:bg-[#0B0F19] dark:text-zinc-100">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 sm:p-10 shadow-2xl text-slate-900 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Mot de passe oublié</h1>
          <p className="text-xs text-slate-500">
            Saisissez l'e-mail de votre compte — vous recevrez un lien de réinitialisation.
          </p>
        </div>
        {message && (
          <div className={`flex items-center gap-2.5 rounded-xl border p-3 text-xs font-semibold ${
            message.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}>
            {message.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />}
            {message.texte}
          </div>
        )}
        <form onSubmit={demander} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="block text-xs font-semibold text-slate-700">
              Adresse e-mail*
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@entreprise.com"
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium transition"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={envoi}
            className="w-full rounded-xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] py-3.5 text-xs font-bold text-white shadow-[0_20px_40px_-15px_rgba(124,58,237,0.5)] hover:-translate-y-0.5 disabled:opacity-60 transition flex items-center justify-center gap-2"
          >
            {envoi ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Envoyer le lien'}
          </button>
        </form>
        <p className="text-center text-xs text-slate-500">
          <Link href="/login" className="font-bold text-blue-600 hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  )
}
