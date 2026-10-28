import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-serveur'

/** Contrat JSON inchangé : created_at mappé depuis date_creation. */
const versContrat = (c: {
  id: string; nom: string; cle_api: string; date_creation: string
  url_application?: string | null; secret_signature?: string | null
  evenements_souscrits?: string[] | null; evenements_actifs?: boolean | null
  suspendu?: boolean | null
}) => ({
  id: c.id,
  nom: c.nom,
  cle_api: c.cle_api,
  created_at: c.date_creation,
  url_application: c.url_application ?? null,
  evenements_souscrits: c.evenements_souscrits ?? [],
  evenements_actifs: c.evenements_actifs ?? true,
  secret_defini: !!c.secret_signature,
  suspendu: c.suspendu === true,
})

/** GET /api/api-clients — liste les clés API */
export async function GET() {
  try {
    let lignes: any[] | null = null
    const { data, error } = await supabaseAdmin
      .from('client')
      .select('id, nom, cle_api, date_creation, url_application, secret_signature, evenements_souscrits, evenements_actifs, suspendu')
      .order('date_creation', { ascending: false })
    if (error) {
      // Pré-migration (colonne suspendu absente) : repli sans la colonne.
      if (/suspendu/i.test(error.message)) {
        const repli = await supabaseAdmin
          .from('client')
          .select('id, nom, cle_api, date_creation, url_application, secret_signature, evenements_souscrits, evenements_actifs')
          .order('date_creation', { ascending: false })
        if (repli.error) {
          return NextResponse.json({ error: repli.error.message }, { status: 500 })
        }
        lignes = (repli.data ?? []).map((c) => ({ ...c, suspendu: false }))
      } else {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      lignes = data ?? []
    }

    // Masquer les clés (garder 12 premiers caractères)
    const masquees = (lignes ?? []).map((c) => ({
      ...versContrat(c),
      cle_api: `${c.cle_api.substring(0, 12)}...`,
    }))

    return NextResponse.json({ clients: masquees })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

/** POST /api/api-clients — pré-crée un espace client (corps: { nom, email? }).
 * Quota illimité par défaut. Si un e-mail est fourni, le client s'inscrit
 * avec cet e-mail et retrouve son espace prêt (liaison automatique). */
export async function POST(request: NextRequest) {
  try {
    const corps = await request.json()
    const { nom } = corps
    const emailBrut = typeof corps?.email === 'string' ? corps.email.trim().toLowerCase() : ''

    if (!nom || typeof nom !== 'string' || nom.trim().length === 0) {
      return NextResponse.json({ error: 'Le champ "nom" est obligatoire' }, { status: 400 })
    }
    if (emailBrut && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailBrut)) {
      return NextResponse.json({ error: 'Adresse e-mail invalide' }, { status: 400 })
    }

    const cle_api = `cle_${randomBytes(16).toString('hex')}`

    const { data, error } = await supabaseAdmin
      .from('client')
      .insert({ nom: nom.trim(), cle_api, ...(emailBrut ? { email: emailBrut } : {}) })
      .select('id, nom, cle_api, date_creation, url_application, secret_signature, evenements_souscrits, evenements_actifs')
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
