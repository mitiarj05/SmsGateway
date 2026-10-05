'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Shield, ChevronDown, Trash2, Power } from 'lucide-react'
import CoquilleTableauDeBord from '../../composants/CoquilleTableauDeBord'

interface Regle {
  id: string
  mot_cle: string
  reponse: string
  actif: boolean
  id_application: string | null
  date_creation: string
  applications?: { nom: string } | null
}

interface Blocage {
  id: string
  numero_destinataire: string
  motif: string | null
  id_application: string | null
  date_creation: string
  applications?: { nom: string } | null
}

interface Client {
  id: string
  nom: string
}

export default function PageAutomatismes() {
  const [motCle, setMotCle] = useState('')
  const [reponse, setReponse] = useState('')
  const [client, setClient] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [regles, setRegles] = useState<Regle[]>([])
  const [blocages, setBlocages] = useState<Blocage[]>([])
  const [chargement, setChargement] = useState(true)
  const [creation, setCreation] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const charger = useCallback(async () => {
    try {
      const [resRegles, resBlocages, resClients] = await Promise.all([
        fetch('/api/automatismes'),
        fetch('/api/blocages?limit=100'),
        fetch('/api/api-clients'),
      ])
      const [dRegles, dBlocages, dClients] = await Promise.all([
        resRegles.json().catch(() => ({})),
        resBlocages.json().catch(() => ({})),
        resClients.json().catch(() => ({})),
      ])
      setRegles(Array.isArray(dRegles.regles) ? dRegles.regles : [])
      setBlocages(Array.isArray(dBlocages.blocages) ? dBlocages.blocages : [])
      setClients(Array.isArray(dClients.clients) ? dClients.clients : [])
      setErreur(null)
    } catch {
      setErreur('Chargement impossible. Réessayez.')
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    charger()
  }, [charger])

  async function creerAutomatisme() {
    if (!motCle.trim() || !reponse.trim()) {
      setErreur('Le mot-clé et la réponse sont obligatoires.')
      return
    }
    setCreation(true)
    setErreur(null)
    try {
      const res = await fetch('/api/automatismes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mot_cle: motCle.trim(),
          reponse: reponse.trim(),
          id_application: client || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErreur(data.error ?? 'Création impossible.')
        return
      }
      setMotCle('')
      setReponse('')
      setClient('')
      await charger()
    } catch {
      setErreur('Création impossible. Réessayez.')
    } finally {
      setCreation(false)
    }
  }

  async function basculerRegle(regle: Regle) {
    try {
      const res = await fetch(`/api/automatismes/${regle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actif: !regle.actif }),
      })
      if (res.ok) await charger()
    } catch { /* silencieux */ }
  }

  async function supprimerRegle(id: string) {
    if (!window.confirm('Supprimer cette règle ?')) return
    try {
      const res = await fetch(`/api/automatismes/${id}`, { method: 'DELETE' })
      if (res.ok) await charger()
    } catch { /* silencieux */ }
  }

  async function reinscrire(id: string) {
    try {
      const res = await fetch(`/api/blocages/${id}`, { method: 'DELETE' })
      if (res.ok) await charger()
    } catch { /* silencieux */ }
  }

  const actives = regles.filter((r) => r.actif).length

  return (
    <CoquilleTableauDeBord>
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Automatismes</h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
          Configurez les réponses automatiques et les exclusions de destinataires.
        </p>
      </div>

      {erreur && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {erreur}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Carte gauche : Nouveau automatisme */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Nouveau automatisme</h2>
            <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">
              Définissez un message automatique à envoyer lorsqu'un mot-clé précis est reçu.
            </p>

            <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); creerAutomatisme() }}>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Client concerné
                </label>
                <div className="relative">
                  <select
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-xs font-medium text-slate-800 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="">Tous les clients (global)</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Mot-clé reçu
                </label>
                <input
                  type="text"
                  placeholder="Ex. INFO, AIDE, HORAIRES"
                  value={motCle}
                  onChange={(e) => setMotCle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <p className="mt-1 text-[11px] text-slate-400 dark:text-zinc-500">
                  La correspondance ignore les majuscules et les espaces.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Réponse automatique
                </label>
                <textarea
                  rows={3}
                  placeholder="Message envoyé automatiquement..."
                  value={reponse}
                  onChange={(e) => setReponse(e.target.value)}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <p className="mt-1 text-[11px] text-slate-400 dark:text-zinc-500">
                  160 caractères maximum pour un SMS simple.
                </p>
              </div>

              {/* Banner variables */}
              <div className="rounded-xl bg-blue-50/60 p-3.5 border border-blue-100 text-xs text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-300 flex items-center gap-2">
                <span className="font-mono font-bold">{`{ }`}</span>
                <p className="text-[11px]">
                  Variables disponibles : <code className="font-mono font-semibold">{`{nom}`}</code>, <code className="font-mono font-semibold">{`{client}`}</code>, <code className="font-mono font-semibold">{`{date}`}</code>. Elles seront remplacées au moment de l'envoi.
                </p>
              </div>
            </form>

            {/* Règles existantes */}
            {regles.length > 0 && (
              <div className="mt-6 space-y-2 border-t border-slate-100 pt-4 dark:border-zinc-800/80">
                {regles.map((regle) => (
                  <div key={regle.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                    <span className={`rounded-md px-2 py-1 font-mono text-[11px] font-bold ${regle.actif ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400'}`}>
                      {regle.mot_cle}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-slate-600 dark:text-zinc-300">{regle.reponse}</p>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                        {regle.applications?.nom ?? 'Tous les clients'}
                      </p>
                    </div>
                    <button onClick={() => basculerRegle(regle)} title={regle.actif ? 'Désactiver' : 'Activer'}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-600 dark:hover:bg-zinc-700">
                      <Power className="h-4 w-4" />
                    </button>
                    <button onClick={() => supprimerRegle(regle.id)} title="Supprimer"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-red-600 dark:hover:bg-zinc-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-zinc-800/80">
            <span className="text-xs text-slate-400 dark:text-zinc-500">
              {chargement ? 'Chargement…' : actives === 0 ? 'Aucune règle active' : `${actives} règle${actives > 1 ? 's' : ''} active${actives > 1 ? 's' : ''}`}
            </span>
            <button
              onClick={creerAutomatisme}
              disabled={creation}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> {creation ? 'Création…' : "Créer l'automatisme"}
            </button>
          </div>
        </div>

        {/* Carte droite : Numéros désactivés (STOP) */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Numéros désactivés (STOP)</h2>
            <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">
              Ces numéros ne recevront plus aucun SMS jusqu'à l'envoi du mot-clé START.
            </p>

            {chargement ? (
              <p className="py-20 text-center text-xs text-slate-400">Chargement…</p>
            ) : blocages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 dark:bg-zinc-800">
                  <Shield className="h-6 w-6" />
                </div>
                <p className="mt-4 text-sm font-bold text-slate-900 dark:text-white">Aucun numéro bloqué</p>
                <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500 max-w-xs">
                  Les destinataires ayant envoyé STOP apparaîtront ici. Un message START les réactivera automatiquement.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-2">
                {blocages.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs font-bold text-slate-800 dark:text-zinc-100">{b.numero_destinataire}</p>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                        {b.motif ?? 'STOP'} · {b.applications?.nom ?? 'Global'} · {new Date(b.date_creation).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <button onClick={() => reinscrire(b.id)} title="Réinscrire"
                      className="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10">
                      Réinscrire
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </CoquilleTableauDeBord>
  )
}
