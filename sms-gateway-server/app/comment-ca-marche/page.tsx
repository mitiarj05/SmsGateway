'use client'

import Link from 'next/link'
import Image from 'next/image'
import { KeyRound, Download, FileUp, FlaskConical, ArrowUpRight, ArrowRight } from 'lucide-react'
import { useReveal } from '../../lib/use-reveal'
import BarreProgressionDefilante from '../../composants/BarreProgressionDefilante'

const ETAPES = [
  {
    numero: '01',
    icone: KeyRound,
    titre: 'Créez votre espace',
    texte:
      "Demandez l'accès, nous validons, vous vous connectez. Votre espace contient déjà votre clé API — c'est elle que votre site présentera pour envoyer des SMS — et votre section Intégrations.",
    puces: ['Clé API personnelle, déjà générée', 'Section Intégrations avec bouton Tester'],
  },
  {
    numero: '02',
    icone: Download,
    titre: 'Téléchargez le récepteur',
    texte:
      "Dans votre espace → Intégrations → « Télécharger le récepteur ». Vous obtenez sms-recu.php, qui arrive déjà rempli : votre secret de signature est écrit dedans, vous n'avez jamais à le recopier ni même à le lire.",
    puces: ['Fichier PHP prêt pour n\u2019importe quel hébergement', 'Secret et réglages déjà inscrits dedans'],
  },
  {
    numero: '03',
    icone: FileUp,
    titre: 'Déposez le fichier, copiez son adresse',
    texte:
      'Téléversez le fichier sur votre hébergement, comme une image. Puis copiez son adresse complète — ex. https://votre-site.com/sms-recu.php — dans votre espace → Intégrations → URL, et enregistrez.',
    puces: ['Votre seule copie : l\u2019adresse du fichier', 'Enregistrer, et c\u2019est branché'],
  },
  {
    numero: '04',
    icone: FlaskConical,
    titre: 'Testez',
    texte:
      'Cliquez « Tester le lien » : le journal affiche « Livré » — la sonnette est branchée. Chaque SMS reçu par la passerelle arrive ensuite à votre fichier, dans la section « VOTRE ACTION », prête à remplir avec votre code (ex. marquer une commande payée).',
    puces: ['Test en un clic, journal des livraisons', 'Si le fichier fuit : re-téléchargez avec un nouveau secret'],
  },
]

