'use client'

import { useState, useEffect } from 'react'
import {
  ChevronDown, Trash2, Check, Copy, Loader2, Eye, EyeOff, ShieldCheck, CheckCircle2, UserPlus, Lock, Plus
} from 'lucide-react'
import CoquilleTableauDeBord from '../../composants/CoquilleTableauDeBord'
import { Toast } from '../../composants/interface'

interface ClientApi {
  id: string
  nom: string
  cle_api: string
  created_at: string
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

const inputCls =
  "rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] text-slate-700 outline-none focus:border-[#5b5bd6] focus:ring-2 focus:ring-[#5b5bd6]/15 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"

export default function PageParametres() {
  const [notification, setNotification] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  // Clé API locale
  const [cleLocale, setCleLocale] = useState('')

  // Réglages serveur
  const [quotaSms, setQuotaSms] = useState('')
  const [seuilAlerte, setSeuilAlerte] = useState('')
  const [dureeExpiration, setDureeExpiration] = useState('')
  const [uniteExpiration, setUniteExpiration] = useState('heures')
  const [sauvegarde, setSauvegarde] = useState<string | null>(null)

  // Système
  const [sante, setSante] = useState<Sante | null>(null)

  // Clients API
  const [clients, setClients] = useState<ClientApi[]>([])
  const [nomClient, setNomClient] = useState('')
  const [creationEnCours, setCreationEnCours] = useState(false)
  const [cleCreee, setCleCreee] = useState<string | null>(null)
  const [clesRevelees, setClesRevelees] = useState<Record<string, string>>({})
  const [revelationEnCours, setRevelationEnCours] = useState<string | null>(null)
  const [demandes, setDemandes] = useState<{ id: string; nom: string; contact: string; usage_prevu: string }[]>([])

  function afficherNotification(type: 'succes' | 'erreur', texte: string) {
    setNotification({ type, texte })
    setTimeout(() => setNotification(null), 4000)
  }

  async function charger() {
    try {
      const [resParams, resClients, resSante, resDemandes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/api-clients'),
        fetch('/api/health'),
        fetch('/api/demandes?statut=EN_ATTENTE'),
      ])
      if (resParams.ok) {
        const d = await resParams.json().catch(() => ({}))
        if (typeof d.settings?.sms_quota_per_hour === 'number') setQuotaSms(String(d.settings.sms_quota_per_hour))
        if (typeof d.settings?.queue_alert_threshold === 'number') setSeuilAlerte(String(d.settings.queue_alert_threshold))
        if (typeof d.settings?.max_pending_hours === 'number') setDureeExpiration(String(d.settings.max_pending_hours))
      }
      const dCli = await resClients.json().catch(() => ({}))
      if (Array.isArray(dCli.clients)) setClients(dCli.clients)
      const dSante = await resSante.json().catch(() => ({}))
      if (dSante?.status) setSante(dSante)
      const dDem = await resDemandes.json().catch(() => ({}))
      if (Array.isArray(dDem.demandes)) setDemandes(dDem.demandes)
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

  async function revoquerClient(id: string, nom: string) {
    if (!window.confirm(`Révoquer la clé « ${nom} » ?`)) return
    try {
      const res = await fetch(`/api/api-clients/${id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        afficherNotification('succes', 'Clé révoquée')
        await charger()
      } else {
        afficherNotification('erreur', data.error ?? 'Révocation impossible')
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

  return (
    <CoquilleTableauDeBord>
      <div className="mb-6">
        <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white">
          Paramètres
        </h1>
        <p className="mt-1 text-[13.5px] text-slate-500 dark:text-zinc-400">
          Configurez les intégrations, quotas et accès de votre espace SMSIKA.
        </p>
      </div>

      <div className="grid grid-cols-[190px_1fr_270px] items-start gap-6">
        {/* Navigation latérale sticky */}
        <div className="sticky top-24 space-y-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Intégrations
            </p>
            <p className="mt-1.5 text-[13.5px] font-bold text-slate-800 dark:text-zinc-200">
              Connecter votre espace
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              Les accès techniques et la santé de vos services essentiels.
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Acheminement
            </p>
            <p className="mt-1.5 text-[13.5px] font-bold text-slate-800 dark:text-zinc-200">
              Garder le contrôle
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              Définissez les limites de traitement et les alertes de votre console.
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Accès clients
            </p>
            <p className="mt-1.5 text-[13.5px] font-bold text-slate-800 dark:text-zinc-200">
              Ouvrir les bons accès
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              Créez des clés dédiées et validez les demandes de vos clients.
            </p>
          </div>
        </div>

        {/* Formulaires centraux */}
        <div className="space-y-4">
          {/* Clé API test */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800">
            <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">
              Clé API (envois de test)
            </h2>
            <p className="mt-0.5 text-[12px] text-slate-400">
              Stockée uniquement dans ce navigateur, utilisée pour les envois de test.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <input
                value={cleLocale}
                onChange={(e) => setCleLocale(e.target.value)}
                className={`${inputCls} flex-1 bg-slate-50 font-mono text-slate-500 dark:bg-zinc-800`}
              />
              <button onClick={enregistrerCleLocale} className="rounded-full bg-[#5b5bd6] px-5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#4c4cc9]">
                Enregistrer
              </button>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
              <LockIcon size={12} /> Stockage local
            </p>
          </div>

          {/* Quotas */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card flex items-center justify-between gap-6 p-6 dark:bg-zinc-900 dark:border-zinc-800">
            <div>
              <h2 className="text-[14.5px] font-bold text-slate-900 dark:text-white">
                Quotas SMS / heure / appareil
              </h2>
              <p className="mt-0.5 text-[12px] text-slate-400">
                Limite appliquée à chaque appareil.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[12px] text-slate-400">SMS par heure</span>
              <input
                value={quotaSms}
                onChange={(e) => setQuotaSms(e.target.value)}
                className={`${inputCls} w-20 text-center font-semibold`}
              />
              <button onClick={() => enregistrerReglage('sms_quota_per_hour', Number(quotaSms))} className="rounded-full bg-[#5b5bd6] px-5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#4c4cc9]">
                Enregistrer
              </button>
            </div>
          </div>

          {/* Expiration */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card flex items-center justify-between gap-6 p-6 dark:bg-zinc-900 dark:border-zinc-800">
            <div>
              <h2 className="text-[14.5px] font-bold text-slate-900 dark:text-white">
                Expiration des tâches en attente
              </h2>
              <p className="mt-0.5 text-[12px] text-slate-400">
                Durée avant abandon d'un envoi.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[12px] text-slate-400">Durée</span>
              <input
                value={dureeExpiration}
                onChange={(e) => setDureeExpiration(e.target.value)}
                className={`${inputCls} w-16 text-center font-semibold`}
              />
              <div className="relative">
                <select
                  value={uniteExpiration}
                  onChange={(e) => setUniteExpiration(e.target.value)}
                  className={`${inputCls} flex items-center gap-1.5 font-semibold appearance-none pr-8`}
                >
                  <option value="heures">heures</option>
                  <option value="jours">jours</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              </div>
              <button onClick={() => enregistrerReglage('max_pending_hours', uniteExpiration === 'jours' ? Number(dureeExpiration) * 24 : Number(dureeExpiration))} className="rounded-full bg-[#5b5bd6] px-5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#4c4cc9]">
                Enregistrer
              </button>
            </div>
          </div>

          {/* Seuil d'alerte */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card flex items-center justify-between gap-6 p-6 dark:bg-zinc-900 dark:border-zinc-800">
            <div>
              <h2 className="text-[14.5px] font-bold text-slate-900 dark:text-white">
                Seuil d'alerte file d'attente
              </h2>
              <p className="mt-0.5 text-[12px] text-slate-400">
                Le tableau de bord affiche une alerte au-delà de ce nombre de tâches en attente.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[12px] text-slate-400">Tâches en attente</span>
              <input
                value={seuilAlerte}
                onChange={(e) => setSeuilAlerte(e.target.value)}
                className={`${inputCls} w-16 text-center font-semibold`}
              />
              <button onClick={() => enregistrerReglage('queue_alert_threshold', Number(seuilAlerte))} className="rounded-full bg-[#5b5bd6] px-5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#4c4cc9]">
                Enregistrer
              </button>
            </div>
          </div>

          {/* Clés API serveur */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800">
            <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">
              Clés API serveur
            </h2>
            <p className="mt-0.5 text-[12px] text-slate-400">
              Créez un accès sécurisé pour une application cliente.
            </p>

            <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Nom du client
            </p>
            <input
              placeholder="Nom du client..."
              value={nomClient}
              onChange={(e) => setNomClient(e.target.value)}
              className={`${inputCls} mt-1.5 w-full`}
            />

            <div className="mt-4 space-y-3">
              {clients.length === 0 && (
                <p className="text-xs text-slate-400 dark:text-zinc-500">Aucune clé API pour le moment.</p>
              )}
              {clients.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 dark:bg-zinc-800/60 dark:border-zinc-700"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-slate-700 dark:text-zinc-200">
                      {c.nom}
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => revelerCle(c.id)} disabled={revelationEnCours === c.id} title={clesRevelees[c.id] ? 'Masquer' : 'Afficher la clé'}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-white hover:text-slate-700 disabled:opacity-50 dark:hover:bg-zinc-700">
                        {revelationEnCours === c.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : clesRevelees[c.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button onClick={() => revoquerClient(c.id, c.nom)} title="Révoquer"
                        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-white hover:text-rose-500 dark:hover:bg-zinc-700">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {clesRevelees[c.id] && (
                    <code className="mt-2 block break-all rounded-lg bg-white px-3 py-2 font-mono text-[11px] text-slate-700 ring-1 ring-slate-200 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-700">
                      {clesRevelees[c.id]}
                    </code>
                  )}
                </div>
              ))}
            </div>

            {cleCreee && (
              <div className="mt-4 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-600/20 dark:bg-amber-500/10">
                <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">Clé créée — copiez-la maintenant (affichée une seule fois) :</p>
                <code className="mt-1 block break-all font-mono text-[11px] text-amber-900 dark:text-amber-200">{cleCreee}</code>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <p className="text-[11px] text-slate-400">
                {clients.length} clés actives — affichées une seule fois à la création.
              </p>
              <button onClick={creerClient} disabled={creationEnCours || !nomClient.trim()} className="inline-flex items-center gap-1.5 rounded-full bg-[#5b5bd6] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#4c4cc9] disabled:opacity-50">
                <Plus className="h-3.5 w-3.5" /> Créer
              </button>
            </div>
          </div>
        </div>

        {/* Colonne droite sticky */}
        <div className="sticky top-24 space-y-4">
          <div className="rounded-[1.5rem] bg-gradient-to-br from-[#332c75] to-[#1f1a52] p-5 text-white shadow-card">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/60">
              État du système
            </p>
            <p className="mt-0.5 text-[11px] text-white/45">
              Santé des services essentiels
            </p>
            <div className="mt-4 space-y-3">
              {!sante && <p className="text-[11px] text-white/45">Vérification en cours…</p>}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[11px] font-semibold text-white/75">
                  <span className={`h-1.5 w-1.5 rounded-full ${!sante || sante.checks.supabase.ok ? 'bg-emerald-400' : 'bg-red-400'}`} /> SUPABASE
                </span>
                <span className="text-[11px] text-white/55">
                  {!sante ? '…' : sante.checks.supabase.ok ? `OK · ${sante.checks.supabase.latency_ms} ms` : 'KO'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[11px] font-semibold text-white/75">
                  <span className={`h-1.5 w-1.5 rounded-full ${!sante || sante.checks.settings_table ? 'bg-emerald-400' : 'bg-red-400'}`} /> TABLE PARAMÈTRES
                </span>
                <span className="text-[11px] text-white/55">{!sante ? '…' : sante.checks.settings_table ? 'présente' : 'absente'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[11px] font-semibold text-white/75">
                  <span className={`h-1.5 w-1.5 rounded-full ${!sante || sante.checks.fcm_configured ? 'bg-emerald-400' : 'bg-amber-400'}`} /> PUSH FCM
                </span>
                <span className="text-[11px] text-white/55">{!sante ? '…' : sante.checks.fcm_configured ? 'configuré' : 'non configuré'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[11px] font-semibold text-white/75">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> API serveur
                </span>
                <span className="text-[11px] text-white/55">{sante ? `v${sante.version}` : '…'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-5 dark:bg-zinc-900 dark:border-zinc-800">
            <p className="text-[13.5px] font-bold text-slate-900 dark:text-white">
              Demandes d'accès
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Validation des nouveaux accès clients
            </p>
            {demandes.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-zinc-800">
                  <UserPlus className="h-5 w-5" />
                </div>
                <p className="mt-3 text-[12px] text-slate-500 dark:text-zinc-400">
                  Aucune demande en attente
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {demandes.map((d) => (
                  <div key={d.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-zinc-700 dark:bg-zinc-800/60">
                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-100">{d.nom}</p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-400">{d.contact} · {d.usage_prevu}</p>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => traiterDemande(d.id, 'valider')}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700">
                        Valider
                      </button>
                      <button onClick={() => traiterDemande(d.id, 'refuser')}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-300">
                        Refuser
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Toast notification={notification} />
    </CoquilleTableauDeBord>
  )
}

function LockIcon({ size }: { size: number }) {
  return <ShieldCheck size={size} />
}
