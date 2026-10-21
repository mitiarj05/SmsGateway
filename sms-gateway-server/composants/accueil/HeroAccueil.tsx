import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react'

const GARANTIES = ['100 % auto-hébergé', 'Sans abonnement', 'API ouverte 24 h/24']

export default function HeroAccueil() {
  return (
    <section className="relative overflow-hidden border-b border-[#1C1917]/10">
      {/* Photo « arrièreplan accueil » en fond, à 100 % — le texte vit dessus */}
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src="/images/arriereplan-accueil.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          quality={100}
          className="object-cover"
        />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 pb-20 pt-14 text-center md:pt-20 lg:px-8">
        <p className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white/90 [text-shadow:0_1px_12px_rgba(10,15,30,0.8)]">
          <span className="h-2 w-2 bg-white/90" aria-hidden />
          Passerelle SMS sans abonnement
        </p>

        <h1 className="mx-auto mt-5 max-w-2xl font-sans text-[2.75rem] font-extrabold leading-[1.04] tracking-[-0.02em] text-white [text-shadow:0_2px_24px_rgba(10,15,30,0.75)] sm:text-6xl">
          Vos téléphones deviennent votre passerelle SMS.
        </h1>

        <p className="mx-auto mt-5 max-w-xl font-sans text-[16px] leading-relaxed text-white/85 [text-shadow:0_1px_12px_rgba(10,15,30,0.7)]">
          Branchez un téléphone Android, ouvrez votre console, envoyez.<br />
          Pas d’abonnement, pas d’intermédiaire : vos SIM, vos tarifs,
          vos numéros — et vos données restent chez vous.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          <Link
            href="/login"
            className="group inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-6 py-3.5 text-[15px] font-bold text-white transition hover:bg-[#1D4ED8]"
          >
            Commencer avec SMS IKA
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/comment-ca-marche"
            className="group inline-flex items-center gap-1.5 text-[15px] font-bold text-white underline decoration-white/40 underline-offset-[6px] transition hover:decoration-white [text-shadow:0_1px_12px_rgba(10,15,30,0.7)]"
          >
            Découvrir comment ça marche
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <ul className="mx-auto mt-9 flex max-w-xl flex-wrap justify-center gap-x-6 gap-y-2 border-t border-white/25 pt-5">
          {GARANTIES.map((g) => (
            <li key={g} className="flex items-center gap-1.5 font-mono text-[11.5px] font-semibold text-white/80 [text-shadow:0_1px_10px_rgba(10,15,30,0.7)]">
              <Check className="h-3.5 w-3.5 text-[#4ADE80]" /> {g}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
