'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, useRef, type CSSProperties } from 'react'
import {
  Inbox, Webhook, Receipt, Send, Compass, List,
  Moon, Sun, Search, Bell, AlertTriangle, LogOut, LayoutGrid, Smartphone, ArrowUpRight,
  PanelLeft, ChevronsLeft, Settings, User
} from 'lucide-react'
import { Modale } from './interface'
import { useTheme } from '../lib/use-theme'

const NAVIGATION = [
  { href: '/espace', icone: LayoutGrid, etiquette: 'Tableau de bord' },
  { href: '/espace/appareils', icone: Smartphone, etiquette: 'Parc d\'envoi' },
  { href: '/espace/envoyer', icone: Send, etiquette: 'Envoyer un SMS' },
  { href: '/espace/envois', icone: List, etiquette: 'Mes envois' },
  { href: '/espace/entrees', icone: Inbox, etiquette: 'SMS reçus' },
  { href: '/espace/evenements', icone: Webhook, etiquette: 'Intégrations' },
  { href: '/espace/facturation', icone: Receipt, etiquette: 'Facturation' },
  { href: '/espace/sommaire', icone: Compass, etiquette: 'Sommaire' },
  { href: '/espace/moi', icone: User, etiquette: 'Mon compte' },
  { href: '/espace/parametres', icone: Settings, etiquette: 'Paramètres' },
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

  /* Lectures de la cloche, conservées comme à la console admin */
  const [marquesLues, setMarquesLues] = useState(() => {
    if (typeof window === 'undefined') return { attente: 0, echoues: 0 }
    try {
      const brut = localStorage.getItem('smsika-notif-espace-lue')
      if (brut) {
        const parsed = JSON.parse(brut)
        return {
          attente: typeof parsed.attente === 'number' ? parsed.attente : 0,
          echoues: typeof parsed.echoues === 'number' ? parsed.echoues : 0,
        }
      }
    } catch { /* défaut */ }
    return { attente: 0, echoues: 0 }
  })

  useEffect(() => {
    localStorage.setItem('smsika-notif-espace-lue', JSON.stringify(marquesLues))
  }, [marquesLues])

  function marquerLu(laquelle: 'attente' | 'echoues' | 'all') {
    setMarquesLues((precedent) => ({
      attente: laquelle === 'echoues' ? precedent.attente : enAttente,
      echoues: laquelle === 'attente' ? precedent.echoues : echoues,
    }))
  }

  /* Sidebar repliable + largeur ajustable (préférences persistées) */
  const LARG_MIN = 200
  const LARG_MAX = 340
  const LARG_REPLIEE = 76
  const [reduite, setReduite] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('smsika-sidebar-espace-reduite') === '1'
  })
  const [largeur, setLargeur] = useState(() => {
    if (typeof window === 'undefined') return 240
    const v = Number(localStorage.getItem('smsika-sidebar-espace-largeur'))
    return v >= LARG_MIN && v <= LARG_MAX ? v : 240
  })
  const [redimensionne, setRedimensionne] = useState(false)
  const refAside = useRef<HTMLElement>(null)

  useEffect(() => {
    localStorage.setItem('smsika-sidebar-espace-reduite', reduite ? '1' : '0')
  }, [reduite])
  useEffect(() => {
    localStorage.setItem('smsika-sidebar-espace-largeur', String(largeur))
  }, [largeur])

  const largeurAffichee = reduite ? LARG_REPLIEE : largeur

  function demarrerRedimensionnement(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    if (reduite) setReduite(false)
    setRedimensionne(true)
    const tactile = 'touches' in e
    const x0 = tactile ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const w0 = refAside.current?.getBoundingClientRect().width ?? largeur
    const bouger = (ev: MouseEvent | TouchEvent) => {
      const x = ev instanceof MouseEvent ? ev.clientX : ev.touches[0].clientX
      setLargeur(Math.min(LARG_MAX, Math.max(LARG_MIN, Math.round(w0 + (x - x0)))))
    }
    const finir = () => {
      setRedimensionne(false)
      window.removeEventListener('mousemove', bouger)
      window.removeEventListener('mouseup', finir)
      window.removeEventListener('touchmove', bouger)
      window.removeEventListener('touchend', finir)
    }
    window.addEventListener('mousemove', bouger)
    window.addEventListener('mouseup', finir)
    window.addEventListener('touchmove', bouger, { passive: false })
    window.addEventListener('touchend', finir)
  }

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
  const fileNonLue = enAttente > marquesLues.attente
  const echecsNonLus = echoues > marquesLues.echoues
  const compteAlertes = (fileNonLue ? 1 : 0) + (echecsNonLus ? 1 : 0)
  const alerteActive = compteAlertes > 0
  const initiales = (nomClient.trim().substring(0, 1).toUpperCase() || 'C')

  return (
    <div
      className={`flex min-h-screen bg-white text-[#1C1917] antialiased font-sans transition-colors duration-200 dark:bg-[#0B0F19] dark:text-zinc-100 ${redimensionne ? 'select-none' : ''}`}
      style={{ '--sbw': `${largeurAffichee}px` } as CSSProperties}
    >

      {/* SIDEBAR repliable / redimensionnable */}
      <aside
        ref={refAside}
        className={`group/sb fixed inset-y-0 left-0 z-40 hidden flex-col justify-between overflow-hidden border-r border-[#1C1917]/10 bg-white px-4 py-5 text-[#1C1917] md:flex dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100 md:w-[var(--sbw)] ${redimensionne ? '' : 'transition-[width] duration-300 ease-in-out'}`}
      >
        <div>
          {/* Logo + commande de repli */}
          <div className={`flex items-center gap-2 px-2 ${reduite ? 'justify-center px-0' : ''}`}>
            {reduite ? (
              <button
                type="button"
                onClick={() => setReduite(false)}
                title="Afficher le menu"
                aria-label="Afficher le menu"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#1C1917]/10 bg-white text-stone-500 transition hover:text-[#1C1917] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              >
                <PanelLeft className="h-5 w-5" />
              </button>
            ) : (
              <>
                <Link href="/espace" className="flex min-w-0 flex-1 items-center gap-3" title="Espace client">
                  <Image src="/icons/logoClair.png" alt="SMSTSIKA" width={200} height={48} className="h-12 w-auto shrink-0 dark:hidden" />
                  <Image src="/icons/logoSombre.png" alt="SMSTSIKA" width={200} height={48} className="hidden h-12 w-auto shrink-0 dark:block" />
                </Link>
                <button
                  type="button"
                  onClick={() => setReduite(true)}
                  title="Réduire le menu"
                  aria-label="Réduire le menu"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-[#1C1917] dark:text-zinc-500 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Liens défilants : logo et bas de menu restent toujours visibles */}
        <div className="min-h-0 flex-1 overflow-y-auto py-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/15 dark:[&::-webkit-scrollbar-thumb]:bg-white/15">
          {!reduite && (
            <p className="mb-2 mt-7 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400 dark:text-zinc-500">
              Mon espace
            </p>
          )}

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
                  }${reduite ? ' justify-center px-0' : ''}`}
                >
                  <span title={item.etiquette} className="flex shrink-0">
                    <item.icone size={17} className={actif ? 'text-[#2563EB] dark:text-[#93C5FD]' : 'text-stone-400 dark:text-zinc-500'} />
                  </span>
                  <span className={`flex-1 overflow-hidden whitespace-nowrap transition-all duration-200 ${reduite ? 'max-w-0 opacity-0' : 'max-w-[180px] opacity-100'}`}>{item.etiquette}</span>
                  {item.href === '/espace/envois' && enAttente > 0 && !reduite && (
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
          {!reduite && (
            <div className="rounded-2xl border border-[#1C1917]/10 bg-stone-100 p-4 [@media(max-height:780px)]:hidden dark:border-white/10 dark:bg-white/5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#1C1917]/15 text-sm font-bold text-stone-500 dark:border-white/25 dark:text-zinc-300">
              ?
            </div>
            <p className="mt-2.5 text-[13px] font-bold text-[#1C1917] dark:text-white">Besoin d'aide ?</p>
            <p className="mt-1 text-[11px] leading-relaxed text-stone-500 dark:text-zinc-400">
              Consultez la documentation ou contactez le support.
            </p>
            <Link
              href="/comment-ca-marche"
              className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-semibold text-[#1D4ED8] hover:underline dark:text-[#93C5FD]"
            >
              Centre d'aide <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            </div>
          )}

          {/* Utilisateur */}
          <div className={`mt-4 flex items-center gap-3 border-t border-[#1C1917]/10 pt-4 dark:border-white/10 ${reduite ? 'flex-col justify-center gap-2 border-t-0 pt-0' : ''}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-[13px] font-bold text-white">
              {initiales}
            </div>
            {!reduite && (
              <div className="flex-1 leading-tight min-w-0">
                <p className="text-[13px] font-semibold text-[#1C1917] truncate dark:text-white">{nomClient || 'Mon compte'}</p>
                <p className="text-[11px] text-stone-500 dark:text-zinc-500">Compte client</p>
              </div>
            )}
            <button
              onClick={deconnexion}
              title="Déconnexion"
              aria-label="Déconnexion"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-stone-400 transition hover:bg-red-500/10 hover:text-red-600 dark:text-zinc-500 dark:hover:bg-red-500/15 dark:hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* Poignée de redimensionnement */}
        <span
          role="separator"
          aria-orientation="vertical"
          aria-label="Ajuster la largeur du menu"
          title="Glisser pour ajuster • double-clic pour réduire / agrandir"
          onMouseDown={demarrerRedimensionnement}
          onTouchStart={demarrerRedimensionnement}
          onDoubleClick={() => setReduite((r) => !r)}
          className="absolute -right-[7px] bottom-0 top-0 hidden w-[14px] cursor-ew-resize touch-none md:block"
        >
          <span className={`absolute inset-y-8 left-1/2 w-[3px] -translate-x-1/2 rounded-full transition-opacity ${redimensionne ? 'bg-[#2563EB] opacity-100' : 'bg-[#2563EB]/40 opacity-0 group-hover/sb:opacity-100'}`} />
        </span>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <div className={`flex min-h-screen flex-1 flex-col justify-between ${redimensionne ? '' : 'transition-[padding] duration-300 ease-in-out'} md:pl-[var(--sbw)]`}>
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
                      {compteAlertes > 0 && (
                        <button onClick={() => marquerLu('all')}
                          className="text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400">
                          Tout marquer comme lu
                        </button>
                      )}
                    </div>
                    {!alerteActive ? (
                      <p className="px-2 py-3 text-xs text-stone-500 dark:text-zinc-400">Aucune alerte. Tout va bien.</p>
                    ) : (
                      <>
                        {enAttente > 0 && (
                          <Link href="/espace/envois" onClick={() => { marquerLu('attente'); setClocheOuverte(false) }}
                            className={`flex items-start gap-2.5 rounded-lg p-2 hover:bg-stone-100 dark:hover:bg-zinc-800${fileNonLue ? '' : ' opacity-60'}`}>
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                            <span className="text-xs text-stone-600 dark:text-zinc-300">
                              <b>{enAttente} SMS en attente</b> d&apos;envoi.
                            </span>
                          </Link>
                        )}
                        {echoues > 0 && (
                          <Link href="/espace/envois" onClick={() => { marquerLu('echoues'); setClocheOuverte(false) }}
                            className={`flex items-start gap-2.5 rounded-lg p-2 hover:bg-stone-100 dark:hover:bg-zinc-800${echecsNonLus ? '' : ' opacity-60'}`}>
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
            <Link href="/comment-ca-marche" className="hover:underline">Guide d&apos;intégration</Link>
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
