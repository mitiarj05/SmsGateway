'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Smartphone, Plus, RefreshCw, SlidersHorizontal,
  Check, Loader2, QrCode, Search, ChevronDown, Info, ArrowUpRight, WifiOff,
  Pencil, Trash2, FileText, Radio,
} from 'lucide-react'
import CoquilleTableauDeBord from '../../composants/CoquilleTableauDeBord'
import { Appareil, Toast, DialogueConfirmation, QUOTA_SMS_PAR_HEURE, SoldeSim } from '../../composants/interface'
import ModalAjouterAppareil from '../../composants/ModalAjouterAppareil'

export default function AppareilsPage() {
  const [appareils, setAppareils] = useState<Appareil[]>([])
  const [quota, setQuota] = useState(QUOTA_SMS_PAR_HEURE)
  const [chargement, setChargement] = useState(true)
  const [actualisationEnCours, setActualisationEnCours] = useState(false)
  const [recherche, setRecherche] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('ALL')
  const [filtreClient, setFiltreClient] = useState('ALL')
  const [notification, setNotification] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)
  const [cibleSuppression, setCibleSuppression] = useState<Appareil | null>(null)
  const [suppressionEnCours, setSuppressionEnCours] = useState(false)
  const [modalAjoutOuverte, setModalAjoutOuverte] = useState(false)
  const [cibleEdition, setCibleEdition] = useState<Appareil | null>(null)
  const [nomEdition, setNomEdition] = useState('')
  const [editionEnCours, setEditionEnCours] = useState(false)
  const [reveilEnCours, setReveilEnCours] = useState<string | null>(null)

  function afficherNotification(type: 'succes' | 'erreur', texte: string) {
    setNotification({ type, texte })
    setTimeout(() => setNotification(null), 4000)
  }

  const chargerDonnees = async (silencieux = false) => {
    if (!silencieux) setActualisationEnCours(true)
    try {
      const [reponse, reponseParams] = await Promise.all([
        fetch('/api/devices'),
        fetch('/api/settings'),
      ])
      const donnees = await reponse.json().catch(() => ({}))
      if (Array.isArray(donnees.devices)) {
        setAppareils(donnees.devices)
      }
      if (reponseParams.ok) {
        const donneesParams = await reponseParams.json().catch(() => ({}))
        if (typeof donneesParams.settings?.sms_quota_per_hour === 'number') {
          setQuota(donneesParams.settings.sms_quota_per_hour)
        }
      }
    } catch {
      afficherNotification('erreur', 'Chargement impossible')
    } finally {
      setChargement(false)
      setActualisationEnCours(false)
    }
  }

  useEffect(() => {
    chargerDonnees(true)
    const interval = setInterval(() => chargerDonnees(true), 5000)
    return () => clearInterval(interval)
  }, [])

  async function supprimerAppareil() {
    if (!cibleSuppression) return
    setSuppressionEnCours(true)
    try {
      const reponse = await fetch(`/api/devices/${cibleSuppression.id}`, { method: 'DELETE' })
      const donnees = await reponse.json().catch(() => ({}))
      if (reponse.ok) {
        afficherNotification('succes', `« ${cibleSuppression.nom} » supprimé`)
        setCibleSuppression(null)
        chargerDonnees(true)
      } else {
        afficherNotification('erreur', donnees?.error ?? 'Suppression impossible')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
      setCibleSuppression(null)
    } finally {
      setSuppressionEnCours(false)
    }
  }

  /** POST ping : un push test FCM pour réveiller la connexion de l'appareil. */
  async function reveillerAppareil(a: Appareil) {
    setReveilEnCours(a.id)
    try {
      const reponse = await fetch(`/api/devices/${a.id}/ping`, { method: 'POST' })
      const donnees = await reponse.json().catch(() => ({}))
      if (reponse.ok && donnees.ping_sent) {
        afficherNotification('succes', `Push de réveil envoyé à « ${a.nom} »`)
      } else {
        afficherNotification('erreur', donnees?.error ?? 'Réveil impossible (pas de jeton FCM ?)')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    } finally {
      setReveilEnCours(null)
    }
  }

  async function enregistrerEdition() {
    if (!cibleEdition || !nomEdition.trim()) return
    setEditionEnCours(true)
    try {
      const reponse = await fetch(`/api/devices/${cibleEdition.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: nomEdition.trim() }),
      })
      const donnees = await reponse.json().catch(() => ({}))
      if (reponse.ok) {
        afficherNotification('succes', `Appareil renommé en « ${nomEdition.trim()} »`)
        setCibleEdition(null)
        chargerDonnees(true)
      } else {
        afficherNotification('erreur', donnees?.error ?? 'Renommage impossible')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    } finally {
      setEditionEnCours(false)
    }
  }

  if (chargement) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1C1917]/[0.04] dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const totalAppareils = appareils.length
  const enLigneCount = appareils.filter((a) => a.statut === 'EN_LIGNE').length

  const appareilsVisibles = appareils.filter((a) => {
    const correspondStatut = filtreStatut === 'ALL' || a.statut === filtreStatut
    const correspondClient =
      filtreClient === 'ALL' ||
      (filtreClient === 'NONE' ? !a.client_id : a.client_id === filtreClient)
    const retour = recherche.toLowerCase()
    const correspondRecherche =
      a.nom.toLowerCase().includes(retour) ||
      (a.client_nom ?? '').toLowerCase().includes(retour)
    return correspondStatut && correspondClient && correspondRecherche
  })

  // Clients réellement présents dans la flotte (dédupliqués, triés).
  const listeClients = Array.from(
    new Map(
      appareils
        .filter((a) => a.client_id && a.client_nom)
        .map((a) => [a.client_id as string, a.client_nom as string])
    ).entries()
  ).sort(([, nA], [, nB]) => nA.localeCompare(nB))
  const orphelinsCount = appareils.filter((a) => !a.client_id).length

  return (
    <CoquilleTableauDeBord>
      {/* En-tête (Exact Screenshot) */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#1C1917] dark:text-white">
            Appareils
          </h1>
          <p className="mt-1 text-[13.5px] text-stone-600 dark:text-zinc-400">
            Flotte globale de la passerelle — tous les téléphones de tous les clients.
          </p>
        </div>
        <button
          onClick={() => setModalAjoutOuverte(true)}
          className="survol-brillance inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg hover:bg-[#1D4ED8] transition"
        >
          <Plus className="h-4 w-4" /> Ajouter un appareil
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Colonne Gauche (2 cols) : Flotte de téléphones */}
        <div className="xl:col-span-2 space-y-4">
          <div className="rounded-2xl border border-[#1C1917]/10 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-6">
            <div className="flex flex-col gap-3 border-b border-[#1C1917]/10 pb-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[17px] font-bold text-[#1C1917] dark:text-white">Flotte de téléphones</h2>
                <p className="text-[12px] text-stone-500 dark:text-zinc-500">
                  {appareilsVisibles.length === totalAppareils
                    ? `${totalAppareils} appareil${totalAppareils > 1 ? 's' : ''} au service de la passerelle`
                    : `${appareilsVisibles.length} affiché${appareilsVisibles.length > 1 ? 's' : ''} sur ${totalAppareils}`}
                </p>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-500" />
                  <input
                    type="text"
                    placeholder="Rechercher par appareil ou client"
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                    className="w-52 rounded-full border border-[#1C1917]/10 bg-white py-2 pl-8 pr-3 text-[12.5px] shadow-2xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  />
                </div>
                <div className="relative">
                  <select
                    value={filtreClient}
                    onChange={(e) => setFiltreClient(e.target.value)}
                    className="appearance-none rounded-full border border-[#1C1917]/10 bg-white py-2 pl-3.5 pr-8 text-[12.5px] font-semibold text-stone-600 shadow-2xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <option value="ALL">Tous les clients</option>
                    {listeClients.map(([id, nom]) => (
                      <option key={id} value={id}>{nom}</option>
                    ))}
                    {orphelinsCount > 0 && (
                      <option value="NONE">Sans client ({orphelinsCount})</option>
                    )}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-500" />
                </div>
                <div className="relative">
                  <select
                    value={filtreStatut}
                    onChange={(e) => setFiltreStatut(e.target.value)}
                    className="appearance-none rounded-full border border-[#1C1917]/10 bg-white py-2 pl-3.5 pr-8 text-[12.5px] font-semibold text-stone-600 shadow-2xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <option value="ALL">Tous les statuts</option>
                    <option value="EN_LIGNE">En ligne</option>
                    <option value="HORS_LIGNE">Hors ligne</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-500" />
                </div>
              </div>
            </div>

            {/* Carte téléphone (données temps réel) */}
            <div className="space-y-4">
              {appareilsVisibles.length === 0 && (
                <p className="py-10 text-center text-xs text-stone-500 dark:text-zinc-500">
                  Aucun appareil enregistré sur la passerelle pour le moment.
                </p>
              )}
              {appareilsVisibles.map((a) => {
                const enLigne = a.statut === 'EN_LIGNE'
                const utilises = a.sms_last_hour ?? 0
                const pct = quota > 0 ? Math.min(100, Math.round((utilises / quota) * 100)) : 0
                return (
                <div key={a.id} className="relative rounded-2xl bg-white p-6 dark:bg-zinc-800/40 border border-[#1C1917]/10 dark:border-zinc-800 space-y-6">
                  {/* Badge statut + actions */}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold${enLigne ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full${enLigne ? 'bg-emerald-500' : 'bg-rose-500'}`} /> {enLigne ? 'En ligne' : 'Hors ligne'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => reveillerAppareil(a)}
                        disabled={!a.fcm_present || reveilEnCours === a.id}
                        title={a.fcm_present ? 'Envoyer un push de réveil' : 'Aucun jeton FCM — réveil impossible'}
                        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#1C1917]/10 bg-white px-3 text-[11px] font-semibold text-stone-600 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-blue-400"
                      >
                        {reveilEnCours === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Radio className="h-3.5 w-3.5" />}
                        Réveiller
                      </button>
                      <button
                        onClick={() => { setCibleEdition(a); setNomEdition(a.nom) }}
                        title="Renommer cet appareil"
                        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#1C1917]/10 bg-white px-3 text-[11px] font-semibold text-stone-600 transition hover:border-blue-300 hover:text-blue-600 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-blue-400"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Éditer
                      </button>
                      <Link
                        href={`/history?appareil=${a.id}`}
                        title="Voir les envois de cet appareil"
                        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#1C1917]/10 bg-white px-3 text-[11px] font-semibold text-stone-600 transition hover:border-blue-300 hover:text-blue-600 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-blue-400"
                      >
                        <FileText className="h-3.5 w-3.5" /> Envois
                      </Link>
                      <button
                        onClick={() => setCibleSuppression(a)}
                        title="Supprimer cet appareil"
                        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-rose-200 bg-white px-3 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50 hover:border-rose-300 dark:bg-zinc-800 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-900/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Supprimer
                      </button>
                    </div>
                  </div>

                  {/* Fiche compacte : identité + connexion + activité + solde regroupés */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl${enLigne ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-stone-100 text-stone-400 dark:bg-zinc-800 dark:text-zinc-600'}`}>
                        {enLigne ? <Smartphone size={18} /> : <WifiOff size={18} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[15px] font-extrabold text-[#1C1917] dark:text-white">{a.nom}</h3>
                        <p className="text-[11px] font-semibold text-stone-500 dark:text-zinc-400">
                          Client : {a.client_nom ?? '— non lié à un client —'}
                        </p>
                      </div>
                      <code className="hidden md:inline-block self-center rounded bg-[#1C1917]/[0.06] px-2 py-0.5 font-mono text-[10.5px] text-stone-500 dark:bg-zinc-800 dark:text-zinc-400">
                        {a.fcm_token ? `FCM ${a.fcm_token}` : 'sans FCM'}
                      </code>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div className="rounded-xl border border-[#1C1917]/10 bg-stone-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-800/50">
                        <p className="text-[9.5px] font-bold uppercase tracking-wider text-stone-400 dark:text-zinc-500">Dernière activité</p>
                        <p className="text-[12.5px] font-bold text-[#1C1917] dark:text-zinc-200">
                          {a.derniere_activite && !Number.isNaN(new Date(a.derniere_activite).getTime())
                            ? new Date(a.derniere_activite).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#1C1917]/10 bg-stone-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-800/50">
                        <p className="text-[9.5px] font-bold uppercase tracking-wider text-stone-400 dark:text-zinc-500">Solde de la SIM</p>
                        <SoldeSim
                          montant={a.solde_sim}
                          devise={a.solde_devise}
                          texte={a.solde_texte}
                          majLe={a.solde_maj_le}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Progress bar utilisation */}
                  <div className="pt-2 space-y-2 border-t border-[#1C1917]/10 dark:border-zinc-800">
                    <div className="flex items-center justify-between text-[11.5px] text-stone-600 dark:text-zinc-400">
                      <span className="font-medium">Utilisation SMS/h</span>
                      <span className="font-bold text-[#1C1917] dark:text-zinc-200">{utilises} / {quota}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[#1C1917]/[0.04] dark:bg-zinc-700">
                      <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          </div>

          {/* Banner d'information bas de page (Exact Screenshot) */}
          <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-[#f6f5ff] px-5 py-4 dark:bg-blue-500/10 dark:border-blue-500/20">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2563EB]/10 text-[#2563EB] dark:bg-blue-500/20 dark:text-blue-400">
              <Info className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-[13.5px] font-bold text-[#1C1917] dark:text-zinc-200">
                Gardez votre passerelle connectée.
              </p>
              <p className="mt-0.5 text-[12px] text-stone-600 dark:text-zinc-400">
                Vérifiez le réseau et l'application sur le téléphone pour reprendre les envois.
              </p>
            </div>
            <a href="/comment-ca-marche" className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[#2563EB] hover:underline dark:text-blue-400">
              Documentation <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Colonne Droite (1 col) : Capacité & Appareils enregistrés (Exact Screenshot) */}
        <div className="space-y-4">
          {/* Card Capacité configurée */}
          <div className="survol-lift rounded-2xl bg-gradient-to-br from-[#332c75] to-[#1f1a52] p-6 text-white shadow-card space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/60">
              Capacité configurée
            </p>
            <p className="text-[44px] font-extrabold leading-none">
              {totalAppareils * quota} <span className="text-[16px] font-bold text-white/60">SMS/h</span>
            </p>
            <p className="text-[11.5px] leading-relaxed text-white/55">
              Capacité totale de la flotte globale, selon les quotas par appareil.
            </p>
            <p className="flex items-center gap-2 text-[11.5px] text-white/55 pt-2 border-t border-white/10">
              <span className={`h-1.5 w-1.5 rounded-full${enLigneCount > 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
              {enLigneCount > 0
                ? `${enLigneCount} appareil${enLigneCount > 1 ? 's' : ''} actif${enLigneCount > 1 ? 's' : ''} maintenant`
                : 'Aucun appareil actif maintenant'}
            </p>
          </div>

          {/* Card Appareils enregistrés */}
          <div className="survol-lift rounded-2xl border border-[#1C1917]/10 bg-white shadow-card px-6 py-5 dark:bg-zinc-900 dark:border-zinc-800 space-y-1">
            <p className="text-[12px] font-medium text-stone-500">
              Appareils enregistrés
            </p>
            <p className="text-[30px] font-extrabold text-[#1C1917] dark:text-white">{totalAppareils}</p>
          </div>

          {/* Card Actifs maintenant */}
          <div className="survol-lift rounded-2xl border border-[#1C1917]/10 bg-white shadow-card px-6 py-5 dark:bg-zinc-900 dark:border-zinc-800 space-y-1">
            <p className="text-[12px] font-medium text-stone-500">
              Actifs maintenant
            </p>
            <p className="text-[30px] font-extrabold text-emerald-600 dark:text-emerald-400">{enLigneCount}</p>
          </div>
        </div>
      </div>

      <ModalAjouterAppareil
        ouvert={modalAjoutOuverte}
        onFermer={() => setModalAjoutOuverte(false)}
      />

      {/* Modal de renommage */}
      {cibleEdition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setCibleEdition(null)}>
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-card dark:bg-zinc-900 dark:border dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[15px] font-bold text-[#1C1917] dark:text-white">Renommer l&apos;appareil</h3>
            <p className="mt-0.5 text-[11.5px] text-stone-500 dark:text-zinc-400">
              Le nom apparaît sur les pages Appareils et Historique.
            </p>
            <input
              type="text"
              value={nomEdition}
              onChange={(e) => setNomEdition(e.target.value)}
              maxLength={60}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') enregistrerEdition() }}
              className="mt-4 w-full rounded-xl border border-[#1C1917]/10 bg-white px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-blue-400 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setCibleEdition(null)}
                className="rounded-full border border-[#1C1917]/10 px-4 py-2 text-[12px] font-semibold text-stone-600 hover:bg-stone-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Annuler
              </button>
              <button
                onClick={enregistrerEdition}
                disabled={!nomEdition.trim() || editionEnCours}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#2563EB] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#1D4ED8] disabled:opacity-60"
              >
                {editionEnCours && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      <DialogueConfirmation
        ouvert={!!cibleSuppression}
        onFermer={() => setCibleSuppression(null)}
        onConfirmer={supprimerAppareil}
        chargement={suppressionEnCours}
        titre="Supprimer cet appareil ?"
        message={`« ${cibleSuppression?.nom ?? ''} » sera retiré.`}
        etiquetteConfirmer="Supprimer"
      />

      <Toast notification={notification} />
    </CoquilleTableauDeBord>
  )
}
