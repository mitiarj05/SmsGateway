'use client'

import { useState, useEffect, useCallback } from 'react'
import { Receipt, RefreshCw, Download, AlertTriangle } from 'lucide-react'
import CoquilleTableauDeBord from '../../composants/CoquilleTableauDeBord'
import { Toast } from '../../composants/interface'

interface Ligne {
  id_application: string
  nom: string
  mois: string
  total_facture: number
  sms_envoyes: number
  sms_recus: number
  clics: number
  echecs: number
  quota_mensuel: number | null
  depassement: boolean
}

function moisCourant(): string {
  const maintenant = new Date()
  return `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}`
}

export default function PageFacturation() {
  const [lignes, setLignes] = useState<Ligne[]>([])
  const [totaux, setTotaux] = useState({ total_facture: 0, sms_envoyes: 0, sms_recus: 0, clics: 0, echecs: 0 })
  const [mois, setMois] = useState(moisCourant())
  const [chargement, setChargement] = useState(true)
  const [actualisationEnCours, setActualisationEnCours] = useState(false)
  const [quotaEditions, setQuotaEditions] = useState<Record<string, string>>({})
  const [notification, setNotification] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  function afficherNotification(type: 'succes' | 'erreur', texte: string) {
    setNotification({ type, texte })
    setTimeout(() => setNotification(null), 4000)
  }

  const chargerDonnees = useCallback(async (moisCible: string, silencieux = false) => {
    if (!silencieux) setActualisationEnCours(true)
    try {
      const reponse = await fetch(`/api/facturation?mois=${moisCible}`)
      const donnees = await reponse.json()
      if (donnees.lignes) {
        setLignes(donnees.lignes)
        setTotaux(donnees.totaux)
        const brouillons: Record<string, string> = {}
        for (const l of donnees.lignes as Ligne[]) {
          brouillons[l.id_application] = l.quota_mensuel === null ? '' : String(l.quota_mensuel)
        }
        setQuotaEditions(brouillons)
      } else if (donnees.error) {
        afficherNotification('erreur', donnees.error)
      }
    } finally {
      setChargement(false)
      setActualisationEnCours(false)
    }
  }, [])

  useEffect(() => { chargerDonnees(mois, true) }, [chargerDonnees, mois])

  async function enregistrerQuota(idApplication: string) {
    const brut = (quotaEditions[idApplication] ?? '').trim()
    try {
      const reponse = await fetch(`/api/api-clients/${idApplication}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quota_mensuel: brut === '' ? null : Number(brut) }),
      })
      const donnees = await reponse.json().catch(() => null)
      if (reponse.ok) {
        afficherNotification('succes', 'Quota enregistré')
        chargerDonnees(mois, true)
      } else {
        afficherNotification('erreur', donnees?.error ?? 'Erreur enregistrement')
      }
    } catch {
      afficherNotification('erreur', 'Erreur réseau')
    }
  }

  function exporterCSV() {
    const entete = 'client;total_facture;envoyes;recus;clics;echecs;quota;depassement\n'
    const lignesCsv = lignes.map((l) =>
      [l.nom, l.total_facture, l.sms_envoyes, l.sms_recus, l.clics, l.echecs,
        l.quota_mensuel ?? '', l.depassement ? 'oui' : 'non'].join(';')
    ).join('\n')
    const blob = new Blob(['\uFEFF' + entete + lignesCsv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const lien = document.createElement('a')
    lien.href = url
    lien.download = `facturation-${mois}.csv`
    lien.click()
    URL.revokeObjectURL(url)
  }

  if (chargement) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500">Chargement…</p>
      </div>
    )
  }

  return (
    <CoquilleTableauDeBord
      titre="Facturation"
      sousTitre={`${totaux.total_facture} unité(s) en ${mois}`}
      actions={
        <>
          <input type="month" value={mois} onChange={(e) => e.target.value && setMois(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200" />
          <button onClick={() => chargerDonnees(mois)}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-600 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
            <RefreshCw className={`h-4 w-4 ${actualisationEnCours ? 'animate-spin' : ''}`} /> Actualiser
          </button>
          <button onClick={exporterCSV}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-600 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
            <Download className="h-4 w-4" /> CSV
          </button>
        </>
      }
    >
      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
        <div className="flex items-center gap-2 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <Receipt className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Consommation par client</h2>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            {lignes.length}
          </span>
        </div>
        {lignes.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-400">Aucun client ce mois-ci.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800">
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3 text-right">Facturé</th>
                  <th className="px-5 py-3 text-right">Envoyés</th>
                  <th className="px-5 py-3 text-right">Reçus</th>
                  <th className="px-5 py-3 text-right">Clics</th>
                  <th className="px-5 py-3 text-right">Échecs</th>
                  <th className="px-5 py-3 w-44">Quota mensuel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
                {lignes.map((l) => {
                  const pct = l.quota_mensuel ? Math.min(100, Math.round((l.total_facture / l.quota_mensuel) * 100)) : 0
                  return (
                    <tr key={l.id_application} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200">
                          {l.nom}
                          {l.depassement && (
                            <span title="Quota dépassé" className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
                              <AlertTriangle className="h-3 w-3" /> dépassé
                            </span>
                          )}
                        </span>
                        {l.quota_mensuel !== null && (
                          <div className="mt-1.5 h-1.5 w-32 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <div className={`h-full rounded-full ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold tabular-nums text-zinc-900 dark:text-white">{l.total_facture}</td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-zinc-500 dark:text-zinc-400">{l.sms_envoyes}</td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-zinc-500 dark:text-zinc-400">{l.sms_recus}</td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-zinc-500 dark:text-zinc-400">{l.clics}</td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-zinc-500 dark:text-zinc-400">{l.echecs}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-1.5">
                          <input type="number" min={1} placeholder="∞" value={quotaEditions[l.id_application] ?? ''}
                            onChange={(e) => setQuotaEditions((p) => ({ ...p, [l.id_application]: e.target.value }))}
                            className="w-20 rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200" />
                          <button onClick={() => enregistrerQuota(l.id_application)}
                            className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700">
                            OK
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-zinc-400">
        1 unité facturée = 1 tâche créée dans le mois. Vide = quota illimité. Au-delà du quota, l&apos;API répond 429.
      </p>

      <Toast notification={notification} />
    </CoquilleTableauDeBord>
  )
}
