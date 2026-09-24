import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { obtenirSupabaseAdmin } from '@/lib/supabase-serveur'
import { verifierJetonFirebase } from '@/lib/authentification'
import { STATUT_APPAREIL } from '@/lib/statuts'

/**
 * POST /api/devices/register — enregistre un téléphone.
 * Exige un ID token Firebase Auth (connexion anonyme de l'app) :
 * seuls les téléphones authentifiés via le projet Firebase peuvent
 * créer un appareil. Création systématique en HORS_LIGNE.
 */
export async function POST(request: NextRequest) {
  let clientSupabase
  try {
    clientSupabase = obtenirSupabaseAdmin()
  } catch (erreur) {
    console.error('Config Supabase manquante:', erreur)
    return NextResponse.json(
      { error: (erreur as Error).message },
      { status: 500 }
    )
  }

  try {
    // 1. ID token Firebase obligatoire
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'ID token Firebase manquant (Authorization: Bearer <jetonId>)' },
        { status: 401 }
      )
    }
    const uidFirebase = await verifierJetonFirebase(authHeader.substring(7))
    if (!uidFirebase) {
      return NextResponse.json(
        { error: 'ID token Firebase invalide' },
        { status: 401 }
      )
    }

    const corps = await request.json()
    const { nom } = corps

    // Validation du champ "nom"
    if (!nom || typeof nom !== 'string' || nom.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le champ "nom" est obligatoire et doit être une chaîne non vide' },
        { status: 400 }
      )
    }

    // 2. Appareil déjà lié à ce compte Firebase ? On rend ses identifiants
    // (réinstallation de l'app : même compte anonyme = même appareil).
    const { data: existant } = await clientSupabase
      .from('appareils')
      .select('id, nom, jeton, statut, date_creation')
      .eq('uid_firebase', uidFirebase)
      .single()

    if (existant) {
      return NextResponse.json(
        {
          message: 'Appareil déjà enregistré',
          device: {
            id: existant.id,
            nom: existant.nom,
            token: existant.jeton,
            statut: existant.statut,
            created_at: existant.date_creation,
          },
        },
        { status: 200 }
      )
    }

    // 3. Nouvel appareil : token propre + HORS_LIGNE par défaut.
    const jeton = randomBytes(32).toString('hex')

    const { data, error } = await clientSupabase
      .from('appareils')
      .insert({
        nom: nom.trim(),
        jeton: jeton,
        statut: STATUT_APPAREIL.HORS_LIGNE,
        uid_firebase: uidFirebase,
      })
      .select('id, nom, jeton, statut, date_creation')
      .single()

    if (error) {
      console.error('Erreur Supabase lors de l\'enregistrement:', error)
      return NextResponse.json(
        {
          error: 'Erreur lors de l\'enregistrement de l\'appareil',
          details: error.message,
        },
        { status: 500 }
      )
    }

    // Réponse succès (contrat JSON inchangé)
    return NextResponse.json(
      {
        message: 'Appareil enregistré avec succès',
        device: {
          id: data.id,
          nom: data.nom,
          token: data.jeton,
          statut: data.statut,
          created_at: data.date_creation,
        },
      },
      { status: 201 }
    )
  } catch (erreur) {
    console.error('Erreur inattendue:', erreur)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
