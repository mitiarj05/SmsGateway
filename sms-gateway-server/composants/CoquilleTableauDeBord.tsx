'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import {
  Smartphone, Inbox, History, Settings, LayoutGrid, Users,
  Moon, Sun, Bell, Search, AlertTriangle, X, Receipt, MoreHorizontal, ArrowUpRight
} from 'lucide-react'
import { Modale } from './interface'
import { useTheme } from '../lib/use-theme'

const NAVIGATION_ADMIN = [
  { href: '/dashboard', icone: LayoutGrid, etiquette: 'Vue d\'ensemble' },
  { href: '/devices', icone: Smartphone, etiquette: 'Appareils' },
  { href: '/queue', icone: Inbox, etiquette: 'File d’attente', pastille: true },
  { href: '/inbox', icone: Inbox, etiquette: 'SMS reçus' },
  { href: '/history', icone: History, etiquette: 'Historique' },
  { href: '/clients', icone: Users, etiquette: 'Clients' },
  { href: '/facturation', icone: Receipt, etiquette: 'Facturation et quotas' },
]

const NAVIGATION_CONFIG = [
  { href: '/settings', icone: Settings, etiquette: 'Paramètres' },
]

export default function CoquilleTableauDeBord({ children }: {
  titre?: string; sousTitre?: string; actions?: React.ReactNode; children: React.ReactNode
}) {
  const chemin = usePathname()

  const { modeSombre, monte, basculerTheme } = useTheme()

  const [enAttente, setEnAttente] = useState(0)
  const [echoues, setEchoues] = useState(0)
  const [seuilFile, setSeuilFile] = useState(10)
  const [banniereIgnoreePour, setBanniereIgnoreePour] = useState<number | null>(null)

  const [marquesLues, setMarquesLues] = useState(() => {
    if (typeof window === 'undefined') return { queue: 0, echoues: 0 }
    try {
      const brut = localStorage.getItem('smsika-notif-lue')
      if (brut) {
        const parsed = JSON.parse(brut)
        return {
          queue: typeof parsed.queue === 'number' ? parsed.queue : 0,
          echoues: typeof parsed.echoues === 'number' ? parsed.echoues : 0,
        }
      }
    } catch { /* défaut */ }
    return { queue: 0, echoues: 0 }
  })

  useEffect(() => {
    localStorage.setItem('smsika-notif-lue', JSON.stringify(marquesLues))
  }, [marquesLues])

  function marquerLu(laquelle: 'queue' | 'echoues' | 'all') {
    setMarquesLues((precedent) => ({
      queue: laquelle === 'echoues' ? precedent.queue : enAttente,
      echoues: laquelle === 'queue' ? precedent.echoues : echoues,
    }))
  }
  const [clocheOuverte, setClocheOuverte] = useState(false)
  const [paletteOuverte, setPaletteOuverte] = useState(false)
  const [requete, setRequete] = useState('')

  const chargerAlertes = useCallback(async () => {
    try {
      const [statRes, setRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/settings'),
      ])
      const statData = await statRes.json()
      if (statData.stats) {
        setEnAttente(statData.stats.tasks_pending ?? 0)
        setEchoues(statData.stats.tasks_failed ?? 0)
      }
      if (setRes.ok) {
        const setData = await setRes.json()
        if (typeof setData.settings?.queue_alert_threshold === 'number') {
          setSeuilFile(setData.settings.queue_alert_threshold)
        }
      }
    } catch { /* silencieux */ }
  }, [])

  useEffect(() => {
    chargerAlertes()
    const i = setInterval(chargerAlertes, 10000)
    return () => clearInterval(i)
  }, [chargerAlertes])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOuverte((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function deconnexion() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      window.location.href = '/login'
    }
  }

  const resultatsRecherche = [...NAVIGATION_ADMIN, ...NAVIGATION_CONFIG].filter((n) => n.etiquette.toLowerCase().includes(requete.toLowerCase()))
  const alerteFile = enAttente >= seuilFile
  const fileNonLue = alerteFile && enAttente > marquesLues.queue
  const echecsNonLus = echoues > marquesLues.echoues
  const compteAlertes = (fileNonLue ? 1 : 0) + (echecsNonLus ? 1 : 0)
  const alerteActive = alerteFile || echoues > 0

  return (
    <div className="flex min-h-screen bg-[#f3f4f8] text-slate-800 dark:bg-[#0B0F19] dark:text-zinc-100 antialiased font-sans transition-colors duration-200">

      {/* SIDEBAR EXACT TEMPLATE MATCH (PURPLE/NAVY GRADIENT) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[240px] flex-col bg-gradient-to-b from-[#2b2663] to-[#1d1947] px-4 py-5 text-white md:flex justify-between border-r border-indigo-950/30">
        <div>
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 px-2" title="Tableau de bord">
            <Image src="/smsika.png" alt="SMSIKA" width={36} height={36} className="rounded-xl shrink-0 shadow-xs" />
            <div className="leading-tight">
              <p className="text-[15px] font-extrabold tracking-wide text-white">SMSIKA</p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-white/50">
                CONSOLE ADMIN
              </p>
            </div>
          </Link>

          <p className="mb-2 mt-7 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
            Espace admin
          </p>

          {/* Navigation Admin */}
          <nav className="flex flex-col gap-1">
            {NAVIGATION_ADMIN.map(({ href, etiquette, icone: Icon, pastille }) => {
              const active = chemin === href || (href !== '/devices' && chemin.startsWith(href + '/'))
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] transition-colors ${
                    active
                      ? 'bg-white font-semibold text-[#2b2663] shadow-lg shadow-indigo-950/30'
                      : 'text-white/65 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={17} className={active ? 'text-[#2b2663]' : 'text-white/65'} />
                  <span className="flex-1">{etiquette}</span>
                  {pastille && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        active ? 'bg-[#2b2663]/10 text-[#2b2663]' : 'bg-white/15 text-white/70'
                      }`}
                    >
                      {enAttente}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          <p className="mb-2 mt-6 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
            Configuration
          </p>

          {/* Navigation Config */}
          <nav className="flex flex-col gap-1">
            {NAVIGATION_CONFIG.map(({ href, etiquette, icone: Icon }) => {
              const active = chemin === href || chemin.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] transition-colors ${
                    active
                      ? 'bg-white font-semibold text-[#2b2663] shadow-lg shadow-indigo-950/30'
                      : 'text-white/65 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={17} className={active ? 'text-[#2b2663]' : 'text-white/65'} />
                  <span className="flex-1">{etiquette}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Bottom Section : Aide & Utilisateur */}
        <div>
          {/* Card Aide */}
          <div className="rounded-2xl bg-white/10 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/25 text-sm font-bold text-white/80">
              ?
            </div>
            <p className="mt-2.5 text-[13px] font-bold text-white">Besoin d'aide ?</p>
            <p className="mt-1 text-[11px] leading-relaxed text-white/55">
              Consultez la documentation ou contactez le support.
            </p>
            <a
              href="/espace/api"
              className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-semibold text-[#a5a5f5] hover:underline"
            >
              Centre d'aide <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Utilisateur */}
          <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#8b8bf0] to-[#5b5bd6] text-[13px] font-bold text-white">
              A
            </div>
            <div className="flex-1 leading-tight">
              <p className="text-[13px] font-semibold text-white">Administrateur</p>
              <p className="text-[11px] text-white/50">Session locale</p>
            </div>
            <button onClick={deconnexion} className="text-white/40 hover:text-white" title="Options">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <div className="flex-1 md:pl-[240px] flex flex-col justify-between min-h-screen">
        <div>
          {/* TOPBAR HEADER EXACT TEMPLATE MATCH */}
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/60 bg-[#f3f4f8]/80 px-8 backdrop-blur dark:border-zinc-800/80 dark:bg-[#0B0F19]/80">
            <div className="flex items-center gap-2 text-[13px]">
              <span className="font-semibold text-slate-800 dark:text-zinc-200">Console</span>
              <span className="text-slate-400">&gt;</span>
              <span className="text-slate-500 dark:text-zinc-400">
                {[...NAVIGATION_ADMIN, ...NAVIGATION_CONFIG].find((n) => chemin.startsWith(n.href))?.etiquette || 'Vue d\'ensemble'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Badge Statut Services Stables */}
              <div className="flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[12px] font-medium text-slate-600 shadow-sm border border-slate-100 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                Services stables
                <span className="text-slate-300">·</span>
                <span className="font-semibold text-slate-800 dark:text-white">v2.4.1</span>
              </div>

              {/* Barre de recherche */}
              <div
                onClick={() => setPaletteOuverte(true)}
                className="hidden cursor-pointer items-center gap-2.5 rounded-full bg-white px-4 py-2 text-[13px] text-slate-400 shadow-sm border border-slate-100 md:flex md:w-64 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400"
              >
                <Search className="h-4 w-4" />
                <span className="flex-1">Rechercher...</span>
                <kbd className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-zinc-700 dark:text-zinc-300">
                  ⌘ K
                </kbd>
              </div>

              {/* Cloche */}
              <div className="relative">
                <button
                  onClick={() => setClocheOuverte(!clocheOuverte)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm border border-slate-100 hover:text-slate-800 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
                >
                  <Bell className="h-4 w-4" />
                  {compteAlertes > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                      {compteAlertes}
                    </span>
                  )}
                </button>
                {clocheOuverte && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
                    <div className="flex items-center justify-between px-2 py-1.5">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Notifications</p>
                      {compteAlertes > 0 && (
                        <button onClick={() => marquerLu('all')}
                          className="text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400">
                          Tout marquer comme lu
                        </button>
                      )}
                    </div>
                    {!alerteActive ? (
                      <p className="px-2 py-3 text-xs text-slate-400 dark:text-zinc-400">Aucune alerte. Tout va bien.</p>
                    ) : (
                      <>
                        {alerteFile && (
                          <Link href="/queue" onClick={() => { marquerLu('queue'); setClocheOuverte(false) }}
                            className={`flex items-start gap-2.5 rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-zinc-800 ${fileNonLue ? '' : 'opacity-60'}`}>
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                            <span className="text-xs text-slate-600 dark:text-zinc-300">
                              <b>{enAttente} SMS en attente</b> — file au-delà du seuil de {seuilFile}.
                            </span>
                          </Link>
                        )}
                        {echoues > 0 && (
                          <Link href="/history" onClick={() => { marquerLu('echoues'); setClocheOuverte(false) }}
                            className={`flex items-start gap-2.5 rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-zinc-800 ${echecsNonLus ? '' : 'opacity-60'}`}>
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                            <span className="text-xs text-slate-600 dark:text-zinc-300">
                              <b>{echoues} échec(s)</b> à traiter dans l&apos;historique.
                            </span>
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Thème */}
              <button
                onClick={basculerTheme}
                title={!monte ? 'Thème' : modeSombre ? 'Mode clair' : 'Mode sombre'}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm border border-slate-100 hover:text-slate-800 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
              >
                {!monte || !modeSombre ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>
            </div>
          </header>

          {/* Navigation mobile */}
          <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 md:hidden dark:border-zinc-800 dark:bg-zinc-900">
            {[...NAVIGATION_ADMIN, ...NAVIGATION_CONFIG].map((item) => {
              const actif = chemin === item.href || (item.href !== '/devices' && chemin.startsWith(item.href + '/'))
              return (
                <Link key={item.href} href={item.href}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                    actif
                      ? 'bg-[#2b2663] text-white'
                      : 'text-slate-500 dark:text-zinc-400'
                  }`}>
                  <item.icone className="h-3.5 w-3.5" />
                  {item.etiquette}
                </Link>
              )
            })}
          </nav>

          <div className="p-8 space-y-6">{children}</div>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between border-t border-slate-200/80 px-8 py-4 text-[11px] text-slate-400 dark:border-zinc-800/80 dark:text-zinc-500">
          <span>© 2025 SMSika Gateway</span>
          <div className="flex items-center gap-3">
            <a href="/settings" className="hover:underline">État des services</a>
            <span>·</span>
            <a href="/espace/api" className="hover:underline">Guide API</a>
            <span>·</span>
            <a href="mailto:support@smsika.app" className="hover:underline text-[#5b5bd6] dark:text-blue-400 font-semibold">Écrire au support ↗</a>
          </div>
        </footer>
      </div>

      {/* Palette Ctrl+K */}
      <Modale ouvert={paletteOuverte} onFermer={() => setPaletteOuverte(false)} titre="Navigation" sousTitre="Tapez pour filtrer les pages">
        <input autoFocus type="text" placeholder="Rechercher une page…" value={requete}
          onChange={(e) => setRequete(e.target.value)}
          className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
        <div className="space-y-1">
          {resultatsRecherche.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => { setPaletteOuverte(false); setRequete('') }}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:text-zinc-300 dark:hover:bg-zinc-800">
              <n.icone className="h-4 w-4" /> {n.etiquette}
            </Link>
          ))}
          {resultatsRecherche.length === 0 && <p className="px-3 py-2 text-xs text-slate-400 dark:text-zinc-400">Aucune page trouvée.</p>}
        </div>
      </Modale>
    </div>
  )
}
