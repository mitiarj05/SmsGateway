'use client'

import { useState, useEffect } from 'react'
import { Inbox, Search, Send, Activity, X, Clock, RefreshCw } from 'lucide-react'
import CoquilleTableauDeBord from '../../composants/CoquilleTableauDeBord'
import { Appareil, Tache, STATUTS_TACHES, BadgeStatut, tempsEcoule, Toast } from '../../composants/interface'

export default function PageFileAttente() {
  const [appareils, setAppareils] = useState<Appareil[]>([])
  const [taches, setTaches] = useState<Tache[]>([])
  const [derniereActualisation, setDerniereActualisation] = useState<Date>(new Date())
  const [actualisationEnCours, setActualisationEnCours] = useState(false)
  const [chargement, setChargement] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [filtre, setFiltre] = useState<string>('ALL')

  const [modaleOuverte, setModaleOuverte] = useState(false)
  const [numeroTest, setNumeroTest] = useState('')
  const [messageTest, setMessageTest] = useState('')
  const [cleApiTest, setCleApiTest] = useState('')
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [notification, setNotification] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  function afficherNotification(type: 'succes' | 'erreur', texte: string) {
    setNotification({ type, texte })
    setTimeout(() => setNotification(null), 4000)
  }

  const chargerDonnees = async (silencieux = false) => {
    if (!silencieux) setActualisationEnCours(true)
    try {
      const [reponseAppareils, reponseTaches] = await Promise.all([
        fetch('/api/devices'),
        fetch('/api/tasks'),
      ])
      const donneesAppareils = await reponseAppareils.json()
      const donneesTaches = await reponseTaches.json()
      if (donneesAppareils.devices) setAppareils(donneesAppareils.devices)
      if (donneesTaches.tasks) setTaches((donneesTaches.tasks as Tache[]).filter((t) => ['EN_ATTENTE', 'RECLAME', 'PROGRAMME'].includes(t.statut)))
      setDerniereActualisation(new Date())
    } finally {
      setChargement(false)
      setActualisationEnCours(false)
    }
  }

  useEffect(() => {
    const savedKey = localStorage.getItem('smsika-cle-api')
    if (savedKey) setCleApiTest(savedKey)
    chargerDonnees(true)
    const interval = setInterval(() => chargerDonnees(true), 5000)
    return () => clearInterval(interval)
  }, [])

  async function envoyerSmsTest(e: React.FormEvent) {
    e.preventDefault()
    setEnvoiEnCours(true)
    try {
      const reponse = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: numeroTest, message: messageTest, cle_api: cleApiTest.trim() }),
      })
      const donnees = await reponse.json().catch(() => null)
      if (reponse.ok) {
        setModaleOuverte(false)
        setMessageTest('')
        chargerDonnees(true)
      } else {
        afficherNotification('erreur', donnees?.error ?? 'Erreur lors de l’envoi')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    } finally {
      setEnvoiEnCours(false)
    }
  }

  const tachesFiltrees = taches
    .filter((t) => {
      const correspondFiltre = filtre === 'ALL' || t.statut === filtre
      const correspondRecherche =
        t.numero_destinataire.includes(recherche) || t.message.toLowerCase().includes(recherche.toLowerCase())
      return correspondFiltre && correspondRecherche
    })
    // Tri par ancienneté (plus anciennes d'abord = prioritaires)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  async function annulerTache(id: string) {
    if (!confirm('Annuler cette tâche ?')) return
    try {
      const reponse = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      const donnees = await reponse.json()
      if (reponse.ok) {
        afficherNotification('succes', 'Tâche annulée')
        chargerDonnees(true)
      } else {
        afficherNotification('erreur', donnees.error ?? 'Impossible d’annuler')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    }
  }

  async function assignerTache(id: string, appareilId: string) {
    try {
      const reponse = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: appareilId || null }),
      })
      const donnees = await reponse.json()
      if (reponse.ok) {
        afficherNotification('succes', 'Assignation mise à jour')
        chargerDonnees(true)
      } else {
        afficherNotification('erreur', donnees.error ?? 'Erreur assignation')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    }
  }

  if (chargement) {
    return <div className="flex h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-950"><p className="text-sm text-zinc-500">Chargement…</p></div>
  }

  return (
    <CoquilleTableauDeBord
      titre="File d'attente"
      sousTitre={`${tachesFiltrees.length} tâche(s) · actualisé à ${derniereActualisation.toLocaleTimeString('fr-FR')}`}
      actions={
        <>
          <button onClick={() => chargerDonnees()}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-600 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
            <RefreshCw className={`h-4 w-4 ${actualisationEnCours ? 'animate-spin' : ''}`} /> Actualiser
          </button>
          <button onClick={() => setModaleOuverte(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
            <Send className="h-4 w-4" /> Nouveau SMS
          </button>
        </>
      }
    >
      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
        <div className="flex flex-col gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">File d'attente</h2>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {tachesFiltrees.length}
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input type="text" placeholder="Rechercher…" value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="w-48 rounded-lg border border-zinc-200 bg-white py-1.5 pl-9 pr-3 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            />
          </div>
          <div className="flex gap-1">
            {['ALL', 'EN_ATTENTE', 'RECLAME', 'PROGRAMME'].map((f) => (
              <button key={f} onClick={() => setFiltre(f)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  filtre === f
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                    : 'text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                }`}>
                {f === 'ALL' ? 'Tous' : STATUTS_TACHES[f]?.label ?? f}
              </button>
            ))}
          </div>
        </div>

        {tachesFiltrees.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Inbox className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">File vide</p>
            <p className="text-xs text-zinc-400">Les nouvelles demandes apparaîtront ici.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800">
                  <th className="px-5 py-3">Destinataire</th>
                  <th className="px-5 py-3">Message</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3">Assigner à</th>
                  <th className="px-5 py-3">Ancienneté</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
                {tachesFiltrees.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                    <td className="px-5 py-3.5"><span className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">{t.numero_destinataire}</span></td>
                    <td className="max-w-xs px-5 py-3.5"><p className="truncate text-xs text-zinc-500 dark:text-zinc-400" title={t.message}>{t.message}</p></td>
                    <td className="px-5 py-3.5"><BadgeStatut statut={t.statut} config={STATUTS_TACHES} /></td>
                    <td className="px-5 py-3.5">
                      <select
                        value={t.device_id ?? ''}
                        onChange={(e) => assignerTache(t.id, e.target.value)}
                        className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                      >
                        <option value="">Auto</option>
                        {appareils.map((d) => (
                          <option key={d.id} value={d.id}>{d.nom}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-400">
                      {t.statut === 'PROGRAMME' && t.scheduled_at ? (
                        <span className="flex items-center gap-1" title={`Programmé pour le ${new Date(t.scheduled_at).toLocaleString('fr-FR')}`}>
                          <Clock className="h-3 w-3" />{new Date(t.scheduled_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{tempsEcoule(t.created_at)}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => annulerTache(t.id)}
                        title="Annuler la tâche"
                        className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-red-500/10">
                        <X className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modaleOuverte && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-sm" onClick={() => !envoiEnCours && setModaleOuverte(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 dark:ring-1 dark:ring-zinc-800" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Envoyer un SMS</h3>
            <form onSubmit={envoyerSmsTest} className="mt-4 space-y-4">
              <input type="tel" required placeholder="+261328725411" value={numeroTest}
                onChange={(e) => setNumeroTest(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
              <textarea required rows={3} maxLength={160} value={messageTest}
                onChange={(e) => setMessageTest(e.target.value)}
                className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
              <input type="password" required value={cleApiTest}
                onChange={(e) => setCleApiTest(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
              <div className="flex gap-2">
                <button type="button" onClick={() => !envoiEnCours && setModaleOuverte(false)}
                  className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm dark:border-zinc-700 dark:text-zinc-300">Annuler</button>
                <button type="submit" disabled={envoiEnCours}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white disabled:opacity-60">
                  <Send className="h-4 w-4" /> {envoiEnCours ? 'Envoi…' : 'Envoyer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Toast notification={notification} />
    </CoquilleTableauDeBord>
  )
}
