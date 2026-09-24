import Link from 'next/link'
import Image from 'next/image'
import {
  MessageSquare, Smartphone, Server, BarChart3, ShieldCheck,
  Zap, ArrowRight, CheckCircle2, Bell, Inbox,
} from 'lucide-react'

export default function PageAccueil() {
  return (
    <div className="min-h-screen bg-[#08122E] text-white">
      {/* ================= NAVIGATION ================= */}
      <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/smsika.png" alt="SMSIKA" width={40} height={40} className="rounded-xl" />
          <span className="text-lg font-bold">SMSIKA</span>
        </Link>
        <nav className="hidden items-center gap-10 text-sm text-slate-300 md:flex">
          <a href="#fonctionnement" className="hover:text-white">Fonctionnement</a>
          <a href="#fonctionnalites" className="hover:text-white">Fonctionnalités</a>
          <a href="#faq" className="hover:text-white">FAQ</a>
          <Link href="/send" className="rounded-full border border-blue-400/40 bg-blue-500/10 px-4 py-1.5 font-medium text-blue-300 hover:bg-blue-500/20">
            Envoyer un SMS
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login"
            className="rounded-lg border border-slate-500/50 px-4 py-2 text-sm text-slate-200 hover:bg-white/5">
            Se connecter
          </Link>
          <Link href="/dashboard"
            className="rounded-lg bg-white px-5 py-2 text-sm font-bold text-blue-700 hover:bg-slate-100">
            Dashboard
          </Link>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden">
        {/* halos décoratifs */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 py-20 lg:grid-cols-2">
          <div>
            <span className="inline-block rounded-full border border-blue-400/40 bg-blue-500/10 px-4 py-1.5 text-xs font-medium tracking-widest text-blue-300">
              PASSERELLE SMS AUTOHÉBERGÉE
            </span>
            <h1 className="mt-6 text-5xl font-bold leading-tight xl:text-6xl">
              Vos téléphones,
              <br />
              votre{' '}
              <span className="relative text-blue-400">
                passerelle SMS
                <span className="absolute -bottom-1 left-0 h-1.5 w-full rounded bg-blue-500" />
              </span>
              <br />— sans abonnement !
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
              Connectez vos téléphones Android et envoyez des SMS via vos
              propres cartes SIM. Sans Twilio, sans abonnement — avec quotas
              anti-blocage, file intelligente et supervision temps réel.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/login"
                className="flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-blue-700 hover:bg-slate-100">
                Accéder au dashboard <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#fonctionnement"
                className="rounded-xl border border-slate-500/60 px-6 py-3.5 font-bold text-slate-200 hover:bg-white/5">
                Voir le fonctionnement
              </a>
            </div>
            <p className="mt-5 text-sm text-slate-400">
              Partenaire sans intégration ?{' '}
              <Link href="/send" className="font-semibold text-blue-300 hover:text-white hover:underline">
                Envoyez via le formulaire →
              </Link>
            </p>
            {/* stats */}
            <div className="mt-14 flex gap-14">
              {[
                { valeur: 'Multi', etiquette: 'Appareils en parallèle' },
                { valeur: 'FCM', etiquette: 'Déclenchement instantané' },
                { valeur: '0 Ar', etiquette: "D'abonnement (crédit SIM requis)" },
              ].map((stat) => (
                <div key={stat.etiquette}>
                  <p className="text-2xl font-bold">{stat.valeur}</p>
                  <p className="mt-1 text-sm text-slate-400">{stat.etiquette}</p>
                </div>
              ))}
            </div>
          </div>

          {/* visuel : maquette CSS du dashboard (aucune image requise) */}
          <div className="relative hidden lg:block">
            <div className="rounded-2xl border border-white/10 bg-[#0A1836] p-5 shadow-2xl shadow-blue-900/50">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg">
                  <Image src="/smsika.png" alt="SMSIKA" width={32} height={32} />
                </div>
                <div>
                    <p className="text-xs font-bold">SMSIKA</p>
                  <p className="text-[10px] text-slate-400">Panneau de contrôle</p>
                </div>
                <span className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> en ligne
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { valeur: '128', etiquette: 'envoyés' },
                  { valeur: '3', etiquette: 'en attente' },
                  { valeur: '18/50', etiquette: 'quota /h' },
                ].map((kpi) => (
                  <div key={kpi.etiquette} className="rounded-xl bg-white/5 p-3">
                    <p className="text-lg font-bold">{kpi.valeur}</p>
                    <p className="text-[10px] text-slate-400">{kpi.etiquette}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-2.5 rounded-xl bg-white/5 p-4">
                {[
                  { icone: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />, texte: '+261 34 05 123 45 · envoyé' },
                  { icone: <Inbox className="h-3.5 w-3.5 text-amber-400" />, texte: '+261 33 12 987 65 · en attente' },
                  { icone: <Bell className="h-3.5 w-3.5 text-blue-400" />, texte: 'push instantané · écran éteint' },
                ].map((ligne) => (
                  <div key={ligne.texte} className="flex items-center gap-2.5 text-xs text-slate-300">
                    {ligne.icone} {ligne.texte}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= COMMENT ÇA MARCHE ================= */}
      <section id="fonctionnement" className="border-t border-white/5 bg-[#0A1836] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-center text-3xl font-bold">Comment ça marche</h2>
          <p className="mt-3 text-center text-slate-400">Trois briques simples, un système complet.</p>
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { icone: <Server className="h-6 w-6" />, titre: '1. Votre serveur', description: 'Reçoit les demandes via une API REST sécurisée par clé, gère la file d\u2019attente, les quotas et l\u2019historique. C\u2019est le cerveau du système.' },
              { icone: <Smartphone className="h-6 w-6" />, titre: '2. Vos téléphones Android', description: 'Inscrits via Firebase Auth, actifs en arrière-plan. Chaque téléphone envoie via sa vraie carte SIM, même écran éteint.' },
              { icone: <BarChart3 className="h-6 w-6" />, titre: '3. Votre dashboard', description: 'Supervisez tout : appareils en ligne, SMS en attente, échecs, activité 24 h. Un clic pour envoyer un test.' },
            ].map((carte) => (
              <div key={carte.titre} className="rounded-2xl border border-white/10 bg-white/5 p-8 hover:border-blue-400/40">
                <div className="mb-4 inline-flex rounded-xl bg-blue-600/20 p-3 text-blue-400">{carte.icone}</div>
                <h3 className="text-lg font-bold">{carte.titre}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{carte.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FONCTIONNALITÉS ================= */}
      <section id="fonctionnalites" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-center text-3xl font-bold">Pensé pour la fiabilité</h2>
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              { icone: <Zap className="h-5 w-5" />, titre: 'Notifications push', description: 'Firebase Cloud Messaging réveille les téléphones instantanément quand une tâche arrive.' },
              { icone: <ShieldCheck className="h-5 w-5" />, titre: 'Anti-double envoi', description: 'Identifiants uniques et accusés idempotents : une re-délivrance ne provoque jamais deux SMS.' },
              { icone: <Smartphone className="h-5 w-5" />, titre: 'Multi-appareils', description: 'Répartition intelligente entre vos téléphones avec quota par SIM pour éviter le blocage opérateur.' },
              { icone: <CheckCircle2 className="h-5 w-5" />, titre: 'Résilient aux pannes', description: 'Coupure internet, SIM indisponible, redémarrage : le système reprend seul où il s\u2019était arrêté.' },
            ].map((fonctionnalite) => (
              <div key={fonctionnalite.titre} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="h-fit rounded-lg bg-blue-600/20 p-2.5 text-blue-400">{fonctionnalite.icone}</div>
                <div>
                  <h3 className="font-bold">{fonctionnalite.titre}</h3>
                  <p className="mt-1 text-sm text-slate-400">{fonctionnalite.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section id="faq" className="border-t border-white/5 bg-[#0A1836] py-24">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center text-3xl font-bold">Questions fréquentes</h2>
          <div className="mt-12 space-y-4">
            {[
              {
                question: 'Faut-il être sur le même WiFi ?',
                reponse: 'Non. Le serveur est en ligne et les téléphones communiquent via internet (4G ou WiFi) + notifications push. Ils peuvent être n\u2019importe où dans le monde.',
              },
              {
                question: 'Combien ça coûte ?',
                reponse: 'Aucun abonnement. Seul le crédit SMS de vos cartes SIM est consommé, au tarif de votre opérateur.',
              },
              {
                question: 'Que se passe-t-il si un téléphone est éteint ?',
                reponse: 'Les SMS restent en file d\u2019attente, puis expirent en échec après le délai configuré. Au retour du téléphone, il reprend les tâches restantes tout seul.',
              },
              {
                question: 'Comment ajouter un téléphone ?',
                reponse: 'Installez l\u2019app Android, renseignez l\u2019adresse du serveur et démarrez le service : il s\u2019inscrit via Firebase Auth et apparaît HORS_LIGNE, puis EN_LIGNE à la première scrutation.',
              },
            ].map((faq) => (
              <div key={faq.question} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h3 className="font-bold">{faq.question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{faq.reponse}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA FINAL ================= */}
      <section className="border-t border-white/5 py-20 text-center">
        <h2 className="text-3xl font-bold">Prêt à envoyer vos premiers SMS ?</h2>
        <p className="mt-3 text-slate-400">Installation en 10 minutes sur un téléphone dédié.</p>
        <Link href="/login"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 font-bold hover:bg-blue-700">
          Accéder au dashboard <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="mt-4 text-sm text-slate-400">
          ou envoyez directement via le{' '}
          <Link href="/send" className="font-semibold text-blue-300 hover:text-white hover:underline">
            formulaire partenaire
          </Link>
        </p>
      </section>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-500">
        © 2026 SMSIKA — Projet interne · Passerelle SMS autohébergée
        {' · '}
        <Link href="/send" className="text-slate-400 hover:text-white">Envoi partenaire</Link>
      </footer>
    </div>
  )
}
