import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

function PhotoCadre({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#1C1917]/10">
      <Image
        src={src}
        alt={alt}
        width={800}
        height={600}
        sizes="(max-width: 768px) 100vw, 450px"
        className="aspect-[4/3] w-full object-cover"
      />
    </div>
  )
}

function LigneRequete() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 overflow-hidden rounded-lg bg-[#1C1917] px-4 py-3.5 font-mono text-[11.5px]">
      <span className="font-bold text-stone-100">POST /api/sms/send</span>
      <span className="text-stone-500">→</span>
      <span className="text-[#4ADE80]">200 · {"{"}"statut": "accepte"{"}"}</span>
    </div>
  )
}

const BLOCS = [
  {
    braille: 'PILOTEZ TOUTE VOTRE FLOTTE',
    titre: 'Chaque téléphone, sous vos yeux.',
    texte: 'État de connexion, file d’attente, SIM actives : fini le pilotage à l’aveugle — vous savez toujours par où partent vos messages.',
    lien: '/fonctionnalites',
    libelleLien: 'Voir toutes les fonctionnalités',
    visuel: <PhotoCadre src="/images/cartes-sim.jpg" alt="Cartes SIM et cartes de recharge de plusieurs opérateurs" />,
  },
  {
    braille: 'DE L’ENVOI À LA CROISSANCE',
    titre: 'Des messages qui font grandir.',
    texte: 'Commandes prêtes, rappels, codes de vérification : chaque SMS est une occasion de faire revenir vos clients.',
    lien: '/comment-ca-marche',
    libelleLien: 'Découvrir le guide d’intégration',
    visuel: <LigneRequete />,
  },
  {
    braille: 'DE VRAIS SMS, VRAIMENT REÇUS',
    titre: 'Vos clients le lisent vraiment.',
    texte: 'Pas un e-mail noyé dans les spams : un SMS lu en quelques minutes. Rendez-vous confirmés, commandes retirées, avis laissés.',
    lien: '/cas-d-usage',
    libelleLien: 'Explorer les cas d’usage',
    visuel: <PhotoCadre src="/images/lecture-client.jpg" alt="Client lisant un message sur l’écran de son téléphone" />,
  },
]

export default function Piliers() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-20">
      <div data-reveal className="mb-4 max-w-2xl">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#1D4ED8]">CONCRET, PAS ABSTRAIT</p>
        <h2 className="mt-3 font-sans text-3xl font-extrabold tracking-tight text-[#1C1917] sm:text-4xl">
          Voyez ce que vos SMS deviennent.
        </h2>
      </div>

      <div>
        {BLOCS.map((b, i) => (
          <div
            key={b.titre}
            data-reveal
            className="grid grid-cols-1 items-center gap-8 border-t border-[#1C1917]/10 py-12 md:grid-cols-12 md:gap-10"
          >
            <div className={`min-w-0 md:col-span-7 ${i % 2 === 1 ? 'md:order-2' : ''}`}>
              <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#1D4ED8]">{b.braille}</p>
              <h3 className="mt-2 font-sans text-2xl font-extrabold tracking-tight text-[#1C1917] sm:text-[1.7rem]">
                {b.titre}
              </h3>
              <p className="mt-2 max-w-lg font-sans text-[14.5px] leading-relaxed text-stone-600">
                {b.texte}
              </p>
              <Link href={b.lien} className="group mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#1D4ED8] hover:underline">
                {b.libelleLien}
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
            <div className={`min-w-0 md:col-span-5 ${i % 2 === 1 ? 'md:order-1' : ''}`}>{b.visuel}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
