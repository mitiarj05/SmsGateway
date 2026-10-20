'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Calendar, ShieldCheck, Bell, ArrowUpRight, ArrowRight } from 'lucide-react'
import { useReveal } from '../../lib/use-reveal'
import BarreProgressionDefilante from '../../composants/BarreProgressionDefilante'

const CAS = [
  {
    icone: ShoppingBag,
    secteur: 'E-Commerce & Boutiques',
    titre: 'Suivi de commande & Click & Collect',
    texte: 'Prévenez automatiquement vos clients à chaque changement de statut de leur commande (expédiée, disponible en magasin, livraison imminente).',
    exemple: '"Bonjour Léa, votre commande #4812 est prête ! Vous pouvez la retirer à la boutique."',
  },
  {
    icone: Calendar,
    secteur: 'Santé & Services',
    titre: 'Rappels de rendez-vous',
    texte: 'Réduisez jusqu\'à 80 % le taux de rendez-vous manqués en envoyant un rappel SMS automatique 24 heures avant la date prévue.',
    exemple: '"Rappel : vous avez rendez-vous demain à 14h00 avec le Dr. Martin. Pour annuler, répondez STOP."',
  },
  {
    icone: ShieldCheck,
    secteur: 'Sécurité & SaaS',
    titre: 'Codes de vérification OTP',
    texte: 'Sécurisez la création de compte et les connexions sur votre application mobile ou site web avec des codes à usage unique envoyés en moins de 3 secondes.',
    exemple: '"Votre code de vérification SMSIKA est : 849201. Valable pendant 5 minutes. Ne le partagez pas."',
  },
  {
    icone: Bell,
    secteur: 'Logistique & Operations',
    titre: 'Alertes internes & Systèmes',
    texte: "Alertez immédiatement votre équipe d'astreinte ou vos techniciens en cas d'anomalie critique sur vos serveurs ou votre réseau.",
    exemple: '"[ALERTE] Charge serveur #02 > 95% depuis 5 min. Action requise immédiatement."',
  },
]

export default function PageCasDUsage() {
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
            <Link href="/fonctionnalites" className="transition hover:text-[#1C1917]">Fonctionnalités</Link>
            <Link href="/comment-ca-marche" className="transition hover:text-[#1C1917]">Brancher votre site</Link>
            <Link href="/cas-d-usage" className="font-bold text-[#1C1917]">Cas d’usage</Link>
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
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#1D4ED8]">Applications Métiers</p>
          <h1 className="mt-3 font-sans text-4xl font-extrabold tracking-tight sm:text-5xl">
            Le bon SMS au bon moment
          </h1>
          <p className="mt-4 font-sans text-[15px] leading-relaxed text-stone-600">
            Découvrez comment les entreprises et développeurs intègrent SMS IKA dans leurs parcours clients au quotidien.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 pb-4 md:grid-cols-2">
          {CAS.map((c) => (
            <article key={c.titre} data-reveal className="flex flex-col rounded-xl border border-[#1C1917]/10 bg-white p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#1C1917]/10 bg-[#F7F5F0]">
                  <c.icone className="h-5 w-5 text-[#1D4ED8]" />
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#1D4ED8]">{c.secteur}</p>
                  <h2 className="truncate font-sans text-[17px] font-extrabold tracking-tight">{c.titre}</h2>
                </div>
              </div>
              <p className="mt-3 flex-1 font-sans text-[13.5px] leading-relaxed text-stone-600">
                {c.texte}
              </p>
              <div className="mt-4 rounded-lg bg-[#F7F5F0] p-3">
                <p className="mb-1.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-stone-400">Exemple SMS</p>
                <p className="font-sans text-[12.5px] font-medium leading-relaxed text-[#1C1917]">{c.exemple}</p>
              </div>
            </article>
          ))}
        </div>

        <div data-reveal className="my-16 rounded-2xl bg-[#1C1917] px-6 py-14 text-center sm:px-12">
          <h2 className="mx-auto max-w-xl font-sans text-3xl font-extrabold tracking-tight text-[#F7F5F0] sm:text-4xl">
            Prêt à automatiser vos envois SMS ?
          </h2>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#1D4ED8]"
            >
              Se connecter à SMSIKA ↗
            </Link>
            <Link
              href="/demande-acces"
              className="group inline-flex items-center gap-2 rounded-lg border border-white/20 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Créer un compte
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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
