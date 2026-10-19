import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import MenuMobile from './MenuMobile'

const LIENS = [
  { href: '/fonctionnalites', libelle: 'Fonctionnalités' },
  { href: '/comment-ca-marche', libelle: 'Comment ça marche' },
  { href: '/demo', libelle: 'Démo en direct' },
  { href: '#installer', libelle: 'Installer', ancre: true },
  { href: '/faq', libelle: 'FAQ' },
]

export default function BarreAccueil() {
  return (
    <div className="sticky top-0 z-50 w-full border-b border-[#1C1917]/10 bg-[#F7F5F0]/90 backdrop-blur">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="SMSTSIKA — accueil">
          <Image src="/icons/logoClair.png" alt="SMSTSIKA" width={160} height={38} className="h-9 w-auto" />
        </Link>

        <nav className="hidden items-center gap-7 text-[13.5px] font-medium text-stone-600 lg:flex">
          {LIENS.map((l) =>
            l.ancre ? (
              <a key={l.href} href={l.href} className="transition hover:text-[#1C1917]">{l.libelle}</a>
            ) : (
              <Link key={l.href} href={l.href} className="transition hover:text-[#1C1917]">{l.libelle}</Link>
            )
          )}
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
          <MenuMobile />
        </div>
      </header>
    </div>
  )
}
