'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Check, Copy, Terminal } from 'lucide-react'

const CODE_CURL = `curl -X POST https://smstsika.vercel.app/api/sms/send \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+261340000000",
    "message": "Votre commande est prête !",
    "cle_api": "cle_live_…"
  }'`

const REPONSE = `{
  "statut": "accepte",
  "id": "msg_8f3a291b"
}`

export default function PreuveCode() {
  const [copie, setCopie] = useState(false)

  function copier() {
    navigator.clipboard?.writeText(CODE_CURL.replace('cle_live_…', 'cle_live_VOTRE_CLE'))
    setCopie(true)
    setTimeout(() => setCopie(false), 2000)
  }

  return (
    <section className="bg-[#1C1917]">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 lg:grid-cols-2 lg:px-8 lg:py-20">
        <div data-reveal>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#93C5FD]">DOCUMENTATION API</p>
          <h2 className="mt-3 font-sans text-3xl font-extrabold tracking-tight text-[#F7F5F0] sm:text-4xl">
            Une seule requête HTTP.
          </h2>
          <p className="mt-4 max-w-md font-sans text-[15px] leading-relaxed text-stone-400">
            Envoyez des SMS depuis votre application ou votre site web en une seule requête HTTP.
          </p>
          <Link
            href="/espace/api"
            className="group mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#93C5FD] hover:underline"
          >
            Documentation API
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <div data-reveal="zoom" className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
            <p className="flex items-center gap-2 font-mono text-[11px] font-bold text-stone-300">
              <Terminal className="h-3.5 w-3.5 text-[#93C5FD]" /> Requête d’envoi (cURL)
            </p>
            <button
              type="button"
              onClick={copier}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1.5 font-mono text-[10.5px] font-bold text-stone-200 transition hover:bg-white/10"
            >
              {copie ? <Check className="h-3.5 w-3.5 text-[#4ADE80]" /> : <Copy className="h-3.5 w-3.5" />}
              {copie ? 'Copié' : 'Copier'}
            </button>
          </div>
          <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-stone-300">{CODE_CURL}</pre>
          <div className="border-t border-white/10 px-4 py-3">
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-stone-500">Réponse du serveur</p>
            <pre className="overflow-x-auto font-mono text-[12px] leading-relaxed text-[#4ADE80]">{REPONSE}</pre>
          </div>
        </div>
      </div>
    </section>
  )
}
