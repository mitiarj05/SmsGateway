'use client'

import { useState } from 'react'
import { Send, Loader2, CheckCircle2, AlertTriangle, Users, Link2, Calendar, Clock, Smartphone, Check } from 'lucide-react'
import CoquilleEspace from '../../../composants/CoquilleEspace'
import { Toast } from '../../../composants/interface'

export default function PageEnvoyerEspace() {
  const [numeros, setNumeros] = useState('+261340000000\n+261330000000')
  const [message, setMessage] = useState("Bonjour ! Votre commande #4821 est prête. Retrait possible dès aujourd'hui au magasin. Merci ! {LIEN}")
  const [lienIntelligent, setLienIntelligent] = useState(true)
  const [modeProgrammation, setModeProgrammation] = useState<'immediat' | 'programmer'>('immediat')
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [resultat, setResultat] = useState<{
    reussi: boolean; texte: string; liens?: { numero_destinataire: string; url: string }[]
  } | null>(null)
  const [notification, setNotification] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  function afficherNotification(type: 'succes' | 'erreur', texte: string) {
    setNotification({ type, texte })
    setTimeout(() => setNotification(null), 4000)
  }

  const destinatairesListe = numeros.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean)
  const nombreDestinataires = destinatairesListe.length
  const contientLien = message.includes('{LIEN}')
  const nbCaracteres = message.length
  const nbSegments = Math.ceil(nbCaracteres / 160) || 1

  function appliquerModele(texte: string) {
    setMessage(texte)
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault()
    setEnvoiEnCours(true)
    setResultat(null)
    try {
      const reponse = await fetch('/api/espace/envoyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: nombreDestinataires > 1 ? destinatairesListe : destinatairesListe[0] ?? '',
          message,
          ...(lienIntelligent ? { lien_intelligent: true } : {}),
        }),
      })
      const donnees = await reponse.json().catch(() => null)
      if (reponse.ok) {
        setResultat({
          reussi: true,
          texte: donnees?.message ?? 'SMS mis en file d’attente',
          ...(Array.isArray(donnees?.liens) && donnees.liens.length > 0 ? { liens: donnees.liens } : {}),
        })
        afficherNotification('succes', 'Messages envoyés avec succès')
      } else {
        afficherNotification('erreur', donnees?.error ?? 'Erreur lors de l’envoi')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    } finally {
      setEnvoiEnCours(false)
    }
  }

  return (
    <CoquilleEspace>
      {/* En-tête (Exact Screenshot) */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white">Envoyer un SMS</h1>
          <p className="mt-1 text-[13.5px] text-slate-500 dark:text-zinc-400">
            Programmez ou expédiez directement des SMS via votre forfait client.
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
          {resultat.liens && resultat.liens.length > 0 && (
            <ul className="mt-3 space-y-2">
              {resultat.liens.map((l) => (
                <li key={l.url} className="rounded-xl bg-white/80 p-2.5 dark:bg-zinc-800">
                  <p className="font-mono text-xs font-bold">{l.numero_destinataire}</p>
                  <code className="block truncate font-mono text-xs text-blue-600 dark:text-blue-400 mt-0.5">{l.url}</code>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Formulaire principal à gauche (Exact Screenshot) */}
        <section className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 xl:col-span-2">
          <form onSubmit={soumettre} className="space-y-6">

            {/* Destinataires */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                Destinataires <span className="text-[11px] font-normal text-slate-400">(un par ligne ou séparés par virgules)</span>
              </label>
              <textarea
                required
                rows={3}
                value={numeros}
                onChange={(e) => setNumeros(e.target.value)}
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
                <span className="flex items-center gap-1">
                  {contientLien && <Link2 className="h-3.5 w-3.5 text-blue-600" />}
                  {contientLien ? '1 lien intelligent inséré' : ''}
                </span>
                <span>{nbCaracteres} / 160 caractères · {nbSegments} segment{nbSegments > 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Checkbox Générer des liens intelligents */}
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-slate-50/80 p-4 border border-slate-200/80 dark:bg-zinc-800/60 dark:border-zinc-700">
              <input
                type="checkbox"
                checked={lienIntelligent}
                onChange={(e) => setLienIntelligent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
              />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">Générer des liens intelligents</p>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                  Insère une URL courte de suivi unique par destinataire. Insérez <code className="font-mono font-semibold text-slate-700 dark:text-zinc-200">{'{LIEN}'}</code> dans le texte pour définir son emplacement.
                </p>
              </div>
            </label>

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
            </div>

            {/* Bouton pleine largeur */}
            <button
              type="submit"
              disabled={envoiEnCours}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2563EB] py-3.5 text-[13px] font-bold text-white shadow-lg shadow-indigo-300/45 hover:bg-[#1D4ED8] disabled:opacity-60 transition"
            >
              {envoiEnCours ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {envoiEnCours ? 'Expédition en cours...' : 'Envoyer les messages'}
            </button>
          </form>
        </section>

        {/* Colonne Droite (3 Cards - Exact Screenshot) */}
        <div className="space-y-6">

          {/* Card 1 : Aperçu sur mobile */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Aperçu sur mobile</h3>

            <div className="rounded-[2.2rem] bg-slate-950 p-4 border-4 border-slate-900 shadow-xl space-y-3">
              <p className="text-[10px] text-slate-400 text-center">SMS · aujourd'hui 09:12</p>

              <div className="rounded-2xl bg-[#1d1947] p-3 text-xs text-white leading-relaxed border border-indigo-900/50 space-y-2">
                <p>
                  Bonjour ! Votre commande #4821 est prête. Retrait possible dès aujourd'hui au magasin. Merci !{' '}
                  <span className="text-blue-400 underline font-mono text-[11px]">smska.mg/l/x7K2p</span>
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
                <span><b>Limite de destinataires</b> : jusqu'à 100 numéros par lot.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span><b>Format international</b> : préférez la forme E.164 (ex. +261...).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span><b>Liens suivis</b> : ajoutez {`{LIEN}`} pour mesurer les clics.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span><b>Quota</b> : 20 SMS/h par téléphone du parc.</span>
              </li>
            </ul>
          </div>

          {/* Card 3 : Modèles rapides */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Modèles rapides</h3>

            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => appliquerModele("Bonjour ! Votre commande #4821 est prête. Retrait possible dès aujourd'hui au magasin. Merci ! {LIEN}")}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-200"
              >
                Confirmation commande
              </button>
              <button
                type="button"
                onClick={() => appliquerModele("Rappel : Votre rendez-vous est confirmé pour demain à 10:00 au cabinet. {LIEN}")}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-200"
              >
                Rappel rendez-vous
              </button>
              <button
                type="button"
                onClick={() => appliquerModele("Promo Flash ! Profitez de -20% sur tout le magasin ce week-end avec le code PROMO20. {LIEN}")}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-200"
              >
                Promo du jour
              </button>
              <button
                type="button"
                onClick={() => appliquerModele("Votre colis est en cours de livraison par notre livreur. Suivez votre colis ici : {LIEN}")}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-200"
              >
                Livraison en route
              </button>
            </div>
          </div>

        </div>
      </div>

      <Toast notification={notification} />
    </CoquilleEspace>
  )
}