export default function PageCommentCaMarche() {
  useReveal()
  return (
    <div className="min-h-screen bg-[#F7F5F0] font-sans text-[#1C1917] antialiased selection:bg-[#2563EB] selection:text-white">
      <BarreProgressionDefilante />

      <div className="sticky top-0 z-50 w-full border-b border-[#1C1917]/10 bg-[#F7F5F0]/90 backdrop-blur">
        <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="SMSTSIKA — accueil">
            <Image src="/icons/logoClair.png" alt="SMSTSIKA" width={160} height={38} className="h-9 w-auto" />
          </Link>
          <nav className="hidden items-center gap-7 text-[13.5px] font-medium text-stone-600 lg:flex">
            <Link href="/fonctionnalites" className="transition hover:text-[#1C1917]">Fonctionnalités</Link>
            <Link href="/comment-ca-marche" className="font-bold text-[#1C1917]">Brancher votre site</Link>
            <Link href="/cas-d-usage" className="transition hover:text-[#1C1917]">Cas d’usage</Link>
            <Link href="/faq" className="transition hover:text-[#1C1917]">FAQ</Link>
          </nav>
          <div className="flex items-center gap-5">
            <Link href="/login" className="hidden text-[13.5px] font-semibold text-stone-600 transition hover:text-[#1C1917] sm:block">
              Connexion
            </Link>
            <Link
              href="/demande-acces"
              className="group inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#1D4ED8]"
            >
              Créer un espace
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </header>
      </div>

      <main className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="max-w-2xl pb-12 pt-14">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#1D4ED8]">Guide d&apos;intégration</p>
          <h1 className="mt-3 font-sans text-4xl font-extrabold tracking-tight sm:text-5xl">
            Brancher votre site
          </h1>
          <p className="mt-4 font-sans text-[15px] leading-relaxed text-stone-600">
            Quatre gestes, dix minutes. Votre site — WooCommerce, Shopify, PrestaShop ou maison — apprend à
            envoyer des SMS avec une clé, et à recevoir les événements avec un fichier récepteur déjà rempli.
          </p>
        </div>

        <ol className="grid grid-cols-1 gap-10 pb-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
          {ETAPES.map((e) => (
            <li key={e.numero} data-reveal className="relative border-t-2 border-[#1C1917] pt-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[12px] font-bold text-[#1D4ED8]">{e.numero}</span>
                <e.icone className="h-5 w-5 text-stone-400" />
              </div>
              <h2 className="mt-3 font-sans text-lg font-extrabold tracking-tight">
                {e.titre}
              </h2>
              <p className="mt-2 font-sans text-[13.5px] leading-relaxed text-stone-600">
                {e.texte}
              </p>
              <ul className="mt-4 space-y-2">
                {e.puces.map((p) => (
                  <li key={p} className="flex items-start gap-2 font-mono text-[11px] font-semibold text-[#15803B]">
                    <span className="mt-0.5 shrink-0">✓</span> {p}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        {/* Envoyer un SMS : le contrat complet tient en quelques lignes */}
        <div data-reveal className="my-14">
          <h2 className="font-sans text-2xl font-extrabold tracking-tight">Et pour envoyer un SMS ?</h2>
          <p className="mt-2 max-w-2xl font-sans text-[13.5px] leading-relaxed text-stone-600">
            Une seule adresse et votre clé, passée dans le corps de l&apos;appel. Le téléphone réclame la tâche
            et émet le SMS ; vous suivez chaque envoi dans votre espace.
          </p>
          <pre className="mt-5 overflow-x-auto rounded-2xl bg-[#1C1917] p-6 font-mono text-[12.5px] leading-relaxed text-[#F7F5F0]">
{`POST https://smstsika.vercel.app/api/sms/send
Content-Type: application/json

{ "cle_api": "VOTRE_CLE_API",
  "to": "+26134…",
  "message": "Bonjour de la part de votre boutique !" }`}
          </pre>
        </div>

        {/* Reçu par le fichier récepteur : un seul exemple */}
        <div data-reveal className="my-14">
          <h2 className="font-sans text-2xl font-extrabold tracking-tight">Et quand le payeur répond ?</h2>
          <p className="mt-2 max-w-2xl font-sans text-[13.5px] leading-relaxed text-stone-600">
            Le payeur envoie un SMS simple — « PAYE CMD-1234 » — au numéro de la passerelle. Ces quelques
            lignes, déjà écrites dans votre fichier, arrivent tout seuls :
          </p>
          <pre className="mt-5 overflow-x-auto rounded-2xl bg-[#1C1917] p-6 font-mono text-[12.5px] leading-relaxed text-[#F7F5F0]">
{`// SECTION « VOTRE ACTION » de sms-recu.php
if ($type === "sms.recu" && preg_match('/PAYE\\s*CMD[- ]?(\\d{3,6})/i', $contenu, $m)) {
    // $m[1] = "1234" → marquez la commande payée dans VOTRE base
}`}
          </pre>
        </div>

        {/* Bandeau rappeleur : la serrure, pas la corvée */}
        <div data-reveal className="my-10 rounded-2xl border border-[#1C1917]/10 bg-white p-6 font-sans shadow-card sm:p-8">
          <h2 className="text-lg font-extrabold tracking-tight">Et le fameux secret ?</h2>
          <p className="mt-2 font-sans text-[13.5px] leading-relaxed text-stone-600">
            Il vérifie que c&apos;est bien la passerelle qui appelle votre site — pas un farceur qui ferait
            passer des commandes pour payées. Avec le récepteur téléchargé, il est déjà en place&nbsp;:
            vous ne le copiez jamais, vous ne le lisez jamais. Et si un jour son fichier se répand, un
            clic&nbsp;: &laquo;&nbsp;Télécharger le récepteur avec un nouveau secret&nbsp;&raquo;&nbsp;— l&apos;ancienne serrure
            meurt, la nouvelle est déjà dans le fichier à re-téléverser.
          </p>
        </div>

        <div data-reveal className="my-16 rounded-2xl bg-[#1C1917] px-6 py-14 text-center sm:px-12">
          <h2 className="mx-auto max-w-xl font-sans text-3xl font-extrabold tracking-tight text-[#F7F5F0] sm:text-4xl">
            Le fichier est peut-être déjà à un clic ?
          </h2>
          <p className="mx-auto mt-3 max-w-md font-sans text-[13.5px] leading-relaxed text-stone-400">
            Il vous attend dans votre espace, événements déjà réglés.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/espace/notifications"
              className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#1D4ED8]"
            >
              Télécharger le récepteur dans mon espace ↗
            </Link>
            <Link
              href="/demande-acces"
              className="group inline-flex items-center gap-2 rounded-lg border border-white/20 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Demander un accès
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#1C1917]/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 lg:px-8">
          <p className="font-mono text-[11px] text-stone-500">© 2026 SMSTSIKA · Tous droits réservés</p>
          <p className="flex gap-3 font-mono text-[11px] text-stone-500">
            <Link href="/mentions-legales" className="transition hover:text-[#1C1917] hover:underline">Mentions légales</Link>
            <span>|</span>
            <Link href="/confidentialite" className="transition hover:text-[#1C1917] hover:underline">Confidentialité</Link>
          </p>
        </div>
      </footer>

    </div>
  )
}
