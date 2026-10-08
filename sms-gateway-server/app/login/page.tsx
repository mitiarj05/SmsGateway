'use client'

import { useState, useEffect, useRef } from 'react'
import { CaseAntiRobot, type PoigneeAntiRobot } from '../../composants/CaseAntiRobot'
import { creerSupabaseNavigateur } from '../../lib/supabase-navigateur'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Lock, Eye, EyeOff, Loader2, KeyRound,
  AlertTriangle, Mail, Check
} from 'lucide-react'

function destinationSure(brute: string | null): string {
  if (brute && brute.startsWith('/') && !brute.startsWith('//')) return brute
  return '/dashboard'
}

export default function PageConnexion() {
  const routeur = useRouter()

  const [onglet, setOnglet] = useState<'admin' | 'client'>('admin')
  // Sign-in en 2 temps : e-mail + Continuer, puis mot de passe. Aucun choix d'espace affiché.
  const [etape, setEtape] = useState<'email' | 'mdp'>('email')
  const [utilisateur, setUtilisateur] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false)
  const [seSouvenir, setSeSouvenir] = useState(true)
  const [cleApi, setCleApi] = useState('')
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [destination, setDestination] = useState('/dashboard')
  const [captcha, setCaptcha] = useState<string | null>(null)
  const captchaRef = useRef<PoigneeAntiRobot>(null)
  const cleSiteCaptcha = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
  const [googleEnCours, setGoogleEnCours] = useState(false)

  /** Exige la case anti-robot quand les clés sont configurées. */
  function captchaExige(): boolean {
    if (!cleSiteCaptcha) return true
    if (!captcha) {
      setErreur('Veuillez cocher « Je ne suis pas un robot »')
      setChargement(false)
      return false
    }
    return true
  }

  useEffect(() => {
    const parametres = new URLSearchParams(window.location.search)
    const echecGoogle = parametres.get('google')
    if (echecGoogle === 'compte-introuvable') {
      setErreur('Aucun compte Google trouvé pour cet e-mail — vérifiez l\u2019adresse ou demandez un accès.')
    } else if (echecGoogle === 'application-introuvable') {
      setErreur('Compte retrouvé mais espace introuvable — contactez votre administrateur.')
    } else if (echecGoogle) {
      setErreur('Connexion Google interrompue — réessayez.')
    }
    if (echecGoogle) {
      const urlPropre = new URL(window.location.href)
      urlPropre.searchParams.delete('google')
      window.history.replaceState(null, '', urlPropre.pathname + urlPropre.search + urlPropre.hash)
    }
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

  async function gererSoumission(e: React.FormEvent) {
    e.preventDefault()
    setErreur(null)
    setChargement(true)
    try {
      if (onglet === 'admin') {
        if (etape === 'email') {
          const email = utilisateur.trim()
          if (!email) {
            setErreur('Saisissez votre adresse e-mail pour continuer')
            setChargement(false)
            return
          }
          // Compte inscrit via Google ? → OAuth direct vers l'espace, sans mot de passe.
          if (email.includes('@')) {
            try {
              const verif = await fetch('/api/auth/google/commencer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
              })
              const resultat = await verif.json().catch(() => null)
              if (resultat?.google) {
                setGoogleEnCours(true)
                const supabase = creerSupabaseNavigateur()
                const { error } = await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: {
                    redirectTo: `${window.location.origin}/api/auth/google/retour?finalite=connexion`,
                    queryParams: { login_hint: email },
                  },
                })
                if (error) {
                  setGoogleEnCours(false)
                  setErreur('Google indisponible pour le moment — continuez avec votre mot de passe.')
                  setEtape('mdp')
                  setChargement(false)
                  return
                }
                return // redirection vers Google en cours
              }
            } catch {
              // Repli : étape mot de passe classique.
            }
          }
          setEtape('mdp')
          setChargement(false)
          return
        }
        if (!captchaExige()) return
        const reponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ utilisateur, mot_de_passe: motDePasse, se_souvenir: seSouvenir, captcha }),
        })
        const donnees = await reponse.json().catch(() => null)
        if (!reponse.ok) {
          setErreur(donnees?.error ?? 'Identifiants incorrects')
          captchaRef.current?.reinitialiser()
          return
        }
        routeur.replace(destination.startsWith('/espace') ? '/dashboard' : destination)
      } else {
        if (!captchaExige()) return
        const reponse = await fetch('/api/espace/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cle_api: cleApi.trim(), captcha }),
        })
        const donnees = await reponse.json().catch(() => null)
        if (!reponse.ok) {
          setErreur(donnees?.error ?? 'Clé API invalide')
          captchaRef.current?.reinitialiser()
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
    <div className="min-h-screen bg-[#03102C] text-white font-sans antialiased flex flex-col justify-between p-6 sm:p-12 selection:bg-blue-600 selection:text-white">

      {/* 2-Column Main Container (Exact Screenshot Layout) */}
      <div className="mx-auto max-w-6xl w-full my-auto grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">

        {/* Left Column (Value Proposition & Features Checklist - Exact Screenshot) */}
        <div className="space-y-8 pr-0 lg:pr-6">
          <Image src="/icons/SMSTSIKA.png" alt="SMSTSIKA" width={64} height={64} className="h-16 w-16" />

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl leading-tight">
            Connectez-vous à votre console SMSTSIKA et pilotez vos envois :
          </h1>

          <div className="space-y-3 text-sm text-blue-100 font-medium">
            <p className="flex items-center gap-3">
              <Check className="h-4 w-4 text-blue-400 shrink-0" />
              <span>Console admin et espace client réunis</span>
            </p>
            <p className="flex items-center gap-3">
              <Check className="h-4 w-4 text-blue-400 shrink-0" />
              <span>Suivi des appareils et des envois en direct</span>
            </p>
            <p className="flex items-center gap-3">
              <Check className="h-4 w-4 text-blue-400 shrink-0" />
              <span>Clé API remise après validation</span>
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <h2 className="text-xl font-bold text-white">Connexion en deux temps</h2>
            <div className="space-y-2.5 text-sm text-blue-100 font-medium">
              <p className="flex items-center gap-3">
                <Check className="h-4 w-4 text-blue-400 shrink-0" />
                <span>Saisissez votre adresse e-mail</span>
              </p>
              <p className="flex items-center gap-3">
                <Check className="h-4 w-4 text-blue-400 shrink-0" />
                <span>Poursuivez avec votre mot de passe</span>
              </p>
              <p className="flex items-center gap-3">
                <Check className="h-4 w-4 text-blue-400 shrink-0" />
                <span>Accédez à votre espace</span>
              </p>
            </div>
          </div>

          <p className="text-[11px] text-blue-300/60 pt-4">
            *Accès sous réserve de validation par l'administrateur.
          </p>
        </div>

        {/* Right Column (Pure White Card Container - Exact Screenshot) */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 sm:p-10 shadow-2xl text-slate-900 space-y-6">

            {/* Header Text */}
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-slate-900">
                {onglet === 'admin' ? 'Se connecter' : 'Espace Client'}
              </h2>
              <p className="text-xs text-slate-500">
                {onglet === 'admin'
                  ? 'Connectez-vous à votre console SMSTSIKA.'
                  : 'Connectez-vous avec la clé remise par votre administrateur.'}
              </p>
            </div>

            {/* Erreur */}
            {erreur && (
              <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                {erreur}
              </div>
            )}

            {/* Form Inputs (Floating Label Style Outline Boxes) */}
            <form onSubmit={gererSoumission} className="space-y-4">
              {onglet === 'admin' ? (
                <>
                  {etape === 'email' ? (
                    <div className="space-y-1">
                      <label htmlFor="utilisateur" className="block text-xs font-semibold text-slate-700">
                        Adresse e-mail*
                      </label>
                      <input
                        id="utilisateur"
                        type="email"
                        required
                        autoComplete="username"
                        placeholder="admin@smstsika.local"
                        value={utilisateur}
                        onChange={(e) => setUtilisateur(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium transition"
                      />
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => { setEtape('email'); setErreur(null) }}
                        title="Modifier l'adresse e-mail"
                        className="flex w-full items-center justify-between gap-2 rounded-xl bg-slate-100 px-3 py-2.5 text-xs hover:bg-slate-200/70 transition"
                      >
                        <span className="truncate font-semibold text-slate-700">{utilisateur}</span>
                        <span className="shrink-0 font-bold text-blue-600">Modifier</span>
                      </button>
                      <div className="space-y-1">
                        <label htmlFor="motDePasse" className="block text-xs font-semibold text-slate-700">
                          Mot de passe*
                        </label>
                        <div className="relative">
                          <input
                            id="motDePasse"
                            type={afficherMotDePasse ? 'text' : 'password'}
                            required
                            autoComplete="current-password"
                            placeholder="••••••••••"
                            value={motDePasse}
                            onChange={(e) => setMotDePasse(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-white p-3 pr-10 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium transition"
                          />
                          <button
                            type="button"
                            onClick={() => setAfficherMotDePasse(!afficherMotDePasse)}
                            title={afficherMotDePasse ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {afficherMotDePasse ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <label className="flex cursor-pointer items-center gap-2 pt-1 text-[11px] text-slate-500">
                        <input
                          type="checkbox"
                          checked={seSouvenir}
                          onChange={(e) => setSeSouvenir(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Rester connecté sur cet appareil</span>
                      </label>
                    </>
                  )}
                </>
              ) : (
                <div className="space-y-1">
                  <label htmlFor="cleApi" className="block text-xs font-semibold text-slate-700">
                    Clé d’API Client*
                  </label>
                  <div className="relative">
                    <input
                      id="cleApi"
                      type="password"
                      required
                      autoComplete="off"
                      placeholder="cle_..."
                      value={cleApi}
                      onChange={(e) => setCleApi(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-mono text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium transition"
                    />
                  </div>
                </div>
              )}

              {/* Case anti-robot (visible seulement si clés configurées) */}
              <CaseAntiRobot ref={captchaRef} cleSite={cleSiteCaptcha} change={setCaptcha} />

              {/* Primary Electric Blue Button */}
              <button
                type="submit"
                disabled={chargement}
                className="w-full rounded-xl bg-[#0066FF] py-3.5 text-xs font-bold text-white shadow-md hover:bg-[#0052CC] disabled:opacity-60 transition flex items-center justify-center gap-2"
              >
                {googleEnCours ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Redirection vers Google…</>
                ) : chargement ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  onglet === 'admin' && etape === 'email' ? 'Continuer' : 'Se connecter'
                )}
              </button>
            </form>

            <div className="text-center text-xs text-slate-500">
              Pas encore de compte ?{' '}
              <Link href="/demande-acces" className="font-bold text-blue-600 hover:underline">
                Demandez un accès API
              </Link>
            </div>

          </div>

          {/* Under Card Footer */}
          <div className="mt-6 text-center text-xs text-blue-200/70 space-y-2">
            <div className="flex justify-center gap-3">
              <span>Conditions d'utilisation</span>
              <span>|</span>
              <span>Politique de confidentialité</span>
            </div>
            <p className="text-[11px] text-blue-300/50">© 2026 SMSTSIKA · Tous droits réservés</p>
          </div>
        </div>

      </div>
    </div>
  )
}
