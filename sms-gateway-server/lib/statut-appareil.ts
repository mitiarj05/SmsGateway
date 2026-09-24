import { supabaseAdmin } from './supabase-serveur'
import { STATUT_APPAREIL } from './statuts'

/**
 * Détection des appareils morts : le téléphone scrute toutes les 30 s.
 * Au-delà de ce délai sans activité, EN_LIGNE => HORS_LIGNE.
 * DESACTIVE n'est jamais touché (action manuelle admin).
 */
export const DELAI_HORS_LIGNE_SECONDES = 90

export function seuilInactiviteIso(): string {
  return new Date(Date.now() - DELAI_HORS_LIGNE_SECONDES * 1000).toISOString()
}

/**
 * Bascule paresseusement les appareils silencieux en HORS_LIGNE.
 * Appelé en tête des lectures (liste, détail, sélection) : pas besoin de cron,
 * la base reste vraie pour tous les consommateurs (dashboard, sélection).
 */
export async function marquerAppareilsInactifs(): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('appareils')
    .update({ statut: STATUT_APPAREIL.HORS_LIGNE })
    .eq('statut', STATUT_APPAREIL.EN_LIGNE)
    .lt('derniere_activite', seuilInactiviteIso())
    .select('id')

  if (error) {
    console.warn(`marquerAppareilsInactifs: impossible (${error.message})`)
    return 0
  }
  const n = data?.length ?? 0
  if (n > 0) {
    console.warn(`marquerAppareilsInactifs: ${n} appareil(s) passé(s) HORS_LIGNE (silence > ${DELAI_HORS_LIGNE_SECONDES}s)`)
  }
  return n
}
