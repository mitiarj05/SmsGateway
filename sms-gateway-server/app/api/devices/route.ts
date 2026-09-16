import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { markStaleDevicesOffline } from '@/lib/device-status'

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

    return NextResponse.json({ devices: data })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
