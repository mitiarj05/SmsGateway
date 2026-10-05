'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Download, ShieldCheck, Link2, AlertTriangle, Copy, Check, RefreshCw, ArrowLeft, Loader2, QrCode, Smartphone
} from 'lucide-react'
import CoquilleTableauDeBord from '../../../composants/CoquilleTableauDeBord'
import QrCodeSvg from '../../../composants/QrCodeSvg'

interface Appareil {
  id: string
  nom: string
  statut: string
  created_at: string
}

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
  const urlApk = `${urlServeur || 'https://sms-gateway-omega.vercel.app'}/smsika.apk`

  return (
    <CoquilleTableauDeBord>
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Ajouter un téléphone</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Scannez le QR Code pour installer l'application et lier l'appareil Android à SMSIKA.
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

        {/* Carte gauche : QR Code & Étapes */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Associer un téléphone Android</h2>
              <p className="text-xs text-slate-400 dark:text-zinc-500">Scanner le QR Code avec l'appareil photo du smartphone</p>
            </div>
          </div>

          {/* Zone des 2 QR Codes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 dark:bg-zinc-800/50 dark:border-zinc-700/80">
            <div className="flex flex-col items-center text-center space-y-2">
              <QrCodeSvg valeur={urlApk} taille={150} />
              <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">1. QR Code APK</p>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Scannez avec la caméra du téléphone pour télécharger l'application.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-2">
              <QrCodeSvg valeur={urlServeur || 'https://sms-gateway-omega.vercel.app'} taille={150} />
              <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">2. QR Code Serveur</p>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Scannez dans l'application SMSIKA pour appairer le serveur en 1s.
              </p>
            </div>
          </div>

          {/* Saisie manuelle URL */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
              URL du serveur (Saisie manuelle) :
            </label>
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 border border-slate-200/80 dark:bg-zinc-800/60 dark:border-zinc-700">
              <code className="flex-1 truncate font-mono text-xs font-bold text-slate-800 dark:text-zinc-200">{urlServeur || '…'}</code>
              <button onClick={copierUrl} className="text-blue-600 hover:text-blue-700 dark:text-blue-400" title="Copier">
                {copie ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="rounded-xl bg-amber-50/80 p-4 border border-amber-200/80 text-xs text-amber-900 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <p>
              Autorisez l'installation d'applications inconnues et accordez les permissions SMS et Batterie sans restriction.
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
