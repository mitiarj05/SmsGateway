'use client'

import { useEffect, useState } from 'react'

/**
 * Barre de progression du scroll (haut de page, dégradé bleu → sky).
 * Purement visuelle, sans impact fonctionnel.
 */
export default function BarreProgressionDefilante() {
  const [progression, setProgression] = useState(0)

  useEffect(() => {
    const calculer = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgression(max > 0 ? Math.min(1, window.scrollY / max) : 0)
    }
    calculer()
    window.addEventListener('scroll', calculer, { passive: true })
    window.addEventListener('resize', calculer)
    return () => {
      window.removeEventListener('scroll', calculer)
      window.removeEventListener('resize', calculer)
    }
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1">
      <div
        className="h-full bg-gradient-to-r from-[#2563EB] via-[#38BDF8] to-[#2563EB]"
        style={{ width: `${progression * 100}%` }}
      />
    </div>
  )
}
