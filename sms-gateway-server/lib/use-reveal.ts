'use client'

import { useEffect } from 'react'

/**
 * Ajoute la classe .revealed aux éléments [data-reveal]
 * quand ils entrent dans le viewport (une seule fois).
 */
export function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]')
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('revealed')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.18, rootMargin: '0px 0px -40px 0px' }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

/**
 * Spotlight des cartes bento : pose --mx/--my (position curseur)
 * lus par le dégradé radial de chaque .bcard.
 */
export function useSpotlightBento() {
  useEffect(() => {
    const cartes = document.querySelectorAll<HTMLElement>('.bcard')
    const onMove = (e: MouseEvent) => {
      const c = e.currentTarget as HTMLElement
      const r = c.getBoundingClientRect()
      c.style.setProperty('--mx', `${e.clientX - r.left}px`)
      c.style.setProperty('--my', `${e.clientY - r.top}px`)
    }
    cartes.forEach((c) => c.addEventListener('mousemove', onMove))
    return () => {
      cartes.forEach((c) => c.removeEventListener('mousemove', onMove))
    }
  }, [])
}
