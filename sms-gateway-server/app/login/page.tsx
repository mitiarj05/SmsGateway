'use client'

import { useState, useEffect, useRef } from 'react'
import { CaseAntiRobot, type PoigneeAntiRobot } from '../../composants/CaseAntiRobot'
import { creerSupabaseNavigateur } from '../../lib/supabase-navigateur'
import { useReveal } from '../../lib/use-reveal'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Eye, EyeOff, Loader2,
  AlertTriangle, Check
} from 'lucide-react'

function destinationSure(brute: string | null): string {
  if (brute && brute.startsWith('/') && !brute.startsWith('//')) return brute
  return '/dashboard'
}

export default function PageConnexion() {
  useReveal()
  const routeur = useRouter()

  // Sign-in en 2 temps : e-mail + Continuer, puis mot de passe.
  const [etape, setEtape] = useState<'email' | 'mdp'>('email')
  const [utilisateur, setUtilisateur] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false)
  const [seSouvenir, setSeSouvenir] = useState(true)
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
      setErreur('Aucun compte Google trouvé pour cet e-mail — vérifiez l\u2019adresse ou inscrivez-vous.')
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
    if (demande === 'client') {
      setErreur('La connexion par clé API est remplacée par votre compte — connectez-vous avec votre e-mail.')
    }
    const brut = parametres.get('next')
    setDestination(destinationSure(brut))
  }, [])

  /** Bouton Google visible : OAuth direct, le serveur distingue inscription/connexion. */
  async function connexionGoogleManuelle() {
    setErreur(null)
    setGoogleEnCours(true)
    try {
      const supabase = creerSupabaseNavigateur()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/api/auth/google/retour?finalite=connexion` },
      })
      if (error) {
        setErreur('Google indisponible pour le moment — continuez avec votre e-mail.')
        setGoogleEnCours(false)
      }
      // Sinon : redirection vers Google, le callback ouvre l'espace ou affiche l'erreur.
    } catch {
      setErreur('Google indisponible pour le moment — continuez avec votre e-mail.')
      setGoogleEnCours(false)
    }
  }

  async function gererSoumission(e: React.FormEvent) {
    e.preventDefault()
    setErreur(null)
    setChargement(true)
    try {
      {
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
        // Compte client standard : Supabase Auth puis session espace.
        try {
          const supabase = creerSupabaseNavigateur()
          const { error } = await supabase.auth.signInWithPassword({
            email: utilisateur.trim(),
            password: motDePasse,
          })
          if (!error) {
            const session = await fetch('/api/auth/session-espace', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ captcha }),
            })
            const donneesSession = await session.json().catch(() => null)
            if (session.ok) {
              routeur.replace('/espace')
              return
            }
            setErreur(donneesSession?.error ?? 'Aucun espace associé à ce compte')
            captchaRef.current?.reinitialiser()
            setChargement(false)
            return
          }
        } catch {
          // Repli : identifiants administrateur ci-dessous.
        }
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
      }
    } catch {
      setErreur('Impossible de joindre le serveur')
    } finally {
      setChargement(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] font-sans text-[#1C1917] antialiased selection:bg-[#2563EB] selection:text-white">
      <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-12 px-6 py-14 lg:grid-cols-2 lg:px-8">

        {/* Colonne marque */}
        <div className="space-y-7">
          <Link href="/" title="Retour à l'accueil" className="inline-block">
            <Image src="/icons/logoClair.png" alt="SMSTSIKA — retour à l'accueil" width={180} height={42} className="h-10 w-auto" />
          </Link>

          <h1 className="max-w-md font-sans text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Connectez-vous à votre console SMSTSIKA et pilotez vos envois :
          </h1>

          <ul className="space-y-3 text-sm font-medium text-stone-600">
            <li className="flex items-center gap-3">
              <Check className="h-4 w-4 shrink-0 text-[#15803B]" />
              <span>Console admin et espace client réunis</span>
            </li>
            <li className="flex items-center gap-3">
              <Check className="h-4 w-4 shrink-0 text-[#15803B]" />
              <span>Suivi des appareils et des envois en direct</span>
            </li>
            <li className="flex items-center gap-3">
              <Check className="h-4 w-4 shrink-0 text-[#15803B]" />
              <span>Clé API remise après validation</span>
            </li>
          </ul>

          <p className="font-mono text-[11px] text-stone-500">
            *Accès sous réserve de validation par l'administrateur.
          </p>
        </div>

        {/* Carte formulaire */}
        <div className="w-full">
          <div data-reveal="zoom" className="mx-auto w-full max-w-md space-y-6 rounded-2xl border border-[#1C1917]/10 bg-white p-8 shadow-[0_24px_60px_-30px_rgba(28,25,23,0.25)] sm:p-10">

            <div className="space-y-1 text-center">
              <h2 className="font-sans text-2xl font-extrabold tracking-tight text-[#1C1917]">
                Se connecter
              </h2>
              <p className="text-xs text-stone-500">
                Connectez-vous à votre console SMSTSIKA.
              </p>
            </div>

            {erreur && (
              <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                {erreur}
              </div>
            )}

            <form onSubmit={gererSoumission} className="space-y-4">
              {etape === 'email' ? (
                    <div className="space-y-1">
                      <label htmlFor="utilisateur" className="block text-xs font-semibold text-stone-700">
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
                        className="w-full rounded-lg border border-[#1C1917]/15 bg-white p-3 text-xs font-medium text-[#1C1917] outline-none transition placeholder:text-stone-400 focus:border-[#2563EB]"
                      />
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => { setEtape('email'); setErreur(null) }}
                        title="Modifier l'adresse e-mail"
                        className="flex w-full items-center justify-between gap-2 rounded-lg bg-[#F7F5F0] px-3 py-2.5 text-xs transition hover:bg-[#1C1917]/5"
                      >
                        <span className="truncate font-semibold text-stone-700">{utilisateur}</span>
                        <span className="shrink-0 font-bold text-[#1D4ED8]">Modifier</span>
                      </button>
                      <div className="space-y-1">
                        <label htmlFor="motDePasse" className="block text-xs font-semibold text-stone-700">
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
                            className="w-full rounded-lg border border-[#1C1917]/15 bg-white p-3 pr-10 text-xs font-medium text-[#1C1917] outline-none transition placeholder:text-stone-400 focus:border-[#2563EB]"
                          />
                          <button
                            type="button"
                            onClick={() => setAfficherMotDePasse(!afficherMotDePasse)}
                            title={afficherMotDePasse ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 transition hover:text-[#1C1917]"
                          >
                            {afficherMotDePasse ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                        <label className="flex cursor-pointer items-center gap-2 text-stone-500">
                          <input
                            type="checkbox"
                            checked={seSouvenir}
                            onChange={(e) => setSeSouvenir(e.target.checked)}
                            className="h-4 w-4 rounded border-[#1C1917]/20 accent-[#2563EB]"
                          />
                          <span>Rester connecté sur cet appareil</span>
                        </label>
                        <Link href="/mot-de-passe-oublie" className="shrink-0 font-bold text-[#1D4ED8] hover:underline">
                          Mot de passe oublié ?
                        </Link>
                      </div>
                    </>
                  )}

              <CaseAntiRobot ref={captchaRef} cleSite={cleSiteCaptcha} change={setCaptcha} />

              <button
                type="submit"
                disabled={chargement}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563EB] py-3.5 text-xs font-bold text-white transition hover:bg-[#1D4ED8] disabled:opacity-60"
              >
                {googleEnCours ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Redirection vers Google…</>
                ) : chargement ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  etape === 'email' ? 'Continuer' : 'Se connecter'
                )}
              </button>
              {etape === 'email' && (
                <>
                  <div className="relative flex items-center justify-center text-center">
                    <div className="w-full border-t border-[#1C1917]/10" />
                    <span className="absolute bg-white px-3 text-[10.5px] font-bold uppercase text-stone-400">
                      OR
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={connexionGoogleManuelle}
                    disabled={googleEnCours || chargement}
                    className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-[#1C1917]/15 bg-white py-3 text-xs font-bold text-[#1C1917] transition hover:bg-[#F7F5F0] disabled:opacity-60"
                  >
                    {googleEnCours ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <img
                          src="/icons/google.jpg"
                          alt="Google"
                          className="h-4 w-4 object-contain"
                        />
                        Continuer avec Google
                      </>
                    )}
                  </button>
                </>
              )}
            </form>

            <div className="text-center text-xs text-stone-500">
              Pas encore de compte ?{' '}
              <Link href="/inscription" className="font-bold text-[#1D4ED8] hover:underline">
                S'inscrire
              </Link>
            </div>

          </div>

          <div className="mx-auto mt-6 max-w-md space-y-2 text-center">
            <div className="flex justify-center gap-3 font-mono text-[11px] text-stone-500">
              <Link href="/mentions-legales" className="transition hover:text-[#1C1917] hover:underline">Mentions légales</Link>
              <span>|</span>
              <Link href="/confidentialite" className="transition hover:text-[#1C1917] hover:underline">Politique de confidentialité</Link>
            </div>
            <p className="font-mono text-[11px] text-stone-400">© 2026 SMSTSIKA · Tous droits réservés</p>
          </div>
        </div>

      </div>
    </div>
  )
}
