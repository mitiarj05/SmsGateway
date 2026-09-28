'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Inbox, Bot, Webhook, Receipt, LogOut,
} from 'lucide-react'

const NAVIGATION = [
  { href: '/espace', icone: LayoutDashboard, etiquette: 'Tableau' },
  { href: '/espace/entrees', icone: Inbox, etiquette: 'Entrées' },
  { href: '/espace/automatismes', icone: Bot, etiquette: 'Automatismes' },
  { href: '/espace/notifications', icone: Webhook, etiquette: 'Notifications' },
  { href: '/espace/facturation', icone: Receipt, etiquette: 'Facturation' },
]

/** Coquille allégée de l'espace client (pas de cloche admin ni de palette). */
export default function CoquilleEspace({ titre, sousTitre, children }: {
  titre: string; sousTitre?: string; children: React.ReactNode
}) {
  const chemin = usePathname()
  const routeur = useRouter()

  async function deconnexion() {
    try {
      await fetch('/api/espace/auth/logout', { method: 'POST' })
    } finally {
      routeur.replace('/espace/login')
    }
  }

  return (
    <div className="flex min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <aside className="hidden w-60 flex-col border-r border-zinc-200 bg-white md:flex dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex h-16 items-center gap-3 border-b border-zinc-100 px-5 dark:border-zinc-800">
          <Image src="/smsika.png" alt="SMSIKA" width={36} height={36} className="rounded-xl" />
          <div>
            <p className="text-sm font-bold text-zinc-900 dark:text-white">SMSIKA</p>
            <p className="text-xs text-zinc-400">Espace client</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAVIGATION.map((item) => {
            const actif = chemin === item.href
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  actif
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100'
                }`}>
                <item.icone className="h-4 w-4" />
                {item.etiquette}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-zinc-100 p-3 dark:border-zinc-800">
          <button onClick={deconnexion}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
            <LogOut className="h-3.5 w-3.5" /> Déconnexion
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <header className="border-b border-zinc-200 bg-white/80 px-6 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
          <h1 className="text-base font-bold text-zinc-900 dark:text-white">{titre}</h1>
          {sousTitre && <p className="text-xs text-zinc-400">{sousTitre}</p>}
        </header>
        <div className="space-y-6 p-6">{children}</div>
      </main>
    </div>
  )
}
