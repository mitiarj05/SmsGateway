'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  User, Mail, KeyRound, Loader2, Save, CheckCircle2, ShieldCheck, Copy, Check,
  Webhook, FlaskConical, Zap, Download, SlidersHorizontal,
} from 'lucide-react'
import CoquilleEspace from '../../../composants/CoquilleEspace'
import { Toast } from '../../../composants/interface'
import { creerSupabaseNavigateur } from '../../../lib/supabase-navigateur'

interface Envoi {
  id: string
  type_evenement: string
  statut: string
  tentatives: number
  date_creation: string
}

const EVENEMENTS_DISPONIBLES = [
  { id: 'sms.recu', label: 'SMS reçus' },
]

export default function PageParametresEspace() {
  /* Onglets internes. Lecture de ?onglet=avancee au premier rendu (client). */
  const [onglet, setOnglet] = useState<'profil' | 'avancee'>('profil')
  const [ongletInitialise, setOngletInitialise] = useState(false)

  /* ---- Profil & sécurité ---- */
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

  /* ---- Paramètres avancés (intégration) ---- */
  const [url, setUrl] = useState('')
  const [evenements, setEvenements] = useState<string[]>(['sms.recu'])
  const [actifs, setActifs] = useState(true)
  const [resultatTest, setResultatTest] = useState<string | null>(null)
  const [envois, setEnvois] = useState<Envoi[]>([])
  const [enregistrementLien, setEnregistrementLien] = useState(false)

  const [urlBoutique, setUrlBoutique] = useState('')
  const [plateformeChoisie, setPlateformeChoisie] = useState('WooCommerce')
  const [connexionEnCours, setConnexionEnCours] = useState(false)
  const [sousOnglet, setSousOnglet] = useState<'boutique' | 'avancee'>('avancee')
  const [boutiqueConnectee, setBoutiqueConnectee] = useState(false)

  useEffect(() => {
    if (!ongletInitialise && typeof window !== 'undefined') {
      if (new URLSearchParams(window.location.search).get('onglet') === 'avancee') setOnglet('avancee')
      setOngletInitialise(true)
    }
  }, [ongletInitialise])

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

  /* ---- Chargement de la configuration d'intégration ---- */
  const chargerIntegration = useCallback(async () => {
    try {
      const [reponseConfig, reponseJournal] = await Promise.all([
        fetch('/api/espace/evenements'),
        fetch('/api/espace/journal'),
      ])
      const config = await reponseConfig.json()
      if (config.url_application !== undefined) {
        if (config.url_application) {
          setUrl(config.url_application)
          setBoutiqueConnectee(true)
        }
        if (Array.isArray(config.evenements_souscrits)) setEvenements(config.evenements_souscrits)
        if (typeof config.evenements_actifs === 'boolean') setActifs(config.evenements_actifs)
      }
      const journal = await reponseJournal.json().catch(() => ({}))
      if (Array.isArray(journal.envois)) setEnvois(journal.envois)
    } catch {
      /* silencieux : l'onglet avancé reste utilisable */
    }
  }, [])

  useEffect(() => {
    chargerProfil()
    chargerIntegration()
  }, [chargerProfil, chargerIntegration])

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

  /* ---- Paramètres avancés : enregistrement du lien ---- */
  async function enregistrerLien() {
    setEnregistrementLien(true)
    try {
      const reponse = await fetch('/api/espace/evenements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url_application: url.trim() === '' ? null : url.trim(),
          evenements_souscrits: evenements,
          evenements_actifs: actifs,
        }),
      })
      if (reponse.ok) {
        afficherNotification('succes', 'Configuration enregistrée')
      } else {
        afficherNotification('erreur', 'Erreur enregistrement')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    } finally {
      setEnregistrementLien(false)
    }
  }

  async function appeler(corp: Record<string, unknown>) {
    const reponse = await fetch('/api/espace/evenements', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corp),
    })
    const donnees = await reponse.json().catch(() => ({}))
    return { reponse, donnees }
  }

  async function connecterBoutiqueAuto() {
    if (!urlBoutique.trim()) {
      afficherNotification('erreur', 'Veuillez saisir l’adresse de votre boutique')
      return
    }

    setConnexionEnCours(true)
    try {
      const reponse = await fetch('/api/espace/connect-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeUrl: urlBoutique.trim(), platform: plateformeChoisie }),
      })
      const donnees = await reponse.json().catch(() => ({}))
      if (reponse.ok && donnees.url_application) {
        setUrl(donnees.url_application)
        setBoutiqueConnectee(true)
        afficherNotification('succes', donnees.message ?? 'Boutique connectée en 1 Clic !')
        chargerIntegration()
      } else {
        afficherNotification('erreur', donnees.error || 'Échec de la connexion automatique')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau lors de la connexion')
    } finally {
      setConnexionEnCours(false)
    }
  }

  async function tester() {
    setResultatTest(null)
    try {
      const { reponse, donnees } = await appeler({ tester: true })
      if (reponse.ok) {
        const t = donnees?.test as { en_file?: boolean; envoyes?: number } | undefined
        setResultatTest(t?.en_file ? `Livré (${t?.envoyes ?? 0} ok)` : 'Mis en file')
        chargerIntegration()
      } else {
        setResultatTest(donnees?.error ?? 'Échec')
      }
    } catch {
      setResultatTest('Erreur réseau')
    }
  }

  function basculerEvenement(cle: string) {
    setEvenements((prev) => prev.includes(cle) ? prev.filter((e) => e !== cle) : [...prev, cle])
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
            Profil, sécurité et configuration avancée de votre application.
          </p>
        </div>
      </div>

      {/* Onglets internes : Profil & sécurité | Paramètres avancés */}
      <div className="mb-5 flex items-center gap-2">
        <button
          onClick={() => setOnglet('profil')}
          aria-pressed={onglet === 'profil'}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${onglet === 'profil' ? 'bg-[#1C1917] text-white shadow-md dark:bg-white dark:text-zinc-900' : 'border border-[#1C1917]/10 bg-white text-stone-600 shadow-2xs hover:bg-stone-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'}`}
        >
          <User className="h-3.5 w-3.5" /> Profil &amp; sécurité
        </button>
        <button
          onClick={() => setOnglet('avancee')}
          aria-pressed={onglet === 'avancee'}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${onglet === 'avancee' ? 'bg-[#1C1917] text-white shadow-md dark:bg-white dark:text-zinc-900' : 'border border-[#1C1917]/10 bg-white text-stone-600 shadow-2xs hover:bg-stone-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'}`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" /> Paramètres avancés
        </button>
      </div>

      {/* ============ ONGLET : PROFIL & SÉCURITÉ ============ */}
      {onglet === 'profil' && (
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
      )}

      {/* ============ ONGLET : PARAMÈTRES AVANCÉS (intégration) ============ */}
      {onglet === 'avancee' && (
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">

        {/* Left Column (2 cols) */}
        <div className="xl:col-span-2 space-y-4">

          {/* Sous-menu : Boutique | Configuration avancée */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSousOnglet('boutique')}
              aria-pressed={sousOnglet === 'boutique'}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${sousOnglet === 'boutique' ? 'bg-[#1C1917] text-white shadow-md dark:bg-white dark:text-zinc-900' : 'border border-[#1C1917]/10 bg-white text-stone-600 shadow-2xs hover:bg-stone-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'}`}
            >
              <Zap className="h-3.5 w-3.5" /> Boutique
            </button>
            <button
              onClick={() => setSousOnglet('avancee')}
              aria-pressed={sousOnglet === 'avancee'}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${sousOnglet === 'avancee' ? 'bg-[#1C1917] text-white shadow-md dark:bg-white dark:text-zinc-900' : 'border border-[#1C1917]/10 bg-white text-stone-600 shadow-2xs hover:bg-stone-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'}`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> Configuration avancée
            </button>
          </div>

          {/* Card 1 : Connexion Boutique en 1 clic */}
          {sousOnglet === 'boutique' && (
          <div className="rounded-[1.5rem] bg-gradient-to-br from-[#332c75] to-[#1f1a52] p-6 text-white shadow-card space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <Zap className="h-5 w-5 text-amber-300" />
                </div>
                <div>
                  <h2 className="text-base font-bold">Connexion Boutique en 1 clic (Auto-Connect)</h2>
                  <p className="text-xs text-white/70">
                    Saisissez l'adresse de votre site web : SMSTSIKA s'occupe d'injecter la clé et de lier la passerelle automatiquement.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-amber-400/20 px-3 py-1 text-[11px] font-bold text-amber-300 border border-amber-400/30">
                ⚡ Zéro Code
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-2">Sélectionnez votre plateforme :</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs font-semibold">
                {[
                  { id: 'WooCommerce', label: 'WooCommerce / WordPress' },
                  { id: 'Shopify', label: 'Shopify' },
                  { id: 'PrestaShop', label: 'PrestaShop' },
                  { id: 'Custom', label: 'API / Autre Site Web' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlateformeChoisie(p.id)}
                    className={`rounded-xl p-3 text-left transition${plateformeChoisie === p.id ? 'bg-white text-[#1C1917] font-bold shadow-md' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-white/70">Adresse de votre boutique :</label>
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <input
                  type="url"
                  value={urlBoutique}
                  onChange={(e) => setUrlBoutique(e.target.value)}
                  placeholder="https://mon-magasin.com"
                  className="flex-1 rounded-2xl border border-white/15 bg-white/[0.06] p-3 text-xs text-white placeholder-stone-400 outline-none transition focus:border-white/40 focus:bg-white focus:text-[#1C1917] focus:placeholder-stone-500 font-mono"
                />
                <button
                  onClick={connecterBoutiqueAuto}
                  disabled={connexionEnCours}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2563EB] px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-[#1D4ED8] disabled:opacity-60 transition shrink-0"
                >
                  {connexionEnCours ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 fill-white" />}
                  Connecter en 1 clic
                </button>
              </div>
            </div>
          </div>
          )}

          {/* Card 2 : Configuration manuelle du lien */}
          {sousOnglet === 'avancee' && (
          <div className="rounded-[1.5rem] border border-[#1C1917]/10 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <Webhook className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-[#1C1917] dark:text-white">Configuration manuelle du lien</h2>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-stone-700 dark:text-zinc-300">Lien de votre application</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 rounded-2xl border border-[#1C1917]/10 bg-white p-3 text-xs text-[#1C1917] font-mono focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <button
                  onClick={enregistrerLien}
                  disabled={enregistrementLien}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#2563EB] px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-[#1D4ED8] transition shrink-0"
                >
                  {enregistrementLien ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-stone-700 dark:text-zinc-300">Événements souscrits</label>
              <div className="flex flex-wrap items-center gap-6 text-xs text-stone-700 dark:text-zinc-300">
                {EVENEMENTS_DISPONIBLES.map((ev) => (
                  <label key={ev.id} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={evenements.includes(ev.id)}
                      onChange={() => basculerEvenement(ev.id)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{ev.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-xs text-stone-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={actifs}
                onChange={(e) => setActifs(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Événements actifs</span>
            </label>

            {resultatTest && (
              <p className="text-xs font-semibold text-stone-600 dark:text-zinc-300">Test : {resultatTest}</p>
            )}

            <div className="flex items-center gap-3 pt-2 border-t border-[#1C1917]/10 dark:border-zinc-800">
              <a href="/api/espace/evenements/recepteur" download
                title="Télécharger sms-recu.php — l'adresse et le secret sont déjà écrits dedans"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#1C1917] px-4 py-2 text-xs font-semibold text-white hover:bg-stone-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
                <Download className="h-3.5 w-3.5" /> Télécharger le récepteur
              </a>
              <button onClick={tester} className="inline-flex items-center gap-1.5 rounded-full border border-[#1C1917]/10 px-4 py-2 text-xs font-semibold text-stone-600 shadow-2xs hover:bg-stone-100 dark:border-zinc-700 dark:text-zinc-300">
                <FlaskConical className="h-3.5 w-3.5" /> Tester le lien
              </button>
            </div>
            <p className="text-[11px] leading-relaxed text-stone-500 dark:text-zinc-400">
              Déposez le fichier sur votre hébergement, puis copiez son adresse ci-dessus et testez.
              Votre secret de signature vit dedans — vous n'avez jamais à le recopier.
            </p>
            <a
              href="/api/espace/evenements/recepteur?nouveau=1"
              onClick={(e) => {
                if (!confirm('Fabriquer une nouvelle serrure ? L\u2019ancien fichier déjà en ligne chez vous ne sera plus accepté — re-téléversez le nouveau fichier aussitôt.')) {
                  e.preventDefault()
                }
              }}
              className="inline-block text-[11px] font-semibold text-amber-700 underline decoration-dotted underline-offset-2 hover:text-amber-800 dark:text-amber-400"
            >
              Fuite ? Télécharger le récepteur avec un nouveau secret
            </a>
          </div>
          )}

          {/* Card 3 : Dernières livraisons d'événements */}
          <div className="rounded-[1.5rem] border border-[#1C1917]/10 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1C1917]/10 pb-3 dark:border-zinc-800">
              <h2 className="text-sm font-bold text-[#1C1917] dark:text-white">Dernières livraisons d'événements</h2>
              {envois.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {Math.round(envois.filter((e) => e.statut === 'ENVOYE').length / envois.length * 100)} % réussi
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1C1917]/10 text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:border-zinc-800">
                    <th className="pb-2.5 pr-4">ÉVÉNEMENT</th>
                    <th className="pb-2.5 pr-4">HEURE</th>
                    <th className="pb-2.5 pr-4">STATUT</th>
                    <th className="pb-2.5 text-right">TENTATIVES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C1917]/10 dark:divide-zinc-800">
                  {envois.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-xs text-stone-500 dark:text-zinc-500">
                        Aucune livraison pour le moment.
                      </td>
                    </tr>
                  )}
                  {envois.map((l) => (
                    <tr key={l.id} className="text-stone-700 dark:text-zinc-300">
                      <td className="py-3 pr-4 font-mono font-bold">{l.type_evenement}</td>
                      <td className="py-3 pr-4 text-stone-500">
                        {new Date(l.date_creation).toLocaleTimeString('fr-FR')}
                      </td>
                      <td className="py-3 pr-4">
                        {l.statut === 'ENVOYE' ? (
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                            LIVRÉ
                          </span>
                        ) : (
                          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                            {l.statut}
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right font-mono text-stone-600">{l.tentatives}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column (2 Cards) */}
        <div className="space-y-4">

          {/* Top Card : Boutique connectée */}
          <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50/70 p-6 text-xs text-emerald-900 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300 space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Boutique connectée
            </div>
            <p className="leading-relaxed text-stone-600 dark:text-zinc-400">
              {boutiqueConnectee
                ? `Votre boutique est reliée : les événements sont envoyés vers ${url || 'votre lien'}.`
                : 'Aucune boutique reliée pour le moment. Connectez WooCommerce, Shopify ou PrestaShop pour recevoir vos événements.'}
            </p>
          </div>

          {/* Bottom CTA Dark Navy Card (#1F1A52) */}
          <div className="rounded-[1.5rem] bg-gradient-to-br from-[#332c75] to-[#1f1a52] p-6 text-white shadow-card space-y-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">BESOIN D'AIDE ?</p>
            <p className="text-xs text-white/80 leading-relaxed">
              Notre équipe intègre votre boutique en moins de 24 h, gratuitement.
            </p>
            <a href="mailto:support@smsika.app" className="block w-full rounded-full bg-amber-400 py-3 text-xs font-bold text-[#1C1917] shadow-md hover:bg-amber-300 transition">
              Demander une intégration
            </a>
          </div>

        </div>

      </div>
      )}

      <Toast notification={notification} />
    </CoquilleEspace>
  )
}
