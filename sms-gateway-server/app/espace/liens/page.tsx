'use client'

import { useState, useEffect } from 'react'
import { Link2, MousePointerClick, Search, Plus, Copy, Check, Sparkles } from 'lucide-react'
import CoquilleEspace from '../../../composants/CoquilleEspace'
import { Toast } from '../../../composants/interface'

interface Lien {
  id: string
  numero_destinataire: string
  statut: string
  date_creation: string
  date_clic: string | null
}

export default function PageLiensEspace() {
  const [liens, setLiens] = useState<Lien[]>([])
  const [recherche, setRecherche] = useState('')
  const [urlDest, setUrlDest] = useState('')
  const [nomCampagne, setNomCampagne] = useState('')
  const [copieId, setCopieId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  function afficherNotification(type: 'succes' | 'erreur', texte: string) {
    setNotification({ type, texte })
    setTimeout(() => setNotification(null), 4000)
  }

  useEffect(() => {
    fetch('/api/espace/liens?limit=100')
      .then((r) => r.json())
      .then((d) => {
        setLiens(Array.isArray(d.liens) ? d.liens : [])
      })
      .catch(() => setLiens([]))
  }, [])

  const visibles = liens.filter(l => (l.numero_destinataire || '').includes(recherche))

  const totalLiens = liens.length
  const cliques = liens.filter(l => l.statut === 'CLIQUE').length
  const ouvertures = liens.filter(l => l.statut === 'OUVERT' || l.statut === 'CLIQUE').length
  const tauxClic = totalLiens > 0 ? Math.round((cliques / totalLiens) * 100) : 0

  function copierUrl(id: string) {
    afficherNotification('erreur', 'Aucune URL courte disponible')
    setCopieId(id)
    setTimeout(() => setCopieId(null), 2000)
  }

  return (
    <CoquilleEspace>
      {/* En-tête (Exact Screenshot) */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white">Liens intelligents</h1>
          <p className="mt-1 text-[13.5px] text-slate-500 dark:text-zinc-400">
            Suivez les ouvertures et le taux de clic sur les liens courts intégrés dans vos SMS.
          </p>
        </div>
        <button
          onClick={() => {}}
          className="inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-indigo-300/45 hover:bg-[#1D4ED8] transition"
        >
          <Plus className="h-4 w-4" /> Nouveau lien
        </button>
      </div>

      {/* 4 Stat Cards Row (Exact Screenshot) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1 */}
        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">TOTAL LIENS GÉNÉRÉS</p>
          <p className="text-[30px] font-extrabold leading-none text-slate-900 dark:text-white">{totalLiens}</p>
          <p className="text-[11.5px] text-slate-400">Depuis la création du compte</p>
        </div>

        {/* Card 2 */}
        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">LIENS CLIQUÉS</p>
          <p className="text-[30px] font-extrabold leading-none text-slate-900 dark:text-white">{cliques}</p>
          <p className="text-[11.5px] text-slate-400">{tauxClic} % de taux de clic</p>
        </div>

        {/* Card 3 */}
        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">OUVERTURES UNIQUES</p>
          <p className="text-[30px] font-extrabold leading-none text-slate-900 dark:text-white">{ouvertures}</p>
          <p className="text-[11.5px] text-slate-400">{totalLiens > 0 ? Math.round((ouvertures / totalLiens) * 100) : 0} % d'ouverture</p>
        </div>

        {/* Card 4 */}
        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">REBONDS (404)</p>
          <p className="text-[30px] font-extrabold leading-none text-amber-600 dark:text-amber-400">0</p>
          <p className="text-[11.5px] text-slate-400">Rebonds non suivis</p>
        </div>
      </div>

      {/* Main Grid 2 Cols (Exact Screenshot) */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">

        {/* Left Column (2 cols) : Suivi des ouvertures */}
        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-zinc-800">
            <div>
              <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">Suivi des ouvertures</h2>
              <p className="text-[12px] text-slate-400">{totalLiens} lien(s) listé(s)</p>
            </div>
            <div className="flex w-52 items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-[12.5px] text-slate-400 dark:bg-zinc-800 dark:border-zinc-700">
              <Search className="h-4 w-4" />
              <input
                type="text"
                placeholder="Numéro..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                className="flex-1 bg-transparent focus:outline-none dark:text-zinc-200 text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:border-zinc-800">
                  <th className="pb-3 pr-4">DESTINATAIRE</th>
                  <th className="pb-3 pr-4">STATUT</th>
                  <th className="pb-3 pr-4">CRÉÉ LE</th>
                  <th className="pb-3 pr-4">CLIQUÉ LE</th>
                  <th className="pb-3 pr-4">URL COURTE</th>
                  <th className="pb-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {visibles.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">Aucun lien pour le moment.</td>
                  </tr>
                )}
                {visibles.map((l) => (
                  <tr key={l.id} className="text-slate-700 dark:text-zinc-300">
                    <td className="py-3.5 pr-4 font-mono font-bold text-slate-800 dark:text-zinc-200">{l.numero_destinataire || '—'}</td>
                    <td className="py-3.5 pr-4">
                      {l.statut === 'CLIQUE' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Cliqué
                        </span>
                      ) : l.statut === 'OUVERT' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Ouvert
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Envoyé
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 pr-4 text-slate-400">{l.date_creation ? new Date(l.date_creation).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(':', 'h') : '—'}</td>
                    <td className="py-3.5 pr-4 text-slate-400">{l.date_clic ? new Date(l.date_clic).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(':', 'h') : '—'}</td>
                    <td className="py-3.5 pr-4 font-mono font-semibold text-blue-600 dark:text-indigo-400">—</td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => copierUrl(l.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300"
                      >
                        {copieId === l.id ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        {copieId === l.id ? 'Copié' : 'Copier'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (2 Cards) */}
        <div className="space-y-4">

          {/* Top Card : Taux de clic global (Donut SVG) */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 text-center space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Taux de clic global</h3>

            <div className="relative mx-auto h-28 w-28">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#eef0f8" strokeWidth="10" className="dark:stroke-zinc-800" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="#2563EB" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(tauxClic * 3.267).toFixed(0)} 327`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{tauxClic}%</span>
                <span className="text-[10px] text-slate-400">{cliques} / {totalLiens} liens</span>
              </div>
            </div>

            <div className="space-y-1 text-xs text-slate-500 dark:text-zinc-400 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <p>Basé sur vos {totalLiens} lien(s)</p>
            </div>
          </div>

          {/* Bottom Card : Créer un lien court */}
          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Créer un lien court</h3>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-zinc-400 mb-1">URL de destination</label>
                <input
                  type="text"
                  placeholder="https://mon-site.mg/promo"
                  value={urlDest}
                  onChange={(e) => setUrlDest(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-zinc-400 mb-1">Nom de campagne (optionnel)</label>
                <input
                  type="text"
                  placeholder="Promo du mois"
                  value={nomCampagne}
                  onChange={(e) => setNomCampagne(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <button
                onClick={() => { afficherNotification('erreur', 'Création de lien indisponible pour le moment') }}
                className="w-full rounded-full bg-[#2563EB] py-3 text-xs font-bold text-white shadow-md hover:bg-[#1D4ED8] transition flex items-center justify-center gap-2 mt-2"
              >
                <Link2 className="h-3.5 w-3.5" /> Générer le lien
              </button>
            </div>
          </div>

          {/* Green Tip Box */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300 flex items-start gap-3">
            <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <b>Astuce :</b> ajoutez <code className="font-mono font-semibold">{'{LIEN}'}</code> dans vos SMS pour insérer automatiquement un lien suivi unique par destinataire.
            </p>
          </div>

        </div>

      </div>

      <Toast notification={notification} />
    </CoquilleEspace>
  )
}
