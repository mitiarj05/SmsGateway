import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { resoudreApplicationEspace } from '@/lib/espace-auth'
import { EVENEMENTS_NOTIFICATION, fabriquerSecretNotification } from '@/lib/notifications'

/**
 * POST /api/espace/connect-store — connexion boutique en 1 clic (client).
 * Corps: { storeUrl: string, platform?: string }.
 * Vérifie la boutique, garantit un secret de notification, puis y
 * rattache l'URL de notification (webhook SMSTSIKA).
 */
export async function POST(request: NextRequest) {
  try {
    const idApplication = await resoudreApplicationEspace(request)
    if (!idApplication) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const corps = await request.json().catch(() => null)
    const brut = typeof corps?.storeUrl === 'string' ? corps.storeUrl.trim() : ''
    const plateforme = typeof corps?.platform === 'string' && corps.platform.trim()
      ? corps.platform.trim().slice(0, 40)
      : 'WooCommerce'
    if (!brut) {
      return NextResponse.json({ error: 'URL de boutique invalide' }, { status: 400 })
    }

    let urlNettoyee = brut.toLowerCase()
    if (!urlNettoyee.startsWith('http://') && !urlNettoyee.startsWith('https://')) {
      urlNettoyee = `https://${urlNettoyee}`
    }

    const { data: client, error } = await supabaseAdmin
      .from('applications')
      .select('id, secret_notification')
      .eq('id', idApplication)
      .single()
    if (error || !client) {
      return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
    }

    // Garantit un secret de signature (renvoyé une seule fois si créé ici).
    let secretVisible: string | null = null
    if (!client.secret_notification) {
      secretVisible = fabriquerSecretNotification()
      const { error: erreurSecret } = await supabaseAdmin
        .from('applications')
        .update({ secret_notification: secretVisible })
        .eq('id', idApplication)
      if (erreurSecret) {
        return NextResponse.json({ error: erreurSecret.message }, { status: 500 })
      }
    }

    // Test de connectivité (borne 3 s, sans bloquer l'enregistrement).
    let connectiviteOk = false
    try {
      const controleur = new AbortController()
      const delai = setTimeout(() => controleur.abort(), 3000)
      const res = await fetch(urlNettoyee, { method: 'HEAD', signal: controleur.signal })
      clearTimeout(delai)
      connectiviteOk = res.ok || res.status < 500
    } catch {
      connectiviteOk = false
    }

    // Rattache le webhook SMSTSIKA à la boutique (événements supportés uniquement).
    const urlNotification = `${urlNettoyee.replace(/\/+$/, '')}/wp-json/smsika/v1/webhook`
    const { error: erreurWebhook } = await supabaseAdmin
      .from('applications')
      .update({
        url_notification: urlNotification,
        notifications_actives: true,
        evenements_notification: [...EVENEMENTS_NOTIFICATION],
      })
      .eq('id', idApplication)
    if (erreurWebhook) {
      return NextResponse.json({ error: erreurWebhook.message }, { status: 500 })
    }

    return NextResponse.json({
      message: `Boutique ${plateforme} (${urlNettoyee}) connectée : SMSTSIKA y enverra désormais vos notifications.`,
      url_boutique: urlNettoyee,
      plateforme,
      connectivite_ok: connectiviteOk,
      url_notification: urlNotification,
      ...(secretVisible ? { secret_notification_visible: secretVisible } : {}),
    })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
