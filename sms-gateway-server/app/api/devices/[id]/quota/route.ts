import { NextRequest, NextResponse } from 'next/server'
import { authentifierAppareil } from '@/lib/authentification'
import { obtenirParametreEntier } from '@/lib/parametres'
import { obtenirUsageAppareil, obtenirDelaiAttenteSecondes } from '@/lib/selection-appareil'

/**
 * GET /api/appareils/[id]/quota — quota et usage horaire de l'appareil.
 * Auth : Bearer token de l'appareil (comme la scrutation).
 * Utilisé par l'app Android (écran Statut / Réglages, quota imposé par le serveur).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appareilId } = await params

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Header Authorization manquant ou mal formé' },
        { status: 401 }
      )
    }
    const jeton = authHeader.substring(7)

    const appareil = await authentifierAppareil(appareilId, jeton)
    if (!appareil) {
      return NextResponse.json(
        { error: 'Appareil inconnu ou token invalide' },
        { status: 401 }
      )
    }

    const quota = await obtenirParametreEntier('sms_quota_per_hour')
    const usage = await obtenirUsageAppareil(appareilId)
    const quotaAtteint = usage >= quota

    return NextResponse.json(
      {
        quota,
        usage,
        remaining: Math.max(0, quota - usage),
        quota_reached: quotaAtteint,
        retry_after_seconds: quotaAtteint ? await obtenirDelaiAttenteSecondes(appareilId) : 0,
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
