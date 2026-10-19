'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

const LIENS = [
  { href: '/fonctionnalites', libelle: 'Fonctionnalités' },
  { href: '/comment-ca-marche', libelle: 'Comment ça marche' },
  { href: '/demo', libelle: 'Démo en direct' },
  { href: '#installer', libelle: 'Installer' },
  { href: '/faq', libelle: 'FAQ' },
  { href: '/login', libelle: 'Connexion' },
]

export default function MenuMobile() {
  const [ouvert, setOuvert] = useState(false)

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        aria-label={ouvert ? 'Fermer le menu' : 'Ouvrir le menu'}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#1C1917]/10 text-[#1C1917]"
      >
        {ouvert ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {ouvert && (
        <nav className="absolute inset-x-0 top-full border-b border-[#1C1917]/10 bg-[#F7F5F0] px-6 py-4 shadow-lg">
          <ul className="space-y-1">
            {LIENS.map((l) =>
              l.href.startsWith('#') ? (
                <li key={l.href}>
                  <a
                    href={l.href}
                    onClick={() => setOuvert(false)}
                    className="block rounded-lg px-3 py-2.5 font-sans text-[15px] font-semibold text-stone-700 transition hover:bg-[#1C1917]/5 hover:text-[#1C1917]"
                  >
                    {l.libelle}
                  </a>
                </li>
              ) : (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOuvert(false)}
                    className="block rounded-lg px-3 py-2.5 font-sans text-[15px] font-semibold text-stone-700 transition hover:bg-[#1C1917]/5 hover:text-[#1C1917]"
                  >
                    {l.libelle}
                  </Link>
                </li>
              )
            )}
          </ul>
        </nav>
      )}
    </div>
  )
}
