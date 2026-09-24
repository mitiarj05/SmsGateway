import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { STATUT_TACHE } from '@/lib/statuts'

const CONNUS = [
  STATUT_TACHE.EN_ATTENTE,
  STATUT_TACHE.ASSIGNE,
  STATUT_TACHE.RECLAME,
  STATUT_TACHE.ENVOYE,
  STATUT_TACHE.ECHOUE,
  STATUT_TACHE.PROGRAMME,
];

/**
 * GET /api/tasks/export?statut=ENVOYE,ECHOUE&q=...&from=ISO&to=ISO&limit=1000
 * Exporte l'historique en CSV (séparateur ; + BOM, compatible Excel FR).
 * Protégé par le proxy (admin uniquement).
 */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const limit = Math.min(5000, Math.max(1, Number(params.get('limit')) || 1000))
    const q = (params.get('q') ?? '').trim()
    const from = params.get('from')
    const to = params.get('to')
    const statuts = (params.get('statut') ?? '')
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter((s) => (CONNUS as readonly string[]).includes(s))

    let requete = supabaseAdmin
      .from('taches')
      .select('id, numero_destinataire, contenu, statut, message_erreur, id_appareil, date_creation, date_modification')
      .order('date_creation', { ascending: false })
      .limit(limit)

    if (statuts.length > 0) {
      requete = requete.in('statut', statuts)
    }
    if (q) {
      const echappe = q.replace(/[%_,]/g, (c) => `\\${c}`)
      requete = requete.or(`numero_destinataire.ilike.%${echappe}%,contenu.ilike.%${echappe}%`)
    }
    if (from) {
      const d = new Date(from)
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: 'Paramètre "from" invalide (ISO attendu)' }, { status: 400 })
      }
      requete = requete.gte('date_creation', d.toISOString())
    }
    if (to) {
      const d = new Date(to)
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: 'Paramètre "to" invalide (ISO attendu)' }, { status: 400 })
      }
      requete = requete.lte('date_creation', d.toISOString())
    }

    const { data, error } = await requete
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const cellule = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const entete = 'id;destinataire;message;statut;erreur;appareil_id;cree_le;mis_a_jour\n'
    const lignes = (data ?? [])
      .map((t) => [
        t.id,
        t.numero_destinataire,
        cellule(t.contenu),
        t.statut,
        cellule(t.message_erreur),
        t.id_appareil ?? '',
        t.date_creation,
        t.date_modification,
      ].join(';'))
      .join('\n')

    const horodatage = new Date().toISOString().slice(0, 10)
    return new NextResponse('\uFEFF' + entete + lignes, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="sms-historique-${horodatage}.csv"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
