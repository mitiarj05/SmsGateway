'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Server, Smartphone, Zap, ArrowUpRight, ArrowLeft, CheckCircle2, Moon, Sun } from 'lucide-react'
import { useTheme } from '../../lib/use-theme'
import { useReveal } from '../../lib/use-reveal'
import BarreProgressionDefilante from '../../composants/BarreProgressionDefilante'

export default function PageCommentCaMarche() {
  const { modeSombre, monte, basculerTheme } = useTheme()
  useReveal()
  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-800 font-sans antialiased selection:bg-blue-600 selection:text-white dark:bg-[#0B0F19] dark:text-zinc-100">
      <BarreProgressionDefilante />

      {/* Header Bar */}
      <header className="sticky top-0 z-50 flex h-[72px] w-full items-center justify-between px-6 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl lg:px-12 dark:border-white/10 dark:bg-[#0B0F19]/85">
        <Link href="/" className="flex items-center gap-3 group">
            <Image src="/icons/logoClair.png" alt="SMSTSIKA" width={180} height={44} className="h-11 w-auto dark:hidden" />
            <Image src="/icons/logoSombre.png" alt="SMSTSIKA" width={180} height={44} className="hidden h-11 w-auto dark:block" />
        </Link>

        <nav className="hidden items-center gap-8 text-[13px] font-medium text-slate-500 md:flex dark:text-zinc-400">
          <Link href="/fonctionnalites" className="hover:text-slate-950 transition dark:hover:text-white">Fonctionnalités</Link>
          <Link href="/comment-ca-marche" className="text-slate-950 font-bold dark:text-white">Comment ça marche</Link>
          <Link href="/cas-d-usage" className="hover:text-slate-950 transition dark:hover:text-white">Cas d'usage</Link>
          <Link href="/faq" className="hover:text-slate-950 transition dark:hover:text-white">FAQ</Link>
          <Link href="/espace/api" className="hover:text-slate-950 transition dark:hover:text-white">API</Link>
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

      {/* Hero */}
      <section data-reveal className="py-16 px-8 max-w-7xl mx-auto text-center space-y-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-white/70 px-4 py-1.5 text-xs font-bold text-[#1D4ED8] shadow-sm backdrop-blur-md dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-300">
          📱 Du Serveur à la Carte SIM
        </span>
        <h1 className="text-5xl font-black tracking-[-0.03em] sm:text-7xl text-[#0F172A] dark:text-white">
          Comment fonctionne la passerelle SMSIKA ?
        </h1>
        <p className="text-[#475569] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed dark:text-zinc-400">
          Un circuit simple et robuste en 3 étapes pour transformer n'importe quel téléphone Android connecté en relais SMS professionnel.
        </p>
      </section>

      {/* 3 Detailed Steps */}
      <section data-reveal className="py-12 px-8 max-w-5xl mx-auto border-t border-slate-200/60 dark:border-white/10 space-y-6">

        {/* Step 1 */}
        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-8 md:p-10 space-y-4 flex flex-col md:flex-row gap-8 items-start dark:border-white/10 dark:bg-white/[0.04]">
          <span className="text-4xl font-black text-blue-400 shrink-0">01</span>
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3 dark:text-white">
              <Server className="h-5 w-5 text-[#2563EB] dark:text-blue-400" />
              1. Déployez votre serveur SMS IKA
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed dark:text-zinc-400">
              Installez la console web SMS IKA sur votre serveur (ou utilisez l'instance cloud). La console centralise la gestion de vos téléphones, vos demandes d'envoi et la clé d'API.
            </p>
            <div className="flex flex-wrap gap-4 pt-1 text-xs text-emerald-600 font-semibold dark:text-emerald-400">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Node.js / Next.js</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Base de données Supabase / PostgreSQL</span>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-8 md:p-10 space-y-4 flex flex-col md:flex-row gap-8 items-start dark:border-white/10 dark:bg-white/[0.04]">
          <span className="text-4xl font-black text-blue-400 shrink-0">02</span>
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3 dark:text-white">
              <Smartphone className="h-5 w-5 text-[#2563EB] dark:text-blue-400" />
              2. Associez votre application mobile Android
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed dark:text-zinc-400">
              Téléchargez l'application SMSIKA Gateway sur votre téléphone Android. Ouvrez l'application et flashez le QR code généré sur la console web. Le téléphone est immédiatement reconnu comme relais d'envoi.
            </p>
            <div className="flex flex-wrap gap-4 pt-1 text-xs text-emerald-600 font-semibold dark:text-emerald-400">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Association instantanée en 1 clic</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Support Multi-SIM</span>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-8 md:p-10 space-y-4 flex flex-col md:flex-row gap-8 items-start dark:border-white/10 dark:bg-white/[0.04]">
          <span className="text-4xl font-black text-blue-400 shrink-0">03</span>
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3 dark:text-white">
              <Zap className="h-5 w-5 text-[#2563EB] dark:text-blue-400" />
              3. Envoyez vos SMS en toute autonomie
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed dark:text-zinc-400">
              Déclenchez vos envois depuis l'interface web ou via l'API REST. Les tâches sont remises instantanément au téléphone par notification push FCM. Le téléphone émet le SMS via la carte SIM locale et vous recevez l'accusé de réception.
            </p>
            <div className="flex flex-wrap gap-4 pt-1 text-xs text-emerald-600 font-semibold dark:text-emerald-400">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Traitement en arrière-plan</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Webhook de confirmation</span>
            </div>
          </div>
        </div>

      </section>

      {/* CTA Section */}
      <section data-reveal className="py-20 px-8 max-w-4xl mx-auto text-center space-y-6">
        <h2 className="text-4xl font-extrabold text-slate-900 sm:text-5xl dark:text-white">
          Prêt à connecter votre premier téléphone ?
        </h2>
        <div className="flex justify-center gap-4 pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-8 py-4 text-sm font-bold text-white shadow-[0_20px_40px_-15px_rgba(124,58,237,0.5)] transition-all hover:-translate-y-0.5"
          >
            Se connecter & Associer un téléphone ↗
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-6 py-4 text-sm font-bold text-slate-700 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 dark:border-white/15 dark:bg-white/[0.06] dark:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" /> Accueil
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 py-8 text-center text-xs text-slate-400 dark:border-white/10 dark:text-zinc-500">
        <p>© 2026 SMSTSIKA · Tous droits réservés</p>
      </footer>

    </div>
  )
}
