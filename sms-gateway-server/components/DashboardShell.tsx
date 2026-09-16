'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import {
  MessageSquare, Smartphone, Inbox, History, Settings, LayoutDashboard,
  Moon, Sun, ChevronRight, Bell, LogOut, Search, AlertTriangle, X,
} from 'lucide-react'
import { Modal } from './ui'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { href: '/devices', icon: Smartphone, label: 'Appareils' },
  { href: '/queue', icon: Inbox, label: 'File d’attente' },
  { href: '/history', icon: History, label: 'Historique' },
  { href: '/settings', icon: Settings, label: 'Paramètres' },
]

export default function DashboardShell({ title, subtitle, actions, children }: {
  title: string; subtitle?: string; actions?: React.ReactNode; children: React.ReactNode
}) {
  const pathname = usePathname()

  /* Thème : source unique = localStorage, lu une fois (jamais réécrit au montage). */
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false
    const saved = localStorage.getItem('sms-gateway-theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  /* mounted : évite le mismatch d'hydratation (le serveur rend toujours la version claire). */
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode, mounted])

  function toggleTheme() {
    setDarkMode((prev) => {
      const next = !prev
      localStorage.setItem('sms-gateway-theme', next ? 'dark' : 'light')
      return next
    })
  }

  const [pending, setPending] = useState(0)
  const [failed, setFailed] = useState(0)
  const [queueThreshold, setQueueThreshold] = useState(10)
  const [bannerDismissedFor, setBannerDismissedFor] = useState<number | null>(null)

  /* Filigrane lu/non-lu : une alerte lue ne revient que si son compteur augmente. */
  const [readMarks, setReadMarks] = useState(() => {
    if (typeof window === 'undefined') return { queue: 0, failed: 0 }
    try {
      const raw = localStorage.getItem('sms-gateway-notif-read')
      if (raw) {
        const parsed = JSON.parse(raw)
        return {
          queue: typeof parsed.queue === 'number' ? parsed.queue : 0,
          failed: typeof parsed.failed === 'number' ? parsed.failed : 0,
        }
      }
    } catch { /* défaut ci-dessous */ }
    return { queue: 0, failed: 0 }
  })

  useEffect(() => {
    localStorage.setItem('sms-gateway-notif-read', JSON.stringify(readMarks))
  }, [readMarks])

  function markRead(which: 'queue' | 'failed' | 'all') {
    setReadMarks((prev) => ({
      queue: which === 'failed' ? prev.queue : pending,
      failed: which === 'queue' ? prev.failed : failed,
    }))
  }
  const [bellOpen, setBellOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [query, setQuery] = useState('')

  /* Polling stats + seuil pour la cloche et la bannière */
  const fetchAlerts = useCallback(async () => {
    try {
      const [statRes, setRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/settings'),
      ])
      const statData = await statRes.json()
      if (statData.stats) {
        setPending(statData.stats.tasks_pending ?? 0)
        setFailed(statData.stats.tasks_failed ?? 0)
      }
      if (setRes.ok) {
        const setData = await setRes.json()
        if (typeof setData.settings?.queue_alert_threshold === 'number') {
          setQueueThreshold(setData.settings.queue_alert_threshold)
        }
      }
    } catch { /* silencieux */ }
  }, [])

  useEffect(() => {
    fetchAlerts()
    const i = setInterval(fetchAlerts, 10000)
    return () => clearInterval(i)
  }, [fetchAlerts])

  /* Ctrl+K : palette de navigation */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      window.location.href = '/login'
    }
  }

  const paletteResults = NAV.filter((n) => n.label.toLowerCase().includes(query.toLowerCase()))
  const queueAlert = pending >= queueThreshold
  const unreadQueue = queueAlert && pending > readMarks.queue
  const unreadFailed = failed > readMarks.failed
  const alertCount = (unreadQueue ? 1 : 0) + (unreadFailed ? 1 : 0)
  const hasActiveAlert = queueAlert || failed > 0
  const showBanner = queueAlert && bannerDismissedFor !== pending

  return (
    <div className="flex min-h-screen bg-zinc-100 dark:bg-zinc-950">
      {/* SIDEBAR */}
      <aside className="hidden w-64 flex-col border-r border-zinc-200 bg-white md:flex dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex h-16 items-center gap-3 border-b border-zinc-100 px-5 dark:border-zinc-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-900 dark:text-white">SMS Gateway</p>
            <p className="text-xs text-zinc-400">Panneau de contrôle</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100'
                }`}>
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.href === '/queue' && pending > 0 && (
                  <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                    {pending}
                  </span>
                )}
                {active && item.href !== '/queue' && <ChevronRight className="ml-auto h-4 w-4" />}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
          <div className="flex items-center gap-3 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-40" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <div>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Système opérationnel</p>
              <p className="text-[11px] text-zinc-400">serveur joignable</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/80 px-6 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
          <div>
            <h1 className="text-base font-bold text-zinc-900 dark:text-white">{title}</h1>
            {subtitle && <p className="text-xs text-zinc-400">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-2">
            {/* Recherche Ctrl+K */}
            <button onClick={() => setPaletteOpen(true)}
              className="hidden items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-400 shadow-sm hover:bg-zinc-50 sm:flex dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700">
              <Search className="h-3.5 w-3.5" />
              Rechercher…
              <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1.5 text-[10px] text-zinc-400 dark:border-zinc-600 dark:bg-zinc-700">Ctrl K</kbd>
            </button>

            {/* Cloche */}
            <div className="relative">
              <button onClick={() => { setBellOpen(!bellOpen); setUserOpen(false) }}
                className="relative rounded-lg border border-zinc-200 bg-white p-2 text-zinc-600 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
                <Bell className="h-4 w-4" />
                {alertCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {alertCount}
                  </span>
                )}
              </button>
              {bellOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">Notifications</p>
                    {alertCount > 0 && (
                      <button onClick={() => markRead('all')}
                        className="text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400">
                        Tout marquer comme lu
                      </button>
                    )}
                  </div>
                  {!hasActiveAlert ? (
                    <p className="px-2 py-3 text-xs text-zinc-400">Aucune alerte. Tout va bien.</p>
                  ) : (
                    <>
                      {queueAlert && (
                        <Link href="/queue" onClick={() => { markRead('queue'); setBellOpen(false) }}
                          className={`flex items-start gap-2.5 rounded-lg p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 ${unreadQueue ? '' : 'opacity-60'}`}>
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                          <span className="text-xs text-zinc-600 dark:text-zinc-300">
                            <b>{pending} SMS en attente</b> — file au-delà du seuil de {queueThreshold}.
                          </span>
                        </Link>
                      )}
                      {failed > 0 && (
                        <Link href="/history" onClick={() => { markRead('failed'); setBellOpen(false) }}
                          className={`flex items-start gap-2.5 rounded-lg p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 ${unreadFailed ? '' : 'opacity-60'}`}>
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                          <span className="text-xs text-zinc-600 dark:text-zinc-300">
                            <b>{failed} échec(s)</b> à traiter dans l&apos;historique.
                          </span>
                        </Link>
                      )}
                      {alertCount === 0 && (
                        <p className="px-2 py-1.5 text-[11px] text-zinc-400">Tout est lu.</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <button onClick={toggleTheme} title={!mounted ? 'Thème' : darkMode ? 'Mode clair' : 'Mode sombre'}
              className="rounded-lg border border-zinc-200 bg-white p-2 text-zinc-600 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
              {!mounted || !darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            {/* Menu utilisateur */}
            <div className="relative">
              <button onClick={() => { setUserOpen(!userOpen); setBellOpen(false) }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                A
              </button>
              {userOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
                  <div className="border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">Administrateur</p>
                    <p className="text-[11px] text-zinc-400">Session locale</p>
                  </div>
                  <button onClick={logout}
                    className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
                    <LogOut className="h-3.5 w-3.5" /> Déconnexion
                  </button>
                </div>
              )}
            </div>

            {actions}
          </div>
        </header>

        {/* Bannière alerte file */}
        {showBanner && (
          <div className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-6 py-2.5 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="flex-1">
              <b>{pending} SMS en attente</b> — aucun appareil ne prend les tâches. Vérifiez vos téléphones.
            </span>
            <Link href="/queue" className="text-xs font-bold underline">Voir la file</Link>
            <button onClick={() => setBannerDismissedFor(pending)} className="text-amber-500 hover:text-amber-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="space-y-6 p-6">{children}</div>
      </main>

      {/* Palette Ctrl+K */}
      <Modal open={paletteOpen} onClose={() => setPaletteOpen(false)} title="Navigation" subtitle="Tapez pour filtrer les pages">
        <input autoFocus type="text" placeholder="Rechercher une page…" value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mb-3 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
        <div className="space-y-1">
          {paletteResults.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => { setPaletteOpen(false); setQuery('') }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800">
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
          {paletteResults.length === 0 && <p className="px-3 py-2 text-xs text-zinc-400">Aucune page trouvée.</p>}
        </div>
      </Modal>
    </div>
  )
}
