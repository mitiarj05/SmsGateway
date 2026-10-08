import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { STATUT_TACHE } from '@/lib/statuts'

const PERIODES: Record<string, { ms: number; pasMs: number; dureeJours: number }> = {
  '24h': { ms: 24 * 3600_000, pasMs: 3600_000, dureeJours: 1 },
  '7j': { ms: 7 * 86400_000, pasMs: 86400_000, dureeJours: 7 },
  '30j': { ms: 30 * 86400_000, pasMs: 86400_000, dureeJours: 30 },
}

/**
 * GET /api/stats/series?periode=24h|7j|30j — volume d'envois (global, admin).
 * Tranches : 24×1h, 7×1j, 30×1j. Capé à 5000 lignes pour rester rapide.
 */
export async function GET(request: NextRequest) {
  try {
    const cle = request.nextUrl.searchParams.get('periode') ?? '24h'
    const config = PERIODES[cle] ?? PERIODES['24h']
    const maintenant = Date.now()
    const debut = new Date(maintenant - config.ms).toISOString()

    const { data, error } = await supabaseAdmin
      .from('taches')
      .select('date_creation')
      .eq('statut', STATUT_TACHE.ENVOYE)
      .gte('date_creation', debut)
      .order('date_creation', { ascending: true })
      .limit(5000)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const nbTranches = Math.round(config.ms / config.pasMs)
    const points = Array.from({ length: nbTranches }, (_, i) => {
      const finTranche = maintenant - (nbTranches - 1 - i) * config.pasMs
      const debutTranche = finTranche - config.pasMs
      const total = (data ?? []).filter((t) => {
        const h = new Date(t.date_creation as string).getTime()
        return h >= debutTranche && h < finTranche
      }).length
      const etiquette = config.dureeJours === 1
        ? new Date(finTranche).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        : new Date(finTranche).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
      return { heure: etiquette, valeur: total }
    })
    return NextResponse.json({ periode: cle, points })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
