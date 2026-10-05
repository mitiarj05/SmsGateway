'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import {
  Smartphone, Inbox, History, Settings, LayoutGrid, Users,
  Moon, Sun, Bell, Search, AlertTriangle, X, Receipt, MoreHorizontal, HelpCircle,
} from 'lucide-react'
import { Modale } from './interface'
import { useTheme } from '../lib/use-theme'

const NAVIGATION = [
  { href: '/dashboard', icone: LayoutGrid, etiquette: 'Tableau de bord' },
  { href: '/devices', icone: Smartphone, etiquette: 'Appareils' },
  { href: '/queue', icone: Inbox, etiquette: 'File d’attente' },
  { href: '/inbox', icone: Inbox, etiquette: 'Réception' },
  { href: '/clients', icone: Users, etiquette: 'Clients' },
  { href: '/facturation', icone: Receipt, etiquette: 'Facturation' },
  { href: '/history', icone: History, etiquette: 'Historique' },
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

  const resultatsRecherche = NAVIGATION.filter((n) => n.etiquette.toLowerCase().includes(requete.toLowerCase()))
  const alerteFile = enAttente >= seuilFile
  const fileNonLue = alerteFile && enAttente > marquesLues.queue
  const echecsNonLus = echoues > marquesLues.echoues
  const compteAlertes = (fileNonLue ? 1 : 0) + (echecsNonLus ? 1 : 0)
  const alerteActive = alerteFile || echoues > 0
  const afficherBanniere = alerteFile && banniereIgnoreePour !== enAttente

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-800 dark:bg-[#0B0F19] dark:text-zinc-100 antialiased font-sans transition-colors duration-200">
      {/* SIDEBAR SOMBRE HARMONIEUSE */}
      <aside className="hidden w-64 flex-col bg-[#0B0F19] text-zinc-300 md:flex border-r border-zinc-800/80 shrink-0">
        <div className="flex h-16 items-center gap-3 border-b border-zinc-800/80 px-5">
          <Link href="/dashboard" className="flex items-center gap-3" title="Tableau de bord">
            <Image src="/smsika.png" alt="SMSIKA" width={36} height={36} className="rounded-xl shrink-0 shadow-xs" />
            <div>
              <p className="text-sm font-bold text-white tracking-tight">SMSIKA</p>
              <p className="text-[11px] text-zinc-400 font-medium">Console SMS</p>
            </div>
          </Link>
        </div>

        <div className="px-5 pt-5 pb-2">
          <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Espace de travail</p>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAVIGATION.map((item) => {
            const active = chemin === item.href ||
              (item.href !== '/devices' && chemin.startsWith(item.href + '/'))
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition ${
                  active
                    ? 'bg-[#1E293B] text-white shadow-sm font-semibold'
                    : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                }`}>
                <item.icone className={`h-4 w-4 ${active ? 'text-blue-400' : 'text-zinc-400'}`} />
                <span>{item.etiquette}</span>
                {item.href === '/queue' && enAttente > 0 && (
                  <span className="ml-auto rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                    {enAttente}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Card statut systèmes */}
        <div className="px-3 py-2">
          <div className="rounded-xl bg-[#131926] p-3 border border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <p className="text-xs font-semibold text-zinc-200">Systèmes opérationnels</p>
            </div>
            <p className="mt-1 text-[11px] text-zinc-400">SMSIKA v2.4.1</p>
          </div>
        </div>

        {/* Utilisateur en bas */}
        <div className="border-t border-zinc-800/80 p-3">
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 font-bold text-xs text-white">
                A
              </div>
              <div>
                <p className="text-xs font-bold text-white">Administrateur</p>
                <p className="text-[11px] text-zinc-400">Session locale</p>
              </div>
            </div>
            <button onClick={deconnexion} className="text-zinc-400 hover:text-white transition" title="Déconnexion">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-8 backdrop-blur dark:border-zinc-800/80 dark:bg-[#0B0F19]/80">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-zinc-400">
            <span>Espace SMSIKA</span>
            <span>/</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Production
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Barre de recherche Ctrl+K */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Rechercher..." readOnly onClick={() => setPaletteOuverte(true)}
                className="w-56 cursor-pointer rounded-xl border border-slate-200/80 bg-slate-50/80 py-1.5 pl-8 pr-12 text-xs text-slate-700 placeholder-slate-400 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300" />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 shadow-2xs">⌘ K</kbd>
            </div>

            {/* Cloche de notifications */}
            <div className="relative">
              <button onClick={() => setClocheOuverte(!clocheOuverte)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 shadow-xs hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
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

            {/* Bouton aide */}
            <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 shadow-xs hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
              <HelpCircle className="h-4 w-4" />
            </button>

            {/* Bascule thème */}
            <button onClick={basculerTheme} title={!monte ? 'Thème' : modeSombre ? 'Mode clair' : 'Mode sombre'}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 shadow-xs hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
              {!monte || !modeSombre ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Navigation mobile */}
        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 md:hidden dark:border-zinc-800 dark:bg-zinc-900">
          {NAVIGATION.map((item) => {
            const actif = chemin === item.href ||
              (item.href !== '/devices' && chemin.startsWith(item.href + '/'))
            return (
              <Link key={item.href} href={item.href}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                  actif
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                    : 'text-slate-500 dark:text-zinc-400'
                }`}>
                <item.icone className="h-3.5 w-3.5" />
                {item.etiquette}
              </Link>
            )
          })}
        </nav>

        {/* Bannière alerte */}
        {afficherBanniere && (
          <div className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-8 py-2.5 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="flex-1">
              <b>{enAttente} SMS en attente</b> — aucun appareil ne prend les tâches. Vérifiez vos téléphones.
            </span>
            <Link href="/queue" className="text-xs font-bold underline">Voir la file</Link>
            <button onClick={() => setBanniereIgnoreePour(enAttente)} className="text-amber-500 hover:text-amber-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="p-8 space-y-6">{children}</div>
      </main>

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
