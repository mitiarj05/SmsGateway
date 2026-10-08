'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Send, Inbox, AlertTriangle, CheckCircle2, ArrowRight, XCircle,
  Sparkles, Smartphone, Plus, Link2, Zap, ArrowUpRight, Clock,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import CoquilleEspace from '../../composants/CoquilleEspace'
import GraphiqueRythme from '../../composants/GraphiqueRythme'
import CompteurValeur from '../../composants/CompteurValeur'

interface Moi {
  nom: string
  mois: string
  quota_mensuel: number | null
  utilise_mois: number
  depassement: boolean
  stats: { envoyes: number; attente: number; echoue: number; recus: number }
}

interface Tache {
  id: string
  numero_destinataire: string
  contenu: string
  statut: string
  date_creation: string
}

interface Entrant {
  id: string
  expediteur: string
  contenu: string
  date_reception: string
}

interface Appareil {
  id: string
  nom: string
  statut: string
  sms_last_hour: number
  derniere_activite: string | null
}

function tempsEcouleFr(dateIso: string | null): string {
  if (!dateIso) return '—'
  const s = Math.floor((Date.now() - new Date(dateIso).getTime()) / 1000)
  if (s < 60) return "il y a moins d'1 min"
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`
  return new Date(dateIso).toLocaleDateString('fr-FR')
}

export default function PageTableauDeBordClient() {
  const [moi, setMoi] = useState<Moi | null>(null)
  const [taches, setTaches] = useState<Tache[]>([])
  const [entrants, setEntrants] = useState<Entrant[]>([])
  const [appareils, setAppareils] = useState<Appareil[]>([])

  useEffect(() => {
    let annule = false
    async function charger() {
      try {
        const [rMoi, rEnvois, rEntrees, rApp] = await Promise.all([
          fetch('/api/espace/moi'),
          fetch('/api/espace/envois?limit=200'),
          fetch('/api/espace/entrees?limit=200'),
          fetch('/api/espace/appareils'),
        ])
        const [dMoi, dEnvois, dEntrees, dApp] = await Promise.all([
          rMoi.json().catch(() => ({})),
          rEnvois.json().catch(() => ({})),
          rEntrees.json().catch(() => ({})),
          rApp.json().catch(() => ({})),
        ])
        if (annule) return
        if (dMoi?.nom) setMoi(dMoi)
        if (Array.isArray(dEnvois.taches)) setTaches(dEnvois.taches)
        if (Array.isArray(dEntrees.entrants)) setEntrants(dEntrees.entrants)
        if (Array.isArray(dApp.appareils)) setAppareils(dApp.appareils)
      } catch { /* silencieux */ }
    }
    charger()
    const i = setInterval(charger, 15000)
    return () => { annule = true; clearInterval(i) }
  }, [])

  const dateAujourdhui = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const [periode, setPeriode] = useState('7j')

  // Tranches sur la période : 24h → 12×2h, 7j → 7×1j, 30j → 30×1j.
  const { points, totalPeriode, moyennePeriode, etiquettePeriode } = (() => {
    const config = periode === '24h'
      ? { nb: 12, pasMs: 2 * 3600_000 }
      : { nb: periode === '30j' ? 30 : 7, pasMs: 86400_000 }
    const maintenant = Date.now()
    const pts = Array.from({ length: config.nb }, (_, k) => {
      const i = config.nb - 1 - k
      const fin = maintenant - i * config.pasMs
      const debut = fin - config.pasMs
      const heure = periode === '24h'
        ? new Date(fin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        : new Date(fin).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
      const envoyes = taches.filter((t) => {
        const h = new Date(t.date_creation).getTime()
        return h >= debut && h < fin
      }).length
      const recus = entrants.filter((e) => {
        const h = new Date(e.date_reception).getTime()
        return h >= debut && h < fin
      }).length
      return { heure, envoyes, recus }
    })
    const total = pts.reduce((s, p) => s + p.envoyes + p.recus, 0)
    return {
      points: pts,
      totalPeriode: total,
      moyennePeriode: Math.round(total / config.nb),
      etiquettePeriode: periode === '24h' ? '24 dernières heures' : periode === '30j' ? '30 derniers jours' : '7 derniers jours',
    }
  })()

  interface Evenement {
    id: string
    icone: LucideIcon
    iconBg: string
    title: string
    sub: string
    time: string
  }
  const evenements: Evenement[] = [
    ...taches.filter((t) => t.statut === 'ENVOYE').slice(0, 2).map(
      (t): Evenement => ({
        id: `t-${t.id}`,
        icone: CheckCircle2,
        iconBg: 'bg-emerald-100 text-emerald-600',
        title: `SMS remis à ${t.numero_destinataire}`,
        sub: t.contenu.length > 40 ? `${t.contenu.slice(0, 40)}…` : t.contenu,
        time: tempsEcouleFr(t.date_creation),
      })
    ),
    ...entrants.slice(0, 2).map(
      (e): Evenement => ({
        id: `r-${e.id}`,
        icone: Inbox,
        iconBg: 'bg-amber-100 text-amber-600',
        title: `Réponse reçue de ${e.expediteur}`,
        sub: e.contenu.length > 40 ? `${e.contenu.slice(0, 40)}…` : e.contenu,
        time: tempsEcouleFr(e.date_reception),
      })
    ),
  ].slice(0, 4)

  const premierAppareil = appareils[0] ?? null
  const pctQuota = moi?.quota_mensuel
    ? Math.min(100, Math.round((moi.utilise_mois / moi.quota_mensuel) * 100))
    : 0

  return (
    <CoquilleEspace>
      {/* En-tête (Exact Screenshot 9) */}
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white">
            Bonjour, {moi?.nom ?? '…'}
          </h1>
          <p className="mt-1 text-[13.5px] text-slate-500 dark:text-zinc-400">
            Votre activité SMS, en un regard.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Nous sommes le</p>
            <p className="mt-0.5 text-[13px] font-bold text-slate-800 dark:text-white capitalize">{dateAujourdhui}</p>
          </div>
          <Link
            href="/espace/envoyer"
            className="inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-indigo-300/45 hover:bg-[#1D4ED8] transition"
          >
            <Plus className="h-4 w-4" /> Nouveau SMS
          </Link>
        </div>
      </div>

      {/* Banner de statut */}
      {moi?.depassement ? (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200/80 bg-red-50/70 p-4 text-xs font-semibold text-red-900 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300">
          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
          <span>Quota mensuel atteint — vos envois sont refusés jusqu'au mois prochain.</span>
        </div>
      ) : (moi?.stats.attente ?? 0) > 0 ? (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 text-xs font-semibold text-amber-900 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>{moi?.stats.attente} message{(moi?.stats.attente ?? 0) > 1 ? 's' : ''} en file d'attente.</span>
        </div>
      ) : (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4 text-xs font-semibold text-emerald-900 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Tout est en ordre — aucun message en attente.</span>
        </div>
      )}

      {/* 4 KPI Cards (Exact Screenshot 9) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1 */}
        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">SMS ENVOYÉS</p>
          <p className="text-[30px] font-extrabold leading-none text-slate-900 dark:text-white">{moi ? <CompteurValeur valeur={moi.stats.envoyes} /> : '…'}</p>
          <p className="text-[11.5px] text-slate-400">Traités avec succès</p>
        </div>

        {/* Card 2 */}
        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">EN FILE D'ATTENTE</p>
          <p className="text-[30px] font-extrabold leading-none text-slate-900 dark:text-white">{moi ? <CompteurValeur valeur={moi.stats.attente} /> : '…'}</p>
          <p className="text-[11.5px] text-slate-400">En cours d'expédition</p>
        </div>

        {/* Card 3 */}
        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">ÉCHECS</p>
          <p className="text-[30px] font-extrabold leading-none text-rose-600 dark:text-rose-400">{moi ? <CompteurValeur valeur={moi.stats.echoue} /> : '…'}</p>
          <p className="text-[11.5px] text-slate-400">Non distribués</p>
        </div>

        {/* Card 4 */}
        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">SMS REÇUS</p>
          <p className="text-[30px] font-extrabold leading-none text-slate-900 dark:text-white">{moi ? <CompteurValeur valeur={moi.stats.recus} /> : '…'}</p>
          <p className="text-[11.5px] text-slate-400">Réponses répertoriées</p>
        </div>
      </div>

      {/* Middle Grid (Exact Screenshot 9) */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">

        {/* Left Chart Card (2 cols) : même graphique que l'admin */}
        <GraphiqueRythme
          titre="Rythme d'envoi"
          sousTitre={`${totalPeriode} messages · moy. ${moyennePeriode}/tranche · ${etiquettePeriode}`}
          periode={etiquettePeriode}
          series={[
            {
              cle: 'envoyes',
              libelle: 'SMS envoyés',
              couleurLigne: '#BFDBFE',
              couleurPoint: '#8a8ade',
              couleurDebut: '#8a8ade',
              points: points.map((p) => ({ heure: p.heure, valeur: p.envoyes })),
            },
            {
              cle: 'recus',
              libelle: 'SMS reçus',
              couleurLigne: '#6ee7b7',
              couleurPoint: '#34d399',
              couleurDebut: '#34d399',
              points: points.map((p) => ({ heure: p.heure, valeur: p.recus })),
            },
          ]}
          texteVide="Aucune activité sur la période"
          sousTexteVide="Vos envois apparaîtront ici."
          optionsPeriode={[
            { id: '24h', etiquette: '24 dernières heures' },
            { id: '7j', etiquette: '7 derniers jours' },
            { id: '30j', etiquette: '30 derniers jours' },
          ]}
          periodeActive={periode}
          onChangementPeriode={setPeriode}
        />

        {/* Right Dark Card : MON PARC D'ENVOI (Exact Screenshot 9) */}
        <div className="rounded-[1.5rem] bg-gradient-to-br from-[#332c75] to-[#1f1a52] p-6 text-white shadow-card flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/60">
              MON PARC D'ENVOI
            </p>
            <Smartphone className="h-4 w-4 text-white/50" />
          </div>

          {premierAppareil ? (
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                  <Smartphone size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold">{premierAppareil.nom}</p>
                  <p className="text-[11px] text-white/50">
                    {premierAppareil.sms_last_hour ?? 0} SMS/h · {tempsEcouleFr(premierAppareil.derniere_activite)}
                  </p>
                </div>
              </div>
              {premierAppareil.statut === 'EN_LIGNE' ? (
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                  ● En ligne
                </span>
              ) : (
                <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-500/30">
                  ● Hors ligne
                </span>
              )}
            </div>
          ) : (
            <p className="py-4 text-center text-[12px] text-white/55">Aucun téléphone visible pour le moment.</p>
          )}

          <Link href="/espace/appareils" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-white hover:underline pt-2">
            Voir le parc <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

      </div>

      {/* Bottom Grid (Exact Screenshot 9) */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">

        {/* Derniers événements (2 cols) */}
        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">Derniers événements</h2>
              <p className="mt-0.5 text-[12px] text-slate-400">Envois et réponses récents</p>
            </div>
            <span className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> En direct
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-zinc-800 pt-2">
            {evenements.length === 0 && (
              <p className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
                Aucun événement pour le moment.
              </p>
            )}
            {evenements.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${ev.iconBg}`}>
                    <ev.icone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-800 dark:text-zinc-200">{ev.title}</p>
                    <p className="text-[11px] text-slate-400">{ev.sub}</p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400">{ev.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {/* Card Quota mensuel */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 dark:text-white">Quota mensuel</span>
              <span className="font-bold text-slate-800 dark:text-zinc-200">
                {moi ? `${moi.utilise_mois} / ${moi.quota_mensuel ?? '∞'} SMS` : '…'}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
              <div className="h-full rounded-full bg-cyan-400" style={{ width: `${pctQuota}%` }} />
            </div>
            <p className="text-[11px] text-slate-400">Consommation et limite de votre compte client</p>
          </div>

          {/* Card Actions rapides */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-3">
            <p className="text-xs font-bold text-slate-900 dark:text-white">Actions rapides</p>
            <div className="space-y-2 text-xs font-semibold">
              <Link href="/espace/envoyer" className="flex items-center gap-2 text-blue-600 hover:underline dark:text-blue-400">
                <Send className="h-3.5 w-3.5" /> Envoyer un SMS
              </Link>
              <Link href="/espace/liens" className="flex items-center gap-2 text-blue-600 hover:underline dark:text-blue-400">
                <Link2 className="h-3.5 w-3.5" /> Créer un lien intelligent
              </Link>
              <Link href="/espace/notifications" className="flex items-center gap-2 text-blue-600 hover:underline dark:text-blue-400">
                <Zap className="h-3.5 w-3.5" /> Connecter ma boutique
              </Link>
            </div>
          </div>
        </div>

      </div>
    </CoquilleEspace>
  )
}
