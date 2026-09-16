import { NextRequest, NextResponse } from 'next/server'
import { authenticateDevice } from '@/lib/auth'
import { getIntSetting } from '@/lib/settings'
import { getDeviceUsage, getRetryAfterSeconds } from '@/lib/select-device'

/**
 * GET /api/devices/[id]/quota — quota et usage horaire du device.
 * Auth : Bearer token du device (comme le polling).
 * Utilisé par l'app Android (écran Statut / Réglages, quota imposé par le serveur).
 */
export async function GET(
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

    const quota = await getIntSetting('sms_quota_per_hour')
    const usage = await getDeviceUsage(deviceId)
    const quotaReached = usage >= quota

    return NextResponse.json(
      {
        quota,
        usage,
        remaining: Math.max(0, quota - usage),
        quota_reached: quotaReached,
        retry_after_seconds: quotaReached ? await getRetryAfterSeconds(deviceId) : 0,
      },
      { status: 200 }
    )
  } catch {
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
