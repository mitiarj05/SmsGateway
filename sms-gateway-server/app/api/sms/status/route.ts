import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { authentifierClientApi } from '@/lib/authentification'

/**
 * GET /api/sms/status — suivi des envois pour une app externe.
 * Auth : ?cle_api=... (clé du client, jamais exposée aux autres clients :
 * seules SES tâches sont renvoyées).
 *
 * Query :
 * - cle_api (obligatoire)
 * - ids=id1,id2 (optionnel : restreint aux IDs donnés, max 200)
 * - since=ISO (optionnel : créées après cette date)
 * - limit (défaut 50, max 200)
 *
 * Contrat JSON inchangé (message, device_id, error_message…).
 */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const cleApi = (params.get('cle_api') ?? '').trim()
    if (!cleApi) {
      return NextResponse.json(
        { error: 'Le paramètre "cle_api" est obligatoire' },
        { status: 400 }
      )
    }

    const client = await authentifierClientApi(cleApi)
    if (!client) {
      return NextResponse.json(
        { error: 'Clé API invalide' },
        { status: 401 }
      )
    }

    const limit = Math.min(
      200,
      Math.max(1, Number(params.get('limit')) || 50)
    )
    const ids = (params.get('ids') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 200)
    const since = params.get('since')

    let requete = supabaseAdmin
      .from('taches')
      .select('id, numero_destinataire, contenu, statut, message_erreur, id_appareil, date_creation, date_modification')
      .eq('id_application', client.id)
      .order('date_creation', { ascending: false })
      .limit(limit)

    if (ids.length > 0) {
      requete = requete.in('id', ids)
    }
    if (since) {
      const date = new Date(since)
      if (Number.isNaN(date.getTime())) {
        return NextResponse.json(
          { error: 'Paramètre "since" invalide (ISO attendu)' },
          { status: 400 }
        )
      }
      requete = requete.gte('date_creation', date.toISOString())
    }

    const { data, error } = await requete
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const taches = (data ?? []).map((t) => ({
      id: t.id,
      numero_destinataire: t.numero_destinataire,
      message: t.contenu,
      statut: t.statut,
      error_message: t.message_erreur,
      device_id: t.id_appareil,
      created_at: t.date_creation,
      updated_at: t.date_modification,
    }))

    return NextResponse.json(
      { tasks: taches, count: taches.length },
      { status: 200 }
    )
  } catch {
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
