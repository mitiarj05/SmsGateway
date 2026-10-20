'use client'

import Link from 'next/link'
import { ArrowUpRight, Send, Smartphone, Inbox } from 'lucide-react'

const ETAPES = [
  {
    icone: Send,
    titre: 'Votre site demande',
    texte:
      'Une requête, votre clé, un numéro, un texte — « Votre commande est prête ! ». Une ligne de code et c\u2019est parti.',
  },
  {
    icone: Smartphone,
    titre: 'Le téléphone envoie',
    texte:
      'Le téléphone de la passerelle se réveille sur le champ, réclame la tâche et émet le SMS avec sa SIM — quelques secondes.',
  },
  {
    icone: Inbox,
    titre: 'La réponse revient',
    texte:
      '« PAYE CMD-1234 », « OUI », une question… chaque réunion rejoint votre site, signée : commande payée, tout se met à jour seul.',
  },
]

export default function PreuveCode() {
  return (
    <section className="bg-[#1C1917]">
      <div className="px-0 mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 lg:grid-cols-2 lg:px-8 lg:py-20">
        <div data-reveal>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#93C5FD]">Comment ça se passe</p>
          <h2 className="mt-3 font-sans text-3xl font-extrabold tracking-tight text-[#F7F5F0] sm:text-4xl">
            Un SMS part en trois temps.
          </h2>
          <p className="mt-4 max-w-md font-sans text-[15px] leading-relaxed text-stone-400">
            Vous ne pilotez ni carte SIM ni antenne : vous demandez, le téléphone de la passerelle le fait,
            et la réponse vous revient. C&apos;est tout le circuit.
          </p>
          <Link
            href="/comment-ca-marche"
            className="group mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#93C5FD] hover:underline"
          >
            Brancher votre site
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <div data-reveal="zoom" className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
          {ETAPES.map((e, i) => (
            <div
              key={e.titre}
              className={`flex items-start gap-4 px-6 py-5${i > 0 ? ' border-t border-white/10' : ''}`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#93C5FD]">
                <e.icone className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="flex items-baseline gap-2 text-[13.5px] font-bold text-[#F7F5F0]">
                  <span className="font-mono text-[10.5px] font-bold text-stone-500">0{i + 1}</span>
                  {e.titre}
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-stone-400">{e.texte}</p>
              </div>
            </div>
          ))}
          <div className="border-t border-white/10 px-6 py-4">
            <p className="text-[11.5px] leading-relaxed text-stone-500">
              Le guide <Link href="/comment-ca-marche" className="font-semibold text-[#93C5FD] hover:underline">Brancher votre site</Link> donne
              la requête exacte à copier, le récepteur déjà rempli et l&apos;essai en un clic.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
