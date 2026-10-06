'use client'

import React, { useRef } from 'react'

/* ---------- TILT 3D : à wrapper autour de la photo hero ---------- */
export function Tilt({ children, max = 9 }: { children: React.ReactNode; max?: number }) {
  const ref = useRef<HTMLDivElement>(null)

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width // 0 → 1
    const py = (e.clientY - r.top) / r.height
    el.style.transform =
      `perspective(1200px) rotateY(${(px - 0.5) * max}deg) rotateX(${(0.5 - py) * max}deg) scale3d(1.02,1.02,1.02)`
    el.style.setProperty('--gx', `${px * 100}%`)
    el.style.setProperty('--gy', `${py * 100}%`)
  }
  const onLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.transform = 'perspective(1200px) rotateY(0) rotateX(0) scale3d(1,1,1)'
  }

  return (
    <div ref={ref} className="tilt relative" onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
      <span className="tilt-glare" />
    </div>
  )
}

/* ---------- MAGNÉTIQUE : à wrapper autour des boutons CTA ---------- */
export function Magnetic({ children, strength = 0.35 }: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null)

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = e.clientX - r.left - r.width / 2
    const y = e.clientY - r.top - r.height / 2
    el.style.transform = `translate(${x * strength}px, ${y * strength}px)`
  }
  const onLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.transform = 'translate(0,0)'
  }

  return (
    <div ref={ref} className="magnetic inline-block" onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </div>
  )
}
