import { supabaseAdmin } from './supabase-serveur'
import { STATUT_APPAREIL } from './statuts'

/**
 * Modèle étendu (optionnel) : un appareil peut servir des applications
 * supplémentaires sans quitter l'espace de son propriétaire.
 *  - id_application : l'espace du propriétaire (l'appareil s'affiche chez lui) ;
 *  - id_applications_supplementaires : des bénéficiaires de SMS supplémentaires,
 *    hébergés temporairement sur la SIM du propriétaire (démo, passage, surcroît).
 *
 * La colonne est optionnelle : tant qu'elle n'existe pas en base, chaque
 * fonction retombe sur l'ancien modèle, sans faire d'erreur (production saine).
 */

interface FicheAppareil {
  principale: string | null
  beneficiaires: string[] | null
}

async function lireFicheAppareil(idAppareil: string): Promise<FicheAppareil> {
  const fiche: FicheAppareil = { principale: null, beneficiaires: null }
  const { data: simple, error: erreurSimple } = await supabaseAdmin
    .from('appareils')
    .select('id_application')
    .eq('id', idAppareil)
    .single()
  if (erreurSimple || !simple) return fiche
  fiche.principale = (simple as { id_application: string | null }).id_application ?? null

  // Colonne optionnelle : si elle n'existe pas encore, l'erreur est ignorée.
  const { data: complete, error: erreurComplete } = await supabaseAdmin
    .from('appareils')
    .select('id_applications_supplementaires')
    .eq('id', idAppareil)
    .single()
  if (!erreurComplete && complete) {
    fiche.beneficiaires =
      (complete as { id_applications_supplementaires: string[] | null }).id_applications_supplementaires ?? null
  }
  return fiche
}

/** Toutes les applications que l'appareil sert : son espace + ses bénéficiaires. */
export async function applicationsServiesParAppareil(idAppareil: string): Promise<string[]> {
  const fiche = await lireFicheAppareil(idAppareil)
  const ids = [fiche.principale, ...(fiche.beneficiaires ?? [])].filter((v): v is string => Boolean(v))
  return [...new Set(ids)]
}

/**
 * Nombre d'appareils capables de travailler pour une application :
 * son parc propre, plus les appareils qui la servent en bénéficiaire.
 * Utilisé par le contrôle d'envoi (ne jamais créer de tâche sans exécutant possible).
 */
export async function compterParc(idApplication: string): Promise<number> {
  const { count: principal } = await supabaseAdmin
    .from('appareils')
    .select('id', { count: 'exact', head: true })
    .eq('id_application', idApplication)
  if (principal && principal > 0) return principal

  const { count: partage } = await supabaseAdmin
    .from('appareils')
    .select('id', { count: 'exact', head: true })
    .overlaps('id_applications_supplementaires', [idApplication])
  return partage ?? 0
}

/**
 * Appareils en ligne qui servent cette application comme bénéficiaire
 * (même forme que la requête parc principal : id, nom, jeton_fcm).
 * Colonne absente en base → liste vide, aucun effet de bord.
 */
export async function appareilsBeneficiairesEnLigne(
  idApplication: string
): Promise<{ id: string; nom: string; jeton_fcm: string }[]> {
  const { data, error } = await supabaseAdmin
    .from('appareils')
    .select('id, nom, jeton_fcm')
    .eq('statut', STATUT_APPAREIL.EN_LIGNE)
    .not('jeton_fcm', 'is', null)
    .overlaps('id_applications_supplementaires', [idApplication])
  if (error || !data) return []
  return data as { id: string; nom: string; jeton_fcm: string }[]
}
