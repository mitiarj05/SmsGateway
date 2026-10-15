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
import BarreProgressionDefilante from '../composants/BarreProgressionDefilante'
import QrCodeSvg from '../composants/QrCodeSvg'
import { useReveal } from '../lib/use-reveal'
import { useTheme } from '../lib/use-theme'

const URL_APK = process.env.NEXT_PUBLIC_URL_APK || '/apk/smstsika.apk'
function urlApkAbsolue(): string {
  if (/^https?:\/\//i.test(URL_APK)) return URL_APK
  if (typeof window === 'undefined') return URL_APK
  return new URL(URL_APK, window.location.origin).href
}

export default function PageAccueilHumaine() {
  const { modeSombre, monte, basculerTheme } = useTheme()
  useReveal()

  const [urlQrApk, setUrlQrApk] = useState(URL_APK)
  useEffect(() => { setUrlQrApk(urlApkAbsolue()) }, [])

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-800 font-sans antialiased selection:bg-blue-600 selection:text-white dark:bg-[#0B0F19] dark:text-zinc-100">
      <BarreProgressionDefilante />

      {/* ================= NAVBAR ================= */}
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

      {/* ================= HERO SECTION (Avec effet Glassmorphism & Screenshot) ================= */}
      <section className="relative overflow-hidden py-16 lg:py-24">
        <div className="orbe-derive pointer-events-none absolute left-1/4 top-0 h-[480px] w-[820px] rounded-full bg-blue-500/10 blur-[130px]" />

        <div className="mx-auto max-w-7xl px-6 lg:px-12 text-center space-y-8 relative z-10">

          {/* Top Dark Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-white/70 px-4 py-1.5 text-xs font-bold text-[#1D4ED8] shadow-sm backdrop-blur-md dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2563EB]" />
            </span>
            Passerelle SMS sans abonnement
          </div>

          {/* H1 Title */}
          <h1 className="text-4xl font-black leading-[1.08] tracking-[-0.03em] text-[#0F172A] sm:text-5xl xl:text-6xl max-w-4xl mx-auto dark:text-white">
            Vos téléphones deviennent<br />
            <span className="texte-degrade-anime bg-gradient-to-r from-[#2563EB] via-[#38BDF8] to-[#2563EB] bg-clip-text text-transparent">votre passerelle SMS</span>.
          </h1>

          {/* Sub-headline */}
          <p className="max-w-2xl mx-auto text-base leading-relaxed text-[#475569] sm:text-lg dark:text-zinc-400">
            SMS IKA relie votre console web à vos appareils Android.<br />
            Vous envoyez depuis le navigateur. Vos SIM font le travail.<br />
            Vos tarifs, vos numéros, vos données — chez vous.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-8 py-4 text-[15px] font-bold text-white shadow-[0_20px_40px_-15px_rgba(124,58,237,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-12px_rgba(124,58,237,0.6)]"
            >
              Commencer avec SMS IKA
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link
              href="/comment-ca-marche"
              className="btn-bordure-lumineuse inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-8 py-4 text-[15px] font-bold text-slate-700 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 dark:border-white/15 dark:bg-white/[0.06] dark:text-zinc-100"
            >
              Découvrir comment ça marche
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Trust check bullets */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 pt-2 text-xs font-semibold text-slate-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-500" /> 100 % auto-hébergé</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-500" /> Sans abonnement</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-500" /> API ouverte 24 h/24</span>
          </div>

        </div>
      </section>

      {/* ================= SECTION FEATURES / PILIERS ================= */}
      <section className="py-20 px-6 lg:px-12 max-w-7xl mx-auto border-t border-slate-200/60 dark:border-white/10">
        <div data-reveal className="text-center space-y-3">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#2563EB] dark:text-[#60A5FA]">CONCRET, PAS ABSTRAIT</span>
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
            Voyez ce que vos SMS deviennent.
          </h2>
        </div>

        <div className="space-y-16 pt-12">
          {[
            {
              image: '/images/serveur.webp',
              alt: 'Console SMS IKA pilotant une flotte de téléphones Android',
              braille: 'PILOTEZ TOUTE VOTRE FLOTTE',
              titre: 'Chaque téléphone, sous vos yeux.',
              texte: 'Vos Android deviennent des relais visibles depuis la console : état de connexion, file d’attente, SIM actives. Fini le pilotage à l’aveugle — vous savez toujours par où partent vos messages.',
              lien: '/fonctionnalites',
              libelleLien: 'Voir toutes les fonctionnalités',
            },
            {
              image: '/images/sms.jpg',
              alt: 'Main tenant un téléphone, volume de messages en croissance',
              braille: 'DE L’ENVOI À LA CROISSANCE',
              titre: 'Des messages qui font grandir.',
              texte: 'Commandes prêtes, rappels, codes de vérification : chaque SMS est une occasion de faire revenir vos clients. Vous envoyez depuis la console, votre activité suit la courbe.',
              lien: '/comment-ca-marche',
              libelleLien: 'Découvrir le guide d’intégration',
            },
            {
              image: '/images/smsrecu.jpeg',
              alt: 'Vrai SMS reçu sur un téléphone',
              braille: 'DE VRAIS SMS, VRAIMENT REÇUS',
              titre: 'Vos clients le lisent vraiment.',
              texte: 'Pas un e-mail noyé dans les spams : un SMS lu en quelques minutes sur le téléphone de votre client. Rendez-vous confirmés, commandes retirées, avis laissés — la preuve par l’écran.',
              lien: '/cas-d-usage',
              libelleLien: 'Explorer les cas d’usage',
            },
          ].map((b, i) => (
            <div key={b.titre} data-reveal className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
              <div className={`bordure-faisceau relative overflow-hidden rounded-[2rem] shadow-[0_40px_90px_-24px_rgba(37,99,235,0.35)] ${i % 2 === 1 ? 'lg:order-2' : ''}`}>
                <Image
                  src={b.image}
                  alt={b.alt}
                  width={1200}
                  height={800}
                  className="h-72 w-full object-cover sm:h-80 lg:h-96"
                />
              </div>
              <div className={`space-y-4 ${i % 2 === 1 ? 'lg:order-1' : ''}`}>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#2563EB] dark:text-[#60A5FA]">{b.braille}</span>
                <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                  {b.titre}
                </h3>
                <p className="text-base leading-relaxed text-slate-500 dark:text-zinc-400">
                  {b.texte}
                </p>
                <Link href={b.lien} className="group inline-flex items-center gap-1.5 text-sm font-bold text-[#2563EB] hover:underline dark:text-[#60A5FA]">
                  {b.libelleLien}
                  <span className="transition-transform group-hover:translate-x-0.5">↗</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= TÉLÉCHARGER L'APK ================= */}
      <section id="installer" className="py-16 bg-white border-t border-slate-200/60 dark:bg-[#0B0F19] dark:border-white/10">
        <div className="w-full px-6 space-y-8 lg:px-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-4 text-left">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#2563EB] dark:text-[#60A5FA]">INSTALLATION RAPIDE</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Téléchargez l'application Android
            </h2>
            <p className="text-base text-slate-500 dark:text-zinc-400 leading-relaxed">
              Scannez le QR code avec votre téléphone pour télécharger l'application relais.
            </p>
            <div className="pt-2">
              <a
                href={URL_APK}
                download
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-8 py-3.5 text-sm font-bold text-white shadow-[0_20px_40px_-15px_rgba(124,58,237,0.5)] transition-all hover:-translate-y-0.5"
              >
                <Download className="h-4 w-4" /> Télécharger l'APK ↗
              </a>
            </div>
          </div>

          <div className="lg:col-span-6 flex justify-center">
            <div className="bordure-faisceau rounded-[2rem] border border-slate-100 bg-slate-50 p-8 text-center space-y-4 shadow-card max-w-sm w-full dark:border-white/10 dark:bg-white/[0.04]">
              <QrCodeSvg valeur={urlQrApk} taille={180} etiquette="QR de téléchargement de l'application Android" />
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Scannez pour installer l'application
              </p>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                Android 8.0+ · ~23 Mo · signature SMS IKA
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CALL TO ACTION FINAL ================= */}
      <section className="relative overflow-hidden py-20 bg-gradient-to-br from-[#110C2E] via-[#0B0A1F] to-[#070613] text-white">
        <div className="orbe-derive pointer-events-none absolute left-1/2 top-0 h-[320px] w-[640px] -translate-x-1/2 rounded-full bg-blue-500/15 blur-[110px]" />
        <div data-reveal className="relative mx-auto max-w-4xl px-6 text-center space-y-6 lg:px-12">
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
              Commencer avec SMS IKA
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
              <li><Link href="/login?onglet=client" className="transition hover:text-slate-950 dark:hover:text-white">Espace client</Link></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-12 max-w-7xl border-t border-slate-200/60 px-6 pt-6 text-center text-[11px] text-slate-400 lg:px-12 dark:border-white/15 dark:text-zinc-500">
          © 2026 SMS IKA Gateway · Mentions légales · Confidentialité
        </div>
      </footer>

    </div>
  )
}
