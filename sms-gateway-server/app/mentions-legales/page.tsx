import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Mentions légales — SMSTSIKA',
  description:
    'Mentions légales du service SMSTSIKA : éditeur, hébergement, propriété intellectuelle et responsabilités.',
}

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-sans text-xl font-extrabold tracking-tight text-[#1C1917]">{titre}</h2>
      <div className="space-y-3 font-sans text-[14.5px] leading-relaxed text-stone-600">{children}</div>
    </section>
  )
}

export default function PageMentionsLegales() {
  return (
    <div className="min-h-screen bg-white font-sans text-[#1C1917] antialiased selection:bg-[#2563EB] selection:text-white">
      <main className="mx-auto max-w-3xl space-y-10 px-6 py-14 lg:px-8">
        <div>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1D4ED8] hover:underline">
            <ArrowLeft className="h-4 w-4" /> Retour à l’accueil
          </Link>
          <p className="mt-6 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#1D4ED8]">EN TOUTE TRANSPARENCE</p>
          <h1 className="mt-3 font-sans text-4xl font-extrabold tracking-tight sm:text-5xl">
            Mentions légales
          </h1>
          <p className="mt-4 font-mono text-[11.5px] text-stone-500">Dernière mise à jour : octobre 2026.</p>
        </div>

        <Bloc titre="1. Éditeur du service">
          <p>
            Le service SMSTSIKA (ci-après « le Service ») est édité par{' '}
            <strong className="font-bold text-[#1C1917]">[Nom de l’éditeur — à compléter]</strong>,{' '}
            <strong className="font-bold text-[#1C1917]">[statut juridique — à compléter]</strong>, domicilié au{' '}
            <strong className="font-bold text-[#1C1917]">[adresse — à compléter]</strong>
            {' '}(SIRET : <strong className="font-bold text-[#1C1917]">[à compléter]</strong>).
          </p>
          <p>
            Contact : <a href="mailto:support@smsika.app" className="font-bold text-[#1D4ED8] hover:underline">support@smsika.app</a>.
            Tant que ces informations ne sont pas renseignées, ce service est fourni à titre expérimental.
          </p>
        </Bloc>

        <Bloc titre="2. Objet du service">
          <p>
            SMSTSIKA est une passerelle SMS autohébergée : elle relie une console web à des
            téléphones Android fournis par l’utilisateur. Les SMS sont envoyés depuis les
            propres cartes SIM et forfaits de l’utilisateur, via ses propres appareils.
            Le Service ne vend ni ne loue de crédits SMS et ne facture aucun abonnement :
            le coût des envois dépend exclusivement des opérateurs des cartes SIM utilisées.
          </p>
        </Bloc>

        <Bloc titre="3. Hébergement">
          <p>
            L’instance officielle du Service est hébergée par Vercel Inc. (340 S Lemon Ave,
            Walnut, CA 91789, États-Unis). Le logiciel étant conçu pour l’autohébergement,
            l’utilisateur peut également déployer sa propre instance sur l’infrastructure
            de son choix : dans ce cas, il est seul responsable de cet hébergement.
          </p>
        </Bloc>

        <Bloc titre="4. Propriété intellectuelle">
          <p>
            Le nom, le logo et l’interface SMSTSIKA sont protégés. Toute reproduction sans
            autorisation préalable est interdite. Les contenus envoyés par les utilisateurs
            (messages, listes de contacts) leur appartiennent.
          </p>
        </Bloc>

        <Bloc titre="5. Responsabilité sur les messages envoyés">
          <p>
            L’utilisateur est seul responsable du contenu des messages envoyés depuis ses
            appareils et du respect des réglementations applicables (consentement des
            destinataires, lutte contre le spam, obligations locales des opérateurs).
            SMSTSIKA met à disposition un outil technique et ne saurait être tenu
            responsable d’un usage non conforme.
          </p>
        </Bloc>

        <Bloc titre="6. Données personnelles">
          <p>
            Le traitement des données personnelles est décrit dans notre{' '}
            <Link href="/confidentialite" className="font-bold text-[#1D4ED8] hover:underline">
              politique de confidentialité
            </Link>
            .
          </p>
        </Bloc>
      </main>
    </div>
  )
}
