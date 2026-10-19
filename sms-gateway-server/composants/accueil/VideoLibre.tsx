'use client'

import { useEffect, useRef } from 'react'

/**
 * Vidéo décorative : muette, en boucle, sans barre de commandes.
 *
 * `autoPlay` n'est volontairement pas dans le HTML : la lecture démarre ici, et
 * seulement si le visiteur n'a pas demandé « moins d'animations ». Une animation
 * qui tourne toute seule pendant plus de cinq secondes doit pouvoir être arrêtée
 * (règle WCAG 2.2.2) : ce réglage système est justement ce moyen de l'arrêter, et
 * le site s'en sert déjà pour ses animations d'apparition. Le visiteur qui l'a
 * demandé voit la première image, immobile.
 *
 * `width` et `height` réservent la place avant le chargement : sans dimensions,
 * la page saute quand la vidéo arrive (voir la doc Next sur les vidéos).
 */
export default function VideoLibre({
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
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Muet explicitement : c'est ce qui autorise la lecture sans geste du visiteur
    // (les navigateurs l'exigent) — et volontairement, la bande-son n'a pas à
    // surprendre quelqu'un qui lit la page.
    video.muted = true
    // Le navigateur peut refuser (économie d'énergie, onglet en arrière-plan…) :
    // on laisse alors la première image, sans rien casser.
    video.play().catch(() => {})
  }, [])

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-[#1C1917]/10 shadow-[0_24px_60px_-30px_rgba(28,25,23,0.35)] ${className}`}
    >
      <video
        ref={ref}
        src={src}
        width={largeur}
        height={hauteur}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        className="h-auto w-full"
      >
        Votre navigateur ne peut pas lire cette vidéo.
      </video>
    </div>
  )
}
