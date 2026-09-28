import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'

/**
 * GET /api/demandes — file d'attente (admin).
 * Query : statut=EN_ATTENTE (défaut : tout, 100 max).
 */
export async function GET(request: NextRequest) {
  try {
    const statut = request.nextUrl.searchParams.get('statut')
    let requete = supabaseAdmin
      .from('demandes')
      .select('id, nom, contact, usage_prevu, statut, date_creation, date_traitement')
      .order('date_creation', { ascending: false })
      .limit(100)
    if (statut) {
      requete = requete.eq('statut', statut)
    }
    const { data, error } = await requete
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ demandes: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

/**
 * POST /api/demandes — dépose une demande d'accès (PUBLIC, sans auth).
 * Corps: { nom, contact, usage_prevu }. Anti-spam minimal : champs bornés.
 */
export async function POST(request: NextRequest) {
  try {
    const corps = await request.json().catch(() => null)
    const nom = typeof corps?.nom === 'string' ? corps.nom.trim().slice(0, 80) : ''
    const contact = typeof corps?.contact === 'string' ? corps.contact.trim().slice(0, 80) : ''
    const usagePrevu = typeof corps?.usage_prevu === 'string' ? corps.usage_prevu.trim().slice(0, 500) : ''
    if (!nom || !contact || !usagePrevu) {
      return NextResponse.json(
        { error: 'Les champs "nom", "contact" et "usage_prevu" sont obligatoires' },
        { status: 400 }
      )
    }
    const { data, error } = await supabaseAdmin
      .from('demandes')
      .insert({ nom, contact, usage_prevu: usagePrevu })
      .select('id')
      .single()
    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Erreur création' }, { status: 500 })
    }
    return NextResponse.json(
      { message: 'Demande reçue — réponse sous 24 h', id: data.id },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
