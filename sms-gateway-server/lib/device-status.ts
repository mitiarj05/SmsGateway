import { supabaseAdmin } from './supabase-server'

/**
 * Détection des devices morts : le téléphone polle toutes les 30 s.
 * Au-delà de ce délai sans activité, ONLINE/BUSY => OFFLINE.
 * DISABLED n'est jamais touché (action manuelle admin).
 */
export const OFFLINE_AFTER_SECONDS = 90

export function staleThresholdIso(): string {
  return new Date(Date.now() - OFFLINE_AFTER_SECONDS * 1000).toISOString()
}

/**
 * Bascule paresseusement les devices silencieux en OFFLINE.
 * Appelé en tête des lectures (liste, détail, sélection) : pas besoin de cron,
 * la base reste vraie pour tous les consommateurs (dashboard, selectBestDevice).
 */
export async function markStaleDevicesOffline(): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('devices')
    .update({ statut: 'OFFLINE' })
    .in('statut', ['ONLINE', 'BUSY'])
    .lt('derniere_activite', staleThresholdIso())
    .select('id')

  if (error) {
    console.warn(`markStaleDevicesOffline: impossible (${error.message})`)
    return 0
  }
  const n = data?.length ?? 0
  if (n > 0) {
    console.warn(`markStaleDevicesOffline: ${n} device(s) passé(s) OFFLINE (silence > ${OFFLINE_AFTER_SECONDS}s)`)
  }
  return n
}
