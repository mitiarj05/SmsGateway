'use client'

import { useState, useEffect } from 'react'
import { Settings as IconeParametres, Send, Loader2, X, KeyRound, Trash2, Bell, Clock, RefreshCw } from 'lucide-react'
import CoquilleTableauDeBord from '../../composants/CoquilleTableauDeBord'
import { Appareil, Toast } from '../../composants/interface'
import EditeurNotifications from '../../composants/EditeurNotifications'

interface ClientApi {
  id: string
  nom: string
  cle_api: string
  created_at: string
  url_notification: string | null
  evenements_notification: string[]
  notifications_actives: boolean
  secret_defini: boolean
}

export default function PageParametres() {
  const [appareils, setAppareils] = useState<Appareil[]>([])
  const [derniereActualisation, setDerniereActualisation] = useState<Date>(new Date())
  const [actualisationEnCours, setActualisationEnCours] = useState(false)

  const [cleApi, setCleApi] = useState('')
  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false)
  const [notification, setNotification] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  const [quotaSms, setQuotaSms] = useState('10')
  const [seuilAlerte, setSeuilAlerte] = useState('10')
  const [heuresExpiration, setHeuresExpiration] = useState('24')
  const [enregistrementQuota, setEnregistrementQuota] = useState(false)
  const [enregistrementAlerte, setEnregistrementAlerte] = useState(false)
  const [enregistrementExpiration, setEnregistrementExpiration] = useState(false)

  const [clients, setClients] = useState<ClientApi[]>([])
  const [nomNouveauClient, setNomNouveauClient] = useState('')
  const [creationEnCours, setCreationEnCours] = useState(false)
  const [nouvelleCleCree, setNouvelleCleCree] = useState<string | null>(null)
  const [sante, setSante] = useState<{
    status: string; version: string; uptime_seconds: number
    checks: {
      supabase: { ok: boolean; latency_ms: number; error?: string }
      settings_table: boolean; fcm_configured: boolean
    }
  } | null>(null)

  const [modaleOuverte, setModaleOuverte] = useState(false)
  const [numeroTest, setNumeroTest] = useState('')
  const [messageTest, setMessageTest] = useState('')
  const [cleApiTest, setCleApiTest] = useState('')
  const [envoiEnCours, setEnvoiEnCours] = useState(false)

  const chargerDonnees = async () => {
    setActualisationEnCours(true)
    try {
      const [reponseAppareils, reponseClients, reponseParams] = await Promise.all([
        fetch('/api/devices'),
        fetch('/api/api-clients'),
        fetch('/api/settings'),
      ])
      const donneesAppareils = await reponseAppareils.json()
      const donneesClients = await reponseClients.json()
      if (donneesAppareils.devices) setAppareils(donneesAppareils.devices)
      if (donneesClients.clients) setClients(donneesClients.clients)
      if (reponseParams.ok) {
        const donneesParams = await reponseParams.json()
        if (typeof donneesParams.settings?.sms_quota_per_hour === 'number') {
          setQuotaSms(String(donneesParams.settings.sms_quota_per_hour))
        }
        if (typeof donneesParams.settings?.queue_alert_threshold === 'number') {
          setSeuilAlerte(String(donneesParams.settings.queue_alert_threshold))
        }
        if (typeof donneesParams.settings?.max_pending_hours === 'number') {
          setHeuresExpiration(String(donneesParams.settings.max_pending_hours))
        }
      }
      try {
        const reponseSante = await fetch('/api/health')
        const donneesSante = await reponseSante.json()
        if (donneesSante?.status) setSante(donneesSante)
      } catch {
        setSante(null)
      }
      setDerniereActualisation(new Date())
    } finally {
      setActualisationEnCours(false)
    }
  }

  useEffect(() => {
    chargerDonnees()
    const savedKey = localStorage.getItem('smsika-cle-api')
    if (savedKey) { setCleApi(savedKey); setCleApiTest(savedKey) }
  }, [])

  function afficherNotification(type: 'succes' | 'erreur', texte: string) {
    setNotification({ type, texte })
    setTimeout(() => setNotification(null), 4000)
  }

  function enregistrerCleApi(e: React.FormEvent) {
    e.preventDefault()
    setEnregistrementEnCours(true)
    const nettoyee = cleApi.trim()
    setCleApi(nettoyee)
    localStorage.setItem('smsika-cle-api', nettoyee)
    setCleApiTest(nettoyee)
    setEnregistrementEnCours(false)
    afficherNotification('succes', 'Clé API enregistrée localement')
  }

  async function enregistrerQuota(e: React.FormEvent) {
    e.preventDefault()
    setEnregistrementQuota(true)
    try {
      const reponse = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cle: 'sms_quota_per_hour', valeur: Number(quotaSms) }),
      })
      const donnees = await reponse.json()
      if (reponse.ok) {
        setQuotaSms(String(donnees.settings.sms_quota_per_hour))
        afficherNotification('succes', `Quota SMS/heure : ${donnees.settings.sms_quota_per_hour}`)
      } else {
        afficherNotification('erreur', donnees.error ?? 'Erreur enregistrement')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    } finally {
      setEnregistrementQuota(false)
    }
  }

  async function enregistrerSeuilAlerte(e: React.FormEvent) {
    e.preventDefault()
    setEnregistrementAlerte(true)
    try {
      const reponse = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cle: 'queue_alert_threshold', valeur: Number(seuilAlerte) }),
      })
      const donnees = await reponse.json()
      if (reponse.ok) {
        setSeuilAlerte(String(donnees.settings.queue_alert_threshold))
        afficherNotification('succes', `Seuil d'alerte : ${donnees.settings.queue_alert_threshold} tâches`)
      } else {
        afficherNotification('erreur', donnees.error ?? 'Erreur enregistrement')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    } finally {
      setEnregistrementAlerte(false)
    }
  }

  async function enregistrerExpiration(e: React.FormEvent) {
    e.preventDefault()
    setEnregistrementExpiration(true)
    try {
      const reponse = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cle: 'max_pending_hours', valeur: Number(heuresExpiration) }),
      })
      const donnees = await reponse.json()
      if (reponse.ok) {
        setHeuresExpiration(String(donnees.settings.max_pending_hours))
        afficherNotification('succes', `Expiration : ${donnees.settings.max_pending_hours} h`)
      } else {
        afficherNotification('erreur', donnees.error ?? 'Erreur enregistrement')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    } finally {
      setEnregistrementExpiration(false)
    }
  }

  async function creerClient(e: React.FormEvent) {
    e.preventDefault()
    setCreationEnCours(true)
    setNouvelleCleCree(null)
    try {
      const reponse = await fetch('/api/api-clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: nomNouveauClient }),
      })
      const donnees = await reponse.json()
      if (reponse.ok) {
        setNouvelleCleCree(donnees.client.cle_api)
        setNomNouveauClient('')
        chargerDonnees()
        afficherNotification('succes', 'Clé créée — copiez-la maintenant')
      } else {
        afficherNotification('erreur', donnees.error ?? 'Erreur création')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    } finally {
      setCreationEnCours(false)
    }
  }

  async function revoquerClient(id: string, nom: string) {
    if (!confirm(`Révoquer la clé « ${nom} » ?`)) return
    try {
      const reponse = await fetch(`/api/api-clients/${id}`, { method: 'DELETE' })
      if (reponse.ok) {
        afficherNotification('succes', 'Clé révoquée')
        chargerDonnees()
      } else {
        afficherNotification('erreur', 'Erreur révocation')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
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
      const donnees = await reponse.json()
      if (reponse.ok) {
        afficherNotification('succes', `SMS mis en file d'attente → ${numeroTest}`)
        setModaleOuverte(false)
        setMessageTest('')
      } else {
        afficherNotification('erreur', donnees.error ?? 'Erreur lors de l’envoi')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    } finally {
      setEnvoiEnCours(false)
    }
  }

  return (
    <CoquilleTableauDeBord
      titre="Paramètres"
      sousTitre={`actualisé à ${derniereActualisation.toLocaleTimeString('fr-FR')}`}
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
      <div className="grid max-w-4xl grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Clé API locale */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
          <div className="mb-4 flex items-center gap-2">
            <IconeParametres className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Clé API (envoi SMS)</h2>
          </div>
          <form onSubmit={enregistrerCleApi} className="space-y-4">
            <input type="password" value={cleApi} onChange={(e) => setCleApi(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
            <p className="-mt-2 text-xs text-zinc-400">Stockée uniquement dans le navigateur.</p>
            <button type="submit" disabled={enregistrementEnCours}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {enregistrementEnCours && <Loader2 className="h-4 w-4 animate-spin" />} Enregistrer
            </button>
          </form>
        </section>

        {/* Quota SMS */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
          <h2 className="mb-1 text-sm font-bold text-zinc-900 dark:text-white">Quota SMS / heure / appareil</h2>
          <p className="mb-4 text-xs text-zinc-400">Limite stricte : au-delà, l&apos;envoi répond 429 et les téléphones ne prennent plus de tâches pendant 1 h.</p>
          <form onSubmit={enregistrerQuota} className="flex gap-2">
            <input type="number" min={1} max={1000} value={quotaSms} onChange={(e) => setQuotaSms(e.target.value)}
              className="w-28 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
            <button type="submit" disabled={enregistrementQuota}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {enregistrementQuota ? '…' : 'Enregistrer'}
            </button>
          </form>
        </section>

        {/* Seuil alerte */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
          <div className="mb-1 flex items-center gap-2">
            <Bell className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Seuil d'alerte file d'attente</h2>
          </div>
          <p className="mb-4 text-xs text-zinc-400">Le dashboard affiche une alerte au-delà de ce nombre de tâches en attente.</p>
          <form onSubmit={enregistrerSeuilAlerte} className="flex gap-2">
            <input type="number" min={1} max={1000} value={seuilAlerte} onChange={(e) => setSeuilAlerte(e.target.value)}
              className="w-28 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
            <button type="submit" disabled={enregistrementAlerte}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {enregistrementAlerte ? '…' : 'Enregistrer'}
            </button>
          </form>
        </section>

        {/* Expiration PENDING */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
          <div className="mb-1 flex items-center gap-2">
            <Clock className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Expiration des tâches en attente</h2>
          </div>
          <p className="mb-4 text-xs text-zinc-400">Une tâche EN_ATTENTE non prise par un appareil sous ce délai passe en Échoué.</p>
          <form onSubmit={enregistrerExpiration} className="flex gap-2">
            <input type="number" min={1} max={1000} value={heuresExpiration} onChange={(e) => setHeuresExpiration(e.target.value)}
              className="w-28 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
            <span className="self-center text-xs text-zinc-400">heures</span>
            <button type="submit" disabled={enregistrementExpiration}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {enregistrementExpiration ? '…' : 'Enregistrer'}
            </button>
          </form>
        </section>

        {/* Santé du système */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
          <div className="mb-4 flex items-center gap-2">
            <span className={`relative flex h-2.5 w-2.5`}>
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 ${sante?.status === 'ok' ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${sante?.status === 'ok' ? 'bg-emerald-500' : 'bg-red-500'}`} />
            </span>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Santé du système</h2>
            {sante && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                v{sante.version}
              </span>
            )}
          </div>
          {!sante ? (
            <p className="text-xs text-zinc-400">Chargement…</p>
          ) : (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Supabase</dt>
                <dd className={`font-semibold ${sante.checks.supabase.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {sante.checks.supabase.ok ? `OK · ${sante.checks.supabase.latency_ms} ms` : `KO${sante.checks.supabase.error ? ` · ${sante.checks.supabase.error}` : ''}`}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Table settings</dt>
                <dd className="font-semibold text-zinc-800 dark:text-zinc-200">{sante.checks.settings_table ? 'présente' : 'absente'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Push FCM</dt>
                <dd className="font-semibold text-zinc-800 dark:text-zinc-200">{sante.checks.fcm_configured ? 'configuré' : 'non configuré'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Uptime serveur</dt>
                <dd className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {Math.floor(sante.uptime_seconds / 3600)} h {Math.floor((sante.uptime_seconds % 3600) / 60)} min
                </dd>
              </div>
            </dl>
          )}
        </section>

        {/* Clés API serveur */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Clés API serveur</h2>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{clients.length}</span>
          </div>
          <form onSubmit={creerClient} className="mb-4 flex gap-2">
            <input type="text" required placeholder="Nom du client…" value={nomNouveauClient}
              onChange={(e) => setNomNouveauClient(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
            <button type="submit" disabled={creationEnCours}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
              {creationEnCours ? '…' : 'Créer'}
            </button>
          </form>
          {nouvelleCleCree && (
            <div className="mb-4 rounded-lg bg-amber-50 p-3 ring-1 ring-amber-600/20 dark:bg-amber-500/10">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Copiez cette clé maintenant (affichée une seule fois) :</p>
              <code className="mt-1 block break-all font-mono text-xs text-amber-900 dark:text-amber-200">{nouvelleCleCree}</code>
            </div>
          )}
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {clients.map((c) => (
              <li key={c.id} className="py-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{c.nom}</p>
                    <p className="font-mono text-xs text-zinc-400">{c.cle_api}</p>
                  </div>
                  <button onClick={() => revoquerClient(c.id, c.nom)} title="Révoquer"
                    className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:border-zinc-700 dark:text-zinc-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <EditeurNotifications client={c} notifier={afficherNotification} rafraichir={() => chargerDonnees()} />
              </li>
            ))}
            {clients.length === 0 && <p className="py-4 text-center text-xs text-zinc-400">Aucune clé API.</p>}
          </ul>
        </section>
      </div>

      {/* Modal nouveau SMS */}
      {modaleOuverte && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-sm" onClick={() => !envoiEnCours && setModaleOuverte(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 dark:ring-1 dark:ring-zinc-800" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Envoyer un SMS</h3>
              <button onClick={() => !envoiEnCours && setModaleOuverte(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={envoyerSmsTest} className="space-y-4">
              <input type="tel" required placeholder="+261328725411" value={numeroTest}
                onChange={(e) => setNumeroTest(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
              <textarea required rows={3} maxLength={160} placeholder="Votre message…" value={messageTest}
                onChange={(e) => setMessageTest(e.target.value)}
                className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
              <p className="text-right text-[11px] text-zinc-400">{messageTest.length}/160</p>
              <input type="password" required value={cleApiTest}
                onChange={(e) => setCleApiTest(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
              <div className="flex gap-2">
                <button type="button" onClick={() => !envoiEnCours && setModaleOuverte(false)}
                  className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm dark:border-zinc-700 dark:text-zinc-300">Annuler</button>
                <button type="submit" disabled={envoiEnCours}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white disabled:opacity-60">
                  {envoiEnCours ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi…</> : <><Send className="h-4 w-4" /> Envoyer</>}
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
