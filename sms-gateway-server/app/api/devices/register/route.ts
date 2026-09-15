import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase-server'

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
    const body = await request.json()
    const { nom } = body

    // Validation du champ "nom"
    if (!nom || typeof nom !== 'string' || nom.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le champ "nom" est obligatoire et doit être une chaîne non vide' },
        { status: 400 }
      )
    }

    // Génération d'un token unique et sécurisé (64 caractères hex)
    const token = randomBytes(32).toString('hex')

    // Insertion dans la table "devices" de Supabase
    const { data, error } = await supabaseAdmin
      .from('devices')
      .insert({
        nom: nom.trim(),
        token: token,
        statut: 'OFFLINE',
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