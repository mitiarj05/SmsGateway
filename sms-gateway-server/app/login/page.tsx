'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  User, Lock, Eye, EyeOff, Loader2, KeyRound,
  AlertTriangle, CheckCircle2, ArrowRight, Moon, Sun,
} from 'lucide-react'
import { useTheme } from '../../lib/use-theme'

function destinationSure(brute: string | null): string {
  if (brute && brute.startsWith('/') && !brute.startsWith('//')) return brute
  return '/dashboard'
}

export default function PageConnexion() {
  const routeur = useRouter()
  const { modeSombre, monte, basculerTheme } = useTheme()

  const [onglet, setOnglet] = useState<'admin' | 'client'>('admin')
  const [utilisateur, setUtilisateur] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false)
  const [seSouvenir, setSeSouvenir] = useState(true)
  const [cleApi, setCleApi] = useState('')
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [destination, setDestination] = useState('/dashboard')

  useEffect(() => {
    const parametres = new URLSearchParams(window.location.search)
    const demande = parametres.get('onglet')
    const initial = demande === 'client' ? 'client' : 'admin'
    setOnglet(initial)
    const brut = parametres.get('next')
    setDestination(
      initial === 'client'
        ? (brut && brut.startsWith('/espace') && !brut.startsWith('//') ? brut : '/espace')
        : destinationSure(brut)
    )
  }, [])

  function changerOnglet(prochain: 'admin' | 'client') {
    setOnglet(prochain)
    setErreur(null)
    setDestination(prochain === 'client' ? '/espace' : '/dashboard')
  }

  async function gererSoumission(e: React.FormEvent) {
    e.preventDefault()
    setErreur(null)
    setChargement(true)
    try {
      if (onglet === 'admin') {
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
        routeur.replace(destination.startsWith('/espace') ? '/dashboard' : destination)
      } else {
        const reponse = await fetch('/api/espace/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cle_api: cleApi.trim() }),
        })
        const donnees = await reponse.json().catch(() => null)
        if (!reponse.ok) {
          setErreur(donnees?.error ?? 'Clé API invalide')
          return
        }
        routeur.replace(destination.startsWith('/espace') ? destination : '/espace')
      }
    } catch {
      setErreur('Impossible de joindre le serveur')
    } finally {
      setChargement(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 dark:bg-[#0B0F19] dark:text-zinc-100 font-sans antialiased transition-colors">
      {/* ========== PANNEAU GAUCHE : Branding ========== */}
      <div className="relative hidden w-1/2 flex-col justify-between border-r border-slate-200/80 bg-[#0B0F19] p-12 lg:flex dark:border-zinc-800/80">
        {/* Halos décoratifs */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

        {/* Logo */}
        <Link href="/" className="relative flex w-fit items-center gap-3" title="Accueil">
          <Image src="/smsika.png" alt="SMSIKA" width={40} height={40} className="rounded-xl shrink-0" />
          <div>
            <p className="text-base font-bold text-white tracking-tight">SMSIKA</p>
            <p className="text-xs text-zinc-400 font-medium">Console SMS</p>
          </div>
        </Link>

        {/* Pitch */}
        <div className="relative max-w-md space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
            Envoyez vos SMS<br />via vos propres téléphones.
          </h2>
          <p className="text-xs leading-relaxed text-zinc-400">
            Une infrastructure autohébergée complète : file d'attente intelligente, notifications push FCM et supervision 24/7.
          </p>
          <ul className="space-y-3">
            {[
              'Supervision et gestion multi-appareils',
              'Notifications push instantanées en arrière-plan',
              'Clés API dédiées et webhooks sécurisés',
            ].map((element) => (
              <li key={element} className="flex items-center gap-3 text-xs text-zinc-300 font-medium">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </span>
                {element}
              </li>
            ))}
          </ul>
        </div>

        {/* Status card */}
        <div className="relative rounded-2xl bg-[#131926] p-4 border border-zinc-800/80 max-w-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <p className="text-xs font-semibold text-zinc-200">Systèmes opérationnels</p>
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">SMSIKA v2.4.1 · Passerelle connectée</p>
        </div>
      </div>

      {/* ========== PANNEAU DROIT : Formulaire de connexion ========== */}
      <div className="flex flex-1 items-center justify-center p-6 relative">
        {/* Toggle thème en haut à droite */}
        <button
          type="button"
          onClick={basculerTheme}
          title={!monte ? 'Thème' : modeSombre ? 'Mode clair' : 'Mode sombre'}
          className="absolute top-6 right-6 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 shadow-sm hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
        >
          {!monte || !modeSombre ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        <div className="w-full max-w-sm space-y-6">
          {/* Logo Mobile */}
          <Link href="/" className="flex items-center gap-3 lg:hidden" title="Accueil">
            <Image src="/smsika.png" alt="SMSIKA" width={36} height={36} className="rounded-xl shrink-0" />
            <p className="text-base font-bold text-slate-900 dark:text-white">SMSIKA</p>
          </Link>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Connexion
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              {onglet === 'admin'
                ? <>Identifiants d'accès au <span className="font-semibold text-slate-800 dark:text-zinc-200">panneau d'administration</span>.</>
                : <>Espace client : renseignez votre <span className="font-semibold text-slate-800 dark:text-zinc-200">clé API</span>.</>}
            </p>
          </div>

          {/* Onglets Administrateur / Client */}
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-200/60 p-1 dark:bg-[#131926] dark:border dark:border-zinc-800/80">
            {(['admin', 'client'] as const).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => changerOnglet(o)}
                className={`rounded-lg py-2 text-xs font-semibold transition ${
                  onglet === o
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-[#1E293B] dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
                }`}>
                {o === 'admin' ? 'Administrateur' : 'Espace Client'}
              </button>
            ))}
          </div>

          {/* Erreur */}
          {erreur && (
            <div className="flex items-center gap-2.5 rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
              {erreur}
            </div>
          )}

          <form onSubmit={gererSoumission} className="space-y-4">
            {onglet === 'admin' ? (
              <>
                {/* Identifiant */}
                <div>
                  <label htmlFor="utilisateur" className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-zinc-400">
                    Identifiant
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                    <input
                      id="utilisateur"
                      type="text"
                      required
                      autoComplete="username"
                      placeholder="admin"
                      value={utilisateur}
                      onChange={(e) => setUtilisateur(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-[#131926] dark:text-white dark:placeholder-zinc-500"
                    />
                  </div>
                </div>

                {/* Mot de passe */}
                <div>
                  <label htmlFor="motDePasse" className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-zinc-400">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                    <input
                      id="motDePasse"
                      type={afficherMotDePasse ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={motDePasse}
                      onChange={(e) => setMotDePasse(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-[#131926] dark:text-white dark:placeholder-zinc-500"
                    />
                    <button
                      type="button"
                      onClick={() => setAfficherMotDePasse(!afficherMotDePasse)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
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
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800"
                  />
                  <span className="text-xs text-slate-600 dark:text-zinc-400">Rester connecté (7 jours)</span>
                </label>
              </>
            ) : (
              <div>
                <label htmlFor="cleApi" className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-zinc-400">
                  Clé d'API Client
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                  <input
                    id="cleApi"
                    type="password"
                    required
                    autoComplete="off"
                    placeholder="cle_..."
                    value={cleApi}
                    onChange={(e) => setCleApi(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 font-mono text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-[#131926] dark:text-white dark:placeholder-zinc-500"
                  />
                </div>
                <p className="mt-2 text-[11px] text-slate-500 dark:text-zinc-500 leading-relaxed">
                  Fournie par votre administrateur après validation de votre demande d'accès.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={chargement}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 transition"
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

          <p className="text-center text-xs text-slate-500 dark:text-zinc-500">
            Pas encore de compte ?{' '}
            <Link href="/demande-acces" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              Demandez l'accès API
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
