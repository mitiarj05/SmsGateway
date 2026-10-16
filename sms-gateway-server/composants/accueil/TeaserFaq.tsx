import Link from 'next/link'
import { ArrowUpRight, ChevronDown } from 'lucide-react'

// Questions et réponses reprises telles quelles de la page FAQ.
const EXTRAIT = [
  {
    q: "Quel est le rôle du téléphone Android ?",
    r: "Le téléphone Android agit comme une passerelle d'émission. L'application mobile SMSIKA tourne en arrière-plan, reçoit les tâches de votre serveur via notification push FCM et utilise la carte SIM insérée dans le téléphone pour envoyer le SMS au destinataire.",
  },
  {
    q: "Ai-je besoin d'un abonnement spécial chez SMS IKA ?",
    r: "Non. SMS IKA est une passerelle autohébergée sans abonnement tiers. Vous prenez en charge votre propre serveur (ou hébergement cloud) et vous utilisez vos propres forfaits téléphoniques auprès de vos opérateurs habituels.",
  },
  {
    q: "Que se passe-t-il si le téléphone n'a plus de réseau ?",
    r: "Les tâches d'envoi restent en file d'attente sur le serveur. Dès que le téléphone retrouve du réseau mobile ou du Wi-Fi, l'application se réveille et traite la file en attente.",
  },
]

export default function TeaserFaq() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-4 pt-16 lg:px-8 lg:pt-20">
      <div data-reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#1D4ED8]">QUESTIONS FRÉQUENTES</p>
          <h2 className="mt-3 font-sans text-3xl font-extrabold tracking-tight text-[#1C1917] sm:text-4xl">
            Les vraies questions, les vraies réponses.
          </h2>
        </div>
        <Link
          href="/faq"
          className="group inline-flex items-center gap-1.5 text-sm font-bold text-[#1D4ED8] hover:underline"
        >
          Questions fréquentes (FAQ)
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {EXTRAIT.map((f) => (
          <details
            key={f.q}
            data-reveal
            className="group rounded-xl border border-[#1C1917]/10 bg-white p-6 transition-colors hover:border-[#1C1917]/25"
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3 font-sans text-[15px] font-extrabold tracking-tight text-[#1C1917] [&::-webkit-details-marker]:hidden">
              {f.q}
              <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-[#1D4ED8] transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 font-sans text-[13.5px] leading-relaxed text-stone-600">
              {f.r}
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}
