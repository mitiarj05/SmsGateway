import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { resoudreApplicationEspace } from '@/lib/espace-auth'
import { EVENEMENTS_DISPONIBLES, fabriquerSecretSignature, enfilerEvenement, traiterEvenementsEnAttente } from '@/lib/evenements'

/**
 * GET /api/espace/evenements — config webhooks du client (secret jamais exposé).
 * PATCH — { url_application?, evenement_souscrit?, evenement_actif?,
 *   regenerer_secret?, tester? } (secret renvoyé une seule fois si régénéré).
 */
export async function GET(request: NextRequest) {
  try {
    const idApplication = await resoudreApplicationEspace(request)
    if (!idApplication) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { data, error } = await supabaseAdmin
      .from('client')
      .select('url_application, evenement_souscrit, evenement_actif, secret_signature')
      .eq('id', idApplication)
      .single()
    if (error || !data) {
      return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
    }
    const { secret_signature: _masque, ...config } = data
    return NextResponse.json({ ...config, secret_defini: !!_masque })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const idApplication = await resoudreApplicationEspace(request)
    if (!idApplication) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const corps = await request.json().catch(() => null)
    if (!corps || typeof corps !== 'object') {
      return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
    }
    const maj: Record<string, unknown> = {}
    if ('url_application' in corps) {
      const url = corps.url_application
      if (url !== null && (typeof url !== 'string' || !/^https:\/\/.+/.test(url.trim()))) {
        return NextResponse.json(
          { error: 'Le champ "url_application" doit être une URL HTTPS valide ou null' },
          { status: 400 }
        )
      }
      maj.url_application = url === null ? null : (url as string).trim()
    }
    if ('evenement_souscrit' in corps) {
      const liste = corps.evenement_souscrit
      if (!Array.isArray(liste) || !liste.every((e) => (EVENEMENTS_DISPONIBLES as readonly string[]).includes(e))) {
        return NextResponse.json(
          { error: `Événements acceptés : ${EVENEMENTS_DISPONIBLES.join(', ')}` },
          { status: 400 }
        )
      }
      maj.evenement_souscrit = liste
    }
    if ('evenement_actif' in corps) {
      if (typeof corps.evenement_actif !== 'boolean') {
        return NextResponse.json({ error: 'Le champ "evenement_actif" doit être un booléen' }, { status: 400 })
      }
      maj.evenement_actif = corps.evenement_actif
    }
    let secretVisible: string | null = null
    if (corps.regenerer_secret === true) {
      secretVisible = fabriquerSecretSignature()
      maj.secret_signature = secretVisible
    }
    if (Object.keys(maj).length > 0) {
      const { error } = await supabaseAdmin
        .from('client')
        .update(maj)
        .eq('id', idApplication)
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }
    let test: Record<string, unknown> | null = null
    if (corps.tester === true) {
      const idCharge = await enfilerEvenement(idApplication, 'sms.recu', {
        test: true,
        message_test: 'Ping de test depuis votre espace SMSTSIKA',
      })
      const resultat = await traiterEvenementsEnAttente()
      test = { en_file: !!idCharge, ...resultat }
    }
    return NextResponse.json({
      message: 'Configuration enregistrée',
      ...(secretVisible ? { secret_signature_visible: secretVisible } : {}),
      ...(test ? { test } : {}),
    })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
