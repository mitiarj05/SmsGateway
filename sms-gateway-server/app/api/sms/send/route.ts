import { NextRequest, NextResponse } from 'next/server'
import { authentifierClientApi } from '@/lib/authentification'
import { traiterEnvoiSms } from '@/lib/envoi-sms'

/**
 * POST /api/sms/send — envoi via clé API (usage machine).
 * Corps: { to, message, scheduled_at?, cle_api }.
 * Publique (auth par clé). Le cœur d'envoi est mutualisé (lib/envoi-sms).
 */
export async function POST(request: NextRequest) {
  try {
    const corps = await request.json()
    const { cle_api } = corps ?? {}

    if (!cle_api || typeof cle_api !== 'string' || cle_api.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le champ "cle_api" est obligatoire' },
        { status: 400 }
      )
    }

    const cleNettoyee = cle_api.trim()
    const client = await authentifierClientApi(cleNettoyee)
    if (!client) {
      console.warn(
        `[sms/send] cle_api rejetée (longueur=${cleNettoyee.length}, préfixe=${cleNettoyee.slice(0, 8)}…, suffixe=${cleNettoyee.slice(-3)})`
      )
      return NextResponse.json(
        { error: 'Clé API invalide' },
        { status: 401 }
      )
    }

    const resultat = await traiterEnvoiSms(
      { id: client.id as string, nom: client.nom as string },
      corps
    )
    return NextResponse.json(resultat.corps, { status: resultat.statut })
  } catch (erreur) {
    console.error('Erreur inattendue:', erreur)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
