'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import {
  MessageSquare, Smartphone, Inbox, History, Settings, LayoutDashboard,
  Moon, Sun, ChevronRight, Bell, LogOut, Search, AlertTriangle, X, UserPlus,
} from 'lucide-react'
import { Modale } from './interface'
import { useTheme } from '../lib/use-theme'

const NAVIGATION = [
  { href: '/dashboard', icone: LayoutDashboard, etiquette: 'Tableau de bord' },
  { href: '/devices', icone: Smartphone, etiquette: 'Appareils' },
  { href: '/devices/add', icone: UserPlus, etiquette: 'Ajouter' },
  { href: '/queue', icone: Inbox, etiquette: 'File d’attente' },
  { href: '/inbox', icone: MessageSquare, etiquette: 'Réception' },
  { href: '/history', icone: History, etiquette: 'Historique' },
  { href: '/settings', icone: Settings, etiquette: 'Paramètres' },
]

export default function CoquilleTableauDeBord({ titre, sousTitre, actions, children }: {
  titre: string; sousTitre?: string; actions?: React.ReactNode; children: React.ReactNode
}) {
  const chemin = usePathname()

  /* Thème partagé (init paresseuse, suivi OS, theme-color mobile). */
  const { modeSombre, monte, basculerTheme } = useTheme()

  const [enAttente, setEnAttente] = useState(0)
  const [echoues, setEchoues] = useState(0)
  const [seuilFile, setSeuilFile] = useState(10)
  const [banniereIgnoreePour, setBanniereIgnoreePour] = useState<number | null>(null)

  /* Filigrane lu/non-lu : une alerte lue ne revient que si son compteur augmente. */
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
    } catch { /* défaut ci-dessous */ }
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
  const [menuUtilisateurOuvert, setMenuUtilisateurOuvert] = useState(false)
  const [paletteOuverte, setPaletteOuverte] = useState(false)
  const [requete, setRequete] = useState('')

  /* Scrutation stats + seuil pour la cloche et la bannière */
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
    <div className="flex min-h-screen bg-zinc-100 dark:bg-zinc-950">
      {/* SIDEBAR */}
      <aside className="hidden w-64 flex-col border-r border-zinc-200 bg-white md:flex dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex h-16 items-center gap-3 border-b border-zinc-100 px-5 dark:border-zinc-800">
          <Image src="/smsika.png" alt="SMSIKA" width={36} height={36} className="rounded-xl" />
          <div>
            <p className="text-sm font-bold text-zinc-900 dark:text-white">SMSIKA</p>
            <p className="text-xs text-zinc-400">Panneau de contrôle</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAVIGATION.map((item) => {
            const active = chemin === item.href ||
              (item.href !== '/devices' && chemin.startsWith(item.href + '/'))
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100'
                }`}>
                <item.icone className="h-4 w-4" />
                {item.etiquette}
                {item.href === '/queue' && enAttente > 0 && (
                  <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                    {enAttente}
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

            {/* Cloche */}
            <div className="relative">
              <button onClick={() => { setClocheOuverte(!clocheOuverte); setMenuUtilisateurOuvert(false) }}
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
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">Notifications</p>
                    {compteAlertes > 0 && (
                      <button onClick={() => marquerLu('all')}
                        className="text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400">
                        Tout marquer comme lu
                      </button>
                    )}
                  </div>
                  {!alerteActive ? (
                    <p className="px-2 py-3 text-xs text-zinc-400">Aucune alerte. Tout va bien.</p>
                  ) : (
                    <>
                      {alerteFile && (
                        <Link href="/queue" onClick={() => { marquerLu('queue'); setClocheOuverte(false) }}
                          className={`flex items-start gap-2.5 rounded-lg p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 ${fileNonLue ? '' : 'opacity-60'}`}>
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                          <span className="text-xs text-zinc-600 dark:text-zinc-300">
                            <b>{enAttente} SMS en attente</b> — file au-delà du seuil de {seuilFile}.
                          </span>
                        </Link>
                      )}
                      {echoues > 0 && (
                        <Link href="/history" onClick={() => { marquerLu('echoues'); setClocheOuverte(false) }}
                          className={`flex items-start gap-2.5 rounded-lg p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 ${echecsNonLus ? '' : 'opacity-60'}`}>
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                          <span className="text-xs text-zinc-600 dark:text-zinc-300">
                            <b>{echoues} échec(s)</b> à traiter dans l&apos;historique.
                          </span>
                        </Link>
                      )}
                      {compteAlertes === 0 && (
                        <p className="px-2 py-1.5 text-[11px] text-zinc-400">Tout est lu.</p>
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

            {/* Menu utilisateur */}
            <div className="relative">
              <button onClick={() => { setMenuUtilisateurOuvert(!menuUtilisateurOuvert); setClocheOuverte(false) }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                A
              </button>
              {menuUtilisateurOuvert && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
                  <div className="border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">Administrateur</p>
                    <p className="text-[11px] text-zinc-400">Session locale</p>
                  </div>
                  <button onClick={deconnexion}
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
        {afficherBanniere && (
          <div className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-6 py-2.5 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
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
