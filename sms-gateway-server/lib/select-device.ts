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

  // 🔍 LOGS DÉTAILLÉS
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString()

  console.log('=== selectBestDevice DEBUG ===')
  console.log('Date.now()      :', now.toISOString())
  console.log('oneHourAgo      :', oneHourAgo)
  console.log('Devices ONLINE  :', devices.length)

  const candidates: DeviceCandidate[] = []

  for (const device of devices) {
    // Requête SANS filtre de date pour voir combien il y en a
    const { count: totalCount } = await supabaseAdmin
      .from('sms_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('device_id', device.id)
      .eq('statut', 'SENT')

    // Requête AVEC filtre de date
    const { count: recentCount, error: countError } = await supabaseAdmin
      .from('sms_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('device_id', device.id)
      .eq('statut', 'SENT')
      .gte('updated_at', oneHourAgo)

    console.log(`Device ${device.id} :`)
    console.log(`  Total SENT (toutes dates) : ${totalCount}`)
    console.log(`  SENT depuis ${oneHourAgo} : ${recentCount}`)
    console.log(`  Erreur : ${countError?.message || 'aucune'}`)

    const smsLastHour = recentCount ?? 0

    if (smsLastHour >= MAX_SMS_PER_HOUR) {
      console.log(`  → IGNORÉ (${smsLastHour}/${MAX_SMS_PER_HOUR})`)
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
  const selected = candidates[0]
  console.log(`selectBestDevice: SÉLECTIONNÉ ${selected.id} (${selected.sms_last_hour} SMS)`)
  return selected
}