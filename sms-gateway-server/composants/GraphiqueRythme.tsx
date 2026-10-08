'use client'

import { useRef, useState } from 'react'

export interface PointSerie {
  heure: string
  valeur: number
}

export interface SerieRythme {
  cle: string
  libelle: string
  couleurLigne: string
  couleurPoint: string
  couleurDebut: string
  points: PointSerie[]
}

/**
 * Graphique « Rythme » partagé (admin + espace client) : même style,
 * mêmes animations, mêmes libellés. Les données restent propres à
 * chaque espace (admin : global, client : son compte).
 *
 * Style moderne : courbes lissées, tracé animé à l'apparition,
 * pastilles lumineuses + infobulle au survol.
 */

/** Lissage Catmull-Rom → Bézier pour des courbes douces. */
function cheminLisse(points: PointSerie[], max: number): string | null {
  if (points.length === 0 || max === 0) return null
  const coords = points.map((p, i) => {
    const x = points.length === 1 ? 300 : (i / (points.length - 1)) * 600
    const y = 112 - (p.valeur / max) * 100
    return { x, y }
  })
  if (coords.length === 1) {
    return `M${coords[0].x.toFixed(1)},${coords[0].y.toFixed(1)}`
  }
  let d = `M${coords[0].x.toFixed(1)},${coords[0].y.toFixed(1)}`
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[Math.max(0, i - 1)]
    const p1 = coords[i]
    const p2 = coords[i + 1]
    const p3 = coords[Math.min(coords.length - 1, i + 2)]
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
  }
  return d
}

