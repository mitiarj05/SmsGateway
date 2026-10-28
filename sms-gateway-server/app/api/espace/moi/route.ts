import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { resoudreApplicationEspace } from '@/lib/espace-auth'
import { compterEnvoisMois, moisActuel } from '@/lib/facturation'
import { STATUT_TACHE } from '@/lib/statuts'

/**
 * GET /api/espace/moi — profil (nom, email) + quota + mini-stats du client connecté.
 */
export async function GET(request: NextRequest) {
  try {
    const idApplication = await resoudreApplicationEspace(request)
    if (!idApplication) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { data: app } = await supabaseAdmin
      .from('client')
      .select('id, nom, email, cle_api')
      .eq('id', idApplication)
      .single()
    if (!app) {
      return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
    }
    const mois = moisActuel()
    const [utiliseMois, envoyes, attente, echoue, recus] = await Promise.all([
      compterEnvoisMois(idApplication, mois),
      supabaseAdmin.from('tache').select('id', { count: 'exact', head: true })
        .eq('id_application', idApplication).eq('statut', STATUT_TACHE.ENVOYE)
        .then((r) => r.count ?? 0),
      supabaseAdmin.from('tache').select('id', { count: 'exact', head: true })
        .eq('id_application', idApplication).eq('statut', STATUT_TACHE.EN_ATTENTE)
        .then((r) => r.count ?? 0),
      supabaseAdmin.from('tache').select('id', { count: 'exact', head: true })
        .eq('id_application', idApplication).eq('statut', STATUT_TACHE.ECHOUE)
        .then((r) => r.count ?? 0),
      supabaseAdmin.from('reponse').select('id', { count: 'exact', head: true })
        .eq('id_application', idApplication)
        .then((r) => r.count ?? 0),
    ])
    return NextResponse.json({
      id: app.id,
      nom: app.nom,
      email: (app as { email?: string | null }).email ?? '',
      cle_api: (app as { cle_api: string }).cle_api,
      mois,
      utilise_mois: utiliseMois,
      stats: { envoyes, attente, echoue, recus },
    })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

/**
 * PATCH /api/espace/moi — mise à jour du profil (nom, email).
 */
export async function PATCH(request: NextRequest) {
  try {
    const idApplication = await resoudreApplicationEspace(request)
    if (!idApplication) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const corps = await request.json().catch(() => ({}))
    const maj: Record<string, unknown> = {}
    if (typeof corps.nom === 'string') maj.nom = corps.nom.trim()
    if (typeof corps.email === 'string') maj.email = corps.email.trim()

    if (Object.keys(maj).length === 0) {
      return NextResponse.json({ error: 'Aucune donnée à mettre à jour' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('client')
      .update(maj)
      .eq('id', idApplication)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Profil mis à jour avec succès' })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
