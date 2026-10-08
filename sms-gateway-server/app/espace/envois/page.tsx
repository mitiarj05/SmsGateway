'use client'

import { useState, useEffect, useCallback } from 'react'
import { Send, RefreshCw, Loader2, Search, Download, CheckCircle2, AlertTriangle, BarChart3, Zap, Eye } from 'lucide-react'
import CoquilleEspace from '../../../composants/CoquilleEspace'
import { Toast, Modale } from '../../../composants/interface'

interface Tache {
  id: string
  numero_destinataire: string
  contenu: string
  statut: string
  message_erreur: string | null
  programme_a: string | null
  date_creation: string
}

export default function PageEnvoisEspace() {
  const [taches, setTaches] = useState<Tache[]>([])
  const [chargement, setChargement] = useState(true)
  const [actualisationEnCours, setActualisationEnCours] = useState(false)
  const [recherche, setRecherche] = useState('')
  const [filtreStatut, setFiltreStatut] = useState<'tous' | 'remis' | 'attente' | 'echecs'>('tous')
  const [page, setPage] = useState(1)
  const [tacheDetaillee, setTacheDetaillee] = useState<Tache | null>(null)
  const [notification, setNotification] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  const chargerDonnees = useCallback(async (silencieux = false) => {
    if (!silencieux) setActualisationEnCours(true)
    try {
      const reponse = await fetch('/api/espace/envois?limit=100')
      const donnees = await reponse.json()
      setTaches(Array.isArray(donnees.taches) ? donnees.taches : [])
    } catch {
      setTaches([])
      setNotification({ type: 'erreur', texte: 'Impossible de charger les envois' })
    } finally {
      setChargement(false)
      setActualisationEnCours(false)
    }
  }, [])

  useEffect(() => {
    chargerDonnees(true)
    const interval = setInterval(() => chargerDonnees(true), 10000)
    return () => clearInterval(interval)
  }, [chargerDonnees])

  useEffect(() => {
    setPage(1)
  }, [recherche, filtreStatut])

  const visibles = taches.filter(t => {
    const correspondFiltre =
      filtreStatut === 'tous' ||
      (filtreStatut === 'remis' && t.statut === 'ENVOYE') ||
      (filtreStatut === 'attente' && (t.statut === 'EN_ATTENTE' || t.statut === 'RECLAME')) ||
      (filtreStatut === 'echecs' && t.statut === 'ECHOUE')
    const destinataire = t.numero_destinataire || ''
    const correspondRecherche =
      destinataire.includes(recherche) ||
      (t.contenu && t.contenu.toLowerCase().includes(recherche.toLowerCase()))
    return correspondFiltre && correspondRecherche
  })

  const PAR_PAGE = 15
  const totalPages = Math.max(1, Math.ceil(visibles.length / PAR_PAGE))
  const pageCourante = Math.min(page, totalPages)
  const pageItems = visibles.slice((pageCourante - 1) * PAR_PAGE, pageCourante * PAR_PAGE)

  function exporterCsv() {
    const entete = 'date;destinataire;message;statut;passerelle'
    const corps = visibles.map((t) =>
      [t.date_creation, t.numero_destinataire || '—', `"${(t.contenu || '').replace(/"/g, '""')}"`, t.statut, '—'].join(';')
    )
    const blob = new Blob([[entete, ...corps].join('\n'), '\n'], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'historique-envois.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (chargement) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const totalEnvois = taches.length
  const remisCount = taches.filter(t => t.statut === 'ENVOYE').length
  const attenteCount = taches.filter(t => t.statut === 'EN_ATTENTE' || t.statut === 'RECLAME').length
  const echecsCount = taches.filter(t => t.statut === 'ECHOUE').length
  const tauxReussite = totalEnvois > 0 ? Math.round((remisCount / totalEnvois) * 100) : 0

  return (
    <CoquilleEspace>
      {/* En-tête (Exact Screenshot) */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white">Mes envois</h1>
          <p className="mt-1 text-[13.5px] text-slate-500 dark:text-zinc-400">
            Suivez l'état de traitement et la livraison de vos SMS.
          </p>
        </div>
        <button
          onClick={exporterCsv}
          className="inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-indigo-300/45 hover:bg-[#1D4ED8] transition"
        >
          <Download className="h-4 w-4" /> Exporter CSV
        </button>
      </div>

      {/* 4 Stat Cards Row (Exact Screenshot) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1 */}
        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">TOTAL (7 JOURS)</p>
          <p className="text-[30px] font-extrabold leading-none text-slate-900 dark:text-white">{totalEnvois}</p>
          <p className="text-[11.5px] text-slate-400">{totalEnvois} envoi(s) chargé(s)</p>
        </div>

        {/* Card 2 */}
        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">REMIS</p>
          <p className="text-[30px] font-extrabold leading-none text-emerald-600 dark:text-emerald-400">{remisCount}</p>
          <p className="text-[11.5px] text-slate-400">{tauxReussite} % de réussite</p>
        </div>

        {/* Card 3 */}
        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">EN ATTENTE</p>
          <p className="text-[30px] font-extrabold leading-none text-amber-600 dark:text-amber-400">{attenteCount}</p>
          <p className="text-[11.5px] text-slate-400">Dans la file</p>
        </div>

        {/* Card 4 */}
        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">ÉCHECS</p>
          <p className="text-[30px] font-extrabold leading-none text-rose-600 dark:text-rose-400">{echecsCount}</p>
          <p className="text-[11.5px] text-slate-400">À vérifier dans l'historique</p>
        </div>
      </div>

      {/* Main Table Card (Exact Screenshot) */}
      <div className="mt-4 rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-6 dark:bg-zinc-900 dark:border-zinc-800 space-y-4">

        {/* Header filtres & recherche */}
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">Historique d'expédition</h2>
            <p className="text-[12px] text-slate-400">{totalEnvois} envoi(s) répertorié(s)</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFiltreStatut('tous')}
                className={`rounded-full px-4 py-1.5 text-[12px] font-bold transition ${filtreStatut === 'tous' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:text-zinc-400'}`}
              >
                Tous
              </button>
              <button
                onClick={() => setFiltreStatut('remis')}
                className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition ${filtreStatut === 'remis' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:text-zinc-400'}`}
              >
                Remis
              </button>
              <button
                onClick={() => setFiltreStatut('attente')}
                className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition ${filtreStatut === 'attente' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:text-zinc-400'}`}
              >
                En attente
              </button>
              <button
                onClick={() => setFiltreStatut('echecs')}
                className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition ${filtreStatut === 'echecs' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:text-zinc-400'}`}
              >
                Échecs
              </button>
            </div>

            <div className="flex w-52 items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-[12.5px] text-slate-400 dark:bg-zinc-800 dark:border-zinc-700">
              <Search className="h-4 w-4" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                className="flex-1 bg-transparent focus:outline-none dark:text-zinc-200 text-xs"
              />
            </div>

            <button
              onClick={() => chargerDonnees(false)}
              disabled={actualisationEnCours}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-[12.5px] font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${actualisationEnCours ? 'animate-spin' : ''}`} /> Actualiser
            </button>
          </div>
        </div>

        {/* Table Rows (Exact Screenshot) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:border-zinc-800">
                <th className="pb-3 pr-4">DATE</th>
                <th className="pb-3 pr-4">DESTINATAIRE</th>
                <th className="pb-3 pr-4">MESSAGE</th>
                <th className="pb-3 pr-4 font-center text-center">STATUT</th>
                <th className="pb-3 pr-4">PASSERELLE</th>
                <th className="pb-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {visibles.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Aucun envoi pour le moment.</td>
                </tr>
              )}
              {pageItems.map((t) => {
                const estRemis = t.statut === 'ENVOYE'
                const estAttente = t.statut === 'EN_ATTENTE' || t.statut === 'RECLAME'
                const dateStr = t.date_creation
                  ? new Date(t.date_creation).toLocaleString('fr-FR', {
                      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                    }).replace(':', 'h').replace(' ', ' ')
                  : '—'
                return (
                  <tr key={t.id} className="text-slate-700 dark:text-zinc-300 hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
                    <td className="py-3.5 pr-4 text-slate-500 font-mono text-[11px]">{dateStr}</td>
                    <td className="py-3.5 pr-4 font-mono font-bold text-slate-800 dark:text-zinc-200">{t.numero_destinataire || '—'}</td>
                    <td className="py-3.5 pr-4 max-w-xs truncate text-slate-600 dark:text-zinc-300" title={t.contenu || ''}>{t.contenu || '—'}</td>
                    <td className="py-3.5 pr-4 text-center">
                      {estRemis && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Remis
                        </span>
                      )}
                      {estAttente && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> En attente
                        </span>
                      )}
                      {!estRemis && !estAttente && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-[11px] font-bold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Échec
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 pr-4 text-slate-500">—</td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => setTacheDetaillee(t)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300"
                      >
                        Détails
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination Row (Exact Screenshot) */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400 dark:border-zinc-800">
          <span>{visibles.length} résultat(s) — page {pageCourante} sur {totalPages}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pageCourante <= 1}
              className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
            >
              ‹ Préc.
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
              Math.max(0, Math.min(pageCourante - 2, totalPages - 3)), Math.max(3, Math.min(pageCourante + 1, totalPages))
            ).slice(0, 3).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  n === pageCourante
                    ? 'bg-[#2563EB] font-bold text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-zinc-300'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={pageCourante >= totalPages}
              className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
            >
              Suiv. ›
            </button>
          </div>
        </div>
      </div>

      {/* 3 Mini-Cards Insight (Exact Screenshot) */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-5 dark:bg-zinc-900 dark:border-zinc-800 space-y-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <BarChart3 className="h-4 w-4" />
          </div>
          <p className="text-xs font-bold text-slate-900 dark:text-white">Taux de remise</p>
          <p className="text-[11.5px] text-slate-400">{remisCount} remis sur {totalEnvois} · {tauxReussite} % de réussite</p>
        </div>

        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-5 dark:bg-zinc-900 dark:border-zinc-800 space-y-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <Zap className="h-4 w-4" />
          </div>
          <p className="text-xs font-bold text-slate-900 dark:text-white">Volume chargé</p>
          <p className="text-[11.5px] text-slate-400">{totalEnvois} SMS sur la période chargée</p>
        </div>

        <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-card p-5 dark:bg-zinc-900 dark:border-zinc-800 space-y-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
            <Eye className="h-4 w-4" />
          </div>
          <p className="text-xs font-bold text-slate-900 dark:text-white">Échecs à vérifier</p>
          <p className="text-[11.5px] text-slate-400">{echecsCount} envoi(s) en échec dans l'historique</p>
        </div>
      </div>

      {/* Modal fiche tâche */}
      <Modale ouvert={!!tacheDetaillee} onFermer={() => setTacheDetaillee(null)} large titre="Détail de l'envoi">
        {tacheDetaillee && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <p className="font-mono font-bold text-sm text-slate-900 dark:text-white">{tacheDetaillee.numero_destinataire || '—'}</p>
              <span className="font-bold text-emerald-600">{tacheDetaillee.statut}</span>
            </div>
            <p className="rounded-xl bg-slate-50 p-3 text-slate-700 dark:bg-zinc-800 dark:text-zinc-200">{tacheDetaillee.contenu || '—'}</p>
            {tacheDetaillee.message_erreur && (
              <p className="text-red-500">{tacheDetaillee.message_erreur}</p>
            )}
            <p className="text-[11px] text-slate-400">Date : {tacheDetaillee.date_creation ? new Date(tacheDetaillee.date_creation).toLocaleString('fr-FR') : '—'}</p>
          </div>
        )}
      </Modale>

      <Toast notification={notification} />
    </CoquilleEspace>
  )
}
