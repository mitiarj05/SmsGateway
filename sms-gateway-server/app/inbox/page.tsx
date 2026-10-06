'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  MessageSquare, Search, Download, RefreshCw, Loader2, Clock, Check, Smartphone
} from 'lucide-react'
import CoquilleTableauDeBord from '../../composants/CoquilleTableauDeBord'

interface Entrant {
  id: string
  initiales: string
  expediteur: string
  heure: string
  contenu: string
  passerelle: string
  transmis: boolean
}

const COULEURS_AVATAR = [
  'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
  'bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400',
  'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400',
  'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  'bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300',
]

function couleurAvatar(expediteur: string): string {
  let h = 0
  for (let i = 0; i < expediteur.length; i++) h = (h * 31 + expediteur.charCodeAt(i)) >>> 0
  return COULEURS_AVATAR[h % COULEURS_AVATAR.length]
}

export default function PageBoiteReception() {
  const [messages, setMessages] = useState<Entrant[]>([])
  const [chargement, setChargement] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [onglet, setOnglet] = useState<'tous' | 'transmis' | 'verifier'>('tous')
  const [relanceEnCours, setRelanceEnCours] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const charger = useCallback(async () => {
    try {
      const res = await fetch('/api/inbox?limit=100')
      const data = await res.json().catch(() => ({}))
      const liste: any[] = Array.isArray(data.entrants) ? data.entrants : []
      setMessages(
        liste.map((e: any) => {
          const expediteur = typeof e.expediteur === 'string' && e.expediteur ? e.expediteur : '—'
          return {
            id: e.id,
            initiales: (expediteur.replace(/\D/g, '').slice(-2) || expediteur.slice(0, 2).toUpperCase() || '??'),
            expediteur,
            heure: e.date_reception
              ? new Date(e.date_reception).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
              : '—',
            contenu: typeof e.contenu === 'string' ? e.contenu : '',
            passerelle: e.appareils?.nom ?? '—',
            transmis: e.statut_notification === 'ENVOYE',
          }
        })
      )
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    charger()
    const i = setInterval(() => charger(), 10000)
    return () => clearInterval(i)
  }, [charger])

  async function relancer(id: string) {
    setRelanceEnCours(id)
    setInfo(null)
    try {
      const res = await fetch(`/api/inbox/${id}/relancer`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      setInfo(data.message ?? data.error ?? 'Relance effectuée.')
      await charger()
    } catch {
      setInfo('Relance impossible. Réessayez.')
    } finally {
      setRelanceEnCours(null)
    }
  }

  const visibles = messages.filter((m) => {
    const correspondOnglet =
      onglet === 'tous' ||
      (onglet === 'transmis' && m.transmis) ||
      (onglet === 'verifier' && !m.transmis)
    const q = recherche.trim().toLowerCase()
    return correspondOnglet && (q === '' || m.expediteur.toLowerCase().includes(q) || m.contenu.toLowerCase().includes(q))
  })

  const nbTransmis = messages.filter((m) => m.transmis).length
  const nbAVerifier = messages.length - nbTransmis

  function exporter() {
    const lignes = visibles.map((m) => [m.expediteur, `"${m.contenu.replace(/"/g, '""')}"`, m.passerelle, m.transmis ? 'transmis' : 'a_verifier', m.heure].join(';'))
    const blob = new Blob([['expediteur;message;passerelle;statut;heure', ...lignes].join('\n'), '\n'], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sms-recus.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <CoquilleTableauDeBord>
      {/* En-tête (Exact Screenshot 1) */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white">
            SMS reçus
          </h1>
          <p className="mt-1 text-[13.5px] text-slate-500 dark:text-zinc-400">
            Les réponses reçues par vos passerelles, avec leur statut de transmission.
          </p>
        </div>
        <button
          onClick={exporter}
          className="inline-flex items-center gap-2 rounded-full bg-[#5b5bd6] px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-indigo-300/45 hover:bg-[#4c4cc9] transition"
        >
          <Download className="h-4 w-4" /> Exporter
        </button>
      </div>

      {info && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-medium text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
          {info}
        </div>
      )}

      {/* Statistiques 3 Cartes (Exact Screenshot 1) */}
      <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card grid grid-cols-3 divide-x divide-slate-100 px-6 py-5 dark:bg-zinc-900 dark:border-zinc-800 dark:divide-zinc-800">
        <div className="pr-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Messages reçus
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[28px] font-extrabold text-slate-900 dark:text-white">{chargement ? '…' : messages.length}</span>
          </div>
          <p className="text-[11.5px] text-slate-400">SMS entrants en base</p>
        </div>
        <div className="px-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Transmis au webhook
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[28px] font-extrabold text-slate-900 dark:text-white">{chargement ? '…' : nbTransmis}</span>
          </div>
          <p className="text-[11.5px] text-slate-400">Notifications remises</p>
        </div>
        <div className="pl-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            À vérifier
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[28px] font-extrabold text-amber-600 dark:text-amber-400">{chargement ? '…' : nbAVerifier}</span>
          </div>
          <p className="text-[11.5px] text-slate-400">En attente ou en échec</p>
        </div>
      </div>

      {/* Onglets & Recherche (Exact Screenshot 1) */}
      <div className="mb-4 mt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOnglet('tous')}
            className={`rounded-full px-4 py-1.5 text-[12px] font-bold transition ${onglet === 'tous' ? 'bg-[#5b5bd6] text-white shadow-sm' : 'text-slate-500 hover:bg-white dark:text-zinc-400'}`}
          >
            Tous · {messages.length}
          </button>
          <button
            onClick={() => setOnglet('transmis')}
            className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition ${onglet === 'transmis' ? 'bg-[#5b5bd6] text-white shadow-sm' : 'text-slate-500 hover:bg-white dark:text-zinc-400'}`}
          >
            Transmis
          </button>
          <button
            onClick={() => setOnglet('verifier')}
            className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition ${onglet === 'verifier' ? 'bg-[#5b5bd6] text-white shadow-sm' : 'text-slate-500 hover:bg-white dark:text-zinc-400'}`}
          >
            À vérifier · {nbAVerifier}
          </button>
        </div>
        <div className="flex w-64 items-center gap-2 rounded-full bg-white px-4 py-2 text-[12.5px] text-slate-400 shadow-card border border-slate-100 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400">
          <Search className="h-4 w-4" />
          <input
            type="text"
            placeholder="Numéro ou contenu"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="flex-1 bg-transparent focus:outline-none dark:text-zinc-200 text-xs"
          />
        </div>
      </div>

      {/* Liste des messages (Exact Screenshot 1) */}
      <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
        <div className="divide-y divide-slate-100 dark:divide-zinc-800">
          {chargement && (
            <p className="flex items-center justify-center gap-2 px-6 py-12 text-xs text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
            </p>
          )}
          {!chargement && visibles.length === 0 && (
            <p className="px-6 py-12 text-center text-xs text-slate-400 dark:text-zinc-500">
              Aucun message reçu pour le moment.
            </p>
          )}
          {visibles.map((m) => (
            <div key={m.id} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${couleurAvatar(m.expediteur)}`}
              >
                {m.initiales}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-bold text-slate-800 dark:text-zinc-200">
                  {m.expediteur}
                  <span className="ml-2 text-[11px] font-medium text-slate-400">
                    {m.heure}
                  </span>
                </p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-slate-600 dark:text-zinc-300">
                  {m.contenu}
                </p>
                <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Smartphone className="h-3.5 w-3.5" />
                  Reçu sur {m.passerelle}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                {m.transmis ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10.5px] font-bold text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300">
                    <Check className="h-3 w-3 stroke-[3]" /> Webhook transmis
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10.5px] font-bold text-amber-600 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300">
                    À vérifier
                  </span>
                )}
                {!m.transmis && (
                  <button
                    onClick={() => relancer(m.id)}
                    disabled={relanceEnCours === m.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[11px] font-semibold text-slate-500 shadow-2xs hover:border-slate-300 hover:text-slate-800 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {relanceEnCours === m.id
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <RefreshCw className="h-3 w-3" />}
                    Nouvelle tentative
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-3 text-[11px] text-slate-400 dark:border-zinc-800 dark:bg-zinc-800/40">
          <span>{visibles.length} message{visibles.length > 1 ? 's' : ''} · Tous les résultats sont affichés</span>
          <span>Transmission au webhook : {nbTransmis}/{messages.length}</span>
        </div>
      </div>
    </CoquilleTableauDeBord>
  )
}
