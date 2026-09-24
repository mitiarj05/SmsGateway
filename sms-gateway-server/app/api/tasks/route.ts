import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { expirerEnAttentePerimees } from '@/lib/expiration-attente'
import { promouvoirProgrammes } from '@/lib/programmes'

/**
 * Contrat JSON inchangé (message, device_id, created_at…) : on map
 * les colonnes françaises vers les clés historiques.
 */
const versContrat = (t: {
  id: string; numero_destinataire: string; contenu: string; statut: string;
  id_appareil: string | null; message_erreur: string | null;
  programme_a: string | null; date_creation: string; date_modification: string
}) => ({
  id: t.id,
  numero_destinataire: t.numero_destinataire,
  message: t.contenu,
  statut: t.statut,
  device_id: t.id_appareil,
  error_message: t.message_erreur,
  scheduled_at: t.programme_a,
  created_at: t.date_creation,
  updated_at: t.date_modification,
})

export async function GET() {
  try {
    await expirerEnAttentePerimees()
    await promouvoirProgrammes()
    const { data, error } = await supabaseAdmin
      .from('taches')
      .select('id, numero_destinataire, contenu, statut, id_appareil, message_erreur, programme_a, date_creation, date_modification')
      .order('date_creation', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tasks: (data ?? []).map(versContrat) })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
