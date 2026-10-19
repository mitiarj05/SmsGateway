import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { marquerAppareilsInactifs } from '@/lib/statut-appareil'
import { STATUT_APPAREIL } from '@/lib/statuts'

/**
 * POST /api/demo/check-payment — le SMS de paiement de la démonstration
 * est-il arrivé ? Corps : { reference: "CMD-1234" }
 *
 * La recherche est volontairement bornée : référence au format de la
 * démonstration, application de la passerelle, et trente dernières minutes.
 * Sans ces trois garde-fous, cette route publique laisserait lire n'importe
 * quel SMS entrant dès lors qu'on fait varier le motif de recherche.
 */

const FORMAT_REFERENCE = /^CMD-\d{4}$/
const FENETRE_RECHERCHE_MS = 30 * 60 * 1000

export async function POST(request: NextRequest) {
  try {
    const corps = await request.json().catch(() => null)
    const reference = typeof corps?.reference === 'string' ? corps.reference.trim().toUpperCase() : ''

    if (!FORMAT_REFERENCE.test(reference)) {
      return NextResponse.json(
        { error: 'Référence invalide. Format attendu : CMD-1234.' },
        { status: 400 }
      )
    }

    // Seuls les SMS de la passerelle de démonstration sont consultables ici.
    await marquerAppareilsInactifs()
    let requetePasserelle = supabaseAdmin
      .from('appareils')
      .select('id, id_application')
      .eq('statut', STATUT_APPAREIL.EN_LIGNE)
      .not('id_application', 'is', null)
      .order('derniere_activite', { ascending: false })
      .limit(1)
    const applicationEpinglee = process.env.DEMO_ID_APPLICATION
    if (applicationEpinglee) {
      requetePasserelle = requetePasserelle.eq('id_application', applicationEpinglee)
    }
    const { data: passerelle } = await requetePasserelle.maybeSingle()

    if (!passerelle?.id_application) {
      return NextResponse.json({
        paye: false,
        message: 'Aucune passerelle en ligne pour le moment.',
      })
    }

    const depuis = new Date(Date.now() - FENETRE_RECHERCHE_MS).toISOString()
    const { data, error } = await supabaseAdmin
      .from('reponses')
      .select('id, expediteur, contenu, date_reception')
      .eq('id_application', passerelle.id_application)
      .ilike('contenu', `%PAYER ${reference}%`)
      .gte('date_reception', depuis)
      .order('date_reception', { ascending: false })
      .limit(1)

    if (error) {
      console.error('[demo/check-payment] Erreur Base :', error.message)
      return NextResponse.json(
        { error: 'Erreur lors de la vérification' },
        { status: 500 }
      )
    }

    if (data && data.length > 0) {
      const sms = data[0]
      return NextResponse.json({
        paye: true,
        message: 'SMS de paiement capté par la passerelle.',
        sms: {
          id: sms.id,
          expediteur: sms.expediteur,
          contenu: sms.contenu,
          date_reception: sms.date_reception,
        },
      })
    }

    return NextResponse.json({
      paye: false,
      message: 'En attente du SMS de paiement…',
    })
  } catch (erreur) {
    console.error('[demo/check-payment] Erreur inattendue :', erreur)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
