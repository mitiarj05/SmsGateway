'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown, ArrowUpRight, ArrowLeft, Moon, Sun } from 'lucide-react'
import { useTheme } from '../../lib/use-theme'

export default function PageFAQ() {
  const { modeSombre, monte, basculerTheme } = useTheme()
  const [recherche, setRecherche] = useState('')

  const faqs = [
    {
      q: "Quel est le rôle du téléphone Android ?",
      r: "Le téléphone Android agit comme une passerelle d'émission. L'application mobile SMSIKA tourne en arrière-plan, reçoit les tâches de votre serveur via notification push FCM et utilise la carte SIM insérée dans le téléphone pour envoyer le SMS au destinataire."
    },
    {
      q: "Ai-je besoin d'un abonnement spécial chez SMS IKA ?",
      r: "Non. SMS IKA est une passerelle autohébergée sans abonnement tiers. Vous prenez en charge votre propre serveur (ou hébergement cloud) et vous utilisez vos propres forfaits téléphoniques auprès de vos opérateurs habituels."
    },
    {
      q: "Comment connecter plusieurs cartes SIM ?",
      r: "Si votre téléphone possède deux emplacements SIM (Dual SIM), vous pouvez configurer le mode Multi-SIM dans l'application Android. Vous pouvez choisir une rotation automatique (par exemple basculer toutes les 10 tâches) ou sélectionner manuellement la SIM par défaut."
    },
    {
      q: "Que se passe-t-il si le téléphone n'a plus de réseau ?",
      r: "Les tâches d'envoi restent en file d'attente sur le serveur. Dès que le téléphone retrouve du réseau mobile ou du Wi-Fi, l'application se réveille et traite la file en attente."
    },
    {
      q: "Puis-je envoyer des SMS depuis mon application web ou mobile ?",
      r: "Oui ! L'API REST vous permet d'envoyer des SMS en une simple requête HTTP POST. Vous pouvez aussi configurer des Webhooks pour recevoir les notifications de livraison et les SMS entrants."
    },
    {
      q: "Comment fonctionne l'Espace Client ?",
      r: "L'administrateur génère une clé API dédiée pour chaque client ou application. En vous connectant à l'Espace Client avec votre clé API, vous pouvez consulter vos envois, vos statistiques et vos SMS reçus."
    }
  ]

  const faqsFiltrees = faqs.filter(f =>
    f.q.toLowerCase().includes(recherche.toLowerCase()) ||
    f.r.toLowerCase().includes(recherche.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-800 font-sans antialiased selection:bg-blue-600 selection:text-white dark:bg-[#0B0F19] dark:text-zinc-100">

      {/* Header Bar */}
      <header className="sticky top-0 z-50 flex h-[72px] w-full items-center justify-between px-6 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl lg:px-12 dark:border-white/10 dark:bg-[#0B0F19]/85">
        <Link href="/" className="flex items-center gap-3 group">
            <Image src="/icons/logoClair.png" alt="SMSTSIKA" width={180} height={44} className="h-11 w-auto dark:hidden" />
            <Image src="/icons/logoSombre.png" alt="SMSTSIKA" width={180} height={44} className="hidden h-11 w-auto dark:block" />
        </Link>

        <nav className="hidden items-center gap-8 text-[13px] font-medium text-slate-500 md:flex dark:text-zinc-400">
          <Link href="/fonctionnalites" className="hover:text-slate-950 transition dark:hover:text-white">Fonctionnalités</Link>
          <Link href="/comment-ca-marche" className="hover:text-slate-950 transition dark:hover:text-white">Comment ça marche</Link>
          <Link href="/cas-d-usage" className="hover:text-slate-950 transition dark:hover:text-white">Cas d'usage</Link>
          <Link href="/faq" className="text-slate-950 font-bold dark:text-white">FAQ</Link>
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
      <section className="py-16 px-8 max-w-7xl mx-auto text-center space-y-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-white/70 px-4 py-1.5 text-xs font-bold text-[#1D4ED8] shadow-sm backdrop-blur-md dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-300">
          ❓ Foire Aux Questions
        </span>
        <h1 className="text-5xl font-black tracking-[-0.03em] sm:text-7xl text-[#0F172A] dark:text-white">
          Les réponses à vos questions
        </h1>
        <p className="text-[#475569] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed dark:text-zinc-400">
          Retrouvez tout ce qu'il faut savoir sur l'installation, le fonctionnement et la sécurité de la passerelle SMS IKA.
        </p>

        {/* Barre de recherche */}
        <div className="max-w-md mx-auto pt-4">
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher une question (ex. Android, SIM, API)..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 dark:border-white/10 dark:bg-black/30 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
        </div>
      </section>

      {/* Questions Accordions */}
      <section className="py-12 px-8 max-w-3xl mx-auto border-t border-slate-200/60 dark:border-white/10 space-y-4">
        {faqsFiltrees.map((f, i) => (
          <details key={i} className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-[#2563EB]/40 hover:shadow-[0_20px_40px_-15px_rgba(37,99,235,0.25)] dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-[#60A5FA]/40">
            <summary className="flex cursor-pointer items-center justify-between font-bold text-slate-900 text-sm sm:text-base dark:text-white">
              {f.q}
              <span className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200/70 text-slate-500 transition group-open:rotate-180 group-open:bg-[#2563EB] group-open:text-white dark:bg-white/10 dark:text-zinc-400">
                <ChevronDown className="h-4 w-4" />
              </span>
            </summary>
            <p className="mt-4 text-sm leading-relaxed text-slate-500 border-t border-slate-200/60 pt-3 dark:text-zinc-400 dark:border-white/10">
              {f.r}
            </p>
          </details>
        ))}
      </section>

      {/* CTA Section */}
      <section className="py-20 px-8 max-w-4xl mx-auto text-center space-y-6">
        <h2 className="text-4xl font-extrabold text-slate-900 sm:text-5xl dark:text-white">
          Vous n'avez pas trouvé votre réponse ?
        </h2>
        <p className="text-slate-500 text-sm dark:text-zinc-400">
          Consultez le guide d'intégration ou contactez notre support technique.
        </p>
        <div className="flex justify-center gap-4 pt-2">
          <Link
            href="/espace/api"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-8 py-4 text-sm font-bold text-white shadow-[0_20px_40px_-15px_rgba(124,58,237,0.5)] transition-all hover:-translate-y-0.5"
          >
            Consulter la documentation API ↗
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
