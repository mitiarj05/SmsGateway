import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

/** DELETE /api/api-clients/[id] — révoque une clé API */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error } = await supabaseAdmin
      .from('api_clients')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Clé révoquée', id })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
