'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Smartphone, RefreshCw, Loader2, QrCode, Zap, ArrowUpRight,
  Trash2, Radio, Pencil, FileText
} from 'lucide-react'
import CoquilleEspace from '../../../composants/CoquilleEspace'
import ModalAjouterAppareil from '../../../composants/ModalAjouterAppareil'
import { SoldeSim, Toast, DialogueConfirmation } from '../../../composants/interface'

interface AppareilParc {
  id: string
  nom: string
  statut: string
  sms_last_hour: number
  derniere_activite: string | null
  supprimable?: boolean
  fcm_present?: boolean
  fcm_token?: string | null
  solde_sim?: string | null
  solde_devise?: string | null
  solde_texte?: string | null
  solde_maj_le?: string | null
}

export default function PageAppareilsClient() {
  const [appareils, setAppareils] = useState<AppareilParc[]>([])
  const [chargement, setChargement] = useState(true)
  const [actualisation, setActualisation] = useState(false)
  const [modalAjoutOuverte, setModalAjoutOuverte] = useState(false)
  const [notification, setNotification] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  // Modales & Actions
  const [cibleSuppression, setCibleSuppression] = useState<AppareilParc | null>(null)
  const [suppressionEnCours, setSuppressionEnCours] = useState(false)
  const [cibleEdition, setCibleEdition] = useState<AppareilParc | null>(null)
  const [nomEdition, setNomEdition] = useState('')
  const [editionEnCours, setEditionEnCours] = useState(false)
  const [reveilEnCours, setReveilEnCours] = useState<string | null>(null)

  function afficherNotification(type: 'succes' | 'erreur', texte: string) {
    setNotification({ type, texte })
    setTimeout(() => setNotification(null), 4000)
  }

  const chargerDonnees = useCallback(async (silencieux = false) => {
    if (!silencieux) setActualisation(true)
    try {
      const res = await fetch('/api/espace/appareils')
      const data = await res.json().catch(() => ({}))
      if (Array.isArray(data.appareils)) {
        setAppareils(data.appareils)
      }
    } finally {
      setChargement(false)
      setActualisation(false)
    }
  }, [])

  useEffect(() => {
    chargerDonnees(true)
    const i = setInterval(() => chargerDonnees(true), 10000)
    return () => clearInterval(i)
  }, [chargerDonnees])

  async function reveillerAppareil(a: AppareilParc) {
    setReveilEnCours(a.id)
    try {
      const reponse = await fetch(`/api/devices/${a.id}/ping`, { method: 'POST' })
      const donnees = await reponse.json().catch(() => ({}))
      if (reponse.ok && donnees.ping_sent) {
        afficherNotification('succes', `Push de réveil envoyé à « ${a.nom} »`)
      } else {
        afficherNotification('erreur', donnees?.error ?? 'Réveil impossible (pas de jeton FCM ?)')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    } finally {
      setReveilEnCours(null)
    }
  }

  async function enregistrerEdition() {
    if (!cibleEdition || !nomEdition.trim()) return
    setEditionEnCours(true)
    try {
      const reponse = await fetch(`/api/espace/appareils/${cibleEdition.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: nomEdition.trim() }),
      })
      const donnees = await reponse.json().catch(() => ({}))
      if (reponse.ok) {
        afficherNotification('succes', `Appareil renommé en « ${nomEdition.trim()} »`)
        setCibleEdition(null)
        chargerDonnees(true)
      } else {
        afficherNotification('erreur', donnees?.error ?? 'Renommage impossible')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    } finally {
      setEditionEnCours(false)
    }
  }

  async function supprimerAppareil() {
    if (!cibleSuppression) return
    setSuppressionEnCours(true)
    try {
      const res = await fetch(`/api/espace/appareils/${cibleSuppression.id}`, { method: 'DELETE' })
      const donnees = await res.json().catch(() => ({}))
      if (res.ok) {
        afficherNotification('succes', `« ${cibleSuppression.nom} » supprimé de votre parc`)
        setCibleSuppression(null)
        chargerDonnees(true)
      } else {
        afficherNotification('erreur', donnees?.error ?? 'Suppression impossible')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
      setCibleSuppression(null)
    } finally {
      setSuppressionEnCours(false)
    }
  }

  function tempsEcouleFr(dateIso: string | null): string {
    if (!dateIso) return '—'
    const s = Math.floor((Date.now() - new Date(dateIso).getTime()) / 1000)
    if (s < 60) return "à l'instant"
    if (s < 3600) return `il y a ${Math.floor(s / 60)} min`
    if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`
    return new Date(dateIso).toLocaleDateString('fr-FR')
  }

  if (chargement) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1C1917]/[0.04] dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const totalAppareils = appareils.length
  const enLigneCount = appareils.filter((a) => a.statut === 'EN_LIGNE').length
  const horsLigneCount = totalAppareils - enLigneCount
  const debitTotal = appareils.reduce((s, a) => s + (a.sms_last_hour ?? 0), 0)

  return (
    <CoquilleEspace>
      {/* En-tête */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#1C1917] dark:text-white">Appareils</h1>
          <p className="mt-1 text-[13.5px] text-stone-600 dark:text-zinc-400">
            Les téléphones qui expédient vos SMS, avec leur état en temps réel.
          </p>
        </div>
        <button
          onClick={() => setModalAjoutOuverte(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg hover:bg-[#1D4ED8] transition"
        >
          <Smartphone className="h-4 w-4" /> Associer un téléphone
        </button>
      </div>

      {/* Hero Card Informative */}
      <div className="rounded-2xl bg-gradient-to-br from-[#332c75] to-[#1f1a52] p-6 text-white shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Votre parc d'appareils</h2>
              <p className="text-xs text-white/60">
                Vos téléphones uniquement — vos SMS partent par votre carte SIM.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-200 border border-emerald-500/30">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> {enLigneCount} relais connecté
          </span>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#1C1917]/10 bg-white shadow-card px-6 py-5 dark:bg-zinc-900 dark:border-zinc-800 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">TÉLÉPHONES ASSOCIÉS</p>
          <p className="text-[30px] font-extrabold leading-none text-[#1C1917] dark:text-white">{totalAppareils}</p>
          <p className="text-[11px] text-stone-500">{enLigneCount} en ligne · {horsLigneCount} hors ligne</p>
        </div>

        <div className="rounded-2xl border border-[#1C1917]/10 bg-white shadow-card px-6 py-5 dark:bg-zinc-900 dark:border-zinc-800 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">CAPACITÉ TOTALE</p>
          <p className="text-[30px] font-extrabold leading-none text-[#1C1917] dark:text-white">{totalAppareils} <span className="text-sm font-bold text-stone-500">appareil{totalAppareils > 1 ? 's' : ''}</span></p>
          <p className="text-[11px] text-stone-500">Vos appareils liés</p>
        </div>

        <div className="rounded-2xl border border-[#1C1917]/10 bg-white shadow-card px-6 py-5 dark:bg-zinc-900 dark:border-zinc-800 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">DÉBIT ACTUEL</p>
          <p className="text-[30px] font-extrabold leading-none text-emerald-600 dark:text-emerald-400">{debitTotal}</p>
          <p className="text-[11px] text-stone-500">SMS/h sur vos appareils</p>
        </div>
      </div>

      {/* Main Grid 2 Cols */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">

        {/* Left Column (2 cols) : Téléphones du parc */}
        <div className="rounded-2xl border border-[#1C1917]/10 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-[#1C1917]/10 pb-4 dark:border-zinc-800">
            <div>
              <h2 className="text-[16px] font-bold text-[#1C1917] dark:text-white">Vos téléphones</h2>
              <p className="text-[12px] text-stone-500">{totalAppareils} appareil visible</p>
            </div>
            <button
              onClick={() => chargerDonnees(false)}
              disabled={actualisation}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#1C1917]/10 bg-white px-3.5 py-1.5 text-[12px] font-semibold text-stone-600 shadow-2xs hover:border-slate-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <RefreshCw className={`h-3.5 w-3.5${actualisation ? ' animate-spin' : ''}`} /> Actualiser
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1C1917]/10 text-[11px] font-semibold uppercase tracking-wide text-stone-500 dark:border-zinc-800">
                  <th className="pb-3 pr-4">TÉLÉPHONE</th>
                  <th className="pb-3 pr-4">STATUT</th>
                  <th className="pb-3 pr-4">SOLDE SIM</th>
                  <th className="pb-3 pr-4">DÉBIT (SMS/H)</th>
                  <th className="pb-3 pr-4">DERNIÈRE ACTIVITÉ</th>
                  <th className="pb-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C1917]/10 dark:divide-zinc-800">
                {appareils.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-xs text-stone-500 dark:text-zinc-500">
                      Aucun téléphone lié — associez votre premier téléphone pour commencer à envoyer.
                    </td>
                  </tr>
                )}
                {appareils.map((a) => {
                  const enLigne = a.statut === 'EN_LIGNE'
                  return (
                  <tr key={a.id} className="text-[#1C1917] dark:text-zinc-200">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className={`relative h-8 w-8 shrink-0 overflow-hidden rounded-xl border border-[#1C1917]/10 dark:border-zinc-800 ${enLigne ? '' : 'opacity-60 grayscale'}`}>
                          <Image
                            src="/images/flotte.jpg"
                            alt="Téléphone configuré comme relais d'envoi SMSTSIKA"
                            fill
                            sizes="32px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-bold">{a.nom}</p>
                          <p className="font-mono text-[10px] text-stone-500">{a.id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold${enLigne ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full${enLigne ? 'bg-emerald-500' : 'bg-red-500'}`} /> {enLigne ? 'En ligne' : 'Hors ligne'}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <SoldeSim
                        montant={a.solde_sim}
                        devise={a.solde_devise}
                        texte={a.solde_texte}
                        majLe={a.solde_maj_le}
                      />
                    </td>
                    <td className="py-4 pr-4 font-semibold">{a.sms_last_hour ?? 0} SMS/h</td>
                    <td className="py-4 pr-4 text-stone-500">{tempsEcouleFr(a.derniere_activite)}</td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => reveillerAppareil(a)}
                          disabled={!a.fcm_present || reveilEnCours === a.id}
                          title={a.fcm_present ? 'Envoyer un push de réveil' : 'Aucun jeton FCM — réveil impossible'}
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#1C1917]/10 bg-white text-stone-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                        >
                          {reveilEnCours === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Radio className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setCibleEdition(a); setNomEdition(a.nom) }}
                          title="Renommer cet appareil"
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#1C1917]/10 bg-white text-stone-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <Link
                          href={`/espace/envois?appareil=${a.id}`}
                          title="Voir les envois de cet appareil"
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#1C1917]/10 bg-white text-stone-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setCibleSuppression(a)}
                          title={`Supprimer ${a.nom} de votre parc`}
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 dark:border-rose-900/50 dark:bg-zinc-800 dark:text-rose-400 dark:hover:bg-rose-900/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-dashed border-[#1C1917]/10 bg-stone-100 p-4 text-center space-y-2 dark:border-zinc-800 dark:bg-zinc-800/30">
            <p className="text-xs text-stone-600 dark:text-zinc-400">
              Ajoutez un second téléphone pour doubler votre débit et assurer la reprise sur incident.
            </p>
            <button onClick={() => setModalAjoutOuverte(true)} className="inline-flex items-center gap-1 text-xs font-bold text-[#2563EB] hover:underline dark:text-blue-400">
              + Ajouter un téléphone
            </button>
          </div>
        </div>

        {/* Right Column (2 Cards) */}
        <div className="space-y-4">
          {/* Comment associer un appareil */}
          <div className="rounded-2xl border border-[#1C1917]/10 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
            <h3 className="text-sm font-bold text-[#1C1917] dark:text-white">Comment associer un appareil ?</h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600 dark:bg-blue-500/20 dark:text-indigo-300">1</span>
                <div>
                  <p className="font-bold text-[#1C1917] dark:text-zinc-200">Installez l'app SMSTSIKA</p>
                  <p className="text-[11px] text-stone-500">Disponible sur Android (APK / Play Store)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600 dark:bg-blue-500/20 dark:text-indigo-300">2</span>
                <div>
                  <p className="font-bold text-[#1C1917] dark:text-zinc-200">Scannez le QR de liaison</p>
                  <p className="text-[11px] text-stone-500">Généré automatiquement, valable 10 min</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600 dark:bg-blue-500/20 dark:text-indigo-300">3</span>
                <div>
                  <p className="font-bold text-[#1C1917] dark:text-zinc-200">Le relais est en ligne</p>
                  <p className="text-[11px] text-stone-500">Vos SMS passent par la carte SIM de l'appareil</p>
                </div>
              </div>
            </div>
          </div>

          {/* QR de liaison */}
          <button
            onClick={() => setModalAjoutOuverte(true)}
            className="rounded-2xl border border-[#1C1917]/10 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 text-center space-y-3 w-full transition hover:border-[#2563EB]/40"
          >
            <p className="text-xs font-bold text-[#1C1917] dark:text-white">QR de liaison</p>
            <div className="flex justify-center p-4">
              <QrCode className="h-24 w-24 text-[#1C1917] dark:text-white" />
            </div>
            <p className="text-[11px] text-stone-500">Flashez pour lier un téléphone à votre espace</p>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1C1917]/10 px-4 py-2 text-xs font-semibold text-stone-700 shadow-2xs dark:border-zinc-700 dark:text-zinc-200">
              <Smartphone className="h-3.5 w-3.5" /> Associer un téléphone
            </span>
          </button>

          {/* Card Besoin d'aide ? */}
          <div className="rounded-2xl bg-gradient-to-br from-[#332c75] to-[#1f1a52] p-6 text-white shadow-card space-y-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">BESOIN D'AIDE ?</p>
            <p className="text-xs text-white/75 leading-relaxed">
              Un téléphone ne se connecte pas ? Notre équipe vous accompagne en moins de 24 h, gratuitement.
            </p>
            <a href="mailto:support@smsika.app" className="block w-full rounded-full bg-amber-400 py-3 text-xs font-bold text-[#1C1917] shadow-md hover:bg-amber-300 transition">
              Écrire au support
            </a>
          </div>
        </div>

      </div>

      <ModalAjouterAppareil
        ouvert={modalAjoutOuverte}
        onFermer={() => setModalAjoutOuverte(false)}
      />

      {/* Modal de renommage */}
      {cibleEdition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setCibleEdition(null)}>
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-card dark:bg-zinc-900 dark:border dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[15px] font-bold text-[#1C1917] dark:text-white">Renommer l&apos;appareil</h3>
            <p className="mt-0.5 text-[11.5px] text-stone-500 dark:text-zinc-400">
              Le nom apparaît sur les pages Appareils et Historique.
            </p>
            <input
              type="text"
              value={nomEdition}
              onChange={(e) => setNomEdition(e.target.value)}
              maxLength={60}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') enregistrerEdition() }}
              className="mt-4 w-full rounded-xl border border-[#1C1917]/10 bg-white px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-blue-400 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setCibleEdition(null)}
                className="rounded-full border border-[#1C1917]/10 px-4 py-2 text-[12px] font-semibold text-stone-600 hover:bg-stone-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Annuler
              </button>
              <button
                onClick={enregistrerEdition}
                disabled={!nomEdition.trim() || editionEnCours}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#2563EB] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#1D4ED8] disabled:opacity-60"
              >
                {editionEnCours && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      <DialogueConfirmation
        ouvert={!!cibleSuppression}
        onFermer={() => setCibleSuppression(null)}
        onConfirmer={supprimerAppareil}
        chargement={suppressionEnCours}
        titre="Supprimer cet appareil ?"
        message={`« ${cibleSuppression?.nom ?? ''} » sera retiré de votre parc.`}
        etiquetteConfirmer="Supprimer"
      />

      <Toast notification={notification} />
    </CoquilleEspace>
  )
}
