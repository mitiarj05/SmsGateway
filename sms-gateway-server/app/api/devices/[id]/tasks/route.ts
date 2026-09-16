import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { authenticateDevice } from '@/lib/auth'
import { getIntSetting } from '@/lib/settings'
import { getDeviceUsage } from '@/lib/select-device'
import { expireStalePending } from '@/lib/pending-expiry'

// Une task SENDING depuis plus de 5 minutes est considérée abandonnée
const SENDING_TIMEOUT_MS = 5 * 60 * 1000

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deviceId } = await params

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Header Authorization manquant ou mal formé' },
        { status: 401 }
      )
    }
    const token = authHeader.substring(7)

    const device = await authenticateDevice(deviceId, token)
    if (!device) {
      return NextResponse.json(
        { error: 'Device inconnu ou token invalide' },
        { status: 401 }
      )
    }

    // Quota strict : un device au quota ne reçoit plus de tasks pendant 1 h.
    // Les PENDING restent en file pour plus tard ou un autre device.
    const quota = await getIntSetting('sms_quota_per_hour')
    const usage = await getDeviceUsage(deviceId)
    const quotaReached = usage >= quota
    if (quotaReached) {
      console.warn(`quota: ${deviceId} au quota (${usage}/${quota}), polling sans tasks`)
    }

    await expireStalePending()

    // 1. Récupérer les tasks PENDING (jamais assignées)
    const { data: pendingTasks, error: err1 } = await supabaseAdmin
      .from('sms_tasks')
      .select('id, numero_destinataire, message, statut, created_at')
      .eq('statut', 'PENDING')
      .is('device_id', null)
      .order('created_at', { ascending: true })
      .limit(5)

    if (err1) {
      console.error('Erreur Supabase (pending):', err1)
      return NextResponse.json(
        { error: 'Erreur récupération tasks', details: err1.message },
        { status: 500 }
      )
    }

    // 2. Récupérer les tasks SENDING expirées (abandonnées)
    // Anti-doublon : une task SENDING n'est réassignée QUE si son
    // claimed_at dépasse le timeout (> 5 min). Avant ça, elle reste
    // la propriété exclusive du device qui l'a claimée, même si ce
    // device est temporairement hors-ligne (retry côté téléphone).
    // On inclut aussi claimed_at NULL (anciennes tasks sans lease).
    const timeoutThreshold = new Date(Date.now() - SENDING_TIMEOUT_MS).toISOString()
    const { data: expiredTasks, error: err2 } = await supabaseAdmin
      .from('sms_tasks')
      .select('id, numero_destinataire, message, statut, created_at, device_id')
      .eq('statut', 'SENDING')
      .or(`claimed_at.is.null,claimed_at.lt.${timeoutThreshold}`)
      .order('created_at', { ascending: true })
      .limit(5)

    if (err2) {
      console.error('Erreur Supabase (expired):', err2)
      // On ne bloque pas : les PENDING restent utilisables
    }

    // 3. Marquer les tasks expirées comme PENDING pour réassignation
    // Garde-fou atomique : on ne reset QUE les tasks encore en SENDING.
    // Si le device d'origine a confirmé SENT/FAILED entre le SELECT et
    // l'UPDATE (retry réseau qui finit par passer), on ne l'écrase pas.
    const expiredIds = (expiredTasks || []).map(t => t.id)
    if (expiredIds.length > 0) {
      await supabaseAdmin
        .from('sms_tasks')
        .update({
          statut: 'PENDING',
          device_id: null,
          claimed_at: null,
          updated_at: new Date().toISOString(),
        })
        .in('id', expiredIds)
        .eq('statut', 'SENDING')
    }

    // 4. Fusionner les deux listes (vide si quota atteint)
    const allTasks = [
      ...(pendingTasks || []),
      ...(expiredTasks || []).map(t => ({
        id: t.id,
        numero_destinataire: t.numero_destinataire,
        message: t.message,
        statut: 'PENDING',  // désormais réassignable
        created_at: t.created_at,
      })),
    ]
    const visibleTasks = quotaReached ? [] : allTasks.slice(0, 5)  // max 5 par polling

    // 5. Mettre le device en ONLINE — SAUF s'il est désactivé manuellement
    // (sinon le polling réactiverait un device DISABLED quelques secondes après)
    if (device.statut !== 'DISABLED') {
      await supabaseAdmin
        .from('devices')
        .update({
          statut: 'ONLINE',
          derniere_activite: new Date().toISOString(),
        })
        .eq('id', deviceId)
    } else {
      // On met juste à jour l'activité, sans toucher au statut
      await supabaseAdmin
        .from('devices')
        .update({
          derniere_activite: new Date().toISOString(),
        })
        .eq('id', deviceId)
    }

    return NextResponse.json(
      {
        device: { id: device.id, nom: device.nom },
        tasks: visibleTasks,
        count: visibleTasks.length,
        quota_reached: quotaReached,
        quota,
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('Erreur inattendue:', err)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}