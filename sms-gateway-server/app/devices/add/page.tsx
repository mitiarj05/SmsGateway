'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Download, ShieldCheck, Link2, AlertTriangle, Copy, Check, RefreshCw, ArrowLeft, Loader2,
} from 'lucide-react'
import CoquilleTableauDeBord from '../../../composants/CoquilleTableauDeBord'

interface Appareil {
  id: string
  nom: string
  statut: string
  created_at: string
}

/**
 * Ajouter un téléphone : l'inscription est initiée PAR le téléphone
 * (connexion anonyme Firebase Auth), le serveur crée l'appareil HORS_LIGNE.
 * Cette page guide l'ajout et liste les téléphones en attente de
 * première connexion (scrutés toutes les 10 s).
 */
export default function AjouterAppareilPage() {
  const [enAttente, setEnAttente] = useState<Appareil[]>([])
  const [urlServeur, setUrlServeur] = useState('')
  const [copie, setCopie] = useState(false)
  const [actualisation, setActualisation] = useState(false)

  const charger = useCallback(async (silencieux = false) => {
    if (!silencieux) setActualisation(true)
    try {
      const res = await fetch('/api/devices')
      const donnees = await res.json().catch(() => ({}))
      const liste: Appareil[] = Array.isArray(donnees.devices) ? donnees.devices : []
      setEnAttente(
        liste
          .filter((d) => d.statut === 'HORS_LIGNE')
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
          .slice(0, 10)
      )
    } finally {
      setActualisation(false)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') setUrlServeur(window.location.origin)
    charger(true)
    const i = setInterval(() => charger(true), 10000)
    return () => clearInterval(i)
  }, [charger])

  function copierUrl() {
    if (!urlServeur) return
    navigator.clipboard?.writeText(urlServeur)
    setCopie(true)
    setTimeout(() => setCopie(false), 2000)
  }

  const connecte = enAttente.length === 0

  return (
    <CoquilleTableauDeBord>
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Ajouter un téléphone</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Associez un nouvel appareil Android à votre espace SMSIKA.
          </p>
        </div>
        <Link
          href="/devices"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" /> Retour aux appareils
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Carte gauche : Téléphone secondaire */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Téléphone secondaire</h2>
            <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">
              Installez puis configurez l'application Smsika Relay App sur le téléphone.
            </p>

            <div className="mt-6 space-y-6">
              {/* Étape 1 */}
              <div className="flex items-start gap-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 font-bold text-xs text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                  1
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-slate-600 dark:text-zinc-300" />
                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">Installer l'application</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                    Installez l'application Android SMSIKA sur le téléphone à associer.
                  </p>
                </div>
              </div>

              {/* Étape 2 */}
              <div className="flex items-start gap-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 font-bold text-xs text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                  2
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-slate-600 dark:text-zinc-300" />
                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">Autoriser les permissions</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                    Accordez les permissions SMS, téléphone et notifications pour permettre l'envoi et la réception.
                  </p>
                </div>
              </div>

              {/* Étape 3 */}
              <div className="flex items-start gap-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 font-bold text-xs text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                  3
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-slate-600 dark:text-zinc-300" />
                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">Renseigner le serveur</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                    Dans l'application, saisissez l'URL du serveur ci-dessous puis démarrez le service. Le téléphone s'enregistre seul.
                  </p>
                  <div className="mt-2 flex items-center gap-2 rounded-xl bg-slate-50 p-3 border border-slate-200/80 dark:bg-zinc-800/60 dark:border-zinc-700">
                    <code className="flex-1 truncate font-mono text-xs font-bold text-slate-800 dark:text-zinc-200">{urlServeur || '…'}</code>
                    <button onClick={copierUrl} className="text-blue-600 hover:text-blue-700 dark:text-blue-400" title="Copier">
                      {copie ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="mt-8 rounded-xl bg-amber-50/80 p-4 border border-amber-200/80 text-xs text-amber-900 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <p>
              L'application n'est pas distribuée via le Google Play Store. Autorisez temporairement l'installation d'applications inconnues.
            </p>
          </div>
        </div>

        {/* Carte droite : En attente de première connexion */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">En attente de première connexion</h2>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${connecte ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${connecte ? 'bg-emerald-500' : 'bg-amber-500'}`} /> {connecte ? 'À jour' : `${enAttente.length} en attente`}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">
              Les téléphones inscrits apparaissent ici en HORS_LIGNE, puis passent EN_LIGNE à la première scrutation.
            </p>

            <div className="mt-6">
              {actualisation && enAttente.length === 0 ? (
                <p className="flex items-center justify-center gap-2 py-12 text-xs text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Actualisation…
                </p>
              ) : enAttente.length === 0 ? (
                <p className="py-12 text-center text-xs text-slate-400 dark:text-zinc-500">
                  Aucun téléphone en attente — démarrez le service sur un téléphone pour le voir ici.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {enAttente.map((d) => (
                    <li key={d.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">{d.nom}</p>
                        <p className="font-mono text-[11px] text-slate-400">
                          inscrit le {new Date(d.created_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                      <Link href="/devices"
                        className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400">
                        Gérer
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-zinc-800/80">
            <span className="text-xs text-slate-400 dark:text-zinc-500">Liste actualisée toutes les 10 secondes</span>
            <button
              onClick={() => charger(false)}
              disabled={actualisation}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${actualisation ? 'animate-spin' : ''}`} /> Actualiser
            </button>
          </div>
        </div>
      </div>
    </CoquilleTableauDeBord>
  )
}
