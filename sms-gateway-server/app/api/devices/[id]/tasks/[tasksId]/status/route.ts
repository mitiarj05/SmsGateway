import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { authenticateDevice } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tasksId: string; taskId?: string }> }
) {
  try {
    const raw = await params
    const deviceId = raw.id
    // Le dossier s'appelle [tasksId] : Next.js fournit donc `tasksId`.
    // On accepte aussi `taskId` par tolérance (anciens clients / tests).
    const taskId = raw.tasksId ?? raw.taskId

    if (!taskId) {
      return NextResponse.json(
        { error: 'Paramètre task manquant' },
        { status: 400 }
      )
    }

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

    const body = await request.json()
    const { statut, error_message } = body

    const validStatuses = ['SENDING', 'SENT', 'FAILED']
    if (!statut || !validStatuses.includes(statut)) {
      return NextResponse.json(
        { error: `Statut invalide. Valeurs acceptées : ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Vérifier que la task n'appartient pas déjà à un autre device
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('sms_tasks')
      .select('id, device_id, statut')
      .eq('id', taskId)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Task introuvable' },
        { status: 404 }
      )
    }

    // Anti-doublon / idempotence : si la task est déjà SENT/FAILED...
    // - retry du même statut (cas Piège 3 : le SMS est parti, la 1re
    //   confirmation a été perdue à cause du WiFi, le téléphone retry) → 200 OK
    // - tentative de CHANGER un état final → 409 Conflict
    if (existing.statut === 'SENT' || existing.statut === 'FAILED') {
      if (existing.statut === statut) {
        return NextResponse.json(
          {
            message: 'Statut déjà confirmé (idempotent)',
            task: existing,
          },
          { status: 200 }
        )
      }
      return NextResponse.json(
        {
          error: 'Task déjà finalisée',
          current_status: existing.statut,
        },
        { status: 409 }  // Conflict
      )
    }

    // Anti-doublon : si la task est assignée à un AUTRE device, on refuse
    if (existing.device_id && existing.device_id !== deviceId) {
      return NextResponse.json(
        {
          error: 'Task déjà assignée à un autre device',
          assigned_to: existing.device_id,
        },
        { status: 409 }
      )
    }

    // Construction de la mise à jour
    const updateData: Record<string, unknown> = {
      statut: statut,
      updated_at: new Date().toISOString(),
    }

    if (statut === 'SENDING') {
      updateData.device_id = deviceId
      updateData.claimed_at = new Date().toISOString()
    } else {
      // SENT / FAILED : on garde la traçabilité du device qui a fait le travail.
      // Si la task vient de PENDING (device_id NULL), on l'attribue.
      // Si elle est déjà claimée par ce device, on ne touche pas au lease.
      if (!existing.device_id) {
        updateData.device_id = deviceId
        updateData.claimed_at = new Date().toISOString()
      }
    }

    if (statut === 'FAILED' && error_message) {
      updateData.error_message = error_message
    }

    const { data, error } = await supabaseAdmin
      .from('sms_tasks')
      .update(updateData)
      .eq('id', taskId)
      .select('id, numero_destinataire, message, statut, device_id, claimed_at, updated_at')
      .single()

    if (error) {
      console.error('Erreur Supabase:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour', details: error.message },
        { status: 500 }
      )
    }

    const deviceStatus = statut === 'SENDING' ? 'BUSY' : 'ONLINE'
    await supabaseAdmin
      .from('devices')
      .update({
        statut: deviceStatus,
        derniere_activite: new Date().toISOString(),
      })
      .eq('id', deviceId)

    return NextResponse.json(
      {
        message: 'Statut mis à jour',
        task: data,
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