import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { authenticateApiClient } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, message, cle_api } = body

    // 1. Validation des champs
    if (!to || typeof to !== 'string' || to.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le champ "to" (numéro destinataire) est obligatoire' },
        { status: 400 }
      )
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le champ "message" est obligatoire' },
        { status: 400 }
      )
    }

    if (!cle_api || typeof cle_api !== 'string') {
      return NextResponse.json(
        { error: 'Le champ "cle_api" est obligatoire' },
        { status: 400 }
      )
    }

    // 2. Authentification du client API
    const client = await authenticateApiClient(cle_api)
    if (!client) {
      return NextResponse.json(
        { error: 'Clé API invalide' },
        { status: 401 }
      )
    }

    // 3. Création de la tâche SMS
    const { data, error } = await supabaseAdmin
      .from('sms_tasks')
      .insert({
        numero_destinataire: to.trim(),
        message: message.trim(),
        statut: 'PENDING',
        app_client_id: client.id,
      })
      .select('id, numero_destinataire, message, statut, created_at')
      .single()

    if (error) {
      console.error('Erreur Supabase:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la création de la tâche', details: error.message },
        { status: 500 }
      )
    }

    // 4. Réponse
    return NextResponse.json(
      {
        message: 'SMS mis en file d\'attente',
        task: data,
        client: { id: client.id, nom: client.nom },
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