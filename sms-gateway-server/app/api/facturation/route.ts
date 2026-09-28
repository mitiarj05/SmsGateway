import { NextRequest, NextResponse } from 'next/server'
import { lireFacturation, moisActuel } from '@/lib/facturation'

/**
 * GET /api/facturation?mois=AAAA-MM — consommation par client (admin).
 * Recalcule le mois demandé avant lecture (défaut : mois courant).
 */
export async function GET(request: NextRequest) {
  try {
    const brut = request.nextUrl.searchParams.get('mois') ?? moisActuel()
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(brut)) {
      return NextResponse.json(
        { error: 'Paramètre "mois" invalide (format AAAA-MM attendu)' },
        { status: 400 }
      )
    }
    const lignes = await lireFacturation(brut)
    const totaux = lignes.reduce(
      (acc, l) => ({
        total_facture: acc.total_facture + l.total_facture,
        sms_envoyes: acc.sms_envoyes + l.sms_envoyes,
        sms_recus: acc.sms_recus + l.sms_recus,
        clics: acc.clics + l.clics,
        echecs: acc.echecs + l.echecs,
      }),
      { total_facture: 0, sms_envoyes: 0, sms_recus: 0, clics: 0, echecs: 0 }
    )
    return NextResponse.json({ mois: brut, lignes, totaux })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
