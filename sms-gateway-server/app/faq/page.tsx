'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown, ArrowUpRight, Search, ArrowRight } from 'lucide-react'
import { useReveal } from '../../lib/use-reveal'
import BarreProgressionDefilante from '../../composants/BarreProgressionDefilante'

export default function PageFAQ() {
  useReveal()
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
            <Link href="/cas-d-usage" className="transition hover:text-[#1C1917]">Cas d’usage</Link>
            <Link href="/faq" className="font-bold text-[#1C1917]">FAQ</Link>
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

      <main className="mx-auto max-w-3xl px-6 lg:px-8">
        <div className="pb-10 pt-14">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#1D4ED8]">Foire Aux Questions</p>
          <h1 className="mt-3 font-sans text-4xl font-extrabold tracking-tight sm:text-5xl">
            Les réponses à vos questions
          </h1>
          <p className="mt-4 font-sans text-[15px] leading-relaxed text-stone-600">
            Retrouvez tout ce qu'il faut savoir sur l'installation, le fonctionnement et la sécurité de la passerelle SMS IKA.
          </p>
          <div className="relative mt-6">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher une question (ex. Android, SIM, API)..."
              aria-label="Rechercher une question"
              className="w-full rounded-xl border border-[#1C1917]/15 bg-white py-3.5 pl-11 pr-4 text-sm text-[#1C1917] outline-none transition placeholder:text-stone-400 focus:border-[#2563EB]"
            />
          </div>
        </div>

        <div className="space-y-3 pb-4">
          {faqsFiltrees.map((f, i) => (
            <details key={i} data-reveal className="group rounded-xl border border-[#1C1917]/10 bg-white transition-colors hover:border-[#1C1917]/25">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 font-sans text-[15px] font-extrabold tracking-tight text-[#1C1917] [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1C1917]/5 text-stone-500 transition group-open:rotate-180 group-open:bg-[#2563EB] group-open:text-white">
                  <ChevronDown className="h-4 w-4" />
                </span>
              </summary>
              <p className="border-t border-[#1C1917]/10 px-5 pb-5 pt-4 font-sans text-sm leading-relaxed text-stone-600">
                {f.r}
              </p>
            </details>
          ))}
          {faqsFiltrees.length === 0 && (
            <p className="rounded-xl border border-dashed border-[#1C1917]/15 px-5 py-10 text-center font-sans text-sm text-stone-500">
              Aucune question ne correspond à « {recherche} ».
            </p>
          )}
        </div>

        <div data-reveal className="my-16 rounded-2xl bg-[#1C1917] px-6 py-14 text-center sm:px-12">
          <h2 className="mx-auto max-w-xl font-sans text-3xl font-extrabold tracking-tight text-[#F7F5F0] sm:text-4xl">
            Vous n'avez pas trouvé votre réponse ?
          </h2>
          <p className="mx-auto mt-3 max-w-md font-sans text-[15px] text-stone-400">
            Consultez le guide d'intégration ou contactez notre support technique.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/comment-ca-marche"
              className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#1D4ED8]"
            >
              Découvrir le guide d’intégration
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
