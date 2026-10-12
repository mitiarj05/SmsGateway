import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { resoudreApplicationEspace } from '@/lib/espace-auth'

/**
 * DELETE /api/espace/appareils/[id] — retire un appareil de MON parc.
 * Publique au sens proxy (/api/espace/* exige une session valide).
 *
 * Sécurité : autorisé uniquement si l'appareil est lié à l'application du
 * client connecté. Les tâches de son espace sont détachées (historique
 * conservé), puis la ligne est supprimée. Un appareil lié à un autre
 * espace renvoie 404 (anti-énumération).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const idApplication = await resoudreApplicationEspace(request)
    if (!idApplication) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { id } = await params

    const { data: existant } = await supabaseAdmin
      .from('appareils')
      .select('id, nom, id_application')
      .eq('id', id)
      .single()
    if (!existant || (existant as { id_application: string | null }).id_application !== idApplication) {
      return NextResponse.json({ error: 'Appareil introuvable' }, { status: 404 })
    }

    // Détacher les tâches de MON espace (historique conservé).
    const { error: erreurDetachement } = await supabaseAdmin
      .from('taches')
      .update({ id_appareil: null })
      .eq('id_appareil', id)
      .eq('id_application', idApplication)
    if (erreurDetachement) {
      return NextResponse.json({ error: erreurDetachement.message }, { status: 500 })
    }

    // Détacher aussi les SMS reçus via cet appareil (historique conservé).
    // Tolérant : certaines bases n'ont pas cette colonne.
    try {
      await supabaseAdmin
        .from('reponses')
        .update({ id_appareil: null })
        .eq('id_appareil', id)
        .eq('id_application', idApplication)
    } catch {
      /* colonne absente — on continue */
    }

    const { error } = await supabaseAdmin.from('appareils').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ message: 'Appareil supprimé de votre parc', id })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
