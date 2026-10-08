'use client'

import { useState, useEffect, useCallback } from 'react'
import { Webhook, KeyRound, FlaskConical, Loader2, Zap, CheckCircle2, ArrowUpRight } from 'lucide-react'
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

const EVENEMENTS_DISPONIBLES = [
  { id: 'sms.recu', label: 'SMS reçus' },
  { id: 'lien.clique', label: 'Clics lien' },
]

export default function PageNotificationsEspace() {
  const [url, setUrl] = useState('')
  const [evenements, setEvenements] = useState<string[]>(['sms.recu', 'lien.clique'])
  const [actifs, setActifs] = useState(true)
  const [secretVisible, setSecretVisible] = useState<string | null>(null)
  const [resultatTest, setResultatTest] = useState<string | null>(null)
  const [envois, setEnvois] = useState<Envoi[]>([])
  const [chargement, setChargement] = useState(false)
  const [enregistrement, setEnregistrement] = useState(false)
  const [notification, setNotification] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  const [urlBoutique, setUrlBoutique] = useState('')
  const [plateformeChoisie, setPlateformeChoisie] = useState('WooCommerce')
  const [connexionEnCours, setConnexionEnCours] = useState(false)
  const [boutiqueConnectee, setBoutiqueConnectee] = useState(false)

  function afficherNotification(type: 'succes' | 'erreur', texte: string) {
    setNotification({ type, texte })
    setTimeout(() => setNotification(null), 4000)
  }

  const chargerDonnees = useCallback(async () => {
    try {
      const [reponseConfig, reponseJournal] = await Promise.all([
        fetch('/api/espace/notifications'),
        fetch('/api/espace/journal'),
      ])
      const config = await reponseConfig.json()
      if (config.url_notification !== undefined) {
        if (config.url_notification) {
          setUrl(config.url_notification)
          setBoutiqueConnectee(config.url_notification.includes('/wp-json/smsika/v1/webhook'))
        }
        if (Array.isArray(config.evenements_notification)) setEvenements(config.evenements_notification)
        if (typeof config.notifications_actives === 'boolean') setActifs(config.notifications_actives)
      }
      const journal = await reponseJournal.json().catch(() => ({}))
      if (Array.isArray(journal.envois)) setEnvois(journal.envois)
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => { chargerDonnees() }, [chargerDonnees])

  async function enregistrer() {
    setEnregistrement(true)
    try {
      const reponse = await fetch('/api/espace/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url_notification: url.trim() === '' ? null : url.trim(),
          evenements_notification: evenements,
          notifications_actives: actifs,
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
      setEnregistrement(false)
    }
  }

  async function appeler(corp: Record<string, unknown>) {
    const reponse = await fetch('/api/espace/notifications', {
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
      if (reponse.ok && donnees.url_notification) {
        if (donnees.secret_notification_visible) setSecretVisible(donnees.secret_notification_visible)
        setUrl(donnees.url_notification)
        setBoutiqueConnectee(true)
        afficherNotification('succes', donnees.message ?? 'Boutique connectée en 1 Clic !')
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
        chargerDonnees()
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
      {/* En-tête (Exact Screenshot) */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white">Connexion Boutique & Webhooks</h1>
          <p className="mt-1 text-[13.5px] text-slate-500 dark:text-zinc-400">
            Reliez votre site marchand en 1 clic ou configurez votre URL de Webhook personnalisée.
          </p>
        </div>
      </div>

      {/* Main Grid 2 Cols (Exact Screenshot) */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">

        {/* Left Column (2 cols) */}
        <div className="xl:col-span-2 space-y-4">

          {/* Card 1 : Connexion Boutique en 1 clic (#4f46e5 to #4338ca gradient) */}
          <div className="rounded-[1.5rem] bg-gradient-to-br from-[#4f46e5] to-[#4338ca] p-6 text-white shadow-card space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <Zap className="h-5 w-5 text-amber-300" />
                </div>
                <div>
                  <h2 className="text-base font-bold">Connexion Boutique en 1 clic (Auto-Connect)</h2>
                  <p className="text-xs text-blue-100">
                    Saisissez l'adresse de votre site web : SMSTSIKA s'occupe d'injecter la clé et de lier la passerelle automatiquement.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-amber-400/20 px-3 py-1 text-[11px] font-bold text-amber-300 border border-amber-400/30">
                ⚡ Zéro Code
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-blue-100 mb-2">Sélectionnez votre plateforme :</label>
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
                    className={`rounded-xl p-3 text-left transition ${plateformeChoisie === p.id ? 'bg-white text-blue-950 font-bold shadow-md' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-blue-100">Adresse de votre boutique :</label>
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <input
                  type="url"
                  value={urlBoutique}
                  onChange={(e) => setUrlBoutique(e.target.value)}
                  placeholder="https://mon-magasin.com"
                  className="flex-1 rounded-2xl border border-white/20 bg-white/10 p-3 text-xs text-white placeholder-blue-200 outline-none backdrop-blur focus:bg-white focus:text-slate-900 font-mono"
                />
                <button
                  onClick={connecterBoutiqueAuto}
                  disabled={connexionEnCours}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-6 py-3 text-xs font-bold text-slate-950 shadow-md hover:bg-amber-300 disabled:opacity-60 transition shrink-0"
                >
                  {connexionEnCours ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 fill-slate-950" />}
                  Connecter en 1 clic
                </button>
              </div>
            </div>
          </div>

          {/* Card 2 : Configuration Manuelle Webhook HTTP POST */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <Webhook className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Configuration Manuelle Webhook HTTP POST</h2>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">URL de Webhook personnalisée</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-800 font-mono focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <button
                  onClick={enregistrer}
                  disabled={enregistrement}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#2563EB] px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-[#1D4ED8] transition shrink-0"
                >
                  {enregistrement ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">Événements souscrits</label>
              <div className="flex flex-wrap items-center gap-6 text-xs text-slate-700 dark:text-zinc-300">
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

            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={actifs}
                onChange={(e) => setActifs(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Notifications actives</span>
            </label>

            {secretVisible && (
              <div className="rounded-xl bg-amber-50 p-3 ring-1 ring-amber-600/20 dark:bg-amber-500/10">
                <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">Secret — copiez-le maintenant (affiché une seule fois) :</p>
                <code className="mt-1 block break-all font-mono text-[11px] text-amber-900 dark:text-amber-200">{secretVisible}</code>
              </div>
            )}

            {resultatTest && (
              <p className="text-xs font-semibold text-slate-600 dark:text-zinc-300">Test : {resultatTest}</p>
            )}

            <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button onClick={regenererSecret} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300">
                <KeyRound className="h-3.5 w-3.5" /> Générer un secret
              </button>
              <button onClick={tester} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300">
                <FlaskConical className="h-3.5 w-3.5" /> Tester le webhook
              </button>
            </div>
          </div>

          {/* Card 3 : Dernières livraisons webhook */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Dernières livraisons webhook</h2>
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
                  <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-zinc-800">
                    <th className="pb-2.5 pr-4">ÉVÉNEMENT</th>
                    <th className="pb-2.5 pr-4">HEURE</th>
                    <th className="pb-2.5 pr-4">CODE</th>
                    <th className="pb-2.5 text-right">TENTATIVES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {envois.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
                        Aucune livraison pour le moment.
                      </td>
                    </tr>
                  )}
                  {envois.map((l) => (
                    <tr key={l.id} className="text-slate-700 dark:text-zinc-300">
                      <td className="py-3 pr-4 font-mono font-bold">{l.type_evenement}</td>
                      <td className="py-3 pr-4 text-slate-400">
                        {new Date(l.date_creation).toLocaleTimeString('fr-FR')}
                      </td>
                      <td className="py-3 pr-4">
                        {l.statut === 'ENVOYE' ? (
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                            {l.dernier_code_http ?? 200}
                          </span>
                        ) : (
                          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                            {l.statut}
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right font-mono text-slate-500">{l.tentatives}</td>
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
            <p className="leading-relaxed text-slate-600 dark:text-zinc-400">
              {boutiqueConnectee
                ? `Votre boutique est reliée : les notifications partent vers ${url || 'votre webhook'}.`
                : 'Aucune boutique reliée pour le moment. Connectez WooCommerce, Shopify ou PrestaShop pour recevoir vos notifications.'}
            </p>
          </div>

          {/* Bottom CTA Dark Navy Card (#1F1A52) */}
          <div className="rounded-[1.5rem] bg-gradient-to-br from-[#332c75] to-[#1f1a52] p-6 text-white shadow-card space-y-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">BESOIN D'AIDE ?</p>
            <p className="text-xs text-white/80 leading-relaxed">
              Notre équipe intègre votre boutique en moins de 24 h, gratuitement.
            </p>
            <a href="mailto:support@smsika.app" className="block w-full rounded-full bg-amber-400 py-3 text-xs font-bold text-slate-950 shadow-md hover:bg-amber-300 transition">
              Demander une intégration
            </a>
          </div>

        </div>

      </div>

      <Toast notification={notification} />
    </CoquilleEspace>
  )
}
