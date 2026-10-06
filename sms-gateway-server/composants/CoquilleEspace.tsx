'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import {
  Inbox, Webhook, Receipt, LogOut, Send, Link2, BookOpen, List,
  Moon, Sun, Search, Bell, AlertTriangle, HelpCircle, MoreHorizontal, LayoutGrid, Smartphone
} from 'lucide-react'
import { Modale } from './interface'
import { useTheme } from '../lib/use-theme'

const NAVIGATION = [
  { href: '/espace', icone: LayoutGrid, etiquette: 'Tableau de bord' },
  { href: '/espace/appareils', icone: Smartphone, etiquette: 'Mes téléphones relais' },
  { href: '/espace/envoyer', icone: Send, etiquette: 'Envoyer un SMS' },
  { href: '/espace/envois', icone: List, etiquette: 'Mes envois' },
  { href: '/espace/entrees', icone: Inbox, etiquette: 'SMS reçus' },
  { href: '/espace/liens', icone: Link2, etiquette: 'Liens intelligents' },
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
  const [clocheOuverte, setClocheOuverte] = useState(false)
  const [paletteOuverte, setPaletteOuverte] = useState(false)
  const [requete, setRequete] = useState('')

  const chargerAlertes = useCallback(async () => {
    try {
      const reponse = await fetch('/api/espace/moi')
      const donnees = await reponse.json()
      if (donnees?.nom) setNomClient(donnees.nom)
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

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-800 dark:bg-[#0B0F19] dark:text-zinc-100 antialiased font-sans transition-colors duration-200">
      {/* SIDEBAR CLIENT SOMBRE HARMONIEUSE */}
      <aside className="hidden w-64 flex-col bg-[#0B0F19] text-zinc-300 md:flex border-r border-zinc-800/80 shrink-0">
        <div className="flex h-16 items-center gap-3 border-b border-zinc-800/80 px-5">
          <Link href="/espace" className="flex items-center gap-3" title="Espace client">
            <Image src="/smsika.png" alt="SMSIKA" width={36} height={36} className="rounded-xl shrink-0 shadow-xs" />
            <div>
              <p className="text-sm font-bold text-white tracking-tight">SMSIKA</p>
              <p className="text-[11px] text-zinc-400 font-medium">Espace Client</p>
            </div>
          </Link>
        </div>

        <div className="px-5 pt-5 pb-2">
          <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Mon Espace</p>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAVIGATION.map((item) => {
            const actif = chemin === item.href
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition ${
                  actif
                    ? 'bg-[#1E293B] text-white shadow-sm font-semibold'
                    : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                }`}>
                <item.icone className={`h-4 w-4 ${actif ? 'text-blue-400' : 'text-zinc-400'}`} />
                <span>{item.etiquette}</span>
                {item.href === '/espace/envois' && enAttente > 0 && (
                  <span className="ml-auto rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                    {enAttente}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Card statut espace */}
        <div className="px-3 py-2">
          <div className="rounded-xl bg-[#131926] p-3 border border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <p className="text-xs font-semibold text-zinc-200">Parc d'envoi mutualisé</p>
            </div>
            <p className="mt-1 text-[11px] text-zinc-400">SMS via téléphones relais</p>
          </div>
        </div>

        {/* Client Profil en bas */}
        <div className="border-t border-zinc-800/80 p-3">
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600/20 font-bold text-xs text-blue-400 border border-blue-500/30">
                CL
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{nomClient || 'Mon compte'}</p>
                <p className="text-[11px] text-zinc-400">Compte client</p>
              </div>
            </div>
            <button onClick={deconnexion} className="text-zinc-400 hover:text-white transition" title="Déconnexion">
              <LogOut className="h-4 w-4" />
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
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Relais Dédié Client
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Recherche Ctrl+K */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Rechercher..." readOnly onClick={() => setPaletteOuverte(true)}
                className="w-56 cursor-pointer rounded-xl border border-slate-200/80 bg-slate-50/80 py-1.5 pl-8 pr-12 text-xs text-slate-700 placeholder-slate-400 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300" />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 shadow-2xs">⌘ K</kbd>
            </div>

            {/* Cloche d'alertes perso */}
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
                  <p className="px-2 py-1.5 text-xs font-bold text-slate-900 dark:text-white">Mes alertes</p>
                  {compteAlertes === 0 ? (
                    <p className="px-2 py-3 text-xs text-slate-400 dark:text-zinc-400">Aucune alerte. Tout va bien.</p>
                  ) : (
                    <>
                      {enAttente > 0 && (
                        <Link href="/espace/envois" onClick={() => setClocheOuverte(false)}
                          className="flex items-start gap-2.5 rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-zinc-800">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                          <span className="text-xs text-slate-600 dark:text-zinc-300">
                            <b>{enAttente} SMS en attente</b> d&apos;envoi.
                          </span>
                        </Link>
                      )}
                      {echoues > 0 && (
                        <Link href="/espace/envois" onClick={() => setClocheOuverte(false)}
                          className="flex items-start gap-2.5 rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-zinc-800">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                          <span className="text-xs text-slate-600 dark:text-zinc-300">
                            <b>{echoues} échec(s)</b> à vérifier dans vos envois.
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
            const actif = chemin === item.href
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
