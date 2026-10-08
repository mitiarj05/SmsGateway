'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import {
  Server, Smartphone, Code, ArrowRight, ArrowDown, ArrowUpRight, ChevronDown,
  Check, CheckCircle2, ShieldCheck, Zap, Radio, ChevronRight, MessageSquare,
  FolderKanban, Inbox, History, BarChart3, Clock, Lock, HelpCircle, FileText, Moon, Sun, Loader2
} from 'lucide-react'
import { Tilt } from '../composants/Effets'
import { useReveal } from '../lib/use-reveal'
import { useTheme } from '../lib/use-theme'

const EXEMPLES_CODE = {
  cURL: `curl -X POST https://sms-gateway-omega.vercel.app/api/sms/send \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+261340000000",
    "message": "Votre commande est prête !",
    "cle_api": "cle_votre_cle_ici"
  }'`,
  JS: `await fetch("https://sms-gateway-omega.vercel.app/api/sms/send", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    to: "+261340000000",
    message: "Votre commande est prête !",
    cle_api: "cle_votre_cle_ici"
  })
});`,
  Python: `import requests

requests.post(
    "https://sms-gateway-omega.vercel.app/api/sms/send",
    json={
        "to": "+261340000000",
        "message": "Votre commande est prête !",
        "cle_api": "cle_votre_cle_ici",
    },
)`,
} as const

const DEMO_ETAPES = [
  { icone: MessageSquare, titre: 'Console Web', desc: 'Message reçu et mis en forme' },
  { icone: Inbox, titre: "File d'attente", desc: 'Priorisé pour la passerelle' },
  { icone: Smartphone, titre: 'Passerelle Android', desc: 'Prise en charge et envoi' },
  { icone: CheckCircle2, titre: 'Destinataire', desc: 'SMS remis au téléphone' },
] as const

