'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Key, Copy, Check, Loader2, Mail, User, AlertCircle, CheckCircle2, Webhook } from 'lucide-react'
import CoquilleEspace from '../../../composants/CoquilleEspace'
import { Toast } from '../../../composants/interface'

interface Moi {
  id: string
  nom: string
  email: string
  cle_api: string
  mois: string
  utilise_mois: number
  stats: { envoyes: number; attente: number; echoue: number; recus: number }
}

export default function PageMonCompte() {
  const [moi, setMoi] = useState<Moi | null>(null)
  const [chargement, setChargement] = useState(false)
  const [sauvegarde, setSauvegarde] = useState(false)
  const [copiee, setCopiee] = useState(false)
  const [modification, setModification] = useState(false)
  const [nouveauNom, setNouveauNom] = useState('')
  const [nouveauEmail, setNouveauEmail] = useState('')
  const [notification, setNotification] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  const charger = useCallback(async () => {
    try {
      const reponse = await fetch('/api/espace/moi')
      const donnees = await reponse.json()
      if (reponse.ok && donnees.nom) setMoi(donnees as Moi)
    } catch { /* silencieux */ }
  }, [])

  useEffect(() => { charger() }, [charger])

  async function enregistrerProfil() {
    setSauvegarde(true)
    try {
      const reponse = await fetch('/api/espace/moi', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: nouveauNom.trim(), email: nouveauEmail.trim() }),
      })
      const donnees = await reponse.json().catch(() => ({}))
      if (reponse.ok) {
        setModification(false)
        setNouveauNom(moi?.nom ?? '')
        setNouveauEmail(moi?.email ?? '')
        setNotification({ type: 'succes', texte: 'Profil mis à jour' })
        await charger()
      } else {
        setNotification({ type: 'erreur', texte: donnees.error ?? 'Échec de la mise à jour' })
      }
    } catch {
      setNotification({ type: 'erreur', texte: 'Erreur réseau' })
    } finally {
      setSauvegarde(false)
    }
  }

  function copierCle() {
    if (!moi?.cle_api) return
    navigator.clipboard?.writeText(moi.cle_api)
    setCopiee(true)
    setTimeout(() => setCopiee(false), 2000)
  }

  if (chargement && !moi) {
    return (
      <CoquilleEspace>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </CoquilleEspace>
    )
  }

  return (
    <CoquilleEspace titre="Mon compte" sousTitre="Votre profil, votre clé d’API et vos statistiques">
      <Toast notification={notification} />

      {/* En-tête : nom et email */}
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#1C1917] dark:text-white">Mon compte</h1>
          <p className="mt-1 text-[13.5px] text-stone-600 dark:text-zinc-400">
            Gérez votre profil et votre accès à l’API SMSTSIKA.
          </p>
        </div>
        {!modification && (
          <button
            onClick={() => { setNouveauNom(moi?.nom ?? ''); setNouveauEmail(moi?.email ?? ''); setModification(true) }}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#1C1917]/10 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 transition"
          >
            <User className="h-3.5 w-3.5" /> Modifier le profil
          </button>
        )}
      </div>

      {/* Carte principale : clés et stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

        {/* Clé API */}
        <div className="rounded-[1.5rem] border border-[#1C1917]/10 bg-white p-6 shadow-card dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <p className="text-[12px] font-bold text-[#1C1917] dark:text-white">Votre clé d’API</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Sensible</span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <code className="flex-1 truncate bg-[#1C1917]/[0.04] rounded-xl px-3 py-2 text-[11px] font-mono text-stone-700 dark:bg-zinc-800 dark:text-zinc-200 border border-[#1C1917]/10 dark:border-zinc-700">
              {moi?.cle_api ?? '—'}
            </code>
            <button
              onClick={copierCle}
              disabled={!moi?.cle_api}
              className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 hover:bg-white hover:text-stone-700 disabled:opacity-60 dark:hover:bg-zinc-700 dark:hover:text-zinc-200 transition"
            >
              {copiee ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
          <p className="text-[11px] leading-relaxed text-stone-500 dark:text-zinc-500">
            Cette clé identifie votre application quand elle appelle SMSTSIKA. Ne la partagez pas.
          </p>
          {moi?.cle_api && (
            <p className="mt-2 text-[11px] text-stone-500 dark:text-zinc-500">
              {copiee ? 'Copiée dans le presse-papiers.' : ''}
            </p>
          )}
        </div>

        {/* Statistiques du mois */}
        <div className="rounded-[1.5rem] border border-[#1C1917]/10 bg-white p-6 shadow-card dark:bg-zinc-900 dark:border-zinc-800">
          <p className="text-[12px] font-bold uppercase tracking-wider text-stone-400 mb-4">
            Ce mois ({moi?.mois ?? '—'})
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-stone-600 dark:text-zinc-400">SMS envoyés</span>
              <span className="text-[16px] font-bold text-[#1C1917] dark:text-white">{moi?.stats.envoyes ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-stone-600 dark:text-zinc-400">En attente</span>
              <span className="text-[16px] font-bold text-[#1C1917] dark:text-white">{moi?.stats.attente ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-stone-600 dark:text-zinc-400">Échoués</span>
              <span className="text-[16px] font-bold text-rose-600 dark:text-rose-400">{moi?.stats.echoue ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-stone-600 dark:text-zinc-400">SMS reçus</span>
              <span className="text-[16px] font-bold text-[#1C1917] dark:text-white">{moi?.stats.recus ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Utilisation du mois */}
        <div className="rounded-[1.5rem] border border-[#1C1917]/10 bg-white p-6 shadow-card dark:bg-zinc-900 dark:border-zinc-800">
          <p className="text-[12px] font-bold uppercase tracking-wider text-stone-400 mb-2">Utilisation ce mois</p>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[14px] font-bold text-[#1C1917] dark:text-white">{moi?.utilise_mois ?? 0}</span>
            <span className="text-[11px] text-stone-500">SMS envoyés</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#1C1917]/[0.04] dark:bg-zinc-800">
            <div className="h-full rounded-full bg-blue-600" style={{ width: Math.min(100, ((moi?.utilise_mois ?? 0) / 100) * 100) + '%' }} />
          </div>
          <p className="mt-2 text-[11px] text-stone-500 dark:text-zinc-500">
            Forfait illimité : ce relevé suit vos envois, aucun plafond n’est appliqué.
          </p>
        </div>

      </div>

      {/* Formulaire de modification */}
      {modification && (
        <div className="mt-8 rounded-[1.5rem] border border-[#1C1917]/10 bg-white p-6 shadow-card dark:bg-zinc-900 dark:border-zinc-800">
          <h2 className="text-sm font-bold text-[#1C1917] dark:text-white mb-4">Modifier le profil</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-zinc-300 mb-1">Nom de votre espace</label>
              <input
                type="text"
                value={nouveauNom}
                onChange={(e) => setNouveauNom(e.target.value)}
                className="w-full rounded-xl border border-[#1C1917]/10 bg-white px-3 py-2 text-xs text-[#1C1917] focus:outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-zinc-300 mb-1">E-mail de contact</label>
              <input
                type="email"
                value={nouveauEmail}
                onChange={(e) => setNouveauEmail(e.target.value)}
                className="w-full rounded-xl border border-[#1C1917]/10 bg-white px-3 py-2 text-xs text-[#1C1917] focus:outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={enregistrerProfil}
              disabled={sauvegarde}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#2563EB] px-5 py-2 text-xs font-bold text-white transition hover:bg-[#1D4ED8] disabled:opacity-60 shrink-0"
            >
              {sauvegarde ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {sauvegarde ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button
              onClick={() => { setModification(false); setNouveauNom(moi?.nom ?? ''); setNouveauEmail(moi?.email ?? '') }}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#1C1917]/10 px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 transition shrink-0"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Actions en bas */}
      <div className="mt-8 flex items-center gap-3 sm:justify-end">
        <Link
          href="/espace/evenements"
          className="inline-flex items-center gap-1.5 rounded-full border border-[#1C1917]/10 px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 transition"
        >
          <Webhook className="h-3.5 w-3.5" /> Voir les Intégrations
        </Link>
      </div>
    </CoquilleEspace>
  )
}
