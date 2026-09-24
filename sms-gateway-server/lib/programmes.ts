import { supabaseAdmin } from './supabase-serveur'
import { STATUT_MESSAGE } from './statuts'

/**
 * Promotion des envois différés : un PROGRAMME dont l'heure est arrivée
 * devient EN_ATTENTE (prise en charge à la scrutation suivante). Déclenchée
 * paresseusement à chaque point d'entrée fréquent : pas besoin de cron.
 * Si la colonne n'existe pas (migration non jouée), ne fait rien.
 */
export async function promouvoirProgrammes(): Promise<number> {
  try {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .update({ statut: STATUT_MESSAGE.EN_ATTENTE, date_modification: new Date().toISOString() })
      .eq('statut', STATUT_MESSAGE.PROGRAMME)
      .lte('programme_a', new Date().toISOString())
      .select('id')

    if (error) {
      // Colonne absente ou autre : on log une fois, sans bloquer.
      console.warn(`promouvoirProgrammes: impossible (${error.message})`)
      return 0
    }

    const n = data?.length ?? 0
    if (n > 0) {
      console.warn(`promouvoirProgrammes: ${n} tâche(s) programmée(s) -> EN_ATTENTE`)
    }
    return n
  } catch (erreur) {
    console.warn('promouvoirProgrammes: erreur', erreur)
    return 0
  }
}
