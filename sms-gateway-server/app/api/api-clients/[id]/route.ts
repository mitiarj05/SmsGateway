import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { EVENEMENTS_NOTIFICATION, fabriquerSecretNotification, enfilerNotification, traiterNotificationsEnAttente } from '@/lib/notifications'

/** DELETE /api/api-clients/[id] — révoque une clé API */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: existant, error: erreurRecup } = await supabaseAdmin
      .from('applications')
      .select('id')
      .eq('id', id)
      .single()

    if (erreurRecup || !existant) {
      return NextResponse.json({ error: 'Clé introuvable' }, { status: 404 })
    }

    // Détacher les tâches liées (clé étrangère) en gardant l'historique.
    const { error: erreurDetachement } = await supabaseAdmin
      .from('taches')
      .update({ id_application: null })
      .eq('id_application', id)

    if (erreurDetachement) {
      return NextResponse.json({ error: erreurDetachement.message }, { status: 500 })
    }

    const { error } = await supabaseAdmin
      .from('applications')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Clé révoquée', id })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

/**
 * PATCH /api/api-clients/[id] — configuration webhooks.
 * Corps: { url_notification?: string | null, evenements_notification?: string[],
 *   notifications_actives?: boolean, regenerer_secret?: boolean, tester?: boolean }
 * Le secret n'est renvoyé en clair QU'À sa (re)génération.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const corps = await request.json().catch(() => null)
    if (!corps || typeof corps !== 'object') {
      return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
    }

    const { data: existant } = await supabaseAdmin
      .from('applications')
      .select('id, secret_notification')
      .eq('id', id)
      .single()
    if (!existant) {
      return NextResponse.json({ error: 'Clé introuvable' }, { status: 404 })
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
    if (corps.regenerer_secret === true || ('url_notification' in corps && maj.url_notification && !existant.secret_notification)) {
      secretVisible = fabriquerSecretNotification()
      maj.secret_notification = secretVisible
    }

    if (Object.keys(maj).length > 0) {
      const { error } = await supabaseAdmin
        .from('applications')
        .update(maj)
        .eq('id', id)
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    const { data: client } = await supabaseAdmin
      .from('applications')
      .select('id, nom, url_notification, evenements_notification, notifications_actives')
      .eq('id', id)
      .single()

    let test: Record<string, unknown> | null = null
    if (corps.tester === true) {
      const idCharge = await enfilerNotification(id, 'sms.recu', {
        test: true,
        message_test: 'Ping de test depuis le dashboard SMSIKA',
      })
      const resultat = await traiterNotificationsEnAttente()
      test = { en_file: !!idCharge, ...resultat }
    }

    return NextResponse.json({
      message: 'Configuration notifications enregistrée',
      client,
      ...(secretVisible ? { secret_notification_visible: secretVisible } : {}),
      ...(test ? { test } : {}),
    })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
