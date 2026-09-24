import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-serveur'

/** Contrat JSON inchangé : created_at mappé depuis date_creation. */
const versContrat = (c: { id: string; nom: string; cle_api: string; date_creation: string }) => ({
  id: c.id,
  nom: c.nom,
  cle_api: c.cle_api,
  created_at: c.date_creation,
})

/** GET /api/api-clients — liste les clés API */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('applications')
      .select('id, nom, cle_api, date_creation')
      .order('date_creation', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Masquer les clés (garder 12 premiers caractères)
    const masquees = (data ?? []).map((c) => ({
      ...versContrat(c),
      cle_api: `${c.cle_api.substring(0, 12)}...`,
    }))

    return NextResponse.json({ clients: masquees })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

/** POST /api/api-clients — crée une nouvelle clé API (corps: { nom }) */
export async function POST(request: NextRequest) {
  try {
    const corps = await request.json()
    const { nom } = corps

    if (!nom || typeof nom !== 'string' || nom.trim().length === 0) {
      return NextResponse.json({ error: 'Le champ "nom" est obligatoire' }, { status: 400 })
    }

    const cle_api = `cle_${randomBytes(16).toString('hex')}`

    const { data, error } = await supabaseAdmin
      .from('applications')
      .insert({ nom: nom.trim(), cle_api })
      .select('id, nom, cle_api, date_creation')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Retourne la clé complète UNE SEULE FOIS (à copier immédiatement)
    return NextResponse.json({ message: 'Clé créée', client: versContrat(data) }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
