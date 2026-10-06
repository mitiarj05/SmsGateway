'use client'

import { useState, useEffect, useCallback } from 'react'
import { Webhook, KeyRound, FlaskConical, RotateCcw, Loader2, Store, Zap, CheckCircle2, ShoppingBag, Globe } from 'lucide-react'
import CoquilleEspace from '../../../composants/CoquilleEspace'
import { Toast } from '../../../composants/interface'

interface Envoi {
  id: string
  type_evenement: string
  statut: string
  tentatives: number
  dernier_code_http: number | null
  date_creation: string
}

const EVENEMENTS = [
  { cle: 'sms.recu', etiquette: 'SMS reçus' },
  { cle: 'lien.clique', etiquette: 'Clics liens' },
  { cle: 'commande.creee', etiquette: 'Commandes e-commerce' },
]

const PLATEFORMES = [
  { id: 'WooCommerce', etiquette: 'WooCommerce / WordPress', icone: Store },
  { id: 'Shopify', etiquette: 'Shopify', icone: ShoppingBag },
  { id: 'PrestaShop', etiquette: 'PrestaShop', icone: Store },
  { id: 'Custom', etiquette: 'API / Autre Site Web', icone: Globe },
]

export default function PageNotificationsEspace() {
  const [url, setUrl] = useState('')
  const [evenements, setEvenements] = useState<string[]>([])
  const [actifs, setActifs] = useState(true)
  const [secretVisible, setSecretVisible] = useState<string | null>(null)
  const [resultatTest, setResultatTest] = useState<string | null>(null)
  const [envois, setEnvois] = useState<Envoi[]>([])
  const [chargement, setChargement] = useState(true)
  const [enregistrement, setEnregistrement] = useState(false)
  const [notification, setNotification] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  // État de l'intégration 1-Clic Boutique
  const [urlBoutique, setUrlBoutique] = useState('')
  const [plateformeChoisie, setPlateformeChoisie] = useState('WooCommerce')
  const [connexionEnCours, setConnexionEnCours] = useState(false)
  const [boutiqueConnectee, setBoutiqueConnectee] = useState<{
    storeUrl: string
    platform: string
    apiKey: string | null
    webhookUrl: string
  } | null>(null)

  function afficherNotification(type: 'succes' | 'erreur', texte: string) {
    setNotification({ type, texte })
    setTimeout(() => setNotification(null), 4000)
  }

  const chargerDonnees = useCallback(async () => {
    try {
      const reponseConfig = await fetch('/api/espace/notifications')
      const config = await reponseConfig.json()
      if (config.url_notification !== undefined) {
        setUrl(config.url_notification ?? '')
        setEvenements(config.evenements_notification ?? [])
        setActifs(config.notifications_actives ?? true)
        if (config.url_notification) {
          setUrlBoutique(config.url_notification)
        }
      }
      await chargerJournal()
    } finally {
      setChargement(false)
    }
  }, [])

  async function chargerJournal() {
    try {
      const reponse = await fetch('/api/espace/journal')
      if (reponse.ok) {
        const donnees = await reponse.json()
        if (donnees.envois) setEnvois(donnees.envois)
      }
    } catch { /* silencieux */ }
  }

  useEffect(() => { chargerDonnees() }, [chargerDonnees])

  async function appeler(patch: Record<string, unknown>) {
    const reponse = await fetch('/api/espace/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const donnees = await reponse.json().catch(() => null)
    return { reponse, donnees }
  }

  async function enregistrer() {
    setEnregistrement(true)
    try {
      const { reponse, donnees } = await appeler({
        url_notification: url.trim() === '' ? null : url.trim(),
        evenements_notification: evenements,
        notifications_actives: actifs,
      })
      if (reponse.ok) {
        if (donnees?.secret_notification_visible) setSecretVisible(donnees.secret_notification_visible)
        afficherNotification('succes', 'Configuration enregistrée')
      } else {
        afficherNotification('erreur', donnees?.error ?? 'Erreur enregistrement')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    } finally {
      setEnregistrement(false)
    }
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
        body: JSON.stringify({
          storeUrl: urlBoutique.trim(),
          platform: plateformeChoisie,
        }),
      })

      const donnees = await reponse.json()
      if (reponse.ok && donnees.url_notification) {
        setBoutiqueConnectee({
          storeUrl: donnees.url_boutique,
          platform: donnees.plateforme,
          apiKey: donnees.secret_notification_visible ?? null,
          webhookUrl: donnees.url_notification,
        })
        setUrl(donnees.url_notification)
        afficherNotification('succes', donnees.message ?? `Boutique ${donnees.plateforme} connectée en 1 Clic !`)
        chargerDonnees()
      } else {
        afficherNotification('erreur', donnees.error || 'Échec de la connexion automatique')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau lors de la connexion')
    } finally {
      setConnexionEnCours(false)
    }
  }

  async function regenererSecret() {
    if (!confirm('Régénérer le secret ? L’ancien ne fonctionnera plus.')) return
    try {
      const { reponse, donnees } = await appeler({ regenerer_secret: true })
      if (reponse.ok && donnees?.secret_notification_visible) {
        setSecretVisible(donnees.secret_notification_visible)
        afficherNotification('succes', 'Nouveau secret généré — copiez-le maintenant')
      } else {
        afficherNotification('erreur', donnees?.error ?? 'Erreur')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    }
  }

  async function tester() {
    setResultatTest(null)
    try {
      const { reponse, donnees } = await appeler({ tester: true })
      if (reponse.ok) {
        const t = donnees?.test as { en_file?: boolean; envoyes?: number } | undefined
        setResultatTest(t?.en_file ? `Livré (${t?.envoyes ?? 0} ok)` : 'Mis en file')
        chargerJournal()
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
      <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <CoquilleEspace>
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Connexion Boutique & Webhooks</h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
          Reliez votre site marchand en 1 clic ou configurez votre URL de Webhook personnalisée.
        </p>
      </div>

      <div className="max-w-4xl space-y-6">

        {/* CART 1 : CONNEXION BOUTIQUE EN 1 CLIC (AUTO-CONNECT) */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 text-white shadow-md space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
                <Zap className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <h2 className="text-base font-bold">Connexion Boutique en 1 Clic (Auto-Connect)</h2>
                <p className="text-xs text-blue-100">
                  Saisissez l&apos;adresse de votre site web : SMSIKA s&apos;occupe d&apos;injecter la clé et de lier la passerelle automatiquement.
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-3 py-1 text-[11px] font-bold text-amber-300 border border-amber-400/30">
              ⚡ Zéro Code
            </span>
          </div>

          {/* Choix de la plateforme */}
          <div>
            <label className="block text-xs font-semibold text-blue-100 mb-2">Sélectionnez votre plateforme :</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PLATEFORMES.map((p) => {
                const actif = plateformeChoisie === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlateformeChoisie(p.id)}
                    className={`flex items-center gap-2 rounded-xl p-2.5 text-xs font-semibold transition ${
                      actif
                        ? 'bg-white text-blue-900 shadow-sm font-bold'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <p.icone className={`h-4 w-4 ${actif ? 'text-blue-600' : 'text-blue-200'}`} />
                    <span>{p.etiquette}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Saisie de l'URL du site */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-blue-100">Adresse de votre boutique :</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="url"
                placeholder="https://mon-magasin.com"
                value={urlBoutique}
                onChange={(e) => setUrlBoutique(e.target.value)}
                className="flex-1 rounded-xl border border-white/20 bg-white/10 p-3 text-xs text-white placeholder-blue-200 backdrop-blur focus:bg-white focus:text-slate-900 focus:placeholder-slate-400 focus:outline-none transition"
              />
              <button
                onClick={connecterBoutiqueAuto}
                disabled={connexionEnCours}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-xs font-bold text-slate-950 shadow-md hover:bg-amber-300 disabled:opacity-60 transition shrink-0"
              >
                {connexionEnCours ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Connexion en cours...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 fill-slate-950" /> Connecter en 1 Clic
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Confirmation de connexion réussie */}
          {boutiqueConnectee && (
            <div className="rounded-xl bg-emerald-500/20 p-4 border border-emerald-400/30 text-xs text-emerald-100 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300 mt-0.5" />
              <div>
                <p className="font-bold text-white text-sm">Boutique connectée avec succès !</p>
                <p className="mt-1">
                  <b>{boutiqueConnectee.platform}</b> ({boutiqueConnectee.storeUrl}) est maintenant liée à SMSIKA.
                  Dès qu&apos;une commande a lieu sur votre site, les SMS de confirmation sont émis automatiquement.
                </p>
                <p className="mt-2 font-mono text-[11px] text-emerald-200">
                  Webhook actif : {boutiqueConnectee.webhookUrl}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* CART 2 : CONFIGURATION MANUELLE WEBHOOK */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800 space-y-6">
          <div className="flex items-center gap-3">
            <Webhook className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Configuration Manuelle Webhook HTTP POST</h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
              URL de Webhook personnalisée
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://mon-application.com/api/webhooks/smsika"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 p-3 font-mono text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <button
                onClick={enregistrer}
                disabled={enregistrement}
                className="rounded-xl bg-blue-600 px-5 py-3 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 transition shrink-0"
              >
                {enregistrement ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>

          {/* Option d'événements */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2">Événements souscrits</label>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              {EVENEMENTS.map((e) => (
                <label key={e.cle} className="flex cursor-pointer items-center gap-2 font-medium text-slate-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={evenements.includes(e.cle)}
                    onChange={() => basculerEvenement(e.cle)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  {e.etiquette}
                </label>
              ))}
              <label className="flex cursor-pointer items-center gap-2 font-medium text-slate-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={actifs}
                  onChange={(e) => setActifs(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Rappels actifs
              </label>
            </div>
          </div>

          {/* Boutons secret & test */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
            <button
              onClick={regenererSecret}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-200"
            >
              <KeyRound className="h-3.5 w-3.5" /> Générer un secret
            </button>
            <button
              onClick={tester}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-200"
            >
              <FlaskConical className="h-3.5 w-3.5" /> Tester le webhook
            </button>
          </div>

          {secretVisible && (
            <div className="rounded-xl bg-amber-50/80 p-3.5 border border-amber-200 text-xs text-amber-900 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300">
              <p className="font-bold">Secret de signature (à conserver) :</p>
              <code className="mt-1 block font-mono text-xs break-all">{secretVisible}</code>
            </div>
          )}

          {resultatTest && <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">Résultat : {resultatTest}</p>}

          {/* Historique des envois webhook */}
          {envois.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
              <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200">Historique des tentatives de webhook</h3>
              <ul className="divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
                {envois.map((l) => (
                  <li key={l.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-mono font-bold text-slate-700 dark:text-zinc-300">{l.type_evenement}</span>
                      <span className={`font-semibold ${l.statut === 'ENVOYE' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {l.statut} {l.dernier_code_http ? `(${l.dernier_code_http})` : ''}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">{new Date(l.date_creation).toLocaleString('fr-FR')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

      </div>

      <Toast notification={notification} />
    </CoquilleEspace>
  )
}
