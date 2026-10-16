import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'

export default function AppelFinal() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20 lg:px-8">
      <div data-reveal className="rounded-2xl bg-[#1C1917] px-6 py-14 sm:px-12">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#93C5FD]">VOTRE PROCHAIN ENVOI COMMENCE ICI</p>
        <h2 className="mt-3 max-w-xl font-sans text-3xl font-extrabold tracking-tight text-[#F7F5F0] sm:text-5xl">
          Reprenez la main sur vos SMS.
        </h2>
        <p className="mt-4 max-w-xl font-sans text-[15px] leading-relaxed text-stone-400">
          Un espace web pour piloter. Votre Android pour faire le lien.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link
            href="/login"
            className="group inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-6 py-3.5 text-[15px] font-bold text-white transition hover:bg-[#1D4ED8]"
          >
            Commencer avec SMS IKA
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/faq"
            className="group inline-flex items-center gap-1.5 text-[15px] font-bold text-[#F7F5F0] underline decoration-white/30 underline-offset-[6px] transition hover:decoration-white"
          >
            Questions fréquentes (FAQ)
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
