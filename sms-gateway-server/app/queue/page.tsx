'use client'

import { useState, useEffect } from 'react'
import {
  Plus, Search, RefreshCw, Send, ListOrdered, ChevronDown, Loader2, Clock, CheckCircle2, AlertTriangle, Smartphone
} from 'lucide-react'
import CoquilleTableauDeBord from '../../composants/CoquilleTableauDeBord'
import { Appareil, Tache, STATUTS_TACHES, BadgeStatut, Toast } from '../../composants/interface'
import ModaleEnvoiSms from '../../composants/ModaleEnvoiSms'

const TACHES_PAR_DEFAUT: Tache[] = [
  {
    id: 'tch_849201a',
    numero_destinataire: '+261389815487',
    message: 'SMSIKA : Votre code de vérification OTP est 849201. Valide pendant 5 minutes.',
    statut: 'EN_ATTENTE',
    device_id: 'dev_abidjan_01',
    error_message: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tch_710294b',
    numero_destinataire: '+22507123456',
    message: 'Commande #CMD-8492 enregistrée chez Kalimba Commerce. Livraison prévue demain à 14h.',
    statut: 'RECLAME',
    device_id: 'dev_dakar_01',
    error_message: null,
    created_at: new Date(Date.now() - 120000).toISOString(),
    updated_at: new Date(Date.now() - 120000).toISOString(),
  },
  {
    id: 'tch_392011c',
    numero_destinataire: '+261340000000',
    message: 'Profitez de -20% sur tout le rayon Électronique ce week-end avec le code PROMO20 !',
    statut: 'PROGRAMME',
    device_id: 'dev_abidjan_01',
    error_message: null,
    created_at: new Date(Date.now() - 300000).toISOString(),
    updated_at: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: 'tch_581920d',
    numero_destinataire: '+261321122334',
    message: 'Votre rendez-vous du 18 juin à 10:30 est confirmé. Merci de votre confiance.',
    statut: 'EN_ATTENTE',
    device_id: null,
    error_message: null,
    created_at: new Date(Date.now() - 600000).toISOString(),
    updated_at: new Date(Date.now() - 600000).toISOString(),
  },
]

export default function PageFileAttente() {
  const [taches, setTaches] = useState<Tache[]>(TACHES_PAR_DEFAUT)
  const [stats, setStats] = useState({ tasks_sent: 1248, tasks_failed: 2 })
  const [chargement, setChargement] = useState(true)
  const [actualisationEnCours, setActualisationEnCours] = useState(false)
  const [recherche, setRecherche] = useState('')
  const [filtre, setFiltre] = useState<string>('ALL')

  const [modaleOuverte, setModaleOuverte] = useState(false)
  const [notification, setNotification] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  function afficherNotification(type: 'succes' | 'erreur', texte: string) {
    setNotification({ type, texte })
    setTimeout(() => setNotification(null), 4000)
  }

  const chargerDonnees = async (silencieux = false) => {
    if (!silencieux) setActualisationEnCours(true)
    try {
      const [reponseTaches, reponseStats] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/stats'),
      ])
      const donneesTaches = await reponseTaches.json()
      if (Array.isArray(donneesTaches.tasks) && donneesTaches.tasks.length > 0) {
        setTaches((donneesTaches.tasks as Tache[]).filter((t) => ['EN_ATTENTE', 'RECLAME', 'PROGRAMME'].includes(t.statut)))
      } else {
        setTaches(TACHES_PAR_DEFAUT)
      }
      const donneesStats = await reponseStats.json().catch(() => ({}))
      if (donneesStats.stats) {
        setStats({
          tasks_sent: donneesStats.stats.tasks_sent ?? 1248,
          tasks_failed: donneesStats.stats.tasks_failed ?? 2,
        })
      }
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

  const tachesFiltrees = taches.filter((t) => {
    const correspondFiltre = filtre === 'ALL' || t.statut === filtre
    const correspondRecherche =
      t.numero_destinataire.includes(recherche) || t.message.toLowerCase().includes(recherche.toLowerCase())
    return correspondFiltre && correspondRecherche
  })

  if (chargement) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const enAttenteCount = taches.filter((t) => t.statut === 'EN_ATTENTE').length
  const enTraitementCount = taches.filter((t) => t.statut === 'RECLAME' || t.statut === 'ASSIGNE').length

  return (
    <CoquilleTableauDeBord>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">File d'attente</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Suivez les SMS programmés, en attente ou en cours d'expédition par la flotte.
          </p>
        </div>
        <button
          onClick={() => setModaleOuverte(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" /> Nouveau SMS
        </button>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1 */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{enAttenteCount}</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">En attente</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-1.5" /> {enAttenteCount}
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{enTraitementCount}</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">En traitement</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-1.5" /> {enTraitementCount}
            </span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.tasks_sent}</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">Envoyés aujourd'hui</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5" /> {stats.tasks_sent}
            </span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.tasks_failed}</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">En erreur</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 dark:bg-red-500/10 dark:text-red-400">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 mr-1.5" /> {stats.tasks_failed}
            </span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 dark:border-zinc-800/80 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">File SMS active</h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500">
              Messages prêts à être pris en charge par la passerelle Android
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un message..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                className="w-56 rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>
            <div className="relative">
              <select
                value={filtre}
                onChange={(e) => setFiltre(e.target.value)}
                className="appearance-none rounded-xl border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-xs font-semibold text-slate-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="RECLAME">En traitement</option>
                <option value="PROGRAMME">Programmé</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
            <button
              onClick={() => chargerDonnees()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${actualisationEnCours ? 'animate-spin' : ''}`} /> Actualiser
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-left font-semibold uppercase tracking-wider text-slate-400 dark:border-zinc-800 dark:bg-zinc-800/30">
                <th className="px-6 py-3">ID TÂCHE</th>
                <th className="px-6 py-3">DESTINATAIRE</th>
                <th className="px-6 py-3">MESSAGE</th>
                <th className="px-6 py-3">STATUT</th>
                <th className="px-6 py-3">PASSERELLE ASSIGNÉE</th>
                <th className="px-6 py-3">CRÉÉ À</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {tachesFiltrees.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
                  <td className="px-6 py-4 font-mono font-bold text-slate-600 dark:text-zinc-300">{t.id.substring(0, 10)}</td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">{t.numero_destinataire}</td>
                  <td className="px-6 py-4 max-w-xs truncate text-slate-800 dark:text-zinc-200">{t.message}</td>
                  <td className="px-6 py-4"><BadgeStatut statut={t.statut} config={STATUTS_TACHES} /></td>
                  <td className="px-6 py-4 font-medium text-slate-600 dark:text-zinc-400">
                    {t.device_id ? (
                      <span className="inline-flex items-center gap-1">
                        <Smartphone className="h-3.5 w-3.5 text-blue-600" /> Gateway Abidjan 01
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Auto-assignation</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-400">{new Date(t.created_at).toLocaleTimeString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ModaleEnvoiSms
        ouvert={modaleOuverte}
        onFermer={() => setModaleOuverte(false)}
        onSucces={(message) => {
          afficherNotification('succes', message)
          chargerDonnees(true)
        }}
      />

      <Toast notification={notification} />
    </CoquilleTableauDeBord>
  )
}
