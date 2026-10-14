import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { verifierValeurSessionAdmin, COOKIE_SESSION } from '@/lib/admin-session'
import { traiterEnvoiSms } from '@/lib/envoi-sms'

/**
 * POST /api/sms/envoyer-admin — envoi depuis la console (session admin).
 * Corps: { to, message, scheduled_at?, id_application }.
 * PAS de clé API : l'admin choisit l'espace d'envoi dans la modale.
 * Non listée au proxy → session admin (ou Basic) exigée, 401 sinon.
 */
export async function POST(request: NextRequest) {
  try {
    const sessionValide = await verifierValeurSessionAdmin(
      request.cookies.get(COOKIE_SESSION)?.value
    )
    if (!sessionValide) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const corps = await request.json().catch(() => null)
    const idApplication = typeof corps?.id_application === 'string' ? corps.id_application : ''
    if (!idApplication) {
      return NextResponse.json({ error: 'Le champ "id_application" est obligatoire' }, { status: 400 })
    }

    const { data: app } = await supabaseAdmin
      .from('applications')
      .select('id, nom, suspendu')
      .eq('id', idApplication)
      .single()
    if (!app) {
      return NextResponse.json({ error: 'Espace introuvable' }, { status: 404 })
    }
    if ((app as { suspendu?: boolean }).suspendu === true) {
      return NextResponse.json({ error: 'Espace suspendu — réactivez-le pour envoyer.' }, { status: 403 })
    }

    const resultat = await traiterEnvoiSms(
      { id: (app as { id: string }).id, nom: (app as { nom: string }).nom },
      corps
    )
    return NextResponse.json(resultat.corps, { status: resultat.statut })
  } catch {
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
