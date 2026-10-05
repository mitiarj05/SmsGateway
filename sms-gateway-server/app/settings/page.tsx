'use client'

import { useState, useEffect } from 'react'
import {
  UserCheck, Key, ChevronDown, Trash2, Check, Copy, Loader2, Eye, EyeOff,
} from 'lucide-react'
import CoquilleTableauDeBord from '../../composants/CoquilleTableauDeBord'
import { Toast } from '../../composants/interface'

interface ClientApi {
  id: string
  nom: string
  cle_api: string
  created_at: string
}

interface Demande {
  id: string
  nom: string
  contact: string
  usage_prevu: string
  statut: string
  date_creation: string
}

interface Sante {
  status: string
  version: string
  uptime_seconds: number
  checks: {
    supabase: { ok: boolean; latency_ms: number; error?: string }
    settings_table: boolean
    fcm_configured: boolean
  }
}

export default function PageParametres() {
  const [notification, setNotification] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  // Clé API locale (navigateur)
  const [cleLocale, setCleLocale] = useState('')

  // Réglages serveur
  const [quotaSms, setQuotaSms] = useState('20')
  const [seuilAlerte, setSeuilAlerte] = useState('10')
  const [dureeExpiration, setDureeExpiration] = useState('24')
  const [uniteExpiration, setUniteExpiration] = useState('heures')
  const [sauvegarde, setSauvegarde] = useState<string | null>(null)

  // Système
  const [sante, setSante] = useState<Sante | null>(null)

  // Demandes + clients
  const [demandes, setDemandes] = useState<Demande[]>([])
  const [clients, setClients] = useState<ClientApi[]>([])
  const [nomClient, setNomClient] = useState('')
  const [creationEnCours, setCreationEnCours] = useState(false)
  const [cleCreee, setCleCreee] = useState<string | null>(null)
  const [copie, setCopie] = useState(false)
  const [clesRevelees, setClesRevelees] = useState<Record<string, string>>({})
  const [revelationEnCours, setRevelationEnCours] = useState<string | null>(null)

  function afficherNotification(type: 'succes' | 'erreur', texte: string) {
    setNotification({ type, texte })
    setTimeout(() => setNotification(null), 4000)
  }

  async function charger() {
    try {
      const [resParams, resDemandes, resClients, resSante] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/demandes?statut=EN_ATTENTE'),
        fetch('/api/api-clients'),
        fetch('/api/health'),
      ])
      if (resParams.ok) {
        const d = await resParams.json().catch(() => ({}))
        if (typeof d.settings?.sms_quota_per_hour === 'number') setQuotaSms(String(d.settings.sms_quota_per_hour))
        if (typeof d.settings?.queue_alert_threshold === 'number') setSeuilAlerte(String(d.settings.queue_alert_threshold))
        if (typeof d.settings?.max_pending_hours === 'number') setDureeExpiration(String(d.settings.max_pending_hours))
      }
      const dDem = await resDemandes.json().catch(() => ({}))
      if (Array.isArray(dDem.demandes)) setDemandes(dDem.demandes)
      const dCli = await resClients.json().catch(() => ({}))
      if (Array.isArray(dCli.clients)) setClients(dCli.clients)
      const dSante = await resSante.json().catch(() => ({}))
      if (dSante?.status) setSante(dSante)
    } catch { /* silencieux */ }
  }

  useEffect(() => {
    const saved = localStorage.getItem('smsika-cle-api')
    if (saved) setCleLocale(saved)
    charger()
  }, [])

  function enregistrerCleLocale() {
    localStorage.setItem('smsika-cle-api', cleLocale.trim())
    afficherNotification('succes', 'Clé enregistrée dans ce navigateur')
  }

  async function enregistrerReglage(cle: 'sms_quota_per_hour' | 'queue_alert_threshold' | 'max_pending_hours', valeur: number) {
    setSauvegarde(cle)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cle, valeur }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        afficherNotification('succes', 'Réglage enregistré')
        await charger()
      } else {
        afficherNotification('erreur', data.error ?? 'Enregistrement impossible')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    } finally {
      setSauvegarde(null)
    }
  }

  async function creerClient() {
    if (!nomClient.trim()) return
    setCreationEnCours(true)
    setCleCreee(null)
    try {
      const res = await fetch('/api/api-clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: nomClient.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.client?.cle_api) {
        setCleCreee(data.client.cle_api)
        setNomClient('')
        await charger()
        afficherNotification('succes', 'Clé créée — copiez-la maintenant')
      } else {
        afficherNotification('erreur', data.error ?? 'Création impossible')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    } finally {
      setCreationEnCours(false)
    }
  }

  async function revelerCle(id: string) {
    if (clesRevelees[id]) {
      setClesRevelees((prev) => {
        const copie = { ...prev }
        delete copie[id]
        return copie
      })
      return
    }
    setRevelationEnCours(id)
    try {
      const res = await fetch(`/api/api-clients/${id}?reveler=1`, { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.cle_api) {
        setClesRevelees((prev) => ({ ...prev, [id]: data.cle_api }))
      } else {
        afficherNotification('erreur', data.error ?? 'Révélation impossible')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    } finally {
      setRevelationEnCours(null)
    }
  }

  function copierCleRevelee(cle: string) {
    navigator.clipboard?.writeText(cle)
    afficherNotification('succes', 'Clé copiée')
  }

  async function revoquerClient(id: string, nom: string) {
    if (!window.confirm(`Révoquer la clé « ${nom} » ?`)) return
    try {
      const res = await fetch(`/api/api-clients/${id}`, { method: 'DELETE' })
      if (res.ok) {
        afficherNotification('succes', 'Clé révoquée')
        await charger()
      } else {
        afficherNotification('erreur', 'Révocation impossible')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    }
  }

  async function traiterDemande(id: string, action: 'valider' | 'refuser') {
    try {
      const res = await fetch(`/api/demandes/${id}/${action}`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        if (action === 'valider' && data.client?.cle_api) setCleCreee(data.client.cle_api)
        afficherNotification('succes', data.message ?? 'Demande traitée')
        await charger()
      } else {
        afficherNotification('erreur', data.error ?? 'Traitement impossible')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    }
  }

  function copierCle() {
    if (!cleCreee) return
    navigator.clipboard?.writeText(cleCreee)
    setCopie(true)
    setTimeout(() => setCopie(false), 2000)
  }

  return (
    <CoquilleTableauDeBord>
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Paramètres</h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
          Configurez les intégrations, quotas et accès de votre espace SMSIKA.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Colonne Gauche */}
        <div className="space-y-6">
          {/* Card 1 : Clé API locale */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Clé API (envois de test)</h2>
            <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">Stockée uniquement dans ce navigateur, utilisée pour les envois de test.</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Clé API
                </label>
                <input
                  type="password"
                  value={cleLocale}
                  onChange={(e) => setCleLocale(e.target.value)}
                  placeholder="cle_…"
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 font-mono"
                />
              </div>
              <div className="flex items-center justify-end pt-2">
                <button onClick={enregistrerCleLocale}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition">
                  Enregistrer
                </button>
              </div>
            </div>
          </div>

          {/* Card 2 : Seuil d'alerte file d'attente */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Seuil d'alerte file d'attente</h2>
            <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">Le tableau de bord affiche une alerte au-delà de ce nombre de tâches en attente.</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Tâches en attente
                </label>
                <input
                  type="number" min={1} max={1000}
                  value={seuilAlerte}
                  onChange={(e) => setSeuilAlerte(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button onClick={() => enregistrerReglage('queue_alert_threshold', Number(seuilAlerte))}
                  disabled={sauvegarde === 'queue_alert_threshold'}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50">
                  {sauvegarde === 'queue_alert_threshold' ? '…' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>

          {/* Card 3 : État du système */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">État du système</h2>
            <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500 mb-4">Santé des services essentiels</p>

            {!sante ? (
              <p className="flex items-center gap-2 text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Chargement…</p>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-semibold text-slate-800 dark:text-zinc-200">
                    <span className={`h-2 w-2 rounded-full ${sante.checks.supabase.ok ? 'bg-emerald-500' : 'bg-red-500'}`} /> SUPABASE
                  </span>
                  <span className={`font-bold ${sante.checks.supabase.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {sante.checks.supabase.ok ? `OK · ${sante.checks.supabase.latency_ms} ms` : 'KO'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-semibold text-slate-800 dark:text-zinc-200">
                    <span className={`h-2 w-2 rounded-full ${sante.checks.settings_table ? 'bg-emerald-500' : 'bg-red-500'}`} /> TABLE PARAMÈTRES
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{sante.checks.settings_table ? 'présente' : 'absente'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-semibold text-slate-800 dark:text-zinc-200">
                    <span className={`h-2 w-2 rounded-full ${sante.checks.fcm_configured ? 'bg-emerald-500' : 'bg-amber-500'}`} /> PUSH FCM
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{sante.checks.fcm_configured ? 'configuré' : 'non configuré'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-semibold text-slate-800 dark:text-zinc-200">
                    <span className="h-2 w-2 rounded-full bg-blue-500" /> API serveur
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">v{sante.version}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Colonne Droite */}
        <div className="space-y-6">
          {/* Row Quotas & Expiration */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Card Quotas */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Quotas SMS / heure / appareil</h2>
                <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">Limite appliquée à chaque appareil.</p>
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1.5">
                    SMS par heure
                  </label>
                  <input
                    type="number" min={1} max={1000}
                    value={quotaSms}
                    onChange={(e) => setQuotaSms(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={() => enregistrerReglage('sms_quota_per_hour', Number(quotaSms))}
                  disabled={sauvegarde === 'sms_quota_per_hour'}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50">
                  {sauvegarde === 'sms_quota_per_hour' ? '…' : 'Enregistrer'}
                </button>
              </div>
            </div>

            {/* Card Expiration */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Expiration des tâches en attente</h2>
                <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">Durée avant abandon d'un envoi.</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1.5">Durée</label>
                    <input
                      type="number" min={1}
                      value={dureeExpiration}
                      onChange={(e) => setDureeExpiration(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1.5">Unité</label>
                    <div className="relative">
                      <select
                        value={uniteExpiration}
                        onChange={(e) => setUniteExpiration(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-3 pr-7 text-xs font-semibold text-slate-700 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      >
                        <option value="heures">heures</option>
                        <option value="jours">jours</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => enregistrerReglage('max_pending_hours', uniteExpiration === 'jours' ? Number(dureeExpiration) * 24 : Number(dureeExpiration))}
                  disabled={sauvegarde === 'max_pending_hours'}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50">
                  {sauvegarde === 'max_pending_hours' ? '…' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>

          {/* Card Demandes d'accès */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Demandes d'accès</h2>
            <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">Validation des nouveaux accès clients</p>

            {demandes.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-8 text-slate-400 dark:text-zinc-500">
                <UserCheck className="h-4 w-4" />
                <span className="text-xs">Aucune demande en attente</span>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100 dark:divide-zinc-800">
                {demandes.map((d) => (
                  <li key={d.id} className="py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-zinc-100">{d.nom}</p>
                        <p className="truncate text-[11px] text-slate-400">{d.contact} · {d.usage_prevu}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button onClick={() => traiterDemande(d.id, 'valider')}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700">
                          Valider
                        </button>
                        <button onClick={() => traiterDemande(d.id, 'refuser')}
                          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300">
                          Refuser
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Card Clés API serveur */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Clés API serveur</h2>
            <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">Créez un accès sécurisé pour une application cliente.</p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1.5">Nom du client</label>
                <input
                  type="text"
                  placeholder="Nom du client..."
                  value={nomClient}
                  onChange={(e) => setNomClient(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') creerClient() }}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              {cleCreee && (
                <div className="rounded-xl bg-amber-50 p-3 ring-1 ring-amber-600/20 dark:bg-amber-500/10">
                  <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">Copiez cette clé maintenant (affichée une seule fois) :</p>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="flex-1 break-all font-mono text-[11px] text-amber-900 dark:text-amber-200">{cleCreee}</code>
                    <button onClick={copierCle} title="Copier" className="text-amber-700 hover:text-amber-900 dark:text-amber-300">
                      {copie ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {clients.length > 0 && (
                <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {clients.map((c) => {
                    const revelee = clesRevelees[c.id]
                    return (
                    <li key={c.id} className="flex items-center justify-between gap-2 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-zinc-100">{c.nom}</p>
                        <p className="truncate font-mono text-[11px] text-slate-400">
                          {revelee ?? '••••••••••••••••'}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {revelee && (
                          <button onClick={() => copierCleRevelee(revelee)} title="Copier la clé"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800">
                            <Copy className="h-4 w-4" />
                          </button>
                        )}
                        <button onClick={() => revelerCle(c.id)} disabled={revelationEnCours === c.id}
                          title={revelee ? 'Masquer la clé' : 'Afficher la clé'}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 dark:hover:bg-zinc-800">
                          {revelationEnCours === c.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : revelee ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button onClick={() => revoquerClient(c.id, c.nom)} title="Révoquer"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                    )
                  })}
                </ul>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400 dark:text-zinc-500">{clients.length} clé{clients.length > 1 ? 's' : ''} active{clients.length > 1 ? 's' : ''} — affichée{clients.length > 1 ? 's' : ''} une seule fois à la création.</span>
                <button onClick={creerClient} disabled={creationEnCours || !nomClient.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50">
                  <Key className="h-3.5 w-3.5" /> {creationEnCours ? '…' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Toast notification={notification} />
    </CoquilleTableauDeBord>
  )
}
