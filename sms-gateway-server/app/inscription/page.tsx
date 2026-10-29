'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useReveal } from '../../lib/use-reveal'
import { CaseAntiRobot, type PoigneeAntiRobot } from '../../composants/CaseAntiRobot'
import { creerSupabaseNavigateur } from '../../lib/supabase-navigateur'
import {
  Eye, EyeOff, Loader2, AlertTriangle, CheckCircle2, Mail, Lock, User, ArrowRight,
} from 'lucide-react'

/** Retour Supabase pour la soumission d'inscription (étape 1). */
type ReponseInscription = { code_envoye?: boolean; ok?: boolean; error?: string }

/** Retour Supabase pour la vérification du code (étape 2). */
type ReponseVerification = { ok?: boolean; error?: string }

function destinationSure(brute: string | null): string {
  if (brute && brute.startsWith('/') && !brute.startsWith('//')) return brute
  return '/espace'
}

export default function PageInscription() {
  useReveal()
  const routeur = useRouter()

  const cleSiteCaptcha = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
  const [etape, setEtape] = useState<'formulaire' | 'verification' | 'succes'>('formulaire')

  /* ---- État étape 1 : formulaire ---- */
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [confirmerMotDePasse, setConfirmerMotDePasse] = useState('')
  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false)
  const [afficherConfirmerMotDePasse, setAfficherConfirmerMotDePasse] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [captcha, setCaptcha] = useState<string | null>(null)
  const captchaRef = useRef<PoigneeAntiRobot>(null)

  /* ---- État étape 2 : vérification du code ---- */
  const [emailVerification, setEmailVerification] = useState('')
  const [code, setCode] = useState('')
  const [chargementVerification, setChargementVerification] = useState(false)
  const [erreurVerification, setErreurVerification] = useState<string | null>(null)
  const [renvoyerEnCours, setRenvoyerEnCours] = useState(false)

  /* ---- Redirection si déjà connecté ---- */
  useEffect(() => {
    let annule = false
    async function verifierSession() {
      try {
        const reponse = await fetch('/api/espace/moi')
        if (reponse.ok && !annule) {
          routeur.replace(destinationSure('/espace'))
        }
      } catch { /* silencieux */ }
    }
    verifierSession()
    return () => { annule = true }
  }, [routeur])

  /* ---- Validation côté client (étape 1) ---- */
  function validerFormulaire(): boolean {
    const nouvellesErreurs: Record<string, string> = {}
    let valide = true

    if (!nom.trim()) {
      nouvellesErreurs.nom = 'Indiquez votre nom ou celui de votre société'
      valide = false
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      nouvellesErreurs.email = 'Indiquez une adresse e-mail valide'
      valide = false
    }
    if (motDePasse.length < 8) {
      nouvellesErreurs.motDePasse = 'Mot de passe : 8 caractères minimum'
      valide = false
    }
    if (confirmerMotDePasse !== motDePasse) {
      nouvellesErreurs.confirmerMotDePasse = 'La confirmation ne correspond pas au mot de passe'
      valide = false
    }

    setErreurs(nouvellesErreurs)
    return valide
  }

  function captchaExige(): boolean {
    if (!cleSiteCaptcha) return true
    if (!captcha) {
      setErreurGlobale('Veuillez cocher « Je ne suis pas un robot »')
      setChargement(false)
      return false
    }
    return true
  }

  async function gererSoumission(e: React.FormEvent) {
    e.preventDefault()
    setErreurGlobale(null)
    setErreurs({})
    if (!validerFormulaire()) return
    if (!captchaExige()) return

    setChargement(true)
    try {
      const reponse = await fetch('/api/auth/inscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: nom.trim(),
          email: email.trim().toLowerCase(),
          mot_de_passe: motDePasse,
          captcha,
        }),
      })
      const donnees = await reponse.json().catch(() => ({})) as ReponseInscription

      if (reponse.ok && donnees.code_envoye) {
        setEmailVerification(email.trim().toLowerCase())
        setEtape('verification')
      } else if (reponse.ok && donnees.ok) {
        setEtape('succes')
        routeur.replace('/espace')
      } else {
        setErreurGlobale(donnees.error ?? 'Inscription impossible — réessayez.')
        captchaRef.current?.reinitialiser()
      }
    } catch {
      setErreurGlobale('Impossible de joindre le serveur')
    } finally {
      setChargement(false)
    }
  }

  /* ---- Étape 2 : vérification du code ---- */
  async function verifierCode() {
    setErreurVerification(null)
    setChargementVerification(true)
    try {
      const reponse = await fetch('/api/auth/inscription/verifier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailVerification, code: code.trim() }),
      })
      const donnees = await reponse.json().catch(() => ({})) as ReponseVerification

      if (reponse.ok && donnees.ok) {
        setEtape('succes')
        routeur.replace('/espace')
      } else {
        setErreurVerification(donnees.error ?? 'Code invalide — réessayez.')
      }
    } catch {
      setErreurVerification('Impossible de joindre le serveur')
    } finally {
      setChargementVerification(false)
    }
  }

  async function renvoyerCode() {
    if (!emailVerification) return
    setRenvoyerEnCours(true)
    try {
      const reponse = await fetch('/api/auth/inscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: '',
          email: emailVerification,
          mot_de_passe: '',
          captcha: null,
          renvoyer_code: true,
        }),
      })
      const donnees = await reponse.json().catch(() => ({})) as ReponseInscription
      if (!reponse.ok || !donnees.code_envoye) {
        setErreurVerification(donnees.error ?? 'Impossible de renvoyer le code.')
      }
    } catch {
      setErreurVerification('Impossible de joindre le serveur')
    } finally {
      setRenvoyerEnCours(false)
    }
  }

  /* ---- Connexion Google (inscription) ---- */
  async function inscriptionGoogle() {
    setErreurGlobale(null)
    try {
      const supabase = creerSupabaseNavigateur()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/google/retour?finalite=inscription`,
        },
      })
      if (error) {
        setErreurGlobale('Google indisponible pour le moment — continuez avec votre e-mail.')
      }
    } catch {
      setErreurGlobale('Google indisponible pour le moment — continuez avec votre e-mail.')
    }
  }

  function champErreur(nomChamp: string) {
    return erreurs[nomChamp] ? (
      <p className="mt-1 text-[11px] font-semibold text-rose-600">{erreurs[nomChamp]}</p>
    ) : null
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
            Créez votre compte SMSTSIKA
          </h1>

          <ul className="space-y-3 text-sm font-medium text-stone-600">
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#15803B]" />
              <span>Votre propre clé API pour envoyer des SMS</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#15803B]" />
              <span>Recevez les SMS de vos clients sur votre espace</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#15803B]" />
              <span>Vos numéros, vos tarifs, vos données restent chez vous</span>
            </li>
          </ul>

          <p className="font-mono text-[11px] text-stone-500">
            *Accès sous réserve de validation par l'administrateur.
          </p>
        </div>

        {/* Carte formulaire */}
        <div className="w-full">
          <div data-reveal="zoom" className="mx-auto w-full max-w-md space-y-6 rounded-2xl border border-[#1C1917]/10 bg-white p-8 shadow-[0_24px_60px_-30px_rgba(28,25,23,0.25)] sm:p-10">

            {/* ===== ÉTAPE 1 : FORMULAIRE D'INSCRIPTION ===== */}
            {etape === 'formulaire' && (
              <>
                <div className="space-y-1 text-center">
                  <h2 className="font-sans text-2xl font-extrabold tracking-tight text-[#1C1917]">Créer mon compte</h2>
                  <p className="text-xs text-stone-500">
                    Renseignez vos informations pour ouvrir votre espace.
                  </p>
                </div>

                {erreurGlobale && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                    {erreurGlobale}
                  </div>
                )}

                <form onSubmit={gererSoumission} className="space-y-5">
                  <div className="space-y-1">
                    <label htmlFor="nom" className="block text-xs font-semibold text-stone-700">
                      Nom ou société*
                    </label>
                    <input
                      id="nom"
                      type="text"
                      autoComplete="name"
                      placeholder="Ex. Ma boutique"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      className={`w-full rounded-lg border px-3 py-3 text-xs font-medium text-[#1C1917] outline-none transition placeholder:text-stone-400 focus:border-[#2563EB] ${
                        erreurs.nom ? 'border-rose-400 focus:ring-rose-400' : 'border-[#1C1917]/15 bg-white focus:border-[#2563EB]'
                      }`}
                    />
                    {champErreur('nom')}
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="email" className="block text-xs font-semibold text-stone-700">
                      Adresse e-mail*
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="vous@votre-entreprise.mg"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full rounded-lg border px-3 py-3 text-xs font-medium text-[#1C1917] outline-none transition placeholder:text-stone-400 focus:border-[#2563EB] ${
                        erreurs.email ? 'border-rose-400 focus:ring-rose-400' : 'border-[#1C1917]/15 bg-white focus:border-[#2563EB]'
                      }`}
                    />
                    {champErreur('email')}
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="motDePasse" className="block text-xs font-semibold text-stone-700">
                      Mot de passe*
                    </label>
                    <div className="relative">
                      <input
                        id="motDePasse"
                        type={afficherMotDePasse ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={motDePasse}
                        onChange={(e) => setMotDePasse(e.target.value)}
                        className="w-full rounded-lg border px-3 py-3 pr-10 text-xs font-medium text-[#1C1917] outline-none transition placeholder:text-stone-400 focus:border-[#2563EB]"
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
                    {champErreur('motDePasse')}
                    <p className="mt-1 text-[11px] text-stone-400">
                      8 caractères minimum
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="confirmerMotDePasse" className="block text-xs font-semibold text-stone-700">
                      Confirmer le mot de passe*
                    </label>
                    <div className="relative">
                      <input
                        id="confirmerMotDePasse"
                        type={afficherConfirmerMotDePasse ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={confirmerMotDePasse}
                        onChange={(e) => setConfirmerMotDePasse(e.target.value)}
                        className="w-full rounded-lg border px-3 py-3 pr-10 text-xs font-medium text-[#1C1917] outline-none transition placeholder:text-stone-400 focus:border-[#2563EB]"
                      />
                      <button
                        type="button"
                        onClick={() => setAfficherConfirmerMotDePasse(!afficherConfirmerMotDePasse)}
                        title={afficherConfirmerMotDePasse ? 'Masquer' : 'Afficher'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 transition hover:text-[#1C1917]"
                      >
                        {afficherConfirmerMotDePasse ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {champErreur('confirmerMotDePasse')}
                  </div>

                  <CaseAntiRobot ref={captchaRef} cleSite={cleSiteCaptcha} change={setCaptcha} />

                  <button
                    type="submit"
                    disabled={chargement}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563EB] py-3.5 text-xs font-bold text-white transition hover:bg-[#1D4ED8] disabled:opacity-60"
                  >
                    {chargement ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Créer mon compte'
                    )}
                  </button>

                  <div className="relative flex items-center justify-center text-center">
                    <div className="w-full border-t border-[#1C1917]/10" />
                    <span className="absolute bg-white px-3 text-[10.5px] font-bold uppercase text-stone-400">
                      ou
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={inscriptionGoogle}
                    disabled={chargement}
                    className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-[#1C1917]/15 bg-white py-3 text-xs font-bold text-[#1C1917] transition hover:bg-[#F7F5F0] disabled:opacity-60"
                  >
                    <img
                      src="/icons/google.jpg"
                      alt="Google"
                      className="h-4 w-4 object-contain"
                    />
                    Continuer avec Google
                  </button>
                </form>

                <div className="mt-6 text-center text-xs text-stone-500">
                  Déjà un compte ?{' '}
                  <Link href="/login" className="font-bold text-[#1D4ED8] hover:underline">
                    Se connecter
                  </Link>
                </div>
              </>
            )}

            {/* ===== ÉTAPE 2 : VÉRIFICATION DU CODE ===== */}
            {etape === 'verification' && (
              <>
                <div className="space-y-1 text-center">
                  <h2 className="font-sans text-2xl font-extrabold tracking-tight text-[#1C1917]">Vérifiez votre e-mail</h2>
                  <p className="text-xs text-stone-500">
                    Un code à 6 chiffres a été envoyé à{' '}
                    <span className="font-semibold text-[#1C1917]">{emailVerification}</span>.
                  </p>
                </div>

                {erreurVerification && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                    {erreurVerification}
                  </div>
                )}

                <form onSubmit={(e) => { e.preventDefault(); verifierCode() }} className="space-y-4">
                  <div className="space-y-1">
                    <label htmlFor="code" className="block text-xs font-semibold text-stone-700">
                      Code de vérification*
                    </label>
                    <input
                      id="code"
                      type="text"
                      autoComplete="off"
                      maxLength={6}
                      placeholder="123456"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full rounded-lg border border-[#1C1917]/15 bg-white px-3 py-3 text-xs font-mono font-semibold text-[#1C1917] outline-none transition focus:border-[#2563EB] tracking-widest"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={chargementVerification || code.length !== 6}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563EB] py-3.5 text-xs font-bold text-white transition hover:bg-[#1D4ED8] disabled:opacity-60"
                  >
                    {chargementVerification ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Valider le code'
                    )}
                  </button>
                </form>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setEtape('formulaire')}
                    className="text-[11px] font-semibold text-[#1D4ED8] hover:underline transition"
                  >
                    Modifier les informations
                  </button>
                  <button
                    onClick={renvoyerCode}
                    disabled={renvoyerEnCours}
                    className="text-[11px] font-semibold text-stone-600 hover:text-[#1C1917] transition disabled:opacity-50"
                  >
                    {renvoyerEnCours ? 'Envoi…' : 'Renvoyer le code'}
                  </button>
                </div>
              </>
            )}

            {/* ===== ÉTAPE 3 : SUCCÈS ===== */}
            {etape === 'succes' && (
              <div className="text-center py-10">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="font-sans text-2xl font-extrabold tracking-tight text-[#1C1917] mb-2">
                  Compte créé
                </h2>
                <p className="text-xs text-stone-600 mb-6">
                  Votre espace SMSTSIKA est prêt. Vous allez y être redirigé.
                </p>
                <Link
                  href="/espace"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-5 py-3 text-xs font-bold text-white transition hover:bg-[#1D4ED8]"
                >
                  Ouvrir mon espace <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}

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
    </div>
  )
}
