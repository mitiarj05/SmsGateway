import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('sms_tasks')
      .select('id, numero_destinataire, message, statut, device_id, error_message, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tasks: data })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
