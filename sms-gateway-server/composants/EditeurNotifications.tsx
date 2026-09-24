'use client'

import { useState, useEffect } from 'react'
import { Webhook, KeyRound, FlaskConical, RotateCcw } from 'lucide-react'

export interface ClientNotification {
  id: string
  nom: string
  url_notification: string | null
  evenements_notification: string[]
  notifications_actives: boolean
  secret_defini: boolean
}

interface Envoi {
  id: string
  type_evenement: string
  statut: string
  tentatives: number
  dernier_code_http: number | null
  date_creation: string
}

const EVENEMENTS = [
  { cle: 'sms.recu', etiquette: 'SMS reçus' },
  { cle: 'lien.clique', etiquette: 'Clics liens' },
]

/** Configuration webhooks d'un client API (URL, événements, secret, test, journal). */
export default function EditeurNotifications({ client, notifier, rafraichir }: {
  client: ClientNotification
  notifier: (type: 'succes' | 'erreur', texte: string) => void
  rafraichir: () => void
}) {
  const [url, setUrl] = useState(client.url_notification ?? '')
  const [evenements, setEvenements] = useState<string[]>(client.evenements_notification ?? [])
  const [actifs, setActifs] = useState(client.notifications_actives ?? true)
  const [secretVisible, setSecretVisible] = useState<string | null>(null)
  const [resultatTest, setResultatTest] = useState<string | null>(null)
  const [envois, setEnvois] = useState<Envoi[]>([])
  const [enregistrement, setEnregistrement] = useState(false)

  async function chargerLivraisons() {
    try {
      const reponse = await fetch(`/api/notifications?application=${client.id}&limit=5`)
      const donnees = await reponse.json()
      if (donnees.envois) setEnvois(donnees.envois)
    } catch { /* silencieux */ }
  }

  useEffect(() => { chargerLivraisons() }, [client.id])

  async function appeler(patch: Record<string, unknown>) {
    const reponse = await fetch(`/api/api-clients/${client.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const donnees = await reponse.json().catch(() => null)
    return { reponse, donnees }
  }

  async function enregistrer() {
    setEnregistrement(true)
    try {
      const { reponse, donnees } = await appeler({
        url_notification: url.trim() === '' ? null : url.trim(),
        evenements_notification: evenements,
        notifications_actives: actifs,
      })
      if (reponse.ok) {
        if (donnees?.secret_notification_visible) setSecretVisible(donnees.secret_notification_visible)
        notifier('succes', 'Notifications enregistrées')
        rafraichir()
      } else {
        notifier('erreur', donnees?.error ?? 'Erreur enregistrement')
      }
    } catch {
      notifier('erreur', 'Erreur réseau')
    } finally {
      setEnregistrement(false)
    }
  }

  async function regenererSecret() {
    if (!confirm('Régénérer le secret ? L’ancien ne fonctionnera plus.')) return
    try {
      const { reponse, donnees } = await appeler({ regenerer_secret: true })
      if (reponse.ok && donnees?.secret_notification_visible) {
        setSecretVisible(donnees.secret_notification_visible)
        notifier('succes', 'Nouveau secret généré — copiez-le maintenant')
      } else {
        notifier('erreur', donnees?.error ?? 'Erreur')
      }
    } catch {
      notifier('erreur', 'Erreur réseau')
    }
  }

  async function tester() {
    setResultatTest(null)
    try {
      const { reponse, donnees } = await appeler({ tester: true })
      if (reponse.ok) {
        const t = donnees?.test as { en_file?: boolean; envoyes?: number; echecs?: number } | undefined
        setResultatTest(t?.en_file ? `Livré (${t?.envoyes ?? 0} ok)` : 'Mis en file — vérifiez le journal')
        chargerLivraisons()
      } else {
        setResultatTest(donnees?.error ?? 'Échec')
      }
    } catch {
      setResultatTest('Erreur réseau')
    }
  }

  function basculerEvenement(cle: string) {
    setEvenements((prev) => prev.includes(cle) ? prev.filter((e) => e !== cle) : [...prev, cle])
  }

  return (
    <div className="mt-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/60">
      <div className="mb-2 flex items-center gap-1.5">
        <Webhook className="h-3.5 w-3.5 text-zinc-400" />
        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200">Notifications</p>
        {!actifs && url.trim() !== '' && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-500/15 dark:text-red-400">COUPÉS</span>
        )}
      </div>
      <div className="flex gap-2">
        <input type="url" placeholder="https://client.example/hook"
          value={url} onChange={(e) => setUrl(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
        <button onClick={enregistrer} disabled={enregistrement}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
          {enregistrement ? '…' : 'OK'}
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        {EVENEMENTS.map((e) => (
          <label key={e.cle} className="flex cursor-pointer items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <input type="checkbox" checked={evenements.includes(e.cle)}
              onChange={() => basculerEvenement(e.cle)}
              className="h-3.5 w-3.5 rounded border-zinc-300 text-blue-600" />
            {e.etiquette}
          </label>
        ))}
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <input type="checkbox" checked={actifs} onChange={(e) => setActifs(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-zinc-300 text-blue-600" />
          Actifs
        </label>
        <button onClick={regenererSecret} title="Régénérer le secret de signature"
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200">
          <KeyRound className="h-3.5 w-3.5" /> Secret
        </button>
        <button onClick={tester} title="Envoyer un ping de test"
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200">
          <FlaskConical className="h-3.5 w-3.5" /> Tester
        </button>
      </div>
      {secretVisible && (
        <div className="mt-2 rounded-lg bg-amber-50 p-2 ring-1 ring-amber-600/20 dark:bg-amber-500/10">
          <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">Secret (une seule fois) :</p>
          <code className="block break-all font-mono text-[11px] text-amber-900 dark:text-amber-200">{secretVisible}</code>
        </div>
      )}
      {resultatTest && <p className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">{resultatTest}</p>}
      {envois.length > 0 && (
        <ul className="mt-2 space-y-1">
          {envois.map((l) => (
            <li key={l.id} className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
              <RotateCcw className="h-3 w-3 shrink-0" />
              <span className="font-mono">{l.type_evenement}</span>
              <span className={l.statut === 'ENVOYE' ? 'text-emerald-600 dark:text-emerald-400' : l.statut === 'ECHOUE' ? 'text-red-500' : 'text-amber-600 dark:text-amber-400'}>
                {l.statut}{l.dernier_code_http ? ` · ${l.dernier_code_http}` : ''} · essai {l.tentatives}
              </span>
              <span className="ml-auto">{new Date(l.date_creation).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
