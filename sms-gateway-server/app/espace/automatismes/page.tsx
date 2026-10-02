'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bot, Trash2, Plus, Ban } from 'lucide-react'
import CoquilleEspace from '../../../composants/CoquilleEspace'
import { Toast } from '../../../composants/interface'

interface Regle {
  id: string
  mot_cle: string
  reponse: string
  actif: boolean
  id_application: string | null
}

export default function PageAutomatismesEspace() {
  const [regles, setRegles] = useState<Regle[]>([])
  const [blocages, setBlocages] = useState<{ id: string; numero_destinataire: string; motif: string; date_creation: string }[]>([])
  const [chargement, setChargement] = useState(true)
  const [motCle, setMotCle] = useState('')
  const [reponseRegle, setReponseRegle] = useState('')
  const [creationEnCours, setCreationEnCours] = useState(false)
  const [notification, setNotification] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  function afficherNotification(type: 'succes' | 'erreur', texte: string) {
    setNotification({ type, texte })
    setTimeout(() => setNotification(null), 4000)
  }

  const chargerDonnees = useCallback(async () => {
    try {
      const [reponseRegles, reponseBlocages] = await Promise.all([
        fetch('/api/espace/automatismes'),
        fetch('/api/espace/blocages'),
      ])
      const donneesRegles = await reponseRegles.json()
      const donneesBlocages = await reponseBlocages.json()
      if (donneesRegles.regles) setRegles(donneesRegles.regles)
      if (donneesBlocages.blocages) setBlocages(donneesBlocages.blocages)
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => { chargerDonnees() }, [chargerDonnees])

  async function creerRegle(e: React.FormEvent) {
    e.preventDefault()
    setCreationEnCours(true)
    try {
      const reponse = await fetch('/api/espace/automatismes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mot_cle: motCle, reponse: reponseRegle }),
      })
      const donnees = await reponse.json().catch(() => null)
      if (reponse.ok) {
        setMotCle('')
        setReponseRegle('')
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
      const reponse = await fetch(`/api/espace/automatismes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actif: !actif }),
      })
      if (reponse.ok) chargerDonnees()
      else afficherNotification('erreur', 'Règle système : lecture seule')
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    }
  }

  async function supprimerRegle(id: string) {
    if (!confirm('Supprimer cette règle ?')) return
    try {
      const reponse = await fetch(`/api/espace/automatismes/${id}`, { method: 'DELETE' })
      if (reponse.ok) chargerDonnees()
      else afficherNotification('erreur', 'Suppression impossible')
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
    <CoquilleEspace
      titre="Automatismes"
      sousTitre={`${regles.length} règle(s) · STOP / START gérés par le système`}
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
        <div className="mb-4 flex items-center gap-2">
          <Bot className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Mes réponses automatiques</h2>
        </div>
        <form onSubmit={creerRegle} className="mb-4 space-y-2">
          <div className="flex gap-2">
            <input type="text" required placeholder="Mot-clé (ex. INFO)" value={motCle}
              onChange={(e) => setMotCle(e.target.value)}
              className="w-36 rounded-lg border border-zinc-200 px-3 py-2 font-mono text-sm uppercase dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
            <button type="submit" disabled={creationEnCours}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              <Plus className="h-4 w-4" /> {creationEnCours ? '…' : 'Ajouter'}
            </button>
          </div>
          <textarea required rows={2} placeholder="Réponse envoyée…" value={reponseRegle}
            onChange={(e) => setReponseRegle(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
        </form>
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {regles.map((r) => {
            const mienne = r.id_application !== null
            return (
              <li key={r.id} className="flex items-center gap-2 py-2.5">
                {mienne ? (
                  <button onClick={() => basculerRegle(r.id, r.actif)} title={r.actif ? 'Désactiver' : 'Activer'}
                    className={`relative h-5 w-9 shrink-0 rounded-full transition ${r.actif ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${r.actif ? 'left-[18px]' : 'left-0.5'}`} />
                  </button>
                ) : (
                  <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">SYSTÈME</span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200">{r.mot_cle}</p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400" title={r.reponse}>{r.reponse}</p>
                </div>
                {mienne && (
                  <button onClick={() => supprimerRegle(r.id)} title="Supprimer"
                    className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:border-zinc-700 dark:text-zinc-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            )
          })}
          {regles.length === 0 && <p className="py-4 text-center text-xs text-zinc-400">Aucune règle.</p>}
        </ul>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
        <div className="mb-2 flex items-center gap-2">
          <Ban className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Numéros désinscrits vous concernant</h2>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{blocages.length}</span>
        </div>
        <p className="mb-3 text-xs text-zinc-400">
          Ils ne reçoivent plus vos SMS (STOP). Pour réinscrire un numéro, contactez votre administrateur.
        </p>
        {blocages.length === 0 ? (
          <p className="py-2 text-center text-xs text-zinc-400">Aucun numéro bloqué.</p>
        ) : (
          <ul className="max-h-96 divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-800">
            {blocages.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-2">
                <span className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">{b.numero_destinataire}</span>
                <span className="text-[11px] text-zinc-400">{b.motif} · {new Date(b.date_creation).toLocaleDateString('fr-FR')}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      </div>

      <Toast notification={notification} />
    </CoquilleEspace>
  )
}
