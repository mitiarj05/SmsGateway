import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { envoyerPushNouvelleTache } from '@/lib/envoi-push'

/** POST /api/devices/[id]/ping — envoie un push test à l'appareil */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data: appareil, error } = await supabaseAdmin
      .from('appareils')
      .select('id, nom, jeton_fcm')
      .eq('id', id)
      .single()

    if (error || !appareil) {
      return NextResponse.json({ error: 'Appareil introuvable' }, { status: 404 })
    }
    if (!appareil.jeton_fcm) {
      return NextResponse.json({ error: 'Aucun token FCM pour cet appareil' }, { status: 400 })
    }

    const reussi = await envoyerPushNouvelleTache(appareil.jeton_fcm, 'ping-test')
    return NextResponse.json({ ping_sent: reussi, device: { id: appareil.id, nom: appareil.nom } })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
