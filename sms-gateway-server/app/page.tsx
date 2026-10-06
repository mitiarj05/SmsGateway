'use client'

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Moon, Sun, MessageSquare } from 'lucide-react'
import { useTheme } from '../lib/use-theme'
import { useReveal, useSpotlightBento } from '../lib/use-reveal'
import CompteurAnime from '../composants/CompteurAnime'
import MachineAEcrire from '../composants/MachineAEcrire'
import { Tilt, Magnetic } from '../composants/Effets'

/* ---------- Icônes SVG ---------- */
type IP = { d: React.ReactNode; size?: number; className?: string };
const I = ({ d, size = 18, className }: IP) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {d}
  </svg>
);

const IC = {
  msg: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  arrow: <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>,
  check: <polyline points="20 6 9 17 4 12" />,
  zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  layers: <><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></>,
  clock: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
  chart: <><line x1="4" y1="21" x2="4" y2="14" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /></>,
  code: <><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></>,
};

/* ---------- Données ---------- */
const marqueeItems = ["TELMA", "AIRTEL", "BIP", "GOOGLE FCM", "API REST", "WEBHOOKS", "MULTI-SIM", "COMPATIBLE YAS", "MVOLA", "ORANGE"];

type BentoItem = {
  span?: number
  icon: ReactNode
  chip: string
  title: string
  text: string
  demo?: ReactNode
  typewriterLines?: string[]
}

const bento: BentoItem[] = [
  {
    span: 2,
    icon: IC.layers, chip: "bi-indigo",
    title: "Multi-SIM parallèle",
    text: "Ajoutez autant de téléphones que vous voulez. La file d'attente répartit automatiquement les messages sur chaque appareil selon ses quotas et sa disponibilité.",
    typewriterLines: [
      '// POST /api/sms/send',
      '{"to": "0345726237", "text": "Bonjour !"}',
      '→ 201 Créé · mis en file',
    ],
  },
  {
    icon: IC.clock, chip: "bi-green",
    title: "File intelligente",
    text: "Retry automatique, expiration 24 h, reprise sur incident.",
  },
  {
    icon: IC.zap, chip: "bi-violet",
    title: "Push FCM",
    text: "Réveil instantané des téléphones, même en veille profonde.",
  },
  {
    icon: IC.chart, chip: "bi-cyan",
    title: "Stats temps réel",
    text: "Débit, taux d'échec, historique : tout, en direct.",
    demo: (
      <div>
        <div className="qrt h-2 w-full rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-cyan-400 rounded-full" style={{ width: "78%" }} /></div>
        <div className="qrow flex justify-between text-[10px] text-white/40 mt-1"><span>LUN</span><span>MAR</span><span>MER</span><span>JEU</span></div>
      </div>
    ),
  },
  {
    span: 2,
    icon: IC.code, chip: "bi-violet",
    title: "API REST & Webhooks",
    text: "Clés API par client, réponses SMS transmises à vos webhooks, guide d'intégration complet. Branchez votre CRM ou votre boutique en une après-midi.",
    typewriterLines: [
      "# Réception d'une réponse client",
      'POST https://votre-app.mg/webhook',
      '{"from": "03457…", "text": "OK pour demain"}',
      '→ 200 OK · notifié en 0,4 s',
    ],
  },
];

const stats = [
  { n: "20 SMS/h", l: "Quota anti-blocage par appareil" },
  { n: "18,3 s", l: "Temps de traitement moyen" },
  { n: "0 Ar", l: "D'abonnement — à vie" },
  { n: "99,9 %", l: "Disponibilité de la console" },
];

