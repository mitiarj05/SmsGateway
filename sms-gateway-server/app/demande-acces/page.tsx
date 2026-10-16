'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Loader2, AlertTriangle,
  Check, Eye, EyeOff
} from 'lucide-react'
import { creerSupabaseNavigateur } from '../../lib/supabase-navigateur'
import { useReveal } from '../../lib/use-reveal'
import { CaseAntiRobot, type PoigneeAntiRobot } from '../../composants/CaseAntiRobot'

export default function PageDemandeAcces() {
  useReveal()
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
    <div className="min-h-screen bg-[#F7F5F0] font-sans text-[#1C1917] antialiased selection:bg-[#2563EB] selection:text-white">
      <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-12 px-6 py-14 lg:grid-cols-2 lg:px-8">

        {/* Colonne marque */}
        <div className="space-y-7">
          <Link href="/" title="Retour à l'accueil" className="inline-block">
            <Image src="/icons/logoClair.png" alt="SMSTSIKA — retour à l'accueil" width={180} height={42} className="h-10 w-auto" />
          </Link>

          <h1 className="max-w-md font-sans text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Créez votre compte SMSTSIKA :
          </h1>

          <ul className="space-y-3 text-sm font-medium text-stone-600">
            <li className="flex items-center gap-3">
              <Check className="h-4 w-4 shrink-0 text-[#15803B]" />
              <span>Aucune carte bancaire requise</span>
            </li>
            <li className="flex items-center gap-3">
              <Check className="h-4 w-4 shrink-0 text-[#15803B]" />
              <span>Compte créé instantanément</span>
            </li>
            <li className="flex items-center gap-3">
              <Check className="h-4 w-4 shrink-0 text-[#15803B]" />
              <span>Votre clé API dans votre espace</span>
            </li>
          </ul>

          <p className="font-mono text-[11px] text-stone-500">
            *Votre téléphone, votre SIM : vous gérez vos envois.
          </p>
        </div>

        {/* Carte formulaire */}
        <div className="w-full">
          <div data-reveal="zoom" className="mx-auto w-full max-w-md space-y-5 rounded-2xl border border-[#1C1917]/10 bg-white p-8 shadow-[0_24px_60px_-30px_rgba(28,25,23,0.25)] sm:p-10">

            <div className="space-y-1 text-center">
              <h2 className="font-sans text-2xl font-extrabold tracking-tight text-[#1C1917]">
                S'inscrire
              </h2>
              <p className="text-xs text-stone-500">
                Remplissez le formulaire — accès immédiat.
              </p>
            </div>

            <form onSubmit={soumettre} className="space-y-3">
              <div className="space-y-1">
                <input
                  id="prenom"
                  type="text"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  placeholder="Prénom"
                  className="w-full rounded-lg border border-[#1C1917]/15 bg-white p-3 text-xs font-medium text-[#1C1917] outline-none transition placeholder:text-stone-400 focus:border-[#2563EB]"
                />
              </div>

              <div className="space-y-1">
                <input
                  id="nom"
                  type="text"
                  required
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Nom / Société*"
                  className="w-full rounded-lg border border-[#1C1917]/15 bg-white p-3 text-xs font-medium text-[#1C1917] outline-none transition placeholder:text-stone-400 focus:border-[#2563EB]"
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
                  className="w-full rounded-lg border border-[#1C1917]/15 bg-white p-3 text-xs font-medium text-[#1C1917] outline-none transition placeholder:text-stone-400 focus:border-[#2563EB]"
                />
              </div>

              <div className="relative space-y-1">
                <input
                  id="motDePasse"
                  type={afficherMotDePasse ? 'text' : 'password'}
                  required
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                      placeholder="Mot de passe*"
                  className="w-full rounded-lg border border-[#1C1917]/15 bg-white p-3 pr-10 text-xs font-medium text-[#1C1917] outline-none transition placeholder:text-stone-400 focus:border-[#2563EB]"
                />
                <button
                  type="button"
                  onClick={() => setAfficherMotDePasse(!afficherMotDePasse)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 transition hover:text-[#1C1917]"
                >
                  {afficherMotDePasse ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {resultat && (
                <div className={`flex items-center gap-2.5 rounded-xl border p-3 text-xs font-bold ${
                  resultat.reussi
                    ? 'border-[#15803B]/25 bg-[#15803B]/[.07] text-[#15803B]'
                    : 'border-rose-200 bg-rose-50 text-rose-800'
                }`}>
                  {resultat.reussi ? (
                    <>
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#15803B] text-white">
                        ✓
                      </div>
                      <span>Succès ! {resultat.texte}</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                      <span>{resultat.texte}</span>
                    </>
                  )}
                </div>
              )}

              <div className="flex items-start gap-2 pt-1 text-[11px] leading-tight text-stone-500">
                <input
                  type="checkbox"
                  checked={conditionsAcceptees}
                  onChange={(e) => setConditionsAcceptees(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#1C1917]/20 accent-[#2563EB]"
                />
                <span>
                  En cliquant sur Continuer, vous acceptez les{' '}
                  <Link href="/mentions-legales" className="font-bold text-[#1D4ED8] hover:underline">Conditions d'utilisation</Link>
                  {' '}et la{' '}
                  <Link href="/confidentialite" className="font-bold text-[#1D4ED8] hover:underline">Politique de confidentialité</Link>
                  {' '}SMSTSIKA.
                </span>
              </div>

              <CaseAntiRobot ref={captchaRef} cleSite={cleSiteCaptcha} change={setCaptcha} />

              <button
                type="submit"
                disabled={envoiEnCours}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563EB] py-3.5 text-xs font-bold text-white transition hover:bg-[#1D4ED8] disabled:opacity-60"
              >
                {envoiEnCours ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Envoyer la demande'}
              </button>
            </form>

            <div className="text-center text-xs text-stone-500">
              Déjà un compte ?{' '}
              <Link href="/login" className="font-bold text-[#1D4ED8] hover:underline">
                Se connecter
              </Link>
            </div>

            <div className="relative my-3 flex items-center justify-center text-center">
              <div className="w-full border-t border-[#1C1917]/10" />
              <span className="absolute bg-white px-3 text-[10.5px] font-bold uppercase text-stone-400">
                OR
              </span>
            </div>

            <button
              type="button"
              onClick={connexionGoogle}
              disabled={googleEnCours}
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
