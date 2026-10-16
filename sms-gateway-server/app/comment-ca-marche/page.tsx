'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Server, Smartphone, Zap, ArrowUpRight, CheckCircle2, ArrowRight } from 'lucide-react'
import { useReveal } from '../../lib/use-reveal'
import BarreProgressionDefilante from '../../composants/BarreProgressionDefilante'

const ETAPES = [
  {
    numero: '01',
    icone: Server,
    titre: '1. Déployez votre serveur SMS IKA',
    texte: "Installez la console web SMS IKA sur votre serveur (ou utilisez l'instance cloud). La console centralise la gestion de vos téléphones, vos demandes d'envoi et la clé d'API.",
    puces: ['Node.js / Next.js', 'Base de données Supabase / PostgreSQL'],
  },
  {
    numero: '02',
    icone: Smartphone,
    titre: '2. Associez votre application mobile Android',
    texte: "Téléchargez l'application SMSIKA Gateway sur votre téléphone Android. Ouvrez l'application et flashez le QR code généré sur la console web. Le téléphone est immédiatement reconnu comme relais d'envoi.",
    puces: ['Association instantanée en 1 clic', 'Support Multi-SIM'],
  },
  {
    numero: '03',
    icone: Zap,
    titre: '3. Envoyez vos SMS en toute autonomie',
    texte: "Déclenchez vos envois depuis l'interface web ou via l'API REST. Les tâches sont remises instantanément au téléphone par notification push FCM. Le téléphone émet le SMS via la carte SIM locale et vous recevez l'accusé de réception.",
    puces: ['Traitement en arrière-plan', 'Webhook de confirmation'],
  },
]

export default function PageCommentCaMarche() {
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
            <Link href="/comment-ca-marche" className="font-bold text-[#1C1917]">Comment ça marche</Link>
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
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#1D4ED8]">Du Serveur à la Carte SIM</p>
          <h1 className="mt-3 font-sans text-4xl font-extrabold tracking-tight sm:text-5xl">
            Comment fonctionne la passerelle SMSIKA ?
          </h1>
          <p className="mt-4 font-sans text-[15px] leading-relaxed text-stone-600">
            Un circuit simple et robuste en 3 étapes pour transformer n'importe quel téléphone Android connecté en relais SMS professionnel.
          </p>
        </div>

        <ol className="grid grid-cols-1 gap-10 pb-4 md:grid-cols-3 md:gap-6">
          {ETAPES.map((e) => (
            <li key={e.numero} data-reveal className="relative border-t-2 border-[#1C1917] pt-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[12px] font-bold text-[#1D4ED8]">{e.numero}</span>
                <e.icone className="h-5 w-5 text-stone-400" />
              </div>
              <h2 className="mt-3 font-sans text-lg font-extrabold tracking-tight">
                {e.titre}
              </h2>
              <p className="mt-2 font-sans text-[13.5px] leading-relaxed text-stone-600">
                {e.texte}
              </p>
              <ul className="mt-4 space-y-2">
                {e.puces.map((p) => (
                  <li key={p} className="flex items-center gap-2 font-mono text-[11px] font-semibold text-[#15803B]">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> {p}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <div data-reveal className="my-16 rounded-2xl bg-[#1C1917] px-6 py-14 text-center sm:px-12">
          <h2 className="mx-auto max-w-xl font-sans text-3xl font-extrabold tracking-tight text-[#F7F5F0] sm:text-4xl">
            Prêt à connecter votre premier téléphone ?
          </h2>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#1D4ED8]"
            >
              Se connecter & Associer un téléphone ↗
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
