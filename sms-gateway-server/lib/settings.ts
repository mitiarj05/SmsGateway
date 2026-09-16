import { supabaseAdmin } from './supabase-server'

/** Clés gérées + défauts (utilisés si la table/valeur est absente). */
export const SETTINGS_DEFAULTS = {
  sms_quota_per_hour: 20,
  queue_alert_threshold: 10,
  max_pending_hours: 24,
} as const

export type SettingKey = keyof typeof SETTINGS_DEFAULTS

const INT_KEYS: SettingKey[] = ['sms_quota_per_hour', 'queue_alert_threshold', 'max_pending_hours']

export function isSettingKey(key: string): key is SettingKey {
  return key in SETTINGS_DEFAULTS
}

/** Valide une valeur de setting (entiers 1..1000). */
export function validateSettingValue(key: SettingKey, value: unknown): string | null {
  const n = typeof value === 'string' ? Number(value) : value
  if (!Number.isInteger(n) || (n as number) < 1 || (n as number) > 1000) {
    return `Valeur invalide pour ${key} (entier 1..1000 attendu)`
  }
  return null
}

function parseIntSetting(key: SettingKey, raw: string | null): number {
  const n = raw === null ? NaN : Number(raw)
  if (!Number.isInteger(n) || n < 1 || n > 1000) return SETTINGS_DEFAULTS[key]
  return n
}

/**
 * Lit un setting entier. Retourne le défaut si la table/valeur est
 * absente ou invalide (avec warning — la table est créée par sql/add-settings.sql).
 */
export async function getIntSetting(key: SettingKey): Promise<number> {
  try {
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('valeur')
      .eq('cle', key)
      .single()
    if (error || !data) {
      console.warn(`getIntSetting: ${key} illisible (${error?.message ?? 'absent'}), défaut ${SETTINGS_DEFAULTS[key]}`)
      return SETTINGS_DEFAULTS[key]
    }
    return parseIntSetting(key, data.valeur)
  } catch (err) {
    console.warn(`getIntSetting: ${key} erreur, défaut ${SETTINGS_DEFAULTS[key]}`, err)
    return SETTINGS_DEFAULTS[key]
  }
}

/** Lit tous les settings connus (+ défauts pour les absents). */
export async function getAllSettings(): Promise<Record<SettingKey, number>> {
  const [sms_quota_per_hour, queue_alert_threshold, max_pending_hours] = await Promise.all([
    getIntSetting('sms_quota_per_hour'),
    getIntSetting('queue_alert_threshold'),
    getIntSetting('max_pending_hours'),
  ])
  return { sms_quota_per_hour, queue_alert_threshold, max_pending_hours }
}

export { INT_KEYS }
