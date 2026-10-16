'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import {
  Inbox, Webhook, Receipt, Send, BookOpen, List,
  Moon, Sun, Search, Bell, AlertTriangle, MoreHorizontal, LayoutGrid, Smartphone, ArrowUpRight
} from 'lucide-react'
import { Modale } from './interface'
import { useTheme } from '../lib/use-theme'

const NAVIGATION = [
  { href: '/espace', icone: LayoutGrid, etiquette: 'Tableau de bord' },
  { href: '/espace/appareils', icone: Smartphone, etiquette: 'Parc d\'envoi' },
  { href: '/espace/envoyer', icone: Send, etiquette: 'Envoyer un SMS' },
  { href: '/espace/envois', icone: List, etiquette: 'Mes envois' },
  { href: '/espace/entrees', icone: Inbox, etiquette: 'SMS reçus' },
  { href: '/espace/notifications', icone: Webhook, etiquette: 'Notifications' },
  { href: '/espace/facturation', icone: Receipt, etiquette: 'Facturation' },
  { href: '/espace/api', icone: BookOpen, etiquette: 'Doc API' },
]

export default function CoquilleEspace({ children }: {
  titre?: string; sousTitre?: string; children: React.ReactNode
}) {
  const chemin = usePathname()
  const routeur = useRouter()

  const { modeSombre, monte, basculerTheme } = useTheme()

  const [enAttente, setEnAttente] = useState(0)
  const [echoues, setEchoues] = useState(0)
  const [nomClient, setNomClient] = useState('')
  const [versionApp, setVersionApp] = useState<string | null>(null)
  const [systemeOk, setSystemeOk] = useState<boolean | null>(null)
  const [clocheOuverte, setClocheOuverte] = useState(false)
  const [paletteOuverte, setPaletteOuverte] = useState(false)
  const [requete, setRequete] = useState('')

  const chargerAlertes = useCallback(async () => {
    try {
      const [reponseMoi, reponseSante] = await Promise.all([
        fetch('/api/espace/moi'),
        fetch('/api/health'),
      ])
      const donnees = await reponseMoi.json()
      if (donnees?.nom) setNomClient(donnees.nom)
      if (donnees?.stats) {
        setEnAttente(donnees.stats.attente ?? 0)
        setEchoues(donnees.stats.echoue ?? 0)
      }
      const sante = await reponseSante.json().catch(() => null)
      if (sante) {
        if (typeof sante.version === 'string') setVersionApp(sante.version)
        setSystemeOk(sante.status === 'ok' && sante.checks?.supabase?.ok !== false)
      } else {
        setSystemeOk(false)
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
      await fetch('/api/espace/auth/logout', { method: 'POST' })
    } finally {
      routeur.replace('/login?onglet=client')
    }
  }

  const resultatsRecherche = NAVIGATION.filter((n) => n.etiquette.toLowerCase().includes(requete.toLowerCase()))
  const compteAlertes = (enAttente > 0 ? 1 : 0) + (echoues > 0 ? 1 : 0)
  const alerteActive = compteAlertes > 0
  const initiales = (nomClient.trim().substring(0, 1).toUpperCase() || 'C')

  return (
    <div className="flex min-h-screen bg-white text-[#1C1917] dark:bg-[#0B0F19] dark:text-zinc-100 antialiased font-sans transition-colors duration-200">

      {/* SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[240px] flex-col justify-between border-r border-[#1C1917]/10 bg-white px-4 py-5 text-[#1C1917] md:flex dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100">
        <div>
          {/* Logo */}
          <Link href="/espace" className="flex items-center gap-3 px-2" title="Espace client">
            <Image src="/icons/logoClair.png" alt="SMSTSIKA" width={200} height={48} className="h-12 w-auto shrink-0 dark:hidden" />
            <Image src="/icons/logoSombre.png" alt="SMSTSIKA" width={200} height={48} className="hidden h-12 w-auto shrink-0 dark:block" />
          </Link>

          <p className="mb-2 mt-7 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400 dark:text-zinc-500">
            Mon espace
          </p>

          {/* Navigation client */}
          <nav className="flex flex-col gap-1">
            {NAVIGATION.map((item) => {
              const actif = chemin === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] transition-colors${
                    actif
                      ? 'bg-[#2563EB]/10 font-semibold text-[#1D4ED8] dark:bg-white/10 dark:text-white'
                      : 'text-stone-500 hover:bg-stone-100 hover:text-[#1C1917] dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white'
                  }`}
                >
                  <item.icone size={17} className={actif ? 'text-[#2563EB] dark:text-[#93C5FD]' : 'text-stone-400 dark:text-zinc-500'} />
                  <span className="flex-1">{item.etiquette}</span>
                  {item.href === '/espace/envois' && enAttente > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold${
                        actif ? 'bg-[#2563EB]/10 text-[#1D4ED8] dark:bg-white/15 dark:text-white' : 'bg-[#1C1917]/5 text-stone-500 dark:bg-white/15 dark:text-zinc-300'
                      }`}
                    >
                      {enAttente}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Bottom Section : Aide & Utilisateur */}
        <div>
          {/* Card Aide */}
          <div className="rounded-2xl border border-[#1C1917]/10 bg-stone-100 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#1C1917]/15 text-sm font-bold text-stone-500 dark:border-white/25 dark:text-zinc-300">
              ?
            </div>
            <p className="mt-2.5 text-[13px] font-bold text-[#1C1917] dark:text-white">Besoin d'aide ?</p>
            <p className="mt-1 text-[11px] leading-relaxed text-stone-500 dark:text-zinc-400">
              Consultez la documentation ou contactez le support.
            </p>
            <Link
              href="/espace/api"
              className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-semibold text-[#1D4ED8] hover:underline dark:text-[#93C5FD]"
            >
              Centre d'aide <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Utilisateur */}
          <div className="mt-4 flex items-center gap-3 border-t border-[#1C1917]/10 pt-4 dark:border-white/10">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563EB] text-[13px] font-bold text-white">
              {initiales}
            </div>
            <div className="flex-1 leading-tight min-w-0">
              <p className="text-[13px] font-semibold text-[#1C1917] truncate dark:text-white">{nomClient || 'Mon compte'}</p>
              <p className="text-[11px] text-stone-500 dark:text-zinc-500">Compte client</p>
            </div>
            <button onClick={deconnexion} className="text-stone-400 hover:text-[#1C1917] dark:text-zinc-500 dark:hover:text-white" title="Déconnexion">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <div className="flex-1 md:pl-[240px] flex flex-col justify-between min-h-screen">
        <div>
          {/* TOPBAR HEADER (même style que la console admin) */}
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#1C1917]/10 bg-white/85 px-8 backdrop-blur dark:border-zinc-800/80 dark:bg-[#0B0F19]/80">
            <div className="flex items-center gap-2 text-[13px]">
              <span className="font-semibold text-[#1C1917] dark:text-zinc-200">Espace</span>
              <span className="text-stone-500">&gt;</span>
              <span className="text-stone-600 dark:text-zinc-400">
                {NAVIGATION.find((n) => chemin === n.href)?.etiquette || 'Tableau de bord'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Badge Statut Services Stables (comme la console admin) */}
              <div className="hidden sm:flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[12px] font-medium text-stone-600 shadow-sm border border-[#1C1917]/10 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300">
                <span className="relative flex h-2 w-2">
                  <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60${systemeOk === false ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
                  <span className={`relative inline-flex h-2 w-2 rounded-full${systemeOk === false ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                </span>
                {systemeOk === null ? 'Vérification…' : systemeOk ? 'Services stables' : 'Incident en cours'}
                {versionApp && (
                  <>
                    <span className="text-stone-400">·</span>
                    <span className="font-semibold text-[#1C1917] dark:text-white">v{versionApp}</span>
                  </>
                )}
              </div>

              {/* Barre de recherche */}
              <div
                onClick={() => setPaletteOuverte(true)}
                className="hidden cursor-pointer items-center gap-2.5 rounded-full bg-white px-4 py-2 text-[13px] text-stone-500 shadow-sm border border-[#1C1917]/10 md:flex md:w-64 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400"
              >
                <Search className="h-4 w-4" />
                <span className="flex-1">Rechercher...</span>
                <kbd className="rounded-md bg-[#1C1917]/[0.04] px-1.5 py-0.5 text-[10px] font-semibold text-stone-600 dark:bg-zinc-700 dark:text-zinc-300">
                  ⌘ K
                </kbd>
              </div>

              {/* Cloche */}
              <div className="relative">
                <button
                  onClick={() => setClocheOuverte(!clocheOuverte)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-stone-600 shadow-sm border border-[#1C1917]/10 hover:text-[#1C1917] dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
                >
                  <Bell className="h-4 w-4" />
                  {compteAlertes > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                      {compteAlertes}
                    </span>
                  )}
                </button>
                {clocheOuverte && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-[#1C1917]/10 bg-white p-2 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
                    <div className="flex items-center justify-between px-2 py-1.5">
                      <p className="text-xs font-bold text-[#1C1917] dark:text-white">Mes alertes</p>
                    </div>
                    {!alerteActive ? (
                      <p className="px-2 py-3 text-xs text-stone-500 dark:text-zinc-400">Aucune alerte. Tout va bien.</p>
                    ) : (
                      <>
                        {enAttente > 0 && (
                          <Link href="/espace/envois" onClick={() => setClocheOuverte(false)}
                            className="flex items-start gap-2.5 rounded-lg p-2 hover:bg-stone-100 dark:hover:bg-zinc-800">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                            <span className="text-xs text-stone-600 dark:text-zinc-300">
                              <b>{enAttente} SMS en attente</b> d&apos;envoi.
                            </span>
                          </Link>
                        )}
                        {echoues > 0 && (
                          <Link href="/espace/envois" onClick={() => setClocheOuverte(false)}
                            className="flex items-start gap-2.5 rounded-lg p-2 hover:bg-stone-100 dark:hover:bg-zinc-800">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                            <span className="text-xs text-stone-600 dark:text-zinc-300">
                              <b>{echoues} échec(s)</b> à vérifier dans vos envois.
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
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-stone-600 shadow-sm border border-[#1C1917]/10 hover:text-[#1C1917] dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
              >
                {!monte || !modeSombre ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>
            </div>
          </header>

          {/* Navigation mobile */}
          <nav className="flex gap-1 overflow-x-auto border-b border-[#1C1917]/10 bg-white px-3 py-2 md:hidden dark:border-zinc-800 dark:bg-zinc-900">
            {NAVIGATION.map((item) => {
              const actif = chemin === item.href
              return (
                <Link key={item.href} href={item.href}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium${
                    actif
                      ? 'bg-[#2563EB] text-white'
                      : 'text-stone-600 dark:text-zinc-400'
                  }`}>
                  <item.icone className="h-3.5 w-3.5" />
                  {item.etiquette}
                </Link>
              )
            })}
          </nav>

          <div className="anim-page p-8 space-y-6">{children}</div>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between border-t border-[#1C1917]/10 px-8 py-4 text-[11px] text-stone-500 dark:border-zinc-800/80 dark:text-zinc-500">
          <span>© 2025 SMSTSIKA Gateway</span>
          <div className="flex items-center gap-3">
            <Link href="/espace/api" className="hover:underline">Guide API</Link>
            <span>·</span>
            <a href="mailto:support@smsika.app" className="hover:underline text-[#2563EB] dark:text-blue-400 font-semibold">Écrire au support ↗</a>
          </div>
        </footer>
      </div>

      {/* Palette Ctrl+K */}
      <Modale ouvert={paletteOuverte} onFermer={() => setPaletteOuverte(false)} titre="Navigation" sousTitre="Tapez pour filtrer les pages">
        <input autoFocus type="text" placeholder="Rechercher une page…" value={requete}
          onChange={(e) => setRequete(e.target.value)}
          className="mb-3 w-full rounded-xl border border-[#1C1917]/10 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
        <div className="space-y-1">
          {resultatsRecherche.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => { setPaletteOuverte(false); setRequete('') }}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-stone-600 hover:bg-stone-100 dark:text-zinc-300 dark:hover:bg-zinc-800">
              <n.icone className="h-4 w-4" /> {n.etiquette}
            </Link>
          ))}
          {resultatsRecherche.length === 0 && <p className="px-3 py-2 text-xs text-stone-500 dark:text-zinc-400">Aucune page trouvée.</p>}
        </div>
      </Modale>
    </div>
  )
}
