'use client'

import { useState, useEffect } from 'react'
import { Smartphone, Signal, Send, Bell, Power, X, RefreshCw, Trash2 } from 'lucide-react'
import CoquilleTableauDeBord from '../../composants/CoquilleTableauDeBord'
import { Appareil, STATUTS_APPAREILS, BadgeStatut, tempsEcoule, QUOTA_SMS_PAR_HEURE, DialogueConfirmation, Toast } from '../../composants/interface'

interface DetailsAppareil {
  id: string
  nom: string
  statut: string
  fcm_token: string | null
  fcm_present: boolean
  sms_last_hour: number
  derniere_activite: string | null
  created_at: string
}

export default function AppareilsPage() {
  const [appareils, setAppareils] = useState<Appareil[]>([])
  const [derniereActualisation, setDerniereActualisation] = useState<Date>(new Date())
  const [actualisationEnCours, setActualisationEnCours] = useState(false)
  const [chargement, setChargement] = useState(true)
  const [notification, setNotification] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  const [appareilDetaille, setAppareilDetaille] = useState<DetailsAppareil | null>(null)
  const [pingEnCours, setPingEnCours] = useState<string | null>(null)
  const [cibleSuppression, setCibleSuppression] = useState<Appareil | null>(null)
  const [suppressionEnCours, setSuppressionEnCours] = useState(false)

  const [modaleOuverte, setModaleOuverte] = useState(false)
  const [numeroTest, setNumeroTest] = useState('')
  const [messageTest, setMessageTest] = useState('')
  const [cleApiTest, setCleApiTest] = useState('')
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [quota, setQuota] = useState(QUOTA_SMS_PAR_HEURE)

  function afficherNotification(type: 'succes' | 'erreur', texte: string) {
    setNotification({ type, texte })
    setTimeout(() => setNotification(null), 4000)
  }

  const chargerDonnees = async (silencieux = false) => {
    if (!silencieux) setActualisationEnCours(true)
    try {
      const [reponse, reponseParams] = await Promise.all([
        fetch('/api/devices'),
        fetch('/api/settings'),
      ])
      const donnees = await reponse.json()
      if (donnees.devices) setAppareils(donnees.devices)
      if (reponseParams.ok) {
        const donneesParams = await reponseParams.json()
        if (typeof donneesParams.settings?.sms_quota_per_hour === 'number') {
          setQuota(donneesParams.settings.sms_quota_per_hour)
        }
      }
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
    const interval = setInterval(() => chargerDonnees(true), 3000)
    return () => clearInterval(interval)
  }, [])

  async function ouvrirDetails(id: string) {
    try {
      const reponse = await fetch(`/api/devices/${id}`)
      const donnees = await reponse.json()
      if (donnees.device) setAppareilDetaille(donnees.device)
    } catch {
      afficherNotification('erreur', 'Impossible de charger les détails')
    }
  }

  async function basculerAppareil(id: string, current: string) {
    const next = current === 'DESACTIVE' ? 'HORS_LIGNE' : 'DESACTIVE'
    try {
      const reponse = await fetch(`/api/devices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: next }),
      })
      const donnees = await reponse.json()
      if (reponse.ok) {
        afficherNotification('succes', next === 'DESACTIVE' ? 'Appareil désactivé' : 'Appareil réactivé')
        setAppareilDetaille(null)
        chargerDonnees(true)
      } else {
        afficherNotification('erreur', donnees.error ?? 'Erreur')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    }
  }

  async function supprimerAppareil() {
    if (!cibleSuppression) return
    setSuppressionEnCours(true)
    try {
      const reponse = await fetch(`/api/devices/${cibleSuppression.id}`, { method: 'DELETE' })
      const donnees = await reponse.json().catch(() => null)
      if (reponse.ok) {
        afficherNotification('succes', `« ${cibleSuppression.nom} » supprimé`)
        setCibleSuppression(null)
        setAppareilDetaille(null)
        chargerDonnees(true)
      } else {
        afficherNotification('erreur', donnees?.error ?? 'Suppression impossible')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    } finally {
      setSuppressionEnCours(false)
    }
  }

  async function pingerAppareil(id: string) {    setPingEnCours(id)
    try {
      const reponse = await fetch(`/api/devices/${id}/ping`, { method: 'POST' })
      const donnees = await reponse.json()
      if (reponse.ok && donnees.ping_sent) {
        afficherNotification('succes', `Ping FCM envoyé à ${donnees.device?.nom ?? id}`)
      } else {
        afficherNotification('erreur', donnees.error ?? 'Ping échoué')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    } finally {
      setPingEnCours(null)
    }
  }

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

  if (chargement) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500">Chargement des appareils…</p>
      </div>
    )
  }

  return (
    <CoquilleTableauDeBord
      titre="Appareils"
      sousTitre={`${appareils.length} enregistré(s) · actualisé à ${derniereActualisation.toLocaleTimeString('fr-FR')}`}
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
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Signal className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Appareils connectés</h2>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {appareils.length}
            </span>
          </div>
        </div>

        {appareils.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Smartphone className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Aucun appareil enregistré</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800">
                  <th className="px-5 py-3">Appareil</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3">Push</th>
                  <th className="px-5 py-3 w-64">Utilisation (SMS/h, quota {quota})</th>
                  <th className="px-5 py-3">Dernière activité</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
                {appareils.map((d) => {
                  const pct = Math.min(100, Math.round(((d.sms_last_hour ?? 0) / quota) * 100))
                  const barColor = pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-amber-500' : 'bg-blue-500'
                  return (
                    <tr key={d.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                      <td className="px-5 py-3.5">
                        <button onClick={() => ouvrirDetails(d.id)} className="flex items-center gap-3 text-left">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                            <Smartphone className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                          </div>
                          <span className="font-medium text-zinc-800 underline-offset-2 hover:underline dark:text-zinc-200">{d.nom}</span>
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <BadgeStatut statut={d.statut} config={STATUTS_APPAREILS} />
                      </td>
                      <td className="px-5 py-3.5">
                        {d.fcm_token
                          ? <span title="Token FCM présent" className="text-emerald-500">✅</span>
                          : <span title="Aucun token FCM" className="text-zinc-400">❌</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-10 text-right text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                            {d.sms_last_hour ?? 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-zinc-400">{tempsEcoule(d.derniere_activite)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => pingerAppareil(d.id)} disabled={pingEnCours === d.id || !d.fcm_token}
                            title="Envoyer un push test"
                            className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800">
                            <Bell className={`h-4 w-4 ${pingEnCours === d.id ? 'animate-pulse' : ''}`} />
                          </button>
                          <button onClick={() => basculerAppareil(d.id, d.statut)}
                            title={d.statut === 'DESACTIVE' ? 'Réactiver' : 'Désactiver'}
                            className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800">
                            <Power className="h-4 w-4" />
                          </button>
                          <button onClick={() => setCibleSuppression(d)}
                            title="Supprimer l'appareil"
                            className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-red-500/10 dark:hover:text-red-400">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modale détails */}
      {appareilDetaille && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-sm" onClick={() => setAppareilDetaille(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 dark:ring-1 dark:ring-zinc-800" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">{appareilDetaille.nom}</h3>
              <button onClick={() => setAppareilDetaille(null)} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="h-4 w-4" />
              </button>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-zinc-500">ID</dt><dd className="font-mono text-xs text-zinc-800 dark:text-zinc-200">{appareilDetaille.id}</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-500">Statut</dt><dd><BadgeStatut statut={appareilDetaille.statut} config={STATUTS_APPAREILS} /></dd></div>
              <div className="flex justify-between"><dt className="text-zinc-500">Token FCM</dt><dd className="font-mono text-xs text-zinc-800 dark:text-zinc-200">{appareilDetaille.fcm_token ?? 'absent'}</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-500">SMS dernière heure</dt><dd className="font-semibold text-zinc-800 dark:text-zinc-200">{appareilDetaille.sms_last_hour ?? 0}</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-500">Dernière activité</dt><dd className="text-zinc-800 dark:text-zinc-200">{tempsEcoule(appareilDetaille.derniere_activite)}</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-500">Enregistré le</dt><dd className="text-zinc-800 dark:text-zinc-200">{new Date(appareilDetaille.created_at).toLocaleString('fr-FR')}</dd></div>
            </dl>
            <div className="mt-5 flex gap-2">
              <button onClick={() => pingerAppareil(appareilDetaille.id)}
                className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm dark:border-zinc-700 dark:text-zinc-300">
                Ping FCM
              </button>
              <button onClick={() => basculerAppareil(appareilDetaille.id, appareilDetaille.statut)}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold text-white ${appareilDetaille.statut === 'DESACTIVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {appareilDetaille.statut === 'DESACTIVE' ? 'Réactiver' : 'Désactiver'}
              </button>
            </div>
          </div>
        </div>
      )}

      <DialogueConfirmation
        ouvert={!!cibleSuppression}
        onFermer={() => !suppressionEnCours && setCibleSuppression(null)}
        onConfirmer={supprimerAppareil}
        chargement={suppressionEnCours}
        titre="Supprimer cet appareil ?"
        message={`« ${cibleSuppression?.nom ?? ''} » ne pourra plus envoyer de SMS. Ses tâches en cours seront libérées et son historique conservé sans attribution. Le téléphone devra être réinitialisé côté app.`}
        etiquetteConfirmer="Supprimer"
      />

      {/* Modale nouveau SMS */}
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
