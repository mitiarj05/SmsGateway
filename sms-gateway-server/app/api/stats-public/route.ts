import { NextResponse } from 'next/server'
import { obtenirStatsPubliques } from '@/lib/stats-publiques'

/**
 * GET /api/stats-public — chiffres vitrine (public, sans auth).
 * Totaux non sensibles uniquement, cache 60 s.
 */
export async function GET() {
  const stats = await obtenirStatsPubliques()
  return NextResponse.json({
    sms_envoyes: stats.smsEnvoyes,
    appareils_en_ligne: stats.appareilsEnLigne,
    clients: stats.clients,
  })
}
