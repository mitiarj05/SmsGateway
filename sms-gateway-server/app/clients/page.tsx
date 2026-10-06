'use client'

import { useState, useEffect } from 'react'
import {
  Users, Plus, Search, Loader2, Calendar, ArrowUpRight
} from 'lucide-react'
import CoquilleTableauDeBord from '../../composants/CoquilleTableauDeBord'

interface ClientB2B {
  id: string
  initiales: string
  nom: string
  creeLe: string
  quota_mensuel: number | null
  utilise_mois: number
  depassement: boolean
}

const COULEURS_AVATAR = [
  'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
  'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
  'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
  'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
  'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
  'bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300',
]

function couleurAvatar(nom: string): string {
  let h = 0
  for (let i = 0; i < nom.length; i++) h = (h * 31 + nom.charCodeAt(i)) >>> 0
  return COULEURS_AVATAR[h % COULEURS_AVATAR.length]
}

function moisCourant(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function joursAvantPremierDuMois(): number {
  const maintenant = new Date()
  const premier = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 1)
  return Math.max(0, Math.ceil((premier.getTime() - maintenant.getTime()) / 86400000))
}

export default function PageClientsAdmin() {
  const [clients, setClients] = useState<ClientB2B[]>([])
  const [chargement, setChargement] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [modalClient, setModalClient] = useState(false)
  const [nouveauNom, setNouveauNom] = useState('')
  const [nouveauQuota, setNouveauQuota] = useState('100')
  const [invitationEnCours, setInvitationEnCours] = useState(false)
  const [cleCreee, setCleCreee] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  async function charger() {
    try {
      const [resClients, resFact] = await Promise.all([
        fetch('/api/api-clients'),
        fetch(`/api/facturation?mois=${moisCourant()}`),
      ])
      const [dClients, dFact] = await Promise.all([
        resClients.json().catch(() => ({})),
        resFact.json().catch(() => ({})),
      ])
      const liste: any[] = Array.isArray(dClients.clients) ? dClients.clients : []
      const conso = new Map<string, any>(
        (Array.isArray(dFact.lignes) ? dFact.lignes : []).map((l: any) => [l.id_application, l])
      )
      setClients(
        liste.map((c: any) => {
          const ligne = conso.get(c.id)
          return {
            id: c.id,
            initiales: (c.nom || '?').substring(0, 2).toUpperCase(),
            nom: c.nom,
            creeLe: c.created_at,
            quota_mensuel: c.quota_mensuel ?? null,
            utilise_mois: ligne?.sms_envoyes ?? 0,
            depassement: ligne?.depassement ?? false,
          }
        })
      )
      setErreur(null)
    } catch {
      setErreur('Chargement impossible. Réessayez.')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    charger()
  }, [])

  async function ajouterClient() {
    if (!nouveauNom.trim()) return
    setInvitationEnCours(true)
    setCleCreee(null)
    try {
      const res = await fetch('/api/api-clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: nouveauNom.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.client) {
        setErreur(data.error ?? 'Invitation impossible')
        return
      }
      const quota = Number(nouveauQuota)
      if (Number.isInteger(quota) && quota >= 1) {
        await fetch(`/api/api-clients/${data.client.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quota_mensuel: quota }),
        })
      }
      setCleCreee(data.client.cle_api ?? null)
      setNouveauNom('')
      await charger()
    } catch {
      setErreur('Erreur réseau')
    } finally {
      setInvitationEnCours(false)
    }
  }

  async function revoquerClient(id: string, nom: string) {
    if (!window.confirm(`Révoquer l'accès de « ${nom} » ?`)) return
    try {
      const res = await fetch(`/api/api-clients/${id}`, { method: 'DELETE' })
      if (res.ok) await charger()
      else setErreur('Révocation impossible')
    } catch {
      setErreur('Erreur réseau')
    }
  }

  const clientsFiltres = clients.filter((c) =>
    c.nom.toLowerCase().includes(recherche.toLowerCase())
  )
  const totalSmsMois = clients.reduce((s, c) => s + c.utilise_mois, 0)
  const quotasDefinies = clients.filter((c) => c.quota_mensuel !== null) as (ClientB2B & { quota_mensuel: number })[]
  const totalQuota = quotasDefinies.reduce((s, c) => s + c.quota_mensuel, 0)
  const pctGlobal = totalQuota > 0 ? Math.round((totalSmsMois / totalQuota) * 100) : null
  const joursRestants = joursAvantPremierDuMois()

  if (chargement) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <CoquilleTableauDeBord>
      {/* En-tête (Exact Screenshot) */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white">
            Clients
          </h1>
          <p className="mt-1 text-[13.5px] text-slate-500 dark:text-zinc-400">
            Les organisations qui utilisent votre infrastructure SMS.
          </p>
        </div>
        <button
          onClick={() => { setModalClient(true); setCleCreee(null) }}
          className="inline-flex items-center gap-2 rounded-full bg-[#5b5bd6] px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-indigo-300/45 hover:bg-[#4c4cc9] transition"
        >
          <Users className="h-4 w-4" /> Inviter un client
        </button>
      </div>

      {erreur && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {erreur}
        </div>
      )}

      {/* Top 3 Metric Cards (Exact Screenshot) */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card px-6 py-5 dark:bg-zinc-900 dark:border-zinc-800">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Espaces actifs
          </p>
          <p className="mt-1.5 text-[32px] font-extrabold text-slate-900 dark:text-white">{clients.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card px-6 py-5 dark:bg-zinc-900 dark:border-zinc-800">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            SMS ce mois-ci
          </p>
          <p className="mt-1.5 text-[32px] font-extrabold text-slate-900 dark:text-white">{totalSmsMois.toLocaleString('fr-FR')}</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card px-6 py-5 dark:bg-zinc-900 dark:border-zinc-800">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Du quota global
          </p>
          <p className="mt-1.5 text-[32px] font-extrabold text-slate-900 dark:text-white">
            {pctGlobal === null ? '—' : `${pctGlobal} %`}
          </p>
        </div>
      </div>

      {/* Main Grid 2 Colonnes (Exact Screenshot) */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">

        {/* Left Column (2 cols) : Organisations */}
        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">
                Organisations
              </h2>
              <p className="mt-0.5 text-[12px] text-slate-400">
                {clients.length} client{clients.length > 1 ? 's' : ''} enregistré{clients.length > 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex w-52 items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-[12.5px] text-slate-400 dark:bg-zinc-800 dark:border-zinc-700">
              <Search className="h-4 w-4" />
              <input
                type="text"
                placeholder="Rechercher"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                className="flex-1 bg-transparent focus:outline-none dark:text-zinc-200 text-xs"
              />
            </div>
          </div>

          <div className="mt-5 space-y-6">
            {clientsFiltres.length === 0 && (
              <p className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
                Aucun client pour le moment — invitez votre première organisation.
              </p>
            )}
            {clientsFiltres.map((c) => {
              const pct = c.quota_mensuel && c.quota_mensuel > 0
                ? Math.min(100, Math.round((c.utilise_mois / c.quota_mensuel) * 100))
                : 0
              return (
              <div key={c.id} className="border-t border-slate-100 pt-5 first:border-0 first:pt-0 dark:border-zinc-800">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-[13px] font-extrabold ${couleurAvatar(c.nom)}`}
                  >
                    {c.initiales}
                  </div>
                  <div className="flex-1">
                    <p className="text-[14.5px] font-bold text-slate-900 dark:text-white">
                      {c.nom}
                    </p>
                    <p className="text-[11.5px] text-slate-400">
                      Client depuis le {c.creeLe ? new Date(c.creeLe).toLocaleDateString('fr-FR') : '—'}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[10.5px] font-bold ${c.depassement ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'}`}
                  >
                    {c.depassement ? 'Quota dépassé' : 'Actif'}
                  </span>
                  <button onClick={() => revoquerClient(c.id, c.nom)} title="Révoquer l'accès"
                    className="rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10">
                    Révoquer
                  </button>
                </div>

                <div className="mt-3 pl-[54px]">
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="text-slate-400">SMS ce mois-ci</span>
                    <span className="font-bold text-slate-800 dark:text-zinc-200">
                      {c.utilise_mois.toLocaleString('fr-FR')} / {c.quota_mensuel === null ? '∞' : c.quota_mensuel.toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100 dark:bg-zinc-800">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-[#7c7ce0] to-[#a855f7]"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        </div>

        {/* Right Column (1 col) : 2 Cards (Exact Screenshot) */}
        <div className="space-y-4">
          <div className="rounded-[1.5rem] bg-gradient-to-br from-[#332c75] to-[#1f1a52] p-6 text-white shadow-card space-y-3">
            <div className="flex items-center gap-2.5 text-white/60">
              <Calendar className="h-4 w-4" />
              <p className="text-[10px] font-bold uppercase tracking-[0.15em]">
                Prochain renouvellement
              </p>
            </div>
            <p className="text-[40px] font-extrabold leading-none">
              {joursRestants} <span className="text-[16px] font-bold text-white/60">jours</span>
            </p>
            <p className="text-[11.5px] leading-relaxed text-white/55">
              Les quotas mensuels sont remis à zéro le 1er du mois.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-2">
            <p className="text-[14px] font-bold text-slate-900 dark:text-white">
              Un espace par organisation.
            </p>
            <p className="text-[11.5px] leading-relaxed text-slate-400">
              Invitez vos clients et gardez leurs accès et leur consommation à portée de main.
            </p>
            <a
              href="/espace/api"
              className="inline-flex items-center gap-1 text-[12px] font-bold text-[#5b5bd6] hover:underline dark:text-blue-400 pt-1"
            >
              Consulter le guide API <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

      </div>

      {/* Modal d'invitation de client */}
      {modalClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Inviter un nouveau client B2B</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Nom de l'organisation</label>
              <input
                type="text"
                value={nouveauNom}
                onChange={(e) => setNouveauNom(e.target.value)}
                placeholder="Nom de l'organisation"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Quota mensuel de SMS</label>
              <input
                type="number" min={1}
                value={nouveauQuota}
                onChange={(e) => setNouveauQuota(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            {cleCreee && (
              <div className="rounded-xl bg-amber-50 p-3 ring-1 ring-amber-600/20 dark:bg-amber-500/10">
                <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">Clé créée — copiez-la maintenant (affichée une seule fois) :</p>
                <code className="mt-1 block break-all font-mono text-[11px] text-amber-900 dark:text-amber-200">{cleCreee}</code>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={() => setModalClient(false)} className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 dark:border-zinc-700 dark:text-zinc-300">
                {cleCreee ? 'Fermer' : 'Annuler'}
              </button>
              {!cleCreee && (
                <button onClick={ajouterClient} disabled={invitationEnCours || !nouveauNom.trim()} className="flex-1 rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                  {invitationEnCours ? 'Création…' : "Inviter l'organisation"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </CoquilleTableauDeBord>
  )
}
