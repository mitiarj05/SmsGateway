'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Smartphone, ShieldCheck, Loader2, ChevronRight } from 'lucide-react'
import CoquilleTableauDeBord from '../../../composants/CoquilleTableauDeBord'
import { Appareil } from '../../../composants/interface'

/**
 * Ajouter un téléphone : l'inscription est initiée PAR le téléphone
 * (connexion anonyme Firebase Auth), le serveur crée l'appareil HORS_LIGNE
 * lié au compte Firebase. Cette page guide l'ajout et liste les
 * téléphones en attente de première connexion.
 */
export default function AjouterAppareilPage() {
  const [appareils, setAppareils] = useState<Appareil[]>([])
  const [chargement, setChargement] = useState(true)
  const [derniereActualisation, setDerniereActualisation] = useState(new Date())
  const [actualisationEnCours, setActualisationEnCours] = useState(false)

  const chargerDonnees = useCallback(async (silencieux = false) => {
    if (!silencieux) setActualisationEnCours(true)
    try {
      const reponse = await fetch('/api/devices')
      const donnees = await reponse.json()
      if (donnees.devices) setAppareils(donnees.devices)
      setDerniereActualisation(new Date())
    } finally {
      setChargement(false)
      setActualisationEnCours(false)
    }
  }, [])

  useEffect(() => {
    chargerDonnees(true)
    const i = setInterval(() => chargerDonnees(true), 10000)
    return () => clearInterval(i)
  }, [chargerDonnees])

  const enAttente = appareils
    .filter((d) => d.statut === 'HORS_LIGNE')
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 10)

  if (chargement) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <CoquilleTableauDeBord
      titre="Ajouter un téléphone"
      sousTitre={`actualisé à ${derniereActualisation.toLocaleTimeString('fr-FR')}`}
      actions={
        <Link href="/devices"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
          Voir les appareils <ChevronRight className="h-4 w-4" />
        </Link>
      }
    >
      <div className="grid max-w-4xl grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Marche à suivre */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Inscription sécurisée</h2>
          </div>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-zinc-600 dark:text-zinc-300">
            <li>Installez l&apos;app Android sur le téléphone.</li>
            <li>Renseignez l&apos;adresse du serveur et démarrez le service.</li>
            <li>L&apos;app se connecte anonymement via Firebase Auth et s&apos;enregistre.</li>
            <li>Le serveur crée l&apos;appareil <b>HORS_LIGNE</b> lié au compte Firebase.</li>
            <li>À la première scrutation, il passe <b>EN_LIGNE</b> automatiquement.</li>
          </ol>
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 ring-1 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20">
            Prérequis : méthode « Anonyme » activée dans Firebase Console → Authentication → Sign-in method (projet gateway).
          </p>
        </section>

        {/* En attente de première connexion */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
          <div className="mb-4 flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">En attente de première connexion</h2>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {enAttente.length}
            </span>
          </div>
          {enAttente.length === 0 ? (
            <p className="py-4 text-center text-xs text-zinc-400">
              Aucun téléphone en attente — démarrez le service sur un téléphone pour le voir ici.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {enAttente.map((d) => (
                <li key={d.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{d.nom}</p>
                    <p className="font-mono text-[11px] text-zinc-400">
                      créé le {new Date(d.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <Link href="/devices"
                    className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
                    Gérer
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </CoquilleTableauDeBord>
  )
}
