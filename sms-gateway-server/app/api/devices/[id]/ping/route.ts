import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { sendNewTaskPush } from '@/lib/send-push'

/** POST /api/devices/[id]/ping — envoie un push test au device */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data: device, error } = await supabaseAdmin
      .from('devices')
      .select('id, nom, fcm_token')
      .eq('id', id)
      .single()

    if (error || !device) {
      return NextResponse.json({ error: 'Device introuvable' }, { status: 404 })
    }
    if (!device.fcm_token) {
      return NextResponse.json({ error: 'Aucun token FCM pour ce device' }, { status: 400 })
    }

    const ok = await sendNewTaskPush(device.fcm_token, 'ping-test')
    return NextResponse.json({ ping_sent: ok, device: { id: device.id, nom: device.nom } })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
