import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { markStaleDevicesOffline } from '@/lib/device-status'
import { getDeviceUsage } from '@/lib/select-device'

export async function GET() {
  try {
    await markStaleDevicesOffline()
    const { data, error } = await supabaseAdmin
      .from('devices')
      .select('id, nom, statut, fcm_token, sms_last_hour, derniere_activite, created_at')
      .order('statut', { ascending: false })
      .order('derniere_activite', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Compteur live : la colonne est persistée à chaque SENT mais peut dater
    // de plus d'1 h — on recalcule sur la fenêtre glissante pour l'affichage.
    const devices = await Promise.all(
      (data ?? []).map(async (d) => ({ ...d, sms_last_hour: await getDeviceUsage(d.id) }))
    )

    return NextResponse.json({ devices })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
