import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

const KNOWN = ['PENDING', 'ASSIGNED', 'SENDING', 'SENT', 'FAILED', 'SCHEDULED'];

/**
 * GET /api/tasks/export?statut=SENT,FAILED&q=...&from=ISO&to=ISO&limit=1000
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
      .filter((s) => KNOWN.includes(s))

    let query = supabaseAdmin
      .from('sms_tasks')
      .select('id, numero_destinataire, message, statut, error_message, device_id, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (statuts.length > 0) {
      query = query.in('statut', statuts)
    }
    if (q) {
      const escaped = q.replace(/[%_,]/g, (c) => `\\${c}`)
      query = query.or(`numero_destinataire.ilike.%${escaped}%,message.ilike.%${escaped}%`)
    }
    if (from) {
      const d = new Date(from)
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: 'Paramètre "from" invalide (ISO attendu)' }, { status: 400 })
      }
      query = query.gte('created_at', d.toISOString())
    }
    if (to) {
      const d = new Date(to)
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: 'Paramètre "to" invalide (ISO attendu)' }, { status: 400 })
      }
      query = query.lte('created_at', d.toISOString())
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const header = 'id;destinataire;message;statut;erreur;device_id;cree_le;mis_a_jour\n'
    const rows = (data ?? [])
      .map((t) => [
        t.id,
        t.numero_destinataire,
        cell(t.message),
        t.statut,
        cell(t.error_message),
        t.device_id ?? '',
        t.created_at,
        t.updated_at,
      ].join(';'))
      .join('\n')

    const stamp = new Date().toISOString().slice(0, 10)
    return new NextResponse('\uFEFF' + header + rows, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="sms-historique-${stamp}.csv"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
