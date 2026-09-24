import { supabaseAdmin } from './supabase-serveur'

/**
 * Routage d'un SMS entrant vers le client API concerné.
 * Le téléphone transfère tout bêtement ; l'intelligence est ici.
 */

/** Normalisation légère : espaces/points/tirets retirés, 00 → +. */
export function normaliserNumero(brut: string): string {
  let nettoye = brut.replace(/[\s.\-()]/g, '')
  if (nettoye.startsWith('00')) nettoye = '+' + nettoye.slice(2)
  return nettoye
}

export interface ResolutionEntrant {
  idApplication: string | null
  source: 'correlation' | 'sim_dediee' | null
}

export async function resoudreClientEntrant(
  expediteur: string,
  idAppareil: string
): Promise<ResolutionEntrant> {
  // 1. Corrélation : dernier message sortant vers ce numéro (30 jours).
  //    Une réponse appartient au client qui avait initié la conversation.
  const depuis = new Date(Date.now() - 30 * 86400_000).toISOString()
  const { data: sortants } = await supabaseAdmin
      .from('taches')
    .select('id_application')
    .eq('numero_destinataire', expediteur)
    .not('id_application', 'is', null)
    .gte('date_creation', depuis)
    .order('date_creation', { ascending: false })
    .limit(1)
  const candidat = (sortants?.[0]?.id_application as string | null) ?? null
  if (candidat) return { idApplication: candidat, source: 'correlation' }

  // 2. SIM dédiée : appareil affecté à un client (numéro SAV/support).
  const { data: appareil } = await supabaseAdmin
    .from('appareils')
    .select('id_application')
    .eq('id', idAppareil)
    .single()
  const affecte = (appareil as { id_application: string | null } | null)?.id_application ?? null
  if (affecte) return { idApplication: affecte, source: 'sim_dediee' }

  // 3. Sinon : dashboard uniquement (aucune notification).
  return { idApplication: null, source: null }
}
