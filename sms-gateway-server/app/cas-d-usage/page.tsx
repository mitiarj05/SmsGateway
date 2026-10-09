'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Calendar, ShieldCheck, Bell, ArrowUpRight, ArrowLeft, Moon, Sun } from 'lucide-react'
import { useTheme } from '../../lib/use-theme'
import { useReveal } from '../../lib/use-reveal'
import BarreProgressionDefilante from '../../composants/BarreProgressionDefilante'

export default function PageCasDUsage() {
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
          <Link href="/comment-ca-marche" className="hover:text-slate-950 transition dark:hover:text-white">Comment ça marche</Link>
          <Link href="/cas-d-usage" className="text-slate-950 font-bold dark:text-white">Cas d'usage</Link>
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
          💼 Applications Métiers
        </span>
        <h1 className="text-5xl font-black tracking-[-0.03em] sm:text-7xl text-[#0F172A] dark:text-white">
          Le bon SMS au bon moment
        </h1>
        <p className="text-[#475569] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed dark:text-zinc-400">
          Découvrez comment les entreprises et développeurs intègrent SMS IKA dans leurs parcours clients au quotidien.
        </p>
      </section>

      {/* 4 Use Case Cards */}
      <section data-reveal className="py-12 px-8 max-w-7xl mx-auto border-t border-slate-200/60 dark:border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Use Case 1 */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-8 space-y-6 hover:border-[#2563EB]/50 transition-colors dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md shadow-blue-500/30">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#60A5FA]">E-Commerce & Boutiques</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Suivi de commande & Click & Collect</h3>
              </div>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed dark:text-zinc-400">
              Prévenez automatiquement vos clients à chaque changement de statut de leur commande (expédiée, disponible en magasin, livraison imminente).
            </p>
            <div className="rounded-xl bg-blue-50/70 p-4 border border-blue-100 text-xs space-y-1 dark:bg-blue-500/10 dark:border-blue-500/20">
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">EXEMPLE SMS</p>
              <p className="font-medium text-slate-800 dark:text-zinc-100">"Bonjour Léa, votre commande #4812 est prête ! Vous pouvez la retirer à la boutique."</p>
            </div>
          </div>

          {/* Use Case 2 */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-8 space-y-6 hover:border-[#2563EB]/50 transition-colors dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md shadow-blue-500/30">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#60A5FA]">Santé & Services</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Rappels de rendez-vous</h3>
              </div>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed dark:text-zinc-400">
              Réduisez jusqu'à 80 % le taux de rendez-vous manqués en envoyant un rappel SMS automatique 24 heures avant la date prévue.
            </p>
            <div className="rounded-xl bg-blue-50/70 p-4 border border-blue-100 text-xs space-y-1 dark:bg-blue-500/10 dark:border-blue-500/20">
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">EXEMPLE SMS</p>
              <p className="font-medium text-slate-800 dark:text-zinc-100">"Rappel : vous avez rendez-vous demain à 14h00 avec le Dr. Martin. Pour annuler, répondez STOP."</p>
            </div>
          </div>

          {/* Use Case 3 */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-8 space-y-6 hover:border-[#2563EB]/50 transition-colors dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md shadow-blue-500/30">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#60A5FA]">Sécurité & SaaS</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Codes de vérification OTP</h3>
              </div>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed dark:text-zinc-400">
              Sécurisez la création de compte et les connexions sur votre application mobile ou site web avec des codes à usage unique envoyés en moins de 3 secondes.
            </p>
            <div className="rounded-xl bg-blue-50/70 p-4 border border-blue-100 text-xs space-y-1 dark:bg-blue-500/10 dark:border-blue-500/20">
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">EXEMPLE SMS</p>
              <p className="font-medium text-slate-800 dark:text-zinc-100">"Votre code de vérification SMSIKA est : 849201. Valable pendant 5 minutes. Ne le partagez pas."</p>
            </div>
          </div>

          {/* Use Case 4 */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-8 space-y-6 hover:border-[#2563EB]/50 transition-colors dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md shadow-blue-500/30">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#60A5FA]">Logistique & Operations</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Alertes internes & Systèmes</h3>
              </div>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed dark:text-zinc-400">
              Alertez immédiatement votre équipe d'astreinte ou vos techniciens en cas d'anomalie critique sur vos serveurs ou votre réseau.
            </p>
            <div className="rounded-xl bg-blue-50/70 p-4 border border-blue-100 text-xs space-y-1 dark:bg-blue-500/10 dark:border-blue-500/20">
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">EXEMPLE SMS</p>
              <p className="font-medium text-slate-800 dark:text-zinc-100">"[ALERTE] Charge serveur #02 &gt; 95% depuis 5 min. Action requise immédiatement."</p>
            </div>
          </div>

        </div>
      </section>

      {/* CTA Section */}
      <section data-reveal className="py-20 px-8 max-w-4xl mx-auto text-center space-y-6">
        <h2 className="text-4xl font-extrabold text-slate-900 sm:text-5xl dark:text-white">
          Prêt à automatiser vos envois SMS ?
        </h2>
        <div className="flex justify-center gap-4 pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-8 py-4 text-sm font-bold text-white shadow-[0_20px_40px_-15px_rgba(124,58,237,0.5)] transition-all hover:-translate-y-0.5"
          >
            Se connecter à SMSIKA ↗
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
