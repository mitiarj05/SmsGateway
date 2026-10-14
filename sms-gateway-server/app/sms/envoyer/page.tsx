'use client'

import { useState, useEffect } from 'react'
import { Send, Loader2, CheckCircle2, AlertTriangle, Users, Calendar, Clock } from 'lucide-react'
import CoquilleTableauDeBord from '../../../composants/CoquilleTableauDeBord'

interface EspaceOption {
  id: string
  nom: string
}

/**
 * Page admin : envoyer un SMS au nom d'un espace client.
 * Même interface que l'écran d'envoi de l'espace client.
 * Session admin exigée (pas de clé API) — POST /api/sms/envoyer-admin.
 */
export default function PageEnvoyerSmsAdmin() {
  const [espaces, setEspaces] = useState<EspaceOption[]>([])
  const [espaceId, setEspaceId] = useState('')
  const [destinataires, setDestinataires] = useState('')
  const [message, setMessage] = useState('')
  const [modeProgrammation, setModeProgrammation] = useState<'immediat' | 'programmer'>('immediat')
  const [programme, setProgramme] = useState('')
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [resultat, setResultat] = useState<{ reussi: boolean; texte: string } | null>(null)
  // Évite le mismatch d'hydratation sur `disabled` (SSR sans données).
  const [monte, setMonte] = useState(false)
  useEffect(() => { setMonte(true) }, [])

  useEffect(() => {
    fetch('/api/api-clients')
      .then((r) => r.json())
      .then((d) => {
        const liste = Array.isArray(d?.clients) ? d.clients : []
        setEspaces(liste.map((c: any) => ({ id: c.id, nom: c.nom })))
        if (liste.length > 0) setEspaceId(liste[0].id)
      })
      .catch(() => null)
  }, [])

  const destinatairesListe = destinataires.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean)
  const nombreDestinataires = destinatairesListe.length
  const nbCaracteres = message.length
  const nbSegments = Math.ceil(nbCaracteres / 160) || 1

  async function soumettre(e: React.FormEvent) {
    e.preventDefault()
    setEnvoiEnCours(true)
    setResultat(null)
    try {
      const programmeA =
        modeProgrammation === 'programmer' && programme ? new Date(programme).toISOString() : undefined
      const reponse = await fetch('/api/sms/envoyer-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: nombreDestinataires > 1 ? destinatairesListe : destinatairesListe[0] ?? '',
          message,
          id_application: espaceId,
          ...(programmeA ? { scheduled_at: programmeA } : {}),
        }),
      })
      const donnees = await reponse.json().catch(() => null)
      if (reponse.ok) {
        setResultat({ reussi: true, texte: donnees?.message ?? 'SMS mis en file d\u2019attente' })
        setDestinataires('')
        setMessage('')
        setProgramme('')
        setModeProgrammation('immediat')
      } else {
        setResultat({ reussi: false, texte: donnees?.error ?? 'Erreur lors de l\u2019envoi' })
      }
    } catch {
      setResultat({ reussi: false, texte: 'Serveur injoignable' })
    } finally {
      setEnvoiEnCours(false)
    }
  }

  return (
    <CoquilleTableauDeBord>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white">Envoyer un SMS</h1>
          <p className="mt-1 text-[13.5px] text-slate-500 dark:text-zinc-400">
            Envoyé au nom de l'espace choisi — compté dans son historique et son quota.
          </p>
        </div>
      </div>

      {resultat && (
        <div className={`mb-6 rounded-2xl p-4 text-xs font-medium border ${
          resultat.reussi
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300'
            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300'
        }`}>
          <p className="flex items-center gap-2 font-bold text-sm">
            {resultat.reussi ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />}
            {resultat.texte}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Formulaire principal à gauche (Exact Screenshot) */}
        <section className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 xl:col-span-2">
          <form onSubmit={soumettre} className="space-y-6">

            {/* Espace d'envoi (admin uniquement) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                Espace d'envoi
              </label>
              <select
                value={espaceId}
                onChange={(e) => setEspaceId(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 text-xs font-semibold text-slate-700 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                <option value="">— Choisir un espace —</option>
                {espaces.map((e) => (
                  <option key={e.id} value={e.id}>{e.nom}</option>
                ))}
              </select>
            </div>

            {/* Destinataires */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                Destinataires <span className="text-[11px] font-normal text-slate-400">(un par ligne ou séparés par virgules)</span>
              </label>
              <textarea
                required
                rows={3}
                value={destinataires}
                onChange={(e) => setDestinataires(e.target.value)}
                placeholder="+261340000000&#10;+261330000000"
                className="w-full resize-y rounded-2xl border border-slate-200 p-3.5 font-mono text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <p className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400 font-semibold">
                <Users className="h-3.5 w-3.5 text-blue-600" />
                <span><strong className="text-blue-600 dark:text-blue-400">{nombreDestinataires} destinataires</strong> détectés · jusqu'à 100 par lot</span>
              </p>
            </div>

            {/* Message SMS */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                Message SMS
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Rédigez votre message ici..."
                className="w-full resize-none rounded-2xl border border-slate-200 p-3.5 text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500">
                <span />
                <span>{nbCaracteres} / 160 caractères · {nbSegments} segment{nbSegments > 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Programmation */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">Programmation</p>
              <div className="flex items-center gap-3">
                <div className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-700 shadow-2xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="font-medium">Envoi immédiat</span>
                </div>
                <button
                  type="button"
                  onClick={() => setModeProgrammation(modeProgrammation === 'immediat' ? 'programmer' : 'immediat')}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  <Calendar className="h-4 w-4 text-slate-400" /> Programmer
                </button>
              </div>
              {modeProgrammation === 'programmer' && (
                <input
                  type="datetime-local"
                  value={programme}
                  onChange={(e) => setProgramme(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-700 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                />
              )}
            </div>

            {/* Bouton pleine largeur */}
            <button
              type="submit"
              disabled={!monte || envoiEnCours || !espaceId}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2563EB] py-3.5 text-[13px] font-bold text-white shadow-lg shadow-indigo-300/45 hover:bg-[#1D4ED8] disabled:opacity-60 transition"
            >
              {envoiEnCours ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {envoiEnCours ? 'Expédition en cours...' : 'Envoyer les messages'}
            </button>
          </form>
        </section>

        {/* Colonne Droite (2 Cards - Exact Screenshot) */}
        <div className="space-y-6">

          {/* Card 1 : Aperçu sur mobile */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Aperçu sur mobile</h3>

            <div className="rounded-[2.2rem] bg-slate-950 p-4 border-4 border-slate-900 shadow-xl space-y-3">
              <p className="text-[10px] text-slate-400 text-center">SMS · aujourd'hui 09:12</p>

              <div className="rounded-2xl bg-[#1d1947] p-3 text-xs text-white leading-relaxed border border-indigo-900/50 space-y-2">
                <p>
                  {message.trim() || "Rédigez votre message ici..."}
                </p>
                <p className="text-[9px] text-slate-400 text-right">✓✓ Remis</p>
              </div>
            </div>
          </div>

          {/* Card 2 : Règles d'envoi */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Règles d'envoi</h3>

            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span><b>Espace</b> : imputé à l'espace choisi (historique + quota).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span><b>Limite de destinataires</b> : jusqu'à 100 numéros par lot.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span><b>Format international</b> : préférez la forme E.164 (ex. +261...).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span><b>Quota</b> : 20 SMS/h par téléphone du parc.</span>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </CoquilleTableauDeBord>
  )
}
