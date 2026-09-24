import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { enfilerNotification, traiterNotificationsEnAttente } from '@/lib/notifications'

/**
 * GET /c/[code] — interception d'un clic sur lien intelligent.
 * Public (ouvert par le destinataire, sans session) : le proxy ne le protège pas.
 * 1. Marque le lien CLIQUE + date_clic (webhook au premier clic uniquement).
 * 2. Déclenche le rappel lien.clique vers le client concerné.
 * 3. Retourne une page HTML ultra-légère de confirmation.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  const { data: lien } = await supabaseAdmin
      .from('liens')
    .select('id, id_application, numero_destinataire, statut, date_clic')
    .eq('id', code)
    .single()

  if (!lien) {
    return new NextResponse(pageConfirmation(false), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  try {
    const premierClic = lien.statut !== 'CLIQUE'
    await supabaseAdmin
      .from('liens')
      .update({ statut: 'CLIQUE', date_clic: new Date().toISOString() })
      .eq('id', code)

    if (premierClic) {
      await enfilerNotification(lien.id_application, 'lien.clique', {
        destinataire: lien.numero_destinataire,
        lien_id: lien.id,
        date_clic: new Date().toISOString(),
        id_application: lien.id_application,
      })
      await traiterNotificationsEnAttente()
    }
  } catch {
    // Le clic est enregistré au mieux ; la page reste affichée.
  }

  return new NextResponse(pageConfirmation(true), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

function pageConfirmation(reussi: boolean): string {
  const titre = reussi ? 'Action confirmée !' : 'Lien invalide'
  const texte = reussi
    ? 'Merci, votre réponse a bien été enregistrée.'
    : "Ce lien n'existe pas ou a expiré."
  const couleur = reussi ? '#059669' : '#dc2626'
  const coche = reussi ? '✔' : '✕'
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>SMSIKA — ${titre}</title></head>` +
    `<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f4f4f5;font-family:system-ui,sans-serif">` +
    `<main style="text-align:center;background:#fff;border-radius:16px;padding:40px 32px;max-width:320px;box-shadow:0 4px 24px rgba(0,0,0,.08)">` +
    `<div style="font-size:48px;color:${couleur}">${coche}</div>` +
    `<h1 style="font-size:20px;margin:16px 0 8px">${titre}</h1>` +
    `<p style="font-size:14px;color:#52525b">${texte}</p>` +
    `</main></body></html>`
}
