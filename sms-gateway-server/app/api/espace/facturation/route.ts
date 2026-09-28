import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { lireSessionClient } from '@/lib/session-client'
import { moisActuel, debutMoisIso } from '@/lib/facturation'

/**
 * GET /api/espace/facturation?mois=AAAA-MM — conso du client connecté uniquement.
 */
export async function GET(request: NextRequest) {
  try {
    const idApplication = lireSessionClient(request)
    if (!idApplication) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const brut = request.nextUrl.searchParams.get('mois') ?? moisActuel()
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(brut)) {
      return NextResponse.json(
        { error: 'Paramètre "mois" invalide (format AAAA-MM attendu)' },
        { status: 400 }
      )
    }
    const debut = debutMoisIso(brut)
    const [total, envoyes, echecs, recus, clics, app] = await Promise.all([
      supabaseAdmin.from('taches').select('id', { count: 'exact', head: true })
        .eq('id_application', idApplication).gte('date_creation', debut)
        .then((r) => r.count ?? 0),
      supabaseAdmin.from('taches').select('id', { count: 'exact', head: true })
        .eq('id_application', idApplication).eq('statut', 'ENVOYE').gte('date_creation', debut)
        .then((r) => r.count ?? 0),
      supabaseAdmin.from('taches').select('id', { count: 'exact', head: true })
        .eq('id_application', idApplication).eq('statut', 'ECHOUE').gte('date_creation', debut)
        .then((r) => r.count ?? 0),
      supabaseAdmin.from('reponses').select('id', { count: 'exact', head: true })
        .eq('id_application', idApplication).gte('date_reception', debut)
        .then((r) => r.count ?? 0),
      supabaseAdmin.from('liens').select('id', { count: 'exact', head: true })
        .eq('id_application', idApplication).eq('statut', 'CLIQUE').gte('date_clic', debut)
        .then((r) => r.count ?? 0),
      supabaseAdmin.from('applications').select('nom, quota_mensuel')
        .eq('id', idApplication).single(),
    ])
    const quota = (app as unknown as { quota_mensuel: number | null } | null)?.quota_mensuel ?? null
    return NextResponse.json({
      mois: brut,
      nom: (app as unknown as { nom: string } | null)?.nom ?? '',
      total_facture: total,
      sms_envoyes: envoyes,
      sms_recus: recus,
      clics,
      echecs,
      quota_mensuel: quota,
      depassement: quota !== null && total >= quota,
    })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
