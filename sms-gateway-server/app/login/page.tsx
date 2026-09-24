'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  MessageSquare, User, Lock, Eye, EyeOff, Loader2,
  AlertTriangle, Moon, Sun, CheckCircle2, ArrowRight,
} from 'lucide-react'
import { useTheme } from '../../lib/use-theme'

function destinationSure(brute: string | null): string {
  if (brute && brute.startsWith('/') && !brute.startsWith('//')) return brute
  return '/dashboard'
}

export default function PageConnexion() {
  const routeur = useRouter()

  const [utilisateur, setUtilisateur] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false)
  const [seSouvenir, setSeSouvenir] = useState(true)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [destination, setDestination] = useState('/dashboard')
  const { modeSombre, monte, basculerTheme } = useTheme()

  useEffect(() => {
    setDestination(destinationSure(new URLSearchParams(window.location.search).get('next')))
  }, [])

  async function gererSoumission(e: React.FormEvent) {
    e.preventDefault()
    setErreur(null)
    setChargement(true)
    try {
      // La session est posée en cookie httpOnly par le serveur :
      // rien à stocker côté client.
      const reponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utilisateur, mot_de_passe: motDePasse, se_souvenir: seSouvenir }),
      })
      const donnees = await reponse.json().catch(() => null)
      if (!reponse.ok) {
        setErreur(donnees?.error ?? 'Identifiants incorrects')
        return
      }
      routeur.replace(destination)
    } catch {
      setErreur('Impossible de joindre le serveur')
    } finally {
      setChargement(false)
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
          <Image src="/smsika.png" alt="SMSIKA" width={40} height={40} className="rounded-xl" />
          <div>
            <p className="text-sm font-bold text-white">SMSIKA</p>
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
            ].map((element) => (
              <li key={element} className="flex items-center gap-3 text-sm text-zinc-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600/20">
                  <CheckCircle2 className="h-3 w-3 text-blue-400" />
                </span>
                {element}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-zinc-500">© 2026 SMSIKA — Projet interne</p>
      </div>

      {/* ========== PANNEAU DROIT : formulaire ========== */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Header mobile + toggle thème */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3 lg:hidden">
              <Image src="/smsika.png" alt="SMSIKA" width={36} height={36} className="rounded-xl" />
              <p className="text-sm font-bold text-zinc-900 dark:text-white">SMSIKA</p>
            </div>
            <button
              type="button"
              onClick={basculerTheme}
              title={!monte ? 'Thème' : modeSombre ? 'Mode clair' : 'Mode sombre'}
              className="ml-auto rounded-lg border border-zinc-200 bg-white p-2 text-zinc-600 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {!monte || !modeSombre ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Connexion
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Accédez au panneau de contrôle de votre passerelle SMS.
          </p>

          {/* Erreur */}
          {erreur && (
            <div className="mt-5 flex items-center gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {erreur}
            </div>
          )}

          <form onSubmit={gererSoumission} className="mt-6 space-y-4">
            {/* Identifiant */}
            <div>
              <label htmlFor="utilisateur" className="mb-1.5 block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Identifiant
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  id="utilisateur"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="admin"
                  value={utilisateur}
                  onChange={(e) => setUtilisateur(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="motDePasse" className="mb-1.5 block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  id="motDePasse"
                  type={afficherMotDePasse ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-10 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <button
                  type="button"
                  onClick={() => setAfficherMotDePasse(!afficherMotDePasse)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  {afficherMotDePasse ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Se souvenir de moi */}
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={seSouvenir}
                onChange={(e) => setSeSouvenir(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500/20"
              />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Rester connecté sur cet appareil (7 jours)</span>
            </label>

            {/* Bouton */}
            <button
              type="submit"
              disabled={chargement}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
            >
              {chargement ? (
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