/* ---------- Page ---------- */
export default function LandingFutur() {
  useReveal();
  useSpotlightBento();
  const { modeSombre, monte, basculerTheme } = useTheme();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-100 text-slate-800 [font-family:Inter,system-ui,sans-serif] dark:bg-[#05040f] dark:text-white">
      {/* ===== Fond animé : aurores + grille + étoiles ===== */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[-200px] top-[-280px] h-[700px] w-[700px] animate-[drift1_18s_ease-in-out_infinite_alternate] rounded-full bg-[#4c4cc9]/20 blur-[120px]" />
        <div className="absolute right-[-220px] top-[10%] h-[600px] w-[600px] animate-[drift2_22s_ease-in-out_infinite_alternate-reverse] rounded-full bg-purple-500/15 blur-[120px]" />
        <div className="absolute bottom-[-200px] left-[30%] h-[500px] w-[500px] animate-[drift1_26s_ease-in-out_infinite_alternate] rounded-full bg-cyan-400/10 blur-[120px]" />
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(139,139,240,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(139,139,240,.08)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_90%_70%_at_50%_0%,#000_20%,transparent_100%)] dark:[background-image:linear-gradient(rgba(139,139,240,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(139,139,240,.05)_1px,transparent_1px)]" />
        <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(1px_1px_at_20%_30%,rgba(106,106,224,.5),transparent),radial-gradient(1px_1px_at_60%_70%,rgba(106,106,224,.4),transparent),radial-gradient(1.5px_1.5px_at_80%_20%,rgba(106,106,224,.5),transparent),radial-gradient(1px_1px_at_35%_80%,rgba(106,106,224,.35),transparent),radial-gradient(1.5px_1.5px_at_90%_60%,rgba(106,106,224,.4),transparent),radial-gradient(1px_1px_at_10%_60%,rgba(106,106,224,.4),transparent),radial-gradient(1.5px_1.5px_at_70%_40%,rgba(106,106,224,.45),transparent)] dark:opacity-100 dark:[background-image:radial-gradient(1px_1px_at_20%_30%,rgba(255,255,255,.6),transparent),radial-gradient(1px_1px_at_60%_70%,rgba(255,255,255,.5),transparent),radial-gradient(1.5px_1.5px_at_80%_20%,rgba(255,255,255,.7),transparent),radial-gradient(1px_1px_at_35%_80%,rgba(255,255,255,.4),transparent),radial-gradient(1.5px_1.5px_at_90%_60%,rgba(255,255,255,.5),transparent),radial-gradient(1px_1px_at_10%_60%,rgba(255,255,255,.5),transparent),radial-gradient(1.5px_1.5px_at_70%_40%,rgba(255,255,255,.6),transparent)]" />
      </div>

      <div className="relative z-[2] mx-auto max-w-[1200px] px-8">
        {/* ===== NAV ===== */}
        <nav className="relative z-10 flex items-center gap-8 py-[22px]">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-gradient-to-br from-[#6a6ae0] to-[#4c4cc9] text-white shadow-[0_0_24px_rgba(106,106,224,.55)]">
              <Image src="/smsika.png" alt="SMSIKA" width={24} height={24} className="rounded" />
            </span>
            <span className="text-[16px] font-extrabold tracking-wide text-slate-900 dark:text-white">SMSIKA</span>
            <span className="rounded-full border border-[#8b8bf0]/30 bg-[#8b8bf0]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.16em] text-[#5b5bd6] dark:text-[#a5a5f5]">
              Console SMS
            </span>
          </Link>
          <div className="mx-auto hidden gap-[26px] md:flex">
            {[["Fonctionnement", "#fonctionnement"], ["Fonctionnalités", "#fonctionnalites"]].map(([l, href]) => (
              <a key={l} href={href} className="text-[13.5px] font-medium text-slate-500 transition-all hover:text-slate-900 hover:[text-shadow:0_0_18px_rgba(139,139,240,.9)] dark:text-[#9c9ac4] dark:hover:text-white">
                {l}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2.5">
            {/* Basculeur de thème */}
            <button
              onClick={basculerTheme}
              title={!monte ? 'Thème' : modeSombre ? 'Mode clair' : 'Mode sombre'}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              {!monte || !modeSombre ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            <Link href="/login?onglet=client" className="rounded-full border border-slate-200 bg-white px-[18px] py-2 text-[13px] font-semibold text-slate-700 shadow-sm backdrop-blur transition-all hover:border-[#8b8bf0]/60 hover:shadow-[0_0_22px_rgba(106,106,224,.35)] dark:border-white/10 dark:bg-white/5 dark:text-[#e6e4ff]">
              Espace Client
            </Link>
            <Link href="/login" className="rounded-full border-none bg-gradient-to-br from-[#6a6ae0] to-[#4c4cc9] px-[22px] py-2.5 text-[13px] font-bold text-white shadow-[0_0_26px_rgba(106,106,224,.5),inset_0_1px_0_rgba(255,255,255,.3)] transition-all hover:-translate-y-px hover:shadow-[0_0_44px_rgba(106,106,224,.85)]">
              Se connecter
            </Link>
          </div>
        </nav>

        {/* ===== HERO ===== */}
        <section id="fonctionnement" className="grid grid-cols-[1.02fr_.98fr] items-center gap-12 pb-10 pt-14 max-lg:grid-cols-1">
          <div data-reveal="left">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#8b8bf0]/35 bg-[#8b8bf0]/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[.16em] text-[#5b5bd6] shadow-[inset_0_0_24px_rgba(106,106,224,.18)] dark:text-[#a5a5f5]">
              <i className="block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
              Passerelle SMS auto-hébergée · v2.4
            </span>
            <h1 className="mt-[22px] text-[clamp(40px,4.9vw,64px)] font-extrabold leading-[1.06] tracking-[-.03em] text-slate-900 dark:text-white">
              Vos téléphones,
              <br />
              deviennent votre{" "}
              <span className="animate-[sheen_6s_linear_infinite] bg-gradient-to-r from-[#5b5bd6] via-purple-500 to-cyan-500 bg-clip-text text-transparent [background-size:200%_auto] dark:from-[#8b8bf0] dark:via-purple-400 dark:to-cyan-400">
                passerelle SMS
              </span>
              <br />
              <span className="text-transparent [-webkit-text-stroke:1.5px_#5b5bd6] dark:[-webkit-text-stroke:1.5px_rgba(230,228,255,.85)]">— sans abonnement.</span>
            </h1>
            <p className="mt-5 max-w-[500px] text-[16px] leading-[1.75] text-slate-500 dark:text-[#9c9ac4]">
              Transformez vos Android en relais d'envoi : <b className="font-semibold text-slate-900 dark:text-[#e6e4ff]">cartes SIM locales</b>,
              quotas anti-blocage, file d'attente intelligente,{" "}
              <b className="font-semibold text-slate-900 dark:text-[#e6e4ff]">API REST & webhooks</b> — supervisés en temps réel depuis votre console.
            </p>
            <div className="mt-[30px] flex flex-wrap gap-3.5" data-reveal style={{ "--reveal-delay": "150ms" } as CSSProperties}>
              <Magnetic>
                <Link href="/login" className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-[14px] bg-gradient-to-br from-[#6a6ae0] to-[#4c4cc9] px-[30px] py-4 text-[15px] font-bold text-white shadow-[0_10px_34px_rgba(91,91,214,.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_44px_rgba(91,91,214,.65)]">
                  <span className="absolute left-[-80%] top-0 h-full w-1/2 -skew-x-12 animate-[shine_3.2s_infinite] bg-gradient-to-r from-transparent via-white/35 to-transparent" />
                  Accéder au dashboard <I d={IC.arrow} size={15} />
                </Link>
              </Magnetic>
              <Magnetic strength={0.25}>
                <Link href="/demande-acces" className="inline-flex items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-6 py-4 text-[14px] font-semibold text-slate-700 shadow-sm backdrop-blur transition-colors hover:border-[#8b8bf0]/65 hover:bg-[#8b8bf0]/10 dark:border-white/15 dark:bg-white/[.04] dark:text-[#e6e4ff]">
                  Demander l'accès API
                </Link>
              </Magnetic>
            </div>
            <div className="mt-[34px] flex flex-wrap gap-[26px]">
              {["Aucune carte bancaire requise", "Déploiement en 5 minutes", "Hébergé à Madagascar"].map((m) => (
                <span key={m} className="flex items-center gap-2 text-[12.5px] text-slate-500 dark:text-[#9c9ac4]">
                  <I d={IC.check} size={14} className="text-emerald-500" /> {m}
                </span>
              ))}
            </div>
          </div>

          {/* Visuel : photo SMS gateway avec effet Tilt 3D */}
          <div data-reveal="right" style={{ "--reveal-delay": "200ms" } as CSSProperties}>
            <Tilt max={8}>
              <div className="absolute -inset-[30px] z-0 animate-[glowpulse_5s_ease-in-out_infinite] rounded-[36px] bg-gradient-to-br from-[#6a6ae0]/50 via-purple-500/30 to-cyan-400/30 opacity-65 blur-[38px]" />
              <div className="tilt-inner relative z-[1] overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_40px_100px_rgba(0,0,0,.25)] dark:border-white/15 dark:bg-transparent dark:shadow-[0_40px_100px_rgba(0,0,0,.6)]">
                <Image src="/landing/gateway-photo.png" alt="SMS Gateway — téléphone Android et cartes SIM"
                  width={1280} height={960} priority className="w-full" />
                <span className="pointer-events-none absolute inset-0 [background-size:100%_100%]" style={{ background: "linear-gradient(160deg,rgba(255,255,255,.12),transparent 35%)" }} />
              </div>
              <div className="absolute right-4 top-4 z-[2] flex animate-[floaty_6s_ease-in-out_infinite] items-center gap-2 rounded-[14px] border border-[#8b8bf0]/40 bg-[#0d0b26]/80 px-3.5 py-2.5 text-[12px] font-semibold text-[#e6e4ff] shadow-[0_12px_34px_rgba(0,0,0,.5)] backdrop-blur">
                <span className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-300">
                  <I d={IC.check} size={13} />
                </span>
                SMS remis · 18,3 s
              </div>
              <div className="absolute bottom-4 left-4 z-[2] flex animate-[floaty_7s_ease-in-out_infinite_reverse] items-center gap-2 rounded-[14px] border border-[#8b8bf0]/40 bg-[#0d0b26]/80 px-3.5 py-2.5 text-[12px] font-semibold text-[#e6e4ff] shadow-[0_12px_34px_rgba(0,0,0,.5)] backdrop-blur">
                <span className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-[#6a6ae0]/20 text-[#a5a5f5]">
                  <I d={IC.zap} size={13} />
                </span>
                20 SMS/h · quota respecté
              </div>
            </Tilt>
          </div>
        </section>
      </div>

      {/* ===== MARQUEE ===== */}
      <div className="relative z-[2] mx-auto mt-[26px] overflow-hidden border-y border-slate-200 bg-white/60 py-[18px] [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)] dark:border-white/10 dark:bg-transparent" data-reveal>
        <div className="marquee-piste flex w-max">
          {[...marqueeItems, ...marqueeItems].map((o, i) => (
            <span key={i} className="mx-7 flex items-center gap-2.5 whitespace-nowrap text-[14px] font-bold tracking-wide text-slate-400 dark:text-[#6f6d99]">
              <i className="block h-[7px] w-[7px] rounded-full bg-[#4c4cc9] shadow-[0_0_12px_#4c4cc9]" />{o}
            </span>
          ))}
        </div>
      </div>

      <div className="relative z-[2] mx-auto max-w-[1200px] px-8">
        {/* ===== BENTO ===== */}
        <section id="fonctionnalites" className="pb-5 pt-[84px]" data-reveal="zoom">
          <span className="bg-gradient-to-r from-[#5b5bd6] to-cyan-500 bg-clip-text text-[11px] font-extrabold uppercase tracking-[.22em] text-transparent dark:from-[#8b8bf0] dark:to-cyan-400">
            Fonctionnalités
          </span>
          <h2 className="mt-3 text-[clamp(28px,3.4vw,42px)] font-extrabold leading-[1.12] tracking-[-.02em] text-slate-900 dark:text-white">
            Une infrastructure complète,<br />dans votre poche.
          </h2>
          <div className="mt-11 grid grid-cols-4 gap-4 max-lg:grid-cols-2">
            {bento.map((b, i) => (
              <div key={b.title} data-reveal style={{ "--reveal-delay": `${i * 90}ms` } as CSSProperties}
                className={`bcard group relative overflow-hidden rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-[5px] hover:border-[#8b8bf0]/55 hover:shadow-[0_18px_50px_rgba(76,76,201,.28)] dark:border-white/10 dark:bg-white/[.035] dark:shadow-none ${b.span === 2 ? "col-span-2" : ""}`}>
                {/* spotlight */}
                <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: "radial-gradient(420px circle at var(--mx,50%) var(--my,0%),rgba(139,139,240,.14),transparent 65%)" }} />
                <div className={`mb-4 flex h-[42px] w-[42px] items-center justify-center rounded-xl ${b.chip === "bi-indigo" ? "border border-[#8b8bf0]/35 bg-[#6a6ae0]/15 text-[#5b5bd6] dark:text-[#a5a5f5]" : b.chip === "bi-green" ? "border border-emerald-300/50 bg-emerald-400/10 text-emerald-600 dark:border-emerald-300/30 dark:text-emerald-300" : b.chip === "bi-cyan" ? "border border-cyan-300/50 bg-cyan-400/10 text-cyan-600 dark:border-cyan-300/30 dark:text-cyan-300" : "border border-purple-300/50 bg-purple-500/10 text-purple-600 dark:border-purple-300/30 dark:text-purple-300"}`}>
                  <I d={b.icon} size={19} />
                </div>
                <h3 className="text-[16.5px] font-bold tracking-tight text-slate-900 dark:text-white">{b.title}</h3>
                <p className="mt-2 text-[13px] leading-[1.65] text-slate-500 dark:text-[#9c9ac4]">{b.text}</p>
                {b.demo && <div className="mt-4">{b.demo}</div>}
                {b.typewriterLines && (
                  <MachineAEcrire
                    lines={b.typewriterLines}
                    loop
                    className="mt-4 rounded-xl bg-slate-900 p-3 font-mono text-[11px] text-indigo-200 border border-slate-700 dark:bg-black/40 dark:border-indigo-500/20"
                  />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ===== STATS ===== */}
        <section className="pb-5 pt-14" data-reveal>
          <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2">
            {stats.map((s, i) => {
              const m = s.n.match(/^([\d,]+)\s*(.*)$/)
              const num = m ? parseFloat(m[1].replace(',', '.')) : 0
              const dec = m && m[1].includes(',') ? 1 : 0
              const suffix = m ? ` ${m[2]}`.trimEnd() : ''
              return (
                <div key={s.l} data-reveal="zoom" style={{ "--reveal-delay": `${i * 110}ms` } as CSSProperties}
                  className="rounded-[20px] border border-slate-200 bg-white px-4 py-7 text-center shadow-sm transition-all hover:border-[#8b8bf0]/50 hover:shadow-[0_14px_40px_rgba(76,76,201,.22)] dark:border-white/10 dark:bg-white/[.035] dark:shadow-none">
                  <CompteurAnime
                    end={num}
                    decimals={dec}
                    suffix={suffix.startsWith(' ') || suffix === '' ? suffix : ` ${suffix}`}
                    className="stat-number bg-gradient-to-r from-slate-900 to-[#5b5bd6] bg-clip-text text-[36px] font-extrabold tracking-tight text-transparent dark:from-white dark:to-[#a5a5f5]"
                  />
                  <div className="mt-1.5 text-[12px] text-slate-500 dark:text-[#9c9ac4]">{s.l}</div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className="cta-animated-border relative my-[84px] overflow-hidden rounded-[28px] border border-[#8b8bf0]/35 bg-[linear-gradient(135deg,rgba(76,76,201,.16),rgba(76,76,201,.06)_55%,rgba(168,85,247,.12))] px-12 py-16 text-center dark:bg-[linear-gradient(135deg,rgba(76,76,201,.32),rgba(13,11,38,.85)_55%,rgba(168,85,247,.22))]" data-reveal="zoom">
          <div className="absolute left-1/2 top-[-260px] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#6a6ae0]/25 blur-[110px] dark:bg-[#6a6ae0]/35" />
          <h2 className="relative text-[clamp(28px,3.6vw,44px)] font-extrabold tracking-[-.02em] text-slate-900 dark:text-white">Prêt à envoyer votre premier SMS ?</h2>
          <p className="relative mt-3.5 text-[15px] text-slate-500 dark:text-[#9c9ac4]">
            Installez l'application, scannez le QR de votre console, et votre passerelle est en ligne.
          </p>
          <div className="relative mt-[30px] flex justify-center">
            <Link href="/login" className="cta-animated-border group relative inline-flex items-center gap-2.5 overflow-hidden rounded-[14px] bg-gradient-to-br from-[#6a6ae0] to-[#4c4cc9] px-[30px] py-4 text-[15px] font-bold text-white shadow-[0_10px_34px_rgba(91,91,214,.5)] transition-all hover:-translate-y-0.5">
              <span className="absolute left-[-80%] top-0 h-full w-1/2 -skew-x-12 animate-[shine_3.2s_infinite] bg-gradient-to-r from-transparent via-white/35 to-transparent" />
              Créer mon espace gratuit <I d={IC.arrow} size={15} />
            </Link>
          </div>
        </section>

        {/* ===== FOOTER ===== */}
        <footer className="flex items-center gap-6 border-t border-slate-200 py-7 pb-10 text-[12.5px] text-slate-400 dark:border-white/10 dark:text-[#6f6d99] max-sm:flex-col" data-reveal>
          <span>© 2026 SMSIKA Gateway</span>
          <div className="ml-auto flex gap-5 max-sm:ml-0">
            <Link href="/espace/api" className="transition-colors hover:text-[#5b5bd6] dark:hover:text-[#c7c5ff]">Documentation</Link>
            <Link href="/espace/api" className="transition-colors hover:text-[#5b5bd6] dark:hover:text-[#c7c5ff]">Guide API</Link>
            <a href="mailto:support@smsika.app" className="transition-colors hover:text-[#5b5bd6] dark:hover:text-[#c7c5ff]">Support</a>
            <a href="/api/health" target="_blank" rel="noreferrer" className="transition-colors hover:text-[#5b5bd6] dark:hover:text-[#c7c5ff]">État des services</a>
          </div>
        </footer>
      </div>

      {/* ===== Keyframes globaux ===== */}
      <style jsx global>{`
        @keyframes drift1 { from { transform: translate(0,0) scale(1);} to { transform: translate(60px,40px) scale(1.12);} }
        @keyframes drift2 { from { transform: translate(0,0) scale(1);} to { transform: translate(-50px,30px) scale(1.1);} }
        @keyframes sheen { to { background-position: 200% center; } }
        @keyframes shine { 0% { left: -80%; } 55%, 100% { left: 130%; } }
        @keyframes floaty { 0%,100% { transform: translateY(0);} 50% { transform: translateY(-9px);} }
        @keyframes glowpulse { 0%,100% { opacity: .5;} 50% { opacity: .85;} }
        @keyframes scrollX { to { transform: translateX(-50%);} }
      `}</style>
    </div>
  );
}
