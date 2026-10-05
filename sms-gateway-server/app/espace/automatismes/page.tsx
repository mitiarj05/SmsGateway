'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bot, Trash2, Plus, Ban, Loader2 } from 'lucide-react'
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
      <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <CoquilleEspace>
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Automatismes</h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
          Configurez vos règles de réponse automatique par mot-clé et consultez vos désabonnements.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Mes réponses automatiques */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <Bot className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Mes réponses automatiques</h2>
          </div>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mb-4">
            Lorsqu'un message entrant commence par un mot-clé actif, une réponse est automatiquement déclenchée.
          </p>

          <form onSubmit={creerRegle} className="mb-6 space-y-3">
            <input
              type="text"
              required
              placeholder="Mot-clé (ex. INFO)"
              value={motCle}
              onChange={(e) => setMotCle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 font-mono text-xs uppercase focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <textarea
              required
              rows={2}
              placeholder="Réponse envoyée automatiquement..."
              value={reponseRegle}
              onChange={(e) => setReponseRegle(e.target.value)}
              className="w-full resize-none rounded-xl border border-slate-200 p-3 text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <button
              type="submit"
              disabled={creationEnCours}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 transition"
            >
              <Plus className="h-4 w-4" /> {creationEnCours ? 'Création...' : 'Ajouter la règle'}
            </button>
          </form>

          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {regles.map((r) => {
              const mienne = r.id_application !== null
              return (
                <div key={r.id} className="flex items-center gap-3 py-3">
                  {mienne ? (
                    <button
                      onClick={() => basculerRegle(r.id, r.actif)}
                      className={`relative h-5 w-9 shrink-0 rounded-full transition ${r.actif ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-zinc-700'}`}
                    >
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${r.actif ? 'left-[18px]' : 'left-0.5'}`} />
                    </button>
                  ) : (
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">SYSTÈME</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs font-bold text-slate-800 dark:text-zinc-200">{r.mot_cle}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-zinc-400" title={r.reponse}>{r.reponse}</p>
                  </div>
                  {mienne && (
                    <button
                      onClick={() => supprimerRegle(r.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )
            })}
            {regles.length === 0 && <p className="py-6 text-center text-xs text-slate-400 dark:text-zinc-500">Aucune règle définie.</p>}
          </div>
        </div>

        {/* Numéros désinscrits */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <Ban className="h-4 w-4 text-slate-500 dark:text-zinc-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Numéros désinscrits (STOP)</h2>
          </div>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mb-4">
            Ces numéros ne reçoivent plus vos SMS. Le mot-clé START les réinscrit automatiquement.
          </p>

          {blocages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Ban className="h-8 w-8 text-slate-300 dark:text-zinc-600" />
              <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-zinc-300">Aucun numéro bloqué</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-zinc-800 max-h-96 overflow-y-auto">
              {blocages.map((b) => (
                <div key={b.id} className="flex items-center justify-between py-3">
                  <span className="font-mono text-xs font-bold text-slate-800 dark:text-zinc-200">{b.numero_destinataire}</span>
                  <span className="text-[11px] text-slate-400">{b.motif} · {new Date(b.date_creation).toLocaleDateString('fr-FR')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Toast notification={notification} />
    </CoquilleEspace>
  )
}
