'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Smartphone, Plus, RefreshCw, SlidersHorizontal,
  Check, MoreHorizontal, Loader2, QrCode, Search, ChevronDown, Info, ArrowUpRight, WifiOff
} from 'lucide-react'
import CoquilleTableauDeBord from '../../composants/CoquilleTableauDeBord'
import { Appareil, Toast, DialogueConfirmation, QUOTA_SMS_PAR_HEURE } from '../../composants/interface'
import ModalAjouterAppareil from '../../composants/ModalAjouterAppareil'

export default function AppareilsPage() {
  const [appareils, setAppareils] = useState<Appareil[]>([])
  const [quota, setQuota] = useState(QUOTA_SMS_PAR_HEURE)
  const [chargement, setChargement] = useState(true)
  const [actualisationEnCours, setActualisationEnCours] = useState(false)
  const [recherche, setRecherche] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('ALL')
  const [notification, setNotification] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)
  const [cibleSuppression, setCibleSuppression] = useState<Appareil | null>(null)
  const [suppressionEnCours, setSuppressionEnCours] = useState(false)
  const [modalAjoutOuverte, setModalAjoutOuverte] = useState(false)

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

  if (chargement) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const totalAppareils = appareils.length
  const enLigneCount = appareils.filter((a) => a.statut === 'EN_LIGNE').length

  const appareilsVisibles = appareils.filter((a) => {
    const correspondStatut = filtreStatut === 'ALL' || a.statut === filtreStatut
    const correspondRecherche = a.nom.toLowerCase().includes(recherche.toLowerCase())
    return correspondStatut && correspondRecherche
  })

  return (
    <CoquilleTableauDeBord>
      {/* En-tête (Exact Screenshot) */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white">
            Appareils
          </h1>
          <p className="mt-1 text-[13.5px] text-slate-500 dark:text-zinc-400">
            Gérez vos téléphones passerelles et surveillez leur état.
          </p>
        </div>
        <button
          onClick={() => setModalAjoutOuverte(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[#5b5bd6] px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-indigo-300/45 hover:bg-[#4c4cc9] transition"
        >
          <Plus className="h-4 w-4" /> Ajouter un appareil
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Colonne Gauche (2 cols) : Flotte de téléphones */}
        <div className="xl:col-span-2 space-y-4">
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-6">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[17px] font-bold text-slate-900 dark:text-white">Flotte de téléphones</h2>
                <p className="text-[12px] text-slate-400 dark:text-zinc-500">{totalAppareils} appareil connecté à votre espace</p>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un appareil"
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                    className="w-52 rounded-full border border-slate-200 bg-white py-2 pl-8 pr-3 text-[12.5px] shadow-2xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  />
                </div>
                <div className="relative">
                  <select
                    value={filtreStatut}
                    onChange={(e) => setFiltreStatut(e.target.value)}
                    className="appearance-none rounded-full border border-slate-200 bg-white py-2 pl-3.5 pr-8 text-[12.5px] font-semibold text-slate-600 shadow-2xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <option value="ALL">Tous les statuts</option>
                    <option value="EN_LIGNE">En ligne</option>
                    <option value="HORS_LIGNE">Hors ligne</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Carte du Téléphone Infinix X689C (Exact Screenshot) */}
            <div className="space-y-4">
              {appareilsVisibles.length === 0 && (
                <p className="py-10 text-center text-xs text-slate-400 dark:text-zinc-500">
                  Aucun appareil enregistré — ajoutez votre premier téléphone.
                </p>
              )}
              {appareilsVisibles.map((a) => {
                const enLigne = a.statut === 'EN_LIGNE'
                const utilises = a.sms_last_hour ?? 0
                const pct = quota > 0 ? Math.min(100, Math.round((utilises / quota) * 100)) : 0
                return (
                <div key={a.id} className="relative rounded-2xl bg-slate-50/80 p-6 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800 space-y-6">
                  {/* Badge statut top left */}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${enLigne ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${enLigne ? 'bg-emerald-500' : 'bg-rose-500'}`} /> {enLigne ? 'En ligne' : 'Hors ligne'}
                    </span>
                    <button onClick={() => setCibleSuppression(a)} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Body Vector & Details */}
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* Phone Vector Container */}
                    <div className="flex h-44 w-32 shrink-0 flex-col items-center justify-center gap-2 rounded-[2.2rem] border-2 border-slate-200 bg-slate-50/60 p-3 text-center dark:border-zinc-700 dark:bg-zinc-900">
                      {enLigne
                        ? <Smartphone size={26} className="text-emerald-500" />
                        : <WifiOff size={26} className="text-slate-300 dark:text-zinc-600" />}
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                        {enLigne ? 'EN LIGNE' : 'HORS LIGNE'}
                      </span>
                    </div>

                    <div className="space-y-4 flex-1 text-center sm:text-left">
                      <div>
                        <h3 className="text-[20px] font-extrabold text-slate-900 dark:text-white">{a.nom}</h3>
                        <p className="font-mono text-[12px] text-slate-400">{a.id}</p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">JETON PUSH FCM</p>
                        <code className="mt-0.5 inline-block rounded bg-slate-200/60 px-2.5 py-1 font-mono text-[13px] text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
                          {a.fcm_token ? a.fcm_token : '—'}
                        </code>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">DERNIÈRE ACTIVITÉ</p>
                        <p className="text-[13.5px] font-bold text-slate-800 dark:text-zinc-200">
                          {a.derniere_activite && !Number.isNaN(new Date(a.derniere_activite).getTime())
                            ? new Date(a.derniere_activite).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar utilisation */}
                  <div className="pt-2 space-y-2 border-t border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between text-[11.5px] text-slate-500 dark:text-zinc-400">
                      <span className="font-medium">Utilisation SMS/h</span>
                      <span className="font-bold text-slate-800 dark:text-zinc-200">{utilises} / {quota}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-zinc-700">
                      <div className="h-1.5 rounded-full bg-gradient-to-r from-[#7c7ce0] to-[#5b5bd6]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          </div>

          {/* Banner d'information bas de page (Exact Screenshot) */}
          <div className="flex items-center gap-4 rounded-2xl border border-indigo-100 bg-[#f6f5ff] px-5 py-4 dark:bg-blue-500/10 dark:border-blue-500/20">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#5b5bd6]/10 text-[#5b5bd6] dark:bg-blue-500/20 dark:text-blue-400">
              <Info className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-[13.5px] font-bold text-slate-800 dark:text-zinc-200">
                Gardez votre passerelle connectée.
              </p>
              <p className="mt-0.5 text-[12px] text-slate-500 dark:text-zinc-400">
                Vérifiez le réseau et l'application sur le téléphone pour reprendre les envois.
              </p>
            </div>
            <a href="/espace/api" className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[#5b5bd6] hover:underline dark:text-blue-400">
              Documentation <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Colonne Droite (1 col) : Capacité & Appareils enregistrés (Exact Screenshot) */}
        <div className="space-y-4">
          {/* Card Capacité configurée */}
          <div className="rounded-[1.5rem] bg-gradient-to-br from-[#332c75] to-[#1f1a52] p-6 text-white shadow-card space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/60">
              Capacité configurée
            </p>
            <p className="text-[44px] font-extrabold leading-none">
              {totalAppareils * quota} <span className="text-[16px] font-bold text-white/60">SMS/h</span>
            </p>
            <p className="text-[11.5px] leading-relaxed text-white/55">
              Capacité totale de votre flotte, selon les quotas par appareil.
            </p>
            <p className="flex items-center gap-2 text-[11.5px] text-white/60 pt-2 border-t border-white/10">
              <span className={`h-1.5 w-1.5 rounded-full ${enLigneCount > 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
              {enLigneCount > 0
                ? `${enLigneCount} appareil${enLigneCount > 1 ? 's' : ''} actif${enLigneCount > 1 ? 's' : ''} maintenant`
                : 'Aucun appareil actif maintenant'}
            </p>
          </div>

          {/* Card Appareils enregistrés */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card px-6 py-5 dark:bg-zinc-900 dark:border-zinc-800 space-y-1">
            <p className="text-[12px] font-medium text-slate-400">
              Appareils enregistrés
            </p>
            <p className="text-[30px] font-extrabold text-slate-900 dark:text-white">{totalAppareils}</p>
          </div>

          {/* Card Actifs maintenant */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card px-6 py-5 dark:bg-zinc-900 dark:border-zinc-800 space-y-1">
            <p className="text-[12px] font-medium text-slate-400">
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
