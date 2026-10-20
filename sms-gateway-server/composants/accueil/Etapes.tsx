import Link from 'next/link'
import { ArrowUpRight, Download } from 'lucide-react'

const ETAPES = [
  {
    numero: '01',
    titre: 'Installer',
    texte: 'Téléchargez l’application Android sur le téléphone qui enverra vos SMS.',
    lien: '#installer',
    libelleLien: 'Télécharger l’APK',
    icone: Download,
    ancre: true,
  },
  {
    numero: '02',
    titre: 'Lier',
    texte: 'Scannez le QR code affiché dans votre espace pour lier l’appareil.',
    lien: '/comment-ca-marche',
    libelleLien: 'Lire le guide d’intégration',
    icone: null,
    ancre: false,
  },
  {
    numero: '03',
    titre: 'Envoyer',
    texte: 'Envoyez depuis la console, ou en une seule requête HTTP.',
    lien: '/espace/api',
    libelleLien: 'Documentation API',
    icone: null,
    ancre: false,
  },
]

export default function Etapes() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-4 pt-16 lg:px-8 lg:pt-20">
      <div data-reveal className="mb-10 max-w-2xl">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#1D4ED8]">MISE EN ROUTE</p>
        <h2 className="mt-3 font-sans text-3xl font-extrabold tracking-tight text-[#1C1917] sm:text-4xl">
          Trois gestes, pas de manuel.
        </h2>
      </div>

      <ol className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {ETAPES.map((e) => (
          <li key={e.numero} data-reveal className="border-t-2 border-[#1C1917] pt-5">
            <span className="font-mono text-[12px] font-bold text-[#1D4ED8]">{e.numero}</span>
            <h3 className="mt-2 font-sans text-xl font-extrabold tracking-tight text-[#1C1917]">
              {e.titre}
            </h3>
            <p className="mt-2 font-sans text-[13.5px] leading-relaxed text-stone-600">
              {e.texte}
            </p>
            {e.ancre ? (
              <a
                href={e.lien}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#1D4ED8] hover:underline"
              >
                {e.icone && <e.icone className="h-4 w-4" />}
                {e.libelleLien} ↗
              </a>
            ) : (
              <Link
                href={e.lien}
                className="group mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#1D4ED8] hover:underline"
              >
                {e.libelleLien}
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
