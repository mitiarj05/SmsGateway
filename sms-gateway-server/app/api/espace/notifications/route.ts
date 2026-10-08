import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { lireSessionClient } from '@/lib/session-client'
import { EVENEMENTS_NOTIFICATION, fabriquerSecretNotification, enfilerNotification, traiterNotificationsEnAttente } from '@/lib/notifications'

/**
 * GET /api/espace/notifications — config webhooks du client (secret jamais exposé).
 * PATCH — { url_notification?, evenements_notification?, notifications_actives?,
 *   regenerer_secret?, tester? } (secret renvoyé une seule fois si régénéré).
 */
export async function GET(request: NextRequest) {
  try {
    const idApplication = lireSessionClient(request)
    if (!idApplication) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { data, error } = await supabaseAdmin
      .from('applications')
      .select('url_notification, evenements_notification, notifications_actives, secret_notification')
      .eq('id', idApplication)
      .single()
    if (error || !data) {
      return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
    }
    const { secret_notification: _masque, ...config } = data
    return NextResponse.json({ ...config, secret_defini: !!_masque })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const idApplication = lireSessionClient(request)
    if (!idApplication) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const corps = await request.json().catch(() => null)
    if (!corps || typeof corps !== 'object') {
      return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
    }
    const maj: Record<string, unknown> = {}
    if ('url_notification' in corps) {
      const url = corps.url_notification
      if (url !== null && (typeof url !== 'string' || !/^https:\/\/.+/.test(url.trim()))) {
        return NextResponse.json(
          { error: 'Le champ "url_notification" doit être une URL HTTPS valide ou null' },
          { status: 400 }
        )
      }
      maj.url_notification = url === null ? null : (url as string).trim()
    }
    if ('evenements_notification' in corps) {
      const liste = corps.evenements_notification
      if (!Array.isArray(liste) || !liste.every((e) => (EVENEMENTS_NOTIFICATION as readonly string[]).includes(e))) {
        return NextResponse.json(
          { error: `Événements acceptés : ${EVENEMENTS_NOTIFICATION.join(', ')}` },
          { status: 400 }
        )
      }
      maj.evenements_notification = liste
    }
    if ('notifications_actives' in corps) {
      if (typeof corps.notifications_actives !== 'boolean') {
        return NextResponse.json({ error: 'Le champ "notifications_actives" doit être un booléen' }, { status: 400 })
      }
      maj.notifications_actives = corps.notifications_actives
    }
    let secretVisible: string | null = null
    if (corps.regenerer_secret === true) {
      secretVisible = fabriquerSecretNotification()
      maj.secret_notification = secretVisible
    }
    if (Object.keys(maj).length > 0) {
      const { error } = await supabaseAdmin
        .from('applications')
        .update(maj)
        .eq('id', idApplication)
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }
    let test: Record<string, unknown> | null = null
    if (corps.tester === true) {
      const idCharge = await enfilerNotification(idApplication, 'sms.recu', {
        test: true,
        message_test: 'Ping de test depuis votre espace SMSTSIKA',
      })
      const resultat = await traiterNotificationsEnAttente()
      test = { en_file: !!idCharge, ...resultat }
    }
    return NextResponse.json({
      message: 'Configuration enregistrée',
      ...(secretVisible ? { secret_notification_visible: secretVisible } : {}),
      ...(test ? { test } : {}),
    })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
