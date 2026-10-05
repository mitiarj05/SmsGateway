import { supabaseAdmin } from './supabase-serveur'
import { STATUT_APPAREIL, STATUT_TACHE } from './statuts'

/**
 * Statistiques publiques (landing) : totaux non sensibles, recalculés
 * au plus toutes les 60 s (cache mémoire par instance).
 */

export interface StatsPubliques {
  smsEnvoyes: number
  appareilsEnLigne: number
  clients: number
}

const DUREE_CACHE_MS = 60_000
let cache: { instant: number; donnees: StatsPubliques } | null = null

export async function obtenirStatsPubliques(): Promise<StatsPubliques> {
  if (cache && Date.now() - cache.instant < DUREE_CACHE_MS) {
    return cache.donnees
  }
  const donnees: StatsPubliques = { smsEnvoyes: 0, appareilsEnLigne: 0, clients: 0 }
  try {
    const [envoyes, enLigne, clients] = await Promise.all([
      supabaseAdmin.from('taches').select('id', { count: 'exact', head: true })
        .eq('statut', STATUT_TACHE.ENVOYE)
        .then((r) => r.count ?? 0),
      supabaseAdmin.from('appareils').select('id', { count: 'exact', head: true })
        .eq('statut', STATUT_APPAREIL.EN_LIGNE)
        .then((r) => r.count ?? 0),
      supabaseAdmin.from('applications').select('id', { count: 'exact', head: true })
        .then((r) => r.count ?? 0),
    ])
    donnees.smsEnvoyes = envoyes
    donnees.appareilsEnLigne = enLigne
    donnees.clients = clients
    cache = { instant: Date.now(), donnees }
  } catch {
    // Base injoignable : zéros (la landing reste affichée).
  }
  return donnees
}

/** Format fr-FR : 12480 -> "12 480". */
export function formaterNombre(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n)
}
