import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — SMSTSIKA',
  description:
    'Comment SMSTSIKA collecte, utilise et protège vos données : compte, appareils, messages, cookies et vos droits.',
}

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-sans text-xl font-extrabold tracking-tight text-[#1C1917]">{titre}</h2>
      <div className="space-y-3 font-sans text-[14.5px] leading-relaxed text-stone-600">{children}</div>
    </section>
  )
}

export default function PageConfidentialite() {
  return (
    <div className="min-h-screen bg-white font-sans text-[#1C1917] antialiased selection:bg-[#2563EB] selection:text-white">
      <main className="mx-auto max-w-3xl space-y-10 px-6 py-14 lg:px-8">
        <div>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1D4ED8] hover:underline">
            <ArrowLeft className="h-4 w-4" /> Retour à l’accueil
          </Link>
          <p className="mt-6 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#1D4ED8]">VOS DONNÉES RESTENT CHEZ VOUS</p>
          <h1 className="mt-3 font-sans text-4xl font-extrabold tracking-tight sm:text-5xl">
            Politique de confidentialité
          </h1>
          <p className="mt-4 font-mono text-[11.5px] text-stone-500">Dernière mise à jour : octobre 2026.</p>
        </div>

        <Bloc titre="1. Principe">
          <p>
            SMSTSIKA est autohébergé : vos messages partent de vos téléphones, avec vos
            cartes SIM. Nous ne revendons ni ne louons aucune donnée. Seules les
            informations strictement nécessaires au fonctionnement du compte sont
            conservées. Responsable du traitement :{' '}
            <strong className="font-bold text-[#1C1917]">[Nom de l’éditeur — voir mentions légales]</strong>.
          </p>
        </Bloc>

        <Bloc titre="2. Données que nous collectons">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="font-bold text-[#1C1917]">Compte :</strong> prénom, nom ou
              société, adresse e-mail et mot de passe (l’authentification est assurée par
              notre prestataire Supabase ; nous ne conservons jamais vos mots de passe en clair).
            </li>
            <li>
              <strong className="font-bold text-[#1C1917]">Connexion Google (si utilisée) :</strong>{' '}
              adresse e-mail et informations de profil transmises par Google, uniquement pour
              vous identifier.
            </li>
            <li>
              <strong className="font-bold text-[#1C1917]">Appareils :</strong> identifiants
              techniques de vos téléphones (modèle, identifiant Android) et clés d’API
              nécessaires au routage de vos envois.
            </li>
            <li>
              <strong className="font-bold text-[#1C1917]">Envois :</strong> numéros
              destinataires, contenus et statuts de vos tâches d’envoi, pour le suivi et
              l’historique de votre console.
            </li>
          </ul>
          <p>
            Le contenu de vos messages transite par votre propre infrastructure et vos
            opérateurs : il n’est jamais exploité à des fins publicitaires.
          </p>
        </Bloc>

        <Bloc titre="3. Prestataires techniques">
          <p>
            Vos données peuvent transiter par nos prestataires, uniquement pour faire
            fonctionner le Service : Supabase (authentification et base de données),
            Google (anti-robot reCAPTCHA et connexion Google) et Vercel (hébergement de
            l’instance officielle). Aucun traceur publicitaire, aucune revente à des régies.
          </p>
        </Bloc>

        <Bloc titre="4. Cookies et traceurs">
          <p>
            Seuls des traceurs strictement techniques sont utilisés : session de connexion,
            préférence d’affichage, protection anti-robot. Aucun cookie publicitaire,
            aucune mesure d’audience revendue à des tiers.
          </p>
        </Bloc>

        <Bloc titre="5. Conservation">
          <p>
            Vos données sont conservées tant que votre espace est actif, puis supprimées
            ou anonymisées dans un délai de{' '}
            <strong className="font-bold text-[#1C1917]">[durée — à compléter, ex. 12 mois]</strong>{' '}
            après la fermeture du compte. Les historiques d’envoi suivent la durée
            nécessaire au suivi et à la facturation de votre propre usage.
          </p>
        </Bloc>

        <Bloc titre="6. Vos droits">
          <p>
            Vous disposez des droits d’accès, de rectification, de suppression, de
            portabilité, de limitation et d’opposition sur vos données. Pour les exercer,
            écrivez à <a href="mailto:support@smsika.app" className="font-bold text-[#1D4ED8] hover:underline">support@smsika.app</a> en
            précisant l’adresse e-mail de votre compte. Vous pouvez également adresser une
            réclamation à l’autorité de protection des données compétente dans votre juridiction.
          </p>
        </Bloc>
      </main>
    </div>
  )
}
