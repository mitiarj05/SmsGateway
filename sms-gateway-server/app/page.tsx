'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Smartphone, Server, BarChart3, ShieldCheck,
  Zap, ArrowRight, CheckCircle2, Bell, Inbox, KeyRound, BellOff, Moon, Sun,
} from 'lucide-react'
import { useTheme } from '../lib/use-theme'

export default function PageAccueil() {
  const { modeSombre, monte, basculerTheme } = useTheme()
  const [stats, setStats] = useState({ smsEnvoyes: 0, appareilsEnLigne: 0 })

  useEffect(() => {
    fetch('/api/stats-public')
      .then((r) => r.json())
      .then((d) => {
        if (typeof d?.smsEnvoyes === 'number') {
          setStats({ smsEnvoyes: d.smsEnvoyes, appareilsEnLigne: d.appareilsEnLigne ?? 0 })
        }
      })
      .catch(() => null)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-[#0B0F19] dark:text-zinc-100 font-sans antialiased transition-colors">
      {/* ================= NAVIGATION ================= */}
      <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-8 border-b border-slate-200/80 dark:border-zinc-800/60">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/smsika.png" alt="SMSIKA" width={40} height={40} className="rounded-xl shrink-0" />
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">SMSIKA</span>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Console SMS
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 text-xs font-semibold text-slate-600 dark:text-zinc-400 md:flex">
          <a href="#fonctionnement" className="hover:text-slate-900 dark:hover:text-white transition">Fonctionnement</a>
          <a href="#fonctionnalites" className="hover:text-slate-900 dark:hover:text-white transition">Fonctionnalités</a>
          <a href="#confiance" className="hover:text-slate-900 dark:hover:text-white transition">Confiance</a>
          <a href="#faq" className="hover:text-slate-900 dark:hover:text-white transition">FAQ</a>
        </nav>

        <div className="flex items-center gap-3">
          {/* Basculeur de thème */}
          <button
            onClick={basculerTheme}
            title={!monte ? 'Thème' : modeSombre ? 'Mode clair' : 'Mode sombre'}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 shadow-sm hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
          >
            {!monte || !modeSombre ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>

          <Link
            href="/login?onglet=client"
            className="hidden sm:inline-flex rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white transition shadow-sm"
          >
            Espace Client
          </Link>
          <Link
            href="/login"
            className="inline-flex rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            Se connecter
          </Link>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        {/* Halos lumineux */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-8 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 px-3.5 py-1 text-xs font-bold dark:text-blue-400">
              <Zap className="h-3.5 w-3.5" /> PASSERELLE SMS AUTOHÉBERGÉE
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl leading-[1.15]">
              Vos téléphones,
              <br />
              votre <span className="text-blue-600 dark:text-blue-500">passerelle SMS</span>
              <br />— sans abonnement !
            </h1>
            <p className="mt-6 max-w-xl text-sm sm:text-base leading-relaxed text-slate-600 dark:text-zinc-400">
              Connectez vos téléphones Android et envoyez vos SMS directement via vos propres cartes SIM.
              Sans abonnement, avec quotas anti-blocage, file d'attente intelligente et supervision temps réel.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 transition"
              >
                Accéder au dashboard <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/demande-acces"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-xs font-bold text-slate-800 hover:bg-slate-50 dark:border-zinc-800 dark:bg-[#131926] dark:text-zinc-200 dark:hover:bg-zinc-800 transition shadow-sm"
              >
                Demander l'accès API
              </Link>
            </div>

            <p className="mt-6 text-xs text-slate-500 dark:text-zinc-500">
              Déjà client ?{' '}
              <Link href="/login?onglet=client" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                Accédez à votre espace client →
              </Link>
            </p>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-slate-200/80 dark:border-zinc-800/80 pt-8">
              {(stats.smsEnvoyes >= 100
                ? [
                    { valeur: `${stats.smsEnvoyes}`, etiquette: 'SMS envoyés' },
                    { valeur: `${stats.appareilsEnLigne}`, etiquette: 'Appareils en ligne' },
                    { valeur: '0 Ar', etiquette: "D'abonnement" },
                  ]
                : [
                    { valeur: 'Multi-SIM', etiquette: 'Gestion parallèle' },
                    { valeur: 'Push FCM', etiquette: 'Temps réel instantané' },
                    { valeur: '0 Ar', etiquette: "D'abonnement SMSIKA" },
                  ]
              ).map((stat) => (
                <div key={stat.etiquette}>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.valeur}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">{stat.etiquette}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Visuel Dashboard Mockup */}
          <div className="relative hidden lg:block">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-[#131926] dark:shadow-2xl dark:shadow-blue-950/50">
              <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-zinc-800/80">
                <div className="flex items-center gap-3">
                  <Image src="/smsika.png" alt="SMSIKA" width={32} height={32} className="rounded-xl shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">SMSIKA</p>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-400">Panneau de contrôle</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Systèmes opérationnels
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { valeur: '128', etiquette: 'SMS envoyés' },
                  { valeur: '0', etiquette: 'En file' },
                  { valeur: '18/50', etiquette: 'Quota SMS/h' },
                ].map((kpi) => (
                  <div key={kpi.etiquette} className="rounded-xl bg-slate-50 p-3 border border-slate-100 dark:bg-[#0B0F19] dark:border-zinc-800/60">
                    <p className="text-base font-bold text-slate-900 dark:text-white">{kpi.valeur}</p>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-500">{kpi.etiquette}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4 border border-slate-100 dark:bg-[#0B0F19] dark:border-zinc-800/60 text-xs">
                {[
                  { icone: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />, texte: '+261 34 05 123 45 · Envoyé (Infinix X680C)' },
                  { icone: <Inbox className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />, texte: '+261 33 12 987 65 · Réponse reçue "Start"' },
                  { icone: <Bell className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />, texte: 'Push FCM distribué instantanément' },
                ].map((item) => (
                  <div key={item.texte} className="flex items-center gap-2.5 text-slate-700 dark:text-zinc-300">
                    {item.icone} <span>{item.texte}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= COMMENT ÇA MARCHE ================= */}
      <section id="fonctionnement" className="border-t border-slate-200/80 bg-slate-100/50 dark:border-zinc-800/80 dark:bg-[#0B0F19] py-20">
        <div className="mx-auto max-w-7xl px-8">
          <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Comment ça marche</h2>
          <p className="mt-2 text-center text-xs text-slate-500 dark:text-zinc-400">Trois piliers simples pour un système fiable et autonome.</p>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { icone: <Server className="h-5 w-5" />, titre: '1. Votre serveur', description: 'Reçoit les demandes via une API REST sécurisée, gère la file d’attente, les quotas et l’historique.' },
              { icone: <Smartphone className="h-5 w-5" />, titre: '2. Vos téléphones Android', description: 'Gèrent l’envoi direct via leurs cartes SIM en arrière-plan grâce aux notifications push FCM.' },
              { icone: <BarChart3 className="h-5 w-5" />, titre: '3. Votre dashboard', description: 'Supervisez vos appareils en ligne, contrôlez les tâches, configurez vos webhooks et suivez l’activité.' },
            ].map((carte) => (
              <div key={carte.titre} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#131926]">
                <div className="mb-4 inline-flex rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-600/15 dark:text-blue-400">{carte.icone}</div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{carte.titre}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-zinc-400">{carte.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FONCTIONNALITÉS ================= */}
      <section id="fonctionnalites" className="py-20 border-t border-slate-200/80 dark:border-zinc-800/80">
        <div className="mx-auto max-w-7xl px-8">
          <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Pensé pour la fiabilité</h2>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              { icone: <Zap className="h-5 w-5" />, titre: 'Notifications push FCM', description: 'Trigger réactif réveillant le service d’arrière-plan des téléphones même écran éteint.' },
              { icone: <ShieldCheck className="h-5 w-5" />, titre: 'Anti-double envoi', description: 'Identifiants uniques et accusés idempotents empêchant toute réémission en double.' },
              { icone: <Smartphone className="h-5 w-5" />, titre: 'Multi-appareils & Multi-SIM', description: 'Répartition automatique de la charge avec quotas horaires configurables par SIM.' },
              { icone: <CheckCircle2 className="h-5 w-5" />, titre: 'Résilient aux coupures', description: 'Reprise automatique après perte de réseau, redémarrage du téléphone ou coupure internet.' },
            ].map((f) => (
              <div key={f.titre} className="flex gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#131926]">
                <div className="h-fit rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-600/15 dark:text-blue-400 shrink-0">{f.icone}</div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{f.titre}</h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CONFIANCE ================= */}
      <section id="confiance" className="border-t border-slate-200/80 bg-slate-100/50 dark:border-zinc-800/80 dark:bg-[#0B0F19] py-20">
        <div className="mx-auto max-w-7xl px-8">
          <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Sécurité et contrôle</h2>
          <p className="mt-2 text-center text-xs text-slate-500 dark:text-zinc-400">Vos données restent sous votre contrôle absolu.</p>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              { icone: <ShieldCheck className="h-5 w-5" />, titre: 'Données maîtrisées', description: 'Vos téléphones et votre base dédiée. Aucun intermédiaire n’accède à vos messages.' },
              { icone: <KeyRound className="h-5 w-5" />, titre: 'Clés API & Webhooks', description: 'Clés d’accès révocables, signatures HMAC-SHA256 pour les notifications Webhooks.' },
              { icone: <BellOff className="h-5 w-5" />, titre: 'Gestion STOP / START', description: 'Traitement automatique des désinscriptions conformément à la réglementation.' },
              { icone: <CheckCircle2 className="h-5 w-5" />, titre: 'Isolation des clients', description: 'Espace client dédié avec clés API séparées et suivi de facturation.' },
            ].map((item) => (
              <div key={item.titre} className="flex gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#131926]">
                <div className="h-fit rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-600/15 dark:text-blue-400 shrink-0">{item.icone}</div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{item.titre}</h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section id="faq" className="border-t border-slate-200/80 dark:border-zinc-800/80 py-20">
        <div className="mx-auto max-w-3xl px-8">
          <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Questions fréquentes</h2>
          <div className="mt-10 space-y-4">
            {[
              {
                question: 'Faut-il être sur le même réseau WiFi ?',
                reponse: 'Non. Le serveur et les téléphones communiquent via internet (4G/5G ou WiFi) via Firebase Cloud Messaging.',
              },
              {
                question: 'Combien coûte l\'utilisation de SMSIKA ?',
                reponse: 'SMSIKA ne prend aucun frais d\'abonnement. Seul le forfait de votre carte SIM auprès de votre opérateur est consommé.',
              },
              {
                question: 'Que se passe-t-il si un téléphone perd sa connexion ?',
                reponse: 'Les tâches restent sécurisées en file d\'attente sur le serveur et sont traitées dès le retour en ligne.',
              },
            ].map((faq) => (
              <div key={faq.question} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#131926]">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">{faq.question}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-zinc-400">{faq.reponse}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA FINAL ================= */}
      <section className="border-t border-slate-200/80 dark:border-zinc-800/80 py-16 text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Prêt à déployer votre passerelle ?</h2>
        <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">Accédez au panneau de contrôle ou effectuez une demande d'accès API.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition"
          >
            Accéder au dashboard <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/demande-acces"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-zinc-800 dark:bg-[#131926] dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
          >
            Demander l'accès API
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200/80 dark:border-zinc-800/80 py-8 text-center text-xs text-slate-500 dark:text-zinc-500">
        © 2026 SMSIKA — Passerelle SMS autohébergée
        {' · '}
        <Link href="/login?onglet=client" className="text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white">Espace client</Link>
        {' · '}
        <Link href="/demande-acces" className="text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white">Demander l'accès</Link>
      </footer>
    </div>
  )
}
