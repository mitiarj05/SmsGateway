'use client'

import { useState, useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  MessageSquare,
  LayoutDashboard,
  Smartphone,
  Inbox,
  History,
  Settings,
  Moon,
  Sun,
  RefreshCw,
  Send,
  ChevronRight,
  LogOut,
} from 'lucide-react'
import { Device } from './ui'

interface DashboardShellProps {
  children: ReactNode
  devices: Device[]
  lastRefresh: Date
  refreshing: boolean
  onRefresh: () => void
  onNewSMS: () => void
}

export default function DashboardShell({
  children,
  devices,
  lastRefresh,
  refreshing,
  onRefresh,
  onNewSMS,
}: DashboardShellProps) {
  const [darkMode, setDarkMode] = useState(false)
  const pathname = usePathname()

  /* ---------- Mode sombre : init depuis localStorage ---------- */
  useEffect(() => {
    const saved = localStorage.getItem('sms-gateway-theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setDarkMode(saved ? saved === 'dark' : prefersDark)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('sms-gateway-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const hasOnlineDevice = devices.some((d) => d.statut === 'ONLINE' || d.statut === 'BUSY')

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      window.location.href = '/login'
    }
  }

  const navItems = [
    { href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" />, label: 'Tableau de bord' },
    { href: '/devices', icon: <Smartphone className="h-4 w-4" />, label: 'Appareils' },
    { href: '/queue', icon: <Inbox className="h-4 w-4" />, label: 'File d’attente' },
    { href: '/history', icon: <History className="h-4 w-4" />, label: 'Historique' },
    { href: '/settings', icon: <Settings className="h-4 w-4" />, label: 'Paramètres' },
  ]

  return (
    <div className="flex min-h-screen bg-zinc-100 dark:bg-zinc-950">
      {/* ================= SIDEBAR ================= */}
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
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href === '/dashboard' && pathname === '/')
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100'
                }`}
              >
                {item.icon}
                {item.label}
                {active && <ChevronRight className="ml-auto h-4 w-4" />}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
          <div className="flex items-center gap-3 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 ${hasOnlineDevice ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${hasOnlineDevice ? 'bg-emerald-500' : 'bg-red-500'}`} />
            </span>
            <div>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                {hasOnlineDevice ? 'Système opérationnel' : 'Aucun appareil en ligne'}
              </p>
              <p className="text-[11px] text-zinc-400">
                {devices.filter((d) => d.statut === 'ONLINE').length} appareil(s) disponible(s)
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="flex-1 overflow-y-auto">
        {/* Topbar */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/80 px-6 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
          <div>
            <h1 className="text-base font-bold text-zinc-900 dark:text-white">{title()}</h1>
            <p className="text-xs text-zinc-400" suppressHydrationWarning>
              Actualisé à {lastRefresh.toLocaleTimeString('fr-FR')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Toggle mode sombre */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Mode clair' : 'Mode sombre'}
              className="rounded-lg border border-zinc-200 bg-white p-2 text-zinc-600 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={onRefresh}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-600 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
            <button
              onClick={onNewSMS}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Nouveau SMS</span>
            </button>
            <button
              onClick={logout}
              title="Se déconnecter"
              className="rounded-lg border border-zinc-200 bg-white p-2 text-zinc-600 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="space-y-6 p-6">
          {children}
        </div>
      </main>
    </div>
  )

  function title(): string {
    if (pathname === '/devices') return 'Appareils'
    if (pathname === '/queue') return 'File d’attente'
    if (pathname === '/history') return 'Historique'
    if (pathname === '/settings') return 'Paramètres'
    return 'Tableau de bord'
  }
}
