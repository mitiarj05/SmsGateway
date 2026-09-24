import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { expirerEnAttentePerimees } from '@/lib/expiration-attente'
import { promouvoirProgrammes } from '@/lib/programmes'
import { STATUT_APPAREIL, STATUT_TACHE } from '@/lib/statuts'

export async function GET() {
  try {
    await expirerEnAttentePerimees()
    await promouvoirProgrammes()
    const { count: appareilsEnLigne } = await supabaseAdmin
      .from('appareils').select('*', { count: 'exact', head: true }).eq('statut', STATUT_APPAREIL.EN_LIGNE)
    const { count: tachesEnvoyees } = await supabaseAdmin
      .from('taches').select('*', { count: 'exact', head: true }).eq('statut', STATUT_TACHE.ENVOYE)
    const { count: tachesEnAttente } = await supabaseAdmin
      .from('taches').select('*', { count: 'exact', head: true }).eq('statut', STATUT_TACHE.EN_ATTENTE)
    const { count: tachesEchouees } = await supabaseAdmin
      .from('taches').select('*', { count: 'exact', head: true }).eq('statut', STATUT_TACHE.ECHOUE)

    return NextResponse.json({
      stats: {
        online_devices: appareilsEnLigne ?? 0,
        tasks_sent: tachesEnvoyees ?? 0,
        tasks_pending: tachesEnAttente ?? 0,
        tasks_failed: tachesEchouees ?? 0,
      }
    })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
