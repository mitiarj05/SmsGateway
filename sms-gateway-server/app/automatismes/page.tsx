'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bot, Ban, Trash2, Plus, RotateCcw } from 'lucide-react'
import CoquilleTableauDeBord from '../../composants/CoquilleTableauDeBord'
import { Toast } from '../../composants/interface'

interface Regle {
  id: string
  mot_cle: string
  reponse: string
  actif: boolean
  id_application: string | null
  applications: { nom: string } | null
}

interface Blocage {
  id: string
  numero_destinataire: string
  motif: string
  id_application: string | null
  date_creation: string
  applications: { nom: string } | null
}

interface ClientApi {
  id: string
  nom: string
}

export default function PageAutomatismes() {
  const [regles, setRegles] = useState<Regle[]>([])
  const [blocages, setBlocages] = useState<Blocage[]>([])
  const [clients, setClients] = useState<ClientApi[]>([])
  const [chargement, setChargement] = useState(true)
  const [motCle, setMotCle] = useState('')
  const [reponseRegle, setReponseRegle] = useState('')
  const [clientRegle, setClientRegle] = useState('')
  const [creationEnCours, setCreationEnCours] = useState(false)
  const [notification, setNotification] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  function afficherNotification(type: 'succes' | 'erreur', texte: string) {
    setNotification({ type, texte })
    setTimeout(() => setNotification(null), 4000)
  }

  const chargerDonnees = useCallback(async () => {
    try {
      const [reponseRegles, reponseBlocages, reponseClients] = await Promise.all([
        fetch('/api/automatismes'),
        fetch('/api/blocages?limit=100'),
        fetch('/api/api-clients'),
      ])
      const donneesRegles = await reponseRegles.json()
      const donneesBlocages = await reponseBlocages.json()
      const donneesClients = await reponseClients.json()
      if (donneesRegles.regles) setRegles(donneesRegles.regles)
      if (donneesBlocages.blocages) setBlocages(donneesBlocages.blocages)
      if (donneesClients.clients) setClients(donneesClients.clients)
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => { chargerDonnees() }, [chargerDonnees])

  async function creerRegle(e: React.FormEvent) {
    e.preventDefault()
    setCreationEnCours(true)
    try {
      const reponse = await fetch('/api/automatismes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mot_cle: motCle,
          reponse: reponseRegle,
          id_application: clientRegle || null,
        }),
      })
      const donnees = await reponse.json().catch(() => null)
      if (reponse.ok) {
        setMotCle('')
        setReponseRegle('')
        setClientRegle('')
        afficherNotification('succes', 'Règle créée')
        chargerDonnees()
      } else {
        afficherNotification('erreur', donnees?.error ?? 'Erreur création')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    } finally {
      setCreationEnCours(false)
    }
  }

  async function basculerRegle(id: string, actif: boolean) {
    try {
      const reponse = await fetch(`/api/automatismes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actif: !actif }),
      })
      if (reponse.ok) chargerDonnees()
      else afficherNotification('erreur', 'Erreur')
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    }
  }

  async function supprimerRegle(id: string) {
    if (!confirm('Supprimer cette règle ?')) return
    try {
      const reponse = await fetch(`/api/automatismes/${id}`, { method: 'DELETE' })
      if (reponse.ok) chargerDonnees()
      else afficherNotification('erreur', 'Suppression impossible')
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    }
  }

  async function reinscrire(id: string, numero: string) {
    if (!confirm(`Réinscrire ${numero} ? Il recevra de nouveau les SMS.`)) return
    try {
      const reponse = await fetch(`/api/blocages/${id}`, { method: 'DELETE' })
      if (reponse.ok) {
        afficherNotification('succes', `${numero} réinscrit`)
        chargerDonnees()
      } else {
        afficherNotification('erreur', 'Suppression impossible')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    }
  }

  if (chargement) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500">Chargement…</p>
      </div>
    )
  }

  return (
    <CoquilleTableauDeBord
      titre="Automatismes"
      sousTitre={`${regles.length} règle(s) · ${blocages.length} numéro(s) bloqué(s)`}
    >
      <div className="grid max-w-5xl grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Règles mot-clé */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
          <div className="mb-4 flex items-center gap-2">
            <Bot className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Réponses automatiques</h2>
          </div>
          <p className="mb-4 text-xs text-zinc-400">
            Mot-clé en début de message (insensible à la casse) → réponse immédiate.
            Règles client prioritaires sur les globales. STOP / START sont gérés par le système.
          </p>
          <form onSubmit={creerRegle} className="mb-4 space-y-2">
            <div className="flex gap-2">
              <input type="text" required placeholder="Mot-clé (ex. INFO)" value={motCle}
                onChange={(e) => setMotCle(e.target.value)}
                className="w-32 rounded-lg border border-zinc-200 px-3 py-2 font-mono text-sm uppercase dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
              <select value={clientRegle} onChange={(e) => setClientRegle(e.target.value)}
                className="flex-1 rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                <option value="">Tous les clients (global)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            </div>
            <textarea required rows={2} placeholder="Réponse envoyée…" value={reponseRegle}
              onChange={(e) => setReponseRegle(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
            <button type="submit" disabled={creationEnCours}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              <Plus className="h-4 w-4" /> {creationEnCours ? '…' : 'Ajouter'}
            </button>
          </form>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {regles.map((r) => (
              <li key={r.id} className="flex items-center gap-2 py-2.5">
                <button onClick={() => basculerRegle(r.id, r.actif)} title={r.actif ? 'Désactiver' : 'Activer'}
                  className={`relative h-5 w-9 shrink-0 rounded-full transition ${r.actif ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${r.actif ? 'left-[18px]' : 'left-0.5'}`} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    {r.mot_cle} <span className="font-sans font-normal text-zinc-400">→ {r.applications?.nom ?? 'global'}</span>
                  </p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400" title={r.reponse}>{r.reponse}</p>
                </div>
                <button onClick={() => supprimerRegle(r.id)} title="Supprimer"
                  className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:border-zinc-700 dark:text-zinc-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
            {regles.length === 0 && <p className="py-4 text-center text-xs text-zinc-400">Aucune règle.</p>}
          </ul>
        </section>

        {/* Liste de blocage */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
          <div className="mb-4 flex items-center gap-2">
            <Ban className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Numéros désinscrits (STOP)</h2>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{blocages.length}</span>
          </div>
          <p className="mb-4 text-xs text-zinc-400">
            Ces numéros ne reçoivent plus aucun SMS (envois ignorés côté serveur). START les réinscrit automatiquement.
          </p>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {blocages.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <p className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">{b.numero_destinataire}</p>
                  <p className="text-[11px] text-zinc-400">
                    {b.motif} · {b.applications?.nom ?? 'global'} · {new Date(b.date_creation).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <button onClick={() => reinscrire(b.id, b.numero_destinataire)} title="Réinscrire"
                  className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1.5 text-xs text-zinc-500 hover:bg-emerald-50 hover:text-emerald-600 dark:border-zinc-700 dark:text-zinc-400">
                  <RotateCcw className="h-3.5 w-3.5" /> Réinscrire
                </button>
              </li>
            ))}
            {blocages.length === 0 && <p className="py-4 text-center text-xs text-zinc-400">Aucun numéro bloqué.</p>}
          </ul>
        </section>
      </div>

      <Toast notification={notification} />
    </CoquilleTableauDeBord>
  )
}
