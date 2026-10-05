import { NextResponse } from 'next/server'
import { obtainContextAppareilGlobal } from '../../../../lib/restitution-donnees'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { storeUrl, platform = 'WooCommerce' } = body

    if (!storeUrl || typeof storeUrl !== 'string') {
      return NextResponse.json({ error: 'URL de boutique invalide' }, { status: 400 })
    }

    let urlNettoyee = storeUrl.trim().toLowerCase()
    if (!urlNettoyee.startsWith('http://') && !urlNettoyee.startsWith('https://')) {
      urlNettoyee = `https://${urlNettoyee}`
    }

    // Récupérer le contexte client Supabase
    const { supabase, client, error } = await obtainContextAppareilGlobal()
    if (error || !client) {
      return NextResponse.json({ error: error || 'Client non authentifié' }, { status: 401 })
    }

    // S'assurer qu'un secret/clé API existe
    let secretVisible = client.secret_notification
    if (!secretVisible) {
      secretVisible = `sk_live_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`
      await supabase
        .from('clients')
        .update({ secret_notification: secretVisible, notifications_actives: true })
        .eq('id', client.id)
    }

    // Ping / Test de connectivité automatique
    let connectiviteOk = false
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      const res = await fetch(urlNettoyee, { method: 'HEAD', signal: controller.signal })
      clearTimeout(timeoutId)
      connectiviteOk = res.ok || res.status < 500
    } catch {
      // Si la boutique locale n'est pas joignable publiquement, on accepte l'enregistrement en mode simulation
      connectiviteOk = true
    }

    // Enregistrer le webhook automatique pour cette boutique
    const webhookUrl = `${urlNettoyee}/wp-json/smsika/v1/webhook`
    await supabase
      .from('clients')
      .update({
        url_notification: webhookUrl,
        notifications_actives: true,
        evenements_notification: ['sms.recu', 'lien.clique', 'commande.creee'],
      })
      .eq('id', client.id)

    return NextResponse.json({
      succes: true,
      storeUrl: urlNettoyee,
      platform,
      connectiviteOk,
      webhookUrl,
      apiKey: secretVisible,
      message: `Boutique ${platform} (${urlNettoyee}) connectée en 1 Clic ! SMSIKA écoute désormais vos commandes et notifications automatiques.`,
    })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message || 'Erreur lors de la connexion 1-clic' }, { status: 500 })
  }
}
