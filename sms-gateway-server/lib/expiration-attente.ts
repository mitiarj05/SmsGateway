import { supabaseAdmin } from './supabase-serveur'
import { STATUT_TACHE } from './statuts'
import { obtenirParametreEntier } from './parametres'

/**
 * Expiration des tâches en attente : un message EN_ATTENTE non assigné créé il y a
 * plus de `max_pending_hours` passe en ECHOUE (au lieu d'attendre
 * indéfiniment un appareil). Déclenchée paresseusement à chaque point
 * d'entrée fréquent (envoi, scrutation, lectures dashboard) : pas besoin de cron.
 *
 * Seuls les EN_ATTENTE non assignés expirent. Les RECLAME bloqués sont déjà
 * gérés par le timeout de 5 min à la scrutation (retour en EN_ATTENTE).
 */
export async function expirerEnAttentePerimees(): Promise<number> {
  const heuresMax = await obtenirParametreEntier('max_pending_hours')
  const limite = new Date(Date.now() - heuresMax * 3600_000).toISOString()

  const { data, error } = await supabaseAdmin
      .from('taches')
    .update({
      statut: STATUT_TACHE.ECHOUE,
      message_erreur: `Aucun appareil disponible sous ${heuresMax}h`,
      date_modification: new Date().toISOString(),
    })
    .eq('statut', STATUT_TACHE.EN_ATTENTE)
    .is('id_appareil', null)
    .lt('date_creation', limite)
    .select('id')

  if (error) {
    console.warn(`expirerEnAttentePerimees: impossible (${error.message})`)
    return 0
  }

  const n = data?.length ?? 0
  if (n > 0) {
    console.warn(`expirerEnAttentePerimees: ${n} EN_ATTENTE -> ECHOUE (délai ${heuresMax}h)`)
  }
  return n
}
