'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import {
  LayoutDashboard, Inbox, Bot, Webhook, Receipt, LogOut, Send, Link2, BookOpen, List,
  Moon, Sun, Search, Bell, AlertTriangle,
} from 'lucide-react'
import { Modale } from './interface'
import { useTheme } from '../lib/use-theme'

const NAVIGATION = [
  { href: '/espace', icone: LayoutDashboard, etiquette: 'Tableau' },
  { href: '/espace/envoyer', icone: Send, etiquette: 'Envoyer' },
  { href: '/espace/envois', icone: List, etiquette: 'Envois' },
  { href: '/espace/entrees', icone: Inbox, etiquette: 'Entrées' },
  { href: '/espace/liens', icone: Link2, etiquette: 'Liens' },
  { href: '/espace/automatismes', icone: Bot, etiquette: 'Automatismes' },
  { href: '/espace/notifications', icone: Webhook, etiquette: 'Notifications' },
  { href: '/espace/facturation', icone: Receipt, etiquette: 'Facturation' },
  { href: '/espace/api', icone: BookOpen, etiquette: 'Doc API' },
]

/** Coquille de l'espace client : recherche, cloche d'alertes perso, thème. */
export default function CoquilleEspace({ titre, sousTitre, children }: {
  titre: string; sousTitre?: string; children: React.ReactNode
}) {
  const chemin = usePathname()
  const routeur = useRouter()

  /* Thème partagé (même hook que l'admin). */
  const { modeSombre, monte, basculerTheme } = useTheme()

  /* Alertes perso : file d'attente + échecs du client (via /api/espace/moi). */
  const [enAttente, setEnAttente] = useState(0)
  const [echoues, setEchoues] = useState(0)
  const [clocheOuverte, setClocheOuverte] = useState(false)
  const [paletteOuverte, setPaletteOuverte] = useState(false)
  const [requete, setRequete] = useState('')

  const chargerAlertes = useCallback(async () => {
    try {
      const reponse = await fetch('/api/espace/moi')
      const donnees = await reponse.json()
      if (donnees?.stats) {
        setEnAttente(donnees.stats.attente ?? 0)
        setEchoues(donnees.stats.echoue ?? 0)
      }
    } catch { /* silencieux */ }
  }, [])

  useEffect(() => {
    chargerAlertes()
    const i = setInterval(chargerAlertes, 10000)
    return () => clearInterval(i)
  }, [chargerAlertes])

  /* Ctrl+K : palette de navigation */
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
      await fetch('/api/espace/auth/logout', { method: 'POST' })
    } finally {
      routeur.replace('/login')
    }
  }

  const resultatsRecherche = NAVIGATION.filter((n) => n.etiquette.toLowerCase().includes(requete.toLowerCase()))
  const compteAlertes = (enAttente > 0 ? 1 : 0) + (echoues > 0 ? 1 : 0)

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
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/80 px-6 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
          <div>
            <h1 className="text-base font-bold text-zinc-900 dark:text-white">{titre}</h1>
            {sousTitre && <p className="text-xs text-zinc-400">{sousTitre}</p>}
          </div>

          <div className="flex items-center gap-2">
            {/* Recherche Ctrl+K */}
            <button onClick={() => setPaletteOuverte(true)}
              className="hidden items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-400 shadow-sm hover:bg-zinc-50 sm:flex dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700">
              <Search className="h-3.5 w-3.5" />
              Rechercher…
              <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1.5 text-[10px] text-zinc-400 dark:border-zinc-600 dark:bg-zinc-700">Ctrl K</kbd>
            </button>

            {/* Cloche d'alertes perso */}
            <div className="relative">
              <button onClick={() => setClocheOuverte(!clocheOuverte)}
                className="relative rounded-lg border border-zinc-200 bg-white p-2 text-zinc-600 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
                <Bell className="h-4 w-4" />
                {compteAlertes > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {compteAlertes}
                  </span>
                )}
              </button>
              {clocheOuverte && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
                  <p className="px-2 py-1.5 text-xs font-bold text-zinc-900 dark:text-white">Mes alertes</p>
                  {compteAlertes === 0 ? (
                    <p className="px-2 py-3 text-xs text-zinc-400">Aucune alerte. Tout va bien.</p>
                  ) : (
                    <>
                      {enAttente > 0 && (
                        <Link href="/espace/envois" onClick={() => setClocheOuverte(false)}
                          className="flex items-start gap-2.5 rounded-lg p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                          <span className="text-xs text-zinc-600 dark:text-zinc-300">
                            <b>{enAttente} SMS en attente</b> d&apos;envoi.
                          </span>
                        </Link>
                      )}
                      {echoues > 0 && (
                        <Link href="/espace/envois" onClick={() => setClocheOuverte(false)}
                          className="flex items-start gap-2.5 rounded-lg p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                          <span className="text-xs text-zinc-600 dark:text-zinc-300">
                            <b>{echoues} échec(s)</b> à vérifier dans vos envois.
                          </span>
                        </Link>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <button onClick={basculerTheme} title={!monte ? 'Thème' : modeSombre ? 'Mode clair' : 'Mode sombre'}
              className="rounded-lg border border-zinc-200 bg-white p-2 text-zinc-600 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
              {!monte || !modeSombre ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
          </div>
        </header>
        {/* Navigation mobile (la sidebar est masquée sous md) */}
        <nav className="flex gap-1 overflow-x-auto border-b border-zinc-200 bg-white px-3 py-2 md:hidden dark:border-zinc-800 dark:bg-zinc-900">
          {NAVIGATION.map((item) => {
            const actif = chemin === item.href
            return (
              <Link key={item.href} href={item.href}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                  actif
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}>
                <item.icone className="h-3.5 w-3.5" />
                {item.etiquette}
              </Link>
            )
          })}
        </nav>
        <div className="space-y-6 p-6">{children}</div>
      </main>

      {/* Palette Ctrl+K */}
      <Modale ouvert={paletteOuverte} onFermer={() => setPaletteOuverte(false)} titre="Navigation" sousTitre="Tapez pour filtrer les pages">
        <input autoFocus type="text" placeholder="Rechercher une page…" value={requete}
          onChange={(e) => setRequete(e.target.value)}
          className="mb-3 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
        <div className="space-y-1">
          {resultatsRecherche.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => { setPaletteOuverte(false); setRequete('') }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800">
              <n.icone className="h-4 w-4" /> {n.etiquette}
            </Link>
          ))}
          {resultatsRecherche.length === 0 && <p className="px-3 py-2 text-xs text-zinc-400">Aucune page trouvée.</p>}
        </div>
      </Modale>
    </div>
  )
}
