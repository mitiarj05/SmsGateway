import Image from 'next/image'
import Link from 'next/link'
import StatutService from './StatutService'

export default function PiedAccueil() {
  return (
    <footer className="border-t border-[#1C1917]/10 bg-[#F7F5F0]">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div className="space-y-4">
          <Image src="/icons/logoClair.png" alt="SMSTSIKA" width={150} height={36} className="h-9 w-auto" />
          <p className="max-w-xs font-sans text-[12.5px] leading-relaxed text-stone-600">
            Le pilotage SMS depuis le web, avec Android comme passerelle.
          </p>
        </div>
        <div className="space-y-3">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">Découvrir</p>
          <ul className="space-y-2 font-sans text-[13.5px] font-medium text-stone-600">
            <li><Link href="/fonctionnalites" className="transition hover:text-[#1C1917]">Fonctionnalités</Link></li>
            <li><Link href="/comment-ca-marche" className="transition hover:text-[#1C1917]">Comment ça marche</Link></li>
            <li><Link href="/cas-d-usage" className="transition hover:text-[#1C1917]">Cas d’usage</Link></li>
          </ul>
        </div>
        <div className="space-y-3">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">Ressources</p>
          <ul className="space-y-2 font-sans text-[13.5px] font-medium text-stone-600">
            <li><Link href="/espace/api" className="transition hover:text-[#1C1917]">Documentation API</Link></li>
            <li><Link href="/faq" className="transition hover:text-[#1C1917]">Foire aux questions (FAQ)</Link></li>
          </ul>
        </div>
        <div className="space-y-3">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">Votre espace</p>
          <ul className="space-y-2 font-sans text-[13.5px] font-medium text-stone-600">
            <li><Link href="/login" className="transition hover:text-[#1C1917]">Connexion console</Link></li>
            <li><Link href="/login?onglet=client" className="transition hover:text-[#1C1917]">Espace client</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#1C1917]/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-5 lg:px-8">
          <p className="font-mono text-[11px] text-stone-500">
            © 2026 SMS IKA Gateway ·{' '}
            <Link href="/mentions-legales" className="transition hover:text-[#1C1917] hover:underline">
              Mentions légales
            </Link>{' '}
            ·{' '}
            <Link href="/confidentialite" className="transition hover:text-[#1C1917] hover:underline">
              Confidentialité
            </Link>
          </p>
          <p className="font-mono text-[10px] text-stone-400">
            Photo d’accueil :{' '}
            <a
              href="https://www.flickr.com/photos/82365211@N00/2346813517"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-stone-300 underline-offset-2 transition hover:text-[#1C1917]"
            >
              kalleboo
            </a>{' '}
            (CC BY) · Lecture :{' '}
            <a
              href="https://www.flickr.com/photos/68532869@N08/17468693762"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-stone-300 underline-offset-2 transition hover:text-[#1C1917]"
            >
              Japanexperterna.se
            </a>{' '}
            (CC BY-SA)
          </p>
          <StatutService />
        </div>
      </div>
    </footer>
  )
}
