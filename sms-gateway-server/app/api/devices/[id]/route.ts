import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { markStaleDevicesOffline } from '@/lib/device-status'
import { getDeviceUsage } from '@/lib/select-device'

/** GET /api/devices/[id] — détails d'un device */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await markStaleDevicesOffline()
    const { id } = await params
    const { data, error } = await supabaseAdmin
      .from('devices')
      .select('id, nom, statut, fcm_token, sms_last_hour, derniere_activite, created_at')
      .eq('id', id)
      .single()

    if (error) {
      console.error('GET /api/devices/[id] erreur Supabase:', error)
      return NextResponse.json({ error: 'Device introuvable', details: error.message }, { status: 404 })
    }
    if (!data) {
      return NextResponse.json({ error: 'Device introuvable' }, { status: 404 })
    }

    // Masquer le token FCM pour la sécurité (garder 8 premiers caractères)
    const masked = data.fcm_token
      ? `${data.fcm_token.substring(0, 8)}... (${data.fcm_token.length} chars)`
      : null

    // Compteur live (voir GET /api/devices).
    const smsLastHour = await getDeviceUsage(id)

    return NextResponse.json({ device: { ...data, sms_last_hour: smsLastHour, fcm_token: masked, fcm_present: !!data.fcm_token } })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

/** PATCH /api/devices/[id] — activer/désactiver (body: { statut: "DISABLED" | "OFFLINE" }) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { statut } = body

    if (!['DISABLED', 'OFFLINE'].includes(statut)) {
      return NextResponse.json({ error: 'Statut invalide (DISABLED | OFFLINE)' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('devices')
      .update({ statut })
      .eq('id', id)
      .select('id, nom, statut')
      .single()

    if (error) {
      console.error('PATCH /api/devices/[id] erreur Supabase:', error)
      return NextResponse.json({ error: 'Device introuvable', details: error.message }, { status: 404 })
    }
    if (!data) {
      return NextResponse.json({ error: 'Device introuvable' }, { status: 404 })
    }

    return NextResponse.json({ device: data })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
