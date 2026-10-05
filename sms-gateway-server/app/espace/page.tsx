'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Clock, Inbox, Send, List, Link2, Bot, BookOpen, ChevronRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import CoquilleEspace from '../../composants/CoquilleEspace'

interface Moi {
  nom: string
  mois: string
  quota_mensuel: number | null
  utilise_mois: number
  depassement: boolean
  stats: { envoyes: number; attente: number; echoue: number; recus: number }
}

export default function PageEspace() {
  const [moi, setMoi] = useState<Moi | null>(null)

  useEffect(() => {
    fetch('/api/espace/moi')
      .then((r) => r.json())
      .then((d) => { if (d.nom) setMoi(d) })
      .catch(() => null)
  }, [])

  if (!moi) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const pct = moi.quota_mensuel
    ? Math.min(100, Math.round((moi.utilise_mois / moi.quota_mensuel) * 100))
    : 0

  return (
    <CoquilleEspace>
      {/* En-tête client */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Bonjour, {moi.nom}</h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400">Consommation et statistiques pour le mois de {moi.mois}.</p>
      </div>

      {/* 4 cartes KPI Client */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {/* SMS envoyés */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">SMS envoyés</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{moi.stats.envoyes}</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">Traités avec succès</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* En file d'attente */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">En file d'attente</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{moi.stats.attente}</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">En cours d'expédition</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Échecs */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Échecs</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{moi.stats.echoue}</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">Non distribués</p>
            </div>
            <div className="rounded-xl bg-red-50 p-2.5 text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* SMS reçus */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">SMS reçus</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{moi.stats.recus}</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">Réponses répertoriées</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <Inbox className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Carte Quota mensuel */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Quota mensuel de consommation</h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500">Consommation et limite de votre compte client</p>
          </div>
          <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
            {moi.utilise_mois} / {moi.quota_mensuel ?? '∞'} SMS
          </span>
        </div>

        {moi.quota_mensuel !== null ? (
          <div className="mt-4">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
              <div
                className={`h-full rounded-full transition-all ${
                  pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-600'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {moi.depassement && (
              <p className="mt-3 text-xs font-semibold text-red-600 dark:text-red-400">
                Quota atteint : vos prochains envois seront refusés jusqu'au mois prochain. Demandez une augmentation au besoin.
              </p>
            )}
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-400 dark:text-zinc-500">Consommation illimitée accordée par votre administrateur.</p>
        )}
      </div>

      {/* Raccourcis rapide des fonctionnalités client */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { href: '/espace/envoyer', icone: <Send className="h-5 w-5 text-blue-600" />, titre: 'Envoyer un SMS', texte: 'Diffuser un message unique ou en nombre' },
          { href: '/espace/envois', icone: <List className="h-5 w-5 text-slate-600 dark:text-zinc-300" />, titre: 'Mes envois', texte: 'Suivre le statut des SMS expédiés' },
          { href: '/espace/entrees', icone: <Inbox className="h-5 w-5 text-emerald-600" />, titre: 'SMS reçus', texte: 'Consulter les réponses de vos clients' },
          { href: '/espace/liens', icone: <Link2 className="h-5 w-5 text-indigo-600" />, titre: 'Liens intelligents', texte: 'Suivre les clics sur vos liens courts' },
          { href: '/espace/automatismes', icone: <Bot className="h-5 w-5 text-amber-600" />, titre: 'Automatismes', texte: 'Définir vos mots-clés et réponses auto' },
          { href: '/espace/api', icone: <BookOpen className="h-5 w-5 text-slate-600 dark:text-zinc-300" />, titre: 'Documentation API', texte: 'Guide d\'intégration cURL & Webhooks' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 transition hover:border-blue-500/50 hover:shadow-md dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-blue-500/40"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 dark:bg-zinc-800">
              {item.icone}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.titre}</p>
              <p className="text-xs text-slate-400 dark:text-zinc-500 truncate">{item.texte}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 dark:text-zinc-600" />
          </Link>
        ))}
      </div>
    </CoquilleEspace>
  )
}
