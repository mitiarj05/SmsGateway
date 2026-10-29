'use client'

import { useState, useEffect, useCallback } from 'react'
import { User, Mail, KeyRound, Loader2, Save, CheckCircle2, ShieldCheck, Copy, Check } from 'lucide-react'
import CoquilleEspace from '../../../composants/CoquilleEspace'
import { Toast } from '../../../composants/interface'
import { creerSupabaseNavigateur } from '../../../lib/supabase-navigateur'

export default function PageParametresEspace() {
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [chargement, setChargement] = useState(true)
  const [enregistrement, setEnregistrement] = useState(false)
  const [resetEnCours, setResetEnCours] = useState(false)
  const [notification, setNotification] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  /* Clé API */
  const [cleApi, setCleApi] = useState<string | null>(null)
  const [cleChargee, setCleChargee] = useState(false)
  const [copiee, setCopiee] = useState(false)

  /* Statistiques */
  const [stats, setStats] = useState<{ envoyes: number; attente: number; echoue: number; recus: number }>({ envoyes: 0, attente: 0, echoue: 0, recus: 0 })
  const [utiliseMois, setUtiliseMois] = useState(0)

  function afficherNotification(type: 'succes' | 'erreur', texte: string) {
    setNotification({ type, texte })
    setTimeout(() => setNotification(null), 4000)
  }

  const chargerProfil = useCallback(async () => {
    try {
      const reponse = await fetch('/api/espace/moi')
      const d = await reponse.json().catch(() => ({}))
      if (d.nom) setNom(d.nom)
      if (d.email) setEmail(d.email)
      if (d.cle_api) setCleApi(d.cle_api)
      setCleChargee(true)
      if (d.stats) setStats(d.stats)
      if (typeof d.utilise_mois === 'number') setUtiliseMois(d.utilise_mois)
    } finally {
      setChargement(false)
    }
  }, [])

  function copierCle() {
    if (!cleApi) return
    navigator.clipboard?.writeText(cleApi)
    setCopiee(true)
    setTimeout(() => setCopiee(false), 2000)
  }

  useEffect(() => {
    chargerProfil()
  }, [chargerProfil])

  async function enregistrerProfil(e: React.FormEvent) {
    e.preventDefault()
    if (!nom.trim()) {
      afficherNotification('erreur', 'Le nom du compte est obligatoire')
      return
    }
    setEnregistrement(true)
    try {
      const reponse = await fetch('/api/espace/moi', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: nom.trim(), email: email.trim() }),
      })
      if (reponse.ok) {
        afficherNotification('succes', 'Profil enregistré avec succès')
        chargerProfil()
      } else {
        const d = await reponse.json().catch(() => ({}))
        afficherNotification('erreur', d.error || 'Erreur lors de l’enregistrement')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    } finally {
      setEnregistrement(false)
    }
  }

  async function reinitialiserMotDePasse() {
    if (!email.trim()) {
      afficherNotification('erreur', 'Veuillez d’abord renseigner votre adresse e-mail')
      return
    }
    setResetEnCours(true)
    try {
      const supabase = creerSupabaseNavigateur()
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
      })
      if (error) {
        afficherNotification('erreur', 'Envoi impossible — vérifiez l’adresse e-mail')
      } else {
        afficherNotification('succes', `E-mail de réinitialisation envoyé à ${email.trim()}`)
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau lors de la demande')
    } finally {
      setResetEnCours(false)
    }
  }

  if (chargement) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1C1917]/[0.04] dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <CoquilleEspace>
      {/* En-tête */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#1C1917] dark:text-white">
            Paramètres du compte
          </h1>
          <p className="mt-1 text-[13.5px] text-stone-600 dark:text-zinc-400">
            Gérez les identifiants de votre profil et la sécurité de votre compte.
          </p>
        </div>
      </div>

      {/* Main Grid 2 Cols */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* Left Column (2 cols) */}
        <div className="xl:col-span-2 space-y-6">

          {/* Card 1 : Profil (Nom & E-mail) */}
          <div className="rounded-[1.5rem] border border-[#1C1917]/10 bg-white p-6 shadow-card space-y-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3 border-b border-[#1C1917]/10 pb-3 dark:border-zinc-800">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <User className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#1C1917] dark:text-white">Profil &amp; Identité du compte</h2>
                <p className="text-xs text-stone-500 dark:text-zinc-400">
                  Nom d'affichage et adresse e-mail associés à votre espace.
                </p>
              </div>
            </div>

            <form onSubmit={enregistrerProfil} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700 dark:text-zinc-300">
                  Nom du compte / Entreprise
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 dark:text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Mon Entreprise S.A."
                    className="w-full rounded-2xl border border-[#1C1917]/10 bg-white py-3 pl-10 pr-4 text-xs font-semibold text-[#1C1917] placeholder-stone-400 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700 dark:text-zinc-300">
                  Adresse e-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 dark:text-zinc-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@entreprise.com"
                    className="w-full rounded-2xl border border-[#1C1917]/10 bg-white py-3 pl-10 pr-4 text-xs font-semibold text-[#1C1917] placeholder-stone-400 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={enregistrement}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#2563EB] px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-[#1D4ED8] disabled:opacity-60 transition"
                >
                  {enregistrement ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {enregistrement ? 'Enregistrement...' : 'Enregistrer le profil'}
                </button>
              </div>
            </form>
          </div>

          {/* Card : Clé API */}
          <div className="rounded-[1.5rem] border border-[#1C1917]/10 bg-white p-6 shadow-card space-y-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-[#1C1917]/10 pb-3 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                  <KeyRound className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1C1917] dark:text-white">Votre clé d’API</h2>
                  <p className="text-xs text-stone-500 dark:text-zinc-400">
                    Identifie votre application quand elle appelle SMSTSIKA.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Confidentiel</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <code className="flex-1 truncate bg-[#1C1917]/[0.04] rounded-xl px-3 py-2 text-[11px] font-mono text-stone-700 dark:bg-zinc-800 dark:text-zinc-200 border border-[#1C1917]/10 dark:border-zinc-700">
                {cleApi ?? '—'}
              </code>
              <button
                onClick={copierCle}
                disabled={!cleApi}
                className="flex h-9 w-9 items-center justify-center rounded-full text-stone-500 hover:bg-white hover:text-stone-700 disabled:opacity-60 dark:hover:bg-zinc-700 dark:hover:text-zinc-200 transition"
              >
                {copiee ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] leading-relaxed text-stone-500 dark:text-zinc-500">
              Cette clé est affichée une seule fois. Ne la partagez pas. En cas de perte, contactez votre administrateur.
            </p>
            {cleApi && copiee && (
              <p className="mt-1 text-[11px] text-[#15803B]">Copiée dans le presse-papiers.</p>
            )}
          </div>

          {/* Card : Statistiques du mois */}
          <div className="rounded-[1.5rem] border border-[#1C1917]/10 bg-white p-6 shadow-card space-y-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-[#1C1917]/10 pb-3 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <CheckCircle2 className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1C1917] dark:text-white">Statistiques du mois</h2>
                  <p className="text-xs text-stone-500 dark:text-zinc-400">
                    Volume et état de vos envois SMS ce mois-ci.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-[#1C1917]/5 dark:border-zinc-800/5">
                <span className="text-[12px] text-stone-600 dark:text-zinc-400">SMS envoyés</span>
                <span className="text-[16px] font-bold text-[#1C1917] dark:text-white">{stats.envoyes}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#1C1917]/5 dark:border-zinc-800/5">
                <span className="text-[12px] text-stone-600 dark:text-zinc-400">En attente</span>
                <span className="text-[16px] font-bold text-[#1C1917] dark:text-white">{stats.attente}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#1C1917]/5 dark:border-zinc-800/5">
                <span className="text-[12px] text-stone-600 dark:text-zinc-400">Échoués</span>
                <span className="text-[16px] font-bold text-rose-600 dark:text-rose-400">{stats.echoue}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[12px] text-stone-600 dark:text-zinc-400">SMS reçus</span>
                <span className="text-[16px] font-bold text-[#1C1917] dark:text-white">{stats.recus}</span>
              </div>
            </div>
            <div className="pt-3 border-t border-[#1C1917]/10 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-stone-600 dark:text-zinc-400">Utilisation ce mois</span>
                <span className="text-[11px] font-semibold text-[#1C1917] dark:text-white">{utiliseMois} SMS</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1C1917]/[0.04] dark:bg-zinc-800">
                <div className="h-full rounded-full bg-blue-600" style={{ width: Math.min(100, (utiliseMois / 100) * 100) + '%' }} />
              </div>
              <p className="mt-2 text-[11px] text-stone-500 dark:text-zinc-500">
                Forfait illimité : ce relevé suit vos envois, aucun plafond n’est appliqué.
              </p>
            </div>
          </div>

          {/* Card 2 : Sécurité du compte (Mot de passe) */}
          <div className="rounded-[1.5rem] border border-[#1C1917]/10 bg-white p-6 shadow-card space-y-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3 border-b border-[#1C1917]/10 pb-3 dark:border-zinc-800">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <KeyRound className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#1C1917] dark:text-white">Sécurité du compte</h2>
                <p className="text-xs text-stone-500 dark:text-zinc-400">
                  Changement de mot de passe et sécurité de la session.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs leading-relaxed text-stone-600 dark:text-zinc-400">
                La sécurité de votre compte est gérée par notre système d'authentification. Cliquez ci-dessous pour recevoir un lien par e-mail et choisir un nouveau mot de passe.
              </p>

              <button
                type="button"
                onClick={reinitialiserMotDePasse}
                disabled={resetEnCours}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#1C1917]/10 bg-stone-100 px-5 py-3 text-xs font-bold text-[#1C1917] shadow-2xs hover:bg-stone-200 disabled:opacity-60 transition dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                {resetEnCours ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Réinitialiser le mot de passe
              </button>
            </div>
          </div>

        </div>

        {/* Right Column (Info Card) */}
        <div className="space-y-4">
          <div className="rounded-[1.5rem] bg-gradient-to-br from-[#332c75] to-[#1f1a52] p-6 text-white shadow-card space-y-4">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <ShieldCheck className="h-5 w-5" />
              Protection des données
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              Vos identifiants et clés API sont sécurisés par notre infrastructure Supabase Auth avec isolation complète des espaces clients.
            </p>
          </div>
        </div>

      </div>

      <Toast notification={notification} />
    </CoquilleEspace>
  )
}
