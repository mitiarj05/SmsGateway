'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  MessageSquare, Smartphone, Inbox, History,
  BarChart3, Zap, Shield, ArrowUpRight, RefreshCw, Cpu
} from 'lucide-react'
import { useReveal } from '../../lib/use-reveal'
import BarreProgressionDefilante from '../../composants/BarreProgressionDefilante'

const FONCTIONNALITES = [
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
]

export default function PageFonctionnalites() {
  useReveal()
  return (
    <div className="min-h-screen bg-[#F7F5F0] font-sans text-[#1C1917] antialiased selection:bg-[#2563EB] selection:text-white">
      <BarreProgressionDefilante />

      <div className="sticky top-0 z-50 w-full border-b border-[#1C1917]/10 bg-[#F7F5F0]/90 backdrop-blur">
        <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="SMSTSIKA — accueil">
            <Image src="/icons/logoClair.png" alt="SMSTSIKA" width={160} height={38} className="h-9 w-auto" />
          </Link>
          <nav className="hidden items-center gap-7 text-[13.5px] font-medium text-stone-600 lg:flex">
            <Link href="/fonctionnalites" className="font-bold text-[#1C1917]">Fonctionnalités</Link>
            <Link href="/comment-ca-marche" className="transition hover:text-[#1C1917]">Comment ça marche</Link>
            <Link href="/cas-d-usage" className="transition hover:text-[#1C1917]">Cas d’usage</Link>
            <Link href="/faq" className="transition hover:text-[#1C1917]">FAQ</Link>
          </nav>
          <div className="flex items-center gap-5">
            <Link href="/login" className="hidden text-[13.5px] font-semibold text-stone-600 transition hover:text-[#1C1917] sm:block">
              Connexion
            </Link>
            <Link
              href="/login"
              className="group inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#1D4ED8]"
            >
              Commencer
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </header>
      </div>

      <main className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="max-w-2xl pb-12 pt-14">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#1D4ED8]">Puissance & Contrôle</p>
          <h1 className="mt-3 font-sans text-4xl font-extrabold tracking-tight sm:text-5xl">
            Toutes les fonctionnalités de SMS IKA
          </h1>
          <p className="mt-4 font-sans text-[15px] leading-relaxed text-stone-600">
            Découvrez la suite complète d'outils intégrés à la console web et à l'application mobile Android pour piloter vos campagnes et notifications SMS.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
          {FONCTIONNALITES.map((f) => (
            <li key={f.titre} data-reveal className="flex gap-4 border-t border-[#1C1917]/10 py-7">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#1C1917]/10 bg-white">
                <f.icone className="h-5 w-5 text-[#1D4ED8]" />
              </span>
              <div className="min-w-0">
                <h2 className="font-sans text-[17px] font-extrabold tracking-tight">{f.titre}</h2>
                <p className="mt-1.5 font-sans text-[13.5px] leading-relaxed text-stone-600">{f.desc}</p>
              </div>
            </li>
          ))}
        </ul>

        <div data-reveal className="my-16 rounded-2xl bg-[#1C1917] px-6 py-14 text-center sm:px-12">
          <h2 className="mx-auto max-w-xl font-sans text-3xl font-extrabold tracking-tight text-[#F7F5F0] sm:text-4xl">
            Prêt à tester par vous-même ?
          </h2>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#1D4ED8]"
            >
              Accéder à la console ↗
            </Link>
            <Link
              href="/demande-acces"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#1C1917]/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 lg:px-8">
          <p className="font-mono text-[11px] text-stone-500">© 2026 SMSTSIKA · Tous droits réservés</p>
          <p className="flex gap-3 font-mono text-[11px] text-stone-500">
            <Link href="/mentions-legales" className="transition hover:text-[#1C1917] hover:underline">Mentions légales</Link>
            <span>|</span>
            <Link href="/confidentialite" className="transition hover:text-[#1C1917] hover:underline">Confidentialité</Link>
          </p>
        </div>
      </footer>

    </div>
  )
}
