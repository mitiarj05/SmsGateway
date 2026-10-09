'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  MessageSquare, Smartphone, Server, CheckCircle2, Inbox, History,
  BarChart3, Zap, Shield, ArrowUpRight, ArrowLeft, RefreshCw, Cpu, Moon, Sun
} from 'lucide-react'
import { useTheme } from '../../lib/use-theme'
import { useReveal } from '../../lib/use-reveal'
import BarreProgressionDefilante from '../../composants/BarreProgressionDefilante'

export default function PageFonctionnalites() {
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
          <Link href="/fonctionnalites" className="text-slate-950 font-bold dark:text-white">Fonctionnalités</Link>
          <Link href="/comment-ca-marche" className="hover:text-slate-950 transition dark:hover:text-white">Comment ça marche</Link>
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

      {/* Hero Section */}
      <section data-reveal className="py-16 px-8 max-w-7xl mx-auto text-center space-y-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-white/70 px-4 py-1.5 text-xs font-bold text-[#1D4ED8] shadow-sm backdrop-blur-md dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-300">
          ⚡ Puissance & Contrôle
        </span>
        <h1 className="text-5xl font-black tracking-[-0.03em] sm:text-7xl text-[#0F172A] dark:text-white">
          Toutes les fonctionnalités de SMS IKA
        </h1>
        <p className="text-[#475569] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed dark:text-zinc-400">
          Découvrez la suite complète d'outils intégrés à la console web et à l'application mobile Android pour piloter vos campagnes et notifications SMS.
        </p>
      </section>

      {/* Features Grid */}
      <section data-reveal className="py-12 px-8 max-w-7xl mx-auto border-t border-slate-200/60 dark:border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icone: Smartphone,
              titre: "Gestion de flotte Android",
              desc: "Associez un ou plusieurs téléphones Android. Surveillez en direct l'état de chaque relais : niveau de batterie, état de la charge, signal réseau et permissions."
            },
            {
              icone: RefreshCw,
              titre: "Gestion Multi-SIM & Rotation",
              desc: "Activez la rotation automatique des cartes SIM (par exemple, bascule toutes les 10 tâches) pour équilibrer la charge d'envoi et préserver vos forfaits."
            },
            {
              icone: Inbox,
              titre: "File d'attente intelligente",
              desc: "Gérez les envois massifs avec mise en file d'attente automatique. Les messages sont distribués en temps réel dès qu'un téléphone est disponible."
            },
            {
              icone: MessageSquare,
              titre: "Réception centralisée des SMS",
              desc: "Consultez tous les SMS reçus sur vos téléphones Android directement dans l'interface web, avec retransmission automatique par Webhook."
            },
            {
              icone: History,
              titre: "Journal d'événements & Audit",
              desc: "Accédez à un historique détaillé de chaque envoi (horodatage, ID de tâche, statut du relais, réponses de l'opérateur) pour auditer vos flux."
            },
            {
              icone: BarChart3,
              titre: "Statistiques & Rythme d'envoi",
              desc: "Analysez vos volumes quotidiens et hebdomadaires, vos taux de livraison et votre débit SMS/heure avec des graphiques clairs."
            },
            {
              icone: Zap,
              titre: "Webhooks instantanés",
              desc: "Recevez les événements d'envoi, de livraison et les SMS entrants directement sur vos serveurs ou votre application tierce en temps réel."
            },
            {
              icone: Shield,
              titre: "Sécurité & Clés API dédiées",
              desc: "Générez des clés d'API sécurisées pour chaque application ou client, avec contrôle d'accès et traçabilité complète."
            },
            {
              icone: Cpu,
              titre: "Mode Hors Ligne & Reprise",
              desc: "L'application Android continue de fonctionner en arrière-plan et synchronise automatiquement les tâches dès le rétablissement du réseau."
            }
          ].map((f, i) => (
            <div key={i} className="group rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-8 space-y-4 hover:-translate-y-1 hover:border-[#2563EB]/50 transition-all duration-300 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md shadow-blue-500/30 transition-transform duration-300 group-hover:scale-110">
                <f.icone className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{f.titre}</h3>
              <p className="text-sm leading-relaxed text-slate-500 dark:text-zinc-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section data-reveal className="py-20 px-8 max-w-4xl mx-auto text-center space-y-6">
        <h2 className="text-4xl font-extrabold text-slate-900 sm:text-5xl dark:text-white">
          Prêt à tester par vous-même ?
        </h2>
        <div className="flex justify-center gap-4 pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-8 py-4 text-sm font-bold text-white shadow-[0_20px_40px_-15px_rgba(124,58,237,0.5)] transition-all hover:-translate-y-0.5"
          >
            Accéder à la console ↗
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-6 py-4 text-sm font-bold text-slate-700 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 dark:border-white/15 dark:bg-white/[0.06] dark:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
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
