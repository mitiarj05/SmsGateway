import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { authenticateDevice } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deviceId } = await params

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Header Authorization manquant' },
        { status: 401 }
      )
    }
    const token = authHeader.substring(7)

    const device = await authenticateDevice(deviceId, token)
    if (!device) {
      return NextResponse.json(
        { error: 'Device inconnu ou token invalide' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { fcm_token } = body

    if (!fcm_token || typeof fcm_token !== 'string') {
      return NextResponse.json(
        { error: 'Le champ "fcm_token" est obligatoire' },
        { status: 400 }
      )
    }

    // Mettre à jour le token FCM du device
    const { error } = await supabaseAdmin
      .from('devices')
      .update({ fcm_token: fcm_token })
      .eq('id', deviceId)

    if (error) {
      console.error('Erreur Supabase:', error)
      return NextResponse.json(
        { error: 'Erreur mise à jour', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Token FCM mis à jour' },
      { status: 200 }
    )
  } catch (err) {
    console.error('Erreur inattendue:', err)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}