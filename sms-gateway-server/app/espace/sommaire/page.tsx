'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  LayoutGrid, Smartphone, Send, List, Inbox, Webhook, Receipt,
  Copy, Check, ArrowUpRight, Key, Loader2,
} from 'lucide-react'
import CoquilleEspace from '../../../composants/CoquilleEspace'

interface Profil {
  cle_api?: string
}

const SECTIONS = [
  { href: '/espace', icone: LayoutGrid, nom: 'Tableau de bord', texte: 'Le pouls de votre passerelle : volume du mois, appareils, quota.' },
  { href: '/espace/appareils', icone: Smartphone, nom: 'Parc d’envoi', texte: 'Vos téléphones relais, en ligne ou endormis — l’endroit pour en lier un nouveau par QR.' },
  { href: '/espace/envoyer', icone: Send, nom: 'Envoyer un SMS', texte: 'Un message depuis la console, sans écrire une ligne — pratique pour essayer votre clé.' },
  { href: '/espace/envois', icone: List, nom: 'Mes envois', texte: 'Chaque message et son verdict : mis en file, parti, échoué — et pourquoi.' },
  { href: '/espace/entrees', icone: Inbox, nom: 'SMS reçus', texte: 'Les réponses arrivées sur vos téléphones : les « PAYE CMD-… », les « OUI », les questions.' },
  { href: '/espace/evenements', icone: Webhook, nom: 'Intégrations', texte: 'La sonnette de votre site : le récepteur déjà rempli, le test, le journal des livraisons.' },
  { href: '/espace/facturation', icone: Receipt, nom: 'Facturation', texte: 'Le décompte honnête du mois, segment par segment.' },
]

export default function PageSommaireEspace() {
  const [cleApi, setCleApi] = useState<string | null>(null)
  const [cleChargee, setCleChargee] = useState(false)
  const [copiee, setCopiee] = useState(false)

  useEffect(() => {
    let vivant = true
    fetch('/api/espace/moi')
      .then((r) => (r.ok ? r.json() : null))
      .then((profil: Profil | null) => {
        if (vivant) { setCleApi(profil?.cle_api ?? null); setCleChargee(true) }
      })
      .catch(() => { if (vivant) setCleChargee(true) })
    return () => { vivant = false }
  }, [])

  function copierCle() {
    if (!cleApi) return
    navigator.clipboard?.writeText(cleApi)
    setCopiee(true)
    setTimeout(() => setCopiee(false), 2000)
  }

  return (
    <CoquilleEspace>
      <div className="mb-6">
        <h1 className="text-[28px] font-extrabold tracking-tight text-[#1C1917] dark:text-white">Sommaire</h1>
        <p className="mt-1 text-[13.5px] text-stone-600 dark:text-zinc-400">
          Votre espace, tout ce qui s&apos;y trouve — d&apos;un regard.
        </p>
      </div>

      {/* Votre clé — elle vit ici, pas ailleurs */}
      <div className="mb-6 flex flex-col gap-3 rounded-[1.5rem] border border-[#1C1917]/10 bg-white p-5 shadow-card dark:bg-zinc-900 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Key className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-[#1C1917] dark:text-white">Votre clé d&apos;API</p>
            <p className="truncate font-mono text-[11px] text-stone-500 dark:text-zinc-400">
              {cleApi ?? (cleChargee ? '— indisponible —' : 'chargement…')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/comment-ca-marche" className="text-[12px] font-semibold text-[#1D4ED8] hover:underline dark:text-[#93C5FD]">
            Comment l&apos;utiliser ↗
          </Link>
          <button
            onClick={copierCle}
            disabled={!cleApi}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#1C1917] px-3.5 py-2 text-[12px] font-semibold text-white transition hover:bg-stone-700 dark:bg-white dark:text-zinc-900 disabled:opacity-60"
          >
            {copiee ? <Check className="h-3.5 w-3.5" /> : cleApi ? <Copy className="h-3.5 w-3.5" /> : <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {copiee ? 'Copiée !' : 'Copier'}
          </button>
        </div>
      </div>

      {/* Les sept pièces de la maison */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group flex items-start gap-4 rounded-[1.5rem] border border-[#1C1917]/10 bg-white p-5 shadow-card transition hover:border-[#2563EB]/40 hover:shadow-md dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-blue-500/40"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <s.icone className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[13px] font-bold text-[#1C1917] dark:text-white">
                {s.nom}
                <ArrowUpRight className="h-3.5 w-3.5 text-stone-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-stone-600 dark:text-zinc-400">{s.texte}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* La porte vers la branchement du site */}
      <div className="mt-6 flex flex-col gap-2 rounded-[1.5rem] bg-gradient-to-br from-[#4f46e5] to-[#4338ca] p-5 text-white sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12.5px] leading-relaxed text-blue-100">
          Un site à brancher à la passerelle ? Le guide public tient en quatre gestes —
          clé, appareil, récepteur déjà rempli, test.
        </p>
        <Link
          href="/comment-ca-marche"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[12px] font-bold text-[#1C1917] transition hover:bg-blue-50"
        >
          Brancher votre site <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </CoquilleEspace>
  )
}
