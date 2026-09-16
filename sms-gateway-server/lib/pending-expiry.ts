import { supabaseAdmin } from './supabase-server'
import { getIntSetting } from './settings'

/**
 * Expiration des tâches en attente : une PENDING non assignée créée il y a
 * plus de `max_pending_hours` passe en FAILED (au lieu d'attendre
 * indéfiniment un device). Déclenchée paresseusement à chaque point
 * d'entrée fréquent (envoi, polling, lectures dashboard) : pas besoin de cron.
 *
 * Seules les PENDING non assignées expirent. Les SENDING bloquées sont déjà
 * gérées par le timeout de 5 min au polling (retour en PENDING).
 */
export async function expireStalePending(): Promise<number> {
  const maxHours = await getIntSetting('max_pending_hours')
  const cutoff = new Date(Date.now() - maxHours * 3600_000).toISOString()

  const { data, error } = await supabaseAdmin
    .from('sms_tasks')
    .update({
      statut: 'FAILED',
      error_message: `Aucun device disponible sous ${maxHours}h`,
      updated_at: new Date().toISOString(),
    })
    .eq('statut', 'PENDING')
    .is('device_id', null)
    .lt('created_at', cutoff)
    .select('id')

  if (error) {
    console.warn(`expireStalePending: impossible (${error.message})`)
    return 0
  }

  const n = data?.length ?? 0
  if (n > 0) {
    console.warn(`expireStalePending: ${n} PENDING -> FAILED (délai ${maxHours}h)`)
  }
  return n
}
