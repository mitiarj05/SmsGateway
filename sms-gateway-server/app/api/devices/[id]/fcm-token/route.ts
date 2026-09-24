import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { authentifierAppareil } from '@/lib/authentification'

/** POST /api/appareils/[id]/fcm-token — met à jour le token FCM (auth appareil). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idAppareil } = await params

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Header Authorization manquant ou mal formé' },
        { status: 401 }
      )
    }
    const jeton = authHeader.substring(7)

    const appareil = await authentifierAppareil(idAppareil, jeton)
    if (!appareil) {
      return NextResponse.json(
        { error: 'Appareil inconnu ou token invalide' },
        { status: 401 }
      )
    }

    const corps = await request.json()
    const { fcm_token } = corps

    if (!fcm_token || typeof fcm_token !== 'string') {
      return NextResponse.json(
        { error: 'Le champ "fcm_token" est obligatoire' },
        { status: 400 }
      )
    }

    // Mettre à jour le token FCM de l'appareil
    const { error } = await supabaseAdmin
      .from('appareils')
      .update({ jeton_fcm: fcm_token })
      .eq('id', idAppareil)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      { message: 'Token FCM mis à jour' },
      { status: 200 }
    )
  } catch {
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
