import { supabaseAdmin } from './supabase-server'
import { getIntSetting } from './settings'
import { markStaleDevicesOffline } from './device-status'

export interface DeviceCandidate {
  id: string
  nom: string
  fcm_token: string
  /** Envoyés + en cours d'envoi sur la dernière heure (voir getDeviceUsage). */
  sms_last_hour: number
}

export interface DeviceAvailability {
  device: DeviceCandidate | null
  /** true = des devices existent mais tous ont atteint le quota. */
  saturated: boolean
  quota: number
  /** Secondes avant qu'une place se libère (0 si non saturé). */
  retryAfterSeconds: number
}

function hourAgoIso(): string {
  return new Date(Date.now() - 60 * 60 * 1000).toISOString()
}

/**
 * Usage horaire d'un device = SMS envoyés (SENT) + en cours d'envoi (SENDING)
 * sur la dernière heure. Compter les en-cours empêche les rafales rapprochées
 * de contourner le quota : un SMS pas encore confirmé consomme déjà du quota.
 */
export async function getDeviceUsage(deviceId: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from('sms_tasks')
    .select('id', { count: 'exact', head: true })
    .eq('device_id', deviceId)
    .in('statut', ['SENT', 'SENDING'])
    .gte('updated_at', hourAgoIso())

  return count ?? 0
}

/** Plus ancienne activité comptée -> délai avant libération d'une place. */
async function computeRetryAfter(deviceIds: string[], extraIso: string | null): Promise<number> {
  let oldest: string | null = extraIso
  if (deviceIds.length > 0) {
    const { data } = await supabaseAdmin
      .from('sms_tasks')
      .select('updated_at')
      .in('device_id', deviceIds)
      .in('statut', ['SENT', 'SENDING'])
      .gte('updated_at', hourAgoIso())
      .order('updated_at', { ascending: true })
      .limit(1)
    const ts = data?.[0]?.updated_at ?? null
    if (ts && (!oldest || ts < oldest)) oldest = ts
  }
  if (!oldest) return 60
  return Math.max(1, Math.ceil((new Date(oldest).getTime() + 3600_000 - Date.now()) / 1000))
}

export async function getDeviceAvailability(): Promise<DeviceAvailability> {
  const quota = await getIntSetting('sms_quota_per_hour')

  // Les devices morts ne doivent ni être sélectionnés ni recevoir de push.
  await markStaleDevicesOffline()

  const { data: devices, error: devicesError } = await supabaseAdmin
    .from('devices')
    .select('id, nom, fcm_token')
    .eq('statut', 'ONLINE')
    .not('fcm_token', 'is', null)

  if (devicesError || !devices || devices.length === 0) {
    return { device: null, saturated: false, quota, retryAfterSeconds: 0 }
  }

  // Pression globale : les PENDING non assignées consommeront du quota sous peu.
  // Hypothèse conservative : elles iront au device le moins chargé.
  const { data: pendings } = await supabaseAdmin
    .from('sms_tasks')
    .select('created_at')
    .eq('statut', 'PENDING')
    .is('device_id', null)
  const pendingCount = pendings?.length ?? 0
  const oldestPending = (pendings ?? []).reduce<string | null>(
    (min, p) => (!min || p.created_at < min ? p.created_at : min),
    null
  )

  const ranked: { candidate: DeviceCandidate; usage: number }[] = []
  for (const device of devices) {
    const usage = await getDeviceUsage(device.id)
    if (usage < quota) {
      ranked.push({
        candidate: {
          id: device.id,
          nom: device.nom,
          fcm_token: device.fcm_token,
          sms_last_hour: usage,
        },
        usage,
      })
    }
  }
  ranked.sort((a, b) => a.usage - b.usage)

  const onlineIds = devices.map((d) => d.id)
  if (ranked.length === 0) {
    console.warn(`quota: tous les devices saturés (${quota}/h)`)
    return {
      device: null,
      saturated: true,
      quota,
      retryAfterSeconds: await computeRetryAfter(onlineIds, oldestPending),
    }
  }

  const best = ranked[0]
  if (best.usage + pendingCount >= quota) {
    console.warn(`quota: file d'attente saturée (${best.usage} en cours + ${pendingCount} PENDING, quota ${quota}/h)`)
    return {
      device: null,
      saturated: true,
      quota,
      retryAfterSeconds: await computeRetryAfter(onlineIds, oldestPending),
    }
  }

  return { device: best.candidate, saturated: false, quota, retryAfterSeconds: 0 }
}

/** Délai avant libération d'une place pour UN device (0 si sous le quota). */
export async function getRetryAfterSeconds(deviceId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from('sms_tasks')
    .select('updated_at')
    .eq('device_id', deviceId)
    .in('statut', ['SENT', 'SENDING'])
    .gte('updated_at', hourAgoIso())
    .order('updated_at', { ascending: true })
    .limit(1)
  const oldest = data?.[0]?.updated_at ?? null
  if (!oldest) return 60
  return Math.max(1, Math.ceil((new Date(oldest).getTime() + 3600_000 - Date.now()) / 1000))
}

/** Compat : meilleur device ou null (indisponible OU saturé, sans distinction). */
export async function selectBestDevice(): Promise<DeviceCandidate | null> {
  const { device } = await getDeviceAvailability()
  return device
}
