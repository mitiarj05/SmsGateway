'use client'

import { useState, useEffect, useCallback } from 'react'
import { Webhook, KeyRound, FlaskConical, RotateCcw } from 'lucide-react'
import CoquilleEspace from '../../../composants/CoquilleEspace'
import { Toast } from '../../../composants/interface'

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

export default function PageNotificationsEspace() {
  const [url, setUrl] = useState('')
  const [evenements, setEvenements] = useState<string[]>([])
  const [actifs, setActifs] = useState(true)
  const [secretVisible, setSecretVisible] = useState<string | null>(null)
  const [resultatTest, setResultatTest] = useState<string | null>(null)
  const [envois, setEnvois] = useState<Envoi[]>([])
  const [chargement, setChargement] = useState(true)
  const [enregistrement, setEnregistrement] = useState(false)
  const [notification, setNotification] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  function afficherNotification(type: 'succes' | 'erreur', texte: string) {
    setNotification({ type, texte })
    setTimeout(() => setNotification(null), 4000)
  }

  const chargerDonnees = useCallback(async () => {
    try {
      const reponseConfig = await fetch('/api/espace/notifications')
      const config = await reponseConfig.json()
      if (config.url_notification !== undefined) {
        setUrl(config.url_notification ?? '')
        setEvenements(config.evenements_notification ?? [])
        setActifs(config.notifications_actives ?? true)
      }
      await chargerJournal()
    } finally {
      setChargement(false)
    }
  }, [])

  async function chargerJournal() {
    try {
      const reponse = await fetch('/api/espace/journal')
      if (reponse.ok) {
        const donnees = await reponse.json()
        if (donnees.envois) setEnvois(donnees.envois)
      }
    } catch { /* silencieux */ }
  }

  useEffect(() => { chargerDonnees() }, [chargerDonnees])

  async function appeler(patch: Record<string, unknown>) {
    const reponse = await fetch('/api/espace/notifications', {
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
        afficherNotification('succes', 'Configuration enregistrée')
      } else {
        afficherNotification('erreur', donnees?.error ?? 'Erreur enregistrement')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
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
        afficherNotification('succes', 'Nouveau secret généré — copiez-le maintenant')
      } else {
        afficherNotification('erreur', donnees?.error ?? 'Erreur')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    }
  }

  async function tester() {
    setResultatTest(null)
    try {
      const { reponse, donnees } = await appeler({ tester: true })
      if (reponse.ok) {
        const t = donnees?.test as { en_file?: boolean; envoyes?: number } | undefined
        setResultatTest(t?.en_file ? `Livré (${t?.envoyes ?? 0} ok)` : 'Mis en file')
        chargerJournal()
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

  if (chargement) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500">Chargement…</p>
      </div>
    )
  }

  return (
    <CoquilleEspace titre="Notifications" sousTitre="Rappels HTTP vers votre système">
      <section className="max-w-5xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
        <div className="mb-2 flex items-center gap-1.5">
          <Webhook className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Mon URL de rappel</h2>
          {!actifs && url.trim() !== '' && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-500/15 dark:text-red-400">COUPÉES</span>
          )}
        </div>
        <div className="flex gap-2">
          <input type="url" placeholder="https://mon-systeme/hook"
            value={url} onChange={(e) => setUrl(e.target.value)}
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
          <button onClick={enregistrer} disabled={enregistrement}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {enregistrement ? '…' : 'Enregistrer'}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
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
            Actives
          </label>
          <button onClick={regenererSecret}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200">
            <KeyRound className="h-3.5 w-3.5" /> Secret
          </button>
          <button onClick={tester}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200">
            <FlaskConical className="h-3.5 w-3.5" /> Tester
          </button>
        </div>
        {secretVisible && (
          <div className="mt-3 rounded-lg bg-amber-50 p-3 ring-1 ring-amber-600/20 dark:bg-amber-500/10">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Secret (une seule fois, à mettre dans votre système) :</p>
            <code className="mt-1 block break-all font-mono text-xs text-amber-900 dark:text-amber-200">{secretVisible}</code>
          </div>
        )}
        {resultatTest && <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{resultatTest}</p>}
        {envois.length > 0 && (
          <ul className="mt-3 space-y-1.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            {envois.map((l) => (
              <li key={l.id} className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <RotateCcw className="h-3 w-3 shrink-0" />
                <span className="font-mono">{l.type_evenement}</span>
                <span className={l.statut === 'ENVOYE' ? 'text-emerald-600 dark:text-emerald-400' : l.statut === 'ECHOUE' ? 'text-red-500' : 'text-amber-600 dark:text-amber-400'}>
                  {l.statut}{l.dernier_code_http ? ` · ${l.dernier_code_http}` : ''} · essai {l.tentatives}
                </span>
                <span className="ml-auto text-[11px]">{new Date(l.date_creation).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Toast notification={notification} />
    </CoquilleEspace>
  )
}
