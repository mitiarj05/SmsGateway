'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Compteur animé pour les KPI (admin + espace client) : compte de 0
 * jusqu'à la valeur UNE SEULE FOIS au montage. Les actualisations
 * suivantes s'affichent directement (pas de distraction).
 */
export default function CompteurValeur({
  valeur,
  duree = 900,
  className,
}: {
  valeur: number
  duree?: number
  className?: string
}) {
  const [affiche, setAffiche] = useState(0)
  const anime = useRef(false)

  useEffect(() => {
    if (anime.current) {
      setAffiche(valeur)
      return
    }
    anime.current = true
    const cible = valeur
    if (cible <= 0) {
      setAffiche(0)
      return
    }
    const debut = performance.now()
    let cadre = 0
    const tick = (t: number) => {
      const p = Math.min((t - debut) / duree, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setAffiche(Math.round(cible * eased))
      if (p < 1) cadre = requestAnimationFrame(tick)
    }
    cadre = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(cadre)
  }, [valeur, duree])

  return (
    <span className={className}>
      {affiche.toLocaleString('fr-FR')}
    </span>
  )
}
