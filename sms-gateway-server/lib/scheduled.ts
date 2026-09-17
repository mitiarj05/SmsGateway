import { supabaseAdmin } from './supabase-server'

/**
 * Promotion des envois différés : une SCHEDULED dont l'heure est arrivée
 * devient PENDING (prise en charge au polling suivant). Déclenchée
 * paresseusement à chaque point d'entrée fréquent : pas besoin de cron.
 * Si la colonne n'existe pas (migration non jouée), ne fait rien.
 */
export async function promoteScheduled(): Promise<number> {
  try {
    const { data, error } = await supabaseAdmin
      .from('sms_tasks')
      .update({ statut: 'PENDING', updated_at: new Date().toISOString() })
      .eq('statut', 'SCHEDULED')
      .lte('scheduled_at', new Date().toISOString())
      .select('id')

    if (error) {
      // Colonne absente ou autre : on log une fois, sans bloquer.
      console.warn(`promoteScheduled: impossible (${error.message})`)
      return 0
    }

    const n = data?.length ?? 0
    if (n > 0) {
      console.warn(`promoteScheduled: ${n} tâche(s) programmée(s) -> PENDING`)
    }
    return n
  } catch (err) {
    console.warn('promoteScheduled: erreur', err)
    return 0
  }
}
