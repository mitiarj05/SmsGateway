import { NextRequest, NextResponse } from 'next/server'
import { creerCodeLiaison, DUREE_CODE_LIAISON_SECONDES } from '@/lib/lien-qr'
import { resoudreApplicationEspace } from '@/lib/espace-auth'

/**
 * POST /api/espace/codes-liaison — génère un code QR de liaison (10 min).
 * Authentifié (session client) : le code embarque MON application.
 * Utilisé par la modale « Associer un téléphone » du parc d'envoi.
 */
export async function POST(request: NextRequest) {
  try {
    const idApplication = await resoudreApplicationEspace(request)
    if (!idApplication) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    let code: string
    let expireA: number
    try {
      ;({ code, expireA } = creerCodeLiaison(idApplication))
    } catch {
      return NextResponse.json({ error: 'Serveur non configuré' }, { status: 503 })
    }
    return NextResponse.json(
      { code, expire_a: expireA, duree_secondes: DUREE_CODE_LIAISON_SECONDES },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
