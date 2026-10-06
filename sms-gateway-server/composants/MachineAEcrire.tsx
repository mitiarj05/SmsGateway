'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  lines: string[] // lignes à taper
  speed?: number // ms par caractère
  startDelay?: number // ms avant le début
  loop?: boolean
  className?: string
}

export default function MachineAEcrire({ lines, speed = 26, startDelay = 400, loop = false, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [html, setHtml] = useState('')
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let annule = false
    let intervalle: ReturnType<typeof setInterval> | null = null

    const run = async () => {
      let out = ''
      for (let li = 0; li < lines.length; li++) {
        const line = lines[li]
        for (let ci = 0; ci <= line.length; ci++) {
          if (annule) return
          out = lines.slice(0, li).join('\n') + (li > 0 ? '\n' : '') + line.slice(0, ci)
          setHtml(out)
          await new Promise((r) => setTimeout(r, speed))
        }
        await new Promise((r) => setTimeout(r, 320)) // pause fin de ligne
      }
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          setTimeout(() => {
            if (annule) return
            run()
            if (loop) intervalle = setInterval(() => { if (!annule) { setHtml(''); run() } }, 9000)
          }, startDelay)
          io.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    io.observe(el)
    return () => {
      annule = true
      if (intervalle) clearInterval(intervalle)
      io.disconnect()
    }
  }, [lines, speed, startDelay, loop])

  return (
    <div ref={ref} className={className ?? 'demo'}>
      <span className="type-cursor whitespace-pre-wrap">{html}</span>
    </div>
  )
}
