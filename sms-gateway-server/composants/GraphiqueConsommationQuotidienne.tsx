'use client'

import { useState } from 'react'

export interface ItemConsommation {
  cle: string         // ex: "2026-10-14"
  libelle: string     // ex: "14 Oct"
  valeur: number      // Nombre d'SMS envoyés / consommés ce jour-là
}

interface GraphiqueConsommationQuotidienneProps {
  titre?: string
  sousTitre?: string
  nomVariable?: string // Par défaut: "Consommation quotidienne"
  donnees: ItemConsommation[]
  couleurBarre?: string // Par défaut: "#3b82f6" (Bleu vif de la photo)
}

/**
 * Graphique en bâtons verticaux (histogramme) identique à l'exemple visuel fourni :
 * - Cartouche blanc à coins arrondis et ombre douce
 * - Légende supérieure (carré bleu + libellé)
 * - Lignes de grille horizontales avec graduation Y à gauche (0, 100, 200, 300, 400...)
 * - Bâtons bleus rectangulaires avec survol interactif et valeurs exactes de facturation
 */
export default function GraphiqueConsommationQuotidienne({
  titre = 'Consommation quotidienne',
  sousTitre = 'Volume d’envois de SMS par jour',
  nomVariable = 'SMS envoyés',
  donnees,
}: GraphiqueConsommationQuotidienneProps) {
  const [survol, setSurvol] = useState<number | null>(null)

  // Calcul du Y-Max arrondi pour avoir des graduations propres (0, 100, 200, 300, 400...)
  const maxValeurBrute = Math.max(0, ...donnees.map((d) => d.valeur))

  const calculerYMax = (max: number) => {
    if (max <= 0) return 10
    if (max <= 10) return 10
    if (max <= 50) return 50
    if (max <= 100) return 100
    if (max <= 200) return 200
    if (max <= 400) return 400
    // Arrondir au multiple de 100 supérieur
    return Math.ceil(max / 100) * 100
  }

  const yMax = calculerYMax(maxValeurBrute)

  // 5 Graduations Y (0, 25%, 50%, 75%, 100%)
  const graduationsY = [
    yMax,
    Math.round((yMax * 3) / 4),
    Math.round(yMax / 2),
    Math.round(yMax / 4),
    0,
  ]

  return (
    <div className="rounded-[1.5rem] border border-[#1C1917]/10 bg-white p-6 shadow-card dark:border-zinc-800 dark:bg-zinc-900 space-y-4">

      {/* En-tête avec titre & Légende supérieure centré/gauche */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#1C1917]/5 pb-3 dark:border-zinc-800/60">
        <div>
          <h2 className="text-sm font-bold text-[#1C1917] dark:text-white">{titre}</h2>
          {sousTitre && <p className="text-[11px] text-stone-500">{sousTitre}</p>}
        </div>

        {/* Légende en haut (Exacte comme sur la photo : Carré bleu + Libellé) */}
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-stone-700 dark:text-zinc-300">
          <span className="h-3.5 w-3.5 rounded-[3px] bg-[#3b82f6]" />
          <span>{nomVariable}</span>
        </div>
      </div>

      {/* Zone du Graphique avec Graduations Y et Bâtons Verticaux */}
      <div className="relative pt-2 pb-2">

        {/* Lignes de Grille Horizontales & Axe Y à gauche */}
        <div className="relative flex flex-col justify-between h-56 w-full">
          {graduationsY.map((val, idx) => (
            <div key={idx} className="flex items-center gap-3 w-full">
              <span className="w-9 text-right font-mono text-[11px] font-bold text-stone-400 dark:text-zinc-500 shrink-0">
                {val}
              </span>
              <div className="h-[1px] flex-1 bg-stone-200/80 dark:bg-zinc-800" />
            </div>
          ))}
        </div>

        {/* Bâtons Bleus au-dessus des lignes de grille */}
        <div className="absolute inset-0 pl-12 pr-2 top-2 bottom-6 flex items-end justify-around gap-1.5 sm:gap-3">
          {donnees.map((item, i) => {
            const pct = Math.min(100, Math.max(0, Math.round((item.valeur / yMax) * 100)))
            const estSurvole = survol === i

            return (
              <div
                key={item.cle}
                onMouseEnter={() => setSurvol(i)}
                onMouseLeave={() => setSurvol(null)}
                className="relative flex-1 flex flex-col items-center justify-end h-full max-w-[56px] group cursor-pointer"
              >
                {/* Valeur affichée au-dessus du bâton au survol */}
                {estSurvole && (
                  <div className="absolute -top-8 z-20 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg dark:bg-white dark:text-slate-900">
                    {item.valeur} SMS ({item.libelle})
                  </div>
                )}

                {/* Bâton vertical Bleu (#3b82f6) identique à la photo */}
                <div
                  className="w-full bg-[#3b82f6] hover:bg-[#2563eb] rounded-t-[2px] transition-all duration-300 shadow-sm"
                  style={{ height: `${pct}%` }}
                />
              </div>
            )
          })}
        </div>

        {/* Ligne d'Axe X (bas) */}
        <div className="ml-12 border-b-2 border-stone-300 dark:border-zinc-700" />

        {/* Libellés de l'Axe X (Dates / Jours) en bas */}
        <div className="ml-12 pl-2 pr-2 mt-2 flex justify-around text-center">
          {donnees.map((item) => (
            <span key={item.cle} className="flex-1 text-[11px] font-bold text-stone-600 dark:text-zinc-400 font-mono">
              {item.libelle}
            </span>
          ))}
        </div>

      </div>

    </div>
  )
}
