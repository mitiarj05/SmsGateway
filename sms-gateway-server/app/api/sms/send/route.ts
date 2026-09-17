import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { authenticateApiClient } from '@/lib/auth'
import { sendNewTaskPush } from '@/lib/send-push'
import { getDeviceAvailability } from '@/lib/select-device'
import { expireStalePending } from '@/lib/pending-expiry'
import { promoteScheduled } from '@/lib/scheduled'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, message, cle_api } = body

    // 1. Validation — `to` : un numéro ou une liste (envoi groupé).
    const MAX_DESTINATAIRES = 100
    const rawRecipients = Array.isArray(to) ? to : [to]
    if (rawRecipients.length === 0 || rawRecipients.length > MAX_DESTINATAIRES) {
      return NextResponse.json(
        { error: `Le champ "to" doit contenir entre 1 et ${MAX_DESTINATAIRES} destinataire(s)` },
        { status: 400 }
      )
    }
    const invalidIndexes: number[] = []
    const numeros = rawRecipients.map((r, i) => {
      if (typeof r !== 'string' || r.trim().length === 0) {
        invalidIndexes.push(i)
        return ''
      }
      return r.trim()
    })
    if (invalidIndexes.length > 0) {
      return NextResponse.json(
        { error: `Numéro(s) invalide(s) aux position(s) : ${invalidIndexes.join(', ')}` },
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
    await promoteScheduled()

    // Envoi différé : date ISO future (max 1 an). Ni quota ni push :
    // la tâche attend sa date, promue PENDING à l'heure dite.
    let scheduledFor: Date | null = null
    if (body?.scheduled_at) {
      const d = new Date(body.scheduled_at)
      if (Number.isNaN(d.getTime()) || d.getTime() <= Date.now()) {
        return NextResponse.json(
          { error: 'Le champ "scheduled_at" doit être une date ISO future' },
          { status: 400 }
        )
      }
      if (d.getTime() - Date.now() > 366 * 24 * 3600_000) {
        return NextResponse.json(
          { error: 'Le champ "scheduled_at" est limité à un an maximum' },
          { status: 400 }
        )
      }
      scheduledFor = d
    }

    // 3. Quota strict : refuser AVANT de créer la task si tout est saturé
    const availability = scheduledFor ? null : await getDeviceAvailability()
    if (availability?.saturated) {
      return NextResponse.json(
        {
          error: `Quota SMS/heure atteint (${availability.quota}/h/device). Réessayez dans ~${availability.retryAfterSeconds}s.`,
          quota: availability.quota,
          retry_after_seconds: availability.retryAfterSeconds,
        },
        { status: 429 }
      )
    }

    // 4. Créer une task par destinataire (une seule requête)
    const { data: createdTasks, error } = await supabaseAdmin
      .from('sms_tasks')
      .insert(
        numeros.map((numero) => ({
          numero_destinataire: numero,
          message: message.trim(),
          statut: scheduledFor ? 'SCHEDULED' : 'PENDING',
          scheduled_at: scheduledFor ? scheduledFor.toISOString() : null,
          app_client_id: client.id,
        }))
      )
      .select('id, numero_destinataire, message, statut, scheduled_at, created_at')

    if (error || !createdTasks || createdTasks.length === 0) {
      console.error('Erreur Supabase:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la création des tâches', details: error?.message },
        { status: 500 }
      )
    }

    // 5. Un seul push (sauf différé) : il réveille le téléphone, qui dépile ensuite
    // les tâches une par une au polling (5 par passage).
    const device = availability?.device ?? null
    let pushSent = false
    if (!scheduledFor && device?.fcm_token) {
      try {
        pushSent = await sendNewTaskPush(device.fcm_token, createdTasks[0].id)
        console.log(`Push FCM envoyé au device ${device.id} (${device.sms_last_hour} SMS/heure) : ${pushSent}`)
      } catch (pushErr) {
        console.error('Erreur push FCM (non bloquant):', pushErr)
      }
    } else {
      console.warn('Aucun device disponible — pas de push')
    }

    // 6. Réponse (forme simple pour 1 numéro, détaillée pour un groupe)
    const deviceSelected = device
      ? { id: device.id, nom: device.nom, sms_last_hour: device.sms_last_hour }
      : null
    if (scheduledFor) {
      return NextResponse.json(
        {
          message: `SMS programmé pour le ${scheduledFor.toLocaleString('fr-FR')}`,
          count: createdTasks.length,
          tasks: createdTasks,
          scheduled_for: scheduledFor.toISOString(),
          push_sent: false,
          client: { id: client.id, nom: client.nom },
        },
        { status: 201 }
      )
    }
    if (!Array.isArray(to)) {
      return NextResponse.json(
        {
          message: 'SMS mis en file d\'attente',
          task: createdTasks[0],
          push_sent: pushSent,
          device_selected: deviceSelected,
          client: { id: client.id, nom: client.nom },
        },
        { status: 201 }
      )
    }
    return NextResponse.json(
      {
        message: `${createdTasks.length} SMS mis en file d'attente`,
        count: createdTasks.length,
        tasks: createdTasks,
        push_sent: pushSent,
        device_selected: deviceSelected,
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