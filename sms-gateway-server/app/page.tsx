'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  Server, Smartphone, Code, ArrowRight, ArrowUpRight, Check, CheckCircle2,
  Zap, MessageSquare, Moon, Sun, Loader2, Inbox, BarChart3, FolderKanban,
  QrCode, Download, ScanLine
} from 'lucide-react'
import { Tilt } from '../composants/Effets'
import QrCodeSvg from '../composants/QrCodeSvg'
import { useReveal } from '../lib/use-reveal'
import { useTheme } from '../lib/use-theme'

const DEMO_ETAPES = [  { titre: 'Requête HTTP reçue', desc: 'Le serveur valide le corps JSON et la clé API.', icone: Code },
  { titre: 'Mise en file d\'attente', desc: 'La tâche est assignée au relais Android disponible.', icone: Inbox },
  { titre: 'Transmission Push FCM', desc: 'Réveil instantané du téléphone en arrière-plan.', icone: Zap },
  { titre: 'Envoi radio SIM', desc: 'La carte SIM locale émet le SMS au destinataire.', icone: Smartphone },
]

// URL du fichier APK Android — surchargeable via NEXT_PUBLIC_URL_APK
// (ex. lien Play Store). Par défaut : APK déposé dans public/apk/smstsika.apk.
// Le QR exige une URL absolue : on préfixe avec l'origine du site.
const URL_APK = process.env.NEXT_PUBLIC_URL_APK || '/apk/smstsika.apk'
function urlApkAbsolue(): string {
  if (/^https?:\/\//i.test(URL_APK)) return URL_APK
  if (typeof window === 'undefined') return URL_APK
  return new URL(URL_APK, window.location.origin).href
}

export default function PageAccueilWeb() {
  const { modeSombre, monte, basculerTheme } = useTheme()
  useReveal()

  // URL du QR calculée après montage (identique serveur/client au 1er rendu).
  const [urlQrApk, setUrlQrApk] = useState(URL_APK)
  useEffect(() => { setUrlQrApk(urlApkAbsolue()) }, [])

  // Simulation interactive
  const [demoNumero, setDemoNumero] = useState('+261340000000')
  const [demoMessage, setDemoMessage] = useState('Votre commande est prête !')
  const [demoEnCours, setDemoEnCours] = useState(false)
  const [demoEtape, setDemoEtape] = useState(0)
  const [demoLogs, setDemoLogs] = useState<string[]>([])

  const demoValide = demoNumero.trim().length >= 8 && demoMessage.trim().length > 0

  async function lancerDemo() {
    if (!demoValide || demoEnCours) return
    setDemoEnCours(true)
    setDemoEtape(0)
    setDemoLogs([])

    const ajouterLog = (txt: string) => setDemoLogs(l => [...l, `[${new Date().toLocaleTimeString()}] ${txt}`])

    ajouterLog(`Démarrage de l'envoi vers ${demoNumero.trim()}...`)
    await new Promise(r => setTimeout(r, 600))
    setDemoEtape(1)
    ajouterLog(`[HTTP 200 OK] Requête POST validée par le serveur.`)

    await new Promise(r => setTimeout(r, 700))
    setDemoEtape(2)
    ajouterLog(`[FILE] Tâche enregistrée dans la base de données.`)

    await new Promise(r => setTimeout(r, 800))
    setDemoEtape(3)
    ajouterLog(`[FCM Push] Réveil du téléphone Android (Infinix X689C)...`)

    await new Promise(r => setTimeout(r, 900))
    setDemoEtape(4)
    ajouterLog(`[SIM OK] SMS transmis avec succès par l'opérateur.`)
    setDemoEnCours(false)
  }

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-800 font-sans antialiased selection:bg-blue-600 selection:text-white dark:bg-[#0B0F19] dark:text-zinc-100">

      {/* ================= 1. NAVBAR ================= */}
      <div className="sticky top-0 z-50 w-full">
        <header className="flex h-[72px] items-center justify-between border-b border-slate-200/60 bg-white/80 px-6 backdrop-blur-xl lg:px-12 dark:border-white/10 dark:bg-[#0B0F19]/85">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/icons/logoClair.png" alt="SMSTSIKA" width={180} height={44} className="h-11 w-auto dark:hidden" />
            <Image src="/icons/logoSombre.png" alt="SMSTSIKA" width={180} height={44} className="hidden h-11 w-auto dark:block" />
          </Link>

          <nav className="hidden items-center gap-8 text-[13px] font-medium text-slate-500 md:flex dark:text-zinc-400">
            <Link href="/fonctionnalites" className="relative transition hover:text-slate-950 dark:hover:text-white after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-[#2563EB] after:transition-all hover:after:w-full">Fonctionnalités</Link>
            <Link href="/comment-ca-marche" className="relative transition hover:text-slate-950 dark:hover:text-white after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-[#2563EB] after:transition-all hover:after:w-full">Comment ça marche</Link>
            <a href="#installer" className="relative transition hover:text-slate-950 dark:hover:text-white after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-[#2563EB] after:transition-all hover:after:w-full">Installer</a>
            <Link href="/cas-d-usage" className="relative transition hover:text-slate-950 dark:hover:text-white after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-[#2563EB] after:transition-all hover:after:w-full">Cas d'usage</Link>
            <Link href="/espace/api" className="relative transition hover:text-slate-950 dark:hover:text-white after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-[#2563EB] after:transition-all hover:after:w-full">API</Link>
            <Link href="/faq" className="relative transition hover:text-slate-950 dark:hover:text-white after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-[#2563EB] after:transition-all hover:after:w-full">FAQ</Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={basculerTheme}
              title={!monte ? 'Thème' : modeSombre ? 'Mode clair' : 'Mode sombre'}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/70 bg-white/70 text-slate-500 backdrop-blur-md transition hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-300 dark:hover:bg-white/10"
            >
              {!monte || !modeSombre ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <Link href="/login" className="hidden text-[13px] font-semibold text-slate-600 transition hover:text-slate-950 sm:block dark:hover:text-white dark:text-zinc-300">
              Connexion
            </Link>
            <Link
              href="/login"
              className="group inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-6 py-2.5 text-[13px] font-bold text-white shadow-[0_20px_40px_-15px_rgba(124,58,237,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-12px_rgba(124,58,237,0.6)]"
            >
              Commencer
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </header>
      </div>

      {/* ================= 2. HERO 2 COLONNES ================= */}
      <section className="relative overflow-hidden py-16 lg:py-24">
        <div className="orbe-derive pointer-events-none absolute left-1/4 top-0 h-[480px] w-[820px] rounded-full bg-blue-500/10 blur-[130px]" />

        <div className="relative grid w-full grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2 lg:gap-8 lg:px-12">
          {/* Colonne texte */}
          <div className="text-center lg:text-left">
            <div className="anim-entree inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-white/70 px-4 py-1.5 text-xs font-bold text-[#1D4ED8] shadow-sm backdrop-blur-md dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2563EB]" />
              </span>
              Passerelle SMS autohébergée
            </div>

            <h1 className="mt-7 text-4xl font-black leading-[1.08] tracking-[-0.03em] text-[#0F172A] sm:text-5xl xl:text-6xl dark:text-white">
              <span className="mot-anime block" style={{ animationDelay: '0ms' }}>Vos téléphones,</span>
              <span className="mot-anime block" style={{ animationDelay: '150ms' }}>
                deviennent votre{" "}
                <span className="texte-degrade-anime bg-gradient-to-r from-[#2563EB] via-[#38BDF8] to-[#2563EB] bg-clip-text text-transparent">passerelle&nbsp;SMS</span>
              </span>
              <span className="mot-anime block" style={{ animationDelay: '300ms' }}>— sans abonnement.</span>
            </h1>

            <p className="anim-entree mx-auto mt-7 max-w-2xl text-base leading-relaxed text-[#475569] sm:text-lg lg:mx-0 dark:text-zinc-400" style={{ animationDelay: '240ms' }}>
              Centralisez vos envois, suivez vos appareils et retrouvez vos messages. SMSTSIKA relie votre espace web à votre passerelle Android.
            </p>

            <div className="anim-entree mt-10 flex flex-wrap justify-center gap-4 lg:justify-start" style={{ animationDelay: '360ms' }}>
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-8 py-4 text-[15px] font-bold text-white shadow-[0_20px_40px_-15px_rgba(124,58,237,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-12px_rgba(124,58,237,0.6)]"
              >
                Ouvrir mon espace
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Link
                href="/comment-ca-marche"
                className="btn-bordure-lumineuse inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-8 py-4 text-[15px] font-bold text-slate-700 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 dark:border-white/15 dark:bg-white/[0.06] dark:text-zinc-100"
              >
                Comment ça marche
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="anim-entree mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-500 lg:justify-start dark:text-zinc-400" style={{ animationDelay: '420ms' }}>
              {['100 % autohébergé', 'Sans abonnement', 'Clé API sous 24 h'].map((g) => (
                <span key={g} className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-500" /> {g}
                </span>
              ))}
            </div>
          </div>

          {/* Colonne visuel */}
          <div className="anim-entree relative w-full [perspective:1800px]" style={{ animationDelay: '480ms' }}>
            <div className="pointer-events-none absolute -inset-10 rounded-[3rem] bg-gradient-to-br from-blue-500/15 via-blue-500/10 to-sky-400/10 blur-3xl" />
            <Tilt max={5}>
              <div className="relative grid grid-cols-1 items-center gap-6 [transform:rotateX(2deg)_rotateY(-2deg)] xl:grid-cols-[1fr_220px]">
                {/* Console Web */}
                <div className="relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/60 shadow-[0_40px_90px_-24px_rgba(124,58,237,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05]">
                  <div className="flex items-center gap-2 border-b border-slate-200/60 bg-white/60 px-5 py-3 backdrop-blur-md dark:border-white/10 dark:bg-black/20">
                    <span className="h-3 w-3 rounded-full bg-rose-400" />
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                    <span className="ml-3 hidden flex-1 truncate rounded-md bg-slate-100/80 px-3 py-1 text-left font-mono text-[11px] text-slate-400 sm:block dark:bg-white/10 dark:text-zinc-400">
                      console.smstsika.local — Vue d'ensemble
                    </span>
                  </div>
                  <Image
                    src="/landing/web.png"
                    alt="SMSTSIKA Console Web — Vue d'ensemble"
                    width={1879}
                    height={918}
                    priority
                    className="w-full h-auto"
                  />
                </div>
                {/* Smartphone Android */}
                <div className="relative z-10 mx-auto w-[230px] shrink-0 overflow-hidden rounded-[2.2rem] border-[5px] border-slate-900 bg-white shadow-[0_50px_100px_-20px_rgba(11,15,25,.55)] xl:-ml-16 xl:mt-10 xl:w-[220px] dark:border-white/15">
                  <Image
                    src="/landing/android.png"
                    alt="SMSTSIKA Application Mobile — Tâches reçues"
                    width={460}
                    height={985}
                    priority
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </Tilt>
          </div>
        </div>
      </section>

      {/* ================= 4. TROIS PILIERS & LIENS VERS INTERFACES DÉDIÉES ================= */}
      <section id="fonctionnalites" className="py-16 bg-white border-t border-slate-200/60 dark:bg-[#0B0F19] dark:border-white/10">
        <div className="w-full px-6 space-y-10 lg:px-12">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                icone: FolderKanban,
                titre: 'Fonctionnalités avancées',
                desc: 'Consultez la suite complète d\'outils : flotte Android, multi-SIM, file d\'attente et webhooks.',
                lien: '/fonctionnalites',
                libelleLien: 'Voir toutes les fonctionnalités ↗'
              },
              {
                icone: Smartphone,
                titre: 'Comment ça marche ?',
                desc: 'Découvrez les 3 étapes simples du déploiement serveur à l\'émission par carte SIM locale.',
                lien: '/comment-ca-marche',
                libelleLien: 'Découvrir le guide d\'intégration ↗'
              },
              {
                icone: BarChart3,
                titre: 'Cas d\'usage métiers',
                desc: 'Notifications e-commerce, rappels de rendez-vous et codes de vérification OTP.',
                lien: '/cas-d-usage',
                libelleLien: 'Explorer les cas d\'usage ↗'
              },
            ].map((p, i) => (
              <div key={i} className="group rounded-[1.5rem] bg-slate-50 p-8 space-y-4 border border-slate-100 transition-all duration-300 hover:-translate-y-1 hover:border-[#2563EB]/40 dark:bg-white/[0.04] dark:border-white/10 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold shadow-md shadow-blue-500/30">
                    <p.icone className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{p.titre}</h3>
                  <p className="text-xs leading-relaxed text-slate-500 dark:text-zinc-400">{p.desc}</p>
                </div>
                <Link href={p.lien} className="inline-flex items-center gap-1 text-xs font-bold text-[#2563EB] hover:underline dark:text-[#60A5FA] pt-2">
                  {p.libelleLien}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 4b. INSTALLER L'APP ANDROID ================= */}
      <section id="installer" className="py-16 bg-white border-t border-slate-200/60 dark:bg-[#0B0F19] dark:border-white/10">
        <div className="w-full px-6 space-y-10 lg:px-12">
          <div className="text-center space-y-3">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#2563EB] dark:text-[#60A5FA]">INSTALLATION EN 1 MINUTE</span>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
              Installez l'app, flashez, envoyez.
            </h2>
            <p className="text-base text-slate-500 max-w-xl mx-auto dark:text-zinc-400">
              Scannez le QR avec votre Android pour télécharger l'application relais, puis associez-la depuis la console.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* QR + téléchargement */}
            <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-8 space-y-5 text-center dark:border-white/10 dark:bg-white/[0.04]">
              <QrCodeSvg valeur={urlQrApk} taille={180} etiquette="QR de téléchargement de l'application Android" />
              <div className="space-y-2">
                <a
                  href={URL_APK}
                  download
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-8 py-3.5 text-sm font-bold text-white shadow-[0_20px_40px_-15px_rgba(124,58,237,0.5)] transition-all hover:-translate-y-0.5"
                >
                  <Download className="h-4 w-4" /> Télécharger l'APK
                </a>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                  Android 8.0+ · ~23 Mo · signature SMSTSIKA
                </p>
              </div>
            </div>

            {/* Étapes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icone: QrCode, titre: '1. Scannez', desc: 'Flashez le QR avec l\u2019appareil photo de votre Android.' },
                { icone: Download, titre: '2. Installez', desc: 'Ouvrez l\u2019APK et autorisez l\u2019installation une fois.' },
                { icone: ScanLine, titre: '3. Associez', desc: 'Flashez le QR de la console pour lier le téléphone.' },
                { icone: Smartphone, titre: '4. Envoyez', desc: 'Votre relais est actif : envoyez vos premiers SMS.' },
              ].map((s) => (
                <div key={s.titre} className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 space-y-3 dark:border-white/10 dark:bg-white/[0.04]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md shadow-blue-500/30">
                    <s.icone className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{s.titre}</p>
                  <p className="text-xs leading-relaxed text-slate-500 dark:text-zinc-400">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= 5. CALL TO ACTION FINAL ================= */}
      <section className="relative overflow-hidden py-20 bg-gradient-to-br from-[#110C2E] via-[#0B0A1F] to-[#070613] text-white">
        <div className="relative mx-auto max-w-4xl px-6 text-center space-y-6 lg:px-12">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-400">VOTRE PROCHAIN ENVOI COMMENCE ICI</span>
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Reprenez la main sur vos SMS.
          </h2>
          <p className="text-base text-blue-200/70 max-w-xl mx-auto">
            Un espace web pour piloter. Votre Android pour faire le lien.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-8 py-4 text-[15px] font-bold text-white shadow-[0_20px_40px_-15px_rgba(124,58,237,0.5)] transition-all hover:-translate-y-0.5"
            >
              Commencer avec SMSTSIKA
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/faq"
              className="btn-bordure-lumineuse inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-8 py-4 text-[15px] font-bold text-white shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5"
            >
              Questions fréquentes (FAQ)
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-slate-200/60 bg-white py-12 text-xs text-slate-500 dark:border-white/10 dark:bg-[#070613] dark:text-zinc-400">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 sm:grid-cols-2 lg:grid-cols-4 lg:px-12">
          <div className="space-y-4">
            <Image src="/icons/logoClair.png" alt="SMSTSIKA" width={150} height={36} className="h-9 w-auto dark:hidden" />
            <Image src="/icons/logoSombre.png" alt="SMSTSIKA" width={150} height={36} className="hidden h-9 w-auto dark:block" />
            <p className="text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
              Le pilotage SMS depuis le web, avec Android comme passerelle.
            </p>
          </div>
          <div className="space-y-3">
            <p className="font-bold text-slate-900 dark:text-white">Découvrir</p>
            <ul className="space-y-2">
              <li><Link href="/fonctionnalites" className="transition hover:text-slate-950 dark:hover:text-white">Fonctionnalités</Link></li>
              <li><Link href="/comment-ca-marche" className="transition hover:text-slate-950 dark:hover:text-white">Comment ça marche</Link></li>
              <li><Link href="/cas-d-usage" className="transition hover:text-slate-950 dark:hover:text-white">Cas d'usage</Link></li>
            </ul>
          </div>
          <div className="space-y-3">
            <p className="font-bold text-slate-900 dark:text-white">Ressources</p>
            <ul className="space-y-2">
              <li><Link href="/espace/api" className="transition hover:text-slate-950 dark:hover:text-white">Documentation API</Link></li>
              <li><Link href="/faq" className="transition hover:text-slate-950 dark:hover:text-white">Foire aux questions (FAQ)</Link></li>
            </ul>
          </div>
          <div className="space-y-3">
            <p className="font-bold text-slate-900 dark:text-white">Votre espace</p>
            <ul className="space-y-2">
              <li><Link href="/login" className="transition hover:text-slate-950 dark:hover:text-white">Connexion console</Link></li>
              <li><Link href="/login?onglet=client" className="transition hover:text-slate-950 dark:hover:text-white">Espace Client</Link></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-12 max-w-7xl border-t border-slate-200/60 px-6 pt-6 text-center text-[11px] text-slate-400 lg:px-12 dark:border-white/15 dark:text-zinc-500">
          © 2026 SMSTSIKA Gateway · Mentions légales · Confidentialité
        </div>
      </footer>

    </div>
  )
}