export default function GraphiqueRythme({
  titre,
  sousTitre,
  periode,
  series,
  texteVide,
  sousTexteVide,
  optionsPeriode,
  periodeActive,
  onChangementPeriode,
}: {
  titre: string
  sousTitre: string
  periode: string
  series: SerieRythme[]
  texteVide: string
  sousTexteVide: string
  optionsPeriode?: { id: string; etiquette: string }[]
  periodeActive?: string
  onChangementPeriode?: (id: string) => void
}) {
  const refPiste = useRef<HTMLDivElement>(null)
  const [survol, setSurvol] = useState<number | null>(null)

  const total = series.reduce((s, serie) => s + serie.points.reduce((a, p) => a + p.valeur, 0), 0)
  const maxVolume = Math.max(0, ...series.flatMap((serie) => serie.points.map((p) => p.valeur)))
  const n = Math.max(0, ...series.map((serie) => serie.points.length))
  const signature = series.map((s) => `${s.cle}:${s.points.map((p) => p.valeur).join(',')}`).join('|')

  const premiere = series[0]
  const pic = premiere
    ? premiere.points.reduce<PointSerie | null>(
        (m, p) => (!m || p.valeur > m.valeur ? p : m),
        null
      )
    : null
  const etiquettes = premiere
    ? premiere.points.filter((_, i) => i % Math.max(1, Math.ceil(premiere.points.length / 6)) === 0)
    : []

  function abscisse(i: number): number {
    if (n <= 1) return 300
    return (i / (n - 1)) * 600
  }

  function onMove(e: React.MouseEvent) {
    const el = refPiste.current
    if (!el || n === 0) return
    const r = el.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
    setSurvol(Math.round(ratio * (n - 1)))
  }

  const pointSurvole = survol !== null && premiere && survol < premiere.points.length
    ? premiere.points[survol]
    : null

  // Graduations Y entières uniquement (on envoie des SMS un par un).
  const graduationsY = (() => {
    if (maxVolume <= 0) return []
    if (maxVolume <= 6) {
      return Array.from({ length: maxVolume }, (_, i) => maxVolume - i)
    }
    const brute = maxVolume / 3
    const ordre = Math.pow(10, Math.floor(Math.log10(brute)))
    const normalise = brute / ordre
    const pas = (normalise <= 1 ? 1 : normalise <= 2 ? 2 : normalise <= 5 ? 5 : 10) * ordre
    return [3, 2, 1].map((k) => Math.round(k * pas)).filter((v) => v <= maxVolume * 1.05)
  })()
  // Position verticale (%) d'une valeur dans le conteneur h-44 (svg bottom-6 h-32).
  function hautPct(valeur: number): number {
    if (maxVolume <= 0) return 100
    const unites = 112 - (valeur / maxVolume) * 100
    return ((24 + (unites * 128) / 120) / 176) * 100
  }

  return (
    <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 xl:col-span-2 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">{titre}</h2>
          <p className="mt-0.5 text-[12px] text-slate-400">{sousTitre}</p>
        </div>
        {optionsPeriode && onChangementPeriode ? (
          <select
            value={periodeActive}
            onChange={(e) => onChangementPeriode(e.target.value)}
            className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[12px] font-semibold text-slate-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            aria-label="Période du graphique"
          >
            {optionsPeriode.map((o) => (
              <option key={o.id} value={o.id}>{o.etiquette}</option>
            ))}
          </select>
        ) : (
          <span className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[12px] font-semibold text-slate-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            {periode}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        {pic && maxVolume > 0 ? (
          <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-[11px] font-bold text-[#2563EB] dark:bg-blue-500/10 dark:text-blue-400">
            Pic à {pic.heure} - {pic.valeur} SMS
          </span>
        ) : (
          <span className="text-[11px] text-slate-400">Aucun pic sur la période</span>
        )}
        <span className="flex items-center gap-3 text-[11px] text-slate-400">
          {series.map((serie) => (
            <span key={serie.cle} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: serie.couleurPoint }} /> {serie.libelle}
            </span>
          ))}
        </span>
      </div>

      <div
        ref={refPiste}
        onMouseMove={onMove}
        onMouseLeave={() => setSurvol(null)}
        className="relative mt-2 h-44 cursor-crosshair"
      >
        {total === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[15px] font-bold text-slate-600 dark:text-zinc-300">{texteVide}</p>
            <p className="mt-1 text-[12px] text-slate-400">{sousTexteVide}</p>
          </div>
        )}
        <svg
          key={signature}
          className="absolute inset-x-0 bottom-6 h-32 w-full"
          preserveAspectRatio="none"
          viewBox="0 0 600 120"
        >
          <defs>
            {series.map((serie) => (
              <linearGradient key={serie.cle} id={`aire-${serie.cle}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={serie.couleurDebut} stopOpacity="0.28" />
                <stop offset="100%" stopColor={serie.couleurDebut} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>
          {[30, 60, 90].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="600"
              y2={y}
              stroke="#eef0f8"
              strokeWidth="1"
              strokeDasharray="3 4"
            />
          ))}
          {series.map((serie) => {
            const ligne = cheminLisse(serie.points, maxVolume) ?? 'M0,112 L600,112'
            const aire = `${ligne} L600,120 L0,120 Z`
            return (
              <g key={serie.cle}>
                <path d={aire} fill={`url(#aire-${serie.cle})`} />
                <path
                  d={ligne}
                  fill="none"
                  stroke={serie.couleurLigne}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1}
                  style={{ animation: 'traceGraphique 1s ease-out forwards' }}
                />
              </g>
            )
          })}
          {survol !== null && pointSurvole && maxVolume > 0 && (
            <line
              x1={abscisse(survol)}
              y1={0}
              x2={abscisse(survol)}
              y2={112}
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.6"
            />
          )}
          {survol !== null && maxVolume > 0 && series.map((serie) => {
            const p = serie.points[survol]
            if (!p) return null
            const cx = abscisse(survol)
            const cy = 112 - (p.valeur / maxVolume) * 100
            return (
              <g key={serie.cle}>
                <circle cx={cx} cy={cy} r="7" fill={serie.couleurPoint} opacity="0.25" />
                <circle cx={cx} cy={cy} r="3.5" fill={serie.couleurPoint} stroke="#fff" strokeWidth="1.5" />
              </g>
            )
          })}
        </svg>
        {survol !== null && pointSurvole && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
            style={{ left: `${n <= 1 ? 50 : (survol / (n - 1)) * 100}%`, top: 0 }}
          >
            <p className="text-[10px] font-bold text-slate-400">{pointSurvole.heure}</p>
            {series.map((serie) => {
              const p = serie.points[survol]
              if (!p) return null
              return (
                <p key={serie.cle} className="mt-0.5 flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-zinc-200">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: serie.couleurPoint }} />
                  {p.valeur} {serie.libelle}
                </p>
              )
            })}
          </div>
        )}
        {graduationsY.map((v) => (
          <span
            key={v}
            className="pointer-events-none absolute left-0 -translate-y-1/2 rounded bg-white/80 px-1 text-[9px] font-bold tabular-nums text-slate-400 dark:bg-zinc-900/80 dark:text-zinc-500"
            style={{ top: `${hautPct(v)}%` }}
          >
            {v >= 1000 ? `${(v / 1000).toLocaleString('fr-FR')}k` : v}
          </span>
        ))}
        <div className="absolute inset-x-0 bottom-0 flex justify-between text-[10px] font-medium text-slate-400">
          {etiquettes.map((e) => (
            <span key={e.heure}>{e.heure}</span>
          ))}
          {etiquettes.length === 0 && <span>—</span>}
        </div>
      </div>
    </div>
  )
}
