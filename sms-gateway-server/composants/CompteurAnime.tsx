'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  end: number // valeur finale
  decimals?: number // ex: 1 → "18,3"
  suffix?: string // ex: " SMS/h", " %", " Ar"
  duration?: number // ms
  className?: string
}

export default function CompteurAnime({ end, decimals = 0, suffix = '', duration = 1600, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const [val, setVal] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const t0 = performance.now()
          const tick = (t: number) => {
            const p = Math.min((t - t0) / duration, 1)
            const eased = 1 - Math.pow(1 - p, 4) // easing "out quart"
            setVal(end * eased)
            if (p < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
          io.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [end, duration])

  const fmt = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span ref={ref} className={className ?? 'stat-number'}>
      {fmt.format(val)}
      {suffix}
    </span>
  )
}
