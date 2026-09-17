import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { verifyFirebaseIdToken } from '@/lib/auth'

/**
 * POST /api/devices/register — enregistre un téléphone.
 * Exige un ID token Firebase Auth (connexion anonyme de l'app) :
 * seuls les téléphones authentifiés via le projet Firebase peuvent
 * créer un device. Création systématique en OFFLINE.
 */
export async function POST(request: NextRequest) {
  let supabaseAdmin
  try {
    supabaseAdmin = getSupabaseAdmin()
  } catch (err) {
    console.error('Config Supabase manquante:', err)
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }

  try {
    // 1. ID token Firebase obligatoire
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'ID token Firebase manquant (Authorization: Bearer <idToken>)' },
        { status: 401 }
      )
    }
    const firebaseUid = await verifyFirebaseIdToken(authHeader.substring(7))
    if (!firebaseUid) {
      return NextResponse.json(
        { error: 'ID token Firebase invalide' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { nom } = body

    // Validation du champ "nom"
    if (!nom || typeof nom !== 'string' || nom.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le champ "nom" est obligatoire et doit être une chaîne non vide' },
        { status: 400 }
      )
    }

    // 2. Device déjà lié à ce compte Firebase ? On rend ses identifiants
    // (réinstallation de l'app : même compte anonyme = même device).
    const { data: existing } = await supabaseAdmin
      .from('devices')
      .select('id, nom, token, statut, created_at')
      .eq('firebase_uid', firebaseUid)
      .single()

    if (existing) {
      return NextResponse.json(
        {
          message: 'Appareil déjà enregistré',
          device: existing,
        },
        { status: 200 }
      )
    }

    // 3. Nouveau device : token propre + OFFLINE par défaut.
    const token = randomBytes(32).toString('hex')

    const { data, error } = await supabaseAdmin
      .from('devices')
      .insert({
        nom: nom.trim(),
        token: token,
        statut: 'OFFLINE',
        firebase_uid: firebaseUid,
      })
      .select('id, nom, token, statut, created_at')
      .single()

    if (error) {
      console.error('Erreur Supabase lors de l\'enregistrement:', error)
      return NextResponse.json(
        {
          error: 'Erreur lors de l\'enregistrement du device',
          details: error.message,
        },
        { status: 500 }
      )
    }

    // Réponse succès
    return NextResponse.json(
      {
        message: 'Appareil enregistré avec succès',
        device: data,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('Erreur inattendue:', err)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
