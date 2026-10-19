import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

/**
 * Photo : ratio naturel intact — un portrait n'est jamais rogné en paysage.
 * La largeur se règle par `className` (une photo verticale pleine largeur
 * deviendrait plus haute que l'écran).
 */
function PhotoLibre({
  src,
  alt,
  largeur,
  hauteur,
  className = '',
}: {
  src: string
  alt: string
  largeur: number
  hauteur: number
  className?: string
}) {
  return (
    <div
      className={`group overflow-hidden rounded-2xl border border-[#1C1917]/10 shadow-[0_24px_60px_-30px_rgba(28,25,23,0.35)] ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        width={largeur}
        height={hauteur}
        sizes="(max-width: 768px) 100vw, 420px"
        className="h-auto w-full transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />
    </div>
  )
}

/**
 * Vidéo : muette, en boucle, lancée par le navigateur lui-même.
 *
 * `autoPlay` et `loop` sont dans le HTML, sans une ligne de JavaScript : une
 * boucle ne doit dépendre ni de l'hydratation, ni d'un réglage de l'appareil.
 * Corollaire assumé : le réglage « moins d'animations » n'arrête pas cette
 * vidéo — c'est le prix d'une boucle garantie.
 *
 * `preload="auto"` : le fichier entier est mis en mémoire avant de jouer, sinon
 * la boucle marque un temps d'arrêt à chaque tour. Les clips sont courts et
 * sans piste audio (le conteneur est vérifié : une seule piste vidéo).
 * `width`/`height` réservent la place pour que la page ne saute pas.
 */
function VideoLibre({
  src,
  largeur,
  hauteur,
  className = '',
}: {
  src: string
  largeur: number
  hauteur: number
  className?: string
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-[#1C1917]/10 shadow-[0_24px_60px_-30px_rgba(28,25,23,0.35)] ${className}`}
    >
      <video
        src={src}
        width={largeur}
        height={hauteur}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        className="h-auto w-full"
      >
        Votre navigateur ne peut pas lire cette vidéo.
      </video>
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
    visuel: (
      <PhotoLibre
        src="/images/SousVosYeux.jpg"
        alt="Tableau de bord affiché sur un ordinateur, téléphone tenu à la main"
        largeur={842}
        hauteur={1264}
        className="mx-auto max-w-[380px]"
      />
    ),
    large: true,
  },
  {
    braille: 'DE L’ENVOI À LA CROISSANCE',
    titre: 'Des messages qui font grandir.',
    texte: 'Commandes prêtes, rappels, codes de vérification : chaque SMS est une occasion de faire revenir vos clients.',
    lien: '/comment-ca-marche',
    libelleLien: 'Découvrir le guide d’intégration',
    visuel: <VideoLibre src="/videos/client-telephone.mp4" largeur={1280} hauteur={720} className="mx-auto max-w-[480px]" />,
    large: false,
  },
  {
    braille: 'DE VRAIS SMS, VRAIMENT REÇUS',
    titre: 'Vos clients le lisent vraiment.',
    texte: 'Pas un e-mail noyé dans les spams : un SMS lu en quelques minutes. Rendez-vous confirmés, commandes retirées, avis laissés.',
    lien: '/cas-d-usage',
    libelleLien: 'Explorer les cas d’usage',
    visuel: <VideoLibre src="/videos/lire.mp4" largeur={1280} hauteur={720} className="mx-auto max-w-[480px]" />,
    large: false,
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
            <div className={`min-w-0 ${b.large ? 'md:col-span-5' : 'md:col-span-7'} ${i % 2 === 1 ? 'md:order-2' : ''}`}>
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
            <div className={`min-w-0 ${b.large ? 'md:col-span-7' : 'md:col-span-5'} ${i % 2 === 1 ? 'md:order-1' : ''}`}>{b.visuel}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
