import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { authenticateDevice } from '@/lib/auth'

/**
 * POST /api/devices/[id]/offline — le téléphone signale son arrêt
 * (bouton Déconnecter, service tué). Auth : Bearer token du device.
 * Met OFFLINE, jamais DISABLED (réservé à l'admin).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deviceId } = await params

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Header Authorization manquant ou mal formé' },
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

    if (device.statut === 'DISABLED') {
      return NextResponse.json({ device: { id: deviceId, statut: 'DISABLED' } })
    }

    const { error } = await supabaseAdmin
      .from('devices')
      .update({
        statut: 'OFFLINE',
        derniere_activite: new Date().toISOString(),
      })
      .eq('id', deviceId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ device: { id: deviceId, statut: 'OFFLINE' } })
  } catch {
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
