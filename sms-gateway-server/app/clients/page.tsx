'use client'

import { useState, useEffect } from 'react'
import {
  Users, Key, Plus, RefreshCw, Search, ShieldCheck, MoreHorizontal, Download, Edit3, Trash2, CheckCircle2, AlertTriangle, Loader2
} from 'lucide-react'
import CoquilleTableauDeBord from '../../composants/CoquilleTableauDeBord'

interface ClientB2B {
  id: string
  nom: string
  email: string
  cle_api: string
  statut: 'ACTIF' | 'SUSPENDU'
  quota_mensuel: number
  utilise_mois: number
  date_creation: string
}

const CLIENTS_PAR_DEFAUT: ClientB2B[] = [
  {
    id: 'cli_01',
    nom: 'Amadou Koné',
    email: 'amadou@smsika.app',
    cle_api: 'sk_live_9f83a21b8c12a',
    statut: 'ACTIF',
    quota_mensuel: 5000,
    utilise_mois: 1248,
    date_creation: '2025-01-15T08:30:00Z',
  },
  {
    id: 'cli_02',
    nom: 'Kalimba Commerce',
    email: 'contact@kalimba-shop.ci',
    cle_api: 'sk_live_7e12f4901ab88',
    statut: 'ACTIF',
    quota_mensuel: 2000,
    utilise_mois: 1890,
    date_creation: '2025-02-01T10:15:00Z',
  },
  {
    id: 'cli_03',
    nom: 'Yas QuizWin',
    email: 'support@quizwin.mg',
    cle_api: 'sk_live_3c91a021bc44e',
    statut: 'ACTIF',
    quota_mensuel: 10000,
    utilise_mois: 3410,
    date_creation: '2025-02-20T14:45:00Z',
  },
  {
    id: 'cli_04',
    nom: 'TechLab SARL',
    email: 'dev@techlab.mg',
    cle_api: 'sk_live_1d48c902ff112',
    statut: 'ACTIF',
    quota_mensuel: 1000,
    utilise_mois: 120,
    date_creation: '2025-03-10T11:00:00Z',
  },
]

export default function PageClientsAdmin() {
  const [clients, setClients] = useState<ClientB2B[]>(CLIENTS_PAR_DEFAUT)
  const [chargement, setChargement] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [modalClient, setModalClient] = useState(false)
  const [nouveauNom, setNouveauNom] = useState('')
  const [nouvelEmail, setNouveauEmail] = useState('')
  const [nouveauQuota, setNouveauQuota] = useState('2000')

  useEffect(() => {
    fetch('/api/facturation')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.lignes) && d.lignes.length > 0) {
          const mapped = d.lignes.map((l: any, index: number) => ({
            id: l.id_application || `cli_${index}`,
            nom: l.nom || 'Client B2B',
            email: `contact@${(l.nom || 'client').toLowerCase().replace(/\s+/g, '')}.com`,
            cle_api: `sk_live_${Math.random().toString(36).substring(2, 10)}`,
            statut: 'ACTIF' as const,
            quota_mensuel: l.quota_mensuel || 2000,
            utilise_mois: l.sms_envoyes || 0,
            date_creation: new Date().toISOString(),
          }))
          setClients(mapped)
        }
      })
      .catch(() => null)
      .finally(() => setChargement(false))
  }, [])

  function ajouterClient() {
    if (!nouveauNom.trim() || !nouvelEmail.trim()) return
    const nouveau: ClientB2B = {
      id: `cli_${Date.now()}`,
      nom: nouveauNom.trim(),
      email: nouvelEmail.trim(),
      cle_api: `sk_live_${Math.random().toString(36).substring(2, 12)}`,
      statut: 'ACTIF',
      quota_mensuel: parseInt(nouveauQuota) || 2000,
      utilise_mois: 0,
      date_creation: new Date().toISOString(),
    }
    setClients([nouveau, ...clients])
    setNouveauNom('')
    setNouveauEmail('')
    setModalClient(false)
  }

  const clientsFiltres = clients.filter(
    (c) =>
      c.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      c.email.toLowerCase().includes(recherche.toLowerCase())
  )

  const totalClients = clients.length
  const totalVolume = clients.reduce((acc, c) => acc + c.utilise_mois, 0)
  const clientsDepasses = clients.filter((c) => c.utilise_mois >= c.quota_mensuel).length

  if (chargement) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <CoquilleTableauDeBord>
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Clients B2B</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Gérez les comptes clients, leurs clés API et leurs quotas d'envoi.
          </p>
        </div>
        <button
          onClick={() => setModalClient(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" /> Nouveau client B2B
        </button>
      </div>

      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{totalClients}</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">Clients enregistrés</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{totalVolume.toLocaleString('fr-FR')}</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">Volume SMS consommé ce mois</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{clientsDepasses}</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">Alerte quota proche/dépassé</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 dark:border-zinc-800/80 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Liste des comptes clients</h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500">{clientsFiltres.length} client(s) affiché(s)</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher nom ou email..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                className="w-64 rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-left font-semibold uppercase tracking-wider text-slate-400 dark:border-zinc-800 dark:bg-zinc-800/30">
                <th className="px-6 py-3">CLIENT</th>
                <th className="px-6 py-3">CLÉ API ASSIGNÉE</th>
                <th className="px-6 py-3">CONSOMMATION DU MOIS</th>
                <th className="px-6 py-3">STATUT</th>
                <th className="px-6 py-3">CRÉÉ LE</th>
                <th className="px-6 py-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {clientsFiltres.map((c) => {
                const pct = Math.min(100, Math.round((c.utilise_mois / c.quota_mensuel) * 100))
                const couleurBarre = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-blue-600'
                return (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 font-bold">
                          {c.nom.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-zinc-200">{c.nom}</p>
                          <p className="text-[11px] text-slate-400">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600 dark:text-zinc-300">
                      <span className="rounded bg-slate-100 px-2 py-1 dark:bg-zinc-800 font-bold">
                        {c.cle_api.substring(0, 12)}...
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-700 dark:text-zinc-300">{c.utilise_mois} / {c.quota_mensuel} SMS</span>
                          <span className="text-slate-400">{pct}%</span>
                        </div>
                        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                          <div className={`h-full rounded-full ${couleurBarre}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Actif
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(c.date_creation).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal d'ajout de client */}
      {modalClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Créer un nouveau client B2B</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Nom du client / Entreprise</label>
              <input
                type="text"
                value={nouveauNom}
                onChange={(e) => setNouveauNom(e.target.value)}
                placeholder="ex: Kalimba Commerce"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Adresse E-mail</label>
              <input
                type="email"
                value={nouvelEmail}
                onChange={(e) => setNouveauEmail(e.target.value)}
                placeholder="contact@entreprise.com"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Quota mensuel de SMS</label>
              <input
                type="number"
                value={nouveauQuota}
                onChange={(e) => setNouveauQuota(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setModalClient(false)} className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 dark:border-zinc-700 dark:text-zinc-300">
                Annuler
              </button>
              <button onClick={ajouterClient} className="flex-1 rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700">
                Créer le compte
              </button>
            </div>
          </div>
        </div>
      )}
    </CoquilleTableauDeBord>
  )
}
