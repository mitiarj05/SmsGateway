import { supabaseAdmin } from './supabase-serveur'

/** Clés gérées + défauts (utilisés si la table/valeur est absente). */
export const PARAMETRES_DEFAUT = {
  sms_quota_per_hour: 20,
  queue_alert_threshold: 10,
  max_pending_hours: 24,
} as const

export type CleParametre = keyof typeof PARAMETRES_DEFAUT

const CLES_ENTIERES: CleParametre[] = ['sms_quota_per_hour', 'queue_alert_threshold', 'max_pending_hours']

export function estCleParametre(cle: string): cle is CleParametre {
  return cle in PARAMETRES_DEFAUT
}

/** Valide une valeur de paramètre (entiers 1..1000). */
export function validerValeurParametre(cle: CleParametre, valeur: unknown): string | null {
  const n = typeof valeur === 'string' ? Number(valeur) : valeur
  if (!Number.isInteger(n) || (n as number) < 1 || (n as number) > 1000) {
    return `Valeur invalide pour ${cle} (entier 1..1000 attendu)`
  }
  return null
}

function analyserParametreEntier(cle: CleParametre, brut: string | null): number {
  const n = brut === null ? NaN : Number(brut)
  if (!Number.isInteger(n) || n < 1 || n > 1000) return PARAMETRES_DEFAUT[cle]
  return n
}

/**
 * Lit un paramètre entier. Retourne le défaut si la table/valeur est
 * absente ou invalide (avec warning — table créée par migration SQL).
 */
export async function obtenirParametreEntier(cle: CleParametre): Promise<number> {
  try {
    // .limit(1) + première ligne : tolère les doublons (table sans PK
    // si la migration add-settings.sql n'a pas été jouée proprement).
    const { data: donnees, error } = await supabaseAdmin
      .from('parametres')
      .select('valeur')
      .eq('cle', cle)
      .limit(1)
    const valeurLue = donnees?.[0]?.valeur ?? null
    if (error || valeurLue === null) {
      console.warn(`obtenirParametreEntier: ${cle} illisible (${error?.message ?? 'absent'}), défaut ${PARAMETRES_DEFAUT[cle]}`)
      return PARAMETRES_DEFAUT[cle]
    }
    return analyserParametreEntier(cle, valeurLue)
  } catch (err) {
    console.warn(`obtenirParametreEntier: ${cle} erreur, défaut ${PARAMETRES_DEFAUT[cle]}`, err)
    return PARAMETRES_DEFAUT[cle]
  }
}

/** Lit tous les paramètres connus (+ défauts pour les absents). */
export async function obtenirTousParametres(): Promise<Record<CleParametre, number>> {
  const [sms_quota_per_hour, queue_alert_threshold, max_pending_hours] = await Promise.all([
    obtenirParametreEntier('sms_quota_per_hour'),
    obtenirParametreEntier('queue_alert_threshold'),
    obtenirParametreEntier('max_pending_hours'),
  ])
  return { sms_quota_per_hour, queue_alert_threshold, max_pending_hours }
}

export { CLES_ENTIERES }
