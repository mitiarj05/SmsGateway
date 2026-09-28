import { NextRequest, NextResponse } from 'next/server'
import { envoyerCourrielDetaille, estAdresseCourriel, courrielConfigure } from '@/lib/courriel'

/**
 * POST /api/settings/test-email — envoie un e-mail de test (admin).
 * Corps: { to: "adresse@exemple.mg" }. Retourne la cause exacte en cas d'échec.
 */
export async function POST(request: NextRequest) {
  try {
    const corps = await request.json().catch(() => null)
    const destinataire = typeof corps?.to === 'string' ? corps.to.trim() : ''
    if (!estAdresseCourriel(destinataire)) {
      return NextResponse.json(
        { error: 'Le champ "to" doit être une adresse e-mail valide' },
        { status: 400 }
      )
    }
    if (!courrielConfigure()) {
      return NextResponse.json(
        {
          error: 'SMTP non configuré',
          details: 'Renseignez SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM puis redémarrez (ou redéployez).',
        },
        { status: 503 }
      )
    }
    const resultat = await envoyerCourrielDetaille(
      destinataire,
      'Test e-mail SMSIKA',
      'Si vous lisez ce message, l\u2019envoi d\u2019e-mails de la passerelle SMSIKA fonctionne.'
    )
    if (resultat.ok) {
      return NextResponse.json({ message: resultat.message })
    }
    return NextResponse.json(
      { error: 'Échec SMTP', details: resultat.message },
      { status: 502 }
    )
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
