'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  MessageSquare, User, Lock, Eye, EyeOff, Loader2,
  AlertTriangle, Moon, Sun, CheckCircle2, ArrowRight,
} from 'lucide-react'
import { useTheme } from '../../lib/use-theme'

function safeNext(raw: string | null): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw
  return '/dashboard'
}

export default function LoginPage() {
  const router = useRouter()

  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [next, setNext] = useState('/dashboard')
  const { darkMode, mounted, toggleTheme } = useTheme()

  useEffect(() => {
    setNext(safeNext(new URLSearchParams(window.location.search).get('next')))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      // La session est posée en cookie httpOnly par le serveur :
      // rien à stocker côté client.
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, pass: password, remember }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error ?? 'Identifiants incorrects')
        return
      }
      router.replace(next)
    } catch {
      setError('Impossible de joindre le serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-zinc-100 dark:bg-zinc-950">
      {/* ========== PANNEAU GAUCHE : branding (desktop uniquement) ========== */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-zinc-900 p-12 lg:flex">
        {/* Décor : halos dégradés */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">SMS Gateway</p>
            <p className="text-xs text-zinc-400">Panneau de contrôle</p>
          </div>
        </div>

        {/* Pitch */}
        <div className="relative max-w-md">
          <h2 className="text-3xl font-bold leading-tight text-white">
            Envoyez des SMS<br />via vos propres téléphones.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">
            Sans Twilio, sans abonnement. Un serveur, une file d&apos;attente,
            et vos appareils Android qui envoient en arrière-plan.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              'File d\u2019attente avec gestion multi-appareils',
              'Notifications push en temps réel',
              'Dashboard de supervision 24/7',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-zinc-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600/20">
                  <CheckCircle2 className="h-3 w-3 text-blue-400" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-zinc-500">© 2026 SMS Gateway — Projet interne</p>
      </div>

      {/* ========== PANNEAU DROIT : formulaire ========== */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Header mobile + toggle thème */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
              <p className="text-sm font-bold text-zinc-900 dark:text-white">SMS Gateway</p>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              title={!mounted ? 'Thème' : darkMode ? 'Mode clair' : 'Mode sombre'}
              className="ml-auto rounded-lg border border-zinc-200 bg-white p-2 text-zinc-600 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {!mounted || !darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Connexion
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Accédez au panneau de contrôle de votre passerelle SMS.
          </p>

          {/* Erreur */}
          {error && (
            <div className="mt-5 flex items-center gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Identifiant */}
            <div>
              <label htmlFor="user" className="mb-1.5 block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Identifiant
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  id="user"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="admin"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-10 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Se souvenir de moi */}
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500/20"
              />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Rester connecté sur cet appareil (7 jours)</span>
            </label>

            {/* Bouton */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Se connecter <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-zinc-400">
            Accès réservé — contactez votre administrateur pour obtenir un compte.
          </p>
        </div>
      </div>
    </div>
  )
}
