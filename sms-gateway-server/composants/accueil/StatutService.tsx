'use client'

import { useEffect, useState } from 'react'

type Etat = 'inconnu' | 'ok' | 'degrade'

/** Pastille de statut réel, lue depuis /api/health. Silencieuse en cas d’échec. */
export default function StatutService() {
  const [etat, setEtat] = useState<Etat>('inconnu')

  useEffect(() => {
    let actif = true
    fetch('/api/health', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (actif) setEtat(d?.status === 'ok' ? 'ok' : 'degrade')
      })
      .catch(() => {})
    return () => {
      actif = false
    }
  }, [])

  if (etat === 'inconnu') return null

  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
      <span className={`h-1.5 w-1.5 rounded-full ${etat === 'ok' ? 'bg-[#15803B]' : 'bg-[#C2410C]'}`} />
      <span className="text-stone-500">{etat === 'ok' ? 'Systèmes opérationnels' : 'Service dégradé'}</span>
    </span>
  )
}