export default function PageAccueilSMSIKA() {
  useReveal()
  const { modeSombre, monte, basculerTheme } = useTheme()
  const [ongletCode, setOngletCode] = useState<keyof typeof EXEMPLES_CODE>('cURL')
  const [codeCopie, setCodeCopie] = useState(false)
  const [faqOuverte, setFaqOuverte] = useState<number | null>(0)
  const codeExemple = EXEMPLES_CODE[ongletCode]

  // Démo interactive — simulation locale du parcours d'un SMS
  const [demoNumero, setDemoNumero] = useState('+261340000000')
  const [demoMessage, setDemoMessage] = useState('Votre commande est prête !')
  const [demoEtape, setDemoEtape] = useState(-1)
  const [demoLogs, setDemoLogs] = useState<string[]>([])
  const demoTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => () => { demoTimers.current.forEach(clearTimeout) }, [])

  const demoValide =
    /^\+?[0-9\s.-]{8,17}$/.test(demoNumero.trim()) &&
    demoMessage.trim().length > 0 &&
    demoMessage.length <= 160
  const demoEnCours = demoEtape >= 0 && demoEtape < 4

  function lancerDemo() {
    if (demoEnCours || !demoValide) return
    demoTimers.current.forEach(clearTimeout)
    demoTimers.current = []
    const apercu = demoMessage.trim().slice(0, 32) + (demoMessage.trim().length > 32 ? '…' : '')
    setDemoLogs([`→ Réception : « ${apercu} » vers ${demoNumero.trim()}`])
    setDemoEtape(0)
    const suites = [
      '✓ Format validé — placé en file d\u2019attente',
      '✓ Passerelle Android joignable — envoi en cours',
      '✓ Accusé de réception — SMS remis',
    ]
    suites.forEach((log, i) => {
      demoTimers.current.push(setTimeout(() => {
        setDemoLogs((l) => [...l, log])
        setDemoEtape(i + 1)
      }, 1100 * (i + 1)))
    })
    demoTimers.current.push(setTimeout(() => setDemoEtape(4), 1100 * 4))
  }

  async function copierCode() {
    try {
      await navigator.clipboard.writeText(codeExemple)
      setCodeCopie(true)
      setTimeout(() => setCodeCopie(false), 2000)
    } catch { /* presse-papiers indisponible */ }
  }
  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-800 font-sans antialiased selection:bg-blue-600 selection:text-white dark:bg-[#0B0F19] dark:text-zinc-100">

      {/* ================= 1. NAVBAR PLEIN ÉCRAN ================= */}
      <div className="sticky top-0 z-50 w-full">
        <header className="flex h-[72px] items-center justify-between border-b border-slate-200/60 bg-white/80 px-6 backdrop-blur-xl lg:px-12 dark:border-white/10 dark:bg-[#0B0F19]/85">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/icons/logoClair.png" alt="SMSTSIKA" width={180} height={44} className="h-11 w-auto dark:hidden" />
            <Image src="/icons/logoSombre.png" alt="SMSTSIKA" width={180} height={44} className="hidden h-11 w-auto dark:block" />
          </Link>

          <nav className="hidden items-center gap-8 text-[13px] font-medium text-slate-500 md:flex dark:text-zinc-400">
            <a href="#fonctionnalites" className="relative transition hover:text-slate-950 dark:hover:text-white after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-[#2563EB] after:transition-all hover:after:w-full">Fonctionnalités</a>
            <a href="#demo" className="relative transition hover:text-slate-950 dark:hover:text-white after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-[#2563EB] after:transition-all hover:after:w-full">Démo</a>
            <a href="#fonctionnement" className="relative transition hover:text-slate-950 dark:hover:text-white after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-[#2563EB] after:transition-all hover:after:w-full">Comment ça marche</a>
            <a href="#cas-d-usage" className="relative transition hover:text-slate-950 dark:hover:text-white after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-[#2563EB] after:transition-all hover:after:w-full">Cas d'usage</a>
            <a href="#api" className="relative transition hover:text-slate-950 dark:hover:text-white after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-[#2563EB] after:transition-all hover:after:w-full">API</a>
            <a href="#faq" className="relative transition hover:text-slate-950 dark:hover:text-white after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-[#2563EB] after:transition-all hover:after:w-full">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={basculerTheme}
              title={!monte ? 'Thème' : modeSombre ? 'Mode clair' : 'Mode sombre'}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/70 bg-white/70 text-slate-500 backdrop-blur-md transition hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-300 dark:hover:bg-white/10"
            >
              {!monte || !modeSombre ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <Link href="/login" className="hidden text-[13px] font-semibold text-slate-600 transition hover:text-slate-950 sm:block dark:hover:text-white dark:text-zinc-300">
              Connexion
            </Link>
            <Link
              href="/login"
              className="group inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-6 py-2.5 text-[13px] font-bold text-white shadow-[0_20px_40px_-15px_rgba(124,58,237,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-12px_rgba(124,58,237,0.6)]"
            >
              Commencer
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </header>
      </div>

      {/* ================= 2. HERO 2 COLONNES ================= */}
      <section className="relative overflow-hidden py-16 lg:py-24">
        {/* Halo violet + particules */}
        <div className="orbe-derive pointer-events-none absolute left-1/4 top-0 h-[480px] w-[820px] rounded-full bg-blue-500/10 blur-[130px]" />
        <span className="anim-flotte pointer-events-none absolute left-[6%] top-40 h-1.5 w-1.5 rounded-full bg-blue-400/60" />
        <span className="anim-flotte-retard pointer-events-none absolute right-[8%] top-24 h-2 w-2 rounded-full bg-blue-500/50" />

        <div className="relative grid w-full grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2 lg:gap-8 lg:px-12">
          {/* Colonne texte */}
          <div className="text-center lg:text-left">
            <div className="anim-entree inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-white/70 px-4 py-1.5 text-xs font-bold text-[#1D4ED8] shadow-sm backdrop-blur-md dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2563EB]" />
              </span>
              Passerelle SMS autohébergée
            </div>

            <h1 className="mt-7 text-4xl font-black leading-[1.08] tracking-[-0.03em] text-[#0F172A] sm:text-5xl xl:text-6xl dark:text-white">
              <span className="mot-anime block" style={{ animationDelay: '0ms' }}>Vos téléphones,</span>
              <span className="mot-anime block" style={{ animationDelay: '150ms' }}>
                deviennent votre{" "}
                <span className="texte-degrade-anime bg-gradient-to-r from-[#2563EB] via-[#38BDF8] to-[#2563EB] bg-clip-text text-transparent">passerelle&nbsp;SMS</span>
              </span>
              <span className="mot-anime block" style={{ animationDelay: '300ms' }}>— sans abonnement.</span>
            </h1>

            <p className="anim-entree mx-auto mt-7 max-w-2xl text-base leading-relaxed text-[#475569] sm:text-lg lg:mx-0 dark:text-zinc-400" style={{ animationDelay: '240ms' }}>
              Centralisez vos envois, suivez vos appareils et retrouvez vos messages. SMSTSIKA relie votre espace web à votre passerelle Android.
            </p>

            <div className="anim-entree mt-10 flex flex-wrap justify-center gap-4 lg:justify-start" style={{ animationDelay: '360ms' }}>
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-8 py-4 text-[15px] font-bold text-white shadow-[0_20px_40px_-15px_rgba(124,58,237,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-12px_rgba(124,58,237,0.6)]"
              >
                Ouvrir mon espace
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <a
                href="#fonctionnement"
                className="btn-bordure-lumineuse inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-8 py-4 text-[15px] font-bold text-slate-700 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-15px_rgba(124,58,237,0.2)] dark:border-white/15 dark:bg-white/[0.06] dark:text-zinc-100"
              >
                Découvrir le fonctionnement
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>

            {/* Micro-garanties — comme les trust bullets Twilio */}
            <div className="anim-entree mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-500 lg:justify-start dark:text-zinc-400" style={{ animationDelay: '420ms' }}>
              {['100 % autohébergé', 'Sans abonnement', 'Clé API sous 24 h'].map((g) => (
                <span key={g} className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-500" /> {g}
                </span>
              ))}
            </div>
          </div>

          {/* Colonne visuel */}
          <div className="anim-entree relative w-full [perspective:1800px]" style={{ animationDelay: '480ms' }}>
            <div className="pointer-events-none absolute -inset-10 rounded-[3rem] bg-gradient-to-br from-blue-500/15 via-blue-500/10 to-sky-400/10 blur-3xl" />
            <Tilt max={5}>
              <div className="relative grid grid-cols-1 items-center gap-6 [transform:rotateX(2deg)_rotateY(-2deg)] xl:grid-cols-[1fr_220px]">
                {/* Console Web */}
                <div className="relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/60 shadow-[0_40px_90px_-24px_rgba(124,58,237,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05]">
                  <div className="flex items-center gap-2 border-b border-slate-200/60 bg-white/60 px-5 py-3 backdrop-blur-md dark:border-white/10 dark:bg-black/20">
                    <span className="h-3 w-3 rounded-full bg-rose-400" />
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                    <span className="ml-3 hidden flex-1 truncate rounded-md bg-slate-100/80 px-3 py-1 text-left font-mono text-[11px] text-slate-400 sm:block dark:bg-white/10 dark:text-zinc-400">
                      console.smstsika.local — Vue d'ensemble
                    </span>
                  </div>
                  <Image
                    src="/landing/web.png"
                    alt="SMSTSIKA Console Web — Vue d'ensemble"
                    width={1879}
                    height={918}
                    priority
                    className="w-full h-auto"
                  />
                  {/* Rayon laser : flux console → téléphone */}
                  <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-40 xl:block">
                    <div className="absolute right-[-30px] top-1/2 h-px w-full -rotate-6 bg-gradient-to-r from-transparent via-blue-500/60 to-sky-400">
                      <span className="laser-point absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-sky-400 shadow-[0_0_12px_4px_rgba(217,70,239,.55)]" />
                    </div>
                  </div>
                </div>
                {/* Smartphone Android en superposition */}
                <div className="relative z-10 mx-auto w-[230px] shrink-0 overflow-hidden rounded-[2.2rem] border-[5px] border-slate-900 bg-white shadow-[0_50px_100px_-20px_rgba(11,15,25,.55)] xl:-ml-16 xl:mt-10 xl:w-[220px] dark:border-white/15">
                  <Image
                    src="/landing/android.png"
                    alt="SMSTSIKA Application Mobile — Tâches reçues"
                    width={460}
                    height={985}
                    priority
                    className="w-full h-auto"
                  />
                </div>
              </div>
              {/* Puce statut */}
              <div className="anim-flotte absolute -right-3 -top-5 hidden items-center gap-2 rounded-2xl border border-emerald-200/70 bg-white/70 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-[0_20px_40px_-15px_rgba(16,185,129,0.35)] backdrop-blur-xl md:flex dark:border-emerald-500/25 dark:bg-[#0B0F19]/85 dark:text-zinc-100">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_2px_rgba(16,185,129,.5)]" />
                </span>
                Passerelle active · 12 SMS/sec
              </div>
              {/* Badges verre flottants */}
              <div className="anim-flotte absolute -left-3 top-16 hidden items-center gap-2 rounded-2xl border border-white/70 bg-white/70 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-[0_20px_40px_-15px_rgba(124,58,237,0.3)] backdrop-blur-xl md:flex dark:border-white/10 dark:bg-[#0B0F19]/85 dark:text-zinc-100">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600">
                  <Zap className="h-3.5 w-3.5" />
                </span>
                API connectée
              </div>
              <div className="anim-flotte-retard absolute -bottom-5 right-24 hidden items-center gap-2 rounded-2xl border border-white/70 bg-white/70 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-[0_20px_40px_-15px_rgba(124,58,237,0.3)] backdrop-blur-xl md:flex dark:border-white/10 dark:bg-[#0B0F19]/85 dark:text-zinc-100">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#2563EB]/10 text-sm font-black text-[#2563EB]">✓</span>
                SMS remis instantanément
              </div>
            </Tilt>
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 px-2 font-medium dark:text-zinc-500">
              <span>Un même flux, de la console web aux tâches Android.</span>
              <span>Captures de démonstration - valeurs fictives</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 2b. DÉMO INTERACTIVE ================= */}
      <section data-reveal id="demo" className="py-16 bg-[#110C2E] text-white">
        <div className="w-full px-6 space-y-10 lg:px-12">
          <div className="text-center space-y-3">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-400">ESSAYEZ SANS COMPTE</span>
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Envoyez votre premier SMS. Ici, maintenant.
            </h2>
            <p className="text-base text-blue-200/70 max-w-xl mx-auto">
              Simulation visuelle du parcours réel — aucun SMS envoyé, aucune donnée ne quitte votre navigateur.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Formulaire */}
            <div className="rounded-[1.5rem] bg-indigo-950/60 p-8 border border-blue-800/40 space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="demo-numero" className="block text-[11px] font-bold uppercase tracking-wider text-blue-300">
                  Numéro destinataire
                </label>
                <input
                  id="demo-numero"
                  type="tel"
                  maxLength={17}
                  value={demoNumero}
                  onChange={(e) => setDemoNumero(e.target.value)}
                  placeholder="+261340000000"
                  className="w-full rounded-xl border border-blue-800/40 bg-black/40 px-4 py-3 font-mono text-sm text-white placeholder-blue-300/40 outline-none transition focus:border-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]/20"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="demo-message" className="block text-[11px] font-bold uppercase tracking-wider text-blue-300">
                  Message
                </label>
                <textarea
                  id="demo-message"
                  rows={3}
                  maxLength={160}
                  value={demoMessage}
                  onChange={(e) => setDemoMessage(e.target.value)}
                  placeholder="Votre commande est prête !"
                  className="w-full rounded-xl border border-blue-800/40 bg-black/40 px-4 py-3 text-sm text-white placeholder-blue-300/40 outline-none transition resize-y focus:border-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]/20"
                />
                <p className="text-right font-mono text-[10px] text-blue-300/60">
                  {demoMessage.length}/160 · 1 SMS
                </p>
              </div>
              <button
                type="button"
                onClick={lancerDemo}
                disabled={!demoValide || demoEnCours}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] py-4 text-sm font-bold text-white shadow-[0_20px_40px_-15px_rgba(124,58,237,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-12px_rgba(124,58,237,0.6)] disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {demoEnCours ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Envoi en cours…</>
                ) : demoEtape === 4 ? (
                  <>Rejouer la démo <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
                ) : (
                  <>Envoyer le SMS de test <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
                )}
              </button>
              <p className="text-center text-[11px] text-blue-300/60">
                Simulation locale — aucun SMS réel envoyé.
              </p>
            </div>

            {/* Pipeline animé */}
            <div className="rounded-[1.5rem] bg-indigo-950/60 p-8 border border-blue-800/40 space-y-3">
              {DEMO_ETAPES.map((e, i) => {
                const fait = demoEtape === 4 || demoEtape > i
                const actif = demoEtape === i
                return (
                  <div
                    key={e.titre}
                    className={`flex items-center gap-4 rounded-2xl border p-4 transition-all duration-300 ${
                      fait
                        ? 'border-emerald-500/30 bg-emerald-500/10'
                        : actif
                          ? 'border-blue-500/40 bg-blue-500/10'
                          : 'border-blue-800/40 bg-black/20 opacity-60'
                    }`}
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                      fait ? 'bg-emerald-500 text-white' : actif ? 'bg-blue-600 text-white' : 'bg-white/10 text-blue-300'
                    }`}>
                      {fait ? <Check className="h-5 w-5" /> : actif ? <Loader2 className="h-5 w-5 animate-spin" /> : <e.icone className="h-5 w-5" />}
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-white">{e.titre}</span>
                      <span className="block text-xs text-blue-200/70">{e.desc}</span>
                    </span>
                  </div>
                )
              })}
              <div className="rounded-xl bg-black/40 border border-blue-800/40 p-4 font-mono text-[11px] leading-relaxed text-blue-100 min-h-[96px]">
                {demoLogs.length === 0
                  ? <span className="text-blue-300/40">En attente d'envoi…</span>
                  : demoLogs.map((log, i) => <p key={i}>{log}</p>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 3. SECTION FONCTIONNALITÉS PRINCIPALES ================= */}
      <section data-reveal id="fonctionnalites" className="py-16 bg-white border-t border-slate-200/60 dark:bg-[#0B0F19] dark:border-white/10">
        <div className="w-full px-6 space-y-10 lg:px-12">

          {/* Trois piliers (Haut) */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { icone: FolderKanban, titre: 'Un point de contrôle unique', desc: 'Envois, réception et activité : gardez une vue d\'ensemble depuis votre navigateur.' },
              { icone: Smartphone, titre: 'Android comme passerelle', desc: 'Vos appareils prennent le relais et affichent les tâches reçues pour l\'envoi des SMS.' },
              { icone: BarChart3, titre: 'Un suivi concret, à chaque étape', desc: 'Consultez les files, les statuts et les journaux pour comprendre ce qui se passe.' },
            ].map((p, i) => (
              <div key={i} className="group rounded-[1.5rem] bg-slate-50 p-6 space-y-3 border border-slate-100 transition-all duration-300 hover:-translate-y-1 hover:border-[#2563EB]/40 hover:shadow-[0_20px_40px_-15px_rgba(37,99,235,0.3)] dark:bg-white/[0.04] dark:border-white/10">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold shadow-md shadow-blue-500/30 transition-transform duration-300 group-hover:scale-110">
                  <p.icone className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{p.titre}</h3>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-zinc-400">{p.desc}</p>
              </div>
            ))}
          </div>

          {/* En-tête de section & Grille de 6 cartes d'outils */}
          <div className="space-y-8 pt-8">
            <div className="text-center space-y-3">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#2563EB] dark:text-[#60A5FA]">TOUT VOTRE FLUX SMS</span>
              <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
                Moins d'écrans à surveiller. Plus de visibilité.
              </h2>
              <p className="text-base text-slate-500 max-w-xl mx-auto dark:text-zinc-400">
                Des outils de pilotage concrets, déjà visibles dans la console web et l'application Android.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {[
                { icone: Smartphone, titre: 'Parc d\'envoi', desc: 'Retrouvez vos appareils et leur état de connexion. Repérez la passerelle qui demande votre attention.', tag: 'Appareils · connexion · dernier signal' },
                { icone: CheckCircle2, titre: 'Tâches Android', desc: 'Sur le téléphone, consultez les tâches reçues, celles en attente et celles en échec.', tag: 'Toutes · en attente · échecs' },
                { icone: Inbox, titre: 'File d\'attente', desc: 'Visualisez les messages en attente de traitement avant leur prise en charge par la passerelle.', tag: 'Messages à traiter' },
                { icone: MessageSquare, titre: 'SMS reçus', desc: 'Retrouvez les messages entrants dans un espace dédié, sans perdre le fil de vos échanges.', tag: 'Réception centralisée' },
                { icone: History, titre: 'Historique', desc: 'Revenez sur les envois et consultez le journal pour retrouver l\'activité de votre infrastructure.', tag: 'Envois · journal des événements' },
                { icone: BarChart3, titre: 'Suivi de l\'activité', desc: 'Lisez le rythme d\'envoi et les états visibles dans la console pour garder le contexte.', tag: 'Vue d\'ensemble · statuts · suivi' },
              ].map((c, i) => (
                <div key={i} className="group rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-8 space-y-4 hover:-translate-y-1.5 hover:border-[#2563EB]/50 hover:shadow-[0_24px_48px_-16px_rgba(37,99,235,0.35)] transition-all duration-300 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md shadow-blue-500/30 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <c.icone className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{c.titre}</h3>
                  <p className="text-sm leading-relaxed text-slate-500 dark:text-zinc-400">{c.desc}</p>
                  <div className="pt-2">
                    <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-600 dark:bg-white/10 dark:text-zinc-300">{c.tag}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center">
              <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2563EB] hover:underline dark:text-[#60A5FA]">
                Explorer la console <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ================= 4. SECTION PROCESSUS / ÉTAPES (Fond sombre) ================= */}
      <section data-reveal id="fonctionnement" className="py-16 bg-[#110C2E] text-white">
        <div className="w-full px-6 space-y-8 lg:px-12">
          <div className="text-center space-y-3">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-400">DU WEB AU TÉLÉPHONE</span>
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Un lien simple. Trois étapes.
            </h2>
            <p className="text-base text-blue-200/70 max-w-xl mx-auto">
              Le web organise vos envois. Android prend le relais.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { num: '01', titre: 'Reliez votre Android', desc: 'Configurez votre appareil comme passerelle et retrouvez son état dans votre parc d\'envoi.', tags: ['Application Android', 'Parc d\u2019envoi'] },
              { num: '02', titre: 'Préparez vos messages', desc: 'Créez un SMS depuis la console web ou intégrez l\'envoi à votre application via l\'API.', tags: ['Console Web', 'API REST'] },
              { num: '03', titre: 'Suivez le traitement', desc: 'Consultez les tâches sur Android, la file d\'attente et l\'historique depuis votre espace web.', tags: ['Console Web', 'Android', 'Historique'] },
            ].map((s) => (
              <div key={s.num} className="rounded-[1.5rem] bg-indigo-950/60 p-8 border border-blue-800/40 space-y-6 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-black text-blue-400">{s.num}</span>
                  <Smartphone className="h-6 w-6 text-blue-300" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white">{s.titre}</h3>
                  <p className="text-sm leading-relaxed text-blue-200/70">{s.desc}</p>
                </div>
                {/* Tags produit — comme les chapitres Twilio */}
                <div className="flex flex-wrap gap-2">
                  {s.tags.map((t) => (
                    <span key={t} className="rounded-full bg-blue-500/15 px-3 py-1 text-[10px] font-bold text-blue-200">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-blue-300">ℹ️ Prévoyez un appareil Android connecté et une SIM capable d'envoyer des SMS.</p>
          </div>
        </div>
      </section>

      {/* ================= 5. SECTION CAS D'USAGE ================= */}
      <section data-reveal id="cas-d-usage" className="py-16 bg-white border-t border-slate-200/60 dark:bg-[#0B0F19] dark:border-white/10">
        <div className="w-full px-6 space-y-8 lg:px-12">
          <div className="text-center space-y-3">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#2563EB] dark:text-[#60A5FA]">DES MESSAGES QUI ONT UN RÔLE</span>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
              Le bon SMS, au bon moment.
            </h2>
            <p className="text-base text-slate-500 max-w-xl mx-auto dark:text-zinc-400">
              Des usages du quotidien à intégrer à vos propres parcours.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { badge: 'Commandes', titre: 'Gardez vos clients informés', desc: 'Accompagnez les étapes d\'une commande avec un message clair et utile.', exemple: 'Bonjour Léa, votre commande est prête. Vous pouvez la retirer à la boutique.' },
              { badge: 'Rendez-vous', titre: 'Rappelez le prochain rendez-vous', desc: 'Intégrez un rappel SMS à votre organisation ou à votre outil de réservation.', exemple: 'Bonjour Adam, rappel de votre rendez-vous demain à 14 h. À bientôt !' },
              { badge: 'Vérification', titre: 'Transmettez un code par SMS', desc: 'Reliez vos parcours de vérification à l\'envoi de messages depuis votre application.', exemple: 'Votre code de vérification est 482 619. Ne le communiquez à personne.' },
            ].map((u, i) => (
              <div key={i} className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-8 space-y-6 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">{u.badge}</span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{u.titre}</h3>
                  <p className="text-sm leading-relaxed text-slate-500 dark:text-zinc-400">{u.desc}</p>
                </div>
                <div className="rounded-xl bg-blue-50/70 p-4 border border-blue-100 text-xs space-y-1 dark:bg-blue-500/10 dark:border-blue-500/20">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">VOTRE ENTREPRISE</p>
                  <p className="font-medium text-slate-800 dark:text-zinc-100">"{u.exemple}"</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-2">
            <p className="text-[11px] text-slate-400 dark:text-zinc-500">Messages illustratifs. Adaptez vos envois à votre contexte et aux règles de consentement applicables.</p>
          </div>
        </div>
      </section>

      {/* ================= 6. SECTION INTEGRATION & API (Fond sombre) ================= */}
      <section data-reveal id="api" className="py-16 bg-[#110C2E] text-white">
        <div className="grid w-full grid-cols-1 lg:grid-cols-2 gap-12 items-center px-6 lg:px-12">
          <div className="space-y-6">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-400">PENSÉ POUR VOS OUTILS</span>
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Développez.<br />Sans limites.
            </h2>
            <p className="text-sm text-blue-200/70 leading-relaxed">
              Déclenchez vos envois depuis votre application grâce à l'API. Retrouvez ensuite leur activité dans SMSTSIKA.
            </p>
            <ul className="space-y-3 text-sm text-blue-100 font-semibold">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Connecter votre application</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Préparer vos requêtes d'envoi</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Retrouver le suivi dans la console</li>
            </ul>
            {/* Pills langages — comme Twilio, elles pilotent l'exemple de code */}
            <div className="flex flex-wrap gap-2">
              {([{ cle: 'cURL', libelle: 'cURL' }, { cle: 'JS', libelle: 'JavaScript' }, { cle: 'Python', libelle: 'Python' }] as const).map((l) => (
                <button
                  key={l.cle}
                  type="button"
                  onClick={() => { setOngletCode(l.cle); setCodeCopie(false) }}
                  className={`rounded-full px-4 py-1.5 font-mono text-[11px] font-bold transition ${
                    ongletCode === l.cle ? 'bg-blue-600 text-white shadow' : 'bg-white/10 text-blue-200 hover:bg-white/20'
                  }`}
                >
                  {l.libelle}
                </button>
              ))}
            </div>
            <div className="pt-2">
              <Link
                href="/espace/api"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-7 py-3.5 text-sm font-bold text-white shadow-lg hover:shadow-blue-500/50 transition-all"
              >
                Consulter la documentation ↗
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] bg-indigo-950/60 p-8 border border-blue-800/40 space-y-6">
            <div className="flex items-center justify-between text-xs font-mono text-blue-300 border-b border-blue-900/60 pb-3">
              <span>application → SMS</span>
              <div className="flex gap-1.5 rounded-lg bg-black/30 p-1">
                {(['cURL', 'JS', 'Python'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setOngletCode(t); setCodeCopie(false) }}
                    className={`rounded-md px-2.5 py-1 text-[10px] font-bold transition ${
                      ongletCode === t ? 'bg-blue-600 text-white shadow' : 'text-blue-300/70 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative rounded-xl bg-black/40 border border-blue-800/40 p-4">
              <button
                onClick={copierCode}
                className="absolute right-3 top-3 rounded-lg bg-white/10 px-2.5 py-1 text-[10px] font-bold text-blue-200 transition hover:bg-white/20 hover:text-white"
              >
                {codeCopie ? 'Copié ✓' : 'Copier'}
              </button>
              <pre className="overflow-x-auto pr-16 font-mono text-[11.5px] leading-relaxed text-blue-100">{codeExemple}</pre>
            </div>
            <div className="space-y-0 text-sm">
              {["Votre application", "API SMSTSIKA", "Passerelle Android"].map((etape, i, arr) => (
                <div key={etape}>
                  <div className="rounded-xl bg-blue-900/40 p-4 border border-blue-700/40 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">{etape}</p>
                      <p className="text-[10px] text-blue-200/70">
                        {i === 0 ? 'Une commande, un rappel, une vérification' : i === 1 ? "La demande d'envoi" : 'Le relais vers le destinataire'}
                      </p>
                    </div>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="relative mx-auto h-7 w-px overflow-visible bg-gradient-to-b from-blue-400/60 to-blue-400/10">
                      <span className="connecteur-point absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-sky-400 shadow-[0_0_8px_3px_rgba(56,189,248,.6)]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-blue-300/60 text-center">Schéma de principe. Consultez la documentation pour les paramètres et la configuration de l'API.</p>
          </div>
        </div>
      </section>

      {/* ================= 6b. BANDEAU CONFIANCE ================= */}
      <section data-reveal className="py-14 bg-white border-t border-slate-200/60 dark:bg-[#0B0F19] dark:border-white/10">
        <div className="grid w-full grid-cols-1 gap-6 px-6 sm:grid-cols-2 lg:px-12 xl:grid-cols-4">
          {[
            { icone: ShieldCheck, titre: 'Données locales', desc: 'Votre infrastructure, votre contrôle. Rien ne transite par un cloud tiers.' },
            { icone: Smartphone, titre: 'Un téléphone suffit', desc: 'Un Android connecté et une SIM : votre passerelle est prête.' },
            { icone: Lock, titre: 'Accès validé', desc: 'Chaque clé API est remise après validation de votre demande.' },
            { icone: Clock, titre: 'Réponse sous 24 h', desc: 'Votre demande d\u2019accès est traitée en un jour ouvré.' },
          ].map((a) => (
            <div key={a.titre} className="flex items-start gap-4 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-6 dark:border-white/10 dark:bg-white/[0.04]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md shadow-blue-500/30">
                <a.icone className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-bold text-slate-900 dark:text-white">{a.titre}</span>
                <span className="mt-1 block text-xs leading-relaxed text-slate-500 dark:text-zinc-400">{a.desc}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ================= 7. SECTION FAQ ================= */}
      <section data-reveal id="faq" className="py-16 bg-white border-t border-slate-200/60 dark:bg-[#0B0F19] dark:border-white/10">
        <div className="grid w-full grid-cols-1 lg:grid-cols-3 gap-12 px-6 lg:px-12">
          <div className="space-y-4">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#2563EB] dark:text-[#60A5FA]">AVANT DE VOUS LANCER</span>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
              Les réponses à vos questions.
            </h2>
            <p className="text-base text-slate-500 leading-relaxed dark:text-zinc-400">
              Comprendre le rôle de chaque outil, avant votre premier envoi.
            </p>
            <div className="pt-2">
              <Link href="/espace/api" className="text-sm font-bold text-[#2563EB] hover:underline inline-flex items-center gap-1 dark:text-[#60A5FA]">
                Explorer la documentation ↗
              </Link>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {[
              { q: 'Quel est le rôle du téléphone Android ?', r: 'Il sert de passerelle pour l\'envoi des SMS. La console web permet de piloter le flux ; l\'application Android reçoit les tâches à traiter.' },
              { q: 'Que faut-il pour commencer ?', r: 'Un espace SMSTSIKA, un appareil Android configuré et connecté, ainsi qu\'une SIM et un forfait adaptés à vos envois. Reportez-vous à la documentation pour la mise en place.' },
              { q: 'Où retrouver les messages et leurs statuts ?', r: 'La console rassemble la file d\'attente, les SMS reçus et l\'historique. Sur Android, l\'écran des tâches distingue les messages reçus, en attente et en échec.' },
              { q: 'Puis-je envoyer depuis mon propre logiciel ?', r: 'L\'API REST permet de relier vos propres outils à SMSTSIKA. La documentation détaille les étapes de configuration et les paramètres des demandes d\'envoi.' },
              { q: 'Les chiffres de l\'aperçu sont-ils des résultats réels ?', r: 'Non. Le montage présente des données de démonstration fictives. Elles illustrent les écrans du produit, pas des performances réelles ni un engagement de résultat.' },
            ].map((faq, i) => {
              const ouverte = faqOuverte === i
              return (
                <div key={i} className={`rounded-2xl border transition-all duration-300 ${ouverte ? 'border-blue-200 bg-white shadow-[0_20px_40px_-15px_rgba(37,99,235,0.25)] dark:border-blue-500/30 dark:bg-white/[0.04] dark:shadow-none' : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20'}`}>
                  <button
                    onClick={() => setFaqOuverte(ouverte ? null : i)}
                    className="flex w-full items-center justify-between gap-4 p-6 text-left"
                    aria-expanded={ouverte}
                  >
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{faq.q}</h3>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${ouverte ? 'bg-blue-600 text-white rotate-180' : 'bg-slate-200/70 text-slate-500 dark:bg-white/10 dark:text-zinc-400'}`}>
                      <ChevronDown className="h-4 w-4" />
                    </span>
                  </button>
                  <div className={`grid transition-all duration-300 ease-out ${ouverte ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <p className="px-6 pb-6 text-sm text-slate-600 leading-relaxed dark:text-zinc-400">{faq.r}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ================= 8. CALL TO ACTION FINAL (CTA) ================= */}
      <section className="py-16 bg-gradient-to-b from-[#2563EB] to-[#1D4ED8] text-white">
        <div className="mx-auto max-w-5xl px-6 text-center space-y-6">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-200">VOTRE PROCHAIN ENVOI COMMENCE ICI</span>
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Reprenez la main sur vos SMS.
          </h2>
          <p className="text-base text-blue-100 max-w-lg mx-auto">
            Un espace web pour piloter. Votre Android pour faire le lien.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-[#1D4ED8] shadow-xl transition-all hover:-translate-y-0.5"
            >
              Commencer avec SMSTSIKA ↗
            </Link>
            <Link
              href="/espace/api"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-8 py-4 text-base font-bold text-white backdrop-blur transition-all hover:bg-white/20"
            >
              Lire le guide de démarrage ↗
            </Link>
          </div>
          <p className="text-[11px] text-blue-200/80 pt-2">
            Configurez votre passerelle, puis préparez votre premier message.
          </p>
        </div>
      </section>

      {/* ================= 9. FOOTER ================= */}
      <div aria-hidden className="h-1 bg-gradient-to-r from-[#2563EB] via-[#38BDF8] to-[#2563EB]" />
      <footer className="border-t border-slate-200/60 bg-[#110C2E] text-white py-12">
        <div className="grid w-full grid-cols-1 md:grid-cols-4 gap-8 px-6 lg:px-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image src="/icons/logoSombre.png" alt="SMSTSIKA" width={180} height={44} className="h-11 w-auto" />
            </div>
            <p className="text-xs text-blue-200/70 leading-relaxed">
              Le pilotage SMS depuis le web, avec Android comme passerelle.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-white">Produit</p>
            <ul className="space-y-2 text-xs text-blue-200/70">
              <li><a href="#fonctionnalites" className="hover:text-white transition">Fonctionnalités</a></li>
              <li><a href="#fonctionnement" className="hover:text-white transition">Fonctionnement</a></li>
              <li><a href="#cas-d-usage" className="hover:text-white transition">Cas d'usage</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-white">Ressources</p>
            <ul className="space-y-2 text-xs text-blue-200/70">
              <li><Link href="/espace/api" className="hover:text-white transition">Documentation API</Link></li>
              <li><Link href="/espace/api" className="hover:text-white transition">Guide de démarrage</Link></li>
              <li><a href="#api" className="hover:text-white transition">Questions fréquentes</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-white">Votre espace</p>
            <ul className="space-y-2 text-xs text-blue-200/70">
              <li><Link href="/login" className="hover:text-white transition">Connexion</Link></li>
              <li><Link href="/login" className="hover:text-white transition">Commencer</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-blue-900/60 flex flex-col sm:flex-row items-center justify-between text-xs text-blue-300/60 px-6 lg:px-12">
          <span>© 2026 SMSTSIKA · Mentions légales · Confidentialité</span>
          <span>Plateforme de passerelle SMS autohébergée</span>
        </div>
      </footer>

    </div>
  )
}
