import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { authenticateApiClient } from '@/lib/auth'
import { sendNewTaskPush } from '@/lib/send-push'
import { getDeviceAvailability } from '@/lib/select-device'
import { expireStalePending } from '@/lib/pending-expiry'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, message, cle_api } = body

    // 1. Validation
    if (!to || typeof to !== 'string' || to.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le champ "to" est obligatoire' },
        { status: 400 }
      )
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le champ "message" est obligatoire' },
        { status: 400 }
      )
    }

    if (!cle_api || typeof cle_api !== 'string' || cle_api.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le champ "cle_api" est obligatoire' },
        { status: 400 }
      )
    }

    // 2. Authentification du client API
    const trimmedKey = cle_api.trim()
    const client = await authenticateApiClient(trimmedKey)
    if (!client) {
      // Diagnostic sans exposer la clé : longueur 36 = clé complète,
      // ~15 + "…" = clé masquée copiée depuis la liste.
      console.warn(
        `[sms/send] cle_api rejetée (longueur=${trimmedKey.length}, préfixe=${trimmedKey.slice(0, 8)}…, suffixe=${trimmedKey.slice(-3)})`
      )
      return NextResponse.json(
        { error: 'Clé API invalide' },
        { status: 401 }
      )
    }

    // Expiration des PENDING trop anciennes (ne bloque jamais l'envoi)
    await expireStalePending()

    // 3. Quota strict : refuser AVANT de créer la task si tout est saturé
    const availability = await getDeviceAvailability()
    if (availability.saturated) {
      return NextResponse.json(
        {
          error: `Quota SMS/heure atteint (${availability.quota}/h/device). Réessayez dans ~${availability.retryAfterSeconds}s.`,
          quota: availability.quota,
          retry_after_seconds: availability.retryAfterSeconds,
        },
        { status: 429 }
      )
    }

    // 4. Créer la task
    const { data: task, error } = await supabaseAdmin
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

    // 5. Envoyer le push au device sélectionné (non bloquant)
    const device = availability.device
    let pushSent = false
    if (device?.fcm_token) {
      try {
        pushSent = await sendNewTaskPush(device.fcm_token, task.id)
        console.log(`Push FCM envoyé au device ${device.id} (${device.sms_last_hour} SMS/heure) : ${pushSent}`)
      } catch (pushErr) {
        console.error('Erreur push FCM (non bloquant):', pushErr)
      }
    } else {
      console.warn('Aucun device disponible — pas de push')
    }

    // 6. Réponse
    return NextResponse.json(
      {
        message: 'SMS mis en file d\'attente',
        task: task,
        push_sent: pushSent,
        device_selected: device
          ? { id: device.id, nom: device.nom, sms_last_hour: device.sms_last_hour }
          : null,
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