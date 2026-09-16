import { supabaseAdmin } from './supabase-server'

const MAX_SMS_PER_HOUR = 20

interface DeviceCandidate {
  id: string
  nom: string
  fcm_token: string
  sms_last_hour: number
}

export async function selectBestDevice(): Promise<DeviceCandidate | null> {
  const { data: devices, error: devicesError } = await supabaseAdmin
    .from('devices')
    .select('id, nom, fcm_token')
    .eq('statut', 'ONLINE')
    .not('fcm_token', 'is', null)

  if (devicesError || !devices || devices.length === 0) {
    console.warn('selectBestDevice: aucun device ONLINE avec fcm_token')
    return null
  }

  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString()

  const candidates: DeviceCandidate[] = []

  for (const device of devices) {
    const { count: recentCount } = await supabaseAdmin
      .from('sms_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('device_id', device.id)
      .eq('statut', 'SENT')
      .gte('updated_at', oneHourAgo)

    const smsLastHour = recentCount ?? 0

    if (smsLastHour >= MAX_SMS_PER_HOUR) {
      continue
    }

    candidates.push({
      id: device.id,
      nom: device.nom,
      fcm_token: device.fcm_token,
      sms_last_hour: smsLastHour,
    })
  }

  if (candidates.length === 0) {
    console.warn('selectBestDevice: aucun device disponible')
    return null
  }

  candidates.sort((a, b) => a.sms_last_hour - b.sms_last_hour)
  return candidates[0]
}