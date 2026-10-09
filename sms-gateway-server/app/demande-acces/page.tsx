'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Send, Loader2, CheckCircle2, AlertTriangle, ArrowRight,
  Check, User, Phone, Eye, EyeOff, Lock
} from 'lucide-react'
import { creerSupabaseNavigateur } from '../../lib/supabase-navigateur'
import { CaseAntiRobot, type PoigneeAntiRobot } from '../../composants/CaseAntiRobot'

export default function PageDemandeAcces() {
  const routeur = useRouter()
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [contact, setContact] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false)
  const [usagePrevu, setUsagePrevu] = useState('')
  const [conditionsAcceptees, setConditionsAcceptees] = useState(true)
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [googleEnCours, setGoogleEnCours] = useState(false)
  const [resultat, setResultat] = useState<{ reussi: boolean; texte: string; action?: 'login-client' } | null>(null)
  const [captcha, setCaptcha] = useState<string | null>(null)
  const captchaRef = useRef<PoigneeAntiRobot>(null)
  const cleSiteCaptcha = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

  useEffect(() => {
    const etat = new URLSearchParams(window.location.search).get('google')
    if (!etat) return
    if (etat === 'ok') {
      setResultat({ reussi: true, texte: 'Compte Google vérifié — demande transmise. Réponse sous 24 h.' })
    } else if (etat === 'compte-existant') {
      setResultat({
        reussi: true,
        texte: 'Cet e-mail a déjà reçu une clé API — connectez-vous à votre espace.',
        action: 'login-client',
      })
    } else if (etat === 'demande-encours') {
      setResultat({ reussi: true, texte: 'Une demande est déjà en cours pour cet e-mail — réponse sous 24 h.' })
    } else {
      setResultat({ reussi: false, texte: 'Connexion Google interrompue — réessayez ou remplissez le formulaire.' })
    }
    window.history.replaceState(null, '', window.location.pathname)
  }, [])

  async function connexionGoogle() {
    setResultat(null)
    setGoogleEnCours(true)
    try {
      const supabase = creerSupabaseNavigateur()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/api/auth/google/retour?finalite=inscription` },
      })
      if (error) {
        setResultat({ reussi: false, texte: 'Google indisponible pour le moment — remplissez le formulaire.' })
        setGoogleEnCours(false)
      }
    } catch {
      setResultat({ reussi: false, texte: 'Google indisponible pour le moment — remplissez le formulaire.' })
      setGoogleEnCours(false)
    }
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault()
    setEnvoiEnCours(true)
    setResultat(null)
    if (cleSiteCaptcha && !captcha) {
      setResultat({ reussi: false, texte: 'Veuillez cocher « Je ne suis pas un robot »' })
      setEnvoiEnCours(false)
      return
    }
    try {
      const reponse = await fetch('/api/auth/inscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom, nom, email: contact.trim(), mot_de_passe: motDePasse, captcha }),
      })
      const donnees = await reponse.json().catch(() => null)
      if (!reponse.ok) {
        setResultat({ reussi: false, texte: donnees?.error ?? 'Inscription impossible — réessayez' })
        return
      }
      routeur.replace('/espace')
    } catch {
      setResultat({ reussi: false, texte: 'Serveur injoignable' })
    } finally {
      captchaRef.current?.reinitialiser()
      setEnvoiEnCours(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-800 font-sans antialiased flex flex-col justify-between p-6 sm:p-12 selection:bg-blue-600 selection:text-white dark:bg-[#0B0F19] dark:text-zinc-100">

      {/* 2-Column Main Container (Exact Screenshot Layout) */}
      <div className="mx-auto max-w-6xl w-full my-auto grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">

        {/* Left Column (Value Proposition & Features Checklist) */}
        <div className="space-y-8 pr-0 lg:pr-6">
          <Image src="/icons/SMSTSIKA.png" alt="SMSTSIKA" width={64} height={64} className="h-16 w-16" />

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl leading-tight">
            Créez votre compte SMSTSIKA :
          </h1>

          <div className="space-y-3 text-sm text-slate-500 font-medium dark:text-zinc-400">
            <p className="flex items-center gap-3">
              <Check className="h-4 w-4 text-blue-400 shrink-0" />
              <span>Aucune carte bancaire requise</span>
            </p>
            <p className="flex items-center gap-3">
              <Check className="h-4 w-4 text-blue-400 shrink-0" />
              <span>Compte créé instantanément</span>
            </p>
            <p className="flex items-center gap-3">
              <Check className="h-4 w-4 text-blue-400 shrink-0" />
              <span>Votre clé API dans votre espace</span>
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Obtenez votre accès en quelques minutes</h2>
            <div className="space-y-2.5 text-sm text-slate-500 font-medium dark:text-zinc-400">
              <p className="flex items-center gap-3">
                <Check className="h-4 w-4 text-blue-400 shrink-0" />
                <span>Indiquez votre nom et votre contact</span>
              </p>
              <p className="flex items-center gap-3">
                <Check className="h-4 w-4 text-blue-400 shrink-0" />
                <span>Indiquez votre usage prévu</span>
              </p>
              <p className="flex items-center gap-3">
                <Check className="h-4 w-4 text-blue-400 shrink-0" />
                <span>Recevez votre clé API</span>
              </p>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 pt-4 dark:text-zinc-500">
            *Votre téléphone, votre SIM : vous gérez vos envois.
          </p>
        </div>

        {/* Right Column (Exact White Card Matching Zoomed Screenshot) */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 sm:p-10 shadow-2xl text-slate-900 space-y-5">

            {/* Header Text */}
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-slate-900">
                S'inscrire
              </h2>
              <p className="text-xs text-slate-500">
                Remplissez le formulaire — accès immédiat.
              </p>
            </div>

            {/* Form Inputs (Exact Order from Screenshot) */}
            <form onSubmit={soumettre} className="space-y-3">
              <div className="space-y-1">
                <input
                  id="prenom"
                  type="text"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  placeholder="First name"
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium transition"
                />
              </div>

              <div className="space-y-1">
                <input
                  id="nom"
                  type="text"
                  required
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Last name / Société*"
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium transition"
                />
              </div>

              <div className="space-y-1">
                <input
                  id="contact"
                  type="text"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                      placeholder="Adresse e-mail*"
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium transition"
                />
              </div>

              <div className="space-y-1 relative">
                <input
                  id="motDePasse"
                  type={afficherMotDePasse ? 'text' : 'password'}
                  required
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                      placeholder="Mot de passe*"
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 pr-10 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium transition"
                />
                <button
                  type="button"
                  onClick={() => setAfficherMotDePasse(!afficherMotDePasse)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {afficherMotDePasse ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Success Box matching Screenshot */}
              {resultat && (
                <div className={`rounded-xl border p-3 flex items-center gap-2.5 text-xs font-bold ${
                  resultat.reussi
                    ? 'bg-emerald-50 border-slate-300 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {resultat.reussi ? (
                    <>
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white shrink-0">
                        ✓
                      </div>
                      <span>Success! {resultat.texte}</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                      <span>{resultat.texte}</span>
                    </>
                  )}
                </div>
              )}

              {/* Terms Checkbox matching Screenshot */}
              <div className="flex items-start gap-2 text-[11px] text-slate-500 pt-1 leading-tight">
                <input
                  type="checkbox"
                  checked={conditionsAcceptees}
                  onChange={(e) => setConditionsAcceptees(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0"
                />
                <span>
                  En cliquant sur Continuer, vous acceptez les Conditions d'utilisation et la Politique de confidentialité SMSTSIKA.
                </span>
              </div>

              {/* Case anti-robot (visible seulement si clés configurées) */}
              <CaseAntiRobot ref={captchaRef} cleSite={cleSiteCaptcha} change={setCaptcha} />

              {/* Primary Electric Blue Button */}
              <button
                type="submit"
                disabled={envoiEnCours}
                className="w-full rounded-xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] py-3.5 text-xs font-bold text-white shadow-[0_20px_40px_-15px_rgba(124,58,237,0.5)] hover:-translate-y-0.5 disabled:opacity-60 transition flex items-center justify-center gap-2 mt-2"
              >
                {envoiEnCours ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Envoyer la demande'}
              </button>
            </form>

            <div className="text-center text-xs text-slate-500">
              Déjà un compte ?{' '}
              <Link href="/login" className="font-bold text-blue-600 hover:underline">
                Se connecter
              </Link>
            </div>

            {/* Separator OR */}
            <div className="relative flex items-center justify-center text-center my-3">
              <div className="w-full border-t border-slate-200" />
              <span className="absolute bg-white px-3 text-[10.5px] font-bold text-slate-400 uppercase">
                OR
              </span>
            </div>

            {/* Google Button */}
            <button
              type="button"
              onClick={connexionGoogle}
              disabled={googleEnCours}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-300 bg-white py-3 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition disabled:opacity-60"
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
          </div>

          {/* Under Card Footer */}
          <div className="mt-6 text-center text-xs text-slate-400 space-y-2 dark:text-zinc-500">
            <div className="flex justify-center gap-3">
              <span>Conditions d'utilisation</span>
              <span>|</span>
              <span>Politique de confidentialité</span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500">© 2026 SMSTSIKA · Tous droits réservés</p>
          </div>
        </div>

      </div>
    </div>
  )
}
