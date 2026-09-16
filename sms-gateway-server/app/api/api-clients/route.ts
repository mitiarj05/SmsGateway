import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-server'

/** GET /api/api-clients — liste les clés API */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('api_clients')
      .select('id, nom, cle_api, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Masquer les clés (garder 12 premiers caractères)
    const masked = (data ?? []).map((c) => ({
      ...c,
      cle_api: `${c.cle_api.substring(0, 12)}...`,
    }))

    return NextResponse.json({ clients: masked })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

/** POST /api/api-clients — crée une nouvelle clé API (body: { nom }) */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nom } = body

    if (!nom || typeof nom !== 'string' || nom.trim().length === 0) {
      return NextResponse.json({ error: 'Le champ "nom" est obligatoire' }, { status: 400 })
    }

    const cle_api = `cle_${randomBytes(16).toString('hex')}`

    const { data, error } = await supabaseAdmin
      .from('api_clients')
      .insert({ nom: nom.trim(), cle_api })
      .select('id, nom, cle_api, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Retourne la clé complète UNE SEULE FOIS (à copier immédiatement)
    return NextResponse.json({ message: 'Clé créée', client: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
