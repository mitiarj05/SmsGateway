'use client'

import { useState, useEffect, useCallback } from 'react'
import { Inbox, RefreshCw, Loader2, Search, MessageSquare, Send, Settings, ArrowUpRight, Check } from 'lucide-react'
import CoquilleEspace from '../../../composants/CoquilleEspace'

interface Entrant {
  id: string
  initiales: string
  expediteur: string
  heure: string
  contenu: string
  passerelle: string
  statut: 'transmis' | 'verifier'
}

export default function PageEntreesEspace() {
  const [entrants, setEntrants] = useState<Entrant[]>([])
  const [chargement, setChargement] = useState(false)
  const [actualisationEnCours, setActualisationEnCours] = useState(false)
  const [recherche, setRecherche] = useState('')
  const [onglet, setOnglet] = useState<'tous' | 'transmis' | 'verifier'>('tous')
  const [retenteId, setRetenteId] = useState<string | null>(null)
  const [urlWebhook, setUrlWebhook] = useState<string | null>(null)

  const visibles = entrants
    .filter(e => onglet === 'tous' || e.statut === onglet)
    .filter(e =>
      e.expediteur.toLowerCase().includes(recherche.toLowerCase()) ||
      e.contenu.toLowerCase().includes(recherche.toLowerCase())
    )

  const charger = useCallback(async (silencieux = false) => {
    if (!silencieux) setActualisationEnCours(true)
    try {
      const res = await fetch('/api/espace/entrees?limit=100')
      const data = await res.json()
      const liste = Array.isArray(data.entrants) ? data.entrants : []
      const mapped: Entrant[] = liste.map((e: {
        id?: string | number
        expediteur?: string | null
        contenu?: string | null
        date_reception?: string | null
        statut_notification?: string | null
        appareils?: { nom?: string | null } | null
      }) => {
        const expediteur = e.expediteur || '—'
        return {
          id: e.id != null ? String(e.id) : '',
          initiales: expediteur !== '—' ? expediteur.substring(0, 2).toUpperCase() : '—',
          expediteur,
          heure: e.date_reception
            ? new Date(e.date_reception).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
            : '—',
          contenu: e.contenu || '',
          passerelle: e.appareils?.nom || '—',
          statut: e.statut_notification === 'ENVOYE' ? 'transmis' : 'verifier',
        }
      })
      setEntrants(mapped)
    } catch {
      setEntrants([])
    } finally {
      setChargement(false)
      setActualisationEnCours(false)
    }
  }, [])

  useEffect(() => {
    charger(true)
    fetch('/api/espace/notifications')
      .then((r) => r.json())
      .then((d) => setUrlWebhook(typeof d.url_notification === 'string' && d.url_notification ? d.url_notification : null))
      .catch(() => setUrlWebhook(null))
  }, [charger])

  async function retenter(id: string) {
    setRetenteId(id)
    try {
      await charger(true)
    } finally {
      setRetenteId(null)
    }
  }

  if (chargement) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const totalEntrants = entrants.length
  const transmisCount = entrants.filter(e => e.statut === 'transmis').length
  const verifierCount = entrants.filter(e => e.statut === 'verifier').length
  const ceJourCount = entrants.filter(e => {
    // e.heure est déjà formaté ; on recompte depuis les données brutes est impossible ici,
    // on utilise le préfixe jour/mois du format JJ/MM présent dans l'affichage.
    return e.heure.startsWith(new Date().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit' }))
  }).length

  const frequences = new Map<string, number>()
  for (const e of entrants) {
    if (e.expediteur && e.expediteur !== '—') {
      frequences.set(e.expediteur, (frequences.get(e.expediteur) ?? 0) + 1)
    }
  }
  let contactFrequent: string | null = null
  let echangesFrequent = 0
  for (const [expediteur, nombre] of frequences) {
    if (nombre > echangesFrequent) {
      contactFrequent = expediteur
      echangesFrequent = nombre
    }
  }

  return (
    <CoquilleEspace>
      {/* En-tête (Exact Screenshot) */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white">SMS reçus</h1>
          <p className="mt-1 text-[13.5px] text-slate-500 dark:text-zinc-400">
            Consultez les messages entrants adressés à votre compte.
          </p>
        </div>
        <button
          onClick={() => {}}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition"
        >
          <Settings className="h-4 w-4" /> Configurer le webhook
        </button>
      </div>

      {/* Main Grid 2 Cols (Exact Screenshot) */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">

        {/* Left Column (2 cols) : Boîte de réception */}
        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 xl:col-span-2 space-y-4">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">Boîte de réception</h2>
              <p className="text-[12px] text-slate-400">{totalEntrants} message(s) au total</p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex w-52 items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-[12.5px] text-slate-400 dark:bg-zinc-800">
                <Search className="h-3.5 w-3.5" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  className="flex-1 bg-transparent focus:outline-none dark:text-zinc-200 text-xs"
                />
              </div>
              <button
                onClick={() => charger(false)}
                disabled={actualisationEnCours}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-[12.5px] font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${actualisationEnCours ? 'animate-spin' : ''}`} /> Actualiser
              </button>
            </div>
          </div>

          {/* Onglets */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setOnglet('tous')}
              className={`rounded-full px-4 py-1.5 text-[12px] font-bold transition ${onglet === 'tous' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:text-zinc-400'}`}
            >
              Tous · {totalEntrants}
            </button>
            <button
              onClick={() => setOnglet('transmis')}
              className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition ${onglet === 'transmis' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:text-zinc-400'}`}
            >
              Transmis · {transmisCount}
            </button>
            <button
              onClick={() => setOnglet('verifier')}
              className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition ${onglet === 'verifier' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:text-zinc-400'}`}
            >
              À vérifier · {verifierCount}
            </button>
          </div>

          {/* Liste des messages */}
          <div className="divide-y divide-slate-100 dark:divide-zinc-800 pt-2 space-y-2">
            {visibles.length === 0 && (
              <p className="py-8 text-center text-xs text-slate-400">Aucun message pour le moment.</p>
            )}
            {visibles.map((m) => {
              const estTransmis = m.statut === 'transmis'
              return (
                <div key={m.id} className="flex items-center justify-between rounded-xl p-4 hover:bg-slate-50/80 dark:hover:bg-zinc-800/40">
                  <div className="flex items-start gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-xs text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {m.initiales}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-bold text-slate-900 dark:text-white">{m.expediteur}</p>
                        <span className="text-[10px] text-slate-400">{m.heure}</span>
                      </div>
                      <p className="mt-0.5 text-[12.5px] font-medium text-slate-700 dark:text-zinc-300 max-w-md">{m.contenu || '—'}</p>
                      <p className="mt-1 text-[11px] text-slate-400">Reçu sur {m.passerelle}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {estTransmis ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Transmis au webhook
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> À vérifier
                      </span>
                    )}
                    <button
                      onClick={() => retenter(m.id)}
                      disabled={retenteId === m.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1 text-[11px] font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 disabled:opacity-50"
                    >
                      {retenteId === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      Retenter
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column (3 Cards) */}
        <div className="space-y-4">

          {/* Card 1 : Répartition */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Répartition</h3>
            <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-zinc-800">
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500">Transmis au webhook</span>
                <span className="font-bold text-slate-800 dark:text-zinc-200">{transmisCount}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500">En attente de reprise</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{verifierCount}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500">Ce jour</span>
                <span className="font-bold text-slate-800 dark:text-zinc-200">{ceJourCount}</span>
              </div>
            </div>
          </div>

          {/* Card 2 : Webhook actif (#EEF2F6 background) */}
          <div className="rounded-[1.5rem] border border-blue-100 bg-[#f6f5ff] p-6 shadow-sm dark:bg-blue-500/10 dark:border-blue-500/20 space-y-3">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/20 text-xs">⚡</span>
              Webhook actif
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
              Vos réponses sont transmises en POST à <code className="font-mono font-semibold text-slate-800 dark:text-zinc-100 text-[11px]">{urlWebhook ?? '—'}</code>
            </p>
            <a href="/espace/notifications" className="inline-flex items-center gap-1 text-xs font-bold text-[#2563EB] hover:underline dark:text-blue-400 pt-1">
              Modifier <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Card 3 : Contact fréquent */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Contact fréquent</h3>
            <div className="flex items-center justify-between pt-1">
              <div>
                {contactFrequent ? (
                  <>
                    <span className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-zinc-800 dark:text-zinc-300 mb-1">+{echangesFrequent}</span>
                    <p className="font-mono font-bold text-xs text-slate-900 dark:text-white">{contactFrequent}</p>
                    <p className="text-[11px] text-slate-400">{echangesFrequent} échange(s) reçu(s)</p>
                  </>
                ) : (
                  <p className="text-[11px] text-slate-400">Aucun échange pour le moment.</p>
                )}
              </div>
            </div>
            <a href="/espace/envoyer" className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              <Send className="h-3.5 w-3.5" /> Répondre
            </a>
          </div>

        </div>

      </div>
    </CoquilleEspace>
  )
}
