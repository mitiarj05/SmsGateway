import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

/** DELETE /api/tasks/[id] — annule une task PENDING */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data: existing } = await supabaseAdmin
      .from('sms_tasks')
      .select('id, statut')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Task introuvable' }, { status: 404 })
    }
    if (existing.statut !== 'PENDING' && existing.statut !== 'SCHEDULED') {
      return NextResponse.json(
        { error: `Impossible d'annuler une task ${existing.statut}` },
        { status: 409 }
      )
    }

    const { error } = await supabaseAdmin
      .from('sms_tasks')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Task annulée', id })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

/** PATCH /api/tasks/[id] — assignation manuelle (body: { device_id: string | null }) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { device_id } = body

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (device_id) {
      // Vérifier que le device existe
      const { data: dev } = await supabaseAdmin
        .from('devices')
        .select('id')
        .eq('id', device_id)
        .single()
      if (!dev) {
        return NextResponse.json({ error: 'Device introuvable' }, { status: 404 })
      }
      updateData.device_id = device_id
      updateData.statut = 'SENDING'
      updateData.claimed_at = new Date().toISOString()
    } else {
      updateData.device_id = null
      updateData.statut = 'PENDING'
      updateData.claimed_at = null
    }

    const { data, error } = await supabaseAdmin
      .from('sms_tasks')
      .update(updateData)
      .eq('id', id)
      .select('id, numero_destinataire, message, statut, device_id')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Task introuvable' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Task assignée', task: data })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

/** POST /api/tasks/[id]/retry — recrée une task PENDING depuis une FAILED */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('sms_tasks')
      .select('id, numero_destinataire, message, statut, app_client_id')
      .eq('id', id)
      .single()

    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'Task introuvable' }, { status: 404 })
    }
    if (existing.statut !== 'FAILED') {
      return NextResponse.json(
        { error: `Seules les tasks FAILED peuvent être relancées (${existing.statut})` },
        { status: 409 }
      )
    }

    const { data: created, error } = await supabaseAdmin
      .from('sms_tasks')
      .insert({
        numero_destinataire: existing.numero_destinataire,
        message: existing.message,
        statut: 'PENDING',
        app_client_id: existing.app_client_id,
      })
      .select('id, numero_destinataire, message, statut, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Task relancée', task: created }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
